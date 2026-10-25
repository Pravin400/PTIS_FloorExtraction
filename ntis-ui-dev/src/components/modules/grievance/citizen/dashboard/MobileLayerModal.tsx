'use client';

import { Layers, X, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { MapLayerType } from '../../shared/AmravatiMap';

interface MobileLayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeLayer: MapLayerType;
  onLayerChange?: (layer: MapLayerType) => void;
  showBoundary?: boolean;
  onToggleBoundary?: () => void;
}

export function MobileLayerModal({
  isOpen,
  onClose,
  activeLayer,
  onLayerChange,
  showBoundary = true,
  onToggleBoundary,
}: MobileLayerModalProps) {
  const t = useTranslations('grievance');
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-150 pointer-events-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs bg-white rounded-2xl p-3.5 shadow-2xl border border-slate-200 space-y-2.5 animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <h4 className="text-xs font-black text-slate-900">{t('mapLayers')}</h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Layer Cards */}
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: 'default', label: 'Default', desc: 'Streets' },
            { id: 'satellite', label: 'Satellite', desc: 'Aerial' },
            { id: 'terrain', label: 'Terrain', desc: 'Topo' },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                onLayerChange?.(opt.id as MapLayerType);
                onClose();
              }}
              className={`p-2 rounded-xl border flex flex-col items-center text-center cursor-pointer transition-all ${
                activeLayer === opt.id
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 font-extrabold'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold'
              }`}
            >
              <span className="text-base mb-0.5">
                {opt.id === 'satellite' ? '🛰️' : opt.id === 'terrain' ? '⛰️' : '🗺️'}
              </span>
              <span className="text-[11px] leading-tight">{opt.label}</span>
              <span className="text-[9px] text-slate-400 font-medium leading-tight">
                {opt.desc}
              </span>
            </button>
          ))}
        </div>

        {/* Ward Boundary Toggle */}
        {onToggleBoundary && (
          <div
            onClick={onToggleBoundary}
            className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
          >
            <span className="text-[11px] font-bold text-slate-800">
              {t('amcBoundary')}
            </span>
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
        )}
      </div>
    </div>
  );
}
