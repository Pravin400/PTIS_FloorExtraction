import React from 'react';
import { ModuleForm } from '@/components/modules/configuration-settings/module-master/ModuleForm';
import { getAllDepartmentMastersAction, getModuleMastersSummaryAction } from '../actions';
import type { DepartmentMaster } from '@/types/departmentMaster.types';

export default async function AddPage(): Promise<React.ReactElement> {
  const [departmentResult, existingModulesResult] = await Promise.all([
    getAllDepartmentMastersAction(),
    getModuleMastersSummaryAction(),
  ]);

  const departmentData = departmentResult.success ? departmentResult.data || [] : [];
  const existingModules = existingModulesResult.success ? existingModulesResult.data || [] : [];

  const departmentOptions = departmentData.map((d: DepartmentMaster) => ({
    label: d.departmentName,
    value: String(d.departmentId || 0),
  }));

  return (
    <ModuleForm
      id={null}
      initialData={undefined}
      departmentOptions={departmentOptions}
      existingModules={existingModules}
    />
  );
}
