'use client';

import { useState, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useConfirm } from '@/components/common';
import {
  uploadPropertyPhotoAction,
  replacePropertyPhotoAction,
  deletePropertyPhotoAction,
} from '@/app/[locale]/property-tax/ptis/PhotoPlan.action';
import { getViewDocumentUrl } from '@/lib/utils/document-utils';
import { clearDocumentCacheEntry } from '@/components/modules/property-tax/ptis/media/ImageWithFallback';
import type { PhotoCategory } from '@/components/modules/property-tax/ptis/media/PhotoPlanSidebar';
import type { AdditionalImage } from '@/components/modules/property-tax/ptis/media/MediaImageCards';

interface UseChangeDetectionUploadProps {
  activeCategory: PhotoCategory;
  propertyId?: number;
  onImagesChange: (newImages: AdditionalImage[]) => void;
}

export function useChangeDetectionUpload({
  activeCategory,
  propertyId,
  onImagesChange,
}: UseChangeDetectionUploadProps) {
  const t = useTranslations('ptis');
  const locale = useLocale();
  const { confirm } = useConfirm();
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadOrReplaceImage = useCallback(async (file: File, type: 'before' | 'after') => {
    if (isUploading) return;
    if (!propertyId) return toast.error(t('media.propertyIdRequired') || 'PropertyId is required.');

    const displayOrder = type === 'before' ? 1 : 2;
    const idx = activeCategory.images.findIndex(img => img.displayOrder === displayOrder);
    const existingImg = idx !== -1 ? activeCategory.images[idx] : null;
    const isCustom = !!existingImg?.hasPhoto;
    const name = type === 'before' ? 'OLD' : 'NEW';

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('File', file);
      formData.append('Remarks', name);

      if (isCustom && existingImg?.propertyPhotoId) {
        formData.append('PropertyId', propertyId.toString());
        formData.append('PhotoTypeId', activeCategory.photoTypeId.toString());
        formData.append('PhotoTypeCode', activeCategory.photoTypeCode || 'CHANGE_DETECTION');
        formData.append('PropertyPhotoId', existingImg.propertyPhotoId.toString());
        const oldDocumentGuid = existingImg.documentGuid || (() => {
          const match = existingImg.src.match(/\/documents\/([a-fA-F0-9-]{36})/);
          return match ? match[1] : '';
        })();

        const res = await replacePropertyPhotoAction(existingImg.propertyPhotoId, oldDocumentGuid, formData, locale);
        if (res.success && res.data) {
          clearDocumentCacheEntry(existingImg.src);
          const url = (res.data.documentGuid ? getViewDocumentUrl(res.data.documentGuid) : res.data.viewUrl) || '';
          onImagesChange(activeCategory.images.map((img, i) => i === idx ? { ...img, src: url, fullSrc: url, documentGuid: res.data?.documentGuid } : img));
          toast.success(t('media.photoReplacedSuccess') || 'Photo replaced successfully');
        } else {
          toast.error(res.error || t('media.failedToReplace') || 'Failed to replace photo');
        }
      } else {
        formData.append('PropertyId', propertyId.toString());
        formData.append('PhotoTypeId', activeCategory.photoTypeId.toString());
        formData.append('DisplayOrder', displayOrder.toString());
        formData.append('ReferenceTableIdGuid', crypto.randomUUID());
        const res = await uploadPropertyPhotoAction(formData, locale);
        if (res.success && res.data) {
          const url = (res.data.documentGuid ? getViewDocumentUrl(res.data.documentGuid) : res.data.viewUrl) || '';
          const newImg: AdditionalImage = {
            src: url, fullSrc: url, alt: name, title: name,
            photoTypeId: activeCategory.photoTypeId, propertyPhotoId: res.data.propertyPhotoId,
            photoTypeCode: activeCategory.photoTypeCode, hasPhoto: true, remarks: '', displayOrder,
            documentGuid: res.data.documentGuid,
          };
          onImagesChange(activeCategory.images.map(img => img.displayOrder === displayOrder ? newImg : img));
          toast.success(t('media.photoUploadedSuccess') || 'Photo uploaded successfully');
        } else {
          toast.error(res.error || t('media.failedToUpload') || 'Failed to upload photo');
        }
      }
    } catch {
      toast.error(t('media.unexpectedError') || 'An unexpected error occurred.');
    } finally {
      setIsUploading(false);
    }
  }, [isUploading, activeCategory, propertyId, locale, onImagesChange, t]);

  const handleDeleteImage = useCallback(async (type: 'before' | 'after') => {
    if (isUploading) return;
    const displayOrder = type === 'before' ? 1 : 2;
    const idx = activeCategory.images.findIndex(img => img.displayOrder === displayOrder);
    if (idx === -1) return;
    const img = activeCategory.images[idx];
    if (!img.hasPhoto) return;

    confirm({
      title: t('media.deleteImageTitle') || 'Delete Photo',
      description: t('media.deleteImageDescription', { name: img.title }) || `Are you sure you want to delete "${img.title}"?`,
        onConfirm: async () => {
          setIsUploading(true);
          try {
            const documentGuid = img.documentGuid || (() => {
              const match = img.src.match(/\/documents\/([a-fA-F0-9-]{36})/);
              return match ? match[1] : '';
            })();

            if (!documentGuid) {
              toast.error(t('media.failedToDelete') || 'Failed to delete photo: missing document GUID');
              setIsUploading(false);
              return;
            }

            const res = await deletePropertyPhotoAction(documentGuid, locale);
            if (res.success) {
            toast.success(t('media.photoDeletedSuccess') || 'Photo deleted successfully');
            const defaultImg: AdditionalImage = {
              src: '',
              fullSrc: '',
              alt: type === 'before' ? 'Before (Old)' : 'After (New)',
              title: type === 'before' ? 'Before (Old)' : 'After (New)',
              photoTypeId: activeCategory.photoTypeId, photoTypeCode: 'CHANGE_DETECTION',
              propertyPhotoId: type === 'before' ? 9998 : 9999, hasPhoto: false, displayOrder,
            };
            onImagesChange(activeCategory.images.map((item, i) => i === idx ? defaultImg : item));
          } else {
            toast.error(res.error || t('media.failedToDelete') || 'Failed to delete photo');
          }
        } catch {
          toast.error(t('media.unexpectedError') || 'An unexpected error occurred.');
        } finally {
          setIsUploading(false);
        }
      }
    });
  }, [isUploading, activeCategory, confirm, locale, onImagesChange, t]);

  return {
    isUploading,
    handleUploadOrReplaceImage,
    handleDeleteImage,
  };
}
