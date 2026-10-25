import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { locales } from '@/i18n/config';
import { ApiError } from '@/lib/utils/api';
import { getUserIdFromCookies } from '@/lib/utils/auth-session';
import { logger } from '@/lib/utils/logger';
import type { ApiResponse } from '@/types/common.types';
import type { ModuleMasterFormData } from '@/types/moduleMaster.types';
import {
  validateModuleMasterDto,
  normalizeModuleData,
} from '@/lib/api/configuration-settings/module-master/module-master.validator';

export const MODULE_MASTER_PATH = '/configuration-settings/module-master';
export const DEPARTMENT_ACTIVATION_PATH = '/configuration-settings/department-activation';

export type ValidationResult =
  | {
      isValid: true;
      normalizedData: ReturnType<typeof normalizeModuleData>;
    }
  | {
      isValid: false;
      validationCode: string;
    };

const MODULE_API_ERROR_MAP: Record<string, string> = {
  ModuleCode_Already_Exists: 'validation.moduleCodeExists',
  ModuleName_Already_Exists: 'validation.moduleNameExists',
  ModuleName_Required: 'validation.moduleNameRequired',
  ModuleCode_Required: 'validation.moduleCodeRequired',
  DepartmentId_Required: 'validation.departmentIdRequired',
  'Unauthorized: Token expired or invalid': 'messages.unauthorizedToken',
  'An error occurred while processing your request.': 'messages.processingError',
};

export function parseApiError(
  responseText?: string,
  defaultKey = 'messages.errorOccurred'
): string {
  if (!responseText) return defaultKey;

  const cleanText = responseText.trim().replace(/^["']|["']$/g, '');
  if (MODULE_API_ERROR_MAP[cleanText]) {
    return MODULE_API_ERROR_MAP[cleanText];
  }

  try {
    const parsed = JSON.parse(responseText) as Record<string, unknown>;

    if (parsed.errors && typeof parsed.errors === 'object') {
      const [, messages] = Object.entries(parsed.errors)[0] ?? [];
      let code: string | undefined;

      if (typeof messages === 'string') code = messages;
      else if (Array.isArray(messages) && typeof messages[0] === 'string') code = messages[0];

      if (code) {
        if (MODULE_API_ERROR_MAP[code]) return MODULE_API_ERROR_MAP[code];
        return code;
      }
    }

    const flat = (parsed.message || parsed.error || parsed.code) as string | undefined;
    if (typeof flat === 'string') {
      if (MODULE_API_ERROR_MAP[flat]) return MODULE_API_ERROR_MAP[flat];
      return flat;
    }
  } catch {}

  return defaultKey;
}

export function handleActionError<T = void>(
  error: unknown,
  fallbackMessage: string
): ApiResponse<T> {
  if (error instanceof ApiError) {
    logger.error('[ModuleMaster] ApiError encountered', {
      statusCode: error.statusCode,
      message: error.message,
    });

    const parsed = parseApiError(error.responseText, fallbackMessage);
    let resolvedError = parsed;

    if (parsed === fallbackMessage && error.responseText) {
      if (error.responseText.trim().startsWith('{')) {
        try {
          const json = JSON.parse(error.responseText);
          resolvedError = json.message || json.title || fallbackMessage;
        } catch {
          resolvedError = fallbackMessage;
        }
      } else {
        const cleanText = error.responseText.trim().replace(/^["']|["']$/g, '');
        if (MODULE_API_ERROR_MAP[cleanText]) {
          resolvedError = MODULE_API_ERROR_MAP[cleanText];
        } else {
          resolvedError = error.responseText;
        }
      }
    }

    return {
      success: false,
      error: resolvedError,
      statusCode: error.statusCode,
    };
  }

  logger.error('[ModuleMaster] Unexpected error in action handler', {
    error: error instanceof Error ? error : new Error(String(error)),
  });

  return {
    success: false,
    error: error instanceof Error ? error.message : fallbackMessage,
  };
}

export function validateAndNormalize(data: Partial<ModuleMasterFormData>): ValidationResult {
  const validationCode = validateModuleMasterDto(data);

  if (validationCode) {
    return { isValid: false, validationCode };
  }

  return { isValid: true, normalizedData: normalizeModuleData(data) };
}

export function revalidateModuleMaster(): void {
  for (const locale of locales) {
    revalidatePath(`/${locale}${MODULE_MASTER_PATH}`, 'page');
    revalidatePath(`/${locale}${DEPARTMENT_ACTIVATION_PATH}`, 'page');
  }
}

export async function resolveUserId(): Promise<number | null> {
  const cookieStore = await cookies();
  return getUserIdFromCookies(cookieStore);
}
