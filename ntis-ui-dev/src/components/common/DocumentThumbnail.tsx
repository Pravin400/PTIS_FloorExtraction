'use client';

import React, { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Eye, FileX } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { type DocumentThumbnailProps } from '../modules/property-tax/ptis/apartment/building-permission/document-thumbnail/types';
import { StaticCertificateCard } from '../modules/property-tax/ptis/apartment/building-permission/document-thumbnail/StaticCertificateCard';
import { useDocumentThumbnail } from '../modules/property-tax/ptis/apartment/building-permission/document-thumbnail/useDocumentThumbnail';

export type { DocumentThumbnailProps };

/**
 * DocumentThumbnail renders an authentic thumbnail preview of the actual document
 * (PDF first-page render via pdfjs canvas, or direct image preview).
 * When a document returns 404 or fails to load, gracefully displays the static certificate thumbnail.
 */
export function DocumentThumbnail({
  documentGuid,
  fileName,
  alt = 'Document Thumbnail',
  className,
  onClick,
  showFormatBadge = true,
}: DocumentThumbnailProps) {
  const t = useTranslations('common');
  const getSafe = useCallback((key: string, fallback: string, values?: Record<string, string>) => {
    try {
      const res = t(key, values);
      if (res && !res.startsWith('documentThumbnail') && !res.includes('MISSING_MESSAGE')) {
        return res;
      }
    } catch { /* fallback */ }
    return fallback;
  }, [t]);

  const { hasGuid, status, thumbnailData, markError } = useDocumentThumbnail(documentGuid, fileName);
  const isClickable = Boolean(onClick);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (onClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        e.stopPropagation();
        onClick(e as unknown as React.MouseEvent);
      }
    },
    [onClick]
  );

  // 1. Placeholder state when no document is attached
  if (!hasGuid) {
    return (
      <div
        className={cn(
          'relative flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200/90 bg-slate-50/70 p-2 text-center select-none overflow-hidden transition-colors',
          className
        )}
        title={getSafe('documentThumbnail.noDocumentAttached', 'No document attached')}
        aria-label={getSafe('documentThumbnail.noDocumentAttached', 'No document attached')}
      >
        <FileX className="w-5 h-5 text-slate-300 shrink-0" />
        <span className="text-[9px] font-semibold text-slate-400 mt-1 leading-tight line-clamp-2">
          {getSafe('documentThumbnail.noFile', 'No File')}
        </span>
      </div>
    );
  }

  // 2. Loading state while fetching and rendering actual document
  if (status === 'loading') {
    return (
      <div
        className={cn(
          'relative flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-100/80 p-2 text-center select-none overflow-hidden animate-pulse',
          className
        )}
        title={getSafe('documentThumbnail.loadingPreview', 'Loading document preview...')}
      >
        <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mt-1">
          {getSafe('documentThumbnail.loading', 'Loading')}
        </span>
      </div>
    );
  }

  // 3. Fallback state when document is not found (404) or failed to load -> show static thumbnail
  if (status === 'error' || !thumbnailData?.url) {
    return (
      <StaticCertificateCard
        fileName={fileName}
        className={className}
        onClick={(e) => {
          if (onClick) {
            e.stopPropagation();
            onClick(e);
          }
        }}
        isClickable={isClickable}
      />
    );
  }

  // 4. Ready state with actual rendered preview
  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick(e);
        }
      }}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      className={cn(
        'group relative rounded-lg border border-slate-200/90 bg-white overflow-hidden shadow-2xs select-none transition-all duration-200 flex items-center justify-center',
        isClickable && 'cursor-pointer hover:border-blue-400 hover:shadow-xs active:scale-[0.98]',
        className
      )}
      title={getSafe('documentThumbnail.clickToPreview', 'Click to preview actual document')}
      aria-label={getSafe('documentThumbnail.previewDocument', `Preview document ${fileName || ''}`, { fileName: fileName || '' })}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumbnailData.url}
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 bg-slate-50"
        loading="lazy"
        onError={markError}
      />

      {/* Format Badge (PDF, IMG, DOC) */}
      {showFormatBadge && thumbnailData?.format && (
        <span
          className={cn(
            'absolute top-1 left-1 px-1.5 py-0.2 rounded text-[8px] font-extrabold tracking-wider shadow-2xs leading-tight uppercase backdrop-blur-xs',
            thumbnailData.format === 'PDF' && 'bg-rose-500/90 text-white',
            thumbnailData.format === 'IMG' && 'bg-blue-600/90 text-white',
            thumbnailData.format === 'DOC' && 'bg-slate-700/90 text-white'
          )}
        >
          {thumbnailData.format}
        </span>
      )}

      {/* Interactive hover overlay with Zoom/View icon */}
      {isClickable && (
        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-0.5 text-white backdrop-blur-[0.5px]">
          <Eye className="w-4 h-4 text-white drop-shadow-sm shrink-0" />
          <span className="text-[9px] font-bold tracking-wide drop-shadow-sm truncate max-w-[50px] text-center">
            {getSafe('documentThumbnail.preview', 'Preview')}
          </span>
        </div>
      )}
    </div>
  );
}
