'use client';

import { useState, useMemo } from 'react';
import { ZONE_CONFIG, type ZoneConfigItem } from '@/lib/constants/grievance';


import { useMunicipalDepartments } from './useMunicipalDepartments';

// ─── Re-export DTO interfaces for backward compatibility ─────────────────────
export interface DepartmentMasterDto {
  departmentId: number;
  departmentName: string;
  officeDivisionName?: string;
  grievanceNatureName?: string;
}

export interface WardMasterDto {
  id: number;
  wardNo: string;
  description?: string;
  zoneId: number;
  zoneNo?: string;
  sequenceNo?: number;
}

export interface ZoneMasterDto {
  id: number;
  zoneNo: string;
  description?: string;
  sequenceNo?: number;
}

export interface ComplaintTypeMasterDto {
  id: number;
  complaintTypeName: string;
  departmentId: number;
  defaultSlaHours?: number;
}

// ─── Static Zone Data (from ZONE_CONFIG — 5 AMC Administrative Zones) ────────
const STATIC_ZONES: ZoneMasterDto[] = Object.values(ZONE_CONFIG).map((zone: ZoneConfigItem) => ({
  id: zone.id,
  zoneNo: zone.char || `Z${zone.id}`,
  description: zone.name,
  sequenceNo: zone.id,
}));

/**
 * @deprecated Superseded by `useMunicipalDepartments`.
 * Dynamically delegates to live municipal departments API to avoid returning empty mock data.
 */
export function useMasterData(selectedZoneId?: number) {
  const { departments: liveDepts, loading, error, retry: refetch } = useMunicipalDepartments();

  const departments: DepartmentMasterDto[] = useMemo(
    () =>
      liveDepts.map((d) => ({
        departmentId: Number(d.id) || d.srNo || 0,
        departmentName: d.nameEn,
        officeDivisionName: d.category,
        grievanceNatureName: d.grievanceTypes?.[0] || '',
      })),
    [liveDepts]
  );

  const [wards] = useState<WardMasterDto[]>([]);
  const [zones] = useState<ZoneMasterDto[]>(STATIC_ZONES);

  // If a zone is selected, filter wards belonging to that zone
  const filteredWards = useMemo(
    () => (selectedZoneId ? wards.filter((w) => w.zoneId === selectedZoneId) : wards),
    [selectedZoneId, wards]
  );

  return {
    departments,
    wards: filteredWards,
    allWards: wards,
    zones,
    loading,
    isLive: true,
    error: error || null,
    refetch,
  };
}

export default useMasterData;

