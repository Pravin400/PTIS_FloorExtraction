'use client';

import { Maximize2, Building2, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { AssetMeasurementsSectionProps } from '@/types/asset-gis.types';

export function AssetMeasurementsSection({
  plotNo,
  plotArea,
  citySurveyNo,
  carpetAreaVal,
  carpetAreaSqFt,
  builtUpAreaVal,
  builtUpArea,
  conYear,
  floor,
  parentAssetId,
  noOfRoomsVal,
  combinedChildAssetsCount,
  marathiOwnerPatta,
  lat,
  lng,
  formatArea,
}: AssetMeasurementsSectionProps) {
  const t = useTranslations('assetGis');

  return (
    <>
      {/* Measurements & Area */}
      <div className="p-2.5 bg-white rounded-2xl border border-slate-200/80 shadow-sm text-[11px] space-y-1.5">
        <h4 className="text-[10px] font-black uppercase text-blue-700 tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100">
          <Maximize2 className="w-3.5 h-3.5 shrink-0" />
          <span>{t('details.measurementsAndArea') || 'MEASUREMENTS & AREA'}</span>
        </h4>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          <div className="flex justify-between border-b border-slate-50 pb-0.5">
            <span className="text-slate-500 font-extrabold uppercase text-[9.5px]">{t('details.plotNo') || 'PLOT NO'}:</span>
            <span className="font-extrabold text-slate-800">{plotNo}</span>
          </div>
          <div className="flex justify-between border-b border-slate-50 pb-0.5">
            <span className="text-slate-500 font-extrabold uppercase text-[9.5px]">{t('details.plotArea') || 'PLOT AREA'}:</span>
            <span className="font-extrabold text-slate-800">{formatArea(plotArea)}</span>
          </div>
          <div className="flex justify-between border-b border-slate-50 pb-0.5">
            <span className="text-slate-500 font-extrabold uppercase text-[9.5px]">{t('details.citySurveyNo') || 'CITY SURVEY NO'}:</span>
            <span className="font-extrabold text-slate-800">{citySurveyNo}</span>
          </div>
          <div className="flex justify-between border-b border-slate-50 pb-0.5">
            <span className="text-slate-500 font-extrabold uppercase text-[9.5px]">{t('details.carpetArea') || 'CARPET AREA'}:</span>
            <span className="font-extrabold text-slate-800">
              {formatArea(carpetAreaVal || carpetAreaSqFt)}
            </span>
          </div>
          <div className="flex justify-between col-span-2">
            <span className="text-slate-500 font-extrabold uppercase text-[9.5px]">{t('details.builtUpArea') || 'BUILT-UP AREA'}:</span>
            <span className="font-extrabold text-slate-800">
              {formatArea(builtUpAreaVal || builtUpArea)}
            </span>
          </div>
        </div>
      </div>

      {/* Structure Details */}
      <div className="p-2.5 bg-white rounded-2xl border border-slate-200/80 shadow-sm text-[11px] space-y-1.5">
        <h4 className="text-[10px] font-black uppercase text-indigo-700 tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100">
          <Building2 className="w-3.5 h-3.5 shrink-0" />
          <span>{t('details.structureDetails') || 'STRUCTURE DETAILS'}</span>
        </h4>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          <div className="flex justify-between border-b border-slate-50 pb-0.5">
            <span className="text-slate-500 font-extrabold uppercase text-[9.5px]">{t('details.constructionYear') || 'CONST. YEAR'}:</span>
            <span className="font-extrabold text-slate-800">{conYear}</span>
          </div>
          <div className="flex justify-between border-b border-slate-50 pb-0.5">
            <span className="text-slate-500 font-extrabold uppercase text-[9.5px]">{t('details.totalFloors') || 'TOTAL FLOORS'}:</span>
            <span className="font-extrabold text-slate-800">{floor}</span>
          </div>
          <div className="flex justify-between col-span-2">
            <span className="text-slate-500 font-extrabold uppercase text-[9.5px]">{t('details.roomsUnits') || 'ROOMS / UNITS'}:</span>
            <span className="font-extrabold text-slate-800">
              {parentAssetId ? '1 Shop Unit' : (noOfRoomsVal > 0 ? `${noOfRoomsVal} Units` : (combinedChildAssetsCount > 0 ? `${combinedChildAssetsCount} Units` : 'N/A'))}
            </span>
          </div>
        </div>
      </div>

      {/* Location & Address */}
      <div className="p-2.5 bg-white rounded-2xl border border-slate-200/80 shadow-sm text-[11px] space-y-1.5">
        <h4 className="text-[10px] font-black uppercase text-emerald-700 tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span>{t('details.locationAndAddress') || 'LOCATION & ADDRESS'}</span>
        </h4>
        <div className="space-y-1.5">
          <div>
            <span className="text-slate-500 font-extrabold uppercase text-[9.5px] block mb-0.5">{t('details.address') || 'ADDRESS'}:</span>
            <p className="font-semibold text-slate-800 text-[10.5px] leading-relaxed">
              {marathiOwnerPatta}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 font-mono text-[10px]">
            <div>
              <span className="text-slate-400 font-bold uppercase text-[8.5px] block">{t('details.latitude') || 'LATITUDE'}:</span>
              <span className="font-extrabold text-slate-800">{lat || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[8.5px] block">{t('details.longitude') || 'LONGITUDE'}:</span>
              <span className="font-extrabold text-slate-800">{lng || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
