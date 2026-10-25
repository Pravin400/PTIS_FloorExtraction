'use client';

import { Check, Package, Save, Settings2, XCircle } from 'lucide-react';
import { Drawer } from '@/components/common/Drawer';
import { Badge } from '@/components/common/Badge';
import { ToggleSwitch } from '@/components/common/ToggleSwitch';
import { Button } from '@/components/common/ActionButton';
import { useConfirm } from '@/components/common/ConfirmProvider';
import type { Department, Module } from '@/types/departmentActivation.types';
import { useTranslations, useLocale } from 'next-intl';

interface SubmoduleConfigDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  department: Department | null;
  modules: Module[];
  savedModules: Module[];
  hasUnsavedChanges: boolean;
  changedModuleCount: number;
  isSaving: boolean;
  onToggleModule: (module: Module) => void;
  onToggleAllModules: (activate: boolean) => void;
  onResetDraft: () => void;
  onSaveChanges: () => Promise<boolean>;
}

export function SubmoduleConfigDialog({
  isOpen,
  onOpenChange,
  department,
  modules,
  savedModules,
  hasUnsavedChanges,
  changedModuleCount,
  isSaving,
  onToggleModule,
  onToggleAllModules,
  onResetDraft,
  onSaveChanges,
}: SubmoduleConfigDialogProps) {
  const { confirm } = useConfirm();
  const t = useTranslations('departmentActivation');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  if (!department) return null;

  const departmentName =
    locale === 'en' || !department.departmentNameLocal?.trim()
      ? department.departmentName
      : department.departmentNameLocal.trim();
  const modalTitle = t('modal.title');
  const drawerTitle = t('modal.drawerTitle', {
    departmentName,
    title: modalTitle,
  });

  const activeCount = modules.filter((m) => m.isActive).length;
  const totalCount = modules.length;

  const handleClose = () => {
    if (!hasUnsavedChanges) {
      onOpenChange(false);
      return;
    }

    confirm({
      title: t('modal.unsavedTitle'),
      description: t('modal.unsavedMessage'),
      confirmText: t('modal.discardChanges'),
      cancelText: tCommon('buttons.cancel'),
      variant: 'warning',
      onConfirm: () => {
        onResetDraft();
        onOpenChange(false);
      },
    });
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      onResetDraft();
    }
    onOpenChange(false);
  };

  const handleSave = async () => {
    const saved = await onSaveChanges();
    if (saved) {
      onOpenChange(false);
    }
  };

  return (
    <Drawer
      open={isOpen}
      onClose={handleClose}
      title={drawerTitle}
      width="lg"
      footer={
        <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-500">
            <div
              className={`w-2 h-2 rounded-full ${hasUnsavedChanges ? 'bg-amber-500' : 'bg-emerald-500'}`}
            />
            <span>
              {hasUnsavedChanges
                ? t('modal.unsavedHint', { count: changedModuleCount })
                : t('modal.allSaved')}
            </span>
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              disabled={isSaving}
            >
              {tCommon('buttons.cancel')}
            </Button>
            <Button
              type="button"
              variant="primary"
              icon={Save}
              onClick={() => void handleSave()}
              isLoading={isSaving}
              disabled={isSaving || !hasUnsavedChanges}
            >
              {t('modal.saveChanges')}
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col h-full px-4 pb-4">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-3 -mx-4 mb-4">
          <div className="flex items-center gap-2 text-base font-semibold">
            <Settings2 className="w-4 h-4" />
            {drawerTitle}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 bg-slate-50 dark:bg-slate-50 border-b border-slate-200 dark:border-slate-200 mb-4 -mx-4 px-4">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-700">
            {t('modal.modulesSummary', {
              activeCount,
              totalCount,
              modulesLabel: t('modal.modulesLabel'),
            })}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="xs"
              icon={Check}
              className="text-emerald-600 dark:text-emerald-600 border-emerald-200 dark:border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-50 bg-white dark:bg-white"
              onClick={() => onToggleAllModules(true)}
              disabled={isSaving || totalCount === 0}
            >
              {t('modal.activateAll')}
            </Button>
            <Button
              variant="secondary"
              size="xs"
              icon={XCircle}
              className="text-rose-600 dark:text-rose-600 border-rose-200 dark:border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-50 bg-white dark:bg-white"
              onClick={() => onToggleAllModules(false)}
              disabled={isSaving || totalCount === 0}
            >
              {t('modal.deactivateAll')}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {modules.length === 0 ? (
            <div className="text-center py-10 bg-white/50 dark:bg-white/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-200">
              <Package className="w-8 h-8 text-slate-400 dark:text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-500">{t('modal.noModules')}</p>
            </div>
          ) : (
            modules.map((module) => {
              const saved = savedModules.find((m) => m.moduleId === module.moduleId);
              const isChanged = saved !== undefined && saved.isActive !== module.isActive;
              const moduleName =
                locale === 'en' || !module.moduleNameLocal?.trim()
                  ? module.moduleName
                  : module.moduleNameLocal.trim();

              return (
                <div
                  key={module.moduleId}
                  className={`p-3 border-2 rounded-lg transition-all ${
                    module.isActive
                      ? 'bg-emerald-50 dark:bg-emerald-50 border-emerald-200 dark:border-emerald-200 border-l-4'
                      : 'bg-white dark:bg-white border-gray-200 dark:border-gray-200'
                  } ${isChanged ? 'ring-2 ring-amber-200 dark:ring-amber-200' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <Package
                      className={`w-4 h-4 mt-1 ${module.isActive ? 'text-emerald-600 dark:text-emerald-600' : 'text-gray-500 dark:text-gray-500'}`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-900">{moduleName}</h4>
                          <Badge variant="secondary" className="text-[10px]">
                            {module.moduleCode}
                          </Badge>
                          {isChanged && (
                            <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700">
                              {tCommon('status.pending')}
                            </Badge>
                          )}
                        </div>
                        <ToggleSwitch
                          checked={module.isActive}
                          onChange={() => onToggleModule(module)}
                          showPopup={false}
                          disabled={isSaving}
                          activeLabel={tCommon('status.active')}
                          inactiveLabel={tCommon('status.inactive')}
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {module.moduleDescription || t('card.noDescription')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Drawer>
  );
}

export default SubmoduleConfigDialog;
