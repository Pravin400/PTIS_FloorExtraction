/**
 * Register Department Section (Layer 2 - Presentation Component)
 * Path: src/components/modules/grievance/citizen/registration/RegisterDeptSection.tsx
 *
 * Single horizontal line layout for Department and Defect Type
 * using the standard SearchSelect common component.
 */

'use client';

import { useMemo } from 'react';
import { Building2, Layers } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SearchSelect, Label, type SearchSelectOption } from '@/components/common';
import type { MunicipalDepartment } from '@/types/grievance/department.types';

interface RegisterDeptSectionProps {
  selectedDept: MunicipalDepartment | null;
  departments: MunicipalDepartment[];
  onSelectDepartment: (dept: MunicipalDepartment) => void;
  showOfficerContact?: boolean;
  error?: string;
  isLoading?: boolean;
  defectType?: string;
  setDefectType?: (defect: string) => void;
  defectTypes?: Array<{ id?: string | number; grievanceType: string }>;
  defectTypeError?: string;
}

export function RegisterDeptSection({
  selectedDept,
  departments,
  onSelectDepartment,
  error,
  isLoading = false,
  defectType,
  setDefectType,
  defectTypes = [],
  defectTypeError,
}: RegisterDeptSectionProps) {
  const t = useTranslations('grievance');

  // 1. Dynamic SearchSelect options from API departments
  const departmentOptions: SearchSelectOption[] = useMemo(() => {
    return departments.map((dept) => ({
      value: String(dept.id),
      label: dept.nameEn || dept.nameMr || `Department ${dept.id}`,
    }));
  }, [departments]);

  // 2. Dynamic defect type options directly from API
  const defectTypeOptions: SearchSelectOption[] = useMemo(() => {
    return defectTypes.map((type) => ({
      value: type.grievanceType,
      label: type.grievanceType,
    }));
  }, [defectTypes]);

  const handleDepartmentDropdown = (_name: string, value: string) => {
    const matched = departments.find((dept) => String(dept.id) === value);
    if (matched) {
      onSelectDepartment(matched);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 items-start">
      {/* 1. Department Searchable Dropdown */}
      <div className="space-y-1">
        <Label required className="text-[10.5px] font-black text-slate-800 uppercase flex items-center gap-1 truncate m-0 p-0">
          <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="truncate">{t('department')}</span>
        </Label>

        <SearchSelect
          id="grievance-department-select"
          name="department"
          options={departmentOptions}
          value={selectedDept ? String(selectedDept.id) : ''}
          onChange={handleDepartmentDropdown}
          placeholder={t('selectDepartmentPlaceholder')}
          isLoading={isLoading}
          emptyMessage={t('noDeptFound')}
          error={error}
          className="text-xs font-semibold rounded-xl border-slate-200"
        />
      </div>

      {/* 2. Defect Type Searchable Dropdown */}
      <div className="space-y-1">
        <Label required className="text-[10.5px] font-black text-slate-800 uppercase flex items-center gap-1 truncate m-0 p-0">
          <Layers className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">{t('defectType')}</span>
        </Label>

        <SearchSelect
          id="grievance-defect-type-select"
          name="defectType"
          options={defectTypeOptions}
          value={defectType || ''}
          onChange={(_name, value) => setDefectType?.(value)}
          placeholder={t('defectType')}
          disabled={!selectedDept || defectTypes.length === 0}
          error={defectTypeError}
          className="text-xs font-semibold rounded-xl border-slate-200"
        />
      </div>
    </div>
  );
}
