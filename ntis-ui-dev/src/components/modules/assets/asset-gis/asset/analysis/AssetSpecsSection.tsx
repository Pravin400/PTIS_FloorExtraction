'use client';

import { Users, Phone, MapPin, Layers, Hash, Calendar } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/common';
import type { AssetSpecsSectionProps } from '@/types/asset-gis.types';

export type { AssetSpecsSectionProps };

export function AssetSpecsSection({
  occupier,
  mobile,
  address,
  plotNo,
  citySurveyNo,
  carpetAreaSqFt,
  builtUpArea,
  constYear,
  totalFloors,
  encroachmentStatus,
}: AssetSpecsSectionProps) {
  const t = useTranslations('assetGis');

  return (
    <div className="p-4 space-y-3 border-b border-slate-200">
      <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
        {t('details.basicDetails') || 'Specifications'}
      </h3>

      <div className="grid grid-cols-2 gap-2.5">
        {/* In-Charge / Occupier */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[10px] font-bold uppercase">{t('details.inCharge')}</span>
          </div>
          <span className="text-xs font-black text-slate-800 block truncate" title={occupier}>
            {occupier !== 'N/A' ? occupier : t('details.notAssigned')}
          </span>
        </div>

        {/* Mobile */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <Phone className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[10px] font-bold uppercase">{t('details.contact')}</span>
          </div>
          <span className="text-xs font-black text-slate-800 font-mono block truncate">
            {mobile !== 'N/A' ? mobile : '—'}
          </span>
        </div>

        {/* Plot No */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <MapPin className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-[10px] font-bold uppercase">{t('details.plotNo')}</span>
          </div>
          <span className="text-xs font-black text-slate-800 block truncate">
            {plotNo !== 'N/A' ? plotNo : '—'}
          </span>
        </div>

        {/* City Survey Number */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <Hash className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-[10px] font-bold uppercase">{t('details.citySurveyNo')}</span>
          </div>
          <span className="text-xs font-black text-slate-800 block truncate">
            {citySurveyNo !== 'N/A' ? citySurveyNo : '—'}
          </span>
        </div>

        {/* Built-Up Area */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[10px] font-bold uppercase">{t('details.builtUpArea')}</span>
          </div>
          <span className="text-xs font-black text-slate-800 block truncate">
            {builtUpArea !== 'N/A' ? `${builtUpArea}` : '—'}
          </span>
        </div>

        {/* Carpet Area */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[10px] font-bold uppercase">{t('details.carpetArea')}</span>
          </div>
          <span className="text-xs font-black text-slate-800 block truncate">
            {carpetAreaSqFt && carpetAreaSqFt !== 'N/A' ? `${carpetAreaSqFt}` : '—'}
          </span>
        </div>

        {/* Construction Year / Floors */}
        {(constYear || totalFloors) && (
          <div className="col-span-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            {constYear && constYear !== 'N/A' && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[11px] font-bold text-slate-600">
                  {t('details.built', { year: constYear })}
                </span>
              </div>
            )}
            {totalFloors && (
              <span className="text-[11px] font-bold text-slate-600">
                {t('details.floors', { count: totalFloors })}
              </span>
            )}
            {encroachmentStatus && (
              <Badge
                variant={encroachmentStatus.toLowerCase() === 'yes' ? 'destructive' : 'success'}
                size="sm"
                className="text-[10px] font-bold px-2 py-0.5"
              >
                {t('details.encroachment')}: {encroachmentStatus}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Address */}
      {address && address !== 'N/A' && (
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">{t('details.location')}</span>
          <p className="text-xs font-bold text-slate-700 leading-relaxed line-clamp-2">
            {address}
          </p>
        </div>
      )}
    </div>
  );
}
