'use client';

import { Check, X } from 'lucide-react';
import { Button } from '@/components/common/ActionButton';
import { SearchInput } from '@/components/common/SearchInput';
import type { DepartmentActivationProps } from '@/types/departmentActivation.types';
import { DepartmentCard } from './DepartmentCard';
import { SubmoduleConfigDialog } from './SubmoduleConfigDialog';
import { DepartmentActivationStatsCards } from './DepartmentActivationStatsCards';
import { useDepartmentActivation } from '@/hooks/configuration-settings/department-activation/useDepartmentActivation';

export function DepartmentActivationClient({ initialDepartments, initialModules, initialSearchTerm = '' }: DepartmentActivationProps) {
  const {
    searchTerm,
    setSearchTerm,
    isPending,
    selectedDepartment,
    isSubmoduleDialogOpen,
    toggleDepartment,
    handleToggleAll,
    setSubmoduleDialogOpen,
    filteredDepartments,
    optimisticDepartments,
    submoduleConfig,
    t,
  } = useDepartmentActivation({ initialDepartments, initialModules, initialSearchTerm });

  return (
    <div className="space-y-4 text-slate-900 dark:text-slate-900 [color-scheme:light]">
        <DepartmentActivationStatsCards departments={optimisticDepartments} />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder={t('searchPlaceholder')}
                className="mb-0 w-full md:w-72 [&_input]:text-gray-900 [&_input]:dark:text-gray-900 [&_input]:bg-white [&_input]:dark:bg-white [&_input]:placeholder:text-gray-400 [&_input]:dark:placeholder:text-gray-400 [&_input]:[color-scheme:light]"
            />
            <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-50 border border-blue-100 dark:border-blue-100 rounded-xl">
                <Button variant="success" size="sm" icon={Check} onClick={() => handleToggleAll(true)} disabled={isPending}>{t('quickActions.activateAll')}</Button>
                <Button variant="danger" size="sm" icon={X} onClick={() => handleToggleAll(false)} disabled={isPending}>{t('quickActions.deactivateAll')}</Button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDepartments.map((dept) => (
              <DepartmentCard
                key={dept.departmentId}
                department={dept}
                onToggle={toggleDepartment}
                onConfigure={(dept) => setSubmoduleDialogOpen(true, dept)}
                configureButtonText={t('card.configureSubmodules')}
              />
            ))}
        </div>

      <SubmoduleConfigDialog
        isOpen={isSubmoduleDialogOpen}
        onOpenChange={(open) => setSubmoduleDialogOpen(open, selectedDepartment ?? undefined)}
        department={selectedDepartment}
        modules={submoduleConfig.draftModules}
        savedModules={submoduleConfig.savedModules}
        hasUnsavedChanges={submoduleConfig.hasUnsavedChanges}
        changedModuleCount={submoduleConfig.changedModuleCount}
        isSaving={submoduleConfig.isSaving}
        onToggleModule={submoduleConfig.toggleModuleDraft}
        onToggleAllModules={submoduleConfig.toggleAllModulesDraft}
        onResetDraft={submoduleConfig.resetDraft}
        onSaveChanges={submoduleConfig.saveChanges}
      />
    </div>
  );
}
