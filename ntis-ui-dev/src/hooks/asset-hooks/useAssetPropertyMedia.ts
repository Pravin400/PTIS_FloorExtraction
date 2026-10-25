import { useState, useCallback, useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl';
import type { PropertyPhotoTypeWithStatusDto, PropertyPhotoDto } from '@/types/photoplan.types';
import type { PhotoCategory, AdditionalImage } from '@/types/asset/media.types';
import { mapSlotsToCategories, findCategory } from '@/lib/utils/asset-utils/new-add-new-asset/basic-info/mediaData.utils';
import type { UsePropertyMediaProps } from '@/types/asset/municipal-Asset/new-add-new-asset';

const DEFAULT_EMPTY_SLOTS: PropertyPhotoTypeWithStatusDto[] = [];
const DEFAULT_EMPTY_PHOTOS: PropertyPhotoDto[] = [];

function areArraysEqual<T>(a?: T[], b?: T[]): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function useAssetPropertyMedia({
  initialPhotoSlots = DEFAULT_EMPTY_SLOTS,
  initialPhotos = DEFAULT_EMPTY_PHOTOS,
  propertyId,
}: UsePropertyMediaProps) {
  const t = useTranslations('newAddNewAsset');
  const [showMoreImages, setShowMoreImages] = useState(false);
  const [hoverPreview, setHoverPreview] = useState<{ src: string; src2?: string; title: string } | null>(null);
  const [photos, setPhotos] = useState<PropertyPhotoDto[]>(initialPhotos);
  const [prevInitialPhotos, setPrevInitialPhotos] = useState<PropertyPhotoDto[]>(initialPhotos);
  const [fullyLoadedIds, setFullyLoadedIds] = useState<Set<number>>(() => new Set());
  const [prevInitialPhotoSlots, setPrevInitialPhotoSlots] = useState<PropertyPhotoTypeWithStatusDto[]>(initialPhotoSlots);

  if (!areArraysEqual(initialPhotos, prevInitialPhotos)) {
    setPhotos(initialPhotos);
    setPrevInitialPhotos(initialPhotos);
  }

  if (!areArraysEqual(initialPhotoSlots, prevInitialPhotoSlots)) {
    setFullyLoadedIds(new Set());
    setPrevInitialPhotoSlots(initialPhotoSlots);
  }

  const tForm = useTranslations('addAssetForm');

  const categories = useMemo(
    () => mapSlotsToCategories(initialPhotoSlots, photos, fullyLoadedIds, t, tForm),
    [initialPhotoSlots, photos, fullyLoadedIds, t, tForm]
  );

  const handleCategoriesChange = useCallback((newCats: PhotoCategory[]) => {
    const updated: PropertyPhotoDto[] = [];
    newCats.forEach((c: PhotoCategory) => (c.images || []).forEach((img: AdditionalImage) => {
      if (img.propertyPhotoId && img.hasPhoto) {
        updated.push({
          propertyPhotoId: img.propertyPhotoId,
          propertyId: propertyId || 0,
          photoTypeId: img.photoTypeId || 0,
          photoTypeCode: img.photoTypeCode || '',
          photoTypeName: c.photoTypeName,
          displayOrder: img.displayOrder,
          remarks: img.remarks ? `${img.title} | ${img.remarks}` : img.title,
          viewUrl: img.src,
        });
      }
    }));
    setPhotos(updated);
  }, [propertyId]);

  const [photoPlanCategory, propertyPhotoCategory] = useMemo(() => [
    findCategory(categories, ['PHOTO_PLAN'], ['photo plan', 'plan']),
    findCategory(categories, ['ASSET_PHOTO', 'ASSET', 'PROPERTY_PHOTO', 'PROPERTY'], ['asset photo', 'asset', 'property photo', 'property']),
  ], [categories]);

  const gisCategory = useMemo(() =>
    findCategory(categories, ['GIS'], ['gis', 'satellite view']),
    [categories]
  );

  const gisPhoto = useMemo(() => {
    const photo = gisCategory?.images?.[0];
    const srcUrl = photo?.src || photo?.fullSrc || '/gis_static.png';
    return {
      src: srcUrl,
      fullSrc: srcUrl,
      alt: photo?.alt || photo?.title || gisCategory?.photoTypeName || (t.has?.('media.satelliteView') ? t('media.satelliteView') : 'GIS / Satellite View'),
      title: photo?.title || gisCategory?.photoTypeName || (t.has?.('media.satelliteView') ? t('media.satelliteView') : 'GIS / Satellite View'),
      photoTypeId: photo?.photoTypeId || gisCategory?.photoTypeId || 0,
      photoTypeCode: photo?.photoTypeCode || gisCategory?.photoTypeCode || 'GIS',
      propertyPhotoId: photo?.propertyPhotoId,
    };
  }, [gisCategory, t]);

  const photoPlanPhoto = photoPlanCategory?.images[0];
  const propertyPhoto = propertyPhotoCategory?.images[0];

  const remainingCategories = useMemo(() => {
    return categories.filter((c: PhotoCategory) => {
      const code = c.photoTypeCode?.toUpperCase() || '';
      if (code === 'FLOOR' || code === 'GIS' || code === 'CHANGE_DETECTION') return false;
      if (propertyPhotoCategory && c.photoTypeId === propertyPhotoCategory.photoTypeId) return false;
      if (photoPlanCategory && c.photoTypeId === photoPlanCategory.photoTypeId) return false;
      return true;
    });
  }, [categories, propertyPhotoCategory, photoPlanCategory]);

  const remainingImages = useMemo(() => {
    const all = categories.flatMap((c: PhotoCategory) => c.images || []);
    return all.filter((img: AdditionalImage) => {
      const code = img.photoTypeCode?.toUpperCase() || '';
      if (code === 'FLOOR' || code === 'GIS' || code === 'CHANGE_DETECTION') return false;
      if (propertyPhoto && img.propertyPhotoId === propertyPhoto.propertyPhotoId) return false;
      if (photoPlanPhoto && img.propertyPhotoId === photoPlanPhoto.propertyPhotoId) return false;
      return true;
    });
  }, [categories, propertyPhoto, photoPlanPhoto]);

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleImageHover = useCallback((src: string, title: string, src2?: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoverPreview({ src, src2, title });
  }, []);

  const handleImageLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoverPreview(null);
      hoverTimeoutRef.current = null;
    }, 150);
  }, []);

  const cancelImageLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  return {
    showMoreImages,
    setShowMoreImages,
    hoverPreview,
    photos,
    setPhotos,
    fullyLoadedIds,
    setFullyLoadedIds,
    categories,
    remainingCategories,
    handleCategoriesChange,
    photoPlanCategory,
    propertyPhotoCategory,
    gisCategory,
    gisPhoto,
    photoPlanPhoto,
    propertyPhoto,
    remainingImages,
    handleImageHover,
    handleImageLeave,
    cancelImageLeave,
    t,
  };
}

// Aliases for unified usage
export const usePropertyMedia = useAssetPropertyMedia;
export const useNAAssetPropertyMedia = useAssetPropertyMedia;

