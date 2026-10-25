/* eslint-disable i18next/no-literal-string */
'use client';
import React from 'react';
import { Layers, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import {
  AddButton,
  FloorDetailsTable,
  FloorDetailsTableColumn,
} from '@/components/common';
import { FloorData } from '@/types/room-details.types';
import { LookupData } from '@/lib/utils/floorSubmission/floor-mappers';
import {
  normalizeFloorFormData,
} from '@/lib/utils/floorSubmission/floor-mappers';
import { useFloorTableColumns, renderFloorActions } from './FloorTableColumns';
import { ExpandedRoomsBreakdown } from './components/ExpandedRoomsBreakdown';
import { validateFloorCompleteSequence } from '@/lib/validations/validateFloorSequence';

interface FloorTableProps {
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  filteredFloors: FloorData[];
  floorSearch?: string;
  setFloorSearch?: (val: string) => void;
  selectedFloor: FloorData | null;
  setSelectedFloor: (val: FloorData | null) => void;
  isAddingNewFloor: boolean;
  setIsAddingNewFloor: (val: boolean) => void;
  handleAddFloor: () => void;
  handleOpenDataEntrySameAs: () => void;
  viewOnly?: boolean;
  updateUrlParams: (params: Record<string, string | null>) => void;
  handleDeleteFloor: (floor: FloorData) => void;
  startTransition: (fn: () => void) => void;
  setFormErrors: (errors: Record<string, string>) => void;
  // Lookups for rendering
  floorLookup: LookupData[];
  subFloorLookup: LookupData[];
  constructionLookup: LookupData[];
  useLookup: LookupData[];
  subTypeData: LookupData[];
  setEditingFloorForm: (val: FloorData) => void;
  selectedFloorType?: 'Construction' | 'OpenPlot';
  isPlotCategory?: boolean;
  partitionNo?: string;
  onRowClick?: (row: FloorData) => void;
  isIndividualProperty?: boolean;
  /** categoryName from PropertyCategoryMaster (e.g. "Amenity", "Individual", "Apartment") */
  categoryName?: string;
  /** propertyDescription from PropertyCategoryMaster (e.g. "Amenity" or "ॲमिनिटी") */
  propertyDescription?: string;
  isBuildingPermissionView?: boolean;
  plotAreaSqM?: number;
}

const FloorTable: React.FC<FloorTableProps> = ({
  t,
  filteredFloors,
  selectedFloorType,
  floorSearch: _floorSearch = '',
  setFloorSearch: _setFloorSearch,
  selectedFloor,
  setSelectedFloor,
  isAddingNewFloor: _isAddingNewFloor,
  setIsAddingNewFloor,
  handleAddFloor,
  handleOpenDataEntrySameAs,
  viewOnly = false,
  updateUrlParams: _updateUrlParams,
  handleDeleteFloor,
  startTransition: _startTransition,
  setFormErrors,
  floorLookup,
  subFloorLookup,
  constructionLookup,
  useLookup,
  subTypeData,
  setEditingFloorForm,
  isPlotCategory = false,
  partitionNo,
  categoryName,
  propertyDescription,
  isIndividualProperty: _isIndividualProperty = false,
  onRowClick,
  isBuildingPermissionView = false,
  plotAreaSqM = 0,
}) => {

  // Amenity properties do not support Data Entry Same As — always hide the button.
  // Check categoryName, propertyDescription (English & Marathi), and partitionNo pattern (e.g. AAM10, B-AM1).
  const isAmenityProperty = React.useMemo(() => {
    const cat = (categoryName ?? '').trim().toLowerCase();
    const desc = (propertyDescription ?? '').trim().toLowerCase();
    const part = (partitionNo ?? '').trim().toUpperCase();

    const byCategoryName = cat.includes('amenity') || cat.includes('ॲमिनिटी') || cat.includes('अॅमिनिटी');
    const byPropertyDescription = desc.includes('amenity') || desc.includes('ॲमिनिटी') || desc.includes('अॅमिनिटी') || desc.includes('अमेनिटी');
    const byPartitionNo = part.includes('AM');

    return byCategoryName || byPropertyDescription || byPartitionNo;
  }, [categoryName, propertyDescription, partitionNo]);

  const isDataEntryDisabled = React.useMemo(() => {
    // Disable button if no floors exist for the selected property; enable when floors exist
    return !filteredFloors || filteredFloors.length === 0;
  }, [filteredFloors]);

  const dataEntryButtonLabel = React.useMemo(() => {
    const cat = (categoryName ?? '').trim().toLowerCase();
    if (cat === 'apartment') {
      return t('floor.dataEntryApplyAll');
    }
    return t('floor.dataEntry');
  }, [categoryName, t]);

  const handleDataEntrySameAsClick = React.useCallback(() => {
    if (isDataEntryDisabled) {
      toast.error(
        t('floor.atLeastOneFloorRequired')
      );
      return;
    }
    handleOpenDataEntrySameAs();
  }, [isDataEntryDisabled, handleOpenDataEntrySameAs, t]);

  const completeSequenceValidationResult = React.useMemo(() => {
    return validateFloorCompleteSequence(filteredFloors);
  }, [filteredFloors]);

  const columns = useFloorTableColumns({
    t,
    floorLookup,
    subFloorLookup,
    constructionLookup,
    useLookup,
    subTypeData,
    completeSequenceValidationResult,
  });

  const [expandedRowIds] = React.useState<Array<string | number>>([]);

  const deleteCellRenderer = React.useMemo(() => {
    return renderFloorActions(t, handleDeleteFloor);
  }, [t, handleDeleteFloor]);

  // Calculate Summary Metrics for Table Header
  const summaryMetrics = React.useMemo(() => {
    let totalOpenSpaceArea = 0;
    let totalCarpetArea = 0;
    let totalBuiltupArea = 0;

    (filteredFloors || []).forEach((floor) => {
      // Exclude property master plot header record if carpetArea === plotAreaSqM
      if (
        (floor.isOpenPlot === true || floor.selectedFloorType === 'OpenPlot' || String(floor.floor || '').toLowerCase().includes('open plot')) &&
        Number(floor.carpetAreaSqMeter || floor.builtupAreaSqMeter || 0) === plotAreaSqM &&
        plotAreaSqM > 0
      ) {
        return;
      }

      const isOpenPlot =
        floor.selectedFloorType === 'OpenPlot' ||
        String(floor.conTyp || floor.constructionTypeDescription || '').toLowerCase().includes('open plot') ||
        String(floor.conTyp || '').toLowerCase() === 'op';

      const areaSqM = Number(floor.areaSqM || floor.builtupAreaSqM || floor.builtupAreaSqMeter || floor.carpetAreaSqMeter || 0);
      const carpetSqM = Number(floor.carpetAreaSqMeter || floor.carpetArea || floor.areaSqM || 0);
      const builtupSqM = Number(floor.builtupAreaSqMeter || floor.builtupAreaSqM || floor.areaSqM || 0);

      if (isOpenPlot) {
        totalOpenSpaceArea += areaSqM;
      } else {
        totalCarpetArea += carpetSqM;
        totalBuiltupArea += builtupSqM;
      }
    });

    return {
      totalOpenSpaceArea: Math.round(totalOpenSpaceArea * 100) / 100,
      totalCarpetArea: Math.round(totalCarpetArea * 100) / 100,
      totalBuiltupArea: Math.round(totalBuiltupArea * 100) / 100,
    };
  }, [filteredFloors, plotAreaSqM]);

  // Adapt the custom MasterTable columns to be compatible with FloorDetailsTable and style cells cleanly
  const adaptedColumns = React.useMemo<FloorDetailsTableColumn<FloorData>[]>(() => {
    const buildingPermissionKeys = ['floor', 'use', 'conYr', 'ccDate', 'ocDate'];
    const targetCols = isBuildingPermissionView
      ? columns.filter((col) => buildingPermissionKeys.includes(col.key))
      : columns;

    const baseCols: FloorDetailsTableColumn<FloorData>[] = targetCols.map((col) => {
      let label = col.label;
      let tooltip = col.tooltip;
      if (isBuildingPermissionView) {
        if (col.key === 'conYr') {
          label = t('building.constYear') || 'CONST YEAR';
          tooltip = label;
        } else if (col.key === 'ocDate') {
          label = 'OC DATE';
          tooltip = 'OC DATE';
        }
      }
      return {
        ...col,
        label,
        tooltip,
        sortable: true,
        render: (row: FloorData, index: number) => {
          const cellValue = row[col.key as keyof FloorData];
          if (col.render) {
            return (col.render as (val: unknown, r: FloorData, i: number) => React.ReactNode)(cellValue, row, index);
          }
          return <span className="font-semibold text-slate-800 text-[12px]">{String(cellValue ?? '-')}</span>;
        },
      };
    });

    // Append standard Action column at the end
    if (!viewOnly) {
      baseCols.push({
        key: 'actions',
        label: t('floor.actions'),
        sortable: false,
        render: (row: FloorData) => {
          return (
            <div className="flex justify-center items-center">
              {deleteCellRenderer(row)}
            </div>
          );
        },
      });
    } else if (onRowClick) {
      baseCols.push({
        key: 'select-floor-action',
        label: '',
        sortable: false,
        render: (row: FloorData) => {
          const isSelected = selectedFloor?.id === row.id;
          return (
            <div className="flex justify-center items-center h-full min-h-[28px]">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRowClick(row);
                }}
                className={`flex items-center justify-center w-6 h-6 rounded-full border transition-all cursor-pointer ${isSelected
                  ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                  : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:border-blue-300'
                  }`}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        },
      });
    }

    return baseCols;
  }, [columns, t, deleteCellRenderer, viewOnly, onRowClick, selectedFloor, isBuildingPermissionView]);

  /**
   * Handle row click to edit or select a floor directly via row object
   */
  const handleFloorRowClick = React.useCallback(
    (floor: FloorData) => {
      if (!floor) return;

      if (onRowClick) {
        onRowClick(floor);
        return;
      }

      if (viewOnly) return;

      setFormErrors({});

      // Pre-populate the form immediately for instant UI response (0ms delay)
      setEditingFloorForm(normalizeFloorFormData(floor) as FloorData);
      setSelectedFloor(floor);
      setIsAddingNewFloor(false);

      requestAnimationFrame(() => {
        const formEl = document.getElementById('edit-floor-form-section');
        if (formEl) {
          formEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    },
    [
      onRowClick,
      viewOnly,
      setFormErrors,
      setEditingFloorForm,
      setSelectedFloor,
      setIsAddingNewFloor,
    ]
  );

  // Render detailed list of rooms inside this floor when row is expanded (extracted to components/ExpandedRoomsBreakdown)
  const renderExpandedRooms = React.useCallback(
    (floor: FloorData) => <ExpandedRoomsBreakdown floor={floor} t={t} />,
    [t]
  );

  return (
    <div className="bg-white rounded-xl shadow-md border-2 border-blue-100 p-2">
      <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-3 mb-2 pb-1.5 border-b-2 border-blue-200 w-full">
        {/* Left: Title + Badges in flexible wrapping container */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
          <h3 className="text-xs font-bold text-blue-800 flex items-center gap-1.5 whitespace-nowrap mr-1 shrink-0">
            <Layers className="w-3.5 h-3.5 text-blue-700" />
            {t('floor.allFloors')}
            <span className="ml-0.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-semibold">
              {filteredFloors.length}
            </span>
          </h3>

          {/* Metric Badges: Inlines on wide screens, wraps cleanly if overlapping */}
          {!isBuildingPermissionView && (
            <>
              {plotAreaSqM > 0 && (
                <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-md flex items-center gap-1 shadow-2xs whitespace-nowrap text-[10px] sm:text-[11px] font-semibold">
                  <span className="text-blue-600 font-medium">{t('floor.plotAreaColon') || 'Plot Area:'}</span>
                  <strong className="font-bold">{plotAreaSqM.toFixed(2)} Sq M</strong>
                </span>
              )}
              <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-md flex items-center gap-1 shadow-2xs whitespace-nowrap text-[10px] sm:text-[11px] font-semibold">
                <span className="text-amber-700 font-medium">{t('floor.additionalPlotAreaColon') || 'Additional Plot Area:'}</span>
                <strong className="font-bold">{summaryMetrics.totalOpenSpaceArea.toFixed(2)} Sq M</strong>
              </span>
              <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-md flex items-center gap-1 shadow-2xs whitespace-nowrap text-[10px] sm:text-[11px] font-semibold">
                <span className="text-emerald-700 font-medium">{t('floor.carpetAreaColon') || 'Carpet Area:'}</span>
                <strong className="font-bold">{summaryMetrics.totalCarpetArea.toFixed(2)} Sq M</strong>
              </span>
              <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-md flex items-center gap-1 shadow-2xs whitespace-nowrap text-[10px] sm:text-[11px] font-semibold">
                <span className="text-indigo-700 font-medium">{t('floor.builtupAreaColon') || 'Built-up Area:'}</span>
                <strong className="font-bold">{summaryMetrics.totalBuiltupArea.toFixed(2)} Sq M</strong>
              </span>
            </>
          )}
        </div>

        {/* Right: Action Buttons (Always visible and cleanly aligned) */}
        <div className="flex items-center justify-end gap-1.5 shrink-0 ml-auto">
          {!viewOnly && Boolean(categoryName?.trim()) && !isAmenityProperty && !(categoryName?.trim().toLowerCase() === 'apartment' && !partitionNo?.trim()) && (
            <div
              onClick={handleDataEntrySameAsClick}
              className="inline-block cursor-pointer shrink-0"
            >
              <AddButton
                label={dataEntryButtonLabel}
                size="sm"
                className={`px-2.5 sm:px-3 h-7 text-[10.5px] sm:text-[11px] font-bold shadow-sm rounded-lg transition-all duration-300 hover:shadow-md flex items-center gap-1 whitespace-nowrap ${isDataEntryDisabled ? 'pointer-events-none opacity-60' : 'active:scale-95'
                  }`}
                onClick={handleDataEntrySameAsClick}
                disabled={isDataEntryDisabled}
              />
            </div>
          )}

          {!viewOnly && !isPlotCategory && (
            <AddButton
              label={selectedFloorType === 'OpenPlot' ? (t('floor.addSpace') || 'Add Space') : (t('floor.addFloor') || 'Add Floor')}
              size="sm"
              className="px-2.5 sm:px-3 h-7 text-[10.5px] sm:text-[11px] font-bold shadow-sm rounded-lg transition-all duration-300 hover:shadow-md active:scale-95 flex items-center gap-1 whitespace-nowrap shrink-0"
              onClick={handleAddFloor}
            />
          )}
        </div>
      </div>

      <FloorDetailsTable<FloorData & { id: string | number }>
        data={filteredFloors as (FloorData & { id: string | number })[]}
        columns={adaptedColumns as unknown as FloorDetailsTableColumn<FloorData & { id: string | number }>[]}
        showExpandColumn={false}
        showScrollButtons={true}
        expandedRowIds={expandedRowIds}
        getExpandHref={(row) => `#floor-${row.id}`}
        renderExpanded={renderExpandedRooms}
        onRowClick={handleFloorRowClick}
        tableClassName={isBuildingPermissionView ? "w-full" : "w-full min-w-[1200px]"}
        emptyMessage={viewOnly ? t('floorSubmission.validation.emptyMessage') : t('floor.noFloorsFound')}
        striped={true}
        hoverable={true}
        containerClassName="border border-blue-200 shadow-md rounded-xl max-h-[184px] overflow-y-auto"
        theadClassName="bg-[#1e3a8a] text-white"
        rowClassName={(row) => {
          const isSelected = selectedFloor
            ? (Boolean(selectedFloor.id && row.id && String(selectedFloor.id) === String(row.id)) ||
              Boolean(selectedFloor.propertyDetailsId && row.propertyDetailsId && Number(selectedFloor.propertyDetailsId) === Number(row.propertyDetailsId)) ||
              Boolean(selectedFloor.propertyDetailsId && row.id && Number(selectedFloor.propertyDetailsId) === Number(row.id)) ||
              Boolean(selectedFloor.id && row.propertyDetailsId && Number(selectedFloor.id) === Number(row.propertyDetailsId)))
            : false;

          if (viewOnly && !onRowClick) {
            return 'cursor-default border-l-4 border-l-transparent border-b-2 border-blue-200/90';
          }

          return `cursor-pointer transition-all duration-200 hover:bg-blue-50/80 active:bg-blue-100 border-b-2 border-blue-200/90 ${isSelected ? 'bg-blue-100/70 border-l-4 border-l-blue-600 font-bold' : 'border-l-4 border-l-transparent'
            }`;
        }}
      />
    </div>
  );
};

export default FloorTable;
