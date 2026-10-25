'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft, Upload, RefreshCw, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, useConfirm } from '@/components/common';
import { MainImageViewer } from './MainImageViewer';
import { PhotoPlanToolbar } from './PhotoPlanToolbar';
import type { AdditionalImage } from './MediaImageCards';

interface PhotoPlanViewerProps {
  categoryName: string;
  images: AdditionalImage[];
  selectedImageIndex: number;
  onBackToGrid: () => void;
  onNext: () => void;
  onPrev: () => void;
  onDownload: () => void;
  onUpload: () => void;
  onReplace: (index: number) => void;
  onDelete: (index: number) => void;
  isAdding?: boolean;
  isReplacing?: boolean;
  isDeleting?: boolean;
  onDrawPlan?: (e: React.MouseEvent) => void;
  onSyncPlan?: (e: React.MouseEvent) => void;
  isSyncingPlan?: boolean;
  isPhotoPlanCategory?: boolean;
}

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
  onDrawPlan,
  onSyncPlan,
  isSyncingPlan = false,
  isPhotoPlanCategory,
}: PhotoPlanViewerProps): React.ReactElement {
  const t = useTranslations('ptis');
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
      <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white border-b border-slate-200 text-slate-800 z-10 flex-shrink-0 select-none">
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

      <div className="flex-1 min-h-0 relative flex items-center justify-center p-1 sm:p-1.5 select-none">
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="lg"
              onClick={onPrev}
              icon={ChevronLeft}
              disabled={isMutating}
              aria-label="Previous image"
              className="absolute left-2 sm:left-3 z-10 !h-9 !w-9 sm:!h-10 sm:!w-10 !p-1 sm:!p-2 rounded-full bg-white/80 hover:bg-white text-slate-700 border border-slate-200 shadow-md hover:scale-105 transition-all opacity-100 sm:opacity-0 sm:group-hover/viewer:opacity-100 flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none"
            />
            <Button
              variant="ghost"
              size="lg"
              onClick={onNext}
              icon={ChevronRight}
              disabled={isMutating}
              aria-label="Next image"
              className="absolute right-2 sm:right-3 z-10 !h-9 !w-9 sm:!h-10 sm:!w-10 !p-1 sm:!p-2 rounded-full bg-white/80 hover:bg-white text-slate-700 border border-slate-200 shadow-md hover:scale-105 transition-all opacity-100 sm:opacity-0 sm:group-hover/viewer:opacity-100 flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none"
            />
          </>
        )}
        <div className="relative max-w-full max-h-full flex items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-100/50 shadow-xs w-full h-full">
          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl bg-white p-12 transition-all duration-300 select-none group w-full h-full min-h-[300px]">
              <div className="p-4 bg-slate-50 rounded-full border border-slate-200 shadow-sm mb-4">
                {isAdding ? (
                  <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                ) : (
                  <Upload className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <h3 className="text-base font-semibold text-slate-700 mb-1">
                {isAdding ? (t('media.uploading') || 'Uploading...') : (t('media.noImageUploaded') || 'No Photos Uploaded')}
              </h3>
              <p className="text-xs text-slate-400 max-w-xs text-center mb-6">
                {isAdding
                  ? (t('media.uploadingDescription') || 'Please wait while your image is being uploaded.')
                  : (t('media.clickToUpload', { title: categoryName }) ||
                    `Click here to upload a photo to the ${categoryName} folder.`)}
              </p>
              <div className="flex gap-4">
                <Button onClick={onUpload} disabled={isMutating || isSyncingPlan} variant="primary" icon={Upload}>
                  {isPhotoPlanCategory ? (t('media.uploadPlan') || 'Upload Plan') : (t('media.uploadImage') || 'Upload Image')}
                </Button>
                {isPhotoPlanCategory && onDrawPlan && (
                  <Button onClick={onDrawPlan} disabled={isMutating || isSyncingPlan} variant="primary" className="bg-purple-600 hover:bg-purple-700 text-white border-none" icon={Plus}>
                    {t('media.drawPlan') || 'Draw Plan'}
                  </Button>
                )}
                {isPhotoPlanCategory && onSyncPlan && (
                  <Button
                    onClick={onSyncPlan}
                    disabled={isMutating || isSyncingPlan}
                    variant="secondary"
                    icon={RefreshCw}
                    className="bg-white hover:bg-slate-50 border border-slate-300"
                  >
                    <span className={isSyncingPlan ? 'animate-spin mr-1 inline-block' : ''}>
                      <RefreshCw className="w-4 h-4 inline" />
                    </span>
                    {isSyncingPlan ? (t('media.syncing') || 'Syncing...') : (t('media.syncPlan') || 'Sync from CAD')}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              <MainImageViewer
                key={currentImage?.documentGuid || currentImage?.src || currentImage?.fullSrc || ''}
                src={currentImage?.src || currentImage?.fullSrc || ''}
                documentGuid={currentImage?.documentGuid}
                alt={currentImage?.title || ''}
                rotation={0}
                hideSkeleton={isReplacing || isDeleting}
              />
              {(isReplacing || isDeleting) && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-30 flex flex-col items-center justify-center gap-3 animate-in fade-in duration-200 select-none">
                  <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  <p className="text-xs font-semibold text-slate-700">
                    {isReplacing
                      ? (t('media.replacingPhoto') || 'Replacing photo...')
                      : (t('media.deletingPhoto') || 'Deleting photo...')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <PhotoPlanToolbar
        title={currentImage?.title || categoryName || ''}
        currentIndex={selectedImageIndex}
        totalCount={images.length}
        hasImage={Boolean(
          currentImage && (currentImage.src || currentImage.fullSrc || currentImage.documentGuid)
        )}
        onDownload={onDownload}
        onUpload={onUpload}
        onReplace={() => onReplace(selectedImageIndex)}
        onDelete={handleDeleteClick}
        isAdding={isAdding}
        isReplacing={isReplacing}
        isDeleting={isDeleting}
        isPhotoPlanCategory={isPhotoPlanCategory}
        onDrawPlan={onDrawPlan}
        onSyncPlan={onSyncPlan}
        isSyncingPlan={isSyncingPlan}
      />
    </>
  );
}
