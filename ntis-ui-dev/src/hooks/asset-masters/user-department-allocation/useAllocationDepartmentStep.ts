"use client";

import { useState, useMemo, useCallback } from "react";
import type { OwningDepartmentOption } from "@/types/asset-masters/user-department-allocation.types";

interface UseAllocationDepartmentStepProps {
  owningDepartments: OwningDepartmentOption[];
  initialDeptIds: number[];
  onDepartmentSelectionChange?: () => void;
}

export function useAllocationDepartmentStep({
  owningDepartments,
  initialDeptIds,
  onDepartmentSelectionChange,
}: UseAllocationDepartmentStepProps) {
  const [selectedDeptIds, setSelectedDeptIds] = useState<number[]>(initialDeptIds);
  const [deptSearch, setDeptSearch] = useState("");

  const filteredDepts = useMemo(() => {
    if (!deptSearch.trim()) return owningDepartments || [];
    const q = deptSearch.toLowerCase().trim();
    return (owningDepartments || []).filter(
      (d) =>
        d.owningDepartmentName.toLowerCase().includes(q) ||
        (d.description && d.description.toLowerCase().includes(q))
    );
  }, [owningDepartments, deptSearch]);

  const toggleDept = useCallback((deptId: number) => {
    onDepartmentSelectionChange?.();
    const n = Number(deptId);
    setSelectedDeptIds((prev) =>
      prev.some((id) => Number(id) === n)
        ? prev.filter((id) => Number(id) !== n)
        : [...prev, n]
    );
  }, [onDepartmentSelectionChange]);

  const selectAllDepts = useCallback(() => {
    onDepartmentSelectionChange?.();
    setSelectedDeptIds((prev) =>
      Array.from(new Set([...prev, ...filteredDepts.map((d) => Number(d.id))]))
    );
  }, [filteredDepts, onDepartmentSelectionChange]);

  const clearAllDepts = useCallback(() => {
    onDepartmentSelectionChange?.();
    setSelectedDeptIds([]);
  }, [onDepartmentSelectionChange]);

  const resetDepartments = useCallback((newIds: number[]) => {
    setSelectedDeptIds(newIds);
    setDeptSearch("");
  }, []);

  return {
    selectedDeptIds,
    setSelectedDeptIds,
    deptSearch,
    setDeptSearch,
    filteredDepts,
    toggleDept,
    selectAllDepts,
    clearAllDepts,
    resetDepartments,
  };
}
