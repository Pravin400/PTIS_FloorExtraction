'use client';

import React from 'react';
import { Building, Map } from 'lucide-react';

interface FloorTypeToggleProps {
  selectedFloorType: 'Construction' | 'OpenPlot';
  onChange: (type: 'Construction' | 'OpenPlot') => void;
  isPlotCategory: boolean;
  t: (key: string) => string;
  /** 'sm' for drawer, 'md' for full-page */
  size?: 'sm' | 'md';
}

/**
 * Reusable Construction / Open Plot toggle buttons.
 * Used in both FloorSubmission (full-page) and AddFloorDrawer (drawer).
 */
export const FloorTypeToggle: React.FC<FloorTypeToggleProps> = ({
  selectedFloorType,
  onChange,
  isPlotCategory,
  t,
  size = 'md',
}) => {
  const isSmall = size === 'sm';

  const baseClasses = isSmall
    ? 'flex-1 inline-flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all duration-300 border whitespace-nowrap'
    : 'inline-flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-lg transition-all duration-300 cursor-pointer border shadow-sm whitespace-nowrap';

  const iconSize = isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div className={`flex items-center gap-3 ${isSmall ? 'px-5 py-3 bg-white border-b border-slate-100' : ''}`}>
      <button
        type="button"
        onClick={() => !isPlotCategory && onChange('Construction')}
        disabled={isPlotCategory}
        className={`${baseClasses} ${
          selectedFloorType === 'Construction'
            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
            : isPlotCategory
              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
        }`}
      >
        <Building className={iconSize} />
        {t('floor.construction') || 'Construction'}
      </button>
      <button
        type="button"
        onClick={() => onChange('OpenPlot')}
        className={`${baseClasses} ${
          selectedFloorType === 'OpenPlot'
            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
        }`}
      >
        <Map className={iconSize} />
        {t('floor.openPlot') || 'Open Space'}
      </button>
    </div>
  );
};
