'use client';

import { MapPin } from 'lucide-react';
import { SearchSelect } from '@/components/common';
import { DashboardFiltersProps } from '@/types/assets/dashboard/master-dashboard/asset-dashboard.types';

export function DashboardFilters({
  zonesList,
  wardsList,
  activeZone,
  activeWard,
  onZoneChange,
  onWardChange,
  allZonesLabel,
  allWardsLabel,
  filtersLabel,
}: DashboardFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
        <MapPin className="w-4 h-4 text-blue-600" />
        {filtersLabel}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
        <SearchSelect
          id="dashboard-zone-filter"
          name="zone"
          placeholder={allZonesLabel}
          options={zonesList.map((z) => ({
            label: z === 'all' ? allZonesLabel : z,
            value: z,
          }))}
          value={activeZone}
          onChange={(_, value) => onZoneChange(value)}
          className="w-[180px]"
        />

        <SearchSelect
          id="dashboard-ward-filter"
          name="ward"
          placeholder={allWardsLabel}
          options={wardsList.map((w) => ({
            label: w === 'all' ? allWardsLabel : w,
            value: w,
          }))}
          value={activeWard}
          onChange={(_, value) => onWardChange(value)}
          className="w-[180px]"
        />
      </div>
    </div>
  );
}