'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type { MunicipalDepartment, TrackingTicket } from '@/types/grievance';
import type { GrievanceTypeItem } from '@/types/grievance/department-master.types';
import { submitGrievanceApplicationAction } from '@/lib/actions/grievance/citizen/grievance-submission.actions';
import {
  updateGrievanceApplicationAction,
  trackGrievanceDetailsAction,
} from '@/lib/actions/grievance/citizen/track-grievance.actions';
import {
  createTrackingTicketFromSubmission,
  saveTrackingTicket,
  resolveAdministrativeWardFromText,
  routeGrievanceByLocation,
  type ResolvedCitizenPlace,
} from '@/lib/services/grievance';
import { getCookieValue } from '@/lib/utils/cookie';
import { uploadEvidenceFiles, displayGrievanceError, resolveGrievanceTypeId } from '@/lib/utils/grievance';

interface UseGrievanceSubmissionProps {
  editTicket?: TrackingTicket;
  onTicketUpdated?: (updated: TrackingTicket) => void;
  onSuccess?: (grievance: TrackingTicket | unknown) => void;
  onAuthRequired?: () => void;
  fullName: string;
  mobile: string;
  selectedDept: MunicipalDepartment | null;
  defectType: string;
  defectTypes: GrievanceTypeItem[];
  roadLandmark: string;
  description: string;
  images: string[];
  imageFiles: File[];
  locationCoords: ResolvedCitizenPlace | null;
}

function buildTicket(
  trackingId: string, dept: MunicipalDepartment | null, description: string, images: string[],
  citizen: { name: string; mobile: string }, coords: ResolvedCitizenPlace | null, defectType: string, landmark: string,
  targetAppId?: number, jurisdictionOverrides?: { zone?: string; ward?: string }
): TrackingTicket {
  const resolvedLandmark = landmark.trim() || coords?.placeName || '';
  const ticket = createTrackingTicketFromSubmission({
    trackingId, department: dept?.nameEn || '', description: description.trim(), images, citizen,
    jurisdiction: {
      zone: jurisdictionOverrides?.zone || coords?.zone || '',
      ward: jurisdictionOverrides?.ward || coords?.ward || '',
      landmark: resolvedLandmark,
    },
    specifics: { defectType: defectType || '', roadLandmark: resolvedLandmark },
    hod: dept?.hod || '',
  });
  if (targetAppId && targetAppId > 0) ticket.id = String(targetAppId);
  return ticket;
}

export function useGrievanceSubmission({
  editTicket,
  onTicketUpdated,
  onSuccess,
  onAuthRequired,
  fullName,
  mobile,
  selectedDept,
  defectType,
  defectTypes,
  roadLandmark,
  description,
  images,
  imageFiles,
  locationCoords,
}: UseGrievanceSubmissionProps) {
  const t = useTranslations('grievance');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const executeSubmissionRef = useRef<((name?: string, mob?: string, id?: number, token?: string) => Promise<void>) | null>(null);
  const [generatedTrackingId, setGeneratedTrackingId] = useState('');
  const [isSavedOffline, setIsSavedOffline] = useState(false);

  const resetSubmissionState = useCallback(() => {
    isSubmittingRef.current = false;
    setIsSuccess(false);
    setIsSubmitting(false);
    setGeneratedTrackingId('');
    setIsSavedOffline(false);
  }, []);

  const executeSubmission = useCallback(
    async (overrideName?: string, overrideMobile?: string, overrideCitizenId?: number, overrideToken?: string) => {
      if (isSubmittingRef.current || isSubmitting) return;
      isSubmittingRef.current = true;
      setIsSubmitting(true);

      const cookieMobile = typeof document !== 'undefined' ? getCookieValue('citizen_mobile') : '';
      const cookieName = typeof document !== 'undefined' ? getCookieValue('citizen_name') : '';
      const cookieCitizenId = typeof document !== 'undefined' ? getCookieValue('citizen_id') : '';
      const cookieUserId = typeof document !== 'undefined' ? getCookieValue('user_id') : '';
      const activeName = (overrideName || fullName || (cookieName ? decodeURIComponent(cookieName) : '')).trim();
      const activeMobile = (overrideMobile || mobile || cookieMobile || '').replace(/\D/g, '').slice(-10);
      const isCookieMobileMatch = Boolean(cookieMobile && cookieMobile.replace(/\D/g, '').slice(-10) === activeMobile);
      const parsedCitizenId = overrideCitizenId && overrideCitizenId > 0 ? overrideCitizenId : isCookieMobileMatch && Number(cookieCitizenId) > 0 ? Number(cookieCitizenId) : undefined;

      if (!selectedDept) {
        toast.error(t('selectDeptAlert'));
        setIsSubmitting(false);
        isSubmittingRef.current = false;
        return;
      }

      const parsedDeptId = Number(selectedDept.id);
      const deptId = !isNaN(parsedDeptId) && parsedDeptId > 0 ? parsedDeptId : (selectedDept.srNo || 0);
      if (!deptId || deptId <= 0) {
        toast.error(t('departmentRequired'));
        setIsSubmitting(false);
        isSubmittingRef.current = false;
        return;
      }

      const typeId = resolveGrievanceTypeId(defectType, defectTypes);

      if (!typeId) {
        const errorMsg = defectTypes.length === 0
          ? (t('noDefectTypesForDeptError') || 'This department has no grievance categories configured yet. Please select another department.')
          : (t('defectTypeRequiredError') || 'Please select a grievance type.');
        toast.error(errorMsg);
        setIsSubmitting(false);
        isSubmittingRef.current = false;
        return;
      }

      const finalDescription = description.trim();
      const textRouting = resolveAdministrativeWardFromText(roadLandmark.trim() || locationCoords?.placeName);

      // BRANCH: EDIT EXISTING GRIEVANCE APPLICATION
      if (editTicket) {
        let ticketIdNum = parseInt(String(editTicket.id), 10);
        if ((isNaN(ticketIdNum) || ticketIdNum <= 0) && editTicket.token) {
          try {
            const detailsRes = await trackGrievanceDetailsAction(editTicket.token);
            if (detailsRes.success && detailsRes.data?.id) ticketIdNum = detailsRes.data.id;
          } catch {}
        }

        const editZoneId = locationCoords?.zoneId ?? textRouting?.zoneId ?? editTicket.zoneId ?? undefined;
        const editWardId = locationCoords?.wardId ?? textRouting?.wardId ?? editTicket.wardId ?? undefined;

        try {
          const updateRes = await updateGrievanceApplicationAction(ticketIdNum, {
            departmentId: deptId,
            grievanceTypeId: typeId,
            roadLandmark: roadLandmark.trim(),
            description: finalDescription,
            latitude: locationCoords?.latitude ? String(locationCoords.latitude) : undefined,
            longitude: locationCoords?.longitude ? String(locationCoords.longitude) : undefined,
            zoneId: editZoneId,
            wardId: editWardId,
          });

          if (!updateRes.success) {
            displayGrievanceError(updateRes.message, undefined, t);
            return;
          }

          if (imageFiles.length > 0) {
            await uploadEvidenceFiles(ticketIdNum, imageFiles);
          }

          const updatedTicket: TrackingTicket = {
            ...editTicket,
            department: selectedDept?.nameEn || editTicket.department,
            departmentId: deptId,
            subject: defectType || editTicket.subject,
            grievanceTypeId: typeId,
            description: finalDescription,
            roadLandmark: roadLandmark.trim(),
            ward: roadLandmark.trim() || editTicket.ward,
            citizenName: fullName,
            citizenMobile: mobile,
          };

          saveTrackingTicket(updatedTicket);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('grievance_photos_updated'));
          }
          toast.success(t('grievanceUpdatedSuccess'));
          onTicketUpdated?.(updatedTicket);
          onSuccess?.(updatedTicket);
        } catch (err) {
          toast.error((err as Error).message || 'Failed to save changes');
        } finally {
          isSubmittingRef.current = false;
          setIsSubmitting(false);
        }
        return;
      }

      // BRANCH: CREATE NEW GRIEVANCE APPLICATION
      const citizen = { name: activeName || t('defaultCitizen'), mobile: activeMobile };
      const spatial = locationCoords?.latitude && locationCoords?.longitude
        ? routeGrievanceByLocation({ lat: locationCoords.latitude, lng: locationCoords.longitude })
        : null;
      const effectiveZoneId = locationCoords?.zoneId ?? textRouting?.zoneId ?? spatial?.zoneId ?? undefined;
      const effectiveWardId = locationCoords?.wardId ?? textRouting?.wardId ?? spatial?.wardNumber ?? undefined;

      try {
        const parsedCreatedBy = (overrideCitizenId && overrideCitizenId > 0)
          ? overrideCitizenId
          : isCookieMobileMatch && Number(cookieCitizenId) > 0
          ? Number(cookieCitizenId)
          : Number(cookieUserId) > 0 ? Number(cookieUserId) : undefined;

        const res = await submitGrievanceApplicationAction({
          citizenId: parsedCitizenId,
          fullName: activeName,
          mobile: activeMobile,
          departmentId: deptId,
          grievanceTypeId: typeId,
          roadLandmark: roadLandmark.trim() || locationCoords?.placeName || '',
          description: finalDescription,
          images,
          latitude: locationCoords?.latitude ? String(locationCoords.latitude) : undefined,
          longitude: locationCoords?.longitude ? String(locationCoords.longitude) : undefined,
          zoneId: effectiveZoneId,
          wardId: effectiveWardId,
          zoneName: locationCoords?.zone || textRouting?.zoneName || undefined,
          wardName: locationCoords?.ward || textRouting?.wardName || undefined,
          createdBy: parsedCreatedBy,
          token: overrideToken || (typeof document !== 'undefined' ? getCookieValue('citizen_token') : undefined),
        });

        if (res.success) {
          const trackingId = res.data?.grievanceNo?.trim() || (res.data?.id && Number(res.data.id) > 0 ? `GRV-${new Date().getFullYear()}-${String(res.data.id).padStart(4, '0')}` : `GRV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`);
          setGeneratedTrackingId(trackingId);

          let targetAppId = Number(res.data?.id);
          if ((!targetAppId || isNaN(targetAppId) || targetAppId <= 0) && trackingId) {
            try {
              const detailsRes = await trackGrievanceDetailsAction(trackingId);
              if (detailsRes.success && detailsRes.data?.id) targetAppId = Number(detailsRes.data.id);
            } catch (err) {
              console.error('[executeSubmission] Error resolving tracking details:', err);
            }
          }

          if (targetAppId > 0 && imageFiles.length > 0) {
            try {
              const submissionToken = res.data?.token || overrideToken || (typeof document !== 'undefined' ? (getCookieValue('citizen_token') || getCookieValue('auth_token') || getCookieValue('token')) : undefined);
              const uploadOk = await uploadEvidenceFiles(targetAppId, imageFiles, submissionToken);
              if (!uploadOk) toast.warning('Grievance registered, but photo upload encountered an issue. You can re-upload in grievance details.');
            } catch (photoErr) {
              console.warn('[executeSubmission] Photo upload exception:', photoErr);
            }
          }

          const ticket = buildTicket(trackingId, selectedDept, description, images, citizen, locationCoords, defectType, roadLandmark, targetAppId, {
            zone: res.data?.zoneName || (res.data?.zoneNo ? `Zone ${res.data.zoneNo}` : undefined),
            ward: res.data?.wardName || (res.data?.wardNo ? `Ward ${res.data.wardNo}` : undefined),
          });
          saveTrackingTicket(ticket);
          setIsSuccess(true);
          onSuccess?.(ticket);
          toast.success(res.message || t('grievanceSubmitSuccess'));
        } else {
          displayGrievanceError(res.message, res.statusCode, t, {
            citizenMobile: activeMobile, onAuthRequired,
            onRetry: () => executeSubmissionRef.current?.(overrideName, overrideMobile, overrideCitizenId, overrideToken),
          });
        }
      } catch (err) {
        displayGrievanceError(err, undefined, t, {
          citizenMobile: activeMobile, onAuthRequired,
          onRetry: () => executeSubmissionRef.current?.(overrideName, overrideMobile, overrideCitizenId, overrideToken),
        });
      } finally {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [isSubmitting, fullName, mobile, selectedDept, description, images, imageFiles, defectType, defectTypes, roadLandmark, locationCoords, editTicket, onTicketUpdated, onSuccess, onAuthRequired, t]
  );

  useEffect(() => {
    executeSubmissionRef.current = executeSubmission;
  }, [executeSubmission]);

  return {
    isSuccess,
    isSubmitting,
    generatedTrackingId,
    isSavedOffline,
    resetSubmissionState,
    executeSubmission,
  };
}
