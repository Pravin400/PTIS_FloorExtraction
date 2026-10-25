'use client';

import React, { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { PhotoPlanSidebar, type PhotoCategory } from './PhotoPlanSidebar';
import { PhotoPlanGrid } from './PhotoPlanGrid';
import { PhotoPlanViewer } from './PhotoPlanViewer';
import { PhotoPlanModals } from './PhotoPlanModals';
import dynamic from 'next/dynamic';

const ChangeDetectionCompare = dynamic(
  () => import('./ChangeDetectionCompare').then((mod) => mod.ChangeDetectionCompare),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
      </div>
    ),
  }
);
import { usePhotoPlanDrawerState } from '@/hooks/ptis/photoplan/usePhotoPlanDrawerState';
import { patchCategory } from '@/lib/utils/ptis-photo-plan-localization';

import type { WaybackRelease } from '@/lib/api/wayback.service';
import type { PropertyPhotoDto } from '@/types/photoplan.types';

interface PhotoPlanDrawerBodyProps {
  categories: PhotoCategory[];
  onCategoriesChange: (categories: PhotoCategory[]) => void;
  onPhotosChange?: (photos: PropertyPhotoDto[]) => void;
  initialCategoryIndex?: number;
  propertyId?: number;
  wingDetailId?: number | null;
  societyDetailId?: number | null;
  wingName?: string;
  fullyLoadedIds: Set<number>;
  onFullyLoadedIdsChange: (ids: Set<number>) => void;
  initialLatitude?: number;
  initialLongitude?: number;
  initialWaybackReleases?: WaybackRelease[];
  onDrawPlan?: (e: React.MouseEvent) => void;
  onSyncPlan?: (e: React.MouseEvent) => void;
  isSyncingPlan?: boolean;
  onRequestTypeModal?: () => void;
  wardNo?: string;
  propertyNo?: string;
  partitionNo?: string;
  isMainProperty?: boolean;
}

export function PhotoPlanDrawerBody({
  categories,
  onCategoriesChange,
  onPhotosChange,
  initialCategoryIndex = 0,
  propertyId,
  wingDetailId,
  societyDetailId,
  wingName,
  fullyLoadedIds,
  onFullyLoadedIdsChange,
  initialLatitude,
  initialLongitude,
  initialWaybackReleases,
  onDrawPlan,
  onSyncPlan,
  isSyncingPlan = false,
  onRequestTypeModal,
  wardNo = '',
  propertyNo = '',
  partitionNo = '',
  isMainProperty = false,
}: PhotoPlanDrawerBodyProps): React.ReactElement {
  const t = useTranslations('ptis');

  const {
    selectedCategoryIndex, setSelectedCategoryIndex,
    selectedImageIndex, setSelectedImageIndex,
    viewMode, setViewMode, cachedCategories,
    isLoadingPhotos, fetchError, activeCategory,
    loadPhotos, mutations, isUploading,
    handleNext, handlePrev, handleDownload,
  } = usePhotoPlanDrawerState({
    categories,
    onCategoriesChange,
    onPhotosChange,
    propertyId,
    wingDetailId,
    societyId: societyDetailId,
    wingName,
    initialCategoryIndex,
    fullyLoadedIds,
    onFullyLoadedIdsChange,
    onRequestTypeModal,
    isMainProperty,
  });

  const {
    isNamingOpen, isReplacement, isUploading: isPhotoUploading,
    isAdding, isReplacing, isDeleting, handleAddPhoto, handleReplacePhoto,
    handleNamingSubmit, handleDeletePhoto, setIsNamingOpen,
    replaceImage,
  } = mutations;

  const imagesMaxOrder = activeCategory?.images?.length
    ? Math.max(...activeCategory.images.map((img) => img.displayOrder ?? 0))
    : 0;

  const isPhotoPlanCategory =
    activeCategory?.photoTypeCode?.toUpperCase() === 'PHOTO_PLAN' ||
    activeCategory?.photoTypeCode?.toUpperCase() === 'PROPERTY_PLAN' ||
    activeCategory?.photoTypeName?.toLowerCase() === 'photo plan' ||
    activeCategory?.photoTypeName?.toLowerCase() === 'property plan';

  const isSplit = viewMode === 'viewer';

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
    let style: HTMLStyleElement | null = null;
    if (!isTest) {
      style = document.createElement('style');
      style.textContent = '.drawer-instance:has(.photo-plan-drawer-content) { width: 50% !important; max-width: 50vw !important; } div:has(+ .drawer-instance:has(.photo-plan-drawer-content)) { background-color: transparent !important; backdrop-filter: none !important; }';
      document.head.appendChild(style);
    }
    return () => {
      document.body.style.overflow = '';
      if (style) style.remove();
    };
  }, []);

  return (
    <div className="relative flex flex-col xl:flex-row h-full max-h-full flex-1 min-h-0 bg-slate-50 overflow-hidden photo-plan-drawer-content w-full">
      {isUploading && viewMode !== 'viewer' && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-50 flex items-center justify-center animate-in fade-in duration-200">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600" />
        </div>
      )}

      <PhotoPlanSidebar
        categories={cachedCategories}
        selectedCategoryIndex={selectedCategoryIndex}
        onSelectCategory={setSelectedCategoryIndex}
        title={t('media.additionalImages') || 'Categories'}
      />

      <div className="flex-1 min-h-0 flex flex-col bg-slate-50 relative group/viewer overflow-hidden">
        {activeCategory?.photoTypeCode === 'CHANGE_DETECTION' && viewMode === 'compare' ? (
          <ChangeDetectionCompare
            activeCategory={activeCategory}
            onBackToGrid={() => {
              setSelectedImageIndex(null);
              setViewMode('grid');
            }}
            onImagesChange={(updatedImages) => {
              onCategoriesChange(patchCategory(cachedCategories, selectedCategoryIndex, updatedImages));
            }}
            initialLatitude={initialLatitude}
            initialLongitude={initialLongitude}
            initialWaybackReleases={initialWaybackReleases}
            propertyId={propertyId}
            wardNo={wardNo}
            propertyNo={propertyNo}
            partitionNo={partitionNo}
          />
        ) : isSplit ? (
          <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden">
            <div className="flex-1 min-h-0 flex flex-col bg-slate-50 relative group/viewer overflow-hidden">
              <PhotoPlanViewer
                categoryName={activeCategory?.photoTypeName || ''}
                images={activeCategory?.images || []}
                selectedImageIndex={selectedImageIndex || 0}
                isAdding={isAdding}
                isReplacing={isReplacing}
                isDeleting={isDeleting}
                onBackToGrid={() => { setSelectedImageIndex(null); setViewMode('grid'); }}
                onNext={handleNext} onPrev={handlePrev}
                onDownload={handleDownload} onUpload={handleAddPhoto}
                onReplace={handleReplacePhoto} onDelete={handleDeletePhoto}
                onDrawPlan={onDrawPlan}
                onSyncPlan={onSyncPlan}
                isSyncingPlan={isSyncingPlan}
                isPhotoPlanCategory={isPhotoPlanCategory}
              />
            </div>
            <div className="h-22 sm:h-24 shrink-0 flex flex-col overflow-hidden bg-slate-50">
              <PhotoPlanGrid
                key={activeCategory?.photoTypeCode || activeCategory?.photoTypeName || 'carousel'}
                categoryName={activeCategory?.photoTypeName || ''}
                images={activeCategory?.images || []}
                selectedImageIndex={selectedImageIndex}
                onSelectImage={(idx) => {
                  if (activeCategory?.photoTypeCode === 'CHANGE_DETECTION') {
                    setViewMode('compare');
                  } else {
                    setSelectedImageIndex(idx);
                    setViewMode('viewer');
                  }
                }}
                onAddPhoto={handleAddPhoto} onDeletePhoto={handleDeletePhoto}
                onReplacePhoto={handleReplacePhoto} isLoading={isLoadingPhotos && activeCategory?.hasPhoto}
                error={fetchError} onRetry={loadPhotos}
                photoCount={activeCategory?.photoCount}
                hideHeader isCarouselMode={true} className="p-2 px-3"
                onDrawPlan={onDrawPlan}
                isPhotoPlanCategory={isPhotoPlanCategory}
              />
            </div>
          </div>
        ) : (
          <PhotoPlanGrid
            categoryName={activeCategory?.photoTypeName || ''}
            photoTypeCode={activeCategory?.photoTypeCode}
            onCompare={() => setViewMode('compare')}
            images={activeCategory?.images || []}
            selectedImageIndex={selectedImageIndex}
            onSelectImage={(idx) => {
              if (activeCategory?.photoTypeCode === 'CHANGE_DETECTION') {
                setViewMode('compare');
              } else {
                setSelectedImageIndex(idx);
                setViewMode('viewer');
              }
            }}
            onAddPhoto={handleAddPhoto} onDeletePhoto={handleDeletePhoto}
            onReplacePhoto={handleReplacePhoto} isLoading={isLoadingPhotos && activeCategory?.hasPhoto}
            error={fetchError} onRetry={loadPhotos}
            photoCount={activeCategory?.photoCount}
            onDrawPlan={onDrawPlan}
            isPhotoPlanCategory={isPhotoPlanCategory}
          />
        )}
      </div>

      <PhotoPlanModals
        isNamingOpen={isNamingOpen}
        onCloseNaming={() => setIsNamingOpen(false)}
        activeCategoryName={activeCategory?.photoTypeName || ''}
        activeCategoryTypeId={activeCategory?.photoTypeId || 0}
        activeCategoryTypeCode={activeCategory?.photoTypeCode || ''}
        activeCategoryImagesLength={activeCategory?.images?.length || 0}
        activeCategoryImagesMaxOrder={imagesMaxOrder}
        isReplacement={isReplacement}
        isPhotoUploading={isPhotoUploading}
        handleNamingSubmit={handleNamingSubmit}
        replaceImage={replaceImage}
      />
    </div>
  );
}
