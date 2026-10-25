import React from 'react';
import { Plus, ChevronLeft, ChevronRight, UploadCloud } from 'lucide-react';
import { PhotoPlanDrawer } from '../basic-info/media/PhotoPlanDrawer';
import { ImageHoverPreview } from '../basic-info/media/ImageHoverPreview';
import { ImageWithFallback } from '../basic-info/media/ImageWithFallback';
import { useNAAssetMediaState } from '@/hooks/asset-hooks/useNAAssetMediaState';
import type { NAAssetMediaProps } from '@/types/asset/municipal-Asset/new-add-new-asset';

export function NAAssetMedia(props: NAAssetMediaProps): React.ReactElement {
  const { isFetchingDb = false } = props;
  const {
    t,
    assetId,
    categories,
    photoPlanCategory,
    isDrawerOpen,
    drawerInitialCategoryIndex,
    openDrawer,
    closeDrawer,
    selectedThumbIndex,
    setSelectedThumbIndex,
    setActiveCategoryIndex,
    allUploadedImages,
    activePhoto,
    defaultAssetCategoryIndex,
    categoryLabel,
    planImages,
    planPage,
    setPlanPage,
    activePlan,
    planLabel,
    hoverPreview,
    handleImageHover,
    handleImageLeave,
    cancelImageLeave,
    fullyLoadedIds,
    setFullyLoadedIds,
    handleCategoriesChange,
    handleFileStaged,
    handleFileUnstaged,
    handleFileReplaced,
    handleDbPhotoRemoved,
  } = useNAAssetMediaState(props);

  if (isFetchingDb) {
    return (
      <div id="na-asset-media-container" className="bg-[#FFF9F2] rounded-xl shadow-sm border border-orange-300 flex flex-col h-full max-h-[390px] min-h-[250px] overflow-hidden justify-center items-center p-4">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-blue-600 border-t-transparent mb-2" />
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('assetMedia.title')}</span>
      </div>
    );
  }

  return (
    <div id="na-asset-media-container" className="bg-[#FFF9F2] rounded-xl shadow-sm border border-orange-300 flex flex-col h-full max-h-[390px] overflow-hidden relative">
      {/* Card header */}
      <div className="px-4 py-2 border-b border-orange-100 flex items-center gap-2 bg-[#FFF9F2] shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
        <h3 className="text-[12px] font-black text-[#101b87]">{t('assetMedia.title')}</h3>
      </div>

      {/* Body container */}
      <div className="p-2 flex flex-col justify-start gap-y-2 flex-grow flex-1 min-h-0">
        
        {/* ── Section A: Asset Photo (Horizontal split: Main on Left, rail on Right, height 194px) ── */}
        <div className="flex items-stretch gap-1.5 w-full h-[194px] min-h-[194px] shrink-0 mt-0.5">
          
          {/* Main Photo container with overlay header label & change photo action */}
          <div className="relative flex-grow rounded-lg overflow-hidden border border-slate-200 bg-slate-50 h-full">
            {activePhoto && activePhoto.src ? (
              <div
                className="w-full h-full cursor-pointer relative"
                onMouseEnter={() => handleImageHover(activePhoto.fullSrc || activePhoto.src || '', activePhoto.title || categoryLabel)}
                onMouseLeave={handleImageLeave}
                onClick={() => openDrawer(activePhoto.categoryIndex, activePhoto.imageIndex)}
              >
                <ImageWithFallback
                  src={activePhoto.src}
                  alt={activePhoto.title || categoryLabel}
                  className="w-full h-full object-cover object-center animate-fade-in"
                />
              </div>
            ) : (
              <div 
                onClick={() => openDrawer(defaultAssetCategoryIndex)}
                className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-lg bg-slate-50/50 p-4 transition-colors cursor-pointer group"
              >
                <UploadCloud className="w-7 h-7 text-slate-400 group-hover:text-blue-500 transition-colors" />
                <span className="text-[10px] font-bold text-slate-500 group-hover:text-blue-600 transition-colors mt-2 text-center leading-tight">
                  {t('assetMedia.noImageUploaded')}
                </span>
              </div>
            )}
            
            {/* Absolute overlay elements to save vertical layout space */}
            <div className="absolute top-2 left-2 bg-[#101b87]/80 text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow-sm pointer-events-none select-none">
              {categoryLabel}
            </div>
            <button 
              type="button"
              onClick={() => openDrawer(activePhoto ? activePhoto.categoryIndex : defaultAssetCategoryIndex)}
              className="absolute top-2 right-2 bg-white/90 hover:bg-white text-blue-600 text-[8.5px] font-black uppercase px-2 py-0.5 rounded shadow-sm transition-colors border border-blue-100 cursor-pointer select-none"
            >
              {t('assetMedia.upload')}
            </button>
          </div>

          {/* Vertical rail of square thumbnails on the right (60px wide) */}
          <div className="flex flex-col w-[72px] shrink-0 h-full overflow-hidden justify-between">
            {/* Scrollable list container for thumbnails */}
            <div 
              className="flex-grow flex-1 flex flex-col gap-1.5 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent pr-1 min-h-0"
            >
              {allUploadedImages.map((img, i) => {
                const isSelected = selectedThumbIndex === i;
                return (
                  <button
                    type="button"
                    key={i}
                    onClick={() => {
                      setSelectedThumbIndex(i);
                      setActiveCategoryIndex(img.categoryIndex);
                    }}
                    onMouseEnter={() => handleImageHover(img.fullSrc || img.src || '', img.title || img.categoryName)}
                    onMouseLeave={handleImageLeave}
                    className={`w-[60px] h-[46px] rounded overflow-hidden border-2 transition-all bg-slate-50 shrink-0 ${
                      isSelected ? 'border-blue-600 ring-1 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <ImageWithFallback src={img.src} alt={`thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                );
              })}

              {/* Empty placeholder thumbnails if count is 0 */}
              {allUploadedImages.length === 0 && Array.from({ length: 3 }).map((_, i) => (
                <div 
                  key={i}
                  className="w-[60px] h-[46px] rounded border border-slate-100 bg-slate-50/30 shrink-0"
                />
              ))}
            </div>

            {/* Dotted Upload square tile fixed at the bottom */}
            <button 
              type="button"
              onClick={() => openDrawer(activePhoto ? activePhoto.categoryIndex : defaultAssetCategoryIndex)}
              className="w-[60px] h-[46px] rounded border-2 border-dashed border-slate-300 flex items-center justify-center hover:bg-[#FAFBFD] hover:border-blue-400 transition-colors shrink-0 cursor-pointer mt-1.5 bg-white"
            >
              <Plus className="w-4.5 h-4.5 text-blue-500" />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-orange-200 shrink-0 mx-1" />

        {/* ── Section B: Asset Photo Plan ── */}
        <div className="flex-grow flex-1 flex flex-col gap-1 w-full px-0.5 pb-0.5 min-h-0">
          <div className="relative bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col shadow-sm flex-grow flex-1 min-h-0">
            
            {/* Blueprint drawing preview area */}
            <div className="w-full flex items-center justify-center bg-white p-1 relative flex-grow flex-1 min-h-0">
              {activePlan && activePlan.src ? (
                <div 
                  className="absolute inset-0 m-auto max-h-[90%] max-w-[90%] cursor-pointer flex items-center justify-center"
                  onMouseEnter={() => handleImageHover(activePlan.fullSrc || activePlan.src || '', activePlan.title || planLabel)}
                  onMouseLeave={handleImageLeave}
                  onClick={() => openDrawer(photoPlanCategory ? categories.indexOf(photoPlanCategory) : 0, planPage)}
                >
                  <ImageWithFallback
                    src={activePlan.src}
                    alt={activePlan.title || planLabel}
                    className="w-full h-full object-contain rounded opacity-95"
                  />
                </div>
              ) : (
                <div 
                  onClick={() => openDrawer(photoPlanCategory ? categories.indexOf(photoPlanCategory) : 0)}
                  className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-lg bg-slate-50/50 p-4 transition-colors cursor-pointer group"
                >
                  <UploadCloud className="w-7 h-7 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  <span className="text-[10px] font-bold text-slate-500 group-hover:text-blue-600 transition-colors mt-2 text-center leading-tight">
                    {t('assetMedia.noPlanUploaded')}
                  </span>
                </div>
              )}

              {/* Absolute overlay elements inside the drawing space */}
              <div className="absolute top-1.5 left-1.5 bg-[#101b87]/80 text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow-sm pointer-events-none select-none z-10">
                {planLabel}
              </div>
              <button 
                type="button"
                onClick={() => openDrawer(photoPlanCategory ? categories.indexOf(photoPlanCategory) : 0)}
                className="absolute top-1.5 right-1.5 bg-white/90 hover:bg-white text-blue-600 text-[8.5px] font-black uppercase px-2 py-0.5 rounded shadow-sm transition-colors border border-blue-100 cursor-pointer select-none z-10"
              >
                {t('assetMedia.uploadPlan')}
              </button>

              {planImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setPlanPage((p) => Math.max(0, p - 1))}
                    className="absolute left-1.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-300 shadow-sm z-10 cursor-pointer"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlanPage((p) => Math.min(planImages.length - 1, p + 1))}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-300 shadow-sm z-10 cursor-pointer"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Hover Preview Overlay */}
      <ImageHoverPreview
        key={hoverPreview?.src ?? 'empty'}
        src={hoverPreview?.src ?? ''}
        src2={hoverPreview?.src2}
        title={hoverPreview?.title ?? ''}
        visible={hoverPreview !== null}
        onMouseEnter={cancelImageLeave}
        onMouseLeave={handleImageLeave}
      />

      {/* Additional Images Drawer Component */}
      {isDrawerOpen && (
        <PhotoPlanDrawer
          open={isDrawerOpen}
          onClose={closeDrawer}
          categories={categories}
          onCategoriesChange={handleCategoriesChange}
          wardNo=""
          propertyNo=""
          initialCategoryIndex={drawerInitialCategoryIndex}
          propertyId={assetId}
          fullyLoadedIds={fullyLoadedIds}
          onFullyLoadedIdsChange={setFullyLoadedIds}
          onFileStaged={handleFileStaged}
          onFileUnstaged={handleFileUnstaged}
          onFileReplaced={handleFileReplaced}
          readOnly={false}
          onDbPhotoRemoved={handleDbPhotoRemoved}
        />
      )}
    </div>
  );
}
