 
'use client';

import React from 'react';
import { Plus, Trash2, Upload, FileImage, AlertCircle, RefreshCw } from 'lucide-react';
import { Button, useConfirm } from '@/components/common';
import { useTranslations } from 'next-intl';
import { ImageWithFallback } from './ImageWithFallback';
import { PhotoPlanCarousel } from './PhotoPlanCarousel';

import { PhotoPlanGridProps } from '@/types/asset/media.types';

export function PhotoPlanGrid({
  categoryName, images, onSelectImage, onAddPhoto, onDeletePhoto, onReplacePhoto,
  isLoading = false, error = null, onRetry, photoCount, hideHeader = false,
  className = '', isCarouselMode = false, selectedImageIndex = null,
  photoTypeCode: _photoTypeCode, onCompare: _onCompare,
  readOnly = false,
}: PhotoPlanGridProps): React.ReactElement {
  const t = useTranslations('newAddNewAsset');
  const { confirm } = useConfirm();

  const handleDeleteClick = (e: React.MouseEvent, index: number, title: string) => {
    e.stopPropagation();
    confirm({
      variant: 'delete',
      title: t('media.deleteSlotTitle') || 'Delete Photo',
      description: t('media.deleteSlotDescription', { name: title }) || `Are you sure you want to delete ${title}?`,
      meta: { name: title },
      onConfirm: () => onDeletePhoto(index),
    });
  };

  const totalPhotos = typeof photoCount === 'number' ? photoCount : images.length;

  if (isCarouselMode) {
    return (
      <PhotoPlanCarousel
        images={images} selectedImageIndex={selectedImageIndex} onSelectImage={onSelectImage}
        onAddPhoto={onAddPhoto} onDeletePhoto={onDeletePhoto} onReplacePhoto={onReplacePhoto} className={className}
        readOnly={readOnly}
      />
    );
  }

  return (
    <div className={`flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto scrollbar-thin ${className || 'p-3 sm:p-6'}`}>
      {!hideHeader && (
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <FileImage className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">
              {categoryName} <span className="text-sm font-medium text-slate-500">({totalPhotos} {totalPhotos === 1 ? t('media.photo') || 'photo' : t('media.photos') || 'photos'})</span>
            </h2>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3 sm:gap-4 pb-8">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-40 rounded-lg bg-white border border-slate-200 p-2 flex flex-col gap-2 shadow-sm animate-pulse">
              <div className="flex-1 bg-slate-100 rounded" />
              <div className="h-4 bg-slate-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-xl shadow-sm max-w-sm w-full text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
            <p className="text-xs text-slate-500 mb-4">{error}</p>
            {onRetry && <Button variant="secondary" onClick={onRetry} icon={RefreshCw}>{t('media.retry') || 'Retry'}</Button>}
          </div>
        </div>
      ) : images.length === 0 ? (
        readOnly ? (
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-white p-12 select-none">
            <div className="p-4 bg-slate-50 rounded-full border border-slate-100 shadow-sm mb-4">
              <Upload className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-base font-semibold text-slate-400 mb-1">{t('media.noImageUploaded') || 'No Photos Uploaded'}</h3>
          </div>
        ) : (
          <div onClick={onAddPhoto} className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl bg-white p-12 hover:border-blue-500 hover:bg-blue-50/20 cursor-pointer transition-all duration-300 select-none group">
            <div className="p-4 bg-slate-50 rounded-full border border-slate-200 group-hover:scale-110 transition-transform duration-300 shadow-sm mb-4">
              <Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-500" />
            </div>
            <h3 className="text-base font-semibold text-slate-700 mb-1 group-hover:text-blue-900">{t('media.noImageUploaded') || 'No Photos Uploaded'}</h3>
            <p className="text-xs text-slate-400 max-w-xs text-center">{t('media.clickToUpload', { title: categoryName }) || `Click here to upload a photo to the ${categoryName} folder.`}</p>
          </div>
        )
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3 sm:gap-4 pb-8">
          {images.map((img, index) => {
            const isSelected = selectedImageIndex === index;
            return (
              <div
                key={img.propertyPhotoId || index} onClick={() => onSelectImage(index)}
                className={`relative group bg-white rounded-lg overflow-hidden border transition-all cursor-pointer h-40 flex flex-col ${isSelected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-md'}`}
              >
                <div className="flex-1 bg-slate-100 overflow-hidden relative">
                  <ImageWithFallback
                    src={img.src} alt={img.title} width={200} height={150}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  {/* Actions overlay */}
                  {!readOnly && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                      <Button
                        variant="secondary" size="xs" icon={Upload} className="!h-7 !w-7 !p-0 shadow bg-white hover:text-green-600"
                        onClick={(e) => { e.stopPropagation(); onReplacePhoto(index); }}
                        title={t('media.replaceImage') || 'Replace Image'} aria-label={t('media.replaceImage') || 'Replace Image'}
                      />
                      <Button
                        variant="secondary" size="xs" icon={Trash2} className="!h-7 !w-7 !p-0 shadow bg-white hover:text-red-600"
                        onClick={(e) => handleDeleteClick(e, index, img.title)}
                        title={t('media.deleteSlotTitle') || 'Delete Photo'} aria-label={t('media.deleteSlotTitle') || 'Delete Photo'}
                      />
                    </div>
                  )}
                </div>
                <div className="p-2 border-t border-slate-100 bg-white">
                  <div className="flex justify-between items-center gap-1">
                    <span className="text-[11px] font-semibold text-slate-700 truncate flex-1">{img.title}</span>
                    {img.displayOrder !== undefined && <span className="text-[9px] bg-slate-100 text-slate-600 font-medium px-1.5 py-0.5 rounded">{t('media.displayOrder')}: {img.displayOrder}</span>}
                  </div>
                </div>
              </div>
            );
          })}
          {!readOnly && (
            <div onClick={onAddPhoto} className="border border-dashed border-slate-300 rounded-lg hover:border-blue-400 bg-white hover:bg-blue-50/10 cursor-pointer transition-all duration-200 h-40 flex flex-col items-center justify-center select-none group">
              <div className="p-2.5 bg-slate-50 rounded-full border border-slate-200 group-hover:scale-105 transition-transform duration-200 mb-2">
                <Plus className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
              </div>
              <span className="text-xs font-semibold text-slate-500 group-hover:text-blue-800">{t('media.uploadImage') || 'Add Photo'}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

