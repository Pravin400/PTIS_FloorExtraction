/**
 * On-The-Go Officers & Directory Hook
 * Path: src/hooks/grievance/admin/useOnTheGoOfficers.ts
 *
 * Provides dynamic cascading lookups for Zones, Wards, Departments, and Officers
 * strictly from live backend API responses.
 * Line ceiling: <= 300 lines.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import type { OnTheGoOfficerOption, OnTheGoCategoryOption } from '@/types/grievance/on-the-go.types';
import { ZONE_CONFIG } from '@/lib/constants/grievance';
import { fetchDepartmentsAction } from '@/lib/actions/grievance/admin/grievance-department-master.actions';
import { fetchGrievanceDepartmentUsersAction } from '@/lib/actions/grievance/admin/grievance-department-user.actions';
import { fetchGrievanceTypesAction } from '@/lib/actions/grievance/admin/grievance-type.actions';

export interface WardOption {
  wardNumber: number;
  label: string;
}

export interface ZoneOption {
  id: number;
  name: string;
  char: string;
  wards: WardOption[];
}

export function useOnTheGoOfficers(
  selectedZoneId?: number | null,
  selectedWardNumber?: number | null,
  selectedDepartmentId?: string | null
) {
  const [departments, setDepartments] = useState<Array<{ id: string; nameEn: string }>>([]);
  const [categories, setCategories] = useState<OnTheGoCategoryOption[]>([]);
  const [departmentOfficers, setDepartmentOfficers] = useState<OnTheGoOfficerOption[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState<boolean>(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(false);
  const [isLoadingOfficers, setIsLoadingOfficers] = useState<boolean>(false);

  // 1. Fetch live backend departments on mount
  useEffect(() => {
    let mounted = true;
    async function loadDepts() {
      try {
        setIsLoadingDepartments(true);
        const res = await fetchDepartmentsAction({ status: 'active', pageSize: 100 });
        if (mounted && res.success && res.data && res.data.items && res.data.items.length > 0) {
          setDepartments(
            res.data.items.map((d: { id: string | number; nameEn: string }) => ({
              id: String(d.id),
              nameEn: d.nameEn,
            }))
          );
        }
      } catch {
        if (mounted) setDepartments([]);
      } finally {
        if (mounted) setIsLoadingDepartments(false);
      }
    }
    loadDepts();
    return () => {
      mounted = false;
    };
  }, []);

  // 2. Fetch live department officers dynamically from GET /api/GrievanceDepartment/{id}/users
  useEffect(() => {
    let mounted = true;
    async function loadDeptOfficers() {
      if (!selectedDepartmentId) {
        setDepartmentOfficers([]);
        return;
      }
      try {
        setIsLoadingOfficers(true);
        const res = await fetchGrievanceDepartmentUsersAction(selectedDepartmentId);
        if (mounted && res.success && Array.isArray(res.data) && res.data.length > 0) {
          const mapped: OnTheGoOfficerOption[] = res.data.map((u) => ({
            id: u.userId || u.id,
            name: u.fullName,
            designation: u.designation || 'Department Officer',
            departmentId: String(u.departmentId || selectedDepartmentId),
            departmentName: '',
            zoneId: u.zoneId ?? undefined,
            wardNumber: u.wardId ?? undefined,
            phone: u.mobileNo,
            email: u.email,
          }));
          setDepartmentOfficers(mapped);
        } else if (mounted) {
          setDepartmentOfficers([]);
        }
      } catch {
        if (mounted) setDepartmentOfficers([]);
      } finally {
        if (mounted) setIsLoadingOfficers(false);
      }
    }
    loadDeptOfficers();
    return () => {
      mounted = false;
    };
  }, [selectedDepartmentId]);

  // 3. Fetch live department categories (Grievance Types) dynamically
  useEffect(() => {
    let mounted = true;
    async function loadDeptCategories() {
      if (!selectedDepartmentId) {
        setCategories([]);
        return;
      }
      try {
        setIsLoadingCategories(true);
        const res = await fetchGrievanceTypesAction({
          grievanceDepartmentId: Number(selectedDepartmentId),
          isActive: true,
        });
        if (mounted && res.success && Array.isArray(res.data) && res.data.length > 0) {
          const mapped: OnTheGoCategoryOption[] = res.data.map((t) => ({
            id: t.id,
            name: t.grievanceType,
            departmentId: t.grievanceDepartmentId,
          }));
          setCategories(mapped);
        } else if (mounted) {
          setCategories([]);
        }
      } catch {
        if (mounted) setCategories([]);
      } finally {
        if (mounted) setIsLoadingCategories(false);
      }
    }
    loadDeptCategories();
    return () => {
      mounted = false;
    };
  }, [selectedDepartmentId]);

  // 4. Build Zone and Ward hierarchy from ZONE_CONFIG
  const zones: ZoneOption[] = useMemo(() => {
    return Object.values(ZONE_CONFIG).map((zc) => {
      const wards: WardOption[] = [];
      const count = Math.min(zc.wardsCount || 5, 25);
      for (let i = 1; i <= count; i++) {
        wards.push({
          wardNumber: i,
          label: `Ward ${i}`,
        });
      }
      return {
        id: zc.id,
        name: zc.name.split(' - ')[1] || zc.name,
        char: zc.char,
        wards,
      };
    });
  }, []);

  // 5. Filter live officers by selected zone/ward if specified
  const availableOfficers = useMemo(() => {
    if (departmentOfficers.length === 0) return [];
    const filtered = departmentOfficers.filter((officer) => {
      if (selectedZoneId && officer.zoneId && officer.zoneId !== selectedZoneId) {
        return false;
      }
      if (selectedWardNumber && officer.wardNumber && officer.wardNumber !== selectedWardNumber) {
        return false;
      }
      return true;
    });
    return filtered.length > 0 ? filtered : departmentOfficers;
  }, [departmentOfficers, selectedZoneId, selectedWardNumber]);

  return {
    zones,
    departments,
    categories,
    officers: availableOfficers,
    isLoading: isLoadingDepartments || isLoadingOfficers || isLoadingCategories,
    isLoadingCategories,
  };
}
