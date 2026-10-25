'use client';

import { Filter } from 'lucide-react';

import { Select } from '@/components/common/select';
import { SearchSelect } from '@/components/common/SearchSelect';
import { SearchInput } from '@/components/common/SearchInput';

import type { RevenueRecordsHeaderProps } from '@/types/assets/dashboard/revenue-dashboard/revenue-dashboard.types';

export function RevenueRecordsHeader({
  searchInput,
  setSearchInput,
  submitSearch,
  currentZoneId,
  currentWardId,
  currentType,
  currentStatus,
  zones,
  wards,
  allValue,
  onSetParams,
  copy,
}: RevenueRecordsHeaderProps) {

  return (
    <header className="border-b border-gray-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between gap-4 w-full">
        <form onSubmit={submitSearch} className="shrink-0">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder={copy.records.searchPlaceholder}
            className="w-64 mb-0"
          />
        </form>

        <div className="flex items-center gap-4 pb-1 xl:pb-0">
          <div className="flex items-center gap-2 text-gray-700 shrink-0">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-semibold">{copy.filters.label}:</span>
          </div>

          <div className="flex items-center gap-4">
            <SearchSelect
              name="headerZoneFilter"
              placeholder={copy.filters.allZones}
              options={[
                { label: copy.filters.allZones, value: allValue },
                ...zones.map((zone) => ({ label: zone.label, value: String(zone.id) })),
              ]}
              value={currentZoneId == null ? allValue : String(currentZoneId)}
              onChange={(_, val) => onSetParams({ zoneId: val === allValue ? null : Number(val), wardId: null }, { resetPage: true })}
              className="w-[180px]"
            />

            <SearchSelect
              name="headerWardFilter"
              placeholder={copy.filters.allWards}
              options={[
                { label: copy.filters.allWards, value: allValue },
                ...wards.map((ward) => ({ label: ward.label, value: String(ward.id) })),
              ]}
              value={currentWardId == null ? allValue : String(currentWardId)}
              onChange={(_, val) => onSetParams({ wardId: val === allValue ? null : Number(val) }, { resetPage: true })}
              className="w-[180px]"
            />

            <Select
              ariaLabel={copy.filters.type}
              placeholder={copy.filters.allTypes}
              options={[
                { label: copy.filters.allTypes, value: allValue },
                { label: copy.cards.lease, value: 'Lease' },
                { label: copy.cards.rent, value: 'Rent' },
              ]}
              value={currentType}
              onChange={(_, val) => onSetParams({ type: val }, { resetPage: true })}
              className="w-[180px]"
            />

            <Select
              ariaLabel={copy.filters.status}
              placeholder={copy.filters.allStatuses}
              options={[
                { label: copy.filters.allStatuses, value: allValue },
                { label: copy.records.statusPaid, value: 'Paid' },
                { label: copy.records.statusUnpaid, value: 'Unpaid' },
              ]}
              value={currentStatus}
              onChange={(_, val) => onSetParams({ status: val }, { resetPage: true })}
              className="w-[180px]"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
