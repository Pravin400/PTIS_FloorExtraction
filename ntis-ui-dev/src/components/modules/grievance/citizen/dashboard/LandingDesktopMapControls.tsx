'use client';

import { useState } from 'react';
import { ChevronDown, Plus, Minus, Layers, X, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { MapLayerType } from '../../shared/AmravatiMap';

interface LandingDesktopMapControlsProps {
  selectedWard: string;
  onToggleWard: () => void;
  activeFilter: 'all' | 'dirty' | 'clean';
  onFilterChange: (filter: 'all' | 'dirty' | 'clean') => void;
  onReport: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  activeLayer: MapLayerType;
  onLayerChange: (layer: MapLayerType) => void;
  showBoundary: boolean;
  onToggleBoundary: () => void;
}

export function LandingDesktopMapControls({
  selectedWard,
  onToggleWard,
  activeFilter,
  onFilterChange,
  onReport,
  onZoomIn,
  onZoomOut,
  activeLayer,
  onLayerChange,
  showBoundary,
  onToggleBoundary,
}: LandingDesktopMapControlsProps) {
  const t = useTranslations('grievance');
  const [isDesktopLayerOpen, setIsDesktopLayerOpen] = useState(false);

  return (
    <>
      {/* Top-Left In-Map Controls: Ward Selector & Status Filter Pills */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 flex-wrap pointer-events-auto">
        <div
          onClick={onToggleWard}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-md text-xs font-bold text-slate-800 cursor-pointer hover:bg-slate-50 transition-colors"
        >
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span>{selectedWard === 'All Wards' ? t('allWards') : selectedWard}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </div>

        <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200 shadow-md text-xs font-bold">
          <button
            type="button"
            onClick={() => onFilterChange('all')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('filterAll')}
          </button>
          <button
            type="button"
            onClick={() => onFilterChange('dirty')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'dirty'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            {t('statusDirty')}
          </button>
          <button
            type="button"
            onClick={() => onFilterChange('clean')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'clean'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
            {t('statusCleaned')}
          </button>
        </div>
      </div>

      {/* Top-Right Floating Zoom & Layer Stack */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={onReport}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer pointer-events-auto active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{t('reportGrievance')}</span>
        </button>

        <div className="relative pointer-events-auto self-end">
          <div className="bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-md p-1 flex flex-col gap-1 items-center">
            <button
              type="button"
              onClick={onZoomIn}
              className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title={t('zoomIn')}
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onZoomOut}
              className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title={t('zoomOut')}
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="w-4 h-px bg-slate-200 my-0.5" />
            <button
              type="button"
              onClick={() => setIsDesktopLayerOpen((v) => !v)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                activeLayer !== 'default' || isDesktopLayerOpen
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
              title={t('mapLayers')}
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>

          {/* Desktop Layer Selection Flyout Popover */}
          {isDesktopLayerOpen && (
            <div className="absolute top-0 right-full mr-2 w-64 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-2xl border border-slate-200 space-y-2 animate-in fade-in zoom-in-95 duration-150 z-30 pointer-events-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t('mapLayers')}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsDesktopLayerOpen(false)}
                  className="w-5 h-5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'default', label: t('layerDefault'), desc: t('layerDescStreets') },
                  { id: 'satellite', label: t('layerSatellite'), desc: t('layerDescAerial') },
                  { id: 'terrain', label: t('layerTerrain'), desc: t('layerDescTopo') },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onLayerChange(opt.id as MapLayerType);
                      setIsDesktopLayerOpen(false);
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center text-center cursor-pointer transition-all ${
                      activeLayer === opt.id
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 font-black'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold'
                    }`}
                  >
                    <span className="text-base mb-0.5">
                      {opt.id === 'satellite' ? '🛰️' : opt.id === 'terrain' ? '⛰️' : '🗺️'}
                    </span>
                    <span className="text-[11px] leading-tight">{opt.label}</span>
                    <span className="text-[9px] text-slate-400 font-medium leading-tight">{opt.desc}</span>
                  </button>
                ))}
              </div>

              {/* Boundary Checkbox */}
              <div
                onClick={onToggleBoundary}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <span className="text-[11px] font-bold text-slate-800">{t('amcBoundary')}</span>
                <span
                  className={`w-4 h-4 rounded-md flex items-center justify-center text-xs font-black border ${
                    showBoundary
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {showBoundary && <Check className="w-3 h-3 stroke-[3]" />}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
