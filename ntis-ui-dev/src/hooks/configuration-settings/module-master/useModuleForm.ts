'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import {
  createModuleMasterAction,
  updateModuleMasterAction,
  getModuleMastersSummaryAction,
} from '@/app/[locale]/configuration-settings/module-master/actions';
import type { ModuleMaster } from '@/types/moduleMaster.types';
import {
  validateModuleMaster,
  normalizeModuleData,
  getValidationCount,
  checkModuleDuplicates,
} from '@/lib/api/configuration-settings/module-master/module-master.validator';
import { useConfirm } from '@/components/common/ConfirmProvider';
import { useActivePagePermissions } from '@/hooks/useActivePagePermissions';
import { useModuleFormState } from './useModuleFormState';
import { useModuleFormHandlers } from './useModuleFormHandlers';

const REDIRECT_DELAY_MS = 400;
const MODULE_MASTER_LIST_PATH = '/configuration-settings/module-master';

interface UseModuleFormProps {
  id: number | null;
  initialData?: ModuleMaster;
  initialExistingModules?: ModuleMaster[];
}

export function useModuleForm({ id, initialData, initialExistingModules }: UseModuleFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const [, startTransition] = useTransition();

  const t = useTranslations('moduleMaster');
  const tCommon = useTranslations('common');
  const { confirm } = useConfirm();

  const { canEdit, haveFullAccess } = useActivePagePermissions();
  const hasWriteAccess = canEdit || haveFullAccess;

  const moduleId = id || null;
  const isEdit = Boolean(moduleId);

  const [existingModules, setExistingModules] = useState<ModuleMaster[]>(
    initialExistingModules || []
  );

  useEffect(() => {
    if (!hasWriteAccess) {
      toast.error(
        tCommon('errors.unauthorized') || 'You do not have permission to perform this action.'
      );
      router.push(`/${locale}/configuration-settings/module-master`);
    }
  }, [hasWriteAccess, router, locale, tCommon]);

  useEffect(() => {
    if (initialExistingModules !== undefined) {
      return;
    }

    getModuleMastersSummaryAction()
      .then((res) => {
        if (res.success && res.data) {
          setExistingModules(res.data);
        }
      })
      .catch((error) => {
        console.error('Failed to fetch existing modules:', error);
      });
  }, [initialExistingModules]);

  const { formData, setFormData, errors, setErrors, isSubmitting, setIsSubmitting, open, setOpen } =
    useModuleFormState(initialData);

  const { handleChange, handleSelectChange, handleBlur, handleToggleStatus } =
    useModuleFormHandlers({
      formData,
      setFormData,
      setErrors,
      existingModules,
      isEdit,
      moduleId,
    });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const isSubmittingRef = useRef(false);

  const listRoute = useMemo(() => `/${locale}${MODULE_MASTER_LIST_PATH}`, [locale]);

  const clearNavigationTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const closeAndRoute = useCallback(() => {
    setOpen(false);
    clearNavigationTimeout();

    timeoutRef.current = setTimeout(() => {
      router.push(listRoute);
      timeoutRef.current = null;
    }, REDIRECT_DELAY_MS);
  }, [clearNavigationTimeout, listRoute, router, setOpen]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      clearNavigationTimeout();
    };
  }, [clearNavigationTimeout]);

  const hasChanges = useCallback(() => {
    const base = initialData
      ? {
          departmentId: initialData.departmentId ?? 0,
          moduleCode: initialData.moduleCode ?? '',
          moduleName: initialData.moduleName ?? '',
          moduleNameLocal: initialData.moduleNameLocal ?? '',
          moduleIcon: initialData.moduleIcon ?? '',
          moduleLabel: initialData.moduleLabel ?? '',
          moduleDescription: initialData.moduleDescription ?? '',
          isActive: initialData.isActive,
        }
      : {
          departmentId: 0,
          moduleCode: '',
          moduleName: '',
          moduleNameLocal: '',
          moduleIcon: '',
          moduleLabel: '',
          moduleDescription: '',
          isActive: true,
        };

    return Object.keys(base).some((key) => {
      const k = key as keyof typeof base;
      const currentVal = formData[k];
      const initialVal = base[k];

      if (typeof currentVal === 'boolean' || typeof initialVal === 'boolean') {
        return Boolean(currentVal) !== Boolean(initialVal);
      }

      if (typeof currentVal === 'number' || typeof initialVal === 'number') {
        return Number(currentVal) !== Number(initialVal);
      }

      const normCurrent =
        currentVal === undefined || currentVal === null ? '' : String(currentVal).trim();
      const normInitial =
        initialVal === undefined || initialVal === null ? '' : String(initialVal).trim();

      return normCurrent !== normInitial;
    });
  }, [formData, initialData]);

  const handleCancel = useCallback(() => {
    if (hasChanges()) {
      confirm({
        variant: 'warning',
        title: tCommon('confirm.warning.title') || 'Warning',
        description: tCommon('messages.unsavedChanges') || 'You have unsaved changes',
        confirmText: tCommon('confirm.warning.confirm') || 'Proceed',
        cancelText: tCommon('confirm.cancel') || 'Cancel',
        onConfirm: () => {
          closeAndRoute();
        },
      });
    } else {
      closeAndRoute();
    }
  }, [hasChanges, confirm, closeAndRoute, tCommon]);

  const handleSubmit = useCallback(
    async (e: FormEvent): Promise<void> => {
      e.preventDefault();

      if (!hasWriteAccess) {
        toast.error(
          tCommon('errors.unauthorized') || 'You do not have permission to perform this action.'
        );
        return;
      }

      if (isSubmitting || isSubmittingRef.current) {
        return;
      }

      const normalizedData = normalizeModuleData(formData);
      const validationErrors = validateModuleMaster(normalizedData);

      // Perform duplicate checks using shared helper
      const { codeExists, nameExists } = checkModuleDuplicates({
        moduleCode: normalizedData.moduleCode,
        moduleName: normalizedData.moduleName,
        existingModules,
        isEdit,
        moduleId,
      });

      if (codeExists) {
        validationErrors.moduleCode = 'moduleCodeExists';
      }
      if (nameExists) {
        validationErrors.moduleName = 'moduleNameExists';
      }

      setErrors(validationErrors);

      if (Object.keys(validationErrors).length > 0) {
        return;
      }

      isSubmittingRef.current = true;
      setIsSubmitting(true);

      try {
        const response = moduleId
          ? await updateModuleMasterAction(moduleId, normalizedData)
          : await createModuleMasterAction(normalizedData);

        if (!isMountedRef.current) {
          return;
        }

        if (!response.success) {
          const errorKey = response.error || 'messages.errorOccurred';
          const isTranslationKey =
            errorKey.includes('.') &&
            !errorKey.trim().startsWith('{') &&
            !errorKey.includes(' ') &&
            !errorKey.includes('"');
          const errorMessage = isTranslationKey
            ? t(errorKey, {
                count: response.error ? getValidationCount(response.error) : 0,
              })
            : errorKey;

          toast.error(errorMessage);

          return;
        }

        toast.success(t(isEdit ? 'messages.updateSuccess' : 'messages.createSuccess'));

        startTransition(() => {
          router.refresh();
          closeAndRoute();
        });
      } catch {
        if (isMountedRef.current) {
          toast.error(t('messages.errorOccurred'));
        }
      } finally {
        isSubmittingRef.current = false;

        if (isMountedRef.current) {
          setIsSubmitting(false);
        }
      }
    },
    [
      moduleId,
      closeAndRoute,
      formData,
      isEdit,
      isSubmitting,
      router,
      setErrors,
      setIsSubmitting,
      t,
      existingModules,
      hasWriteAccess,
      tCommon,
    ]
  );

  return {
    formData,
    errors,
    isSubmitting,
    open,
    setOpen,
    handleChange,
    handleSelectChange,
    handleBlur,
    handleSubmit,
    handleToggleStatus,
    handleCancel,
    t,
    tCommon,
    isEdit,
    hasWriteAccess,
  };
}
