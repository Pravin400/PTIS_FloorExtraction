'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import {
  deleteUlbImageAction,
  updateUlbImageTypeAction,
  uploadUlbImageAction,
  replaceUlbImageAction,
} from '@/app/[locale]/configuration-settings/ulb-configuration/actions';
import { useConfirm } from '@/components/common/ConfirmProvider';
import type { ULBImage, UlbImageMasterDto } from '@/types/ulbconfig-master.types';

export type PendingUpload = {
  tempId: string;
  mode: 'upload' | 'replace';
  category: 'Logo' | 'Background' | 'Gallery' | 'BackgroundLibrary';
  file: File;
  replaceId: string | null;
};

export type ImageHookReturn = ReturnType<typeof useUlbImages>;

export function useUlbImages(initialImages: UlbImageMasterDto[], onLogoChange: (url: string | null, isAutoSelect?: boolean) => void) {
  const { confirm } = useConfirm();
  
  // Track original images to detect category changes (like Background -> BackgroundLibrary)
  const [originalImages] = useState<UlbImageMasterDto[]>(initialImages);

  const [images, setImages] = useState<ULBImage[]>(() =>
    initialImages.map((img) => {
      const realId = img.id ?? (img as UlbImageMasterDto & { ulbImageMasterId?: number }).ulbImageMasterId;
      return {
        id: String(realId),
        url: `/api/UlbImageMaster/${img.documentGuid}/view`,
        name: img.imageType || `Image-${realId}`,
        size: 0,
        isBackgroundImage: img.imageType === 'Background',
        uploadedDate: img.createdDate || new Date().toISOString(),
        documentId: img.imageId || undefined,
      };
    })
  );

  const [isUploading, setIsUploading] = useState(false);
  
  // Pending queues
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [pendingDeletions, setPendingDeletions] = useState<string[]>([]);
  
  const hasPendingImageChanges = pendingUploads.length > 0 || pendingDeletions.length > 0;

  // Active blob URLs tracking to prevent browser RAM memory leaks
  const activeBlobUrls = useRef<Set<string>>(new Set());

  const revokeBlobUrl = useCallback((url: string | null | undefined) => {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
      activeBlobUrls.current.delete(url);
    }
  }, []);

  const createManagedBlobUrl = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    activeBlobUrls.current.add(url);
    return url;
  }, []);

  useEffect(() => {
    const urlsRef = activeBlobUrls.current;
    return () => {
      // Cleanup all unrevoked blob URLs on unmount
      urlsRef.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      urlsRef.clear();
    };
  }, []);

  const deleteImage = useCallback(async (id: string, category: 'Logo' | 'Background' | 'Gallery') => {
    confirm({
      variant: 'delete',
      title: 'Remove Image',
      description: 'Are you sure you want to remove this image? (Changes apply when you Save Progress)',
      confirmText: 'Remove',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setImages((prev) => {
          const target = prev.find((img) => img.id === id);
          if (target && target.url.startsWith('blob:')) {
            revokeBlobUrl(target.url);
          }
          return prev.filter((img) => img.id !== id);
        });
        if (category === 'Logo') onLogoChange(null);

        if (id.startsWith('temp-')) {
          setPendingUploads((prev) => prev.filter((u) => u.tempId !== id));
        } else {
          setPendingDeletions((prev) => [...prev, id]);
        }
        toast.info('Image removed. Click "Save Progress" to confirm.');
      }
    });
  }, [confirm, onLogoChange, revokeBlobUrl]);

  const setAsBackground = useCallback(async (id: string) => {
    const target = images.find((img) => img.id === id);
    if (!target) return;
    const prevBg = images.find((img) => img.name === 'Background' || img.isBackgroundImage);

    setImages((prev) =>
      prev.map((img) => {
        if (img.id === id) return { ...img, isBackgroundImage: true, name: 'Background' };
        if (prevBg && img.id === prevBg.id) return { ...img, isBackgroundImage: false, name: 'BackgroundLibrary' };
        return img;
      })
    );
    
    // If it's a pending upload, update its category
    if (id.startsWith('temp-')) {
        setPendingUploads(prev => prev.map(u => {
            if (u.tempId === id) return { ...u, category: 'Background' };
            if (prevBg && u.tempId === prevBg.id) return { ...u, category: 'BackgroundLibrary' };
            return u;
        }));
    }
    
    toast.info('Background selected. Click "Save Progress" to confirm.');
  }, [images]);

  const uploadOrReplaceImage = useCallback(
    async (
      mode: 'upload' | 'replace',
      category: 'Logo' | 'Background' | 'Gallery',
      file: File | null,
      replaceId: string | null,
      logoUrl: string | null
    ) => {
      if (!file) return toast.error('Please select an image file');
      if (file.size > 5 * 1024 * 1024) return toast.error('File size exceeds 5MB limit');

      let finalTargetType: 'Logo' | 'Background' | 'Gallery' | 'BackgroundLibrary' = category;
      if (category === 'Background') {
        const hasActiveBg = images.some((i) => i.name === 'Background' || i.isBackgroundImage);
        if (hasActiveBg) {
          finalTargetType = 'BackgroundLibrary';
        }
      }

      const tempId = `temp-${Date.now()}`;
      const tempUrl = createManagedBlobUrl(file);

      const newImg: ULBImage = {
        id: tempId,
        url: tempUrl,
        name: finalTargetType,
        size: file.size,
        isBackgroundImage: finalTargetType === 'Background',
        uploadedDate: new Date().toISOString(),
        documentId: undefined,
      };

      if (mode === 'upload') {
        let prevBgId: string | null = null;
        if (finalTargetType === 'Background') {
          const prevBg = images.find((i) => i.name === 'Background' || i.isBackgroundImage);
          if (prevBg) prevBgId = prevBg.id;
        }

        setImages((prev) =>
          prev
            .map((i) => (i.id === prevBgId ? { ...i, name: 'BackgroundLibrary', isBackgroundImage: false } : i))
            .concat(newImg)
        );
        
        if (prevBgId && prevBgId.startsWith('temp-')) {
             setPendingUploads(prev => prev.map(u => u.tempId === prevBgId ? { ...u, category: 'BackgroundLibrary' } : u));
        }

        setPendingUploads((prev) => [
          ...prev,
          { tempId, mode: 'upload', category: finalTargetType, file, replaceId: null },
        ]);

        if (category === 'Logo' && !logoUrl) {
          onLogoChange(tempUrl);
        }
      } else {
        if (!replaceId) return toast.error('Replace target missing');
        
        if (replaceId.startsWith('temp-')) {
           // Replacing an already pending upload -> revoke previous blob URL
           setImages((prev) =>
              prev.map((i) => {
                if (i.id === replaceId) {
                  if (i.url.startsWith('blob:')) revokeBlobUrl(i.url);
                  return { ...i, url: tempUrl, size: file.size };
                }
                return i;
              })
           );
           setPendingUploads((prev) =>
              prev.map((u) => (u.tempId === replaceId ? { ...u, file } : u))
           );
        } else {
           // Replacing a real server image
           setImages((prev) =>
              prev.map((i) => {
                if (i.id === replaceId) {
                  if (i.url.startsWith('blob:')) revokeBlobUrl(i.url);
                  return { ...i, url: tempUrl, name: finalTargetType, size: file.size, isBackgroundImage: finalTargetType === 'Background' };
                }
                return i;
              })
           );
           setPendingUploads((prev) => [
              ...prev,
              { tempId: replaceId, mode: 'replace', category: finalTargetType, file, replaceId },
           ]);
        }

        if (category === 'Logo') {
          onLogoChange(tempUrl);
        }
      }

      toast.info('Image added locally. Click "Save Progress" to confirm.');
    },
    [createManagedBlobUrl, images, onLogoChange, revokeBlobUrl]
  );

  const commitImageChanges = useCallback(async () => {
    if (!hasPendingImageChanges) return true;
    setIsUploading(true);
    const toastId = toast.loading('Saving images to server...');

    try {
      // 1. Process deletions first
      for (const id of pendingDeletions) {
        await deleteUlbImageAction(Number(id));
      }

      // 2. Process uploads & replaces
      for (const upload of pendingUploads) {
        const formData = new FormData();
        formData.append('File', upload.file);
        formData.append('ImageType', upload.category);

        if (upload.mode === 'upload') {
          const res = await uploadUlbImageAction(formData);
          if (!res.success) throw new Error(res.error || 'Upload failed');
        } else if (upload.mode === 'replace' && upload.replaceId) {
          const res = await replaceUlbImageAction(Number(upload.replaceId), formData);
          if (!res.success || !res.data) throw new Error(res.error || 'Replace failed');
          await updateUlbImageTypeAction(Number(upload.replaceId), upload.category, res.data.documentId);
        }
      }
      
      // 3. Process category changes (e.g. set as background) for existing images
      const existingImages = images.filter(img => !img.id.startsWith('temp-') && !pendingUploads.some(u => u.replaceId === img.id));
      for (const img of existingImages) {
          const original = originalImages.find(o => String(o.id ?? (o as UlbImageMasterDto & { ulbImageMasterId?: number }).ulbImageMasterId) === img.id);
          if (original && original.imageType !== img.name && img.documentId) {
              await updateUlbImageTypeAction(Number(img.id), img.name, img.documentId);
          }
      }

      toast.success('All images saved successfully', { id: toastId });
      setPendingUploads([]);
      setPendingDeletions([]);
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save images';
      toast.error(message, { id: toastId });
      return false;
    } finally {
      setIsUploading(false);
    }
  }, [hasPendingImageChanges, pendingDeletions, pendingUploads, images, originalImages]);

  return { images, isUploading, hasPendingImageChanges, deleteImage, setAsBackground, uploadOrReplaceImage, commitImageChanges };
}
