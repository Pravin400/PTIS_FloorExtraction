 
'use client';

import React from 'react';
import { Download, Upload, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/common';

import { PhotoPlanToolbarProps } from '@/types/asset/media.types';

export function PhotoPlanToolbar({
  title,
  currentIndex,
  totalCount,
  hasImage,
  onDownload,
  onUpload,
  onReplace,
  onDelete,
  isAdding = false,
  isReplacing = false,
  isDeleting = false,
  readOnly = false,
}: PhotoPlanToolbarProps): React.ReactElement {
  const t = useTranslations('newAddNewAsset');
  const isMutating = isAdding || isReplacing || isDeleting;

  return (
    <div className="h-14 bg-white border-t border-slate-200 flex items-center justify-between px-4 sm:px-6 z-10 flex-shrink-0 gap-4">
      <div className="flex flex-col min-w-0 leading-tight">
        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block truncate">
          {title}
        </span>
        <span className="text-slate-500 text-xs font-medium mt-0.5">
          {t('media.imageOf', { current: currentIndex + 1, total: totalCount }) || `Image ${currentIndex + 1} of ${totalCount}`}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 h-8">
          {readOnly ? (
            hasImage && (
              <Button
                variant="primary"
                size="sm"
                onClick={onDownload}
                disabled={isMutating}
                icon={Download}
                className="!w-8 !h-8 !p-0"
                title={t('media.download') || 'Download'}
                aria-label={t('media.download') || 'Download'}
              />
            )
          ) : hasImage ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={onReplace ?? onUpload}
                disabled={isMutating}
                isLoading={isReplacing}
                icon={Upload}
                className="h-full shrink-0"
                aria-label={t('media.replaceImage')}
              >
                <span className="hidden sm:inline">
                  {isReplacing ? (t('media.replacing') || 'Replacing...') : (t('media.replaceImage') || 'Replace Image')}
                </span>
              </Button>
              {onDelete && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={onDelete}
                  disabled={isMutating}
                  isLoading={isDeleting}
                  icon={Trash2}
                  className="!w-8 !h-8 !p-0"
                  title={t('actions.delete') || 'Delete'}
                  aria-label={t('actions.delete') || 'Delete'}
                />
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={onDownload}
                disabled={isMutating}
                icon={Download}
                className="!w-8 !h-8 !p-0"
                title={t('media.download') || 'Download'}
                aria-label={t('media.download') || 'Download'}
              />
            </>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={onUpload}
              disabled={isMutating}
              isLoading={isAdding}
              icon={Upload}
              className="h-full shrink-0"
              aria-label={t('media.uploadImage')}
            >
              <span className="hidden sm:inline">
                {isAdding ? (t('media.uploading') || 'Uploading...') : (t('media.uploadImage') || 'Upload Image')}
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}


