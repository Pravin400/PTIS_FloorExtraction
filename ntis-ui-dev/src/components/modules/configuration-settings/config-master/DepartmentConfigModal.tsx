'use client';

import { Settings2, Save, X, Info } from 'lucide-react';
import { Button, Drawer, useConfirm } from '@/components/common';
import { DepartmentApiResponse } from '@/types/configMaster.types';
import { useTranslations } from 'next-intl';
import { DepartmentRow } from './DepartmentRow';
import { SubmoduleConfigList } from './SubmoduleConfigList';
import { useDepartmentConfig } from '../../../../hooks/useDepartmentConfig';

interface DepartmentConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  configKeyId: number;
  configKeyName: string;
  configKeyDescription?: string;
  controlType?: string;
  dataType?: string;
  options?: string[];
  defaultValue?: string | number | boolean;
  initialData: DepartmentApiResponse[] | null;
}

/**
 * Drawer for configuring a specific Key across Departments and Submodules
 */
export default function DepartmentConfigModal({
  isOpen,
  onClose,
  onSuccess,
  configKeyId,
  configKeyName,
  configKeyDescription,
  controlType,
  dataType,
  options,
  defaultValue,
  initialData,
}: DepartmentConfigModalProps) {
  const t = useTranslations('configMaster');
  const { confirm } = useConfirm();
  
  const {
    departments,
    expandedDepts,
    isPending,
    isDirty,
    isSaveDisabled,
    toggleDeptExpansion,
    handleToggleDept,
    handleToggleSubmodule,
    toggleAllSubmodules,
    handleSubmoduleValueChange,
    handleSaveAll,
  } = useDepartmentConfig(initialData, configKeyId, onSuccess, defaultValue, dataType, controlType);

  const handleClose = (): void => {
    if (isPending) return;
    if (isDirty) {
      confirm({
        variant: 'warning',
        title: t('confirm.discard.title'),
        description: t('confirm.discard.description'),
        confirmText: t('confirm.discard.confirm'),
        cancelText: t('confirm.discard.cancel'),
        onConfirm: onClose,
      });
      return;
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Drawer
      open={isOpen}
      onClose={handleClose}
      width="lg"
      title={
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl shadow-lg shadow-violet-200 shrink-0">
            <Settings2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight leading-tight">
              {configKeyName}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-slate-500 text-xs font-medium line-clamp-1">
                {configKeyDescription || t('modals.departmentConfig.subtitle')}
              </p>
            </div>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between gap-4 w-full border-t border-slate-100 p-5 bg-white/80 backdrop-blur-md">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isPending}
            className="px-8 h-12 rounded-xl font-bold text-slate-600 hover:text-slate-800 transition-all border-slate-200 cursor-pointer"
            icon={isPending ? undefined : X}
          >
            {t('modals.departmentConfig.buttons.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveAll}
            disabled={isPending || !isDirty || isSaveDisabled}
            isLoading={isPending}
            className="flex-1 sm:flex-none px-10 h-12 rounded-xl font-bold bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-200 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            icon={isPending ? undefined : Save}
          >
            {isPending
              ? t('modals.departmentConfig.buttons.saving')
              : t('modals.departmentConfig.buttons.save')}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col h-full overflow-hidden bg-slate-50/50">
        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1 pb-10">
          {/* Info Banner */}
          <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex gap-3">
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-blue-700 leading-relaxed">
              {t('modals.departmentConfig.infoBanner') ||
                'Configure visibility and override values for this key across all departments and their submodules.'}
            </p>
          </div>

          <div className="space-y-4">
            {departments.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center gap-4">
                <div className="p-4 bg-slate-50 rounded-full">
                  <Settings2 className="w-10 h-10 text-slate-300" />
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500 font-bold">
                    {t('modals.departmentConfig.noDepartments') || 'No departments found'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {t('modals.departmentConfig.noDepartmentsDesc') || 'Please ensure departments are configured in the system.'}
                  </p>
                </div>
              </div>
            ) : (
              departments.map((dept) => (
                <DepartmentRow
                  key={dept.id}
                  dept={dept}
                  isExpanded={expandedDepts.includes(dept.id)}
                  onToggleExpansion={toggleDeptExpansion}
                  onToggle={handleToggleDept}
                >
                  <SubmoduleConfigList
                    dept={dept}
                    configKeyId={configKeyId}
                    controlType={controlType}
                    dataType={dataType}
                    options={options}
                    onToggleAll={toggleAllSubmodules}
                    onToggleSubmodule={handleToggleSubmodule}
                    onValueChange={handleSubmoduleValueChange}
                  />
                </DepartmentRow>
              ))
            )}
          </div>
        </div>
      </div>
    </Drawer>
  );
}
