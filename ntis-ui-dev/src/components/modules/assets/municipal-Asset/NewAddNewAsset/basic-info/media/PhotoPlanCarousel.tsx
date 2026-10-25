 
'use client';

import React from 'react';
import { Plus, Trash2, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import { useConfirm, Button } from '@/components/common';
import { useTranslations } from 'next-intl';
import { ImageWithFallback } from './ImageWithFallback';

import { PhotoPlanCarouselProps } from '@/types/asset/media.types';

export function PhotoPlanCarousel({
  images,
  selectedImageIndex,
  onSelectImage,
  onAddPhoto,
  onDeletePhoto,
  onReplacePhoto,
  className = '',
  readOnly = false,
}: PhotoPlanCarouselProps): React.ReactElement {
  const t = useTranslations('newAddNewAsset');
  const { confirm } = useConfirm();
  const [startIndex, setStartIndex] = React.useState(0);
  const [prevSelectedImageIndex, setPrevSelectedImageIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (selectedImageIndex !== prevSelectedImageIndex) {
      Promise.resolve().then(() => {
        setPrevSelectedImageIndex(selectedImageIndex);
        if (selectedImageIndex !== null) {
          if (selectedImageIndex < startIndex) {
            setStartIndex(selectedImageIndex);
          } else if (selectedImageIndex >= startIndex + 3) {
            setStartIndex(Math.max(0, selectedImageIndex - 2));
          }
        }
      });
    }
  }, [selectedImageIndex, prevSelectedImageIndex, startIndex]);

  const handleDeleteClick = (e: React.MouseEvent, index: number, title: string) => {
    e.stopPropagation();
    confirm({
      variant: 'delete',
      title: t('media.deleteSlotTitle') || 'Delete Photo',
      description:
        t('media.deleteSlotDescription', { name: title }) ||
        `Are you sure you want to delete ${title}?`,
      meta: { name: title },
      onConfirm: () => onDeletePhoto(index),
    });
  };

  const maxStartIndex = Math.max(0, images.length - 3);
  const clampedStartIndex = Math.min(startIndex, maxStartIndex);
  const visibleImages = images.slice(clampedStartIndex, clampedStartIndex + 3);
  const canPrev = clampedStartIndex > 0;
  const canNext = clampedStartIndex + 3 < images.length;

  const handleCarouselPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canPrev) setStartIndex((prev) => prev - 1);
  };

  const handleCarouselNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canNext) setStartIndex((prev) => prev + 1);
  };

  return (
    <div className={`h-full bg-slate-50 flex items-center justify-between px-2 sm:px-4 gap-2 select-none border-t border-slate-200 w-full ${className}`}>
      {images.length > 3 && (
        <Button
          size="xs"
          variant="secondary"
          onClick={handleCarouselPrev}
          disabled={!canPrev}
          className="!h-8 !w-8 !p-0 rounded-lg shrink-0 hover:scale-105 active:scale-95 cursor-pointer"
          aria-label="Previous thumbnails"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      )}

      <div className="flex-1 flex gap-2 h-full py-1.5 items-center justify-center overflow-hidden">
        {visibleImages.map((img, idx) => {
          const actualIndex = clampedStartIndex + idx;
          const isSelected = selectedImageIndex === actualIndex;
          return (
            <div
              key={img.propertyPhotoId || actualIndex}
              onClick={() => onSelectImage(actualIndex)}
              className={`relative group bg-white rounded-lg overflow-hidden border transition-all cursor-pointer w-[110px] sm:w-[130px] h-full flex flex-col shrink-0 ${
                isSelected
                  ? 'border-blue-500 ring-2 ring-blue-100'
                  : 'border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-md'
              }`}
            >
              <div className="flex-1 bg-slate-100 overflow-hidden relative">
                <ImageWithFallback
                  src={img.src}
                  alt={img.title}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  width={100}
                  height={70}
                  sizes="120px"
                />
                {!readOnly && (
                  <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                    <Button
                      size="xs"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onReplacePhoto(actualIndex);
                      }}
                      className="!p-1 hover:!bg-slate-50 rounded shadow !border-slate-200 !text-slate-600 hover:!text-green-600 cursor-pointer transition-colors !h-5 !w-5"
                      title={t('media.replaceImage') || 'Replace Image'}
                    >
                      <Upload className="w-2.5 h-2.5" />
                    </Button>
                    <Button
                      size="xs"
                      variant="secondary"
                      onClick={(e) => handleDeleteClick(e, actualIndex, img.title)}
                      className="!p-1 hover:!bg-slate-50 rounded shadow !border-slate-200 !text-slate-600 hover:!text-red-600 cursor-pointer transition-colors !h-5 !w-5"
                      title={t('media.deleteSlotTitle') || 'Delete Photo'}
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="p-1 border-t border-slate-100 bg-white flex flex-col justify-center min-h-[22px] leading-none shrink-0">
                <div className="flex justify-between items-center gap-0.5">
                  <span className="text-[9px] font-semibold text-slate-700 truncate flex-1">
                    {img.title}
                  </span>
                  {img.displayOrder !== undefined && (
                    <span className="text-[8px] bg-slate-100 text-slate-600 font-medium px-1 rounded">
                      {img.displayOrder}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {!readOnly && (
          <div
            onClick={onAddPhoto}
            className="w-[110px] sm:w-[130px] h-full border border-dashed border-slate-300 rounded-lg hover:border-blue-400 bg-white hover:bg-blue-50/10 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center select-none group shrink-0"
          >
            <div className="p-1 bg-slate-50 rounded-full border border-slate-200 group-hover:scale-105 transition-transform duration-200 mb-1">
              <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500" />
            </div>
            <span className="text-[9px] font-semibold text-slate-500 group-hover:text-blue-800">
              {t('media.uploadImage') || 'Add Photo'}
            </span>
          </div>
        )}
      </div>

      {images.length > 3 && (
        <Button
          size="xs"
          variant="secondary"
          onClick={handleCarouselNext}
          disabled={!canNext}
          className="!h-8 !w-8 !p-0 rounded-lg shrink-0 hover:scale-105 active:scale-95 cursor-pointer"
          aria-label="Next thumbnails"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

