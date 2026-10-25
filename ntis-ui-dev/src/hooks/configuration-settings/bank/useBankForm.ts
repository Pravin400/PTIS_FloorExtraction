'use client';

import { useCallback, useEffect, useMemo, useRef, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { getCleanErrorMessage } from '@/lib/utils/backend-error-detection';
import { useConfirm } from '@/components/common/ConfirmProvider';
import {
  createBankAction,
  updateBankAction,
} from '@/app/[locale]/configuration-settings/bank-master/actions';
import type { BankMasterData } from '@/types/bank-master.types';
import {
  validateBankMaster,
  normalizeBankData,
  getValidationCount,
} from '@/lib/api/configuration-settings/bank/bank-master.validator';
import { useBankFormState } from './useBankFormState';
import { useBankFormHandlers } from './useBankFormHandlers';

const REDIRECT_DELAY_MS = 400;
const BANK_MASTER_LIST_PATH = '/configuration-settings/bank-master';

interface UseBankFormProps {
  id: string | null;
  initialData?: BankMasterData;
}

export function useBankForm({ id, initialData }: UseBankFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const [, startTransition] = useTransition();

  const t = useTranslations('bankMaster');
  const tCommon = useTranslations('common');
  const { confirm } = useConfirm();

  const bankId = id?.trim() || null;
  const isEdit = Boolean(bankId);

  const { formData, setFormData, errors, setErrors, isSubmitting, setIsSubmitting, open, setOpen } =
    useBankFormState(initialData);

  const { handleChange, handleBlur, handleToggleStatus } = useBankFormHandlers({
    formData,
    setFormData,
    setErrors,
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const isSubmittingRef = useRef(false);

  const listRoute = useMemo(() => `/${locale}${BANK_MASTER_LIST_PATH}`, [locale]);

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
          bankCode: initialData.bankCode ?? '',
          bankName: initialData.bankName ?? '',
          branchName: initialData.branchName ?? '',
          ifscCode: initialData.ifscCode ?? '',
          address: initialData.address ?? '',
          city: initialData.city ?? '',
          state: initialData.state ?? '',
          pincode: initialData.pincode ?? '',
          isActive: initialData.isActive,
        }
      : {
          bankCode: '',
          bankName: '',
          branchName: '',
          ifscCode: '',
          address: '',
          city: '',
          state: '',
          pincode: '',
          isActive: true,
        };

    return Object.keys(base).some((key) => {
      const k = key as keyof typeof base;
      const currentVal = formData[k];
      const initialVal = base[k];

      if (typeof currentVal === 'boolean' || typeof initialVal === 'boolean') {
        return Boolean(currentVal) !== Boolean(initialVal);
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
      if (isSubmitting || isSubmittingRef.current) {
        e.preventDefault();
        return;
      }

      e.preventDefault();

      const normalizedData = normalizeBankData(formData);
      const validationErrors = validateBankMaster(normalizedData);

      setErrors(validationErrors);

      if (Object.keys(validationErrors).length > 0) {
        return;
      }

      isSubmittingRef.current = true;
      setIsSubmitting(true);

      try {
        const response = bankId
          ? await updateBankAction(bankId, normalizedData)
          : await createBankAction(normalizedData);

        if (!isMountedRef.current) {
          return;
        }

        if (!response.success) {
          let errorMsg = response.error;
          if (errorMsg) {
            if (errorMsg.startsWith('validation.') || errorMsg.startsWith('messages.')) {
              errorMsg = t(errorMsg, {
                count: getValidationCount(errorMsg),
              });
            } else {
              errorMsg = getCleanErrorMessage(errorMsg);
            }
          } else {
            errorMsg = t('messages.errorOccurred');
          }

          toast.error(errorMsg);

          if (response.error) {
            const err = response.error.toLowerCase();
            const rawErrorCode = response.error.split('.').pop() as never;
            if (err.includes('bankcode')) {
              setErrors((prev) => ({ ...prev, bankCode: rawErrorCode }));
            } else if (err.includes('bankname')) {
              setErrors((prev) => ({ ...prev, bankName: rawErrorCode }));
            } else if (err.includes('ifsc')) {
              setErrors((prev) => ({ ...prev, ifscCode: rawErrorCode }));
            } else if (err.includes('pincode')) {
              setErrors((prev) => ({ ...prev, pincode: rawErrorCode }));
            }
          }

          return;
        }

        toast.success(t(isEdit ? 'messages.updateSuccess' : 'messages.createSuccess'));

        startTransition(() => {
          router.refresh();
          closeAndRoute();
        });
      } catch (error) {
        if (isMountedRef.current) {
          toast.error(getCleanErrorMessage(error, t('messages.errorOccurred')));
        }
      } finally {
        isSubmittingRef.current = false;

        if (isMountedRef.current) {
          setIsSubmitting(false);
        }
      }
    },
    [bankId, closeAndRoute, formData, isEdit, isSubmitting, router, setErrors, setIsSubmitting, t]
  );

  return {
    formData,
    errors,
    isSubmitting,
    open,
    setOpen,
    handleChange,
    handleBlur,
    handleSubmit,
    handleToggleStatus,
    handleCancel,
    t,
    tCommon,
    isEdit,
  };
}
