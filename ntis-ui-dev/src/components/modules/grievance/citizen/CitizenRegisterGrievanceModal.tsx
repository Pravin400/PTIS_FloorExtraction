/**
 * Citizen Register Grievance Modal (Layer 2 - Presentation Component)
 * Path: src/components/modules/grievance/citizen/CitizenRegisterGrievanceModal.tsx
 *
 * App-like multi-step animated wizard with Framer Motion transitions,
 * drag-and-drop evidence, live GPS radar, and tactile micro-interactions.
 */

'use client';

import { useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { TrackingTicket } from '@/types/grievance';
import { getGrievancePhotoViewUrl } from '@/lib/utils/grievance';
import { validateGrievanceForm, resolveGrievanceTypeId } from '@/lib/utils/grievance/citizen-form-validation';
import { GrievanceModalShell } from '../shared/GrievanceModalShell';
import { CitizenAuthModal } from './CitizenAuthModal';
import { CitizenRegisterReceipt } from './CitizenRegisterReceipt';
import { useCitizenGrievanceForm } from '@/hooks/grievance/citizen/useCitizenGrievanceForm';
import { GrievanceWizardProgress } from './wizard/GrievanceWizardProgress';
import { GrievanceStepEvidence } from './wizard/GrievanceStepEvidence';
import { GrievanceStepDetails } from './wizard/GrievanceStepDetails';
import { GrievanceStepCitizen } from './wizard/GrievanceStepCitizen';
import { CitizenPreviewModal } from './CitizenPreviewModal';
import { BouncingDotsLoader } from './wizard/BouncingDotsLoader';

export interface CitizenRegisterGrievanceModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  defaultCategory?: string;
  defaultDepartmentId?: string;
  defaultLocation?: { lat: number; lng: number; address?: string; ward?: string };
  editTicket?: TrackingTicket;
  onTicketUpdated?: (updated: TrackingTicket) => void;
  onSuccess?: (grievance: unknown) => void;
  isPageMode?: boolean;
  showOfficerContact?: boolean;
  closeOnBackdropClick?: boolean;
}

function CitizenRegisterWizardModal({
  isOpen = true,
  onClose,
  defaultCategory,
  defaultDepartmentId,
  defaultLocation: _defaultLocation,
  editTicket,
  onTicketUpdated,
  onSuccess,
  isPageMode = false,
  closeOnBackdropClick,
}: CitizenRegisterGrievanceModalProps) {
  const t = useTranslations('grievance');
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0);
  const lastScannedPhotoCountRef = useRef<number>(-1);
  const memoizedDefaultLocation = useMemo(
    () => (_defaultLocation ? { latitude: _defaultLocation.lat, longitude: _defaultLocation.lng, address: _defaultLocation.address, ward: _defaultLocation.ward } : undefined),
    [_defaultLocation]
  );
  const {
    isSuccess, isSubmitting, isAuthModalOpen, setIsAuthModalOpen, handleAuthVerified,
    generatedTrackingId, isSavedOffline, errors, setErrors, images, existingPhotos,
    isLoadingPhotos, deletingPhotoId, description, isVoiceActive, isAiAnalyzing, isAiRefining, aiConfidence,
    aiAnalysis, clearAiAnalysis,
    triggerAiAnalysis, handleRefineWithAi, selectedDept, setSelectedDept, departments, fullName, mobile,
    defectType, defectTypes, roadLandmark, locationCoords, isDetectingLocation, autoDetectLocation,
    setDescription, setFullName, setMobile, setDefectType, setRoadLandmark,
    handleFileUpload, handleRemoveImage, handleDeleteExistingPhoto, handleToggleVoice,
    handleSubmit, clearFieldError, fileInputRef, cameraInputRef,
  } = useCitizenGrievanceForm({
    isOpen,
    defaultCategory,
    defaultDepartmentId,
    editTicket,
    onTicketUpdated,
    onSuccess,
    defaultLocation: memoizedDefaultLocation,
  });

  const allPhotos = useMemo(
    () => [
      ...existingPhotos.map((p) => ({ id: `db-${p.id}`, photoId: p.id, url: getGrievancePhotoViewUrl(p.id), isDb: true })),
      ...images.map((url, idx) => ({ id: `local-${idx}`, photoId: idx, url, isDb: false })),
    ],
    [existingPhotos, images]
  );

  const handleDeletePhoto = () => {
    const activePhoto = allPhotos[selectedPhotoIdx] || allPhotos[0];
    if (!activePhoto) return;
    lastScannedPhotoCountRef.current = -1;
    if (aiAnalysis) clearAiAnalysis();
    if (activePhoto.isDb) handleDeleteExistingPhoto(activePhoto.photoId);
    else handleRemoveImage(activePhoto.photoId);
    if (selectedPhotoIdx > 0) setSelectedPhotoIdx((prev) => prev - 1);
  };

  const handleReplacePhoto = () => {
    handleDeletePhoto();
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 50);
  };

  const handleFilesDropped = (files: FileList | File[]) => {
    const dt = new DataTransfer();
    Array.from(files).forEach((f) => dt.items.add(f));
    if (fileInputRef.current) {
      fileInputRef.current.files = dt.files;
      fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  const handleStep1ContinueManual = () => {
    // Skip AI scanning completely and advance immediately to Step 2
    setCurrentStep(2);
  };

  const handleStep1ContinueAi = async (forceProceed = false) => {
    // If citizen chooses to proceed anyway after warning, advance immediately without re-scanning
    if (forceProceed) {
      setCurrentStep(2);
      return;
    }

    const hasScannedCurrentPhotos = lastScannedPhotoCountRef.current === allPhotos.length && allPhotos.length > 0;

    if (allPhotos.length > 0 && !hasScannedCurrentPhotos) {
      try {
        const analysis = await triggerAiAnalysis();
        lastScannedPhotoCountRef.current = allPhotos.length;
        if (analysis && !analysis.isValidCivicIssue) {
          return; // Halts on first scan; unlocks Proceed Anyway button on the inline warning banner
        }
      } catch (err) {
        console.warn('[AI Auto-Analysis on Step 1] Skipped or failed:', err);
      }
    }
    setCurrentStep(2);
  };

  const handleDetailsContinue = async () => {
    const grievanceTypeId = resolveGrievanceTypeId(defectType, defectTypes) ?? null;
    const validation = validateGrievanceForm(
      { selectedDept, defectType, grievanceTypeId, hasLiveTypesConfigured: defectTypes.length > 0, roadLandmark, description, validateContact: false },
      t
    );
    if (!validation.isValid) {
      setErrors((prev) => ({ ...prev, ...validation.errors }));
      if (validation.firstError) toast.error(validation.firstError);
      return;
    }
    try {
      const analysis = await handleRefineWithAi();
      if (analysis && !analysis.isValidCivicIssue) {
        const reason =
          t('aiNonCivicDescription') ||
          analysis.rejectionReasonLocal ||
          analysis.rejectionReason;
        setErrors((prev) => ({ ...prev, description: reason || undefined }));
        return;
      }
    } catch (aiErr) {
      console.warn('[AI Auto-Refine on Step 2] Skipped or failed:', aiErr);
    }
    setCurrentStep(3);
  };

  const maxUnlockedStep = allPhotos.length > 0 || Boolean(editTicket) ? 3 : 2;

  return (
    <>
      <GrievanceModalShell
        isOpen={isOpen}
        onClose={onClose}
        isPageMode={isPageMode}
        closeOnBackdropClick={closeOnBackdropClick}
        maxWidth="lg"
        zIndex="z-[150]"
        showDragHandle={!isPageMode}
        className="w-full sm:w-[672px] min-h-[460px] sm:min-h-[500px] max-h-[92vh] flex flex-col"
      >
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />

        {/* Top Header */}
        <div className="px-3.5 sm:px-4 py-2.5 sm:py-3 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-slate-900">{editTicket ? t('editGrievanceTitle') : t('reportGrievance')}</span>
            {editTicket && <span className="font-mono text-[10.5px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">#{editTicket.token}</span>}
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

        {/* Animated 3-Step Progress Indicator */}
        {!isSuccess && !isSubmitting && !isAiRefining && (
          <GrievanceWizardProgress currentStep={currentStep} onStepClick={(s) => setCurrentStep(s)} maxUnlockedStep={maxUnlockedStep} />
        )}

        {/* Form Body with Smooth Slide/Fade Step Transitions */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {isSubmitting ? (
            <BouncingDotsLoader />
          ) : isAiRefining ? (
            <BouncingDotsLoader
              title="Polishing Description..."
              subtitle="Enhancing with official civic terminology and verifying issue validity..."
            />
          ) : !isSuccess ? (
            <form onSubmit={handleSubmit} className="min-h-full flex flex-col justify-between">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <GrievanceStepEvidence
                    key="step-1"
                    allPhotos={allPhotos}
                    selectedPhotoIdx={selectedPhotoIdx}
                    setSelectedPhotoIdx={(idx) => {
                      setSelectedPhotoIdx(idx);
                      if (aiAnalysis && !aiAnalysis.isValidCivicIssue) {
                        clearAiAnalysis();
                        lastScannedPhotoCountRef.current = -1;
                      }
                    }}
                    isLoadingPhotos={isLoadingPhotos}
                    deletingPhotoId={deletingPhotoId}
                    handleDeletePhoto={handleDeletePhoto}
                    fileInputRef={fileInputRef}
                    cameraInputRef={cameraInputRef}
                    handleFilesDropped={handleFilesDropped}
                    onContinue={handleStep1ContinueAi}
                    onContinueAi={handleStep1ContinueAi}
                    onContinueManual={handleStep1ContinueManual}
                    onReplacePhoto={handleReplacePhoto}
                    onSkip={() => setCurrentStep(2)}
                    isAiAnalyzing={isAiAnalyzing}
                    aiConfidence={aiConfidence}
                    aiAnalysis={aiAnalysis}
                  />
                )}
                {currentStep === 2 && (
                  <GrievanceStepDetails
                    key="step-2"
                    selectedDept={selectedDept}
                    departments={departments}
                    onSelectDepartment={(d) => { setSelectedDept(d); setDefectType(''); clearFieldError('department'); }}
                    defectType={defectType}
                    setDefectType={setDefectType}
                    defectTypes={defectTypes}
                    roadLandmark={roadLandmark}
                    setRoadLandmark={setRoadLandmark}
                    locationCoords={locationCoords}
                    isDetectingLocation={isDetectingLocation}
                    autoDetectLocation={autoDetectLocation}
                    description={description}
                    setDescription={(val) => { setDescription(val); if (aiAnalysis && !aiAnalysis.isValidCivicIssue) clearAiAnalysis(); }}
                    isVoiceActive={isVoiceActive}
                    handleToggleVoice={handleToggleVoice}
                    isAiRefining={isAiRefining}
                    errors={errors}
                    clearFieldError={clearFieldError}
                    onBack={() => setCurrentStep(1)}
                    onContinue={handleDetailsContinue}
                  />
                )}
                {currentStep === 3 && (
                  <GrievanceStepCitizen
                    key="step-3"
                    fullName={fullName}
                    mobile={mobile}
                    errors={errors}
                    onFullNameChange={setFullName}
                    onMobileChange={setMobile}
                    clearFieldError={clearFieldError}
                    selectedDeptName={selectedDept?.nameEn || selectedDept?.nameMr}
                    defectType={defectType}
                    roadLandmark={roadLandmark}
                    isSubmitting={isSubmitting}
                    editTicket={editTicket}
                    onBack={() => setCurrentStep(2)}
                  />
                )}
              </AnimatePresence>
            </form>
          ) : (
            <CitizenRegisterReceipt generatedTrackingId={generatedTrackingId} isSavedOffline={isSavedOffline} onClose={onClose} />
          )}
        </div>
      </GrievanceModalShell>

      <CitizenAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onVerified={handleAuthVerified}
        initialMobileNo={mobile}
        initialName={fullName}
        purpose="SUBMIT_GRIEVANCE"
        moduleCode="GRV"
      />
    </>
  );
}

export function CitizenRegisterGrievanceModal(props: CitizenRegisterGrievanceModalProps) {
  if (props.editTicket) {
    return (
      <CitizenPreviewModal
        isOpen={props.isOpen ?? true}
        onClose={props.onClose || (() => {})}
        ticket={props.editTicket}
        onTicketUpdated={props.onTicketUpdated}
        isPageMode={props.isPageMode}
      />
    );
  }

  return <CitizenRegisterWizardModal {...props} />;
}
