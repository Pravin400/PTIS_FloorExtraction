'use client';
import type { GisLocationSectionProps } from '@/types/asset/municipal-Asset/asset-detail.types';
import { useTranslations } from 'next-intl';
import React from 'react';
import { SectionCard } from './SectionCard';
import { MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import dynamic from 'next/dynamic';

const AssetGisLocationMap = dynamic(() => import('./AssetGisLocationMap'), { ssr: false });

export function GisLocationSection({ data }: GisLocationSectionProps): React.ReactElement {
  const t = useTranslations('asset-detail');
  const router = useRouter();
  const locale = useLocale();

  const handleOpenGis = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Attempt to extract numeric id from data.assetId (e.g. 'MPMS274' -> '274')
    let numericIdStr = data.assetId;
    if (numericIdStr && numericIdStr.startsWith('MPMS')) {
      numericIdStr = numericIdStr.replace('MPMS', '');
    }

    const targetUrl = `/${locale}/assets/gismapviewer${data.upicId && data.upicId !== '-'
      ? `?assetId=${encodeURIComponent(data.upicId)}`
      : numericIdStr
        ? `?assetId=MPMS${numericIdStr}`
        : ''
      }`;

    router.push(targetUrl);
  };

  const lat = data.latitude;
  const lng = data.longitude;

  return (
    <SectionCard
      title={t('gisLocation')}
      titleIcon={<MapPin className="w-3.5 h-3.5 text-white" />} iconBgClass="bg-blue-500"
    >
      <div
        role="button"
        tabIndex={0}
        aria-label={t('clickToOpenGis')}
        className="relative w-full h-40 rounded-lg overflow-hidden border border-slate-200 bg-[#e8f0e8] cursor-pointer group"
        onClick={handleOpenGis}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpenGis();
          }
        }}
      >
        {lat !== undefined && lng !== undefined && (
          <AssetGisLocationMap lat={lat} lng={lng} zoom={16} />
        )}

        {/* Badge overlay */}
        <div className="absolute top-2 left-0 right-0 text-center px-1 z-10 drop-shadow-md bg-white/70 backdrop-blur-sm mx-2 rounded py-0.5 border border-white/50 flex flex-col items-center justify-center pointer-events-none transition-all group-hover:shadow-sm group-hover:border-blue-400/50">
          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider line-clamp-1 drop-shadow-sm">
            {t('clickToOpenGis')}
          </span>
        </div>
      </div>
    </SectionCard>
  );
}
