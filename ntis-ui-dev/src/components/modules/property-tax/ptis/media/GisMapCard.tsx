'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { ImageWithFallback } from './ImageWithFallback';
import type { AdditionalImage } from './MediaImageCards';

interface GisMapCardProps {
  image?: AdditionalImage;
  hasCoords?: boolean;
  onClick: () => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: () => void;
}

export function GisMapCard({ image, hasCoords = true, onClick, onMouseEnter, onMouseLeave }: GisMapCardProps): React.ReactElement {
  const t = useTranslations('ptis');

  return (
    <div
      className="relative group bg-slate-100 rounded-lg overflow-hidden border-2 border-slate-200 shadow-md hover:border-green-500 hover:border-4 transition-all cursor-pointer flex-1 min-h-[105px] lg:min-h-0 lg:h-0"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <ImageWithFallback
        src={hasCoords ? (image?.src ?? '') : ''}
        documentGuid={image?.documentGuid}
        alt={image?.alt || 'GIS Map View'}
        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
        width={400}
        height={300}
        priority
      />
      {/* Animated property marker */}
      {hasCoords && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75 w-4 h-4" />
            <div className="relative bg-red-600 rounded-full w-4 h-4 border-2 border-white shadow-lg" />
          </div>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 pointer-events-none">
        <p className="text-white text-xs">{image?.title || t('media.satelliteView')}</p>
      </div>
    </div>
  );
}
