import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { clearDocumentCacheEntry } from '@/components/modules/assets/municipal-Asset/NewAddNewAsset/basic-info/media/ImageWithFallback';
import type { PhotoCategory, AdditionalImage } from '@/types/asset/media.types';
import { getEnglishCategoryName, patchCategory } from '@/lib/utils/asset-utils/asset-photo-plan-localization';

export interface UsePhotoPlanReplaceMutationProps {
  categories: PhotoCategory[];
  onCategoriesChange: (categories: PhotoCategory[]) => void;
  selectedCategoryIndex: number;
  activeCategory: PhotoCategory | undefined;
  t: (key: string) => string;
  setViewerIndexAndModeValue: (index: number | null, mode: 'grid' | 'viewer' | 'compare') => void;
  onFileStaged?: (photoTypeCode: string, file: File) => void;
  onFileUnstaged?: (photoTypeCode: string, file: File) => void;
  onFileReplaced?: (photoTypeCode: string, newFile: File, oldFile?: File, targetImg?: AdditionalImage, index?: number) => void;
  onDbPhotoRemoved?: (propertyPhotoId: number) => void;
  onPhotoReplaced?: (photoTypeCode: string, oldPropertyPhotoId: number | string | undefined, oldFile: File | undefined, newFile: File) => void;
  isUploading: boolean;
}

export function usePhotoPlanReplaceMutation({
  categories, onCategoriesChange, selectedCategoryIndex, activeCategory, t,
  setViewerIndexAndModeValue, onFileStaged, onFileUnstaged, onFileReplaced, onDbPhotoRemoved, onPhotoReplaced, isUploading,
}: UsePhotoPlanReplaceMutationProps) {
  const [isReplacing, setIsReplacing] = useState(false);
  const [isReplacement, setIsReplacement] = useState(false);
  const [activeIndexToReplace, setActiveIndexToReplace] = useState<number | null>(null);

  const handleReplacePhoto = useCallback((index: number) => {
    setActiveIndexToReplace(index);
    setIsReplacement(true);
  }, []);

  const executeReplaceApi = useCallback(async (
    _propertyPhotoId: number,
    file: File,
    targetImg: AdditionalImage,
    index: number
  ): Promise<boolean> => {
    setIsReplacing(true);
    const isDefaultName = targetImg.title === activeCategory?.photoTypeName;
    const englishTitle = isDefaultName ? getEnglishCategoryName(activeCategory.photoTypeCode, targetImg.title) : targetImg.title;
    const replaceRemarks = targetImg.remarks ? `${englishTitle} | ${targetImg.remarks}` : englishTitle;

    try {
      clearDocumentCacheEntry(targetImg.src);

      // Pure client-side staging
      const fileToSave = file;
      Object.assign(fileToSave, {
        displayOrder: targetImg.displayOrder || 1,
        remarks: replaceRemarks,
        photoTypeId: activeCategory?.photoTypeId || targetImg.photoTypeId,
      });

      // Update local state to immediately show the new image
      const url = URL.createObjectURL(fileToSave);
      const tempId = Date.now();
      const newImg: AdditionalImage = {
        ...targetImg,
        src: url, fullSrc: url,
        propertyPhotoId: tempId,
        file: fileToSave,
        remarks: replaceRemarks
      };

      const updatedImages = activeCategory!.images.map((img: AdditionalImage, i: number) => i === index ? newImg : img);
      onCategoriesChange(patchCategory(categories, selectedCategoryIndex, updatedImages));

      if (onFileReplaced) {
        onFileReplaced(
          activeCategory!.photoTypeCode,
          fileToSave,
          targetImg.file,
          targetImg,
          index
        );
      } else if (onPhotoReplaced) {
        onPhotoReplaced(
          activeCategory!.photoTypeCode,
          targetImg.propertyPhotoId,
          targetImg.file,
          fileToSave
        );
      } else {
        if (targetImg.propertyPhotoId && targetImg.propertyPhotoId < 1000000000000) {
          if (onDbPhotoRemoved) {
            onDbPhotoRemoved(targetImg.propertyPhotoId);
          }
        } else if (targetImg.propertyPhotoId && targetImg.propertyPhotoId >= 1000000000000 && targetImg.file) {
          if (onFileUnstaged) {
            onFileUnstaged(activeCategory!.photoTypeCode, targetImg.file);
          }
        }

        if (onFileStaged) {
          onFileStaged(activeCategory!.photoTypeCode, fileToSave);
        }
      }

      setViewerIndexAndModeValue(index, 'viewer');
      return true;
    } catch {
      toast.error(t('media.unexpectedError') || 'An unexpected error occurred.');
      return false;
    } finally {
      setIsReplacing(false);
    }
  }, [activeCategory, categories, selectedCategoryIndex, onCategoriesChange, t, setViewerIndexAndModeValue, onFileStaged, onDbPhotoRemoved, onFileUnstaged, onFileReplaced, onPhotoReplaced]);

  const handleSaveEditedPhoto = useCallback(async (index: number, file: File): Promise<boolean> => {
    if (isUploading || !activeCategory) return false;
    const targetImg = activeCategory.images[index];
    const propertyPhotoId = targetImg?.propertyPhotoId ?? 0;
    return executeReplaceApi(propertyPhotoId, file, targetImg, index);
  }, [activeCategory, isUploading, executeReplaceApi]);

  return {
    isReplacing,
    isReplacement,
    setIsReplacement,
    activeIndexToReplace,
    setActiveIndexToReplace,
    handleReplacePhoto,
    executeReplaceApi,
    handleSaveEditedPhoto,
  };
}
