import 'server-only';
import { getTranslations } from 'next-intl/server';
import { verifyServerActionAccess } from '@/lib/utils/server-access-guard';
import { revalidateModulePaths } from '@/lib/server/revalidation-helper';
import { logger } from '@/lib/utils/server-logger';
import type { ApiResponse } from '@/types/common.types';

export interface ActionFormState<TData = unknown> {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  data?: TData;
}

export interface CreateMasterActionConfig<TInput, TDto, TRecord> {
  screenCode: string;
  namespace: string;
  basePath: string;
  validate: (input: TInput, t: (key: string, values?: Record<string, string | number>) => string) => { isValid: boolean; errors: Record<string, string[]>; data?: TDto };
  createService: (dto: TDto) => Promise<ApiResponse<TRecord>>;
  updateService?: (id: number, dto: TDto) => Promise<ApiResponse<TRecord>>;
  deleteService?: (id: number) => Promise<ApiResponse<void>>;
}

function getTranslatedError(
  err: string | undefined,
  t: (key: string) => string,
  defaultKey: string
): string {
  if (!err) return t(defaultKey);
  if (err.includes('.') || err.startsWith('errors.')) {
    try {
      const translated = t(err);
      if (translated && translated !== err) return translated;
    } catch {}
  }
  return err;
}

export function createMasterActionHandlers<TInput, TDto, TRecord>(
  config: CreateMasterActionConfig<TInput, TDto, TRecord>
) {
  async function createAction(
    _prevState: ActionFormState<TRecord>,
    input: TInput
  ): Promise<ActionFormState<TRecord>> {
    const t = await getTranslations(config.namespace);
    const hasAccess = await verifyServerActionAccess(config.screenCode, 'edit');
    if (!hasAccess) {
      return {
        success: false,
        message: t('errors.forbidden') || t('errors.unauthorized') || 'Access denied',
      };
    }

    const validation = config.validate(input, (key, values) => t(key, values));
    if (!validation.isValid || !validation.data) {
      return {
        success: false,
        message: t('validation.validationFailed') || t('errors.validationFailed'),
        errors: validation.errors,
      };
    }

    try {
      const response = await config.createService(validation.data);
      if (response.success && response.data) {
        revalidateModulePaths(config.basePath);
        return {
          success: true,
          message: t('messages.createSuccess'),
          data: response.data,
        };
      }

      logger.warn(`${config.namespace} createAction backend failure`, {
        statusCode: response.statusCode,
        error: response.error,
      });

      return {
        success: false,
        message: getTranslatedError(response.error, t, 'errors.createFailed'),
      };
    } catch (err: unknown) {
      logger.error(`Error in ${config.namespace} createAction`, {}, err);
      return {
        success: false,
        message: err instanceof Error ? err.message : t('errors.createFailed'),
      };
    }
  }

  async function updateAction(
    id: number,
    _prevState: ActionFormState<TRecord>,
    input: TInput
  ): Promise<ActionFormState<TRecord>> {
    const t = await getTranslations(config.namespace);
    const hasAccess = await verifyServerActionAccess(config.screenCode, 'edit');
    if (!hasAccess) {
      return {
        success: false,
        message: t('errors.forbidden') || t('errors.unauthorized') || 'Access denied',
      };
    }

    if (!config.updateService) {
      return {
        success: false,
        message: t('errors.noMutationAction'),
      };
    }

    const validation = config.validate(input, (key, values) => t(key, values));
    if (!validation.isValid || !validation.data) {
      return {
        success: false,
        message: t('validation.validationFailed') || t('errors.validationFailed'),
        errors: validation.errors,
      };
    }

    try {
      const response = await config.updateService(id, validation.data);
      if (response.success && response.data) {
        revalidateModulePaths(config.basePath);
        return {
          success: true,
          message: t('messages.updateSuccess'),
          data: response.data,
        };
      }

      logger.warn(`${config.namespace} updateAction backend failure`, {
        id,
        statusCode: response.statusCode,
        error: response.error,
      });

      return {
        success: false,
        message: getTranslatedError(response.error, t, 'errors.updateFailed'),
      };
    } catch (err: unknown) {
      logger.error(`Error in ${config.namespace} updateAction`, { id }, err);
      return {
        success: false,
        message: err instanceof Error ? err.message : t('errors.updateFailed'),
      };
    }
  }

  async function deleteAction(
    id: number
  ): Promise<{ success: boolean; message?: string; statusCode?: number }> {
    const t = await getTranslations(config.namespace);
    const hasAccess = await verifyServerActionAccess(config.screenCode, 'delete');
    if (!hasAccess) {
      return {
        success: false,
        message: t('errors.noDeleteAction') || 'Unauthorized action',
      };
    }

    if (!config.deleteService) {
      return {
        success: false,
        message: t('errors.noDeleteAction'),
      };
    }

    try {
      const response = await config.deleteService(Number(id));
      if (response.success) {
        revalidateModulePaths(config.basePath);
        return {
          success: true,
          message: t('messages.deleteSuccess'),
        };
      }

      logger.warn(`${config.namespace} deleteAction backend failure`, {
        id,
        statusCode: response.statusCode,
        error: response.error,
      });

      return {
        success: false,
        message: getTranslatedError(response.error, t, 'errors.deleteFailed'),
        statusCode: response.statusCode,
      };
    } catch (err: unknown) {
      logger.error(`Error in ${config.namespace} deleteAction`, { id }, err);
      return {
        success: false,
        message: err instanceof Error ? err.message : t('errors.deleteFailed'),
      };
    }
  }

  return {
    createAction,
    updateAction,
    deleteAction,
  };
}
