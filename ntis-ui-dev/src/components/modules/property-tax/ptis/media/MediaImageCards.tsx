'use client';

import React from 'react';
import { Download, Images } from 'lucide-react';
import { Button, Badge } from '@/components/common';
import { ImageWithFallback } from './ImageWithFallback';
import { useTranslations } from 'next-intl';
import { downloadDocumentClient } from '@/lib/utils/document-client-utils';

export interface AdditionalImage {
  src: string;
  fullSrc: string;
  alt: string;
  title: string;
  isCustom?: boolean;
  isNamed?: boolean;
  photoTypeId?: number;
  photoTypeCode?: string;
  propertyPhotoId?: number;
  hasPhoto?: boolean;
  remarks?: string;
  displayOrder?: number;
  file?: File;
  documentGuid?: string;
  downloadUrl?: string;
  wingDetailId?: number;
  wingName?: string;
  societyDetailId?: number;
}

interface MediaImageCardProps {
  src: string;
  documentGuid?: string;
  alt: string;
  label: string;
  fullSrc?: string;
  badgeText?: string;
  hoverBorderColor?: string;
  onClick?: () => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: () => void;
  children?: React.ReactNode;
  priority?: boolean;
  hasPhoto?: boolean;
  emptyLabel?: string;
}

/**
 * Reusable image card with download button and label overlay.
 */
export function MediaImageCard({
  src,
  documentGuid,
  alt,
  label,
  fullSrc,
  badgeText,
  hoverBorderColor = 'hover:border-blue-500',
  onClick,
  onMouseEnter,
  onMouseLeave,
  children,
  priority,
  hasPhoto,
  emptyLabel,
}: MediaImageCardProps): React.ReactElement {
  const isPlanCard = Boolean(
    (label && /plan|नकाशा|प्लॅन/i.test(label)) ||
    (alt && /plan|नकाशा|प्लॅन/i.test(alt)) ||
    (src && /\.svg/i.test(src)) ||
    (fullSrc && /\.svg/i.test(fullSrc))
  );

  return (
    <div
      className={`relative group ${isPlanCard && hasPhoto ? 'bg-white' : 'bg-slate-100'} rounded-lg overflow-hidden border-2 border-slate-300 shadow-md ${hoverBorderColor} hover:border-4 transition-all cursor-pointer flex-1 min-h-[105px] lg:min-h-0 lg:h-0`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <ImageWithFallback
        src={src}
        documentGuid={documentGuid}
        alt={alt}
        className={`w-full h-full ${isPlanCard && hasPhoto ? 'object-contain p-1' : 'object-cover'} transition-transform duration-200 group-hover:scale-105`}
        width={400}
        height={300}
        priority={priority}
        hasPhoto={hasPhoto}
        emptyLabel={emptyLabel}
      />

      {/* Action buttons (visible on hover) */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {children}
        {hasPhoto && (
          <Button
            variant="secondary"
            size="xs"
            className="h-7 w-7 p-0 shadow-lg cursor-pointer"
            aria-label="Download image"
            onClick={(e) => {
              e.stopPropagation();
              const guid = documentGuid || (src || fullSrc || '').match(/\/documents\/([^/]+)/)?.[1];
              if (guid) {
                void downloadDocumentClient(decodeURIComponent(guid), `${label.replace(/\s+/g, '_')}.png`);
                return;
              }
              const link = document.createElement('a');
              link.href = fullSrc || src;
              link.download = `${label.replace(/\s+/g, '_')}.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            <Download className="w-3.5 h-3.5 cursor-pointer" />
          </Button>
        )}
      </div>

      {/* Bottom label overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 pointer-events-none">
        <p className="text-white text-xs">{label}</p>
      </div>

      {/* Optional badge (e.g. "+6 More") */}
      {badgeText && (
        <Badge
          variant="default"
          size="sm"
          className="absolute top-2 left-2 bg-blue-600 text-white font-semibold shadow-lg animate-pulse pointer-events-none"
        >
          {badgeText}
        </Badge>
      )}
    </div>
  );
}

interface AdditionalImagesGridProps {
  images: AdditionalImage[];
  onImageClick?: (index: number) => void;
  onImageHover?: (
    src: string,
    title: string,
    src2?: string,
    beforeLabel?: string,
    afterLabel?: string,
    fallbackSrc?: string,
    fallbackSrc2?: string,
    documentGuid?: string,
    anchorRect?: {
      top: number;
      bottom: number;
      left: number;
      right: number;
      width: number;
      height: number;
    }
  ) => void;
  onImageLeave?: () => void;
  onClose?: () => void;
}

/**
 * Expandable grid section for additional property images.
 */
export function AdditionalImagesGrid({
  images,
  onImageClick,
  onImageHover,
  onImageLeave,
}: AdditionalImagesGridProps): React.ReactElement {
  const t = useTranslations('ptis');
  return (
    <>
      {/* Divider */}
      <div className="border-t-2 border-blue-400 flex-shrink-0 shadow-sm" />

      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1 bg-gradient-to-r from-blue-50 to-slate-50 rounded-md border border-blue-200">
        <div className="flex items-center gap-2">
          <Images className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-semibold text-blue-900">{t('media.additionalImages')}</span>
        </div>
      </div>

      {/* Image cards */}
      <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-60 scrollbar-thin">
        {images.map((image, index) => (
          <div
            key={`add-img-${image.propertyPhotoId ?? 'id'}-${index}`}
            className="relative group bg-slate-100 rounded-lg overflow-hidden border-2 border-slate-200 shadow-md hover:border-blue-400 transition-all cursor-pointer h-24 flex-shrink-0 animate-in fade-in slide-in-from-top-2 duration-300"
            style={{ animationDelay: `${index * 50}ms` }}
            onClick={() => onImageClick?.(index)}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              onImageHover?.(
                image.fullSrc || image.src,
                image.title,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                image.documentGuid,
                {
                  top: rect.top,
                  bottom: rect.bottom,
                  left: rect.left,
                  right: rect.right,
                  width: rect.width,
                  height: rect.height,
                }
              );
            }}
            onMouseLeave={onImageLeave}
          >
            <ImageWithFallback
              src={image.src}
              documentGuid={image.documentGuid}
              alt={image.alt}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
              width={200}
              height={150}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1 pointer-events-none">
              <p className="text-white text-[8px] truncate">
                {image.wingName ? `${image.title} (${image.wingName})` : image.title}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom divider */}
      <div className="border-t-2 border-blue-400 flex-shrink-0 shadow-sm" />
    </>
  );
}
