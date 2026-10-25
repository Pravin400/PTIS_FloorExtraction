'use client';

import { MapPin, Plus, Minus, Layers } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { MapLayerType } from '../../shared/AmravatiMap';
import { cn } from '@/lib/utils/cn';

export interface MobileMapFilterBarProps {
  selectedWardFilter: string;
  setSelectedWardFilter: (ward: string) => void;
  activeStatusDot: 'all' | 'red' | 'green';
  setActiveStatusDot: (dot: 'all' | 'red' | 'green') => void;
  className?: string;
}

export function MobileMapFilterBar({
  selectedWardFilter,
  setSelectedWardFilter,
  activeStatusDot,
  setActiveStatusDot,
  className = '',
}: MobileMapFilterBarProps) {
  const t = useTranslations('grievance');

  return (
    <div
      className={cn(
        'pointer-events-auto bg-white/95 backdrop-blur-md rounded-full px-3 py-1.5 shadow-md border border-slate-200/90 flex items-center gap-2 text-xs font-bold text-slate-800',
        className
      )}
    >
      <div className="flex items-center gap-1">
        <MapPin className="w-3.5 h-3.5 text-rose-500" />
        <select
          value={selectedWardFilter}
          onChange={(e) => setSelectedWardFilter(e.target.value)}
          className="bg-transparent text-xs font-bold outline-none cursor-pointer pr-1"
        >
          <option value="All Wards">{t('allWards')}</option>
          <option value="Ward 1">{t('ward1Name')}</option>
          <option value="Ward 2">{t('ward2Name')}</option>
          <option value="Ward 3">{t('ward3Name')}</option>
        </select>
      </div>

      <div className="w-[1px] h-3.5 bg-slate-200" />

      {/* "All" Green Pill */}
      <button
        type="button"
        onClick={() => setActiveStatusDot('all')}
        className={`px-2 py-0.5 rounded-full text-[11px] font-black transition-colors cursor-pointer ${
          activeStatusDot === 'all'
            ? 'bg-emerald-600 text-white'
            : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        {t('filterAll')}
      </button>

      {/* Status Red/Green Dots */}
      <div className="flex items-center gap-1.5 pl-0.5">
        <button
          type="button"
          onClick={() => setActiveStatusDot('red')}
          className={`w-2.5 h-2.5 rounded-full bg-rose-500 transition-transform cursor-pointer ${
            activeStatusDot === 'red' ? 'ring-2 ring-rose-300 scale-125' : 'opacity-80'
          }`}
          title={t('statusDirty')}
        />
        <button
          type="button"
          onClick={() => setActiveStatusDot('green')}
          className={`w-2.5 h-2.5 rounded-full bg-emerald-500 transition-transform cursor-pointer ${
            activeStatusDot === 'green' ? 'ring-2 ring-emerald-300 scale-125' : 'opacity-80'
          }`}
          title={t('statusResolved')}
        />
      </div>
    </div>
  );
}

export interface MobileMapControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onOpenLayerModal?: () => void;
  activeLayer?: MapLayerType;
  className?: string;
}

export function MobileMapControls({
  onZoomIn,
  onZoomOut,
  onOpenLayerModal,
  activeLayer = 'default',
  className = '',
}: MobileMapControlsProps) {
  const t = useTranslations('grievance');

  return (
    <div className={cn('pointer-events-auto flex flex-col gap-1.5 items-center', className)}>
      <button
        type="button"
        onClick={onZoomIn}
        className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md transition-all cursor-pointer active:scale-95"
        title={t('zoomIn')}
        aria-label={t('zoomIn')}
      >
        <Plus className="w-4 h-4 stroke-[3]" />
      </button>

      <button
        type="button"
        onClick={onZoomOut}
        className="w-8 h-8 rounded-full bg-white text-slate-700 hover:bg-slate-50 flex items-center justify-center shadow-md border border-slate-200/90 transition-all cursor-pointer active:scale-95"
        title={t('zoomOut')}
        aria-label={t('zoomOut')}
      >
        <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>

      <button
        type="button"
        onClick={onOpenLayerModal}
        className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md border transition-all cursor-pointer active:scale-95 ${
          activeLayer !== 'default'
            ? 'bg-emerald-600 border-emerald-500 text-white'
            : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200/90'
        }`}
        title={t('mapLayers')}
        aria-label={t('mapLayers')}
      >
        <Layers className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

