'use client';

import { useCallback, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Tabs } from '@/components/common';
import { useUlbConfigurationForm } from '@/hooks/configuration-settings/ulb-configuration/useUlbConfigurationForm';
import { useUlbConfigurationSave } from '@/hooks/configuration-settings/ulb-configuration/useUlbConfigurationSave';
import { useDepartmentLicenses } from '@/hooks/configuration-settings/ulb-configuration/useDepartmentLicenses';
import { useUlbImages } from '@/hooks/configuration-settings/ulb-configuration/useUlbImages';
import {
  findInvalidEnabledDepartment,
  getDepartmentLicencesToSave,
} from '@/lib/api/configuration-settings/ulb-configuration/department-licence.validator';
import type {
  ULBConfigurationModuleProps,
  UlbSectionKey,
  UlbTabId,
} from '@/types/ulbconfig-master.types';
import { ULBProgressHeader } from './ULBProgressHeader';
import { ULBTabList } from './ULBTabList';
import { ULBInfoTab } from './tabs/ULBInfoTab';
import { ULBLogoImagesTab } from './tabs/ULBLogoImagesTab';
import { ULBProjectLicenseTab } from './tabs/ULBProjectLicenseTab';
import { ULBDepartmentLicenseTab } from './tabs/ULBDepartmentLicenseTab';

const TOTAL_STEPS = 4;
const FOOTER_CLASS =
  'mt-auto flex flex-shrink-0 items-center gap-3 border-t border-slate-200 bg-white px-4 py-3';
const PANEL_CLASS = 'mt-0 flex min-h-0 flex-1 flex-col outline-none';

export default function ULBConfigurationClient({
  initialUlbData,
  initialDeptData,
  initialLicenceData,
  initialImagesData,
  fetchError,
  statusCode,
}: ULBConfigurationModuleProps) {
  const t = useTranslations('ulb_configuration');
  const [activeTab, setActiveTab] = useState<UlbTabId>('ulb-info');
  const [ulbMasterId, setUlbMasterId] = useState<number | undefined>(initialUlbData?.id);

  const form = useUlbConfigurationForm(
    initialUlbData,
    Array.isArray(initialLicenceData) && initialLicenceData.some((l) => l.isActive ?? l.isEnabled)
  );
  const depts = useDepartmentLicenses(initialDeptData, initialLicenceData);
  const imagesHook = useUlbImages(initialImagesData || [], (url, isAutoSelect) => form.setField('ulbLogo', url, isAutoSelect));

  const { save, isSaving } = useUlbConfigurationSave({
    formData: form.formData,
    ulbMasterId,
    onSaved: (ulb) => {
      setUlbMasterId(ulb.id);
      form.syncFromUlbMaster(ulb, depts.departments.some((d) => d.enabled));
    },
  });

  const isGlobalDirty = form.isDirty || depts.isDirty || imagesHook.hasPendingImageChanges;

  const goTo = useCallback((next: UlbTabId) => {
    if (isGlobalDirty) {
      toast.error(t('messages.saveBeforeSwitch'));
      return;
    }
    setActiveTab(next);
  }, [isGlobalDirty, t]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isGlobalDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isGlobalDirty]);

  const handleSaveSection = useCallback(
    async (section: UlbSectionKey) => {
      if (section !== 'ulb-info' && !ulbMasterId && !form.validateSection('ulb-info')) {
        toast.error(t('messages.completeUlbInfoFirst'));
        setActiveTab('ulb-info');
        return;
      }

      if (!form.validateSection(section)) {
        const validationMessage = form.getSectionValidationError(section);
        toast.error(validationMessage ?? t('messages.validation'));
        return;
      }

      if (section === 'ulb-info' || section === 'project-license-info') {
        const savedUlb = await save(undefined, false);
        if (!savedUlb) return;
      }

      if (section === 'logo-images') {
         const success = await imagesHook.commitImageChanges();
         if (!success) return;
      }

      form.markSectionComplete(section, true);
      toast.success(t('messages.success'));
    },
    [form, t, ulbMasterId, imagesHook, save]
  );

  const handleSaveDepartments = useCallback(async () => {
    const toSave = getDepartmentLicencesToSave(depts.departments);
    if (findInvalidEnabledDepartment(toSave)) {
      toast.error(t('messages.validation'));
      return;
    }

    const success = await depts.saveLicences();
    if (!success) return;

    form.setDepartmentLicenseComplete(true);
    toast.success(t('messages.success'));
  }, [depts, form, t]);

  const handleFinalSave = useCallback(async () => {
    if (!form.validateSection('ulb-info')) {
      toast.error(form.getSectionValidationError('ulb-info') ?? t('messages.validation'));
      setActiveTab('ulb-info');
      return;
    }
    if (!form.validateSection('logo-images')) {
      toast.error(form.getSectionValidationError('logo-images') ?? t('messages.validation'));
      setActiveTab('logo-images');
      return;
    }
    if (!form.validateSection('project-license-info')) {
      toast.error(form.getSectionValidationError('project-license-info') ?? t('messages.validation'));
      setActiveTab('project-license-info');
      return;
    }

    const toSaveDepts = getDepartmentLicencesToSave(depts.departments);
    if (findInvalidEnabledDepartment(toSaveDepts)) {
      toast.error(t('messages.validation'));
      setActiveTab('department-license');
      return;
    }

    const savedUlb = await save(undefined, true);
    if (!savedUlb) return;

    const savedImages = await imagesHook.commitImageChanges();
    if (!savedImages) return;

    const savedDepts = await depts.saveLicences(true);
    if (!savedDepts) return;

    form.setDepartmentLicenseComplete(true);
    toast.success(t('messages.success'));
  }, [depts, form, save, t, imagesHook]);

  if (fetchError) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-6 text-center">
        <h2 className="text-lg font-semibold text-slate-900">{t('messages.fetchError')}</h2>
        <p className="max-w-md text-sm text-slate-600">{fetchError}</p>
        {statusCode ? (
          <p className="text-xs text-slate-400">HTTP {statusCode}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="-mx-3 -my-3 flex min-h-0 flex-1 flex-col bg-[#f5f8ff] md:-mx-4">
      <div className="flex flex-1 flex-col gap-3 overflow-hidden px-4 pb-3 pt-2">
        <ULBProgressHeader
          completedCount={form.completedCount}
          totalSteps={TOTAL_STEPS}
          urgentAlertCount={form.urgentAlertCount}
        />

        <Tabs
          value={activeTab}
          onChange={(val) => goTo(val as UlbTabId)}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <ULBTabList activeTab={activeTab} completionStatus={form.completionStatus} t={t} />

          <Tabs.TabPanel value="ulb-info" className={PANEL_CLASS}>
            <ULBInfoTab
              formData={form.formData}
              t={t}
              onFieldChange={form.handleFieldChange}
              onFieldBlur={form.handleFieldBlur}
              getFieldError={form.getFieldError}
              onStateChange={form.handleStateChange}
              onSave={() => {
                if (!isSaving) void handleSaveSection('ulb-info');
              }}
              onNext={() => goTo('logo-images')}
              footerClassName={FOOTER_CLASS}
            />
          </Tabs.TabPanel>

          <Tabs.TabPanel value="logo-images" className={PANEL_CLASS}>
            <ULBLogoImagesTab
              t={t}
              logoUrl={form.formData.ulbLogo}
              onLogoChange={(url, isAutoSelect) => form.setField('ulbLogo', url, isAutoSelect)}
              onSave={() => {
                if (!isSaving) void handleSaveSection('logo-images');
              }}
              onPrevious={() => goTo('ulb-info')}
              onNext={() => goTo('project-license-info')}
              isSaving={isSaving || imagesHook.isUploading}
              footerClassName={FOOTER_CLASS}
              imagesHook={imagesHook}
            />
          </Tabs.TabPanel>

          <Tabs.TabPanel value="project-license-info" className={PANEL_CLASS}>
            <ULBProjectLicenseTab
              formData={form.formData}
              t={t}
              onFieldChange={form.handleFieldChange}
              onFieldBlur={form.handleFieldBlur}
              getFieldError={form.getFieldError}
              onLicenseFieldChange={form.handleLicenseChange}
              onGenerateLicenseKey={form.generateLicenseKey}
              onSave={() => {
                if (!isSaving) void handleSaveSection('project-license-info');
              }}
              onPrevious={() => goTo('logo-images')}
              onNext={() => goTo('department-license')}
              isSaving={isSaving}
              footerClassName={FOOTER_CLASS}
            />
          </Tabs.TabPanel>

          <Tabs.TabPanel value="department-license" className={PANEL_CLASS}>
            <ULBDepartmentLicenseTab
              t={t}
              filtered={depts.filtered}
              totalCount={depts.departments.length}
              activeCount={depts.activeCount}
              searchQuery={depts.searchQuery}
              onSearchChange={depts.setSearchQuery}
              master={{
                startDate: form.formData.licenseStartDate,
                duration: form.formData.licenseDuration,
                endDate: form.formData.licenseEndDate,
              }}
              onToggle={depts.toggle}
              onDateChange={depts.updateDate}
              onEnableAll={() =>
                depts.enableAll({
                  startDate: form.formData.licenseStartDate,
                  duration: form.formData.licenseDuration,
                  endDate: form.formData.licenseEndDate,
                })
              }
              onDisableAll={depts.disableAll}
              onPrevious={() => goTo('project-license-info')}
              onSaveProgress={() => {
                if (!isSaving && !depts.isSavingLicences) void handleSaveDepartments();
              }}
              onFinalize={() => {
                if (!isSaving && !depts.isSavingLicences) void handleFinalSave();
              }}
              isSaving={isSaving || depts.isSavingLicences}
              isLoadingDepartments={depts.isLoadingDepartments}
              footerClassName={FOOTER_CLASS}
            />
          </Tabs.TabPanel>
        </Tabs>
      </div>
    </div>
  );
}

