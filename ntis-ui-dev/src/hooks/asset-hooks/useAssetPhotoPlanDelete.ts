import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { deleteAssetPhotoAction } from '@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions/asset-photos.actions';
import { patchCategory } from '@/lib/utils/asset-utils/asset-photo-plan-localization';
import type { AdditionalImage } from '@/types/asset/media.types';
import type { UsePhotoPlanDeleteProps } from '@/types/asset/municipal-Asset/new-add-new-asset';

export function usePhotoPlanDelete({
  propertyId,
  categories,
  onCategoriesChange,
  selectedCategoryIndex,
  selectedImageIndex,
  viewMode,
  setViewerIndexAndModeValue,
  locale: _locale,
  t,
  onFileUnstaged,
  onDbPhotoRemoved,
}: UsePhotoPlanDeleteProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const activeCategory = categories[selectedCategoryIndex];

  const handleDeletePhoto = useCallback(async (indexToDelete: number) => {
    if (!activeCategory) return;
    const imgToDelete = activeCategory.images[indexToDelete];
    const targetDbId = imgToDelete?.propertyPhotoId;

    if (targetDbId && targetDbId < 1000000000000) {
      if (propertyId && propertyId > 0) {
        setIsDeleting(true);
        try {
          const res = await deleteAssetPhotoAction(targetDbId);
          if (!res.success) {
            toast.error(res.error || t('media.failedToDelete') || 'Failed to delete photo');
            setIsDeleting(false);
            return;
          }
          toast.success(t('media.photoDeletedSuccess') || 'Photo deleted successfully');
        } catch {
          toast.error(t('media.unexpectedError') || 'An unexpected error occurred.');
          setIsDeleting(false);
          return;
        } finally {
          setIsDeleting(false);
        }
      } else {
        toast.success(t('media.photoDeletedSuccess') || 'Photo removed locally');
      }
      if (onDbPhotoRemoved) {
        onDbPhotoRemoved(targetDbId);
      }
    } else {
      toast.success(t('media.photoDeletedSuccess') || 'Staged photo deleted');
      if (onFileUnstaged && imgToDelete.file) {
        onFileUnstaged(activeCategory.photoTypeCode, imgToDelete.file);
      }
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
  }, [activeCategory, categories, selectedCategoryIndex, onCategoriesChange, propertyId, selectedImageIndex, viewMode, setViewerIndexAndModeValue, t, onFileUnstaged, onDbPhotoRemoved]);

  return { isDeleting, handleDeletePhoto };
}

