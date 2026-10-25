'use client';

import { useState, useTransition, useEffect, useRef, useOptimistic } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { updateDepartmentStatusAction } from '@/app/[locale]/configuration-settings/department-activation/action';
import type { Department, Module } from '@/types/departmentActivation.types';
import { useTranslations, useLocale } from 'next-intl';
import { useSubmoduleConfig } from './useSubmoduleConfig';

interface UseDepartmentActivationProps {
  initialDepartments: Department[];
  initialModules: Module[];
  initialSearchTerm: string;
}

export function useDepartmentActivation({
  initialDepartments,
  initialModules,
  initialSearchTerm,
}: UseDepartmentActivationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('departmentActivation');
  const locale = useLocale();

  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [isPending, startTransition] = useTransition();
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const departmentIdParam = searchParams.get('departmentId');
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(
    departmentIdParam 
      ? initialDepartments.find(d => d.departmentId.toString() === departmentIdParam) || null
      : null
  );
  const isSubmoduleDialogOpen = !!selectedDepartment;

  const [optimisticDepartments, addOptimisticDepartmentUpdate] = useOptimistic<
      Department[], 
      { id: number; isActive: boolean } | { ids: number[]; isActive: boolean }
    >(
      initialDepartments,
      (state, update) => {
        if ('ids' in update) {
          return state.map(dept => 
            update.ids.includes(dept.departmentId) ? { ...dept, isActive: update.isActive } : dept
          );
        } else if ('id' in update) {
          return state.map(dept => 
            dept.departmentId === update.id ? { ...dept, isActive: update.isActive } : dept
          );
        }
        return state;
      }
    );

  const [localModules, setLocalModules] = useState<Module[]>(initialModules);

  const submoduleConfig = useSubmoduleConfig({
    initialModules: localModules,
    selectedDepartment,
    isOpen: isSubmoduleDialogOpen,
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchTerm(initialSearchTerm);
  }, [initialSearchTerm]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalModules(initialModules);
  }, [initialModules]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (searchTerm !== initialSearchTerm) {
      searchTimeoutRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (searchTerm) params.set('search', searchTerm);
        else params.delete('search');
        
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
      }, 500);
    }
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [searchTerm, initialSearchTerm, pathname, router, searchParams]);

  const toggleDepartment = (id: number, currentDepartment: Department) => {
    const newIsActive = !currentDepartment.isActive;
    startTransition(() => {
      void (async () => {
        addOptimisticDepartmentUpdate({ id, isActive: newIsActive });
        const formData = new FormData();
        formData.append('departmentId', String(id));
        formData.append('departmentCode', currentDepartment.departmentCode);
        formData.append('departmentName', currentDepartment.departmentName);
        formData.append('departmentNameLocal', currentDepartment.departmentNameLocal || '');
        formData.append('departmentIcon', currentDepartment.departmentIcon || '');
        formData.append('departmentDescription', currentDepartment.departmentDescription || '');
        formData.append('isActive', String(newIsActive));

        const result = await updateDepartmentStatusAction(formData);
        if (result.success) {
          const displayName =
            locale === 'en' || !currentDepartment.departmentNameLocal?.trim()
              ? currentDepartment.departmentName
              : currentDepartment.departmentNameLocal.trim();
          toast.success(
            t('messages.departmentStatusUpdated', {
              departmentName: displayName,
              status: t(`messages.${newIsActive ? 'activated' : 'deactivated'}`),
            })
          );
        } else {
          // Rollback on failure
          addOptimisticDepartmentUpdate({ id, isActive: !newIsActive });
          toast.error(result.error || t("messages.departmentUpdateError"));
        }
      })();
    });
  };

  const filteredDepartments = optimisticDepartments.filter((dept) => {
    const query = searchTerm.toLowerCase();
    const displayName =
      locale === 'en' || !dept.departmentNameLocal?.trim()
        ? dept.departmentName
        : dept.departmentNameLocal.trim();

    return (
      displayName.toLowerCase().includes(query) ||
      dept.departmentName.toLowerCase().includes(query) ||
      (dept.departmentNameLocal?.toLowerCase().includes(query) ?? false) ||
      dept.departmentCode.toLowerCase().includes(query)
    );
  });

  const handleToggleAll = (activate: boolean) => {
    const targets = filteredDepartments.filter(d => d.isActive !== activate);
    if (targets.length === 0) return;
    
    startTransition(() => {
      void (async () => {
        addOptimisticDepartmentUpdate({ ids: targets.map(d => d.departmentId), isActive: activate });
        
        const updatePromises = targets.map(dept => {
          const formData = new FormData();
          formData.append('departmentId', String(dept.departmentId));
          formData.append('departmentCode', dept.departmentCode);
          formData.append('departmentName', dept.departmentName);
          formData.append('departmentNameLocal', dept.departmentNameLocal || '');
          formData.append('departmentIcon', dept.departmentIcon || '');
          formData.append('departmentDescription', dept.departmentDescription || '');
          formData.append('isActive', String(activate));
          return updateDepartmentStatusAction(formData);
        });

        const results = await Promise.all(updatePromises);
        const failCount = results.filter(r => !r.success).length;
        const successCount = results.length - failCount;

        if (failCount > 0) {
          toast.warning(t('messages.bulkUpdateResult', { successCount, failCount }));
        } else {
          toast.success(activate ? t('messages.activateAllSuccess') : t('messages.deactivateAllSuccess'));
        }
        router.refresh();
      })();
    });
  };

  const setSubmoduleDialogOpen = (open: boolean, dept?: Department) => {
    setSelectedDepartment(open && dept ? dept : null);
    const params = new URLSearchParams(searchParams.toString());
    if (open && dept) params.set('departmentId', dept.departmentId.toString());
    else params.delete('departmentId');
    startTransition(() => { router.push(`${pathname}?${params.toString()}`); });
  };


  return {
    searchTerm,
    setSearchTerm,
    isPending,
    selectedDepartment,
    isSubmoduleDialogOpen,
    optimisticDepartments,
    localModules,
    toggleDepartment,
    handleToggleAll,
    setSubmoduleDialogOpen,
    filteredDepartments,
    submoduleConfig,
    t,
  };
}
