import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { deletePropertyPhotoAction } from '@/app/[locale]/property-tax/ptis/PhotoPlan.action';
import type { PhotoCategory } from '@/components/modules/property-tax/ptis/media/PhotoPlanSidebar';
import { patchCategory } from '@/lib/utils/ptis-photo-plan-localization';
import type { AdditionalImage } from '@/components/modules/property-tax/ptis/media/MediaImageCards';
import { clearDocumentCacheEntry } from '@/components/modules/property-tax/ptis/media/ImageWithFallback';

interface UsePhotoPlanDeleteProps {
  propertyId?: number;
  categories: PhotoCategory[];
  onCategoriesChange: (categories: PhotoCategory[]) => void;
  selectedCategoryIndex: number;
  selectedImageIndex: number | null;
  viewMode: 'grid' | 'viewer' | 'compare';
  setViewerIndexAndModeValue: (idx: number | null, mode: 'grid' | 'viewer' | 'compare') => void;
  locale: string;
  t: (key: string) => string;
  onMutationSuccess?: (
    photoTypeCode?: string,
    categoryName?: string,
    isDeleted?: boolean,
    newPrimaryDocGuid?: string,
    newPrimaryPhotoUrl?: string
  ) => void;
}

export function usePhotoPlanDelete({
  propertyId,
  categories,
  onCategoriesChange,
  selectedCategoryIndex,
  selectedImageIndex,
  viewMode,
  setViewerIndexAndModeValue,
  locale,
  t,
  onMutationSuccess,
}: UsePhotoPlanDeleteProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const currentPropertyIdRef = useRef(propertyId);
  useEffect(() => {
    currentPropertyIdRef.current = propertyId;
  }, [propertyId]);

  const activeCategory = categories[selectedCategoryIndex];

  const handleDeletePhoto = useCallback(async (indexToDelete: number) => {
    if (!activeCategory) return;
    const imgToDelete = activeCategory.images[indexToDelete];
    if (imgToDelete) {
      const rawGuid = imgToDelete.documentGuid || (() => {
        const match = imgToDelete.src?.match(/\/documents\/([a-fA-F0-9-]{36})/);
        return match ? match[1] : '';
      })();

      const isPlaceholderOrLocal =
        !rawGuid ||
        rawGuid.startsWith('temp-') ||
        imgToDelete.src?.startsWith('data:') ||
        imgToDelete.src?.startsWith('blob:') ||
        imgToDelete.src?.includes('/images/');

      const targetPropertyId = propertyId;
      if (propertyId && !isPlaceholderOrLocal) {
        setIsDeleting(true);
        try {
          const res = await deletePropertyPhotoAction(rawGuid, locale);
          if (!res.success) {
            toast.error(res.error || t('media.failedToDelete') || 'Failed to delete photo');
            setIsDeleting(false);
            return;
          }
        } catch {
          toast.error(t('media.unexpectedError') || 'An unexpected error occurred.');
          setIsDeleting(false);
          return;
        }
      }

      clearDocumentCacheEntry(imgToDelete.src);
      if (imgToDelete.documentGuid) clearDocumentCacheEntry(imgToDelete.documentGuid);

      const isStillActive = targetPropertyId ? currentPropertyIdRef.current === targetPropertyId : true;
      if (isStillActive) {
        const updatedImages = activeCategory.images.filter((_: AdditionalImage, idx: number) => idx !== indexToDelete);
        const patchedCats = patchCategory(categories, selectedCategoryIndex, updatedImages);
        onCategoriesChange(patchedCats);

        const hasRemaining = updatedImages.length > 0;
        const firstRemaining = hasRemaining ? updatedImages[0] : null;

        onMutationSuccess?.(
          activeCategory.photoTypeCode,
          activeCategory.photoTypeName,
          !hasRemaining,
          firstRemaining?.documentGuid,
          firstRemaining?.src || firstRemaining?.fullSrc
        );

        if (updatedImages.length === 0) {
          setViewerIndexAndModeValue(null, 'grid');
        } else if (selectedImageIndex === indexToDelete) {
          setViewerIndexAndModeValue(Math.min(indexToDelete, updatedImages.length - 1), 'viewer');
        } else if (selectedImageIndex !== null && selectedImageIndex > indexToDelete) {
          setViewerIndexAndModeValue(selectedImageIndex - 1, viewMode);
        }

        toast.success(t('media.photoDeletedSuccess') || 'Photo deleted successfully');
      }
      setIsDeleting(false);
      return;
    }

    const updatedImages = activeCategory.images.filter((_: AdditionalImage, idx: number) => idx !== indexToDelete);
    onCategoriesChange(patchCategory(categories, selectedCategoryIndex, updatedImages));
    if (updatedImages.length === 0) {
      setViewerIndexAndModeValue(null, 'grid');
    } else if (selectedImageIndex === indexToDelete) {
      setViewerIndexAndModeValue(Math.min(indexToDelete, updatedImages.length - 1), 'viewer');
    } else if (selectedImageIndex !== null && selectedImageIndex > indexToDelete) {
      setViewerIndexAndModeValue(selectedImageIndex - 1, viewMode);
    }
  }, [activeCategory, categories, selectedCategoryIndex, onCategoriesChange, propertyId, selectedImageIndex, viewMode, setViewerIndexAndModeValue, t, locale, onMutationSuccess]);

  return { isDeleting, handleDeletePhoto };
}
