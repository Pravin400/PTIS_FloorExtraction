'use client';

import { Users, ArrowLeft, ArrowRight } from 'lucide-react';
import { Drawer, Tabs, TabList, Tab, TabPanel, Button } from '@/components/common';
import { useTranslations } from 'next-intl';
import { UserFormProps } from '@/types/user-management';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';
import { BasicInfoStep } from './form-steps/BasicInfoStep';
import { DepartmentStep } from './form-steps/DepartmentStep';
import { ModuleAccessStep } from './form-steps/ModuleAccessStep';

export function UserForm({
  isOpen,
  onClose,
  editingUser,
  formData,
  setFormData,
  currentTab,
  setCurrentTab,
  handleSubmit,
  roles,
  departments,
  modules,
  isSubmitting,
  handleNext,
  handlePrevious,
  isFirstStep,
  isLastStep,
  currentIndex,
  toggleDepartment,
  toggleModule,
  selectAllModules,
  deselectAllModules,
  errors = {},
}: UserFormProps) {
  const t = useTranslations('userManagement');
  const userLabel = useAliasLabel('User', t('aliasFallback.user'));
  const departmentLabel = useAliasLabel('Department', t('aliasFallback.department'));
  const moduleLabel = useAliasLabel('Module', t('aliasFallback.module'));
  const roleLabel = useAliasLabel('Role', t('aliasFallback.role'));

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      width="lg"
      title={
        <div className="text-2xl flex items-center gap-3">
          <div className="p-2 bg-linear-to-br from-indigo-100 to-purple-100 rounded-lg">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-700">
              {editingUser ? t('actions.edit') : t('actions.add', { user: userLabel })}
            </span>
            <span className="text-sm text-slate-700 font-normal">
              {currentIndex === 0
                ? t('form.basicInfo')
                : currentIndex === 1
                  ? t('form.departments', { department: departmentLabel })
                  : t('form.moduleAccess', { module: moduleLabel })}
            </span>
          </div>
        </div>
      }
      footer={
        <>
          <div className="text-sm text-slate-500">
            {formData.departmentIds.length} {t('form.deptsSelected', { department: departmentLabel })} •{' '}
            {Object.values(formData.moduleAccess).flat().length} {t('form.modulesSelected', { module: moduleLabel })} •{' '}
            {Object.values(formData.roleAccess).flat().length} {t('form.rolesSelected', { role: roleLabel })}
          </div>
          <div className="flex items-center gap-3">
            {!isFirstStep && (
              <Button
                type="button"
                variant="secondary"
                onClick={handlePrevious}
                className="h-10 px-6 font-medium flex items-center gap-2 text-slate-700 border-slate-200 hover:bg-slate-50"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('actions.previous')}
              </Button>
            )}

            {isFirstStep && (
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="h-10 px-6 font-medium text-slate-700 border-slate-200 hover:bg-slate-50"
              >
                {t('actions.cancel')}
              </Button>
            )}

            {!isLastStep ? (
              <Button
                type="button"
                onClick={handleNext}
                className="h-10 px-8 font-bold text-white shadow-lg shadow-indigo-500/20 flex items-center gap-2"
              >
                {t('actions.next')}
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                form="user-management-form"
                disabled={isSubmitting}
                className="h-10 px-8 font-bold text-white shadow-lg shadow-indigo-500/20"
              >
                {isSubmitting
                  ? t('actions.saving')
                  : editingUser
                    ? t('actions.saveChanges')
                    : t('actions.createAccount')}
              </Button>
            )}
          </div>
        </>
      }
    >
      <form
        id="user-management-form"
        onSubmit={handleSubmit}
        className="flex flex-col h-full overflow-hidden"
      >
        <Tabs
          value={currentTab}
          onChange={(val: string | number) => setCurrentTab(val as string)}
          className="flex-1 flex flex-col overflow-hidden px-6"
        >
          <TabList className="grid w-full grid-cols-3 mb-4 overflow-hidden shrink-0">
            <Tab value="basic" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t('form.basicInfo')}
            </Tab>
            <Tab value="departments" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t('form.departments', { department: departmentLabel })}
            </Tab>
            <Tab value="modules" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t('form.moduleAccess', { module: moduleLabel })}
            </Tab>
          </TabList>

          <TabPanel value="basic" className="flex-1 overflow-y-auto mt-0 min-h-0">
            <BasicInfoStep
              formData={formData}
              setFormData={setFormData}
              editingUser={editingUser}
              t={t}
              errors={errors}
            />
          </TabPanel>

          <TabPanel value="departments" className="flex-1 overflow-y-auto mt-0 min-h-0">
            <DepartmentStep
              departments={departments}
              formData={formData}
              toggleDepartment={toggleDepartment}
            />
          </TabPanel>

          <TabPanel value="modules" className="flex-1 flex flex-col mt-0 min-h-0 overflow-visible">
            <ModuleAccessStep
              formData={formData}
              setFormData={setFormData}
              departments={departments}
              modules={modules}
              roles={roles}
              setCurrentTab={setCurrentTab}
              toggleModule={toggleModule}
              selectAllModules={selectAllModules}
              deselectAllModules={deselectAllModules}
              t={t}
            />
          </TabPanel>
        </Tabs>
      </form>
    </Drawer>
  );
}
