'use client';

/**
 * useMunicipalDepartments Hook
 * Symmetrical Layer: src/hooks/grievance/shared/
 *
 * 100% Live Backend Integration via fetchDepartmentsAction.
 * Zero seed data / Zero mock fallbacks.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { MunicipalDepartment } from '@/types/grievance';
import type { GrievanceDepartment } from '@/types/grievance/department-master.types';
import { MUNICIPAL_CATEGORIES } from '@/lib/constants/grievance';
import { fetchDepartmentsAction } from '@/lib/actions/grievance/admin/grievance-department-master.actions';
import { notifyDepartmentCountChanged } from './useDepartmentCount';

const CATEGORY_KEYWORDS: Array<[string, RegExp]> = [
  ['water-sewerage', /water|sewer|drain/],
  ['engineering', /work|road|bridge|build|construct|project|civil/],
  ['health-sanitation', /solid waste|waste|health|sanitat|clean|conserv|hospital|medic/],
  ['electrical', /electric|light|power|energy/],
  ['environment', /garden|park|tree|environ|forest|pollut/],
  ['revenue-tax', /tax|revenue|assess|octroi|audit|finance|account/],
  ['town-planning', /town|plan|estate|encroach|land|slum|build plan/],
  ['social-welfare', /welfare|social|women|child|disab|senior|school|educat|cultur|sport/],
  ['emergency', /fire|disaster|emerg|rescue|flood|defen/],
  ['transport', /transport|traffic|vehicle|parking|bus|vending|market/],
];

export function resolveCategoryFromName(name?: string, backendCat?: string): string {
  const n = (name || '').toLowerCase();
  if (backendCat && backendCat !== 'General Administration') {
    const bc = backendCat.toLowerCase().replace(/\s+/g, '-');
    const valid = [
      'engineering', 'health-sanitation', 'water-sewerage', 'electrical',
      'environment', 'revenue-tax', 'town-planning', 'social-welfare',
      'administration', 'emergency', 'transport',
    ];
    if (valid.includes(bc)) return bc;
  }
  for (const [cat, regex] of CATEGORY_KEYWORDS) {
    if (regex.test(n)) return cat;
  }
  return 'administration';
}

export function mapBackendDeptToMunicipal(
  dept: GrievanceDepartment,
  index: number
): MunicipalDepartment {
  const cleanId = String(dept.id || index + 1);
  const srNo = dept.srNo || Number(dept.id) || index + 1;
  const cleanName = dept.nameEn?.trim() || `Department #${srNo}`;
  const cleanNameMr = dept.nameMr?.trim() || cleanName;

  const category = resolveCategoryFromName(cleanName, dept.category);
  const catObj = MUNICIPAL_CATEGORIES.find((c) => c.id === category);

  const resolvedGrievanceTypes = dept.grievanceTypes?.length
    ? dept.grievanceTypes
    : [];

  const raw = dept as unknown as Record<string, unknown>;
  const hod = typeof raw.hod === 'string' ? raw.hod : (typeof raw.hodName === 'string' ? raw.hodName : undefined);
  const phone = typeof raw.phone === 'string' ? raw.phone : undefined;
  const email = typeof raw.email === 'string' ? raw.email : undefined;

  return {
    id: cleanId,
    srNo,
    nameEn: cleanName,
    nameMr: cleanNameMr,
    category,
    categoryMr: catObj?.nameMr || '',
    icon: catObj?.icon || '🏢',
    hod,
    phone,
    email,
    subOffices: dept.subOffices?.length ? dept.subOffices : [],
    grievanceTypes: resolvedGrievanceTypes,
    fields: [],
  };
}

export interface UseMunicipalDepartmentsOptions {
  initialData?: MunicipalDepartment[];
  autoFetch?: boolean;
}

export function useMunicipalDepartments({
  initialData,
  autoFetch = true,
}: UseMunicipalDepartmentsOptions = {}) {
  const [departments, setDepartments] = useState<MunicipalDepartment[]>(
    initialData && initialData.length > 0 ? initialData : []
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [isLiveApi, setIsLiveApi] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Delegate to fetchDepartmentsAction from grievance-department-master.actions (active only for citizen views)
      const res = await fetchDepartmentsAction({ pageSize: 100, status: 'active' });
      if (res.success && res.data?.items && res.data.items.length > 0) {
        // Double filter as defensive guard
        const activeItems = res.data.items.filter((d) => d.isActive !== false);
        const mapped = activeItems.map((d, i) => mapBackendDeptToMunicipal(d, i));
        setDepartments(mapped);
        setIsLiveApi(true);
        notifyDepartmentCountChanged(res.data.total || mapped.length);
      } else {
        setDepartments([]);
        setIsLiveApi(false);
      }
    } catch (err) {
      setDepartments([]);
      setIsLiveApi(false);
      setError((err as Error).message || 'Failed to connect to backend service');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      const timer = setTimeout(() => { void loadDepartments(); }, 0);
      return () => clearTimeout(timer);
    }
  }, [autoFetch, loadDepartments]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: departments.length };
    departments.forEach((dept) => {
      counts[dept.category] = (counts[dept.category] || 0) + 1;
    });
    return counts;
  }, [departments]);

  return {
    departments,
    loading,
    isLiveApi,
    error,
    retry: loadDepartments,
    categoryCounts,
  };
}
