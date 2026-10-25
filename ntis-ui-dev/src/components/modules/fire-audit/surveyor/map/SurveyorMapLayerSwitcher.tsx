'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Layers } from 'lucide-react';
import { Button } from '@/components/common';
import type { SurveyorMapLayerType } from '@/lib/constants/fire-audit';
import { MAP_THUMBNAILS } from './map-thumbnails';

export interface SurveyorMapLayerSwitcherProps {
  activeLayer: SurveyorMapLayerType;
  onLayerChange: (layer: SurveyorMapLayerType) => void;
  className?: string;
}

const LAYERS: readonly SurveyorMapLayerType[] = ['default', 'satellite', 'terrain'] as const;

export function SurveyorMapLayerSwitcher({
  activeLayer,
  onLayerChange,
  className = '',
}: SurveyorMapLayerSwitcherProps) {
  const t = useTranslations('fireAuditSurveyor.map');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside interaction
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectLayer = useCallback(
    (layer: SurveyorMapLayerType) => {
      onLayerChange(layer);
      setIsOpen(false);
    },
    [onLayerChange]
  );

  return (
    <div
      ref={containerRef}
      className={`inline-flex flex-col items-end ${className}`}
    >
      {/* Toggle Layers Icon Trigger */}
      <Button
        type="button"
        variant="ghost"
        size="xs"
        aria-label="Toggle map layer selection"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`h-9! w-9! p-0! rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-[0_2px_8px_rgba(15,23,42,0.08)] text-slate-700 hover:text-slate-900 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer ${
          isOpen ? 'ring-2 ring-blue-600/30 border-blue-600 text-blue-600' : ''
        }`}
      >
        <Layers className="w-4.5 h-4.5 text-slate-700" />
      </Button>

      {/* Floating 3-Thumbnail Cards Popover (Positioned below trigger with top pointer) */}
      {isOpen && (
        <div
          role="radiogroup"
          aria-label="Map Layer Selection"
          className="relative mt-2 p-2.5 rounded-2xl bg-white/98 backdrop-blur-md border border-slate-200/90 shadow-[0_12px_36px_rgba(15,23,42,0.18)] flex items-center gap-2.5 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-150 z-40"
        >
          {/* Top Pointer Arrow */}
          <div className="absolute -top-1.5 right-3 w-3 h-3 bg-white rotate-45 border-t border-l border-slate-200/90" />

          {LAYERS.map((layer) => {
            const isActive = activeLayer === layer;
            const Thumbnail = MAP_THUMBNAILS[layer];
            const label =
              layer === 'default'
                ? t('layerDefault')
                : layer === 'satellite'
                ? t('layerSatellite')
                : t('layerTerrain');

            return (
              <Button
                key={layer}
                type="button"
                variant="ghost"
                role="radio"
                aria-checked={isActive}
                onClick={() => handleSelectLayer(layer)}
                className={`h-auto! px-1! py-1! flex flex-col items-center rounded-xl transition-all cursor-pointer group hover:bg-slate-50 ${
                  isActive ? 'text-blue-600' : 'text-slate-600'
                }`}
              >
                {/* Visual Map Preview Thumbnail Frame */}
                <div
                  className={`w-16 h-12 rounded-xl overflow-hidden relative transition-all ${
                    isActive
                      ? 'ring-2 ring-blue-600 ring-offset-2 scale-[1.02] shadow-sm'
                      : 'border border-slate-200 group-hover:scale-[1.02] opacity-80 group-hover:opacity-100'
                  }`}
                >
                  <Thumbnail />
                </div>

                {/* Layer Label */}
                <span
                  className={`text-[11px] mt-1.5 font-bold transition-colors ${
                    isActive
                      ? 'text-blue-600 font-bold'
                      : 'text-slate-600 font-medium group-hover:text-slate-900'
                  }`}
                >
                  {label}
                </span>
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
