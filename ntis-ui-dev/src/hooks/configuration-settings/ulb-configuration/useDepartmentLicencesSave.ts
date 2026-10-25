'use client';

import { useCallback, useRef, useState, useTransition, type Dispatch, type SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { saveDepartmentLicencesAction } from '@/app/[locale]/configuration-settings/ulb-configuration/actions';
import { parseDurationFromApi } from '@/lib/api/configuration-settings/ulb-configuration/department-licence.mapper';
import {
  findInvalidEnabledDepartment,
  getDepartmentLicencesToSave,
} from '@/lib/api/configuration-settings/ulb-configuration/department-licence.validator';
import { resolveUlbConfigurationErrorMessage } from '@/lib/utils/ulb-configuration-error';
import type { DepartmentLicense } from '@/types/ulbconfig-master.types';

interface UseDepartmentLicencesSaveOptions {
  departments: DepartmentLicense[];
  setDepartments: Dispatch<SetStateAction<DepartmentLicense[]>>;
  setInitialDepartments?: Dispatch<SetStateAction<DepartmentLicense[]>>;
}

/** Persists department licence cards via the ULB server action (no direct API client usage). */
export function useDepartmentLicencesSave({
  departments,
  setDepartments,
  setInitialDepartments,
}: UseDepartmentLicencesSaveOptions) {
  const router = useRouter();
  const t = useTranslations('ulb_configuration');
  const [, startTransition] = useTransition();
  const [isSavingLicences, setIsSavingLicences] = useState(false);
  const isSavingLicencesRef = useRef(false);

  const saveLicences = useCallback(async (suppressToast = false): Promise<boolean> => {
    if (isSavingLicencesRef.current) return false;

    const toSave = getDepartmentLicencesToSave(departments);
    if (toSave.length === 0) {
      toast.error(t('messages.noDepartments'));
      return false;
    }

    if (findInvalidEnabledDepartment(toSave)) {
      toast.error(t('messages.validation'));
      return false;
    }

    isSavingLicencesRef.current = true;
    setIsSavingLicences(true);

    try {
      const response = await saveDepartmentLicencesAction(departments);

      if (response.data?.length) {
        setDepartments((prev) => {
          const next = prev.map((dept) => {
            const saved = response.data!.find(
              (item) =>
                Number(item.departmentId ?? item.departmentMasterId) ===
                Number(dept.departmentMasterId)
            );
            if (!saved) return dept;
            return {
              ...dept,
              departmentLicenceDetailsId: saved.departmentLicenceDetailsId,
              startDate: saved.licenceStartDate
                ? saved.licenceStartDate.split('T')[0]
                : dept.startDate,
              duration: saved.licenceDuration
                ? parseDurationFromApi(saved.licenceDuration)
                : dept.duration,
              endDate: saved.licenceEndDate ? saved.licenceEndDate.split('T')[0] : dept.endDate,
            };
          });
          if (setInitialDepartments) setInitialDepartments(next);
          return next;
        });
      }
      if (!response.success) {
        toast.error(
          resolveUlbConfigurationErrorMessage(response.error, t, t('messages.error'))
        );
        if (response.data?.length) {
          startTransition(() => {
            router.refresh();
          });
        }
        return false;
      }

      if (!suppressToast) {
        toast.success(response.message || t('messages.success'));
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
      isSavingLicencesRef.current = false;
      setIsSavingLicences(false);
    }
  }, [departments, router, setDepartments, setInitialDepartments, t]);
  return { saveLicences, isSavingLicences };
}
