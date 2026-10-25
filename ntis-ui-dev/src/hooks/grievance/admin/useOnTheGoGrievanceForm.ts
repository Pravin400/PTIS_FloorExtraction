/**
 * On-The-Go Grievance Form Orchestrator Hook
 * Path: src/hooks/grievance/admin/useOnTheGoGrievanceForm.ts
 *
 * Manages form state, local draft persistence, photo uploads, validation,
 * and atomic server action submission.
 * Line ceiling: <= 300 lines.
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import type {
  OnTheGoFormValues,
  OnTheGoPhoto,
  OnTheGoValidationErrors,
  OnTheGoSubmissionResult,
} from '@/types/grievance/on-the-go.types';
import { submitOnTheGoGrievanceAction } from '@/lib/actions/grievance/admin/on-the-go.actions';
import { uploadEvidenceFiles, displayGrievanceError } from '@/lib/utils/grievance';
import { validateRoadLandmark, validateCitizenFullName, sanitizeCitizenName } from '@/lib/utils/grievance/citizen-form-validation';
import { normalizeDevanagariDigits } from '@/lib/utils/grievance/devanagari';
import {
  getOnTheGoDraft,
  saveOnTheGoDraft,
  clearOnTheGoDraft,
} from '@/lib/services/grievance/on-the-go-draft.service';

const INITIAL_FORM_VALUES: OnTheGoFormValues = {
  photos: [], description: '', zoneId: null, wardNumber: null,
  departmentId: null, grievanceTypeId: null, officerUserId: null, isCitizenReported: false,
  citizenMobile: '', citizenName: '', landmark: '',
};

export function useOnTheGoGrievanceForm(onSuccess?: (result: OnTheGoSubmissionResult) => void) {
  const t = useTranslations('grievance');
  const isTouchSubmittingRef = useRef(false);

  // 1. Initialize form state with optional local draft
  const [values, setValues] = useState<OnTheGoFormValues>(() => {
    const saved = getOnTheGoDraft();
    return saved ? { ...INITIAL_FORM_VALUES, ...saved, photos: [] } : INITIAL_FORM_VALUES;
  });

  const [errors, setErrors] = useState<OnTheGoValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<OnTheGoSubmissionResult | null>(null);
  const [isDraftSaved, setIsDraftSaved] = useState<boolean>(false);

  // 2. Photo management
  const addPhotos = useCallback(async (files: File[]) => {
    const newItems: OnTheGoPhoto[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      isUploading: false,
    }));

    setValues((prev) => ({
      ...prev,
      photos: [...prev.photos, ...newItems].slice(0, 5), // Maximum 5 photos
    }));
  }, []);

  const removePhoto = useCallback((photoId: string) => {
    setValues((prev) => {
      const target = prev.photos.find((p) => p.id === photoId);
      if (target?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return {
        ...prev,
        photos: prev.photos.filter((p) => p.id !== photoId),
      };
    });
  }, []);

  // 3. Field updates
  const setDescription = useCallback((val: string) => {
    setValues((prev) => ({ ...prev, description: val }));
    setErrors((prev) => ({ ...prev, description: undefined, general: undefined }));
  }, []);

  const setZoneId = useCallback((zoneId: number | null) => {
    setValues((prev) => ({ ...prev, zoneId, wardNumber: null }));
    setErrors((prev) => ({ ...prev, zoneId: undefined, wardNumber: undefined }));
  }, []);

  const setWardNumber = useCallback((wardNumber: number | null) => {
    setValues((prev) => ({ ...prev, wardNumber }));
    setErrors((prev) => ({ ...prev, wardNumber: undefined }));
  }, []);

  const setDepartmentId = useCallback((departmentId: string | null) => {
    setValues((prev) => ({ ...prev, departmentId, grievanceTypeId: null, officerUserId: null }));
    setErrors((prev) => ({ ...prev, departmentId: undefined, grievanceTypeId: undefined, officerUserId: undefined }));
  }, []);

  const setGrievanceTypeId = useCallback((grievanceTypeId: number | null) => {
    setValues((prev) => ({ ...prev, grievanceTypeId }));
    setErrors((prev) => ({ ...prev, grievanceTypeId: undefined }));
  }, []);

  const setOfficerUserId = useCallback((officerUserId: number | null) => {
    setValues((prev) => ({ ...prev, officerUserId }));
    setErrors((prev) => ({ ...prev, officerUserId: undefined }));
  }, []);

  const setIsCitizenReported = useCallback((val: boolean) => {
    setValues((prev) => ({
      ...prev,
      isCitizenReported: val,
      ...(!val ? { citizenMobile: '', citizenName: '' } : {}),
    }));
    setErrors((prev) => ({ ...prev, citizenMobile: undefined }));
  }, []);

  const setAdditionalField = useCallback(<K extends keyof OnTheGoFormValues>(key: K, val: OnTheGoFormValues[K]) => {
    const finalVal = key === 'citizenName' ? (sanitizeCitizenName(String(val || '')) as OnTheGoFormValues[K]) : val;
    setValues((prev) => ({ ...prev, [key]: finalVal }));
    if (key === 'citizenMobile') {
      setErrors((prev) => ({ ...prev, citizenMobile: undefined }));
    }
    if (key === 'citizenName') {
      const trimmed = String(finalVal || '').trim();
      const nameErr = trimmed ? validateCitizenFullName(trimmed, { isRequired: false }, t) : undefined;
      setErrors((prev) => ({ ...prev, citizenName: nameErr }));
    }
    if (key === 'landmark') setErrors((prev) => ({ ...prev, landmark: undefined }));
  }, [t]);

  // 4. Save Draft
  const saveDraft = useCallback(() => {
    const { photos: _photos, ...draftPayload } = values;
    const success = saveOnTheGoDraft(draftPayload);
    if (success) {
      setIsDraftSaved(true);
      setTimeout(() => setIsDraftSaved(false), 3000);
    }
    return success;
  }, [values]);

  // 5. Validation - Unified with Raise Grievance standards
  const validateForm = useCallback((): boolean => {
    const errs: OnTheGoValidationErrors = {};
    const trimmedDesc = (values.description || '').normalize('NFC').trim();
    const lowerDesc = trimmedDesc.toLowerCase();
    const keyboardPatterns = ['qwerty', 'asdfgh', 'zxcvbn', 'sdfghj', 'dfghjk', 'fghjkl'];
    const isGibberish = keyboardPatterns.some((p) => lowerDesc.includes(p)) || /([a-z0-9])\1{4,}/i.test(lowerDesc);

    if (!trimmedDesc) {
      errs.description = t('descriptionRequired');
    } else if (isGibberish) {
      errs.description = t('aiNonCivicDescription');
    } else if (trimmedDesc.length < 10) {
      errs.description = t('descriptionMinLengthError');
    } else if (trimmedDesc.length > 1000) {
      errs.description = t('descriptionMaxLengthError');
    }

    if (!values.zoneId) errs.zoneId = t('zoneRequiredError');
    if (!values.wardNumber) errs.wardNumber = t('wardRequiredError');
    if (!values.departmentId) errs.departmentId = t('deptRequiredError');
    if (!values.officerUserId) errs.officerUserId = t('officerRequiredError');

    if (values.isCitizenReported) {
      const rawMobile = normalizeDevanagariDigits(values.citizenMobile || '').trim();
      const cleanMobile = rawMobile.replace(/\D/g, '');
      if (!cleanMobile) {
        errs.citizenMobile = t('mobileRequiredError');
      } else if (cleanMobile.length !== 10) {
        errs.citizenMobile = t('mobileLengthError');
      } else if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
        errs.citizenMobile = t('mobileFormatError');
      }

      const nameError = validateCitizenFullName(values.citizenName, { isRequired: true }, t);
      if (nameError) errs.citizenName = nameError;
    }

    if (values.landmark && values.landmark.trim()) {
      const landmarkError = validateRoadLandmark(values.landmark, { isRequired: false }, t);
      if (landmarkError) errs.landmark = landmarkError;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [values, t]);

  // 6. Submit Form
  const executeSubmission = useCallback(async () => {
    if (isSubmitting || isTouchSubmittingRef.current) return;
    if (!values.zoneId || !values.wardNumber || !values.departmentId || !values.officerUserId) return;
    isTouchSubmittingRef.current = true;

    try {
      setIsSubmitting(true);
      setErrors({});

      const cleanMobile = values.isCitizenReported
        ? normalizeDevanagariDigits(values.citizenMobile || '').replace(/\D/g, '')
        : '';

      const res = await submitOnTheGoGrievanceAction({
        description: values.description.trim(),
        zoneId: Number(values.zoneId),
        wardNumber: Number(values.wardNumber),
        departmentId: String(values.departmentId),
        grievanceTypeId: values.grievanceTypeId ?? undefined,
        assignedOfficerUserId: Number(values.officerUserId),
        citizenMobile: cleanMobile,
        citizenName: (values.citizenName || '').trim(),
        roadLandmark: (values.landmark || '').trim(),
      });

      if (res.success && res.data) {
        const photoFiles = values.photos.map((item) => item.file).filter((f): f is File => Boolean(f));
        if (photoFiles.length > 0 && res.data.grievanceId > 0) {
          try {
            await uploadEvidenceFiles(res.data.grievanceId, photoFiles);
          } catch (photoErr) {
            console.warn('[OnTheGo] Photo upload exception after grievance creation:', photoErr);
          }
        }

        setSubmissionResult(res.data);
        clearOnTheGoDraft();
        if (onSuccess) onSuccess(res.data);
      } else {
        const norm = displayGrievanceError(res.message, res.statusCode, t, { citizenMobile: values.citizenMobile });
        setErrors({ general: norm.message });
      }
    } catch (err) {
      const norm = displayGrievanceError(err, undefined, t, { citizenMobile: values.citizenMobile });
      setErrors({ general: norm.message });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => { isTouchSubmittingRef.current = false; }, 1200);
    }
  }, [values, onSuccess, isSubmitting, t]);

  const submitForm = useCallback(async () => {
    if (!validateForm() || isSubmitting) return;
    await executeSubmission();
  }, [validateForm, isSubmitting, executeSubmission]);

  const resetForm = useCallback(() => {
    setValues(INITIAL_FORM_VALUES);
    setErrors({});
    setSubmissionResult(null);
  }, []);

  return {
    values, errors, isSubmitting, isDraftSaved, submissionResult,
    addPhotos, removePhoto, setDescription, setZoneId, setWardNumber,
    setDepartmentId, setGrievanceTypeId, setOfficerUserId,
    setIsCitizenReported, setAdditionalField, saveDraft, submitForm, resetForm,
  };
}
