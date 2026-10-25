'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';
import {
  MapPin,
  Layers,
  Receipt,
  Loader2,
  GitFork,
} from 'lucide-react';

export interface IndividualOldToolbarProps {
  effectiveShowMap: boolean;
  effectiveShowFloor: boolean;
  effectiveShowTax: boolean;
  isLoadingMapped?: boolean;
  isLoadingFloors?: boolean;
  isLoadingTaxes?: boolean;
  onToggleMapDetails: () => void;
  onToggleFloorDetails: () => void;
  onToggleOldTax: () => void;
  onNavigatePropertyMapping?: () => void;
}

export const IndividualOldToolbar: React.FC<IndividualOldToolbarProps> = ({
  effectiveShowMap,
  effectiveShowFloor,
  effectiveShowTax,
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

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 pt-1 pb-0.5 px-0.5">
      <div className="flex flex-wrap items-center gap-2">
        {/* 1. Map Details (Teal Theme) */}
        <button
          type="button"
          onClick={onToggleMapDetails}
          disabled={isLoadingMapped}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs select-none disabled:opacity-60 disabled:cursor-not-allowed',
            effectiveShowMap
              ? 'bg-white text-teal-700 border-2 border-teal-600 hover:bg-teal-50/70 shadow-sm'
              : 'bg-teal-600 text-white border-2 border-teal-600 hover:bg-teal-700 active:bg-teal-800'
          )}
        >
          {isLoadingMapped ? (
            <Loader2 className={cn('w-3.5 h-3.5 animate-spin', effectiveShowMap ? 'text-teal-600' : 'text-white')} />
          ) : (
            <MapPin className={cn('w-3.5 h-3.5', effectiveShowMap ? 'text-teal-600' : 'text-white')} />
          )}
          <span>{effectiveShowMap ? hideMapText : showMapText}</span>
        </button>

        {/* 2. Floor Details (Indigo Theme) */}
        <button
          type="button"
          onClick={onToggleFloorDetails}
          disabled={isLoadingFloors}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs select-none disabled:opacity-60 disabled:cursor-not-allowed',
            effectiveShowFloor
              ? 'bg-white text-indigo-700 border-2 border-indigo-600 hover:bg-indigo-50/70 shadow-sm'
              : 'bg-indigo-600 text-white border-2 border-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
          )}
        >
          {isLoadingFloors ? (
            <Loader2 className={cn('w-3.5 h-3.5 animate-spin', effectiveShowFloor ? 'text-indigo-600' : 'text-white')} />
          ) : (
            <Layers className={cn('w-3.5 h-3.5', effectiveShowFloor ? 'text-indigo-600' : 'text-white')} />
          )}
          <span>{effectiveShowFloor ? hideFloorText : showFloorText}</span>
        </button>

        {/* 3. Old Tax (Orange / Amber Theme) */}
        <button
          type="button"
          onClick={onToggleOldTax}
          disabled={isLoadingTaxes}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs select-none disabled:opacity-60 disabled:cursor-not-allowed',
            effectiveShowTax
              ? 'bg-white text-orange-700 border-2 border-orange-600 hover:bg-orange-50/70 shadow-sm'
              : 'bg-orange-600 text-white border-2 border-orange-600 hover:bg-orange-700 active:bg-orange-800'
          )}
        >
          {isLoadingTaxes ? (
            <Loader2 className={cn('w-3.5 h-3.5 animate-spin', effectiveShowTax ? 'text-orange-600' : 'text-white')} />
          ) : (
            <Receipt className={cn('w-3.5 h-3.5', effectiveShowTax ? 'text-orange-600' : 'text-white')} />
          )}
          <span>{effectiveShowTax ? hideOldTaxText : showOldTaxText}</span>
        </button>

        {/* 4. Property Mapping (Purple Theme) */}
        <button
          type="button"
          onClick={onNavigatePropertyMapping}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs select-none',
            'bg-purple-600 text-white border-2 border-purple-600 hover:bg-purple-700 active:bg-purple-800 hover:shadow-sm'
          )}
        >
          <GitFork className="w-3.5 h-3.5 text-white" />
          <span>{propertyMappingText}</span>
        </button>
      </div>
    </div>
  );
};

export default IndividualOldToolbar;
