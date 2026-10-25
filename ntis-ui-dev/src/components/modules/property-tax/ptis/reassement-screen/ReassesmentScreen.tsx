'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ImageWithFallback } from '@/components/modules/property-tax/ptis/media/ImageWithFallback';
import {
  FileText,
} from 'lucide-react';
import {
  MasterTable,
  RetrospectiveDetailsButton,
  Section129Button,
  ImageViewer,
} from '@/components/common';
import type { ImageViewerImage } from '@/components/common';
import { RetrospectiveTaxModal } from './RetrospectiveTaxModal';
import { Section129Modal } from './Section129Modal';
import { OldFloorDetails } from './components/OldFloorDetails';
import { NewFloorDetails } from './components/NewFloorDetails';
import { TaxSummaryCards } from './components/TaxSummaryCards';
import type {
  MappedFloorDetail,
  ReassessmentTaxRow,
  MappedRetrospectiveColumn,
  MappedRetrospectiveRow,
  ReassessmentPhoto,
} from '@/types/reassessment.types';
import { useReassessmentSummaryCards } from '@/hooks/ptis/reassessment/useReassessmentSummaryCards';
import { useReassessmentTaxTable } from '@/hooks/ptis/reassessment/useReassessmentTaxTable';
import { useSynchronizedScrolling } from '@/hooks/ptis/reassessment/useSynchronizedScrolling';
import { useReassessmentLivePhotos } from '@/hooks/ptis/reassessment/useReassessmentLivePhotos';
import { cn } from '@/lib/utils/cn';
import { getViewDocumentUrl } from '@/lib/utils/document-utils';
import { useSharedAutoScroll } from '@/hooks/ptis/reassessment/useSharedAutoScroll';

// ============================================
// INTERFACES
// ============================================

interface TaxColumn {
  key: string;
  label: string;
  displayOrder: number;
}

interface ReassesmentScreenProps {
  wardId?: number;
  propertyNo?: string;
  partitionNo?: string;
  oldFloorDetails?: MappedFloorDetail[];
  newFloorDetails?: MappedFloorDetail[];
  taxColumns?: TaxColumn[];
  taxRows?: ReassessmentTaxRow[];
  retrospectiveTaxColumns?: MappedRetrospectiveColumn[];
  retrospectiveTaxRows?: MappedRetrospectiveRow[];
  retrospectiveError?: string;
  photos?: ReassessmentPhoto[];
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ReassesmentScreen({
  wardId,
  propertyNo,
  partitionNo,
  oldFloorDetails = [],
  newFloorDetails = [],
  taxColumns = [],
  taxRows = [],
  retrospectiveTaxColumns = [],
  retrospectiveTaxRows = [],
  retrospectiveError,
  photos = [],
}: ReassesmentScreenProps) {
  // Translations
  const t = useTranslations('reassessment');

  // Modal states
  const [showRetroModal, setShowRetroModal] = useState(false);
  const [showSec129Modal, setShowSec129Modal] = useState(false);

  // Image viewer state
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { photos: livePhotos } = useReassessmentLivePhotos({
    wardId,
    propertyNo,
    partitionNo,
    initialPhotos: photos,
  });

  // ============================================
  // HOOKS
  // ============================================
  const summaryCardsData = useReassessmentSummaryCards({
    oldFloorDetails,
    newFloorDetails,
    taxRows,
    t,
  });

  const { detailedTaxesColumns, detailedTaxesData } = useReassessmentTaxTable({
    taxColumns,
    taxRows,
  });

  const { oldTableRef, newTableRef } = useSynchronizedScrolling();
  const autoScrollController = useSharedAutoScroll();

  // Prepare images for viewer
  const viewerImages = useMemo((): ImageViewerImage[] => {
    const images: ImageViewerImage[] = [];

    const oldPropertyPhoto = livePhotos.find((p) => p.type === 'OLD_PROPERTY_PHOTO');
    const oldPlanPhoto = livePhotos.find((p) => p.type === 'OLD_PLAN_PHOTO');
    const newPropertyPhoto = livePhotos.find((p) => p.type === 'NEW_PROPERTY_PHOTO');
    const newPlanPhoto = livePhotos.find((p) => p.type === 'NEW_PLAN_PHOTO');

    if (oldPropertyPhoto) {
      images.push({
        src: getViewDocumentUrl(oldPropertyPhoto.documentGuid),
        alt: t('photoLabels.oldPropertyPhoto'),
        title: t('photoLabels.oldPropertyPhoto'),
      });
    }

    if (oldPlanPhoto) {
      images.push({
        src: getViewDocumentUrl(oldPlanPhoto.documentGuid),
        alt: t('photoLabels.oldPlanPhoto'),
        title: t('photoLabels.oldPlanPhoto'),
      });
    }

    if (newPropertyPhoto) {
      images.push({
        src: getViewDocumentUrl(newPropertyPhoto.documentGuid),
        alt: t('photoLabels.newPropertyPhoto'),
        title: t('photoLabels.newPropertyPhoto'),
      });
    }

    if (newPlanPhoto) {
      images.push({
        src: getViewDocumentUrl(newPlanPhoto.documentGuid),
        alt: t('photoLabels.newPlanPhoto'),
        title: t('photoLabels.newPlanPhoto'),
      });
    }

    return images;
  }, [livePhotos, t]);

  // Handler to open image viewer
  const handleImageClick = (photoType: string) => {
    const imageIndex = viewerImages.findIndex((img) =>
      img.title === t(`photoLabels.${photoType}`)
    );
    if (imageIndex !== -1) {
      setSelectedImageIndex(imageIndex);
      setShowImageViewer(true);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="w-full bg-[#f8fafc] p-4 flex flex-col gap-6 rounded-xl border border-gray-200">
      {/* ==========================================
      TOP PANELS CONTAINER
      ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ==========================================
        LEFT PANEL: Municipal Registration
        ========================================== */}
        <div className="bg-white rounded-xl shadow-md border-2 border-[#2f5597] overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-100 px-4 py-3 flex justify-center items-center">
            <h3 className="font-bold text-sky-900 text-sm md:text-base">
              {t('sectionHeaders.municipalRegistration')}
            </h3>
          </div>

          <div className="px-4 py-2 flex flex-col gap-4 flex-grow">
            {/* Photos */}
            <div className="border-b border-gray-200 pb-4">
              <h4 className="text-sm font-semibold text-[#2f5597] mb-2">
                {t('photoLabels.photoAsPerOld')}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {(() => {
                  const oldPropertyPhoto = livePhotos.find(
                    (p) => p.type === 'OLD_PROPERTY_PHOTO'
                  );
                  const oldPlanPhoto = livePhotos.find((p) => p.type === 'OLD_PLAN_PHOTO');
                  const hasOldPropertyPhoto = !!oldPropertyPhoto;
                  const hasOldPlanPhoto = !!oldPlanPhoto;
                  return (
                    <>
                      <div
                        className={cn(
                          "relative group rounded-lg overflow-hidden border-2 border-[#6366f1] aspect-[16/8] bg-gray-100 flex items-center justify-center transition-transform",
                          hasOldPropertyPhoto ? "cursor-pointer hover:scale-101" : "cursor-default"
                        )}
                        onClick={hasOldPropertyPhoto ? () => handleImageClick('oldPropertyPhoto') : undefined}
                        role={hasOldPropertyPhoto ? "button" : undefined}
                        tabIndex={hasOldPropertyPhoto ? 0 : -1}
                        onKeyDown={hasOldPropertyPhoto ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleImageClick('oldPropertyPhoto');
                          }
                        } : undefined}
                      >
                        {oldPropertyPhoto ? (
                          <ImageWithFallback
                            src={getViewDocumentUrl(oldPropertyPhoto.documentGuid)}
                            alt={t('photoLabels.oldPropertyPhoto')}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-gray-400 text-xs">{t('photoLabels.oldPropertyPhoto')}</span>
                        )}
                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                          {t('photoLabels.oldPropertyPhoto')}
                        </div>
                        {oldPropertyPhoto && (
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-semibold">
                              {t('photoLabels.clickToView', { defaultValue: 'Click to view' })}
                            </span>
                          </div>
                        )}
                      </div>
                      <div
                        className={cn(
                          "relative group rounded-lg overflow-hidden border-2 border-[#6366f1] aspect-[16/8] bg-[#0f2342] flex items-center justify-center transition-transform",
                          hasOldPlanPhoto ? "cursor-pointer hover:scale-101" : "cursor-default"
                        )}
                        onClick={hasOldPlanPhoto ? () => handleImageClick('oldPlanPhoto') : undefined}
                        role={hasOldPlanPhoto ? "button" : undefined}
                        tabIndex={hasOldPlanPhoto ? 0 : -1}
                        onKeyDown={hasOldPlanPhoto ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleImageClick('oldPlanPhoto');
                          }
                        } : undefined}
                      >
                        {oldPlanPhoto ? (
                          <ImageWithFallback
                            src={getViewDocumentUrl(oldPlanPhoto.documentGuid)}
                            alt={t('photoLabels.oldPlanPhoto')}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-gray-300 text-xs">{t('photoLabels.oldPlanPhoto')}</span>
                        )}
                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                          {t('photoLabels.oldPlanPhoto')}
                        </div>
                        {oldPlanPhoto && (
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-semibold">
                              {t('photoLabels.clickToView', { defaultValue: 'Click to view' })}
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Old Floor Details */}
            <OldFloorDetails
              scrollContainerRef={oldTableRef}
              data={oldFloorDetails}
              autoScrollController={autoScrollController}
            />
          </div>
        </div>

        {/* ==========================================
        RIGHT PANEL: New Survey
        ========================================== */}
        <div className="bg-white rounded-xl shadow-md border-2 border-[#2f5597] overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 px-4 py-3 flex justify-center items-center">
            <h3 className="font-bold text-blue-900 text-sm md:text-base">
              {t('sectionHeaders.newSurvey')}
            </h3>
          </div>

          <div className="px-4 py-2 flex flex-col gap-4 flex-grow">
            {/* Photos */}
            <div className="border-b border-gray-200 pb-4">
              <h4 className="text-sm font-semibold text-[#2f5597] mb-2">
                {t('photoLabels.photoAsPerNew')}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {(() => {
                  const newPropertyPhoto = livePhotos.find(
                    (p) => p.type === 'NEW_PROPERTY_PHOTO'
                  );
                  const newPlanPhoto = livePhotos.find((p) => p.type === 'NEW_PLAN_PHOTO');
                  const hasNewPropertyPhoto = !!newPropertyPhoto;
                  const hasNewPlanPhoto = !!newPlanPhoto;
                  return (
                    <>
                      <div
                        className={cn(
                          "relative group rounded-lg overflow-hidden border-2 border-[#ec4899] aspect-[16/8] bg-gray-100 flex items-center justify-center transition-transform",
                          hasNewPropertyPhoto ? "cursor-pointer hover:scale-101" : "cursor-default"
                        )}
                        onClick={hasNewPropertyPhoto ? () => handleImageClick('newPropertyPhoto') : undefined}
                        role={hasNewPropertyPhoto ? "button" : undefined}
                        tabIndex={hasNewPropertyPhoto ? 0 : -1}
                        onKeyDown={hasNewPropertyPhoto ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleImageClick('newPropertyPhoto');
                          }
                        } : undefined}
                      >
                        {newPropertyPhoto ? (
                          <ImageWithFallback
                            src={getViewDocumentUrl(newPropertyPhoto.documentGuid)}
                            alt={t('photoLabels.newPropertyPhoto')}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-gray-400 text-xs">{t('photoLabels.newPropertyPhoto')}</span>
                        )}
                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                          {t('photoLabels.newPropertyPhoto')}
                        </div>
                        {newPropertyPhoto && (
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-semibold">
                              {t('photoLabels.clickToView', { defaultValue: 'Click to view' })}
                            </span>
                          </div>
                        )}
                      </div>
                      <div
                        className={cn(
                          "relative group rounded-lg overflow-hidden border-2 border-[#ec4899] aspect-[16/8] bg-[#0f2342] flex items-center justify-center transition-transform",
                          hasNewPlanPhoto ? "cursor-pointer hover:scale-101" : "cursor-default"
                        )}
                        onClick={hasNewPlanPhoto ? () => handleImageClick('newPlanPhoto') : undefined}
                        role={hasNewPlanPhoto ? "button" : undefined}
                        tabIndex={hasNewPlanPhoto ? 0 : -1}
                        onKeyDown={hasNewPlanPhoto ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleImageClick('newPlanPhoto');
                          }
                        } : undefined}
                      >
                        {newPlanPhoto ? (
                          <ImageWithFallback
                            src={getViewDocumentUrl(newPlanPhoto.documentGuid)}
                            alt={t('photoLabels.newPlanPhoto')}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-gray-300 text-xs">{t('photoLabels.newPlanPhoto')}</span>
                        )}
                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                          {t('photoLabels.newPlanPhoto')}
                        </div>
                        {newPlanPhoto && (
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-semibold">
                              {t('photoLabels.clickToView', { defaultValue: 'Click to view' })}
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* New Floor Details */}
            <NewFloorDetails
              scrollContainerRef={newTableRef}
              data={newFloorDetails}
              autoScrollController={autoScrollController}
            />
          </div>
        </div>
      </div>

      {/* ==========================================
      BOTTOM PANEL: Tax Details & Reassessment Summary
      ========================================== */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-[#2f5597] overflow-hidden">
        {/* HEADER - Separated with blue background */}
        <div className="flex justify-between flex-wrap bg-gradient-to-r from-sky-50 to-blue-50 border-b-2 border-[#2f5597] px-6 py-2">
          <h3 className="font-bold text-[#17365d] text-base whitespace-nowrap flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#17365d]" />
            {t('sectionHeaders.taxDetails')}
          </h3>
          <TaxSummaryCards cards={summaryCardsData} />
        </div>

        {/* CONTENT - With padding */}
        <div className="p-3 flex flex-col gap-5">

          {/* Detailed Taxes Table Grid - Dynamic */}
          {detailedTaxesData.length > 0 && (
            <div className="min-w-0">
              <MasterTable
                columns={detailedTaxesColumns}
                data={detailedTaxesData}
                paginationConfig={{ enabled: false }}
                tableClassName="w-full text-[11px] p-1 font-medium border-separate border-spacing-x-[3px] border-spacing-y-[2px]"
                theadClassName={cn(
                  'bg-[#e8eef5] text-black font-bold',
                  '[&_th]:bg-[#dbe5f0] [&_th]:border [&_th]:border-[#a9b8cc] [&_th]:rounded [&_th]:shadow-sm',
                  '[&_th]:px-1.5 [&_th]:py-[3px] [&_th]:whitespace-nowrap [&_th]:text-[11px]',
                  '[&_th]:text-[#2f4256] [&_th]:font-bold'
                )}
                rowClassName={(row) =>
                  cn(
                    'text-gray-700 font-semibold transition-colors',
                    '[&_td]:px-0.5 [&_td]:py-[2px]',
                    row.isTotal ? '[&_td]:font-bold' : 'hover:bg-slate-50/40'
                  )
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* BUTTONS */}
      <div className="flex justify-center">
        <div className="flex gap-2">
          <RetrospectiveDetailsButton
            onClick={() => setShowRetroModal(true)}
            label={t('buttons.retrospectiveDetails')}
            hidden
            className="font-bold active:scale-98 shadow-sm"
          />
          <Section129Button
            onClick={() => setShowSec129Modal(true)}
            label={t('buttons.section129')}
            hidden
            className="font-bold active:scale-98 shadow-sm"
          />
        </div>
      </div>

      {/* ==========================================
      MODALS
      ========================================== */}

      {/* Retrospective Tax Details Modal */}
      <RetrospectiveTaxModal
        open={showRetroModal}
        onClose={() => setShowRetroModal(false)}
        columns={retrospectiveTaxColumns}
        rows={retrospectiveTaxRows}
        error={retrospectiveError}
      />

      {/* Section 129 Progressive Calc Modal */}
      <Section129Modal
        open={showSec129Modal}
        onClose={() => setShowSec129Modal(false)}
      />

      {/* Image Viewer */}
      <ImageViewer
        open={showImageViewer}
        onClose={() => setShowImageViewer(false)}
        images={viewerImages}
        initialIndex={selectedImageIndex}
        showDownload={true}
        showRotate={true}
        showZoom={true}
        showNavigation={true}
      />
    </div>
  );
}
