/* eslint-disable i18next/no-literal-string */
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { MapPin, ExternalLink } from 'lucide-react';
import { Card, Badge } from '@/components/common';
import type { GISLocationCardProps } from '@/types/asset-gis.types';

export function GISLocationCard({ assetId, src }: GISLocationCardProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('assetGis.map');
  const [imageError, setImageError] = useState(false);

  const handleViewOnGIS = () => {
    const id = assetId ?? '';
    const url = id
      ? `/${locale}/assets/gismapviewer?assetId=${encodeURIComponent(String(id))}`
      : `/${locale}/assets/gismapviewer`;
    router.push(url);
  };

  const hasValidImage = Boolean(src) && !imageError;

  return (
    <Card className="min-h-[130px] h-full flex-1 w-full flex flex-col p-0 bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        aria-label="View asset on GIS Map"
        className="w-full h-full min-h-[130px] relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center group cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        onClick={handleViewOnGIS}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleViewOnGIS();
          }
        }}
      >
        {hasValidImage ? (
          <Image
            src={src!}
            alt="GIS Location Map"
            fill
            sizes="300px"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-110"
            priority
            unoptimized
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full min-h-[130px] bg-gradient-to-br from-slate-100 via-sky-50 to-blue-100/70 relative flex flex-col items-center justify-center p-4 overflow-hidden transition-all duration-300 group-hover:from-slate-200/80 group-hover:via-sky-100 group-hover:to-blue-200/80">
            {/* Subtle Map Grid Background Pattern */}
            <div
              className="absolute inset-0 opacity-[0.15] pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(#0284c7 1px, transparent 1px), linear-gradient(to right, #0284c7 1px, transparent 1px), linear-gradient(to bottom, #0284c7 1px, transparent 1px)',
                backgroundSize: '20px 20px, 40px 40px, 40px 40px',
              }}
            />
            {/* Map Roads / Contours Vector SVG Background */}
            <svg
              className="absolute inset-0 w-full h-full opacity-25 pointer-events-none stroke-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 300 130"
              preserveAspectRatio="none"
              fill="none"
              strokeWidth="2"
            >
              <path d="M-10 40 Q 60 20, 120 70 T 260 50 T 320 90" strokeDasharray="6 3" />
              <path d="M 40 -10 Q 90 60, 160 80 T 290 140" />
              <path d="M 180 -10 Q 200 50, 140 100 T 80 140" strokeWidth="1.5" strokeOpacity="0.6" />
            </svg>

            {/* Central Animated Map Marker Icon */}
            <div className="relative z-10 flex flex-col items-center gap-1.5 transition-transform duration-300 group-hover:scale-105">
              <div className="w-9 h-9 rounded-2xl bg-white shadow-md border border-sky-200 flex items-center justify-center text-blue-600 relative group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <MapPin className="w-5 h-5 text-red-500 group-hover:text-white transition-colors duration-300" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white animate-ping" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700 group-hover:text-blue-700 transition-colors">
                <span>View on GIS Map</span>
                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </div>
            </div>
          </div>
        )}

        {/* Top Badges */}
        <Badge className="absolute top-2 left-2 z-10 bg-[#0759E8]/90 text-white font-extrabold text-[9.5px] px-2.5 py-0.5 rounded-full shadow-md backdrop-blur-xs uppercase tracking-wider flex items-center gap-1 border-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {t('liveGisLocation')}
        </Badge>
        <Badge className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs shadow-md p-0 border-0">
          📍
        </Badge>
      </div>
    </Card>
  );
}
