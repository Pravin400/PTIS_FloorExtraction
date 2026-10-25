'use client';

import React from 'react';
import { SearchWingWiseFilters, PtisTaxMode } from '@/types/property-tax/apartment';
import { PtisPaginationInfo } from '@/hooks/property-tax/apartment';
import { PtisSearchHeaderFilters } from './PtisSearchHeaderFilters';

import { WingWiseWingDetails } from '@/types/property-tax/apartment';

interface PtisSearchHeaderProps {
  filters: SearchWingWiseFilters;
  paginationInfo?: PtisPaginationInfo;
  onFilterChange: (filters: SearchWingWiseFilters) => void;
  onSearch: (updatedFilters?: SearchWingWiseFilters) => void;
  onReset?: () => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  isLoading?: boolean;
  taxMode?: PtisTaxMode;
  onTaxModeChange?: (mode: PtisTaxMode) => void;
  onRestoreAll?: () => void;
  hiddenPanelsCount?: number;
  wings?: WingWiseWingDetails[];
  availableFloors?: string[];
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const PtisSearchHeader: React.FC<PtisSearchHeaderProps> = ({
  filters,
  paginationInfo,
  onFilterChange,
  onSearch,
  onRestoreAll,
  hiddenPanelsCount = 0,
  wings = [],
  availableFloors = [],
  isFullscreen = false,
  onToggleFullscreen,
}) => {
  return (
    <div className="mx-3 mt-2 bg-white rounded-xl border border-zinc-200 shadow-xs shrink-0 flex flex-col font-sans select-none overflow-hidden">
      {/* Selects, Status Legend & Restore Action */}
      <PtisSearchHeaderFilters
        filters={filters}
        paginationInfo={paginationInfo}
        onFilterChange={onFilterChange}
        onSearch={onSearch}
        onRestoreAll={onRestoreAll}
        hiddenPanelsCount={hiddenPanelsCount}
        wings={wings}
        availableFloors={availableFloors}
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
      />
    </div>
  );
};
