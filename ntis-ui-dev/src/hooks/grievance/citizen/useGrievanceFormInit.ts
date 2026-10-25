'use client';

import { useEffect, useRef } from 'react';
import type { TrackingTicket } from '@/types/grievance';
import type { MunicipalDepartment } from '@/types/grievance/department.types';
import type { ResolvedCitizenPlace } from '@/lib/services/grievance';
import type { GrievancePhotoItem } from '@/types/grievance/grievance-photo.types';
import { fetchGrievancePhotosAction } from '@/lib/actions/grievance/citizen/grievance-photo.actions';
import { trackGrievanceDetailsAction } from '@/lib/actions/grievance/citizen/track-grievance.actions';
import { findDepartment } from '@/lib/utils/grievance';

function unmaskedValue(val?: string | null): string {
  if (!val || val.includes('*')) return '';
  return val.trim();
}

interface UseGrievanceFormInitProps {
  isOpen: boolean;
  editTicket?: TrackingTicket;
  user: { name?: string; phone?: string } | null;
  liveDepartments: MunicipalDepartment[];
  defaultLocation?: {
    latitude?: number;
    longitude?: number;
    address?: string;
    ward?: string;
  };
  resolveInitialDept: () => MunicipalDepartment | null;
  autoDetectLocation: (force?: boolean) => void;
  resetPhotoState: () => void;
  resetSubmissionState: () => void;
  setErrors: (err: Record<string, string | undefined>) => void;
  setDescription: (desc: string) => void;
  setRoadLandmark: (landmark: string) => void;
  setLocationCoords: (coords: ResolvedCitizenPlace | null) => void;
  setFullName: (name: string) => void;
  setMobile: (phone: string) => void;
  setSelectedDept: (dept: MunicipalDepartment | null) => void;
  setDefectType: (defect: string) => void;
  setExistingPhotos: (photos: GrievancePhotoItem[]) => void;
  setIsLoadingPhotos: (loading: boolean) => void;
  isSuccess: boolean;
}

export function useGrievanceFormInit({
  isOpen,
  editTicket,
  user,
  liveDepartments,
  defaultLocation,
  resolveInitialDept,
  autoDetectLocation,
  resetPhotoState,
  resetSubmissionState,
  setErrors,
  setDescription,
  setRoadLandmark,
  setLocationCoords,
  setFullName,
  setMobile,
  setSelectedDept,
  setDefectType,
  setExistingPhotos,
  setIsLoadingPhotos,
  isSuccess,
}: UseGrievanceFormInitProps) {
  const prevIsOpenRef = useRef(false);
  const prevEditTicketIdRef = useRef<string | number | undefined>(undefined);
  const isSuccessRef = useRef(false);

  useEffect(() => {
    isSuccessRef.current = isSuccess;
  }, [isSuccess]);

  useEffect(() => {
    const isNewlyOpened = isOpen && !prevIsOpenRef.current;
    const isTicketChanged = editTicket?.id !== prevEditTicketIdRef.current;
    prevIsOpenRef.current = isOpen;
    prevEditTicketIdRef.current = editTicket?.id;

    if (!isOpen) {
      resetSubmissionState();
      setSelectedDept(null);
      return;
    }
    if (isSuccessRef.current || (!isNewlyOpened && !isTicketChanged)) {
      return;
    }

    resetPhotoState();
    resetSubmissionState();
    setErrors({});

    if (editTicket) {
      setDescription(editTicket.description || '');
      setRoadLandmark(editTicket.roadLandmark || editTicket.ward || '');

      if (editTicket.latitude && editTicket.longitude) {
        setLocationCoords({
          latitude: Number(editTicket.latitude),
          longitude: Number(editTicket.longitude),
          placeName: editTicket.roadLandmark || 'Amravati City Area',
          placeNameMr: '',
          zone: 'Zone 3',
          ward: editTicket.ward || 'Central Ward',
          source: 'manual',
        });
      } else {
        setLocationCoords(null);
      }

      // Populate citizen name & mobile: prioritize unmasked ticket data, fallback to user profile
      const resolvedName = unmaskedValue(editTicket.citizenName) || unmaskedValue(user?.name);
      if (resolvedName) setFullName(resolvedName);

      const rawPhone = unmaskedValue(editTicket.citizenMobile) || unmaskedValue(user?.phone);
      const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);
      if (cleanPhone.length === 10) setMobile(cleanPhone);

      const targetDept = editTicket.departmentId
        ? liveDepartments.find(
            (d) => String(d.srNo) === String(editTicket.departmentId) || String(d.id) === String(editTicket.departmentId)
          ) || findDepartment(editTicket.department, liveDepartments)
        : findDepartment(editTicket.department, liveDepartments);

      setSelectedDept(targetDept || null);
      setDefectType(editTicket.subject || targetDept?.grievanceTypes?.[0] || '');

      const rawId = editTicket.id;
      const parsedId = parseInt(String(rawId), 10);
      const isDirectInt = !isNaN(parsedId) && String(parsedId) === String(rawId).trim();

      if (isDirectInt && parsedId > 0) {
        setIsLoadingPhotos(true);
        fetchGrievancePhotosAction(parsedId)
          .then((res) => {
            if (res.success && res.data) setExistingPhotos(res.data);
          })
          .finally(() => setIsLoadingPhotos(false));
      } else if (editTicket.token && editTicket.token.startsWith('GRV-')) {
        setIsLoadingPhotos(true);
        trackGrievanceDetailsAction(editTicket.token)
          .then((detailRes) => {
            if (detailRes.success && detailRes.data?.id) {
              return fetchGrievancePhotosAction(detailRes.data.id);
            }
            return null;
          })
          .then((photoRes) => {
            if (photoRes?.success && photoRes.data) {
              setExistingPhotos(photoRes.data);
            }
          })
          .finally(() => setIsLoadingPhotos(false));
      }
    } else {
      setDescription('');
      setExistingPhotos([]);
      const targetDept = resolveInitialDept();
      setSelectedDept(targetDept);
      setDefectType('');

      if (defaultLocation?.address) {
        setRoadLandmark(defaultLocation.address);
      } else {
        autoDetectLocation(false);
      }
    }
  }, [
    isOpen,
    user,
    resolveInitialDept,
    defaultLocation,
    autoDetectLocation,
    editTicket,
    liveDepartments,
    setMobile,
    setFullName,
    setSelectedDept,
    setDefectType,
    resetSubmissionState,
    resetPhotoState,
    setLocationCoords,
    setRoadLandmark,
    setExistingPhotos,
    setIsLoadingPhotos,
    setErrors,
    setDescription,
  ]);

  // Reactive Sync: When liveDepartments loads asynchronously or editTicket arrives, match department & defect
  useEffect(() => {
    if (!isOpen || !editTicket || liveDepartments.length === 0) return;
    const targetDept = editTicket.departmentId
      ? liveDepartments.find(
          (d) =>
            String(d.srNo) === String(editTicket.departmentId) ||
            String(d.id) === String(editTicket.departmentId)
        ) || findDepartment(editTicket.department, liveDepartments)
      : findDepartment(editTicket.department, liveDepartments);

    if (targetDept) {
      setSelectedDept(targetDept);
      if (editTicket.subject) {
        setDefectType(editTicket.subject);
      }
    }
  }, [isOpen, editTicket, liveDepartments, setSelectedDept, setDefectType]);
}
