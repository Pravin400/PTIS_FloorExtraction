

'use client';

/**
 * Evidence Photo Upload Helper
 * Handles client-side compression and multi-file uploading for grievance evidence.
 * Path: src/lib/utils/grievance/evidence-upload.helper.ts
 */

import { toast } from 'sonner';
import {
  uploadGrievancePhotoAction,
  uploadMultipleGrievancePhotosAction,
} from '@/lib/actions/grievance/citizen/grievance-photo.actions';
import { getCookieValue } from '@/lib/utils/cookie';

/**
 * Compresses an image file client-side to ensure it stays within
 * backend file size limits (<1.5MB) and serializes safely.
 */
export async function compressAndPrepareFile(
  file: File,
  maxDimension = 1920,
  quality = 0.82
): Promise<Blob> {
  if (typeof window === 'undefined') {
    const buffer = await file.arrayBuffer();
    return new Blob([buffer], { type: file.type || 'image/jpeg' });
  }

  // If not an image or already lightweight (< 400KB), return as-is
  if (!file.type.startsWith('image/') || file.size < 400 * 1024) {
    const buffer = await file.arrayBuffer();
    return new Blob([buffer], { type: file.type || 'image/jpeg' });
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        file.arrayBuffer().then((buf) => resolve(new Blob([buf], { type: file.type || 'image/jpeg' })));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            file.arrayBuffer().then((buf) => resolve(new Blob([buf], { type: file.type || 'image/jpeg' })));
          }
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      file.arrayBuffer().then((buf) => resolve(new Blob([buf], { type: file.type || 'image/jpeg' })));
    };
    img.src = url;
  });
}

/**
 * Compresses an image file and returns a ready-to-use File instance.
 */
export async function compressImageFile(
  file: File,
  maxDimension = 1920,
  quality = 0.82
): Promise<File> {
  if (typeof window === 'undefined' || typeof File === 'undefined') return file;
  if (!file.type.startsWith('image/') || file.size < 400 * 1024) return file;

  try {
    const blob = await compressAndPrepareFile(file, maxDimension, quality);
    const originalName = file.name || 'evidence.jpg';
    const safeName = originalName.replace(/\.[^/.]+$/, '.jpg');
    return new File([blob], safeName, { type: 'image/jpeg', lastModified: Date.now() });
  } catch (err) {
    console.warn('[ImageCompression] Compression error, using original file:', err);
    return file;
  }
}

/**
 * Uploads evidence photos linked to an application ID.
 * Tries batch upload first, falling back to individual upload if necessary.
 */
export async function uploadEvidenceFiles(
  applicationId: number,
  files: File[],
  explicitToken?: string
): Promise<boolean> {
  if (files.length === 0 || !applicationId || applicationId <= 0) return true;
  try {
    const blobs = await Promise.all(files.map((f) => compressAndPrepareFile(f)));

    const clientToken = explicitToken || (typeof document !== 'undefined'
      ? (getCookieValue('citizen_token') || getCookieValue('token') || getCookieValue('auth_token'))
      : '');

    const safeFiles = blobs.map((b, i) => {
      const originalName = files[i]?.name || `evidence_${i + 1}.jpg`;
      const safeName = originalName.replace(/\.[^/.]+$/, '.jpg');
      if (typeof File !== 'undefined') {
        return new File([b], safeName, { type: 'image/jpeg' });
      }
      return b;
    });

    let lastError = '';
    let anySuccess = false;

    if (safeFiles.length === 1) {
      // 1. Single photo: Prioritize /api/grievance-photos/upload (field 'File')
      const single = new FormData();
      single.append('GrievanceApplicationId', String(applicationId));
      single.append('PhotoTypeId', '1');
      single.append('Remarks', 'Citizen Evidence');
      if (clientToken) {
        single.append('Token', decodeURIComponent(clientToken));
      }
      const originalName = files[0]?.name || 'evidence_1.jpg';
      const safeName = originalName.replace(/\.[^/.]+$/, '.jpg');
      single.append('File', safeFiles[0], safeName);

      const singleRes = await uploadGrievancePhotoAction(single);
      if (singleRes.success) return true;
      lastError = singleRes.message || '';

      // Fallback: Try batch /upload-multiple with field 'Files'
      const batchFormData = new FormData();
      batchFormData.append('GrievanceApplicationId', String(applicationId));
      batchFormData.append('PhotoTypeId', '1');
      batchFormData.append('Remarks', 'Citizen Evidence');
      if (clientToken) {
        batchFormData.append('Token', decodeURIComponent(clientToken));
      }
      batchFormData.append('Files', safeFiles[0], safeName);
      const batchRes = await uploadMultipleGrievancePhotosAction(batchFormData);
      if (batchRes.success) return true;
      lastError = batchRes.message || lastError;
    } else {
      // 2. Multiple photos: Prioritize /api/grievance-photos/upload-multiple (field 'Files')
      const photoFormData = new FormData();
      photoFormData.append('GrievanceApplicationId', String(applicationId));
      photoFormData.append('PhotoTypeId', '1');
      photoFormData.append('Remarks', `Citizen Evidence (${safeFiles.length} photos)`);
      if (clientToken) {
        photoFormData.append('Token', decodeURIComponent(clientToken));
      }
      for (let i = 0; i < safeFiles.length; i++) {
        const originalName = files[i]?.name || `evidence_${i + 1}.jpg`;
        const safeName = originalName.replace(/\.[^/.]+$/, '.jpg');
        photoFormData.append('Files', safeFiles[i], safeName);
      }

      const batchRes = await uploadMultipleGrievancePhotosAction(photoFormData);
      if (batchRes.success) return true;
      lastError = batchRes.message || '';

      // Fallback: Individual upload if batch fails
      for (let i = 0; i < safeFiles.length; i++) {
        const single = new FormData();
        single.append('GrievanceApplicationId', String(applicationId));
        single.append('PhotoTypeId', '1');
        single.append('Remarks', `Evidence Photo ${i + 1}`);
        if (clientToken) {
          single.append('Token', decodeURIComponent(clientToken));
        }
        const originalName = files[i]?.name || `photo_${i + 1}.jpg`;
        const safeName = originalName.replace(/\.[^/.]+$/, '.jpg');
        single.append('File', safeFiles[i], safeName);

        const singleRes = await uploadGrievancePhotoAction(single);
        if (singleRes.success) {
          anySuccess = true;
        } else {
          lastError = singleRes.message || lastError;
        }
      }
      if (anySuccess) return true;
    }

    if (!anySuccess) {
      const lowerErr = lastError.toLowerCase();
      if (lowerErr.includes('401') || lowerErr.includes('unauthorized') || lowerErr.includes('session')) {
        toast.warning('Session expired. Evidence photo upload failed. Please verify with OTP in grievance details.');
      } else if (lowerErr.includes('413') || lowerErr.includes('large') || lowerErr.includes('length')) {
        toast.warning('Photo size too large for server. Please select a smaller photo.');
      } else {
        toast.warning(lastError || 'Evidence photo upload failed. Please verify that your session is active.');
      }
      return false;
    }
    return true;
  } catch (err) {
    console.error('[GrievancePhotoUpload] Unexpected evidence upload error:', err);
    toast.warning('Photo upload error. Please re-upload in grievance details.');
    return false;
  }
}
