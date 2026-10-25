'use client';

/**
 * Details Tab for Grievance GIS Detail Inspector Drawer.
 * Standard: Clean Architecture / ntis-ui
 */

import { ExternalLink, MapPin, Image as ImageIcon, User, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { BeforeAfterSlider } from '@/components/common/BeforeAfterSlider';
import type { GisGrievancePopupDetailsDto, GisGrievancePopupPhotoDto } from '@/types/grievance/grievance-gis.types';
import { getGrievancePhotoViewUrl } from '@/lib/utils/grievance';

interface GisDrawerDetailsTabProps {
  details: GisGrievancePopupDetailsDto;
}

export function GisDrawerDetailsTab({ details }: GisDrawerDetailsTabProps) {
  const t = useTranslations('grievance');

  const resolvePhotoUrl = (p?: GisGrievancePopupPhotoDto | null): string | undefined => {
    if (!p) return undefined;
    if (p.photoId) {
      return getGrievancePhotoViewUrl(p.photoId);
    }
    return p.fileUrl || undefined;
  };

  const beforeItem = details.photos?.find(
    (p) => p.photoTypeCode?.toLowerCase().includes('before') || p.photoTypeName?.toLowerCase().includes('before')
  ) || details.photos?.[0];

  const afterItem = details.photos?.find(
    (p) => p.photoTypeCode?.toLowerCase().includes('after') || p.photoTypeName?.toLowerCase().includes('after')
  );

  const beforePhoto = resolvePhotoUrl(beforeItem);
  const afterPhoto = resolvePhotoUrl(afterItem);

  return (
    <>
      {/* Department & Classification */}
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {t('gisDeptAndClassification')}
        </div>
        <div className="text-xs font-bold text-slate-800">
          {details.departmentName || 'General Grievance'}
        </div>
        <div className="text-[11px] text-slate-600">
          {details.grievanceTypeName || 'Unspecified Type'}
        </div>
      </div>

      {/* Description */}
      {details.description && (
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {t('gisDescription')}
          </span>
          <p className="text-xs text-slate-700 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-200">
            {details.description}
          </p>
        </div>
      )}

      {/* Before / After Photo Comparison */}
      {beforePhoto && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>{t('gisPhotoProofSlider')}</span>
          </div>
          <div className="rounded-xl overflow-hidden border border-slate-200 shadow-xs">
            <BeforeAfterSlider
              beforeImage={beforePhoto}
              afterImage={afterPhoto}
              beforeLabel="Before"
              afterLabel="After"
              aspectRatioClassName="aspect-video"
            />
          </div>
        </div>
      )}

      {/* Location & Landmark */}
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {t('gisLocationCoordinates')}
          </span>
          {details.googleMapLink && (
            <a
              href={details.googleMapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700"
            >
              <span>{t('gisGoogleMaps')}</span> <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
          <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            {details.roadLandmark || `${details.wardName || ''}, ${details.zoneName || ''}`}
          </span>
        </div>
        {details.latitude && details.longitude && (
          <div className="text-[11px] font-mono text-slate-500 pl-6">
            {`${details.latitude}, ${details.longitude}`}
          </div>
        )}
      </div>

      {/* Citizen & Assigned Personnel */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-0.5">
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
            <User className="w-3 h-3" />
            <span>{t('gisReportedBy')}</span>
          </div>
          <div className="text-xs font-bold text-slate-800 truncate">
            {details.citizenName || 'Citizen'}
          </div>
          {details.citizenMobile && (
            <div className="text-[11px] text-slate-500 font-mono">
              {details.citizenMobile}
            </div>
          )}
        </div>

        <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-0.5">
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
            <Clock className="w-3 h-3" />
            <span>{t('gisAssignedTo')}</span>
          </div>
          <div className="text-xs font-bold text-slate-800 truncate">
            {details.currentAssignedToUserName || 'Unassigned'}
          </div>
          <div className="text-[11px] text-slate-500">
            {t('gisDaysOpen', { count: details.daysOpen || 0 })}
          </div>
        </div>
      </div>
    </>
  );
}
