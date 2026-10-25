import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';
import { usePhotoPlanDelete } from './useAssetPhotoPlanDelete';
import { usePhotoPlanReplaceMutation } from './useAssetPhotoPlanReplaceMutation';
import type { AdditionalImage } from '@/types/asset/media.types';
import {
  getEnglishCategoryName,
  patchCategory,
  sortByOrder,
} from '@/lib/utils/asset-utils/asset-photo-plan-localization';
import type { UsePhotoPlanMutationsProps } from '@/types/asset/municipal-Asset/new-add-new-asset';

export function usePhotoPlanMutations({
  propertyId, categories, onCategoriesChange,
  selectedCategoryIndex, selectedImageIndex, viewMode,
  setSelectedImageIndex, setViewMode,
  setViewerIndexAndMode, onFileStaged, onFileUnstaged, onFileReplaced, onDbPhotoRemoved
}: UsePhotoPlanMutationsProps) {
  const t = useTranslations('newAddNewAsset');
  const locale = useLocale();
  const [isNamingOpen, setIsNamingOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const setViewerIndexAndModeValue = useCallback((idx: number | null, mode: 'grid' | 'viewer' | 'compare') => {
    if (setViewerIndexAndMode) setViewerIndexAndMode(idx, mode);
    else {
      setSelectedImageIndex?.(idx);
      setViewMode?.(mode);
    }
  }, [setViewerIndexAndMode, setSelectedImageIndex, setViewMode]);

  const activeCategory = categories[selectedCategoryIndex];

  const { isDeleting, handleDeletePhoto } = usePhotoPlanDelete({
    propertyId,
    categories,
    onCategoriesChange,
    selectedCategoryIndex,
    selectedImageIndex,
    viewMode,
    setViewerIndexAndModeValue,
    locale,
    t,
    onFileUnstaged,
    onDbPhotoRemoved,
  });

  const {
    isReplacing, isReplacement, setIsReplacement, activeIndexToReplace,
    handleReplacePhoto: handleReplacePhotoBase, executeReplaceApi, handleSaveEditedPhoto,
  } = usePhotoPlanReplaceMutation({
    categories, onCategoriesChange, selectedCategoryIndex, activeCategory, t,
    setViewerIndexAndModeValue, onFileStaged, onFileUnstaged, onFileReplaced, onDbPhotoRemoved,
    isUploading: isAdding || isDeleting,
  });

  const handleAddPhoto = useCallback(() => {
    setIsReplacement(false);
    setIsNamingOpen(true);
  }, [setIsReplacement]);

  const handleReplacePhoto = useCallback((index: number) => {
    handleReplacePhotoBase(index);
    setIsNamingOpen(true);
  }, [handleReplacePhotoBase]);

  const [uploadSuccessModal, setUploadSuccessModal] = useState<{
    photoName: string;
    categoryName: string;
    imgSrc?: string;
    isReplacement?: boolean;
  } | null>(null);

  const closeUploadSuccessModal = useCallback(() => {
    setUploadSuccessModal(null);
  }, []);

  const handleNamingSubmit = useCallback(async (
    name: string, displayOrder: number, photoTypeId: number, file?: File, remarks?: string,
  ) => {
    const uploading = isAdding || isReplacing || isDeleting;
    if (uploading || !activeCategory) return;
    if (!file) return toast.error(t('media.fileRequired') || 'Photo file is required');

    if (isReplacement) {
      if (activeIndexToReplace === null) return;
      const targetImg = activeCategory.images[activeIndexToReplace];
      const propertyPhotoId = targetImg?.propertyPhotoId ?? 0;
      const success = await executeReplaceApi(propertyPhotoId, file, {
        ...targetImg,
        title: name,
        remarks: remarks || '',
      }, activeIndexToReplace);
      if (success) {
        setIsNamingOpen(false);
        setUploadSuccessModal({
          photoName: name,
          categoryName: activeCategory.photoTypeName,
          imgSrc: targetImg?.src || '',
          isReplacement: true,
        });
      }
      return;
    }

    setIsAdding(true);
    const isDefaultName = name.trim() === activeCategory.photoTypeName;
    const englishName = isDefaultName ? getEnglishCategoryName(activeCategory.photoTypeCode, name.trim()) : name.trim();
    const combinedRemarks = remarks ? `${englishName} | ${remarks}` : englishName;

    try {
      const fileToSave = file;
      Object.assign(fileToSave, {
        displayOrder,
        remarks: combinedRemarks,
        photoTypeId,
      });

      const url = URL.createObjectURL(fileToSave);
      const tempId = Date.now();
      const newImg: AdditionalImage = {
        src: url, fullSrc: url, alt: name, title: name,
        photoTypeId, propertyPhotoId: tempId,
        photoTypeCode: activeCategory.photoTypeCode,
        hasPhoto: true, remarks: remarks || '', displayOrder, file: fileToSave
      };
      const updatedImages = sortByOrder([...activeCategory.images, newImg]);
      onCategoriesChange(patchCategory(categories, selectedCategoryIndex, updatedImages));
      setViewerIndexAndModeValue(updatedImages.length - 1, 'viewer');
      if (onFileStaged) {
        onFileStaged(activeCategory.photoTypeCode, fileToSave);
      }
      setUploadSuccessModal({
        photoName: name,
        categoryName: activeCategory.photoTypeName,
        imgSrc: url,
        isReplacement: false,
      });
    } catch {
      toast.error(t('media.unexpectedError') || 'An unexpected error occurred.');
    } finally {
      setIsAdding(false);
    }
    setIsNamingOpen(false);
  }, [isAdding, isReplacing, isDeleting, activeCategory, isReplacement, activeIndexToReplace, executeReplaceApi, t, categories, selectedCategoryIndex, onCategoriesChange, setViewerIndexAndModeValue, onFileStaged]);

  const replaceImage = activeIndexToReplace !== null ? activeCategory?.images[activeIndexToReplace] : null;

  return {
    isNamingOpen, setIsNamingOpen, isUploading: isAdding || isReplacing || isDeleting,
    isReplacement,
    isAdding, isReplacing, isDeleting,
    handleAddPhoto, handleReplacePhoto,
    handleNamingSubmit, handleDeletePhoto,
    handleSaveEditedPhoto,
    replaceImage,
    uploadSuccessModal,
    closeUploadSuccessModal,
  };
}

