/**
 * Data Fetcher Utilities for Grievance Category Master
 */
import type { GrievanceCategory } from '@/types/grievance-category-master/grievanceCategory.types';
import type { DepartmentMaster } from '@/types/departmentMaster.types';

type CategoryFilters = { search?: string; departmentId?: number; status?: 'active' | 'inactive' };
type ServerCategoryFilters = { departmentId?: number; isActive?: boolean };

export function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : fallback;
}

export function parseDepartmentId(value: string | undefined): number | undefined {
  if (!value || value === 'all') return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : undefined;
}

export function parseStatus(value: string | undefined): 'active' | 'inactive' | undefined {
  return value === 'active' || value === 'inactive' ? value : undefined;
}

export function parseSearchParams(params: {
  pageSize?: string;
  page?: string;
  search?: string;
  department?: string;
  status?: string;
}) {
  const { pageSize, page, department, status } = params;
  const requestedPageSize = parsePositiveInteger(pageSize, 10);
  const requestedPageNumber = parsePositiveInteger(page, 1);
  const departmentId = parseDepartmentId(department);
  const normalizedStatus = parseStatus(status);
  const serverFilters: ServerCategoryFilters = {
    ...(departmentId ? { departmentId } : {}),
    ...(normalizedStatus ? { isActive: normalizedStatus === 'active' } : {}),
  };
  return { requestedPageSize, requestedPageNumber, serverFilters };
}

export function calculateStats(categories: GrievanceCategory[], totalCount?: number) {
  const total =
    totalCount !== undefined ? totalCount : Array.isArray(categories) ? categories.length : 0;

  if (!Array.isArray(categories) || categories.length === 0) {
    return { total, critical: 0, active: 0, avgSla: 0, isPartial: false };
  }

  // CRIT-2 FIX: Track if stats are computed from a subset
  const isPartial = totalCount !== undefined && categories.length < totalCount && totalCount > 0;

  const criticalCount = categories.filter((c) => c.priority?.toLowerCase() === 'critical').length;
  const activeCount = categories.filter((c) => c.isActive).length;
  const slaValues = categories
    .map((c) => {
      const sla = c.resolutionSla;
      if (typeof sla === 'number') return sla;
      if (typeof sla === 'string') return parseInt(sla, 10);
      return NaN;
    })
    .filter((v) => !isNaN(v) && v >= 0);
  const avgSla =
    slaValues.length > 0
      ? Math.round(slaValues.reduce((sum, v) => sum + v, 0) / slaValues.length)
      : 0;

  return {
    total,
    critical: criticalCount,
    active: activeCount,
    avgSla,
    isPartial,
    sampleSize: categories.length,
  };
}

export function filterCategories(
  categories: GrievanceCategory[],
  filters: CategoryFilters
): GrievanceCategory[] {
  let result = [...categories];
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    result = result.filter(
      (c) =>
        c.categoryName?.toLowerCase().includes(searchLower) ||
        c.categoryCode?.toLowerCase().includes(searchLower)
    );
  }
  if (filters.departmentId) {
    result = result.filter((c) => c.departmentId === filters.departmentId);
  }
  if (filters.status === 'active') result = result.filter((c) => c.isActive);
  else if (filters.status === 'inactive') result = result.filter((c) => !c.isActive);
  return result;
}

export function getDepartmentMap(departments: DepartmentMaster[]): Map<number, string> {
  const map = new Map<number, string>();
  departments.forEach((d) => {
    if (d.departmentId) {
      map.set(d.departmentId, d.departmentName);
    }
  });
  return map;
}
