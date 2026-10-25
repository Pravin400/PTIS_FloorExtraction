'use client';

import { useCallback, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  createUlbMasterAction,
  updateUlbMasterAction,
} from '@/app/[locale]/configuration-settings/ulb-configuration/actions';
import { resolveUlbConfigurationErrorMessage } from '@/lib/utils/ulb-configuration-error';
import type {
  ULBConfigurationFormData,
  UlbConfigurationMaster,
  UlbSectionKey,
} from '@/types/ulbconfig-master.types';

interface UseUlbConfigurationSaveOptions {
  formData: ULBConfigurationFormData;
  ulbMasterId?: number;
  onSaved?: (ulb: UlbConfigurationMaster) => void;
}

export function useUlbConfigurationSave({
  formData,
  ulbMasterId,
  onSaved,
}: UseUlbConfigurationSaveOptions) {
  const router = useRouter();
  const t = useTranslations('ulb_configuration');
  const [, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);

  const save = useCallback(
    async (section?: UlbSectionKey, suppressToast = false): Promise<boolean> => {
      if (isSavingRef.current) return false;

      isSavingRef.current = true;
      setIsSaving(true);

      try {
        const response =
          ulbMasterId && ulbMasterId > 0
            ? await updateUlbMasterAction(ulbMasterId, formData, section)
            : await createUlbMasterAction(formData, section);

        if (!response.success) {
          toast.error(
            resolveUlbConfigurationErrorMessage(response.error, t, t('messages.error'))
          );
          return false;
        }

        if (response.data) {
          onSaved?.(response.data);
        }

        const fallbackMessage = ulbMasterId
          ? t('messages.updateSuccess')
          : t('messages.createSuccess');

        if (!suppressToast) {
          toast.success(response.message || fallbackMessage);
        }

        startTransition(() => {
          router.refresh();
        });

        return true;
      } catch (error) {
        toast.error(
          resolveUlbConfigurationErrorMessage(
            error instanceof Error ? error.message : String(error),
            t,
            t('messages.error')
          )
        );
        return false;
      } finally {
        isSavingRef.current = false;
        setIsSaving(false);
      }
    },
    [formData, onSaved, router, t, ulbMasterId]
  );

  return { save, isSaving };
}
