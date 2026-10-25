/**
 * Register Location Section (Layer 2 - Presentation Component)
 * Path: src/components/modules/grievance/citizen/registration/RegisterLocationSection.tsx
 *
 * Compact GPS auto-detect and road name / landmark input
 * formatted for horizontal side-by-side grid alignment.
 */

'use client';

import { MapPin, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/common';
import type { ResolvedCitizenPlace } from '@/lib/services/grievance';

interface RegisterLocationSectionProps {
  roadLandmark: string;
  setRoadLandmark: (val: string) => void;
  locationCoords: ResolvedCitizenPlace | null;
  isDetectingLocation: boolean;
  autoDetectLocation: (force?: boolean) => void;
  error?: string;
  clearFieldError: () => void;
}

export function RegisterLocationSection({
  roadLandmark,
  setRoadLandmark,
  locationCoords,
  isDetectingLocation,
  autoDetectLocation,
  error,
  clearFieldError,
}: RegisterLocationSectionProps) {
  const t = useTranslations('grievance');

  return (
    <div className="p-2.5 sm:p-3 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-1.5 h-full flex flex-col justify-between">
      <div className="space-y-1.5">
        {/* 1. Header with Live GPS Detection */}
        <div className="flex items-center justify-between">
          <label className="text-[10.5px] font-black text-slate-800 uppercase flex items-center gap-1 truncate">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{t('roadLandmark')}</span>
            <span className="text-red-500">*</span>
          </label>

          {/* 1-Tap Auto-GPS Button */}
          <button
            type="button"
            onClick={() => {
              autoDetectLocation(true);
              clearFieldError();
            }}
            disabled={isDetectingLocation}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9.5px] font-bold border transition-all cursor-pointer active:scale-95 ${
              isDetectingLocation
                ? 'bg-blue-50 text-blue-700 border-blue-300 animate-pulse'
                : locationCoords
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
            title={t('autoDetectGps')}
          >
            {isDetectingLocation ? (
              <>
                <Loader2 className="w-2.5 h-2.5 text-blue-600 animate-spin" />
                <span>{`${t('locateMe')}...`}</span>
              </>
            ) : (
              <>
                <span className="relative flex h-1.5 w-1.5 mr-0.5">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      locationCoords ? 'bg-emerald-400' : 'bg-blue-400'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                      locationCoords ? 'bg-emerald-500' : 'bg-blue-500'
                    }`}
                  />
                </span>
                <span>{t('locateMe')}</span>
              </>
            )}
          </button>
        </div>

        {/* 2. Detected GPS Badge */}
        {locationCoords && (
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-[9.5px] font-bold truncate animate-in fade-in duration-150">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
            <span className="truncate flex-1">
              {locationCoords.placeName || t('liveGpsPrefix')}
            </span>
          </div>
        )}

        {/* 3. Landmark Input */}
        <Input
          type="text"
          value={roadLandmark}
          onChange={(e) => {
            setRoadLandmark(e.target.value);
            if (error) clearFieldError();
          }}
          placeholder={t('roadLandmarkPlaceholder')}
          className={`w-full bg-white text-xs h-8 rounded-xl transition-all shadow-2xs ${
            error
              ? 'border-red-500 ring-1 ring-red-400/30'
              : locationCoords
              ? 'border-emerald-300 ring-1 ring-emerald-400/20'
              : 'border-slate-200'
          }`}
        />

        {error && (
          <p className="text-[9.5px] font-bold text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />
            <span>{error}</span>
          </p>
        )}
      </div>
    </div>
  );
}
