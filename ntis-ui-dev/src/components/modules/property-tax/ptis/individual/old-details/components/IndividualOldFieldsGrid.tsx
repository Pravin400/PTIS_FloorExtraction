'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import type { OldDetailsData } from '@/types/ptis.types';
import { Tooltip } from '@/components/common/Tooltip';
import { cn } from '@/lib/utils/cn';
import {
  MapPin,
  Hash,
  FileText,
  Layers,
  Maximize2,
  Building2,
  IndianRupee,
  Receipt,
  GitFork,
  Loader2,
  type LucideIcon,
} from 'lucide-react';

export interface IndividualOldFieldsGridProps {
  currentDetails?: OldDetailsData | null;
  effectiveShowMap?: boolean;
  effectiveShowFloor?: boolean;
  effectiveShowTax?: boolean;
  isLoadingMapped?: boolean;
  isLoadingFloors?: boolean;
  isLoadingTaxes?: boolean;
  onToggleMapDetails?: () => void;
  onToggleFloorDetails?: () => void;
  onToggleOldTax?: () => void;
  onNavigatePropertyMapping?: () => void;
}

interface OldInfoRowProps {
  icon: LucideIcon;
  label: React.ReactNode;
  value?: React.ReactNode;
  minWidth?: string;
}

const OldInfoRow: React.FC<OldInfoRowProps> = ({
  icon: Icon,
  label,
  value,
  minWidth = 'min-w-[120px]',
}) => {
  const displayValue = value != null && value !== '' ? String(value) : '-';
  const hasLongText = displayValue !== '-' && displayValue.length > 20;

  return (
    <div className="flex items-start gap-1.5 min-w-0">
      <div className={`flex items-start gap-1 text-slate-600 font-semibold shrink-0 ${minWidth}`}>
        <Icon className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-[2px]" />
        <div className="flex flex-col leading-tight text-left min-w-0">{label}</div>
      </div>
      <div className="flex-1 min-w-0">
        {hasLongText ? (
          <Tooltip
            content={
              <div className="max-w-xs sm:max-w-md whitespace-normal break-words text-xs font-semibold leading-relaxed">
                {displayValue}
              </div>
            }
            placement="top"
          >
            <div
              className="font-bold text-[#1d4ed8] text-left text-[12px] leading-tight mt-[1px] truncate min-w-0 cursor-pointer hover:underline"
              title={displayValue}
            >
              {displayValue}
            </div>
          </Tooltip>
        ) : (
          <div
            className="font-bold text-[#1d4ed8] text-left text-[12px] leading-tight mt-[1px] truncate min-w-0"
            title={displayValue}
          >
            {displayValue}
          </div>
        )}
      </div>
    </div>
  );
};

export const IndividualOldFieldsGrid: React.FC<IndividualOldFieldsGridProps> = ({
  currentDetails,
  effectiveShowMap = false,
  effectiveShowFloor = false,
  effectiveShowTax = false,
  isLoadingMapped = false,
  isLoadingFloors = false,
  isLoadingTaxes = false,
  onToggleMapDetails,
  onToggleFloorDetails,
  onToggleOldTax,
  onNavigatePropertyMapping,
}) => {
  const tInd = useTranslations('individual');
  const tPtis = useTranslations('ptis');

  const getLabel = (indKey: string, ptisKey: string, fallback: string) => {
    if (typeof tInd?.has === 'function' && tInd.has(indKey)) {
      return tInd(indKey);
    }
    if (typeof tPtis?.has === 'function' && tPtis.has(ptisKey)) {
      return tPtis(ptisKey);
    }
    return fallback;
  };

  const labelZoneName = getLabel('oldDetails.oldZoneName', 'fields.oldZoneName', 'Old Zone Name');
  const labelWardNo = getLabel('oldDetails.oldWardNo', 'fields.oldWardNo', 'Old Ward No');
  const labelPropertyNo = getLabel('oldDetails.oldPropertyNo', 'fields.oldPropertyNo', 'Old Property No');
  const labelPartitionNo = getLabel('oldDetails.oldPartitionNo', 'fields.oldPartitionNo', 'Old Partition No');
  const labelEGovNo = getLabel('oldDetails.oldEGovNo', 'fields.oldEGovNo', 'Old E-Governance No');
  const labelPlotNo = getLabel('oldDetails.oldPlotNo', 'fields.oldPlotNo', 'Old Plot No');
  const labelPlotArea = getLabel('oldDetails.oldPlotArea', 'fields.oldPlotAreaWithUnit', 'Old Plot Area (Sq. Mtr)');
  const labelConstructionArea = getLabel('oldDetails.oldConstructionArea', 'fields.oldConstructionAreaWithUnit', 'Old Construction Area (Sq. Mtr)');
  const labelALV = getLabel('oldDetails.oldALV', 'fields.oldALV', 'Old ALV');
  const labelRV = getLabel('oldDetails.oldRV', 'fields.oldRV', 'Old RV');
  const labelPropTax = getLabel('oldDetails.oldPropTax', 'fields.oldPropTax', 'Old Property Tax');
  const labelTotalTax = getLabel('oldDetails.oldTotalTax', 'fields.oldTotalTax', 'Old Total Tax');

  const showMapText =
    (typeof tInd?.has === 'function' && tInd.has('oldDetails.showMapDetails')
      ? tInd('oldDetails.showMapDetails')
      : '') || tPtis('actions.showMapDetails');
  const hideMapText =
    (typeof tInd?.has === 'function' && tInd.has('oldDetails.hideMapDetails')
      ? tInd('oldDetails.hideMapDetails')
      : '') || tPtis('actions.hideMapDetails');

  const showFloorText =
    (typeof tInd?.has === 'function' && tInd.has('oldDetails.showFloorDetails')
      ? tInd('oldDetails.showFloorDetails')
      : '') || tPtis('actions.showFloorDetails');
  const hideFloorText =
    (typeof tInd?.has === 'function' && tInd.has('oldDetails.hideFloorDetails')
      ? tInd('oldDetails.hideFloorDetails')
      : '') || tPtis('actions.hideFloorDetails');

  const showOldTaxText =
    (typeof tInd?.has === 'function' && tInd.has('oldDetails.showOldTax')
      ? tInd('oldDetails.showOldTax')
      : '') || tPtis('actions.showOldTax');
  const hideOldTaxText =
    (typeof tInd?.has === 'function' && tInd.has('oldDetails.hideOldTax')
      ? tInd('oldDetails.hideOldTax')
      : '') || tPtis('actions.hideOldTax');

  const propertyMappingText =
    (typeof tInd?.has === 'function' && tInd.has('oldDetails.propertyMapping')
      ? tInd('oldDetails.propertyMapping')
      : '') ||
    (typeof tPtis?.has === 'function' && tPtis.has('actions.propertyMapping')
      ? tPtis('actions.propertyMapping')
      : '') ||
    'Property Mapping';

  const hasActions = Boolean(
    onToggleMapDetails || onToggleFloorDetails || onToggleOldTax || onNavigatePropertyMapping
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-2.5 sm:p-3 min-w-0">
      <div
        className={cn(
          'text-[12px] min-w-0',
          hasActions
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-3.5 lg:gap-x-4 xl:gap-x-5 gap-y-2.5'
            : 'grid grid-cols-1 md:grid-cols-3 gap-x-4 lg:gap-x-6 gap-y-2'
        )}
      >
        {/* COLUMN 1: Location & Property Identifiers (4 rows) */}
        <div className="flex flex-col justify-between gap-1.5 md:border-r md:border-slate-100 md:pr-3 min-w-0 overflow-hidden">
          <OldInfoRow
            icon={MapPin}
            label={labelZoneName}
            value={currentDetails?.oldZoneName}
            minWidth="min-w-[115px]"
          />
          <OldInfoRow
            icon={Hash}
            label={labelWardNo}
            value={currentDetails?.oldWardNo}
            minWidth="min-w-[115px]"
          />
          <OldInfoRow
            icon={FileText}
            label={labelPropertyNo}
            value={currentDetails?.oldPropertyNo}
            minWidth="min-w-[115px]"
          />
          <OldInfoRow
            icon={Layers}
            label={labelPartitionNo}
            value={currentDetails?.oldPartitionNo}
            minWidth="min-w-[115px]"
          />
        </div>

        {/* COLUMN 2: Legal & Dimensions (4 rows) */}
        <div className="flex flex-col justify-between gap-1.5 lg:border-r lg:border-slate-100 lg:pr-3 min-w-0 overflow-hidden">
          <OldInfoRow
            icon={FileText}
            label={labelEGovNo}
            value={currentDetails?.oldEGovernanceNo}
            minWidth="min-w-[125px]"
          />
          <OldInfoRow
            icon={MapPin}
            label={labelPlotNo}
            value={currentDetails?.oldPlotNo}
            minWidth="min-w-[125px]"
          />
          <OldInfoRow
            icon={Maximize2}
            label={labelPlotArea}
            value={currentDetails?.oldPlotArea}
            minWidth="min-w-[125px]"
          />
          <OldInfoRow
            icon={Building2}
            label={labelConstructionArea}
            value={currentDetails?.oldConstructionArea}
            minWidth="min-w-[125px]"
          />
        </div>

        {/* COLUMN 3: Valuation & Tax Details (4 rows) */}
        <div
          className={cn(
            'flex flex-col justify-between gap-1.5 min-w-0 overflow-hidden',
            hasActions && 'md:border-r md:border-slate-100 md:pr-3'
          )}
        >
          <OldInfoRow
            icon={IndianRupee}
            label={labelALV}
            value={currentDetails?.oldALV}
            minWidth="min-w-[105px]"
          />
          <OldInfoRow
            icon={IndianRupee}
            label={labelRV}
            value={currentDetails?.oldRV}
            minWidth="min-w-[105px]"
          />
          <OldInfoRow
            icon={Receipt}
            label={labelPropTax}
            value={currentDetails?.oldPropertyTax}
            minWidth="min-w-[105px]"
          />
          <OldInfoRow
            icon={Receipt}
            label={labelTotalTax}
            value={currentDetails?.oldTotalTax}
            minWidth="min-w-[105px]"
          />
        </div>

        {/* COLUMN 4: Contextual Actions & Sub-table Triggers (4 buttons matching rows 1-4) */}
        {hasActions && (
          <div className="flex flex-col justify-between items-center md:items-end gap-1.5 min-w-0">
            {/* 1. Map Details (Teal Theme) */}
            <button
              type="button"
              onClick={onToggleMapDetails}
              disabled={isLoadingMapped}
              title={effectiveShowMap ? hideMapText : showMapText}
              className={cn(
                'w-full max-w-[165px] h-[30px] px-2.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs select-none disabled:opacity-60 disabled:cursor-not-allowed',
                effectiveShowMap
                  ? 'bg-teal-50 text-teal-800 border-2 border-teal-600 hover:bg-teal-100/70 shadow-xs'
                  : 'bg-teal-600 text-white border-2 border-teal-600 hover:bg-teal-700 active:bg-teal-800'
              )}
            >
              {isLoadingMapped ? (
                <Loader2 className={cn('w-3.5 h-3.5 animate-spin shrink-0', effectiveShowMap ? 'text-teal-700' : 'text-white')} />
              ) : (
                <MapPin className={cn('w-3.5 h-3.5 shrink-0', effectiveShowMap ? 'text-teal-700' : 'text-white')} />
              )}
              <span className="truncate">{effectiveShowMap ? hideMapText : showMapText}</span>
            </button>

            {/* 2. Floor Details (Indigo Theme) */}
            <button
              type="button"
              onClick={onToggleFloorDetails}
              disabled={isLoadingFloors}
              title={effectiveShowFloor ? hideFloorText : showFloorText}
              className={cn(
                'w-full max-w-[165px] h-[30px] px-2.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs select-none disabled:opacity-60 disabled:cursor-not-allowed',
                effectiveShowFloor
                  ? 'bg-indigo-50 text-indigo-800 border-2 border-indigo-600 hover:bg-indigo-100/70 shadow-xs'
                  : 'bg-indigo-600 text-white border-2 border-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
              )}
            >
              {isLoadingFloors ? (
                <Loader2 className={cn('w-3.5 h-3.5 animate-spin shrink-0', effectiveShowFloor ? 'text-indigo-700' : 'text-white')} />
              ) : (
                <Layers className={cn('w-3.5 h-3.5 shrink-0', effectiveShowFloor ? 'text-indigo-700' : 'text-white')} />
              )}
              <span className="truncate">{effectiveShowFloor ? hideFloorText : showFloorText}</span>
            </button>

            {/* 3. Old Tax (Orange / Amber Theme) */}
            <button
              type="button"
              onClick={onToggleOldTax}
              disabled={isLoadingTaxes}
              title={effectiveShowTax ? hideOldTaxText : showOldTaxText}
              className={cn(
                'w-full max-w-[165px] h-[30px] px-2.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs select-none disabled:opacity-60 disabled:cursor-not-allowed',
                effectiveShowTax
                  ? 'bg-orange-50 text-orange-800 border-2 border-orange-600 hover:bg-orange-100/70 shadow-xs'
                  : 'bg-orange-600 text-white border-2 border-orange-600 hover:bg-orange-700 active:bg-orange-800'
              )}
            >
              {isLoadingTaxes ? (
                <Loader2 className={cn('w-3.5 h-3.5 animate-spin shrink-0', effectiveShowTax ? 'text-orange-700' : 'text-white')} />
              ) : (
                <Receipt className={cn('w-3.5 h-3.5 shrink-0', effectiveShowTax ? 'text-orange-700' : 'text-white')} />
              )}
              <span className="truncate">{effectiveShowTax ? hideOldTaxText : showOldTaxText}</span>
            </button>

            {/* 4. Property Mapping (Purple Theme) */}
            <button
              type="button"
              onClick={onNavigatePropertyMapping}
              title={propertyMappingText}
              className={cn(
                'w-full max-w-[165px] h-[30px] px-2.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs select-none',
                'bg-purple-600 text-white border-2 border-purple-600 hover:bg-purple-700 active:bg-purple-800'
              )}
            >
              <GitFork className="w-3.5 h-3.5 text-white shrink-0" />
              <span className="truncate">{propertyMappingText}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default IndividualOldFieldsGrid;
