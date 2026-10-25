'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, AlertTriangle } from 'lucide-react';
import dynamic from 'next/dynamic';
import { AssetGisTopNav } from './AssetGisTopNav';
import { AssetGisConfigModal } from './AssetGisConfigModal';
import { AssetGisSidebar } from '../sidebar/AssetGisSidebar';
import { AssetGisKpiHeader } from '../sidebar/AssetGisKpiHeader';
import { MapViewport } from '../map/MapViewport';
import { ImagePreviewModal } from '../ImagePreviewModal';
import { AssetAnalysisPanel } from '../AssetAnalysisPanel';
import { Button } from '@/components/common';
import { useCouncilBoundaryStore } from '@/hooks/store/useCouncilBoundaryStore';
import type { AssetGisSidebarProps, AssetDocumentItem, AssetGisDashboardLayoutProps } from '@/types/asset-gis.types';

export type { AssetGisDashboardLayoutProps };

const AssetKpis = dynamic(() => import('../asset/AssetKpis').then(mod => mod.AssetKpis), { ssr: false });

export function AssetGisDashboardLayout(props: AssetGisDashboardLayoutProps) {
  const t = useTranslations('assetGis');
  const {
    user,
    logout,
    toggleFullscreen,
    isFullscreen,
    showSidebar,
    setShowSidebar,
    sidebarProps,
    kpis,
    activeKpiFilter,
    setActiveKpiFilter,
    fetchError,
    showLoadingIndicator,
    selectedProperty,
    propertyDetail,
    getImageProxyUrl,
    imageModalUrl,
    setImageModalUrl,
    carouselImages,
    carouselIndex,
    setCarouselIndex,
    failedImages,
    setFailedImages,
    realAssetPhotos,
    isLoadingRealPhotos,
    hasRealAssetData,
    realAssetDocuments,
    isLoadingRealDocuments,
    childAssets,
    isLoadingChildAssets,
    childAssetPhotoMap,
    onOpenChildImageModal,
  } = props;

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const activeModule = useCouncilBoundaryStore(s => s.activeModule);
  // The details panel waits for the map to actually finish drawing/fitting the selected
  // asset's polygon (set by MapPopupCoordinator) instead of appearing the instant a
  // property is selected — previously the card could be fully populated well before the
  // map had positioned itself, which read as the two being out of sync.
  const polygonReady = useCouncilBoundaryStore(s => s.polygonReady);

  return (
    <div className="fixed inset-0 z-[999] h-screen w-screen flex flex-col bg-[#f8fafc] overflow-hidden font-sans">
      {/* PREMIUM GLOSSY BACKGROUND OVERLAY */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-500/5 blur-[100px] rounded-full" />
      </div>

      <AssetGisTopNav
        ulbData={props.ulbData}
        user={user}
        logout={logout}
        toggleFullscreen={toggleFullscreen}
        isFullscreen={isFullscreen}
        dashboardFilters={(sidebarProps as Record<string, unknown>).dashboardFilters as Record<string, unknown> | undefined}
        onOpenConfig={() => setIsConfigModalOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden relative z-10">
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 350, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 120 }}
              className="shrink-0 z-[70] bg-white/95 backdrop-blur-2xl border-r border-slate-200 shadow-[20px_0_40px_rgba(0,0,0,0.03)]"
            >
              <AssetGisSidebar {...(sidebarProps as AssetGisSidebarProps)} />
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 relative flex flex-col min-w-0">
          {activeModule === 'ASSET' ? (
            <AssetKpis isLoading={showLoadingIndicator} />
          ) : (
            <AssetGisKpiHeader
              kpis={kpis}
              activeKpiFilter={activeKpiFilter}
              setActiveKpiFilter={setActiveKpiFilter}
              isLoading={showLoadingIndicator}
            />
          )}

          {!showSidebar && (
            <motion.button
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              whileHover={{ scale: 1.05, x: 4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSidebar(true)}
              className="absolute top-1/2 left-0 -translate-y-1/2 z-[70] px-3 py-4 rounded-r-2xl flex items-center justify-center transition-all bg-white/95 backdrop-blur-xl border border-slate-200 border-l-0 shadow-2xl group cursor-pointer"
              title="Expand Filters Sidebar"
            >
              <div className="flex flex-col items-center gap-1.5">
                <ChevronRight className="w-5 h-5 text-blue-600 group-hover:scale-125 transition-transform shrink-0" />
                <span className="[writing-mode:vertical-lr] text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-600 transition-colors select-none py-1">
                  FILTERS
                </span>
              </div>
            </motion.button>
          )}

          <div className="flex-1 relative bg-slate-50/50">
            <MapViewport showSidebar={showSidebar} />

            {/* FLOATING SYSTEM ALERTS */}
            <AnimatePresence>
              {fetchError && (
                <motion.div initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.95 }} className="absolute top-8 left-1/2 -translate-x-1/2 z-[500] w-[90%] max-w-md">
                  <div className="bg-white/95 backdrop-blur-2xl border-2 border-rose-100 rounded-[28px] shadow-[0_20px_50px_rgba(225,29,72,0.15)] p-5 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0 shadow-inner">
                      <AlertTriangle className="w-7 h-7 text-rose-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black text-rose-900 uppercase tracking-widest mb-1">{t('errors.criticalConnectionError')}</p>
                      <p className="text-xs font-bold text-slate-500 leading-relaxed">{fetchError}</p>
                    </div>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => window.location.reload()}
                      className="px-5 py-2.5 bg-gradient-to-br from-rose-600 to-rose-700 text-white text-[10px] font-black uppercase tracking-wider rounded-2xl hover:from-rose-700 hover:to-rose-800 transition-all shadow-lg shadow-rose-200 active:scale-95 shrink-0 border-0"
                    >
                      {t('errors.retry')}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* FLOATING LOADER */}
            {/* BRANDED LOGO OVERLAY LOADER */}
            <AnimatePresence>
              {showLoadingIndicator && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-white/70 backdrop-blur-md"
                >
                  <div className="relative flex flex-col items-center">
                    {/* Pulsing rings + logo */}
                    <div className="relative flex items-center justify-center">
                      {/* Outer pulsing ring */}
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.15, 0.4, 0.15],
                        }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                        className="absolute w-36 h-36 rounded-full bg-blue-500/10 border border-blue-500/20"
                      />
                      {/* Middle pulsing ring */}
                      <motion.div
                        animate={{
                          scale: [1, 1.1, 1],
                          opacity: [0.2, 0.5, 0.2],
                        }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: 0.4,
                        }}
                        className="absolute w-28 h-28 rounded-full bg-blue-500/5 border border-blue-500/10"
                      />
                      {/* Logo container */}
                      <div className="relative w-20 h-20 rounded-full bg-white shadow-[0_15px_35px_rgba(0,0,0,0.12)] border border-slate-100 flex items-center justify-center p-3.5 z-10">
                        {(() => {
                          const ulbLogo = typeof props.ulbData?.ulbLogo === 'string' ? props.ulbData.ulbLogo : undefined;
                          const ulbName = typeof props.ulbData?.ulbName === 'string' ? props.ulbData.ulbName : undefined;
                          if (ulbLogo) {
                            const logoSrc = ulbLogo.startsWith('data:') || ulbLogo.startsWith('http') || ulbLogo.startsWith('/')
                              ? ulbLogo
                              : `data:image/png;base64,${ulbLogo}`;
                            return (
                              <Image
                                src={logoSrc}
                                alt="ULB Logo"
                                width={48}
                                height={48}
                                unoptimized
                                className="w-full h-full object-contain"
                              />
                            );
                          }
                          return (
                            <div className="w-full h-full flex items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-sm uppercase">
                              {ulbName
                                ? ulbName.split(' ').map((w: string) => w[0]).join('').slice(0, 3).toUpperCase()
                                : 'AMC'}
                            </div>
                          );
                        })()}
                        {/* Spinning border ring */}
                        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-600 animate-spin" />
                      </div>
                    </div>


                    {/* Label text */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="mt-6 flex flex-col items-center gap-1"
                    >
                      <span className="text-[12px] font-black uppercase tracking-[0.25em] text-slate-800">
                        {t('header.title')}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 animate-pulse">
                        {t('sidebar.filtersAndLayers')}
                      </span>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* PROPERTY / ASSET ANALYSIS PANEL — waits for polygonReady so it appears after
                the map has positioned itself on the selected asset, not before. */}
            <AnimatePresence>
              {selectedProperty && polygonReady && (
                <motion.div
                  initial={{ x: 400, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 400, opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                  className="absolute top-3 right-4 bottom-3 z-[500] pointer-events-none flex flex-col justify-start"
                >
                  <AssetAnalysisPanel
                    selectedProperty={selectedProperty}
                    propertyDetail={propertyDetail}
                    onClose={props.onClosePanel}
                    onOpenImageModal={setImageModalUrl}
                    getImageProxyUrl={getImageProxyUrl}
                    realPhotos={realAssetPhotos}
                    isLoadingRealPhotos={isLoadingRealPhotos}
                    hasRealAssetData={hasRealAssetData}
                    documents={realAssetDocuments as AssetDocumentItem[] | undefined}
                    isLoadingDocuments={isLoadingRealDocuments}
                    childAssets={childAssets}
                    isLoadingChildAssets={isLoadingChildAssets}
                    childAssetPhotoMap={childAssetPhotoMap}
                    onOpenChildImageModal={onOpenChildImageModal}
                    onSelectChildAsset={props.onSelectChildAsset}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      <ImagePreviewModal
        isOpen={!!imageModalUrl}
        onClose={() => setImageModalUrl(null)}
        carouselImages={carouselImages.map(img => ({ url: img.url, label: img.label || '' }))}
        carouselIndex={carouselIndex}
        onPrev={() => setCarouselIndex(prev => (prev > 0 ? prev - 1 : carouselImages.length - 1))}
        onNext={() => setCarouselIndex(prev => (prev < carouselImages.length - 1 ? prev + 1 : 0))}
        onSetIndex={setCarouselIndex}
        failedImages={failedImages}
        onImageError={(url) => setFailedImages(prev => ({ ...prev, [url]: true }))}
      />

      <AssetGisConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />
    </div>
  );
}
