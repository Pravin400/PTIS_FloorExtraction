'use client';

import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useNAAssetForm } from '@/components/modules/assets/municipal-Asset/NewAddNewAsset/NAAssetFormContext';
import { useAssetPropertyMedia } from '@/hooks/asset-hooks/useAssetPropertyMedia';
import { useMediaDrawerState } from '@/hooks/ptis/photoplan/useMediaDrawerState';
import { buildInitialPhotoSlots, buildInitialPhotos } from '@/lib/utils/asset-utils/media-utils';
import type { NAAssetMediaProps } from '@/types/asset/municipal-Asset/new-add-new-asset';
import type { PropertyPhotoTypeWithStatusDto, PropertyPhotoDto, AdditionalImage } from '@/types/asset/media.types';

export function useNAAssetMediaState({
  initialPhotoTypes = [],
  initialDbPhotos = [],
  initialPhotoSlots: propPhotoSlots,
  initialPhotos: propPhotos,
  onFileStaged: propFileStaged,
  onFileUnstaged: propFileUnstaged,
  onFileReplaced: propFileReplaced,
  onDbPhotoRemoved: propDbPhotoRemoved,
}: NAAssetMediaProps) {
  const t = useTranslations('newAddNewAsset');
  const {
    formData,
    basicInfoFiles,
    setBasicInfoFiles,
    extraBasicInfoFiles: extraFiles = {},
    setExtraBasicInfoFiles: setExtraFiles,
  } = useNAAssetForm();

  const assetId = formData.id ?? 0;

  // Local state initialized directly with pre-rendered server props (Full SSR)
  const [availableTypes] = useState<PropertyPhotoTypeWithStatusDto[]>(initialPhotoTypes);
  const [existingDbPhotos, setExistingDbPhotos] = useState<PropertyPhotoDto[]>(initialDbPhotos);

  // Dynamic drawer parameter visibility state
  const { isDrawerOpen, drawerInitialCategoryIndex, openDrawer, closeDrawer } = useMediaDrawerState();
  const searchParams = useSearchParams();
  const drawer = searchParams.get('drawer');
  const catIdxStr = searchParams.get('photoCategoryIndex');

  // Track currently active index category dynamically from drawer selection
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number>(0);
  const [selectedThumbIndex, setSelectedThumbIndex] = useState(0);

  // Derive active index category dynamically from drawer selection or local state
  const parsedCatIdx = useMemo(() => {
    if (drawer === 'photo-plan' && catIdxStr) {
      const parsed = parseInt(catIdxStr, 10);
      if (!isNaN(parsed)) return parsed;
    }
    return null;
  }, [drawer, catIdxStr]);

  const currentCategoryIndex = parsedCatIdx !== null ? parsedCatIdx : activeCategoryIndex;

  // Normalize extraFiles from ExtraBasicInfoFileItem[] to File[]
  const normalizedExtraFiles = useMemo(() => {
    const result: Record<string, File[]> = {};
    if (!extraFiles) return result;
    Object.entries(extraFiles).forEach(([key, items]) => {
      if (Array.isArray(items)) {
        result[key] = items
          .map((item) => (item instanceof File ? item : item?.file))
          .filter((f): f is File => f instanceof File);
      }
    });
    return result;
  }, [extraFiles]);

  // Map file upload slots dynamically strictly from DB photos and locally uploaded files
  const initialPhotoSlots = useMemo(() => {
    if (propPhotoSlots && propPhotoSlots.length > 0) return propPhotoSlots;
    return buildInitialPhotoSlots(availableTypes, existingDbPhotos, null, null, basicInfoFiles, normalizedExtraFiles);
  }, [propPhotoSlots, availableTypes, existingDbPhotos, basicInfoFiles, normalizedExtraFiles]);

  const initialPhotos = useMemo(() => {
    if (propPhotos && propPhotos.length > 0) return propPhotos;
    return buildInitialPhotos(availableTypes, existingDbPhotos, assetId, null, null, basicInfoFiles, normalizedExtraFiles);
  }, [propPhotos, availableTypes, existingDbPhotos, assetId, basicInfoFiles, normalizedExtraFiles]);

  // Extract core structures from unified useAssetPropertyMedia
  const {
    categories,
    photoPlanCategory,
    propertyPhotoCategory,
    handleCategoriesChange,
    handleImageHover,
    handleImageLeave,
    cancelImageLeave,
    hoverPreview,
    fullyLoadedIds,
    setFullyLoadedIds,
  } = useAssetPropertyMedia({ initialPhotoSlots, initialPhotos, propertyId: assetId });

  // Derive default Asset Photo category index for drawer opening when no photo is selected
  const defaultAssetCategoryIndex = useMemo(() => {
    if (propertyPhotoCategory) {
      const idx = categories.indexOf(propertyPhotoCategory);
      if (idx !== -1) return idx;
    }
    return currentCategoryIndex;
  }, [categories, propertyPhotoCategory, currentCategoryIndex]);

  // Derive all uploaded images across all categories (excluding Plan/Drawings, GIS, Change Detection, Floor)
  const allUploadedImages = useMemo(() => {
    const list: Array<AdditionalImage & { categoryIndex: number; categoryName: string; imageIndex: number }> = [];
    categories.forEach((cat, catIdx) => {
      const code = cat.photoTypeCode?.toUpperCase() || '';
      const name = cat.photoTypeName?.toLowerCase() || '';
      if (
        (photoPlanCategory && cat.photoTypeId === photoPlanCategory.photoTypeId) ||
        code.includes('PLAN') ||
        name.includes('plan') ||
        code === 'GIS' ||
        code === 'CHANGE_DETECTION' ||
        code === 'FLOOR'
      ) {
        return;
      }
      if (cat.images) {
        cat.images.forEach((img, imgIdx) => {
          if (img.hasPhoto && img.src) {
            list.push({
              ...img,
              categoryIndex: catIdx,
              categoryName: cat.photoTypeName || 'Asset Photo',
              imageIndex: imgIdx,
            });
          }
        });
      }
    });
    return list;
  }, [categories, photoPlanCategory]);

  // Retrieve active selected image object based on safely bounded thumb index
  const safeThumbIndex = useMemo(() => {
    if (allUploadedImages.length === 0) return 0;
    return Math.min(Math.max(0, selectedThumbIndex), allUploadedImages.length - 1);
  }, [allUploadedImages.length, selectedThumbIndex]);

  const activePhoto = useMemo(() => {
    if (allUploadedImages.length === 0) return null;
    return allUploadedImages[safeThumbIndex] || allUploadedImages[0];
  }, [allUploadedImages, safeThumbIndex]);

  // Staged files handlers integrated directly into form provider context or delegated to props
  const handleFileStaged = useCallback((photoTypeCode: string, file: File) => {
    if (propFileStaged) {
      propFileStaged(photoTypeCode, file);
      return;
    }
    setExtraFiles?.((prev) => {
      const existing = (prev?.[photoTypeCode] as File[]) || [];
      if (existing.includes(file)) return prev;
      return {
        ...prev,
        [photoTypeCode]: [...existing, file],
      };
    });
  }, [propFileStaged, setExtraFiles]);

  const handleFileUnstaged = useCallback((photoTypeCode: string, fileOrIndex: File | number) => {
    if (propFileUnstaged) {
      propFileUnstaged(photoTypeCode, fileOrIndex);
      return;
    }
    setExtraFiles?.((prev) => {
      if (!prev?.[photoTypeCode]) return prev;
      const currentList: File[] = prev[photoTypeCode] as File[];
      if (typeof fileOrIndex === 'number') {
        return {
          ...prev,
          [photoTypeCode]: currentList.filter((_, i) => i !== fileOrIndex),
        };
      }
      return {
        ...prev,
        [photoTypeCode]: currentList.filter((f) => f !== fileOrIndex),
      };
    });
  }, [propFileUnstaged, setExtraFiles]);

  const handleFileReplaced = useCallback((
    photoTypeCode: string,
    newFile: File,
    oldFile?: File,
    targetImg?: AdditionalImage,
    index?: number
  ) => {
    if (propFileReplaced) {
      propFileReplaced(photoTypeCode, newFile, oldFile, targetImg, index);
      return;
    }
    const targetDbId = targetImg?.propertyPhotoId;
    const targetDocGuid = targetImg?.documentGuid;
    const targetSrc = targetImg?.src;
    const targetPhotoTypeId = targetImg?.photoTypeId;

    // 1. Remove old DB photo from existingDbPhotos if it was a DB photo
    setExistingDbPhotos((prev) =>
      prev.filter((p) => {
        if (targetDbId && p.propertyPhotoId === targetDbId) return false;
        if (targetDocGuid && p.documentGuid === targetDocGuid) return false;
        if (targetSrc && (p.viewUrl === targetSrc || p.downloadUrl === targetSrc)) return false;
        if (targetPhotoTypeId && p.photoTypeId === targetPhotoTypeId && (!p.displayOrder || p.displayOrder === targetImg?.displayOrder)) return false;
        return true;
      })
    );

    // 2. If it was in basicInfoFiles or a front/plan category, replace it
    const isFront = photoTypeCode === 'PROPERTY_PHOTO' || photoTypeCode === 'PROPERTY';
    const isPlan = photoTypeCode === 'PHOTO_PLAN' || photoTypeCode === 'PLAN';

    if (isFront) {
      setBasicInfoFiles?.((prev) => ({ ...prev, frontPhoto: newFile }));
    }

    if (isPlan) {
      setBasicInfoFiles?.((prev) => ({ ...prev, buildingPlan: newFile }));
    }

    // 3. Update extraBasicInfoFiles
    setExtraFiles?.((prev) => {
      const currentList: File[] = (prev?.[photoTypeCode] as File[]) || [];

      if (oldFile && currentList.includes(oldFile)) {
        return {
          ...prev,
          [photoTypeCode]: currentList.map((f) => (f === oldFile ? newFile : f)),
        };
      }

      const dbPhotosInCat = existingDbPhotos.filter(
        (p) => p.photoTypeCode === photoTypeCode || p.photoTypeId === targetPhotoTypeId
      );
      const stagedIndex =
        typeof index === 'number' && index >= dbPhotosInCat.length ? index - dbPhotosInCat.length : -1;

      if (stagedIndex >= 0 && stagedIndex < currentList.length) {
        const updated = [...currentList];
        updated[stagedIndex] = newFile;
        return {
          ...prev,
          [photoTypeCode]: updated,
        };
      }

      if (currentList.length === 0) {
        return {
          ...prev,
          [photoTypeCode]: [newFile],
        };
      }

      return {
        ...prev,
        [photoTypeCode]: [...currentList, newFile],
      };
    });
  }, [propFileReplaced, existingDbPhotos, setBasicInfoFiles, setExtraFiles]);

  const handleDbPhotoRemoved = useCallback((photoIdToRemove: number) => {
    if (propDbPhotoRemoved) {
      propDbPhotoRemoved(photoIdToRemove);
    }
    setExistingDbPhotos((prev) => prev.filter((p) => p.propertyPhotoId !== photoIdToRemove));
  }, [propDbPhotoRemoved]);

  const categoryLabel = activePhoto?.categoryName || propertyPhotoCategory?.photoTypeName || t('assetMedia.assetPhoto');

  // Plan section resolution (PHOTO_PLAN)
  const planImages = photoPlanCategory?.images || [];
  const [planPage, setPlanPage] = useState(0);
  const activePlan = planImages[planPage] || planImages[0] || null;
  const planLabel = photoPlanCategory?.photoTypeName || activePlan?.photoTypeName || activePlan?.title || t('assetMedia.assetPhotoPlan');

  return {
    t,
    assetId,
    categories,
    photoPlanCategory,
    propertyPhotoCategory,
    isDrawerOpen,
    drawerInitialCategoryIndex,
    openDrawer,
    closeDrawer,
    selectedThumbIndex,
    setSelectedThumbIndex,
    setActiveCategoryIndex,
    allUploadedImages,
    activePhoto,
    defaultAssetCategoryIndex,
    categoryLabel,
    planImages,
    planPage,
    setPlanPage,
    activePlan,
    planLabel,
    hoverPreview,
    handleImageHover,
    handleImageLeave,
    cancelImageLeave,
    fullyLoadedIds,
    setFullyLoadedIds,
    handleCategoriesChange,
    handleFileStaged,
    handleFileUnstaged,
    handleFileReplaced,
    handleDbPhotoRemoved,
  };
}
