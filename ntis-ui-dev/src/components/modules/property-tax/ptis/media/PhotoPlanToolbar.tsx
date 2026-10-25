'use client';

import React from 'react';
import { Download, Upload, Trash2, RefreshCw, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/common';

interface PhotoPlanToolbarProps {
  title: string;
  currentIndex: number;
  totalCount: number;
  hasImage: boolean;
  onDownload: () => void;
  onUpload: () => void;
  onReplace?: () => void;
  onDelete?: () => void;
  isAdding?: boolean;
  isReplacing?: boolean;
  isDeleting?: boolean;
  isPhotoPlanCategory?: boolean;
  onDrawPlan?: (e: React.MouseEvent) => void;
  onSyncPlan?: (e: React.MouseEvent) => void;
  isSyncingPlan?: boolean;
}

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
  isPhotoPlanCategory = false,
  onDrawPlan,
  onSyncPlan,
  isSyncingPlan = false,
}: PhotoPlanToolbarProps): React.ReactElement {
  const t = useTranslations('ptis');
  const isMutating = isAdding || isReplacing || isDeleting;

  return (
    <div className="h-11 sm:h-12 bg-white border-t border-slate-200 flex items-center justify-between px-3 sm:px-5 z-10 flex-shrink-0 gap-2 sm:gap-4">
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
          {isPhotoPlanCategory && onDrawPlan && (
            <Button
              variant="primary"
              size="sm"
              onClick={onDrawPlan}
              disabled={isMutating || isSyncingPlan}
              className="bg-purple-600 hover:bg-purple-700 text-white border-none h-full shrink-0"
            >
              {t('media.drawPlan') || 'Draw Plan'}
            </Button>
          )}
          {isPhotoPlanCategory && onSyncPlan && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onSyncPlan}
              disabled={isMutating || isSyncingPlan}
              isLoading={isSyncingPlan}
              icon={RefreshCw}
              className="h-full shrink-0"
              title={t('media.syncPlan') || 'Sync floor plan from CAD drawing tool'}
            >
              <span className="hidden sm:inline">
                {isSyncingPlan ? (t('media.syncing') || 'Syncing...') : (t('media.syncPlan') || 'Sync from CAD')}
              </span>
            </Button>
          )}
          {hasImage ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  (onReplace ?? onUpload)();
                }}
                disabled={isMutating}
                isLoading={isReplacing}
                icon={isPhotoPlanCategory ? RefreshCw : Upload}
                className="h-full shrink-0"
                aria-label={isPhotoPlanCategory ? (t('media.replacePlan') || 'Replace Plan') : (t('media.replaceImage') || 'Replace Image')}
              >
                <span className="hidden sm:inline">
                  {isReplacing
                    ? (t('media.replacing') || 'Replacing...')
                    : isPhotoPlanCategory
                      ? (t('media.replacePlan') || 'Replace Plan')
                      : (t('media.replaceImage') || 'Replace Image')}
                </span>
              </Button>
              {isPhotoPlanCategory && totalCount < 2 && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onUpload}
                  disabled={isMutating}
                  isLoading={isAdding}
                  icon={Plus}
                  className="h-full shrink-0 font-medium"
                  aria-label={t('media.addNewPlan') || 'Add New Plan'}
                >
                  <span>
                    {t('media.addNewPlan') || 'Add New Plan'}
                  </span>
                </Button>
              )}
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
              aria-label={isPhotoPlanCategory ? (t('media.uploadPlan') || 'Upload Plan') : (t('media.uploadImage') || 'Upload Image')}
            >
              <span className="hidden sm:inline">
                {isAdding
                  ? (t('media.uploading') || 'Uploading...')
                  : isPhotoPlanCategory
                    ? (t('media.uploadPlan') || 'Upload Plan')
                    : (t('media.uploadImage') || 'Upload Image')}
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

