'use client';

/**
 * Citizen Preview & Edit Grievance Modal (Layer 2 - Presentation Component)
 * Path: src/components/modules/grievance/citizen/CitizenPreviewModal.tsx
 *
 * Compact single-screen dossier modal:
 * - Fetches fresh authoritative ticket details by token/ID on open.
 * - Reuses shared RegisterDeptSection and RegisterLocationSection components.
 * - Slim padding and proportional modal width (max-w-xl).
 * Line ceiling: <= 300 lines.
 */

import { useState, useEffect } from 'react';
import { ArrowLeft, X, CheckCircle2, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/common';
import type { TrackingTicket } from '@/types/grievance';
import { GrievanceModalShell } from '../shared/GrievanceModalShell';
import { CitizenAuthModal } from './CitizenAuthModal';
import { PwaCameraModal } from './PwaCameraModal';
import { useCitizenGrievanceForm } from '@/hooks/grievance/citizen/useCitizenGrievanceForm';
import { trackGrievanceTicketAction } from '@/lib/actions/grievance/citizen/track-grievance.actions';
import { EditEvidenceCard } from './edit/EditEvidenceCard';
import { EditDescriptionCard } from './edit/EditDescriptionCard';
import { RegisterDeptSection } from './registration/RegisterDeptSection';
import { RegisterLocationSection } from './registration/RegisterLocationSection';
import { CitizenContactSection } from './CitizenContactSection';

export interface CitizenPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: TrackingTicket;
  onTicketUpdated?: (updated: TrackingTicket) => void;
  isPageMode?: boolean;
}

export function CitizenPreviewModal({
  isOpen,
  onClose,
  ticket: initialTicket,
  onTicketUpdated,
  isPageMode = false,
}: CitizenPreviewModalProps) {
  const t = useTranslations('grievance');
  const [ticket, setTicket] = useState<TrackingTicket>(initialTicket);
  const [isPwaCameraOpen, setIsPwaCameraOpen] = useState(false);

  // 1. Fetch full authoritative ticket details from backend on open
  useEffect(() => {
    if (!isOpen || (!initialTicket?.token && !initialTicket?.id)) return;
    let isMounted = true;
    const lookupKey = initialTicket.token || initialTicket.id;
    trackGrievanceTicketAction(lookupKey)
      .then((res) => {
        if (isMounted && res.success && res.data) {
          setTicket(res.data);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [isOpen, initialTicket?.token, initialTicket?.id]);

  // 2. Initialize form state with ticket
  const {
    isSubmitting,
    isAuthModalOpen,
    setIsAuthModalOpen,
    handleAuthVerified,
    errors,
    images,
    setImages,
    setImageFiles,
    existingPhotos,
    isLoadingPhotos,
    deletingPhotoId,
    description,
    setDescription,
    isVoiceActive,
    handleToggleVoice,
    selectedDept,
    setSelectedDept,
    departments,
    fullName,
    setFullName,
    mobile,
    setMobile,
    defectType,
    setDefectType,
    defectTypes,
    roadLandmark,
    setRoadLandmark,
    locationCoords,
    isDetectingLocation,
    autoDetectLocation,
    clearFieldError,
    handleFileUpload,
    handleRemoveImage,
    handleDeleteExistingPhoto,
    handleSubmit,
    fileInputRef,
    cameraInputRef,
  } = useCitizenGrievanceForm({
    isOpen,
    editTicket: ticket,
    onTicketUpdated: (updated) => {
      onTicketUpdated?.(updated);
      onClose();
    },
  });

  const handlePwaCapture = (file: File, previewUrl: string) => {
    setImages((prev) => [...prev, previewUrl]);
    setImageFiles((prev: File[]) => [...prev, file]);
    setIsPwaCameraOpen(false);
  };

  return (
    <>
      <GrievanceModalShell
        isOpen={isOpen}
        onClose={onClose}
        isPageMode={isPageMode}
        maxWidth="md"
        zIndex="z-[150]"
        showDragHandle={!isPageMode}
      >
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />

        {/* 1. Compact Modal Header */}
        <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0 bg-white">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={onClose}
            icon={ArrowLeft}
            className="h-7.5 px-2 rounded-xl border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-bold text-xs cursor-pointer active:scale-95 transition-all"
          >
            {t('back')}
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-black text-slate-900">
              {t('editGrievanceTitle')}
            </span>
            {ticket?.token && (
              <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                #{ticket.token}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            title={t('back')}
            aria-label={t('back')}
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* 2. Compact Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2.5 sm:p-3.5 space-y-2 bg-slate-50/50">
            {/* Section 1: Compact Evidence Photos */}
            <EditEvidenceCard
              existingPhotos={existingPhotos}
              localImages={images}
              isLoadingPhotos={isLoadingPhotos}
              deletingPhotoId={deletingPhotoId}
              onUploadClick={() => fileInputRef.current?.click()}
              onCameraClick={() => {
                if (typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)) {
                  setIsPwaCameraOpen(true);
                } else {
                  cameraInputRef.current?.click();
                }
              }}
              onDeleteExistingPhoto={handleDeleteExistingPhoto}
              onRemoveLocalImage={handleRemoveImage}
            />

            {/* Section 2: Department & Defect Category (Shared Component) */}
            <div className="p-2.5 sm:p-3 bg-slate-50/80 rounded-2xl border border-slate-200/90">
              <RegisterDeptSection
                selectedDept={selectedDept}
                departments={departments}
                onSelectDepartment={(d) => {
                  setSelectedDept(d);
                  setDefectType('');
                  clearFieldError('department');
                }}
                error={errors.department}
                defectType={defectType}
                setDefectType={setDefectType}
                defectTypes={defectTypes}
                defectTypeError={errors.defectType}
              />
            </div>

            {/* Section 3: Road Landmark & Geolocation (Shared Component) */}
            <RegisterLocationSection
              roadLandmark={roadLandmark}
              setRoadLandmark={setRoadLandmark}
              locationCoords={locationCoords}
              isDetectingLocation={isDetectingLocation}
              autoDetectLocation={autoDetectLocation}
              error={errors.roadLandmark}
              clearFieldError={() => clearFieldError('roadLandmark')}
            />

            {/* Section 4: Grievance Description with Voice */}
            <EditDescriptionCard
              description={description}
              setDescription={setDescription}
              isVoiceActive={isVoiceActive}
              onToggleVoice={handleToggleVoice}
              error={errors.description}
              onClearError={() => clearFieldError('description')}
            />

            {/* Section 5: Citizen Contact Information */}
            <CitizenContactSection
              fullName={fullName}
              mobile={mobile}
              errors={errors}
              onFullNameChange={setFullName}
              onMobileChange={setMobile}
              clearFieldError={clearFieldError}
            />
          </div>

          {/* 3. Action Footer */}
          <div className="px-3 sm:px-4 py-2.5 border-t border-slate-100 flex items-center justify-between gap-2.5 shrink-0 bg-white">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              icon={ArrowLeft}
              className="h-9 px-3.5 rounded-xl border-slate-200 text-slate-700 font-bold text-xs cursor-pointer active:scale-95 transition-all"
            >
              {t('back')}
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              icon={isSubmitting ? Loader2 : CheckCircle2}
              className="h-9 flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? <span>{t('submittingGrievanceNow')}</span> : <span>{t('saveChanges')}</span>}
            </Button>
          </div>
        </form>
      </GrievanceModalShell>

      {/* Optional PWA Camera Modal */}
      {isPwaCameraOpen && (
        <PwaCameraModal
          isOpen={isPwaCameraOpen}
          onClose={() => setIsPwaCameraOpen(false)}
          onCapture={handlePwaCapture}
          onFallbackToFileUpload={() => cameraInputRef.current?.click()}
        />
      )}

      {/* Auth Verification Modal if required */}
      {isAuthModalOpen && (
        <CitizenAuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialMobileNo={mobile}
          onVerified={handleAuthVerified}
        />
      )}
    </>
  );
}
