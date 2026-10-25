import React from 'react';
import { MasterTable, ValidationMessage } from '@/components/common';
import { cn } from '@/lib/utils/cn';
import type { ApplicationLevel, UnitSelectionItem, WingOption } from '@/types/building-permission.types';
import type { UnitStatusResolution } from '@/lib/utils/certificate-grid-mapper';
import { useUnitTableColumns } from './useUnitTableColumns';
import { BuildingUnitTableToolbar } from './BuildingUnitTableToolbar';
import { DEFAULT_UNIT_STATUS, type FieldErrors, type UnitRow, type ViewerData } from './building-permission.types';

interface BuildingUnitSelectionTableProps {
  isApartmentIndividual: boolean;
  level: ApplicationLevel;
  filteredUnits: UnitSelectionItem[];
  activeWings: WingOption[];
  selectedUnitIds: Set<number>;
  unitSearchQuery: string;
  setUnitSearchQuery: (val: string) => void;
  wingFilter: string;
  setWingFilter: (val: string) => void;
  statusFilter: 'all' | 'direct' | 'wing' | 'apartment' | 'none';
  setStatusFilter: (val: 'all' | 'direct' | 'wing' | 'apartment' | 'none') => void;
  appliedUnitsCount: number;
  handleClearSelection: () => void;
  isAllUnitsSelected: boolean;
  hasSelectableUnits?: boolean;
  handleToggleAllUnits: (forceSelect?: boolean) => void;
  handleToggleUnitSelection: (row: UnitRow) => void;
  handleEditUnit?: (row: UnitRow) => void;
  loadNextUnitsPage: () => void;
  isLoadingMoreUnits: boolean;
  fieldErrors: FieldErrors;
  unitStatusMap: Map<number | string, UnitStatusResolution>;
  setSelectedWingDetailId: (id: number | null) => void;
  setViewerData: (data: ViewerData | null) => void;
  locale: string;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export function BuildingUnitSelectionTable({
  isApartmentIndividual,
  level,
  filteredUnits,
  activeWings,
  selectedUnitIds,
  unitSearchQuery,
  setUnitSearchQuery,
  wingFilter,
  setWingFilter,
  statusFilter,
  setStatusFilter,
  appliedUnitsCount,
  handleClearSelection,
  isAllUnitsSelected,
  hasSelectableUnits,
  handleToggleAllUnits,
  handleToggleUnitSelection,
  handleEditUnit,
  loadNextUnitsPage,
  isLoadingMoreUnits,
  fieldErrors,
  unitStatusMap,
  setSelectedWingDetailId,
  setViewerData,
  locale,
  t,
}: BuildingUnitSelectionTableProps): React.ReactElement | null {
  const columns = useUnitTableColumns({
    filteredUnits,
    selectedUnitIds,
    isAllUnitsSelected,
    hasSelectableUnits,
    handleToggleAllUnits,
    handleToggleUnitSelection,
    handleEditUnit,
    setViewerData,
    locale,
    t,
  });

  if (isApartmentIndividual || level !== 'Unit') {
    return null;
  }

  const unitTableData: UnitRow[] = filteredUnits
    .map((u) => {
      const stat = unitStatusMap.get(u.propertyDetailsId) || (u.propertyId != null ? unitStatusMap.get(u.propertyId) : undefined) || DEFAULT_UNIT_STATUS;
      return {
        propertyDetailsId: u.propertyDetailsId,
        propertyId: u.propertyId,
        unitNo: u.unitNo,
        wingName: u.wingName,
        certStatus: stat.status,
        certNumber: stat.certificateNumber,
        certDate: stat.certificateDate,
        hasDocument: stat.hasDocument,
        documentGuid: stat.documentGuid,
        fileName: stat.fileName,
        propertyCertificateId: stat.certificate?.propertyCertificateId,
      };
    })
    .filter((row) => {
      if (statusFilter === 'direct') return row.certStatus === 'direct';
      if (statusFilter === 'wing') return row.certStatus === 'wing';
      if (statusFilter === 'apartment') return row.certStatus === 'apartment';
      if (statusFilter === 'none') return row.certStatus === 'none';
      return true;
    });

  return (
    <div className={cn('space-y-2 p-2.5 rounded-xl border transition-all', fieldErrors.unit ? 'bg-red-50/20 border-red-300' : 'bg-slate-50/70 border-slate-200')}>
      <BuildingUnitTableToolbar
        filteredUnits={filteredUnits}
        activeWings={activeWings}
        selectedUnitIds={selectedUnitIds}
        unitSearchQuery={unitSearchQuery}
        setUnitSearchQuery={setUnitSearchQuery}
        wingFilter={wingFilter}
        setWingFilter={setWingFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        appliedUnitsCount={appliedUnitsCount}
        handleClearSelection={handleClearSelection}
        setSelectedWingDetailId={setSelectedWingDetailId}
        t={t}
      />

      <MasterTable<UnitRow>
        columns={columns}
        data={unitTableData}
        isPagination={false}
        emptyText={t('building.noUnitsMatch') || 'No units match the selected filters'}
        maxBodyHeightClassName="max-h-36 sm:max-h-40"
        onScroll={(e) => {
          const target = e.currentTarget;
          if (target.scrollTop + target.clientHeight >= target.scrollHeight - 30) {
            loadNextUnitsPage();
          }
        }}
        onRowClick={(row) => {
          if (row.certStatus === 'direct') return;
          handleToggleUnitSelection(row);
        }}
        getRowKey={(row, i) => `${row.propertyDetailsId ?? ''}-${row.propertyId ?? ''}-${i}`}
        rowClassName={(row) => {
          const isSelected = selectedUnitIds.has(row.propertyDetailsId as number) || (row.propertyId != null && selectedUnitIds.has(row.propertyId as number));
          const isDirectApplied = row.certStatus === 'direct';
          return cn(
            'select-none transition-colors',
            isDirectApplied && !isSelected ? 'cursor-default' : 'cursor-pointer',
            isDirectApplied
              ? 'bg-emerald-50/20 border-l-4 border-l-emerald-500 hover:bg-emerald-50/40'
              : 'hover:bg-slate-50/80',
            isSelected && 'bg-blue-100/90 font-semibold ring-2 ring-blue-500/60 border-l-4 border-l-blue-600 shadow-sm'
          );
        }}
      />
      {isLoadingMoreUnits && (
        <div className="py-1.5 text-center text-xs text-blue-600 font-medium flex items-center justify-center gap-2 bg-blue-50/40 rounded-lg">
          <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>{t('building.loadingNextUnits') || 'Loading next 10 units...'}</span>
        </div>
      )}
      <ValidationMessage message={fieldErrors.unit} />
    </div>
  );
}
