 
'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { PhotoPlanDrawerBodyProps } from '@/types/asset/media.types';
import { PhotoPlanGrid } from './PhotoPlanGrid';
import { PhotoPlanViewer } from './PhotoPlanViewer';
import { PhotoPlanModals } from './PhotoPlanModals';
import { usePhotoPlanDrawerState } from '@/hooks/asset-hooks/useAssetPhotoPlanDrawerState';

import { PhotoPlanSidebar } from './PhotoPlanSidebar';
import { PhotoUploadSuccessModal } from '@/components/common';

export function PhotoPlanDrawerBody({
  categories,
  onCategoriesChange,
  initialCategoryIndex = 0,
  propertyId,
  fullyLoadedIds = new Set(),
  onFullyLoadedIdsChange = () => { },
  onFileStaged,
  onFileUnstaged,
  onFileReplaced,
  readOnly = false,
  onDbPhotoRemoved,
}: PhotoPlanDrawerBodyProps): React.ReactElement {
  const t = useTranslations('newAddNewAsset');

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
    propertyId,
    initialCategoryIndex,
    fullyLoadedIds,
    onFullyLoadedIdsChange,
    onFileStaged,
    onFileUnstaged,
    onFileReplaced,
    onDbPhotoRemoved,
  });

  const {
    isNamingOpen, isReplacement, isUploading: isPhotoUploading,
    isAdding, isReplacing, isDeleting, handleAddPhoto, handleReplacePhoto,
    handleNamingSubmit, handleDeletePhoto, setIsNamingOpen,
    replaceImage,
    uploadSuccessModal, closeUploadSuccessModal,
  } = mutations;

  const imagesMaxOrder = activeCategory?.images?.length
    ? Math.max(...activeCategory.images.map((img) => img.displayOrder ?? 0))
    : 0;

  const isSplit = viewMode === 'viewer';
  const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';

  return (
    <div className="relative flex flex-col xl:flex-row h-[calc(100vh-56px)] bg-slate-50 overflow-hidden photo-plan-drawer-content w-full">
      {!isTest && <style dangerouslySetInnerHTML={{ __html: 'body { overflow: hidden !important; } .drawer-instance:has(.photo-plan-drawer-content) { width: 50% !important; max-width: 50vw !important; } div:has(+ .drawer-instance:has(.photo-plan-drawer-content)) { background-color: transparent !important; backdrop-filter: none !important; }' }} />}
      {isUploading && (
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

      <div className="flex-1 flex flex-col bg-slate-50 relative group/viewer overflow-hidden">
        {isSplit ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="h-[85%] border-b border-slate-200 flex flex-col bg-slate-50 relative group/viewer overflow-hidden">
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
                readOnly={readOnly}
              />
            </div>
            <div className="h-[15%] flex flex-col overflow-hidden bg-slate-50">
              <PhotoPlanGrid
                key={activeCategory?.photoTypeCode || activeCategory?.photoTypeName || 'carousel'}
                categoryName={activeCategory?.photoTypeName || ''}
                images={activeCategory?.images || []}
                selectedImageIndex={selectedImageIndex}
                onSelectImage={(idx) => {
                  setSelectedImageIndex(idx);
                  setViewMode('viewer');
                }}
                onAddPhoto={handleAddPhoto} onDeletePhoto={handleDeletePhoto}
                onReplacePhoto={handleReplacePhoto} isLoading={isLoadingPhotos}
                error={fetchError} onRetry={loadPhotos}
                photoCount={activeCategory?.photoCount}
                hideHeader isCarouselMode={true} className="p-2 px-3"
                readOnly={readOnly}
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
              setSelectedImageIndex(idx);
              setViewMode('viewer');
            }}
            onAddPhoto={handleAddPhoto} onDeletePhoto={handleDeletePhoto}
            onReplacePhoto={handleReplacePhoto} isLoading={isLoadingPhotos}
            error={fetchError} onRetry={loadPhotos}
            photoCount={activeCategory?.photoCount}
            readOnly={readOnly}
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

      {uploadSuccessModal && (
        <PhotoUploadSuccessModal
          open={Boolean(uploadSuccessModal)}
          onClose={closeUploadSuccessModal}
          photoName={uploadSuccessModal.photoName}
          categoryName={uploadSuccessModal.categoryName}
          imgSrc={uploadSuccessModal.imgSrc}
          isReplacement={uploadSuccessModal.isReplacement}
        />
      )}
    </div>
  );
}

