'use client';

import { MapPin } from 'lucide-react';
import { SearchSelect } from '@/components/common/SearchSelect';

import type { RevenueFiltersProps } from '@/types/assets/dashboard/revenue-dashboard/revenue-dashboard.types';

const ALL = 'all';

/**
 * Presentational zone/ward filter group for the revenue dashboard header.
 * Id-based (so selections map to API ids); the owning screen decides how to
 * persist the change (URL navigation).
 */
export function RevenueFilters({
  zones,
  wards,
  selectedZoneId,
  selectedWardId,
  onZoneChange,
  onWardChange,
  filtersLabel,
  allZonesLabel,
  allWardsLabel,
}: RevenueFiltersProps) {
  const toId = (value: string): number | null => (value === ALL ? null : Number(value));

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
        <MapPin className="w-4 h-4 text-blue-600" />
        {filtersLabel}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
        <SearchSelect
          name="zoneFilter"
          placeholder={allZonesLabel}
          options={[
            { label: allZonesLabel, value: ALL },
            ...zones.map((zone) => ({ label: zone.label, value: String(zone.id) })),
          ]}
          value={selectedZoneId == null ? ALL : String(selectedZoneId)}
          onChange={(_, val) => onZoneChange(toId(val))}
          className="w-[180px]"
        />

        <SearchSelect
          name="wardFilter"
          placeholder={allWardsLabel}
          options={[
            { label: allWardsLabel, value: ALL },
            ...wards.map((ward) => ({ label: ward.label, value: String(ward.id) })),
          ]}
          value={selectedWardId == null ? ALL : String(selectedWardId)}
          onChange={(_, val) => onWardChange(toId(val))}
          className="w-[180px]"
        />
      </div>
    </div>
  );
}
