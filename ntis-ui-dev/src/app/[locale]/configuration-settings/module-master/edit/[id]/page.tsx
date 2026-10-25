import React from 'react';
import { notFound } from 'next/navigation';
import { ModuleForm } from '@/components/modules/configuration-settings/module-master/ModuleForm';
import {
  getModuleMasterByIdAction,
  getAllDepartmentMastersAction,
  getModuleMastersSummaryAction,
} from '../../actions';
import type { DepartmentMaster } from '@/types/departmentMaster.types';

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPage({ params }: EditPageProps): Promise<React.ReactElement> {
  const { id } = await params;
  const moduleId = Number(id);

  if (isNaN(moduleId)) {
    notFound();
  }

  const [moduleResult, departmentResult, existingModulesResult] = await Promise.all([
    getModuleMasterByIdAction(moduleId),
    getAllDepartmentMastersAction(),
    getModuleMastersSummaryAction(),
  ]);

  if (!moduleResult.success || !moduleResult.data) {
    notFound();
  }

  const departmentData = departmentResult.success ? departmentResult.data || [] : [];
  const existingModules = existingModulesResult.success ? existingModulesResult.data || [] : [];

  const departmentOptions = departmentData.map((d: DepartmentMaster) => ({
    label: d.departmentName,
    value: String(d.departmentId || 0),
  }));

  return (
    <ModuleForm
      id={moduleId}
      initialData={moduleResult.data}
      departmentOptions={departmentOptions}
      existingModules={existingModules}
    />
  );
}
