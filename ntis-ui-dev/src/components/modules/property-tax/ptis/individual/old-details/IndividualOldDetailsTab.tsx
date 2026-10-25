'use client';

import React from 'react';
import type {
  OldFloorDetailsData,
  OldDetailsData,
  OldTaxesData,
  MappedPropertyItem,
} from '@/types/ptis.types';
import { IndividualOldTaxDetailsTable } from './IndividualOldTaxDetailsTable';
import {
  IndividualOldFieldsGrid,
  IndividualOldMapDetailsTable,
  IndividualOldFloorDetailsTable,
} from './components';
import { useIndividualOldDetailsTab } from './hooks';

export interface IndividualOldDetailsTabProps {
  propertyId?: number | string | null;
  showOldFloorInfo?: boolean;
  setShowOldFloorInfo?: (value: boolean) => void;
  showOldTaxInfo?: boolean;
  setShowOldTaxInfo?: (value: boolean) => void;
  showOldMapInfo?: boolean;
  setShowOldMapInfo?: (value: boolean) => void;
  oldFloorTableData?: OldFloorDetailsData[];
  oldDetailsData?: OldDetailsData;
  oldTaxesData?: OldTaxesData | null;
  mappedPropertiesData?: MappedPropertyItem[];
  onPropertyMapping?: () => void;
}

export const IndividualOldDetailsTab: React.FC<IndividualOldDetailsTabProps> = (props) => {
  const {
    effectiveShowFloor,
    effectiveShowTax,
    effectiveShowMap,
    currentDetails,
    currentFloors,
    currentTaxes,
    currentMapped,
    isLoadingFloors,
    isLoadingTaxes,
    isLoadingMapped,
    handleToggleMapDetails,
    handleToggleFloorDetails,
    handleToggleOldTax,
    handleNavigatePropertyMapping,
  } = useIndividualOldDetailsTab(props);

  return (
    <div className="p-0.5 space-y-2">
      {/* 12 Old details fields + 4 Contextual Action Buttons in a space-saving unified card */}
      <IndividualOldFieldsGrid
        currentDetails={currentDetails}
        effectiveShowMap={effectiveShowMap}
        effectiveShowFloor={effectiveShowFloor}
        effectiveShowTax={effectiveShowTax}
        isLoadingMapped={isLoadingMapped}
        isLoadingFloors={isLoadingFloors}
        isLoadingTaxes={isLoadingTaxes}
        onToggleMapDetails={handleToggleMapDetails}
        onToggleFloorDetails={handleToggleFloorDetails}
        onToggleOldTax={handleToggleOldTax}
        onNavigatePropertyMapping={handleNavigatePropertyMapping}
      />

      {/* Sub-tables: Dynamic Tax Details Section */}
      <IndividualOldTaxDetailsTable
        oldTaxesData={currentTaxes}
        showOldTaxInfo={effectiveShowTax}
        isLoading={isLoadingTaxes}
      />

      {/* Sub-tables: Map Details Table */}
      <IndividualOldMapDetailsTable
        showOldMapInfo={effectiveShowMap}
        mappedPropertiesData={currentMapped}
        isLoading={isLoadingMapped}
      />

      {/* Sub-tables: Floor Details Table */}
      <IndividualOldFloorDetailsTable
        showOldFloorInfo={effectiveShowFloor}
        oldFloorTableData={currentFloors}
        currentDetails={currentDetails}
        isLoading={isLoadingFloors}
      />
    </div>
  );
};

export default IndividualOldDetailsTab;
