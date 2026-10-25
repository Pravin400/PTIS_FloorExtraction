 
'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft, Upload, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, useConfirm } from '@/components/common';
import { MainImageViewer } from './MainImageViewer';
import { PhotoPlanToolbar } from './PhotoPlanToolbar';
import { PhotoPlanViewerProps } from '@/types/asset/media.types';



export function PhotoPlanViewer({
  categoryName,
  images,
  selectedImageIndex,
  onBackToGrid,
  onNext,
  onPrev,
  onDownload,
  onUpload,
  onReplace,
  onDelete,
  isAdding = false,
  isReplacing = false,
  isDeleting = false,
  readOnly = false,
}: PhotoPlanViewerProps): React.ReactElement {
  const t = useTranslations('newAddNewAsset');
  const { confirm } = useConfirm();
  const currentImage = images[selectedImageIndex];
  const isMutating = isAdding || isReplacing || isDeleting;

  const handleDeleteClick = () => {
    if (!currentImage) return;
    confirm({
      variant: 'delete',
      title: t('media.deleteSlotTitle') || 'Delete Photo',
      description:
        t('media.deleteSlotDescription', { name: currentImage.title }) ||
        `Are you sure you want to delete ${currentImage.title}?`,
      meta: { name: currentImage.title },
      onConfirm: () => onDelete(selectedImageIndex),
    });
  };

  return (
    <>
      <div className="flex items-center gap-2 px-6 py-3 bg-white border-b border-slate-200 text-slate-800 z-10 flex-shrink-0 select-none">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBackToGrid}
          icon={ArrowLeft}
          disabled={isMutating}
          className="!text-slate-700 hover:!text-slate-900 !p-1 cursor-pointer transition-colors !bg-slate-100 hover:!bg-slate-200 rounded disabled:opacity-50 disabled:pointer-events-none"
        >
          {t('media.backToGrid') || 'Back to Grid'}
        </Button>
        <span className="text-slate-300">/</span>
        <span className="text-xs font-semibold text-slate-600">{categoryName}</span>
      </div>

      <div className="flex-1 relative flex items-center justify-center p-2 sm:p-8 select-none">
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="lg"
              onClick={onPrev}
              icon={ChevronLeft}
              disabled={isMutating}
              aria-label="Previous image"
              className="absolute left-2 sm:left-4 z-10 !h-9 !w-9 sm:!h-11 sm:!w-11 !p-1 sm:!p-2.5 rounded-full bg-white/80 hover:bg-white text-slate-700 border border-slate-200 shadow-lg hover:scale-105 transition-all opacity-100 sm:opacity-0 sm:group-hover/viewer:opacity-100 flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none"
            />
            <Button
              variant="ghost"
              size="lg"
              onClick={onNext}
              icon={ChevronRight}
              disabled={isMutating}
              aria-label="Next image"
              className="absolute right-2 sm:right-4 z-10 !h-9 !w-9 sm:!h-11 sm:!w-11 !p-1 sm:!p-2.5 rounded-full bg-white/80 hover:bg-white text-slate-700 border border-slate-200 shadow-lg hover:scale-105 transition-all opacity-100 sm:opacity-0 sm:group-hover/viewer:opacity-100 flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none"
            />
          </>
        )}
        <div className="relative max-w-full max-h-full flex items-center justify-center overflow-hidden rounded-lg shadow-xl bg-slate-100 border border-slate-200 w-full h-full">
          {images.length === 0 ? (
            readOnly ? (
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-white p-12 select-none w-full h-full min-h-[300px]">
                <div className="p-4 bg-slate-50 rounded-full border border-slate-100 shadow-sm mb-4">
                  <Upload className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-base font-semibold text-slate-400 mb-1">
                  {t('media.noImageUploaded') || 'No Photos Uploaded'}
                </h3>
              </div>
            ) : (
              <div
                onClick={isMutating ? undefined : onUpload}
                className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl bg-white p-12 hover:border-blue-500 hover:bg-blue-50/20 cursor-pointer transition-all duration-300 select-none group w-full h-full min-h-[300px]"
              >
                <div className="p-4 bg-slate-50 rounded-full border border-slate-200 group-hover:scale-110 transition-transform duration-300 shadow-sm mb-4">
                  {isAdding ? (
                    <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                  ) : (
                    <Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-500" />
                  )}
                </div>
                <h3 className="text-base font-semibold text-slate-700 mb-1 group-hover:text-blue-900">
                  {isAdding ? (t('media.uploading') || 'Uploading...') : (t('media.noImageUploaded') || 'No Photos Uploaded')}
                </h3>
                <p className="text-xs text-slate-400 max-w-xs text-center">
                  {isAdding
                    ? (t('media.uploadingDescription') || 'Please wait while your image is being uploaded.')
                    : (t('media.clickToUpload', { title: categoryName }) ||
                      `Click here to upload a photo to the ${categoryName} folder.`)}
                </p>
              </div>
            )
          ) : (
            <MainImageViewer
              key={currentImage?.src || ''}
              src={currentImage?.src || ''}
              alt={currentImage?.title || ''}
              rotation={0}
            />
          )}
        </div>
      </div>

      <PhotoPlanToolbar
        title={currentImage?.title || ''}
        currentIndex={selectedImageIndex}
        totalCount={images.length}
        hasImage={!!currentImage?.src}
        onDownload={onDownload}
        onUpload={onUpload}
        onReplace={() => onReplace(selectedImageIndex)}
        onDelete={handleDeleteClick}
        isAdding={isAdding}
        isReplacing={isReplacing}
        isDeleting={isDeleting}
        readOnly={readOnly}
      />
    </>
  );
}

