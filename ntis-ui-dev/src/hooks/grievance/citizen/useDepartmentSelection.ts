'use client';

import { useState, useEffect, useCallback } from 'react';
import type { MunicipalDepartment } from '@/types/grievance';
import type { GrievanceTypeItem } from '@/types/grievance/department-master.types';
import { findDepartment, resolveGrievanceTypeItem } from '@/lib/utils/grievance';
import { fetchGrievanceTypesAction } from '@/lib/actions/grievance/admin/grievance-type.actions';

interface UseDepartmentSelectionProps {
  isOpen: boolean;
  defaultDepartmentId?: string;
  defaultCategory?: string;
  liveDepartments: MunicipalDepartment[];
}

export function useDepartmentSelection({
  isOpen,
  defaultDepartmentId,
  defaultCategory,
  liveDepartments,
}: UseDepartmentSelectionProps) {
  const resolveInitialDept = useCallback(() => {
    return defaultDepartmentId
      ? findDepartment(defaultDepartmentId, liveDepartments)
      : defaultCategory
        ? findDepartment(defaultCategory, liveDepartments)
        : null;
  }, [defaultDepartmentId, defaultCategory, liveDepartments]);

  const [selectedDept, setSelectedDept] = useState<MunicipalDepartment | null>(resolveInitialDept);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [defectType, setDefectType] = useState<string>('');

  // Adjust department/defectType during render when modal opens or closes
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) {
      setDefectType('');
    } else if (!selectedDept) {
      setSelectedDept(resolveInitialDept());
    }
  }

  const deptId = selectedDept?.srNo || (selectedDept?.id ? Number(selectedDept.id) : undefined);

  // Live grievance types fetched from backend API (zero mock fallbacks)
  const [backendTypes, setBackendTypes] = useState<GrievanceTypeItem[] | null>(null);

  // Adjust defectType when department changes during render
  const [prevDeptIdForDefect, setPrevDeptIdForDefect] = useState<number | string | undefined>(selectedDept?.id);
  if (selectedDept?.id !== prevDeptIdForDefect) {
    setPrevDeptIdForDefect(selectedDept?.id);
    setBackendTypes(null);
  }

  const defectTypes = backendTypes ?? [];
  const isLoadingDefectTypes = backendTypes === null && Boolean(deptId);
  const setDefectTypes = useCallback((types: GrievanceTypeItem[]) => {
    setBackendTypes(types);
  }, []);

  // Fetch live grievance types from backend for selected department (async callback only)
  useEffect(() => {
    if (!deptId || isNaN(deptId)) {
      const timer = setTimeout(() => setBackendTypes([]), 0);
      return () => clearTimeout(timer);
    }

    let isMounted = true;

    fetchGrievanceTypesAction({ grievanceDepartmentId: deptId, pageSize: 100 })
      .then((res) => {
        if (!isMounted) return;
        if (res.success && Array.isArray(res.data)) {
          const activeTypes = res.data.filter((t) => t.isActive);
          if (activeTypes.length > 0) {
            setBackendTypes(activeTypes);
            setDefectType((prev) => {
              if (!prev) return '';
              const matched = resolveGrievanceTypeItem(prev, activeTypes);
              return matched ? matched.grievanceType : prev;
            });
            return;
          }
        }
        setBackendTypes([]);
      })
      .catch((err) => {
        console.warn('Error fetching department grievance types:', err);
        if (isMounted) {
          setBackendTypes([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [deptId]);

  return {
    selectedDept,
    setSelectedDept,
    isDeptModalOpen,
    setIsDeptModalOpen,
    defectType,
    setDefectType,
    defectTypes,
    setDefectTypes,
    isLoadingDefectTypes,
    resolveInitialDept,
  };
}
