'use client';

import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import type { MunicipalDepartment } from '@/types/grievance';
import type { GrievancePhotoItem } from '@/types/grievance/grievance-photo.types';
import { deleteGrievancePhotoAction } from '@/lib/actions/grievance/citizen/grievance-photo.actions';
import { extractExifGps, resolveCitizenPlace, type ResolvedCitizenPlace } from '@/lib/services/grievance';
import { compressImageFile } from '@/lib/utils/grievance/evidence-upload.helper';

interface UseGrievancePhotoUploadProps {
  locale?: string;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  liveDepartments?: MunicipalDepartment[];
  setSelectedDept?: (dept: MunicipalDepartment | null) => void;
  setDescription?: React.Dispatch<React.SetStateAction<string>>;
  setLocationCoords: (coords: ResolvedCitizenPlace | null) => void;
  setRoadLandmark: (val: string) => void;
}

export function useGrievancePhotoUpload({
  t,
  setLocationCoords,
  setRoadLandmark,
}: UseGrievancePhotoUploadProps) {
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<GrievancePhotoItem[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState<boolean>(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<number | null>(null);

  const setAiScanToast = useCallback((_toastMsg: string | null) => {}, []);

  // Refs for hidden inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Extract EXIF GPS Metadata from Photo (without AI defect scanning or auto-description)
  const extractPhotoLocation = useCallback(
    async (fileOrBlob: File | Blob) => {
      try {
        const photoGps = await extractExifGps(fileOrBlob);
        if (
          photoGps &&
          photoGps.hasGps &&
          (Math.abs(photoGps.latitude) >= 0.0001 || Math.abs(photoGps.longitude) >= 0.0001)
        ) {
          const resolved = await resolveCitizenPlace(photoGps.latitude, photoGps.longitude);
          const placeLabel = resolved.placeName;
          if (placeLabel && placeLabel.trim()) {
            setRoadLandmark(placeLabel);
            setLocationCoords({ ...resolved, source: 'photo_exif' });
            toast.success(t('photoGpsDetected', { place: placeLabel }));
          }
        }
      } catch (err) {
        console.warn('Photo EXIF GPS extraction error:', err);
      }
    },
    [setLocationCoords, setRoadLandmark, t]
  );

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files?.length) return;
      const fileArr = Array.from(files);
      if (e.target) e.target.value = '';

      // 1. Extract GPS from original uncompressed file first (preserve EXIF)
      extractPhotoLocation(fileArr[0]);

      // 2. Client-side compression for instant upload and reduced memory footprint
      try {
        const compressedFiles = await Promise.all(
          fileArr.map((f) => compressImageFile(f))
        );
        const persistentUrls = await Promise.all(
          compressedFiles.map(
            (file) =>
              new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => resolve(URL.createObjectURL(file));
                reader.readAsDataURL(file);
              })
          )
        );
        setImageFiles((prev) => [...prev, ...compressedFiles].slice(0, 5));
        setImages((prev) => [...prev, ...persistentUrls].slice(0, 5));
      } catch (err) {
        console.warn('Image compression fallback:', err);
        const fallbackUrls = fileArr.map((f) => URL.createObjectURL(f));
        setImageFiles((prev) => [...prev, ...fileArr].slice(0, 5));
        setImages((prev) => [...prev, ...fallbackUrls].slice(0, 5));
      }
    },
    [extractPhotoLocation]
  );

  const handleRemoveImage = useCallback((idx: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleDeleteExistingPhoto = useCallback(
    async (photoId: number) => {
      setDeletingPhotoId(photoId);
      try {
        const res = await deleteGrievancePhotoAction(photoId);
        if (res.success) {
          setExistingPhotos((prev) => prev.filter((p) => p.id !== photoId));
          toast.success(t('photoDeletedSuccess'));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('grievance_photos_updated'));
          }
        } else {
          toast.error(res.message || 'Failed to delete photo');
        }
      } catch {
        toast.error('An error occurred while deleting photo');
      } finally {
        setDeletingPhotoId(null);
      }
    },
    [t]
  );

  const resetPhotoState = useCallback(() => {
    setImages([]);
    setImageFiles([]);
  }, []);

  return {
    images,
    setImages,
    imageFiles,
    setImageFiles,
    existingPhotos,
    setExistingPhotos,
    isLoadingPhotos,
    setIsLoadingPhotos,
    deletingPhotoId,
    isAiAnalyzing: false,
    aiScanToast: null,
    setAiScanToast,
    aiConfidence: null,
    fileInputRef,
    cameraInputRef,
    triggerAiAnalysis: extractPhotoLocation,
    handleFileUpload,
    handleRemoveImage,
    handleDeleteExistingPhoto,
    resetPhotoState,
  };
}
