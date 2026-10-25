'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { parseDurationFromApi } from '@/lib/api/configuration-settings/ulb-configuration/department-licence.mapper';
import { calculateLicenseEndDate, calculateRenewalAlerts, calculateDurationInMonths } from '@/lib/utils/ulb-configuration.utils';
import { useDepartmentLicencesSave } from '@/hooks/configuration-settings/ulb-configuration/useDepartmentLicencesSave';
import type {
  Department,
  DepartmentLicense,
  DepartmentLicenceDetails,
  UlbMasterLicenseSnapshot,
} from '@/types/ulbconfig-master.types';

function isLicenseExpired(endDateStr: string): boolean {
  if (!endDateStr) return false;
  const parts = endDateStr.split('-');
  if (parts.length !== 3 || parts[0].length !== 4 || parts[1].length !== 2 || parts[2].length !== 2) {
    return false;
  }

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  return endDateStr < todayStr;
}

function toDepartmentLicense(
  dept: Department,
  licences: DepartmentLicenceDetails[]
): DepartmentLicense {
  const deptId = dept.departmentId ?? dept.departmentMasterId;
  const existing = licences.find(
    (l) => Number(l.departmentId ?? l.departmentMasterId) === Number(deptId)
  );
  const endDate = existing?.licenceEndDate ? existing.licenceEndDate.split('T')[0] : '';
  const expired = isLicenseExpired(endDate);
  const isMasterActive = dept.isActive !== false;
  const enabled = (expired || !isMasterActive) ? false : (existing ? !!(existing.isActive ?? existing.isEnabled) : false);

  return {
    id: dept.departmentCode || String(deptId ?? '') || dept.departmentName.toLowerCase().replace(/\s+/g, '-'),
    departmentMasterId: deptId,
    departmentLicenceDetailsId: existing?.departmentLicenceDetailsId,
    name: dept.departmentName,
    enabled,
    startDate: existing?.licenceStartDate ? existing.licenceStartDate.split('T')[0] : '',
    duration: existing?.licenceDuration ? parseDurationFromApi(existing.licenceDuration) : '',
    endDate,
    status: expired ? 'inactive' : ((existing?.status as DepartmentLicense['status']) || (enabled ? 'active' : 'inactive')),
    renewalAlerts: endDate ? calculateRenewalAlerts(endDate) : [],
  };
}

function buildInitial(
  depts: Department[],
  licences: DepartmentLicenceDetails[]
): DepartmentLicense[] {
  if (!Array.isArray(depts) || depts.length === 0) return [];
  return depts.map((dept) =>
    toDepartmentLicense(dept, Array.isArray(licences) ? licences : [])
  );
}

export function useDepartmentLicenses(
  initialDepts: Department[],
  initialLicences: DepartmentLicenceDetails[]
) {
  const t = useTranslations('ulb_configuration');
  const [initialDepartments, setInitialDepartments] = useState<DepartmentLicense[]>(() =>
    buildInitial(initialDepts, initialLicences)
  );
  const [departments, setDepartments] = useState<DepartmentLicense[]>(initialDepartments);
  const [searchQuery, setSearchQuery] = useState('');
  const { saveLicences, isSavingLicences } = useDepartmentLicencesSave({
    departments,
    setDepartments,
    setInitialDepartments,
  });

  const mergeWithPreviousState = useCallback(
    (next: DepartmentLicense[], prev: DepartmentLicense[]) =>
      next.map((dept) => {
        const existing = prev.find((item) => item.id === dept.id);
        if (!existing) return dept;
        return {
          ...dept,
          enabled: existing.enabled,
          startDate: existing.enabled ? existing.startDate : dept.startDate,
          duration: existing.enabled ? existing.duration : dept.duration,
          endDate: existing.enabled ? existing.endDate : dept.endDate,
          status: existing.enabled ? existing.status : dept.status,
          renewalAlerts: existing.enabled ? existing.renewalAlerts : dept.renewalAlerts,
          departmentLicenceDetailsId:
            dept.departmentLicenceDetailsId ?? existing.departmentLicenceDetailsId,
        };
      }),
    []
  );

  /** Syncs department cards from SSR props after router.refresh() — no API calls. */
  const syncFromServer = useCallback(
    (depts: Department[], licences: DepartmentLicenceDetails[]) => {
      setDepartments((prev) => {
        const next = buildInitial(depts, licences);
        if (prev.length === 0) return next;
        return mergeWithPreviousState(next, prev);
      });
    },
    [mergeWithPreviousState]
  );

  const toggle = useCallback(
    (id: string, enabled: boolean, masterDates?: UlbMasterLicenseSnapshot) => {
      setDepartments((prev) =>
        prev.map((d) => {
          if (d.id !== id) return d;

          let startDate = d.startDate;
          let duration = d.duration;
          let endDate = d.endDate;

          if (enabled) {
            const expired = endDate ? isLicenseExpired(endDate) : true;
            if (expired) {
              if (
                masterDates?.startDate &&
                masterDates?.duration &&
                masterDates?.endDate &&
                !isLicenseExpired(masterDates.endDate)
              ) {
                startDate = masterDates.startDate;
                duration = masterDates.duration;
                endDate = masterDates.endDate;
              } else {
                const todayStr = new Date().toISOString().split('T')[0];
                startDate = todayStr;
                duration = '12';
                endDate = calculateLicenseEndDate(todayStr, '12');
              }
            }
          }

          const currentEndDate = endDate;
          const expiredAfterToggle = currentEndDate ? isLicenseExpired(currentEndDate) : false;
          const finalEnabled = enabled && !expiredAfterToggle;
          const finalStatus = finalEnabled ? 'active' : 'inactive';

          return {
            ...d,
            enabled: finalEnabled,
            startDate,
            duration,
            endDate,
            status: finalStatus as DepartmentLicense['status'],
            renewalAlerts: finalEnabled && endDate ? calculateRenewalAlerts(endDate) : [],
          };
        })
      );
    },
    []
  );

  const updateDate = useCallback(
    (id: string, field: 'startDate' | 'duration' | 'endDate', value: string) => {
      setDepartments((prev) =>
        prev.map((d) => {
          if (d.id !== id) return d;
          const next = { ...d, [field]: value };

          if (field === 'endDate') {
            if (next.endDate) {
              if (next.startDate) {
                next.duration = calculateDurationInMonths(next.startDate, next.endDate);
              }
              next.renewalAlerts = calculateRenewalAlerts(next.endDate);
              const expired = isLicenseExpired(next.endDate);
              if (expired) {
                next.enabled = false;
                next.status = 'inactive';
              } else {
                next.status = 'active';
              }
            } else {
              next.renewalAlerts = [];
            }
            return next;
          }

          if (field === 'startDate') {
             if (next.endDate) {
                next.duration = calculateDurationInMonths(next.startDate, next.endDate);
             } else if (next.duration) {
                next.endDate = calculateLicenseEndDate(next.startDate, next.duration);
                next.renewalAlerts = calculateRenewalAlerts(next.endDate);
                const expired = isLicenseExpired(next.endDate);
                if (expired) {
                  next.enabled = false;
                  next.status = 'inactive';
                } else {
                  next.status = 'active';
                }
             }
             return next;
          }

          if (field === 'duration' && next.startDate && next.duration) {
            next.endDate = calculateLicenseEndDate(next.startDate, next.duration);
            next.renewalAlerts = calculateRenewalAlerts(next.endDate);
            const expired = isLicenseExpired(next.endDate);
            if (expired) {
              next.enabled = false;
              next.status = 'inactive';
            } else {
              next.status = 'active';
            }
          }

          return next;
        })
      );
    },
    []
  );

  const enableAll = useCallback(
    (master: UlbMasterLicenseSnapshot) => {
      if (!master.startDate?.trim() || !master.duration?.trim()) {
        toast.error(t('messages.masterDatesRequired'));
        return;
      }
      const endDate =
        master.endDate?.trim() || calculateLicenseEndDate(master.startDate, master.duration);
      if (isLicenseExpired(endDate)) {
        toast.error(t('messages.masterExpired') || 'Master license dates are expired. Cannot enable departments.');
        return;
      }
      setDepartments((prev) =>
        prev.map((d) => ({
          ...d,
          enabled: true,
          status: 'active' as const,
          startDate: master.startDate,
          duration: master.duration,
          endDate,
          renewalAlerts: calculateRenewalAlerts(endDate),
        }))
      );
      toast.success(t('messages.enableAllSuccess'));
    },
    [t]
  );

  const disableAll = useCallback(() => {
    setDepartments((prev) =>
      prev.map((d) => ({
        ...d,
        enabled: false,
        status: 'inactive' as const,
        renewalAlerts: [],
      }))
    );
    toast.success(t('messages.disableAllSuccess'));
  }, [t]);

  const applyMaster = useCallback(
    (master: UlbMasterLicenseSnapshot) => {
      if (!master.startDate || !master.duration) {
        toast.error(t('messages.masterDatesRequired'));
        return;
      }
      const endDate =
        master.endDate?.trim() || calculateLicenseEndDate(master.startDate, master.duration);
      if (isLicenseExpired(endDate)) {
        toast.error(t('messages.masterExpired') || 'Master license dates are expired. Cannot sync with departments.');
        return;
      }
      setDepartments((prev) =>
        prev.map((d) =>
          !d.enabled
            ? d
            : {
                ...d,
                startDate: master.startDate,
                duration: master.duration,
                endDate,
                renewalAlerts: calculateRenewalAlerts(endDate),
                status: 'active' as const,
              }
        )
      );
      toast.success(t('messages.masterApplied'));
    },
    [t]
  );

  const filtered = useMemo(
    () => departments.filter((d) => d.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [departments, searchQuery]
  );

  const activeCount = useMemo(() => departments.filter((d) => d.enabled).length, [departments]);

  const isDirty = useMemo(() => {
    return JSON.stringify(departments) !== JSON.stringify(initialDepartments);
  }, [departments, initialDepartments]);

  return {
    departments,
    filtered,
    isDirty,
    activeCount,
    searchQuery,
    setSearchQuery,
    toggle,
    updateDate,
    enableAll,
    disableAll,
    applyMaster,
    syncFromServer,
    saveLicences,
    isSavingLicences,
    isLoadingDepartments: false,
  };
}

export type UseDepartmentLicenses = ReturnType<typeof useDepartmentLicenses>;
