'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Award, Eye } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface StaticCertificateCardProps {
  fileName?: string | null;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  isClickable?: boolean;
}

/**
 * Static Certificate Thumbnail rendered when the actual document returns 404 or fails to load.
 * Displays an elegant municipal certificate sheet with official seal and document lines.
 */
export const StaticCertificateCard: React.FC<StaticCertificateCardProps> = ({
  fileName,
  className,
  onClick,
  isClickable,
}) => {
  const t = useTranslations('common');
  const getSafe = (key: string, fallback: string) => {
    try {
      const res = t(key);
      if (res && !res.startsWith('documentThumbnail') && !res.includes('MISSING_MESSAGE')) {
        return res;
      }
    } catch { /* fallback */ }
    return fallback;
  };

  const isPdf = (fileName || '').toLowerCase().endsWith('.pdf');
  const isImg = /\.(jpe?g|png|webp|bmp|gif)$/i.test(fileName || '');
  const microTag = isPdf ? 'PDF' : isImg ? 'IMG' : 'CERT';

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      className={cn(
        'group relative w-full h-full rounded-lg border border-slate-200/90 bg-gradient-to-b from-slate-50 via-white to-slate-100/90 overflow-hidden shadow-2xs select-none flex flex-col justify-between p-1 transition-all duration-200',
        isClickable && 'cursor-pointer hover:border-blue-400 hover:shadow-xs active:scale-[0.98]',
        className
      )}
      title={getSafe('documentThumbnail.certificateClickToView', 'Building Certificate (Click to view)')}
      aria-label={getSafe('documentThumbnail.certificate', 'Building Certificate')}
    >
      {/* Top Header: Badge + Status Dot */}
      <div className="flex items-center justify-between w-full">
        <span
          className={cn(
            'px-1 py-0.2 rounded text-[7px] font-black uppercase tracking-wider leading-none',
            isPdf
              ? 'bg-rose-100 text-rose-700 border border-rose-200'
              : isImg
                ? 'bg-sky-100 text-sky-700 border border-sky-200'
                : 'bg-blue-100 text-blue-700 border border-blue-200'
          )}
        >
          {microTag}
        </span>
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
      </div>

      {/* Simulated Certificate Sheet: Official Header & Body Lines */}
      <div className="my-auto flex flex-col items-center justify-center gap-0.5 w-full px-0.5 py-0.5">
        <div className="h-0.5 w-9 bg-slate-300 rounded-full" />
        <div className="h-0.5 w-6 bg-slate-200 rounded-full" />

        <div className="w-full space-y-0.5 mt-0.5">
          <div className="h-0.5 w-full bg-slate-200/80 rounded-full" />
          <div className="h-0.5 w-4/5 bg-slate-200/80 rounded-full" />
          <div className="h-0.5 w-3/4 bg-slate-200/80 rounded-full" />
        </div>
      </div>

      {/* Bottom Footer: Official Stamp / Ribbon Seal + Label */}
      <div className="flex items-center justify-between w-full pt-0.5 border-t border-slate-200/60">
        <span className="text-[7px] font-bold text-slate-500 uppercase tracking-tight truncate max-w-[42px] leading-none">
          {getSafe('documentThumbnail.official', 'Official')}
        </span>
        {/* Gold Ribbon Seal */}
        <div className="w-3.5 h-3.5 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center shadow-2xs">
          <Award className="w-2 h-2 text-amber-600" />
        </div>
      </div>

      {/* Interactive hover overlay */}
      {isClickable && (
        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-0.5 text-white backdrop-blur-[0.5px]">
          <Eye className="w-4 h-4 text-white drop-shadow-sm shrink-0" />
          <span className="text-[8px] font-bold tracking-wide drop-shadow-sm">
            {getSafe('documentThumbnail.view', 'View')}
          </span>
        </div>
      )}
    </div>
  );
};
