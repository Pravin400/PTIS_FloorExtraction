'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { updateModuleStatusAction } from '@/app/[locale]/configuration-settings/department-activation/action';
import type { Department, Module } from '@/types/departmentActivation.types';

interface UseSubmoduleConfigProps {
  initialModules: Module[];
  selectedDepartment: Department | null;
  isOpen: boolean;
}

function buildModuleFormData(module: Module, departmentId: number, isActive: boolean): FormData {
  const formData = new FormData();
  formData.append('moduleId', String(module.moduleId));
  formData.append('departmentId', String(departmentId));
  formData.append('moduleCode', module.moduleCode);
  formData.append('moduleName', module.moduleName);
  formData.append('moduleNameLocal', module.moduleNameLocal || '');
  formData.append('moduleIcon', module.moduleIcon || '');
  formData.append('moduleLabel', module.moduleLabel || '');
  formData.append('moduleDescription', module.moduleDescription || '');
  formData.append('isActive', String(isActive));
  return formData;
}

export function useSubmoduleConfig({
  initialModules,
  selectedDepartment,
  isOpen,
}: UseSubmoduleConfigProps) {
  const router = useRouter();
  const t = useTranslations('departmentActivation');

  const moduleSnapshotKey = initialModules
    .map((module) => `${module.moduleId}:${module.isActive}`)
    .join('|');
  const openSessionKey =
    isOpen && selectedDepartment
      ? `${selectedDepartment.departmentId}:${moduleSnapshotKey}`
      : null;

  const [savedModules, setSavedModules] = useState<Module[]>(initialModules);
  const [draftModules, setDraftModules] = useState<Module[]>(initialModules);
  const [activeSessionKey, setActiveSessionKey] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (openSessionKey !== activeSessionKey) {
    setActiveSessionKey(openSessionKey);
    if (openSessionKey !== null) {
      setSavedModules(initialModules);
      setDraftModules(initialModules);
    }
  }

  const hasUnsavedChanges = useMemo(
    () =>
      draftModules.some((draft) => {
        const saved = savedModules.find((m) => m.moduleId === draft.moduleId);
        return saved && saved.isActive !== draft.isActive;
      }),
    [draftModules, savedModules]
  );

  const changedModuleCount = useMemo(
    () =>
      draftModules.filter((draft) => {
        const saved = savedModules.find((m) => m.moduleId === draft.moduleId);
        return saved && saved.isActive !== draft.isActive;
      }).length,
    [draftModules, savedModules]
  );

  const toggleModuleDraft = useCallback((module: Module) => {
    setDraftModules((prev) =>
      prev.map((m) =>
        m.moduleId === module.moduleId ? { ...m, isActive: !m.isActive } : m
      )
    );
  }, []);

  const toggleAllModulesDraft = useCallback((activate: boolean) => {
    setDraftModules((prev) => prev.map((m) => ({ ...m, isActive: activate })));
  }, []);

  const resetDraft = useCallback(() => {
    setDraftModules(savedModules);
  }, [savedModules]);

  const saveChanges = useCallback(async (): Promise<boolean> => {
    if (!selectedDepartment || !hasUnsavedChanges) return true;

    const changedModules = draftModules.filter((draft) => {
      const saved = savedModules.find((m) => m.moduleId === draft.moduleId);
      return saved && saved.isActive !== draft.isActive;
    });

    setIsSaving(true);
    try {
      const results = await Promise.all(
        changedModules.map((module) =>
          updateModuleStatusAction(
            buildModuleFormData(module, selectedDepartment.departmentId, module.isActive)
          )
        )
      );

      const failCount = results.filter((r) => !r.success).length;
      const successCount = results.length - failCount;

      if (failCount > 0) {
        toast.warning(t('messages.moduleBulkUpdateResult', { successCount, failCount }));
        router.refresh();
        return false;
      }

      setSavedModules(draftModules);
      toast.success(t('messages.modulesSaveSuccess', { count: successCount }));
      router.refresh();
      return true;
    } catch {
      toast.error(t('messages.moduleUpdateFailed'));
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [
    selectedDepartment,
    hasUnsavedChanges,
    draftModules,
    savedModules,
    t,
    router,
  ]);

  return {
    draftModules,
    savedModules,
    hasUnsavedChanges,
    changedModuleCount,
    isSaving,
    toggleModuleDraft,
    toggleAllModulesDraft,
    resetDraft,
    saveChanges,
  };
}
