'use client';

import { Layers, Shield, CheckCircle2 } from 'lucide-react';
import { Badge, Button, Card, CardContent, Select } from '@/components/common';
import { ModuleAccessStepProps } from '@/types/user-management';
import { parseBoolean } from '@/lib/utils/type-guards';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

export function ModuleAccessStep({
  formData,
  setFormData,
  departments,
  modules,
  roles,
  setCurrentTab,
  toggleModule,
  selectAllModules,
  deselectAllModules,
  t,
}: ModuleAccessStepProps) {
  const departmentLabel = useAliasLabel('Department', t('aliasFallback.department'));
  const moduleLabel = useAliasLabel('Module', t('aliasFallback.module'));
  const roleLabel = useAliasLabel('Role', t('aliasFallback.role'));

  if (formData.departmentIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-12">
        <div className="p-4 bg-white rounded-full shadow-sm">
          <Layers className="w-12 h-12 text-slate-300" />
        </div>

        <div className="text-center">
          <p className="text-lg font-semibold text-slate-600">
            {t('form.noDeptsSelected', { department: departmentLabel })}
          </p>
          <p className="text-sm max-w-xs">
            {t('form.selectDeptPrompt', { department: departmentLabel })}
          </p>
        </div>

        <Button variant="secondary" onClick={() => setCurrentTab('departments')} className="mt-2">
          {t('form.goToDepts', { department: departmentLabel })}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 px-2 overflow-visible">
      <div className="flex-1 overflow-y-auto pr-2 pt-2 pb-80">
        <div className="space-y-4">
          {formData.departmentIds.map((deptId: string) => {
            const dept = departments.find(
              (d) => String(d.id || d.departmentMasterId) === String(deptId)
            );

            const deptModules = modules.filter((m) => {
              const mDeptId = String(
                m.departmentMasterId ||
                  m.departmentId ||
                  m.departmentID ||
                  m.departmentMasterID ||
                  ''
              );

              if (mDeptId !== String(deptId)) {
                return false;
              }

              const moduleId = String(m.id || m.moduleMasterId);

              const isCurrentlyAssigned = formData.moduleAccess[deptId]?.includes(moduleId);

              const isModuleActive =
                m.isActive === undefined || m.isActive === null ? true : parseBoolean(m.isActive);

              return isModuleActive || isCurrentlyAssigned;
            });

            return (
              <Card key={deptId} className="overflow-visible border-2 border-slate-200 shadow-sm">
                <div className="bg-slate-50 px-4 py-3 border-b flex items-center justify-between rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-white border-slate-300">
                      {dept?.departmentCode}
                    </Badge>

                    <h4 className="font-bold text-slate-700">{dept?.departmentName}</h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-indigo-600"
                      onClick={() => selectAllModules(deptId, deptModules)}
                    >
                      {t('actions.selectAll')}
                    </Button>

                    <span className="text-slate-300">|</span>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-rose-600"
                      onClick={() => deselectAllModules(deptId)}
                    >
                      {t('actions.deselectAll')}
                    </Button>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    {deptModules.length > 0 ? (
                      deptModules.map((module) => {
                        const moduleId = String(module.id || module.moduleMasterId);

                        const isSelected = formData.moduleAccess[deptId]?.includes(moduleId);

                        const isModuleActive =
                          module.isActive === undefined || module.isActive === null
                            ? true
                            : parseBoolean(module.isActive);

                        return (
                          <div
                            key={moduleId}
                            onClick={() => toggleModule(deptId, moduleId)}
                            className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between group ${
                              isSelected
                                ? 'border-indigo-500 bg-indigo-50 shadow-sm ring-1 ring-indigo-500/20'
                                : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-lg transition-colors ${
                                  isSelected
                                    ? 'bg-indigo-500 text-white'
                                    : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                <Layers className="w-4 h-4" />
                              </div>

                              <div>
                                <p className="font-semibold text-slate-700 text-sm">
                                  {module.moduleName}

                                  {!isModuleActive && (
                                    <span className="text-xs text-rose-500 font-normal ml-2">
                                      ({t('filters.inactive')})
                                    </span>
                                  )}
                                </p>

                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                                  {module.moduleCode}
                                </p>
                              </div>
                            </div>

                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'border-indigo-500 bg-indigo-500 text-white'
                                  : 'border-slate-200'
                              }`}
                            >
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-2 text-center py-4 text-slate-400 text-sm">
                        {t('form.noModulesForDept', {
                          module: moduleLabel,
                          department: departmentLabel,
                        })}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-3.5 h-3.5 text-blue-600" />

                      <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">
                        {t('roles.title', { role: roleLabel })}
                      </span>
                    </div>

                    <Select
                      options={roles
                        .filter((role) => {
                          if (!role.isActive) return false;

                          // Filter role by department assignment if departmentId/departmentName is specified
                          if (role.departmentId !== undefined && role.departmentId !== null) {
                            const roleDeptId = String(role.departmentId);
                            const currentDeptId = String(deptId);
                            const masterDeptId = String(dept?.id || dept?.departmentMasterId || '');
                            if (roleDeptId !== currentDeptId && roleDeptId !== masterDeptId) {
                              return false;
                            }
                          } else if (role.departmentName && dept?.departmentName) {
                            if (
                              role.departmentName.trim().toLowerCase() !==
                              dept.departmentName.trim().toLowerCase()
                            ) {
                              return false;
                            }
                          }

                          return true;
                        })
                        .map((role) => ({
                          label: role.name,
                          value: String(role.userRoleId),
                        }))}
                      value={
                        formData.roleAccess[deptId]?.[0]
                          ? String(formData.roleAccess[deptId][0])
                          : ''
                      }
                      onChange={(_e, val) => {
                        const ids = val ? [Number(val)] : [];

                        setFormData({
                          ...formData,
                          roleAccess: {
                            ...formData.roleAccess,
                            [deptId]: ids,
                          },
                        });
                      }}
                      placeholder={
                        t('form.rolePlaceholder', { role: roleLabel }) || `Select ${roleLabel}`
                      }
                      className="bg-white h-8 text-xs [&_button]:h-8 [&_button]:text-xs [&_button]:py-1 [&_ul]:top-full [&_ul]:bottom-auto [&_ul]:mt-1 [&_ul]:mb-0"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
