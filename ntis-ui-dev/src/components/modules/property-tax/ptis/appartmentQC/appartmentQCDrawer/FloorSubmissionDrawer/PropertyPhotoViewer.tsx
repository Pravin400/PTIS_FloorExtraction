'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { ChevronRight, ImageIcon } from 'lucide-react';
import { usePropertyPhotoViewer } from '@/hooks/apartmentQc/usePropertyPhotoViewer';
import { ImageHoverPreview } from '../../../media/ImageHoverPreview';
import { MediaImageCard } from '../../../media';

export interface PropertyPhotoViewerProps {
  open: boolean;
  propertyId?: number | null;
  className?: string;
  onClose?: () => void;
}

const VIEWER_SLOT_COUNT = 4;

function EmptyPhotoSlot({
  label,
  helperText,
}: {
  label: string;
  helperText: string;
}): React.ReactElement {
  return (
    <div className="relative flex-1 min-h-[150px] lg:min-h-0 rounded-lg overflow-hidden border-2 border-slate-300 bg-slate-100 shadow-md">
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-3 text-center">
        <ImageIcon className="w-9 h-9 text-slate-300" />
        <p className="text-xs font-medium text-slate-500">{helperText}</p>
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/65 to-transparent p-2 pointer-events-none">
        <p className="text-white text-xs">{label}</p>
      </div>
    </div>
  );
}

export function PropertyPhotoViewer({
  open,
  propertyId,
  className,
  onClose,
}: PropertyPhotoViewerProps): React.ReactNode {
  const t = useTranslations('appartmentQC');

  const {
    photos,
    isLoading,
    hasPhotos,
    totalPhotos,
    visiblePhotoCount,
    hoverPreview,
    getPhotoUrl,
    getPhotoTitle,
    handleImageHover,
    handleImageLeave,
    cancelImageLeave,
  } = usePropertyPhotoViewer({
    propertyId,
    isDrawerOpen: open,
  });

  if (!open) return null;

  const noPhotosText = t('drawer.noPhotos') || 'No photos available';
  const photoSummary = hasPhotos
    ? totalPhotos > visiblePhotoCount
      ? `${visiblePhotoCount} of ${totalPhotos} photos`
      : `${totalPhotos} ${totalPhotos === 1 ? 'photo' : 'photos'}`
    : noPhotosText;
  const hiddenPhotoCount = Math.max(totalPhotos - visiblePhotoCount, 0);
  const emptySlotCount = Math.max(VIEWER_SLOT_COUNT - visiblePhotoCount, 0);

  return (
    <div className={`relative h-auto min-h-[540px] lg:h-[calc(100vh-210px)] ${className || ''}`}>
      <div className="h-full w-full flex flex-col bg-white rounded-lg shadow-xl border border-slate-200 relative">
        <ImageHoverPreview
          src={hoverPreview?.src || ''}
          title={hoverPreview?.title || ''}
          visible={!!hoverPreview}
          onMouseEnter={cancelImageLeave}
          onMouseLeave={handleImageLeave}
        />

        <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 rounded-t-lg">
          <ImageIcon className="w-4 h-4 text-blue-700" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {t('drawer.propertyPhotos') || 'Property Photos'}
            </p>
            <p className="text-[10px] text-slate-500 truncate">{photoSummary}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2 scrollbar-thin bg-white rounded-b-lg">
          {isLoading
            ? [0, 1, 2, 3].map((index) => (
                <div
                  key={`photo-loading-${index}`}
                  className="relative bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex-1 min-h-[150px] animate-pulse"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100" />
                </div>
              ))
            : (
                <>
                  {photos.map((photo, index) => {
                    const photoUrl = getPhotoUrl(photo);
                    const photoTitle = getPhotoTitle(photo, index);

                    return (
                      <MediaImageCard
                        key={photo.propertyPhotoId || `${photo.documentGuid || 'photo'}-${index}`}
                        src={photoUrl}
                        fullSrc={photoUrl}
                        alt={photoTitle}
                        label={photoTitle}
                        priority={index === 0}
                        badgeText={index === 0 && hiddenPhotoCount > 0 ? `+${hiddenPhotoCount} More` : undefined}
                        onMouseEnter={() => handleImageHover(photo, index)}
                        onMouseLeave={handleImageLeave}
                        onClick={() => handleImageHover(photo, index)}
                      />
                    );
                  })}

                  {Array.from({ length: emptySlotCount }, (_, index) => (
                    <EmptyPhotoSlot
                      key={`empty-photo-slot-${index}`}
                      label={`Photo ${visiblePhotoCount + index + 1}`}
                      helperText={noPhotosText}
                    />
                  ))}
                </>
              )}
        </div>

        <div className="absolute top-1/2 -translate-y-1/2 -left-5 z-50 hidden lg:block">
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-24 flex items-center justify-center bg-transparent p-0 border-none outline-none focus:outline-none cursor-pointer hover:scale-110 active:scale-95 group transition-transform duration-200"
            aria-label="Close photo viewer"
          >
            <ChevronRight
              className="w-6 h-6 text-[#64748B] group-hover:text-[#2563EB] scale-y-[3.5] scale-x-[1.5] opacity-75 group-hover:opacity-100 animate-pulse group-hover:animate-none transition-all"
              strokeWidth={2.5}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(PropertyPhotoViewer);
