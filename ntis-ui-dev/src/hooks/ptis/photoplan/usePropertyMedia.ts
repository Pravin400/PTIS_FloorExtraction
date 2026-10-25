'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams, usePathname } from 'next/navigation';
import type { PropertyPhotoTypeWithStatusDto, PropertyPhotoDto } from '@/types/photoplan.types';
import type { PhotoCategory } from '@/components/modules/property-tax/ptis/media/PhotoPlanSidebar';
import {
  mapSlotsToCategories,
  findCategory,
} from '@/components/modules/property-tax/ptis/media/mediaData';
import {
  areSlotsEqual,
  arePhotosEqual,
} from './usePropertyPhotosQuery';
import { useImageHoverPreview } from './useImageHoverPreview';
import { type WaybackRelease, DEFAULT_WAYBACK_RELEASES } from '@/lib/api/wayback.service';
import { extractCoordinates, getSatelliteTileUrl } from '@/lib/utils/coordinate-utils';
import {
  isPropertyFrontPhoto,
  isSocietyPhoto,
  getSocietyPhotoPriority,
} from '@/lib/utils/ptis-photo-match.utils';

export interface UsePropertyMediaProps {
  initialPhotoSlots?: PropertyPhotoTypeWithStatusDto[];
  initialPhotos?: PropertyPhotoDto[];
  propertyId?: number;
  initialLatitude?: number;
  initialLongitude?: number;
  initialWaybackReleases?: WaybackRelease[];
  onPhotosChange?: (photos: PropertyPhotoDto[]) => void;
  onPhotoSlotsChange?: (slots: PropertyPhotoTypeWithStatusDto[]) => void;
  wings?: unknown[];
  isMainProperty?: boolean;
  categoryId?: number | null;
  propertyTypeId?: number | null;
  propertyDescription?: string | null;
  partitionNo?: string | null;
  entityType?: string;
  isAmenity?: boolean;
  wingName?: string;
  wingDetailId?: number | null;
  societyDetailId?: number | null;
  societyPhotoFallbackGuid?: string;
  societyPhotoFallbackUrl?: string;
  societyLatitude?: number;
  societyLongitude?: number;
  isQuickDataEntry?: boolean;
}

export function usePropertyMedia({
  initialPhotoSlots = [],
  initialPhotos = [],
  propertyId,
  initialLatitude,
  initialLongitude,
  initialWaybackReleases = [],
  onPhotosChange,
  onPhotoSlotsChange,
  wings: _wings,
  wingName: propWingName,
  wingDetailId: propWingDetailId,
  societyDetailId: propSocietyDetailId,
  isMainProperty = false,
  categoryId = null,
  propertyTypeId = null,
  propertyDescription = null,
  partitionNo = null,
  entityType,
  isAmenity = false,
  societyPhotoFallbackGuid,
  societyPhotoFallbackUrl,
  societyLatitude,
  societyLongitude,
  isQuickDataEntry: propIsQuickDataEntry,
}: UsePropertyMediaProps) {
  const t = useTranslations('ptis');
  const pathname = usePathname();
  const isQdeRoute = Boolean(pathname && typeof pathname === 'string' && pathname.toLowerCase().includes('quickdataentry'));
  const effectiveIsQuickDataEntry = propIsQuickDataEntry !== undefined ? propIsQuickDataEntry : isQdeRoute;
  const [showMoreImages, setShowMoreImages] = useState(false);
  const { hoverPreview, handleImageHover, handleImageLeave, cancelImageLeave, resetHoverPreview } =
    useImageHoverPreview();
  const [photos, setPhotos] = useState<PropertyPhotoDto[]>(initialPhotos);
  const [photoSlots, setPhotoSlots] = useState<PropertyPhotoTypeWithStatusDto[]>(initialPhotoSlots);
  const [fullyLoadedIds, setFullyLoadedIds] = useState<Set<number>>(() => new Set());

  const [activeWingParams, setActiveWingParams] = useState<{
    wingId: number | null;
    wingDetailId: number | null;
    societyId: number | null;
    wingName?: string | null;
  } | null>(null);

  useEffect(() => {
    const handleParamsChange = (e: Event) => {
      const detail = (e as CustomEvent<Record<string, string | null>>).detail;
      if (!detail) return;
      const wId = detail.wingId ? Number(detail.wingId) : null;
      const wdId = detail.wingDetailId ? Number(detail.wingDetailId) : null;
      const sId = (detail.societyDetailId || detail.societyId) ? Number(detail.societyDetailId || detail.societyId) : null;
      const wName = detail.wingName ? String(detail.wingName) : null;
      setActiveWingParams({ wingId: wId, wingDetailId: wdId, societyId: sId, wingName: wName });
    };
    window.addEventListener('ptis:wing-params-changed', handleParamsChange);
    return () => window.removeEventListener('ptis:wing-params-changed', handleParamsChange);
  }, []);

  const searchParams = useSearchParams();
  const searchWingName = searchParams?.get('wingName') || searchParams?.get('wingname') || searchParams?.get('wingNo') || searchParams?.get('wingno');
  const selectedWingId = searchParams?.get('wingId');
  const rawWingDetailId = (searchParams?.get('wingDetailId') || searchParams?.get('wingdetailid'))
    ? Number(searchParams?.get('wingDetailId') || searchParams?.get('wingdetailid'))
    : null;

  const currentTargetWingDetailId =
    activeWingParams?.wingDetailId !== undefined
      ? activeWingParams.wingDetailId
      : (propWingDetailId ?? rawWingDetailId);

  const currentTargetWingId =
    activeWingParams?.wingId !== undefined
      ? activeWingParams.wingId
      : (selectedWingId ? Number(selectedWingId) : null);

  const currentTargetWingName =
    activeWingParams?.wingName !== undefined
      ? activeWingParams.wingName
      : (propWingName ?? searchWingName);

  const matchedWing = useMemo(() => {
    return (_wings as { wingDetailId?: number; wingMasterId?: number; wingName?: string; wingNo?: string }[] | undefined)?.find(
      (w) =>
        (currentTargetWingDetailId && w.wingDetailId === currentTargetWingDetailId) ||
        (currentTargetWingId && w.wingMasterId === currentTargetWingId) ||
        (currentTargetWingName && (
          (w.wingName && w.wingName.toLowerCase() === currentTargetWingName.toLowerCase()) ||
          (w.wingNo && w.wingNo.toLowerCase() === currentTargetWingName.toLowerCase()) ||
          (w.wingName && w.wingName.toLowerCase() === `wing ${currentTargetWingName.toLowerCase()}`) ||
          (w.wingName && w.wingName.toLowerCase() === `${currentTargetWingName.toLowerCase()} wing`)
        ))
    );
  }, [_wings, currentTargetWingDetailId, currentTargetWingId, currentTargetWingName]);

  const wingsList = _wings as { wingName?: string; wingNo?: string; wingDetailId?: number }[] | undefined;
  const firstWing = wingsList && wingsList.length > 0 ? wingsList[0] : undefined;
  const resolvedWingDetailId =
    currentTargetWingDetailId ??
    matchedWing?.wingDetailId ??
    (firstWing?.wingDetailId ?? null);

  const selectedWingName =
    (currentTargetWingName && currentTargetWingName.trim()) ||
    (matchedWing?.wingName && matchedWing.wingName.trim()) ||
    (matchedWing?.wingNo ? `${matchedWing.wingNo} Wing` : '') ||
    (firstWing ? (firstWing.wingName || (firstWing.wingNo ? `${firstWing.wingNo} Wing` : '')) : undefined);

  const [prevPropertyId, setPrevPropertyId] = useState(propertyId);
  const [prevInitialPhotos, setPrevInitialPhotos] = useState<PropertyPhotoDto[]>(initialPhotos);
  const [prevInitialPhotoSlots, setPrevInitialPhotoSlots] = useState<PropertyPhotoTypeWithStatusDto[]>(initialPhotoSlots);

  if (propertyId !== prevPropertyId) {
    setPrevPropertyId(propertyId);
    setPrevInitialPhotos(initialPhotos);
    setPrevInitialPhotoSlots(initialPhotoSlots);
    setFullyLoadedIds(new Set());
    setPhotos(initialPhotos);
    setPhotoSlots(initialPhotoSlots);
    resetHoverPreview();
  } else {
    if (!arePhotosEqual(initialPhotos, prevInitialPhotos)) {
      setPrevInitialPhotos(initialPhotos);
      setPhotos(initialPhotos);
      resetHoverPreview();
    }
    if (!areSlotsEqual(initialPhotoSlots, prevInitialPhotoSlots)) {
      setPrevInitialPhotoSlots(initialPhotoSlots);
      setFullyLoadedIds(new Set());
      setPhotoSlots(initialPhotoSlots);
    }
  }

  const loadPhotoSlotsOnDemand = useCallback(async () => {
    if (photoSlots.length > 0) return;
    try {
      const { getPropertyPhotoTypesByScopeAction } = await import(
        '@/app/[locale]/property-tax/ptis/PhotoPlanType.action'
      );
      const res = await getPropertyPhotoTypesByScopeAction('PROPERTY');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const dynamicSlots: PropertyPhotoTypeWithStatusDto[] = res.data
          .filter((st) => st.isActive !== false)
          .map((st) => ({
            photoTypeId: st.id,
            photoTypeCode: st.photoTypeCode,
            photoTypeName: st.photoTypeName,
            photoScope: st.photoScope || 'PROPERTY',
            displayOrder: st.displayOrder || 1,
            hasPhoto: false,
            photoCount: 0,
          }));
        setPhotoSlots((prev) => (prev.length === 0 ? dynamicSlots : prev));
      }
    } catch {
      // Ignore on-demand loading errors
    }
  }, [photoSlots.length]);

  useEffect(() => {
    if (propertyId && photoSlots.length === 0 && initialPhotoSlots.length === 0) {
      void Promise.resolve().then(() => {
        void loadPhotoSlotsOnDemand();
      });
    }
  }, [propertyId, photoSlots.length, initialPhotoSlots.length, loadPhotoSlotsOnDemand]);

  const isAmenityDetected =
    Boolean(isAmenity) ||
    categoryId === 140 ||
    propertyTypeId === 140 ||
    entityType === 'AMENITY' ||
    entityType === 'A' ||
    Boolean(
      propertyDescription && (
        propertyDescription.includes('अॅमिनीटी') ||
        propertyDescription.includes('अ‍ॅमिनीटी') ||
        propertyDescription.toLowerCase().includes('amenity')
      )
    ) ||
    Boolean(
      partitionNo && String(partitionNo).trim().toUpperCase().startsWith('AM')
    );

  const hasExplicitWing = Boolean(
    propWingDetailId ||
    rawWingDetailId ||
    selectedWingId ||
    searchWingName
  );

  const searchSocietyId = (searchParams?.get('societyDetailId') || searchParams?.get('societydetailid') || searchParams?.get('societyId') || searchParams?.get('societyid'))
    ? Number(searchParams.get('societyDetailId') || searchParams.get('societydetailid') || searchParams.get('societyId') || searchParams.get('societyid'))
    : null;
  const resolvedSocietyDetailId =
    propSocietyDetailId ??
    activeWingParams?.societyId ??
    searchSocietyId ??
    null;

  const isIndividualRoute = Boolean(
    (pathname && pathname.includes('/property-tax/ptis/individual')) ||
    categoryId === 2 ||
    entityType === 'INDIVIDUAL'
  );

  const categories = useMemo(
    () =>
      mapSlotsToCategories(
        photoSlots.length > 0 ? photoSlots : initialPhotoSlots,
        photos,
        fullyLoadedIds,
        t,
        selectedWingName,
        resolvedWingDetailId,
        isMainProperty,
        categoryId,
        propertyTypeId,
        entityType,
        isAmenityDetected,
        societyPhotoFallbackGuid,
        societyPhotoFallbackUrl,
        effectiveIsQuickDataEntry,
        partitionNo,
        hasExplicitWing,
        resolvedSocietyDetailId,
        isIndividualRoute
      ),
    [
      photoSlots,
      initialPhotoSlots,
      photos,
      fullyLoadedIds,
      t,
      selectedWingName,
      resolvedWingDetailId,
      isMainProperty,
      categoryId,
      propertyTypeId,
      entityType,
      isAmenityDetected,
      societyPhotoFallbackGuid,
      societyPhotoFallbackUrl,
      effectiveIsQuickDataEntry,
      partitionNo,
      hasExplicitWing,
      resolvedSocietyDetailId,
      isIndividualRoute,
    ]
  );

  const handleCategoriesChange = useCallback(
    (newCats: PhotoCategory[]) => {
      resetHoverPreview();
      const updated: PropertyPhotoDto[] = [];
      newCats.forEach((c) =>
        c.images.forEach((img) => {
          if ((img.propertyPhotoId !== undefined || img.documentGuid || img.src) && img.hasPhoto) {
            updated.push({
              propertyPhotoId: img.propertyPhotoId || 0,
              propertyId: propertyId || 0,
              photoTypeId: img.photoTypeId || c.photoTypeId || 0,
              photoTypeCode: img.photoTypeCode || c.photoTypeCode || '',
              photoTypeName: c.photoTypeName,
              displayOrder: img.displayOrder,
              remarks: img.remarks ? `${img.title} | ${img.remarks}` : img.title,
              viewUrl: img.src,
              downloadUrl: img.downloadUrl,
              documentGuid: img.documentGuid,
              wingDetailId: img.wingDetailId,
              wingName: img.wingName,
              societyDetailId: img.societyDetailId,
            });
          }
        })
      );
      setPhotos(updated);
      setPrevInitialPhotos(updated);

      // Revalidate/update slots locally to keep front-end state in sync
      const activeSlots = photoSlots.length > 0 ? photoSlots : initialPhotoSlots;
      const updatedSlots = activeSlots.map((slot) => {
        const cat = newCats.find((c) => c.photoTypeId === slot.photoTypeId);
        if (!cat) return slot;
        const catPhotos = updated.filter((p) => p.photoTypeId === slot.photoTypeId);
        const hasAnyPhoto = catPhotos.length > 0;
        const firstPhoto = catPhotos[0];
        return {
          ...slot,
          hasPhoto: hasAnyPhoto,
          photoCount: catPhotos.length,
          propertyPhotoId: hasAnyPhoto ? firstPhoto?.propertyPhotoId : undefined,
          viewUrl: hasAnyPhoto ? firstPhoto?.viewUrl : undefined,
          documentGuid: hasAnyPhoto ? firstPhoto?.documentGuid : undefined,
        };
      });
      setPhotoSlots(updatedSlots);
      setPrevInitialPhotoSlots(updatedSlots);

      onPhotosChange?.(updated);
      onPhotoSlotsChange?.(updatedSlots);
    },
    [propertyId, photoSlots, initialPhotoSlots, onPhotosChange, onPhotoSlotsChange, resetHoverPreview]
  );

  const isAmenityProperty = useMemo(() => {
    return (
      isAmenityDetected ||
      categoryId === 140 ||
      propertyTypeId === 140 ||
      entityType === 'AMENITY' ||
      entityType === 'A'
    );
  }, [categoryId, propertyTypeId, entityType, isAmenityDetected]);

  const photoPlanCategory = useMemo(
    () =>
      findCategory(
        categories,
        ['PROPERTY_PLAN', 'PHOTO_PLAN'],
        ['property plan', 'photo plan']
      ),
    [categories]
  );

  // For propertyPhotoCategory, strictly map property front photo
  const propertyPhotoCategory = useMemo(() => {
    return categories.find((c) => isPropertyFrontPhoto(c.photoTypeCode, c.photoTypeName));
  }, [categories]);

  const amenityPhotoCategory = useMemo(
    () => findCategory(categories, ['AMENITY_PHOTO', 'AMENITY'], ['amenity photo', 'amenity']),
    [categories]
  );
  const amenityPhoto = amenityPhotoCategory?.images?.[0];

  const gisCategory = useMemo(
    () => findCategory(categories, ['GIS'], ['gis', 'satellite view']),
    [categories]
  );

  const parsedCoords = useMemo(() => {
    return extractCoordinates([
      { latitude: initialLatitude, longitude: initialLongitude },
      matchedWing as unknown as Record<string, unknown>,
      ...(Array.isArray(_wings) ? _wings : []).map((w) => w as unknown as Record<string, unknown>),
      { latitude: societyLatitude, longitude: societyLongitude },
    ]);
  }, [initialLatitude, initialLongitude, matchedWing, _wings, societyLatitude, societyLongitude]);

  const hasCoords = parsedCoords.hasCoords;
  const effectiveLat = parsedCoords.latitude;
  const effectiveLng = parsedCoords.longitude;

  const gisPhoto = useMemo(() => {
    const photo = gisCategory?.images?.[0];
    let srcVal = '';
    if (hasCoords && effectiveLat !== undefined && effectiveLng !== undefined) {
      const releases =
        initialWaybackReleases && initialWaybackReleases.length > 0
          ? initialWaybackReleases
          : DEFAULT_WAYBACK_RELEASES;
      const latestRelease = releases[releases.length - 1];
      srcVal = getSatelliteTileUrl(effectiveLat, effectiveLng, 17, latestRelease?.releaseId);
    }
    return {
      src: srcVal,
      fullSrc: srcVal,
      alt: photo?.alt || t('media.satelliteView') || 'Satellite View',
      title: photo?.title || t('media.satelliteView') || 'Satellite View',
      photoTypeId: photo?.photoTypeId || gisCategory?.photoTypeId || 0,
      photoTypeCode: photo?.photoTypeCode || gisCategory?.photoTypeCode || 'GIS',
      propertyPhotoId: photo?.propertyPhotoId,
    };
  }, [gisCategory, t, hasCoords, effectiveLat, effectiveLng, initialWaybackReleases]);

  const signatureCategory = useMemo(
    () =>
      findCategory(categories, ['SIGNATURE', 'OWNER_SIGNATURE'], ['signature', 'owner signature']),
    [categories]
  );

  const signaturePhoto = signatureCategory?.images?.[0];

  const photoPlanPhoto =
    photoPlanCategory?.images && photoPlanCategory.images.length > 0
      ? photoPlanCategory.images[photoPlanCategory.images.length - 1]
      : undefined;
  const propertyPhoto = propertyPhotoCategory?.images[0];

  const remainingImages = useMemo(() => {
    const all = categories.flatMap((c) => c.images);
    return all.filter((img) => {
      const code = img.photoTypeCode?.toUpperCase() || '';
      if (
        code === 'FLOOR' ||
        code === 'GIS' ||
        code === 'CHANGE_DETECTION' ||
        code.includes('SIGNATURE')
      )
        return false;
      if (propertyPhoto && img.propertyPhotoId === propertyPhoto.propertyPhotoId) return false;
      if (photoPlanPhoto && img.propertyPhotoId === photoPlanPhoto.propertyPhotoId) return false;
      return true;
    });
  }, [categories, propertyPhoto, photoPlanPhoto]);

  const societyPhotoCategory = useMemo(() => {
    const validSocietyCats = categories.filter((c) => isSocietyPhoto(c.photoTypeCode, c.photoTypeName));
    if (validSocietyCats.length === 0) return undefined;
    return [...validSocietyCats].sort((a, b) => getSocietyPhotoPriority(a) - getSocietyPhotoPriority(b))[0];
  }, [categories]);
  const societyPhoto = useMemo(() => {
    if (!isMainProperty || !societyPhotoCategory) return undefined;
    const fromCat = societyPhotoCategory?.images?.[0];
    if (fromCat && fromCat.hasPhoto && (fromCat.src || fromCat.documentGuid)) return fromCat;
    return undefined;
  }, [societyPhotoCategory, isMainProperty]);

  const wingPhotoCategory = useMemo(
    () => findCategory(categories, ['WING_BUILDING', 'WING_PHOTO', 'WING'], ['wing building', 'wing photo', 'wing']),
    [categories]
  );
  const wingPhoto = wingPhotoCategory?.images?.[0];

  return {
    showMoreImages,
    setShowMoreImages,
    hoverPreview,
    photos,
    setPhotos,
    photoSlots,
    setPhotoSlots,
    fullyLoadedIds,
    setFullyLoadedIds,
    categories,
    handleCategoriesChange,
    photoPlanCategory,
    propertyPhotoCategory,
    societyPhotoCategory,
    wingPhotoCategory,
    amenityPhotoCategory,
    gisCategory,
    gisPhoto,
    photoPlanPhoto,
    propertyPhoto,
    societyPhoto,
    wingPhoto,
    amenityPhoto,
    isAmenityProperty,
    remainingImages,
    handleImageHover,
    handleImageLeave,
    cancelImageLeave,
    resetHoverPreview,
    signatureCategory,
    signaturePhoto,
    loadPhotoSlotsOnDemand,
    t,
  };
}
