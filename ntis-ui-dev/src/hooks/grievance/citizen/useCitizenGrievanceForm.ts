'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { useAuth } from '../shared/useGrievanceAuth';
import { useMunicipalDepartments } from '../shared/useMunicipalDepartments';
import type { TrackingTicket } from '@/types/grievance';
import {
  validateGrievanceForm,
  resolveGrievanceTypeId,
  type GrievanceFormErrors,
} from '@/lib/utils/grievance/citizen-form-validation';
import type { VerifyOtpResponse } from '@/types/grievance/citizen-auth.types';
import { useGrievanceLocation } from './useGrievanceLocation';
import { useGrievanceSubmission } from './useGrievanceSubmission';
import { useGrievancePhotoUpload } from './useGrievancePhotoUpload';
import { useDepartmentSelection } from './useDepartmentSelection';
import { useCitizenContactState } from './useCitizenContactState';
import { useGrievanceFormInit } from './useGrievanceFormInit';
import { useGrievanceAi } from './useGrievanceAi';
import { useGrievanceVoiceDictation } from './useGrievanceVoiceDictation';
import type { GrievanceAiAnalysisDto } from '@/types/grievance/grievance-ai.types';

export interface UseCitizenGrievanceFormProps {
  isOpen?: boolean;
  defaultCategory?: string;
  defaultDepartmentId?: string;
  defaultLocation?: { latitude?: number; longitude?: number; address?: string; ward?: string };
  editTicket?: TrackingTicket;
  onTicketUpdated?: (updated: TrackingTicket) => void;
  onSuccess?: (grievance: TrackingTicket | unknown) => void;
}

export function useCitizenGrievanceForm({
  isOpen = true,
  defaultCategory,
  defaultDepartmentId,
  defaultLocation,
  editTicket,
  onTicketUpdated,
  onSuccess,
}: UseCitizenGrievanceFormProps) {
  const t = useTranslations('grievance');
  const locale = useLocale();
  const { user, isAuthenticated } = useAuth();
  const { departments: liveDepartments } = useMunicipalDepartments();
  const isEditMode = Boolean(editTicket);

  // 1. Department Selection Sub-hook
  const {
    selectedDept, setSelectedDept, isDeptModalOpen, setIsDeptModalOpen,
    defectType, setDefectType, defectTypes, isLoadingDefectTypes, resolveInitialDept,
  } = useDepartmentSelection({
    isOpen,
    defaultDepartmentId: editTicket?.departmentId ? String(editTicket.departmentId) : defaultDepartmentId,
    defaultCategory: editTicket?.department || defaultCategory,
    liveDepartments,
  });

  // 2. Citizen Contact State Sub-hook
  const { fullName, setFullName, mobile, setMobile, setMobileState } = useCitizenContactState({ user, isEditMode });

  // 3. Form & Dialog Core State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [errors, setErrors] = useState<GrievanceFormErrors>({});
  const [description, setDescription] = useState('');

  const clearFieldError = useCallback((field: keyof GrievanceFormErrors) => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }, []);

  // 4. Voice Dictation (Web Speech API) Sub-hook
  const { isVoiceActive, handleToggleVoice } = useGrievanceVoiceDictation({
    locale,
    onTranscript: (cleanText) => setDescription((prev) => (prev ? `${prev} ${cleanText}` : cleanText)),
    listeningToastText: t('voiceListening') || 'Listening... Please speak into your microphone.',
    t,
  });

  // 5. Location Sub-hook
  const {
    roadLandmark, setRoadLandmark, locationCoords, setLocationCoords,
    isDetectingLocation, locationError, autoDetectLocation,
  } = useGrievanceLocation({ t, defaultLocation });

  // 6. Grievance AI Sub-hook (Vision Scan & Text Refinement)
  const {
    isAnalyzing: isAiAnalyzing, isRefining: isAiRefining, aiAnalysis,
    scanImages, analyzePhotos, refineText, clearAiAnalysis,
  } = useGrievanceAi({ t });

  const applyAiResult = useCallback(
    (data: GrievanceAiAnalysisDto) => {
      if (data.departmentId || data.departmentName) {
        const rawName = (data.departmentName || '').toLowerCase().trim();
        const rawLocal = (data.departmentNameLocal || '').toLowerCase().trim();
        const matched = liveDepartments.find(
          (d) =>
            Number(d.id) === data.departmentId ||
            (rawName && d.nameEn.toLowerCase().trim() === rawName) ||
            (rawLocal && d.nameMr?.toLowerCase().trim() === rawLocal) ||
            (rawName && (d.nameEn.toLowerCase().includes(rawName) || rawName.includes(d.nameEn.toLowerCase())))
        );
        if (matched) setSelectedDept(matched);
      }
      if (data.grievanceTypeName || data.grievanceTypeId) {
        // Database GRV.GrievanceTypeMaster options are keyed by canonical English grievanceType (e.g. 'Dead animal')
        // Use canonical grievanceTypeName or numeric grievanceTypeId so SearchSelect reliably matches dropdown options
        const canonicalType = data.grievanceTypeName || (data.grievanceTypeId ? String(data.grievanceTypeId) : '');
        if (canonicalType) setDefectType(canonicalType);
      }
      const isDevanagariLocale = locale === 'mr' || locale === 'hi';
      const aiText = isDevanagariLocale
        ? (data.suggestedDescriptionLocal || data.suggestedDescription)
        : (data.suggestedDescription || data.suggestedDescriptionLocal);
      if (aiText) setDescription(aiText.trim());
    },
    [liveDepartments, setSelectedDept, setDefectType, setDescription, locale]
  );

  const handleRefineWithAi = useCallback(async (): Promise<GrievanceAiAnalysisDto | null> => {
    const res = await refineText(description);
    if (res && res.isValidCivicIssue) {
      applyAiResult(res);
    }
    return res;
  }, [refineText, description, applyAiResult]);

  // 7. Evidence Photo Upload Sub-hook
  const {
    images, setImages, imageFiles, setImageFiles,
    existingPhotos, setExistingPhotos, isLoadingPhotos, setIsLoadingPhotos,
    deletingPhotoId, fileInputRef, cameraInputRef,
    handleFileUpload, handleRemoveImage, handleDeleteExistingPhoto, resetPhotoState,
  } = useGrievancePhotoUpload({ t, setLocationCoords, setRoadLandmark });

  const triggerAiAnalysis = useCallback(async (): Promise<GrievanceAiAnalysisDto | null> => {
    if (imageFiles?.length) {
      const res = await scanImages(imageFiles);
      if (res) {
        if (res.isValidCivicIssue) {
          applyAiResult(res);
        }
        return res;
      }
    }
    const ids = existingPhotos.map((p) => p.id).filter((id) => id > 0);
    if (ids.length) {
      const res = await analyzePhotos(ids);
      if (res) {
        if (res.isValidCivicIssue) {
          applyAiResult(res);
        }
        return res;
      }
    }
    return null;
  }, [imageFiles, existingPhotos, scanImages, analyzePhotos, applyAiResult]);

  const aiConfidence = aiAnalysis?.accuracyPercentage ? Math.round(aiAnalysis.accuracyPercentage) : null;

  // 8. Grievance Submission Sub-hook
  const {
    isSuccess, isSubmitting, generatedTrackingId, isSavedOffline,
    resetSubmissionState, executeSubmission,
  } = useGrievanceSubmission({
    editTicket, onTicketUpdated, onSuccess,
    onAuthRequired: () => setIsAuthModalOpen(true),
    fullName, mobile, selectedDept,
    defectType, defectTypes, roadLandmark, description, images, imageFiles, locationCoords,
  });

  // 9. Hydrate / Initialize Form on Open or Ticket Change
  useGrievanceFormInit({
    isOpen, editTicket, user, liveDepartments, defaultLocation, resolveInitialDept, autoDetectLocation,
    resetPhotoState, resetSubmissionState, setErrors, setDescription, setRoadLandmark, setLocationCoords,
    setFullName, setMobile, setSelectedDept, setDefectType, setExistingPhotos, setIsLoadingPhotos, isSuccess,
  });

  // 10. Shared Form Validation Helper
  const validateCurrentForm = useCallback(
    (name = fullName, mob = mobile) => {
      const grievanceTypeId = resolveGrievanceTypeId(defectType, defectTypes) ?? null;
      return validateGrievanceForm({
        selectedDept, defectType, grievanceTypeId,
        hasLiveTypesConfigured: defectTypes.length > 0,
        roadLandmark, description, fullName: name, mobile: mob,
      }, t);
    },
    [defectTypes, defectType, selectedDept, roadLandmark, description, fullName, mobile, t]
  );

  const isTouchSubmittingRef = useRef(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmitting || isTouchSubmittingRef.current) return;

      const validation = validateCurrentForm(fullName, mobile);
      if (!validation.isValid || !selectedDept) {
        setErrors(validation.errors);
        if (validation.firstError) toast.error(validation.firstError);
        return;
      }
      setErrors({});

      const activeMobile = mobile.replace(/\D/g, '').slice(-10);
      const userMobile = (user?.phone || user?.mobile || '').replace(/\D/g, '').slice(-10);
      const isMobileMatch = Boolean(userMobile && userMobile === activeMobile);
      const isCitizenUser = !user?.role || /citizen/i.test(user.role);

      if (!isAuthenticated || (isCitizenUser && !isMobileMatch)) {
        setIsAuthModalOpen(true);
        return;
      }

      isTouchSubmittingRef.current = true;
      try {
        const activeName = fullName.trim() || user?.name || '';
        const citizenId = isMobileMatch && user?.id && !isNaN(Number(user.id)) && Number(user.id) > 0 ? Number(user.id) : undefined;
        await executeSubmission(activeName, activeMobile, citizenId);
      } finally {
        setTimeout(() => {
          isTouchSubmittingRef.current = false;
        }, 1200);
      }
    },
    [isSubmitting, validateCurrentForm, selectedDept, isAuthenticated, executeSubmission, user, fullName, mobile]
  );

  const handleAuthVerified = useCallback(
    async (authData: VerifyOtpResponse) => {
      setIsAuthModalOpen(false);
      const verifiedName = (authData.name || fullName).trim();
      const verifiedMobile = (authData.mobileNo || mobile).trim();
      if (authData.name) setFullName(authData.name);
      if (authData.mobileNo) setMobileState(authData.mobileNo);

      const validation = validateCurrentForm(verifiedName, verifiedMobile);
      if (!validation.isValid || !selectedDept) {
        toast.success(t('authSuccess') || 'Logged in successfully!');
        return;
      }

      if (isSubmitting || isTouchSubmittingRef.current) return;
      isTouchSubmittingRef.current = true;

      try {
        toast.success(t('submittingGrievanceNow'));
        await executeSubmission(verifiedName, verifiedMobile, authData.citizenId, authData.token);
      } finally {
        setTimeout(() => {
          isTouchSubmittingRef.current = false;
        }, 1200);
      }
    },
    [fullName, mobile, setFullName, setMobileState, validateCurrentForm, selectedDept, t, executeSubmission, isSubmitting]
  );

  useEffect(() => {
    const handleRequireAuth = () => setIsAuthModalOpen(true);
    window.addEventListener('grievance_require_auth', handleRequireAuth);
    return () => window.removeEventListener('grievance_require_auth', handleRequireAuth);
  }, []);

  // Focused Sub-Facades: Decompose into isolated domain facades
  const evidenceFacade = useMemo(() => ({
    images, setImages, imageFiles, setImageFiles, existingPhotos, isLoadingPhotos, deletingPhotoId,
    triggerAiAnalysis, handleFileUpload, handleRemoveImage, handleDeleteExistingPhoto, fileInputRef, cameraInputRef,
  }), [images, setImages, imageFiles, setImageFiles, existingPhotos, isLoadingPhotos, deletingPhotoId, triggerAiAnalysis, handleFileUpload, handleRemoveImage, handleDeleteExistingPhoto, fileInputRef, cameraInputRef]);

  const formMetadataFacade = useMemo(() => ({
    selectedDept, setSelectedDept, isDeptModalOpen, setIsDeptModalOpen, departments: liveDepartments,
    defectType, setDefectType, defectTypes, isLoadingDefectTypes, roadLandmark, setRoadLandmark,
    locationCoords, setLocationCoords, isDetectingLocation, locationError, autoDetectLocation, clearFieldError,
  }), [selectedDept, setSelectedDept, isDeptModalOpen, setIsDeptModalOpen, liveDepartments, defectType, setDefectType, defectTypes, isLoadingDefectTypes, roadLandmark, setRoadLandmark, locationCoords, setLocationCoords, isDetectingLocation, locationError, autoDetectLocation, clearFieldError]);

  const submissionFacade = useMemo(() => ({
    isEditMode, isSuccess, isSubmitting, isAuthModalOpen, setIsAuthModalOpen, handleAuthVerified,
    isAuthenticated, generatedTrackingId, isSavedOffline, errors, setErrors, fullName, setFullName, mobile, setMobile, handleSubmit,
  }), [isEditMode, isSuccess, isSubmitting, isAuthModalOpen, setIsAuthModalOpen, handleAuthVerified, isAuthenticated, generatedTrackingId, isSavedOffline, errors, setErrors, fullName, setFullName, mobile, setMobile, handleSubmit]);

  const aiFacade = useMemo(() => ({
    isAiAnalyzing, isAiRefining, aiAnalysis, aiConfidence, handleRefineWithAi, clearAiAnalysis,
    applyAiResult, isVoiceActive, handleToggleVoice, description, setDescription,
  }), [isAiAnalyzing, isAiRefining, aiAnalysis, aiConfidence, handleRefineWithAi, clearAiAnalysis, applyAiResult, isVoiceActive, handleToggleVoice, description, setDescription]);

  return useMemo(() => ({
    evidence: evidenceFacade, metadata: formMetadataFacade, submission: submissionFacade, ai: aiFacade,
    ...evidenceFacade, ...formMetadataFacade, ...submissionFacade, ...aiFacade,
  }), [evidenceFacade, formMetadataFacade, submissionFacade, aiFacade]);
}
