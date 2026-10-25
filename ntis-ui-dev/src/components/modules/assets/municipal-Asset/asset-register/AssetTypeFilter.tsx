"use client";

import React from 'react';
import { Building, Building2, School, Hospital, Briefcase, Trees, Trophy, Droplets, Route, Landmark, Map, BookOpen, Truck, Construction } from 'lucide-react';
import { MultiSelectWithIcons, IconOption } from '@/components/common';
import type { AssetTypeFilterProps } from '@/types/asset/asset-register/municipal-asset-register.types';

function getAssetTypeIcon(label: string) {
  const lower = label.toLowerCase();
  if (lower.includes('commercial') || lower.includes('shop') || lower.includes('market') || lower.includes('business')) {
    return <Building2 className="w-3 h-3 text-blue-500" />;
  }
  if (lower.includes('school') || lower.includes('education') || lower.includes('college') || lower.includes('university') || lower.includes('institute')) {
    return <School className="w-3 h-3 text-blue-500" />;
  }
  if (lower.includes('hospital') || lower.includes('clinic') || lower.includes('medical') || lower.includes('health') || lower.includes('dispensary')) {
    return <Hospital className="w-3 h-3 text-blue-500" />;
  }
  if (lower.includes('park') || lower.includes('garden') || lower.includes('playground') || lower.includes('open space') || lower.includes('tree') || lower.includes('plantation')) {
    return <Trees className="w-3 h-3 text-blue-500" />;
  }
  if (lower.includes('office') || lower.includes('municipal') || lower.includes('department') || lower.includes('administration') || lower.includes('center')) {
    return <Briefcase className="w-3 h-3 text-blue-500" />;
  }
  if (lower.includes('water') || lower.includes('pump') || lower.includes('tank') || lower.includes('reservoir') || lower.includes('well') || lower.includes('lake') || lower.includes('drain')) {
    return <Droplets className="w-3 h-3 text-blue-500" />;
  }
  if (lower.includes('sports') || lower.includes('stadium') || lower.includes('gym') || lower.includes('ground') || lower.includes('trophy') || lower.includes('play')) {
    return <Trophy className="w-3 h-3 text-blue-500" />;
  }
  if (lower.includes('road') || lower.includes('bridge') || lower.includes('flyover') || lower.includes('streetlight') || lower.includes('traffic')) {
    return <Route className="w-3 h-3 text-blue-500" />;
  }
  if (lower.includes('land') || lower.includes('plot') || lower.includes('vacant') || lower.includes('site') || lower.includes('cemetery') || lower.includes('crematorium')) {
    return <Map className="w-3 h-3 text-blue-500" />;
  }
  if (lower.includes('library') || lower.includes('cultural') || lower.includes('museum') || lower.includes('auditorium') || lower.includes('hall')) {
    return <BookOpen className="w-3 h-3 text-blue-500" />;
  }
  if (lower.includes('landmark') || lower.includes('monument') || lower.includes('heritage') || lower.includes('statue')) {
    return <Landmark className="w-3 h-3 text-blue-500" />;
  }
  if (lower.includes('vehicle') || lower.includes('car') || lower.includes('truck') || lower.includes('bus') || lower.includes('machinery') || lower.includes('equipment')) {
    return <Truck className="w-3 h-3 text-blue-500" />;
  }
  if (lower.includes('infrastructure') || lower.includes('utility') || lower.includes('construction') || lower.includes('plant') || lower.includes('work')) {
    return <Construction className="w-3 h-3 text-blue-500" />;
  }
  return <Building className="w-3 h-3 text-blue-500" />;
}

export function AssetTypeFilter({
  assetTypeId,
  assetTypeOptions,
  handleAssetTypeChange,
  placeholder,
}: AssetTypeFilterProps) {
  
  const mappedAssetTypeOptions = React.useMemo<IconOption[]>(() => {
    return assetTypeOptions
      .filter(opt => opt.value !== 'all')
      .map((opt) => ({
        value: opt.value,
        label: opt.label,
        icon: (
          <span className="asset-type-option-icon w-5 h-5 flex-shrink-0 flex items-center justify-center rounded bg-blue-50 border border-blue-100">
            {getAssetTypeIcon(opt.label)}
          </span>
        )
      }));
  }, [assetTypeOptions]);

  return (
    <div className="relative w-full asset-type-filter-wrapper">
      {/* Scoped style: hides icon badge inside the button trigger only (not in dropdown list) */}
      <style>{`
        .asset-type-filter-wrapper button .asset-type-option-icon {
          display: none !important;
        }
        .asset-type-filter-wrapper button > div {
          min-width: 0 !important;
        }
        .asset-type-filter-wrapper button > div > span:first-child {
          flex: 1 1 auto !important;
          min-width: 0 !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
        }
        .asset-type-filter-wrapper [role=option] .asset-type-option-icon {
          flex: none !important;
          width: 18px !important;
          height: 18px !important;
        }
      `}</style>
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-slate-400">
        <Building2 className="w-4 h-4" />
      </div>
      <MultiSelectWithIcons
        name="assetType"
        options={mappedAssetTypeOptions}
        value={assetTypeId === 'all' || !assetTypeId ? [] : assetTypeId.split(',')}
        onChange={handleAssetTypeChange}
        placeholder={placeholder || 'All Asset Types'}
        className="w-full [&>div]:!min-w-0 [&>div]:!rounded-xl [&>div]:!border-slate-200 [&_button]:!pl-9 [&_[role=option]>span:last-child]:flex-1"
      />
    </div>
  );
}
