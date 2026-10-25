import type { AdditionalImage } from './MediaImageCards';
import type { PropertyPhotoDto, PropertyPhotoTypeWithStatusDto, PropertyPhotoGalleryDto } from '@/types/photoplan.types';
import type { PhotoCategory } from './PhotoPlanSidebar';
import { getViewDocumentUrl, getDownloadDocumentUrl } from '@/lib/utils/document-utils';

import { getLocalizedCategoryName } from '@/lib/utils/ptis-photo-plan-localization';

export interface PhotoCategoryPayloadInput {
  photoTypeCode: string;
  images: {
    file?: File;
    displayOrder?: number;
    remarks?: string;
    title?: string;
  }[];
}

/**
 * Utility to format nested 1:N folder state into FormData suitable for server API payload.
 */
export function formatPhotoPlanPayload(categories: PhotoCategoryPayloadInput[]): FormData {
  const formData = new FormData();
  categories.forEach(c => c.images.forEach((img, idx) => {
    if (img.file) formData.append(`files[${c.photoTypeCode}]`, img.file);
    formData.append(`metadata[${c.photoTypeCode}][${idx}][displayOrder]`, (img.displayOrder || idx + 1).toString());
    formData.append(`metadata[${c.photoTypeCode}][${idx}][remarks]`, img.remarks || '');
    formData.append(`metadata[${c.photoTypeCode}][${idx}][title]`, img.title || '');
  }));
  return formData;
}

export function mapPropertyPhotoToAdditionalImage(p: PropertyPhotoDto, categoryName: string): AdditionalImage {
  const remarksStr = p.remarks || '';
  let parsedTitle = categoryName, parsedRemarks = '';
  const defaultEnglishNames = [
    'property photo', 'property', 'photo plan', 'building photo', 'building', 'front', 'front view', 'front elevation',
    'sign board photo', 'sign board', 'signboard', 'advertisement board photo', 'advertisement board', 'advertisement',
    'owner signature photo', 'owner signature', 'signature', 'other photo', 'other', 'floor plan', 'floor',
    'gis / satellite view', 'gis', 'satellite view', 'gis / satellite', 'rear elevation', 'back', 'living room', 'living',
    'kitchen', 'bedroom', 'bathroom', 'balcony', 'terrace view', 'terrace', 'parking view', 'parking',
    'society photo', 'society place photo', 'society board photo', 'society sign board photo', 'society place', 'society board', 'society sign board',
    'wing photo', 'wing building photo', 'wing place photo', 'wing board photo', 'wing sign board photo', 'wing building', 'wing place', 'wing board', 'wing sign board',
    'amenity photo', 'amenity'
  ];

  const checkIsDefault = (nameStr: string) => {
    const lower = nameStr.toLowerCase();
    return (
      !nameStr ||
      defaultEnglishNames.includes(lower) ||
      lower === p.photoTypeCode?.toLowerCase() ||
      lower.startsWith('wing building photo') ||
      lower.startsWith('wing place photo') ||
      lower.startsWith('wing board photo') ||
      lower.startsWith('wing sign board photo') ||
      lower.startsWith('society place photo') ||
      lower.startsWith('society board photo') ||
      lower.startsWith('society sign board photo') ||
      lower.startsWith('property photo') ||
      lower.startsWith('photo plan')
    );
  };

  if (remarksStr.includes(' | ')) {
    const [namePart, ...remarkParts] = remarksStr.split(' | ');
    const trimmedName = namePart?.trim() || '';
    const isDefault = checkIsDefault(trimmedName);
    parsedTitle = isDefault ? categoryName : trimmedName;
    parsedRemarks = remarkParts.join(' | ');
  } else if (remarksStr) {
    const trimmedRemarks = remarksStr.trim();
    const isDefault = checkIsDefault(trimmedRemarks);
    parsedTitle = isDefault ? categoryName : trimmedRemarks;
  }

  parsedTitle = parsedTitle.replace(/(\([^)]+\))\s*\1+/g, '$1');

  const resolvedUrl = p.documentGuid ? getViewDocumentUrl(p.documentGuid) : p.viewUrl;
  return {
    src: resolvedUrl || '', fullSrc: resolvedUrl || '', alt: parsedTitle, title: parsedTitle,
    photoTypeId: p.photoTypeId, photoTypeCode: p.photoTypeCode, propertyPhotoId: p.propertyPhotoId,
    hasPhoto: true, remarks: parsedRemarks, displayOrder: p.displayOrder, documentGuid: p.documentGuid?.toString(),
    downloadUrl: p.downloadUrl || (p.documentGuid ? getDownloadDocumentUrl(p.documentGuid.toString()) : undefined),
    wingDetailId: p.wingDetailId,
    wingName: p.wingName,
    societyDetailId: p.societyDetailId,
  };
}

export function findCategory(categories: PhotoCategory[], codeKeywords: string[], nameKeywords: string[]) {
  return categories.find(c => {
    const code = c.photoTypeCode?.toUpperCase() || '', name = c.photoTypeName?.toLowerCase() || '';
    return codeKeywords.some(kw => code.includes(kw)) || nameKeywords.some(kw => name.includes(kw));
  });
}

export function formatWingCardLabel(baseLabel: string, wingName?: string | null): string {
  if (!baseLabel) return baseLabel || '';
  if (!wingName || !wingName.trim()) return baseLabel;

  const trimmed = wingName.trim();
  const cleanWing = trimmed
    .replace(/^(?:wing|विंग|विग)\s+/gi, '')
    .replace(/\s+(?:wing|विंग|विग)$/gi, '')
    .trim() || trimmed;

  if (!cleanWing) return baseLabel;

  // Escape special regex characters in cleanWing
  const escapedWing = cleanWing.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Check if cleanWing is already present as a distinct word in baseLabel
  const wordBoundaryRegex = new RegExp(`(?:^|[\\s_\\-–—/\\\\(\\[{])${escapedWing}(?:$|[\\s_\\-–—/\\\\)\\]}])`, 'i');
  if (wordBoundaryRegex.test(baseLabel)) {
    return baseLabel;
  }

  const isDevanagari = /[\u0900-\u097F]/.test(baseLabel);

  // If baseLabel starts with "Wing " or "विंग " or "विग "
  if (/^(?:wing)\s+/i.test(baseLabel)) {
    return baseLabel.replace(/^(?:wing)\s+/i, `Wing ${cleanWing} `).trim();
  }
  if (/^(?:विंग|विग)\s+/i.test(baseLabel)) {
    return baseLabel.replace(/^(?:विंग|विग)\s+/i, `विंग ${cleanWing} `).trim();
  }

  // If baseLabel is just "Wing" or "विंग" or generic wing photo terms
  if (/^(?:wing|विंग|विग)$/i.test(baseLabel.trim())) {
    return isDevanagari ? `विंग ${cleanWing}` : `Wing ${cleanWing}`;
  }

  // Prepend Wing {cleanWing}
  return isDevanagari ? `विंग ${cleanWing} ${baseLabel}` : `Wing ${cleanWing} ${baseLabel}`;
}

export function mapSlotsToCategories(
  slots: PropertyPhotoTypeWithStatusDto[],
  uploadedPhotos: PropertyPhotoDto[] = [],
  fullyLoadedIds?: Set<number>,
  t?: ((key: string) => string) & { has?: (key: string) => boolean },
  wingName?: string,
  selectedWingDetailId?: number | null,
  isMainProperty: boolean = false,
  categoryId: number | null = null,
  _propertyTypeId: number | null = null,
  entityType?: string,
  isAmenityProp?: boolean,
  societyPhotoFallbackGuid?: string,
  societyPhotoFallbackUrl?: string,
  isQuickDataEntry: boolean = false,
  partitionNo?: string | null,
  _hasExplicitWing: boolean = false,
  societyDetailId?: number | null,
  isIndividualRoute?: boolean
): PhotoCategory[] {
  const systemCodes = [
    'FRONT', 'FLOOR', 'GIS', 'BACK', 'LIVING', 'KITCHEN', 'BEDROOM', 'BATHROOM', 'BALCONY', 'TERRACE', 'PARKING', 'CHANGE_DETECTION',
    'WING_BUILDING', 'WING_PLACE', 'WING_BOARD', 'WING_SIGN_BOARD',
    'SOCIETY_PLACE', 'SOCIETY_BOARD', 'SOCIETY_SIGN_BOARD',
    'PROPERTY_FRONT', 'PROPERTY_SIDE', 'PROPERTY_INSIDE', 'PROPERTY_BOARD', 'PROPERTY_PLAN', 'PHOTO_PLAN'
  ];
  const isPhotoPlanCat = (c: { photoTypeCode?: string; photoTypeName?: string }) => {
    const code = c.photoTypeCode?.toUpperCase() || '';
    const name = c.photoTypeName?.toLowerCase() || '';
    return (
      code === 'PHOTO_PLAN' ||
      code === 'PROPERTY_PLAN' ||
      code === 'PLAN' ||
      code === 'DRAW_PLAN' ||
      name.includes('photo plan') ||
      name.includes('property plan') ||
      name.includes('photo_plan') ||
      name.includes('property_plan')
    );
  };
  const normalizeCode = (c?: string) =>
    (c || '').toUpperCase().trim().replace(/_PHOTO$/, '').replace(/PHOTO$/, '').replace(/_/g, '');

  const isPhotoMatch = (targetCode?: string, targetTypeId?: number, photoCode?: string, photoTypeId?: number) => {
    if (targetTypeId && photoTypeId && Number(targetTypeId) > 0 && Number(targetTypeId) === Number(photoTypeId)) {
      return true;
    }
    if (targetCode && photoCode) {
      const tNorm = normalizeCode(targetCode);
      const pNorm = normalizeCode(photoCode);
      if (tNorm && pNorm && tNorm === pNorm) {
        return true;
      }
    }
    return false;
  };

  const baseCats = slots.map(s => {
    const nameFallback = s.photoTypeName || '';
    let nameVal = t ? getLocalizedCategoryName(s.photoTypeCode, nameFallback, t) : nameFallback;
    const isWingSlot = Boolean(
      s.photoTypeCode?.toUpperCase().includes('WING') ||
      s.photoTypeName?.toLowerCase().includes('wing')
    );
    if (wingName && isWingSlot) {
      nameVal = formatWingCardLabel(nameVal, wingName);
    }
    nameVal = nameVal.replace(/(\([^)]+\))\s*\1+/g, '$1');

    let hasPhoto = s.hasPhoto;
    let documentGuid = s.documentGuid;
    let viewUrl = s.viewUrl;
    let propertyPhotoId = s.propertyPhotoId;

    const slotScope = (s.photoScope || '').toUpperCase().trim();
    const isAmenityCat = slotScope === 'AMENITY' || (!slotScope && Boolean(s.photoTypeCode?.toUpperCase().includes('AMENITY')));
    const isWingCat = !isAmenityCat && (slotScope === 'WING' || (!slotScope && Boolean(s.photoTypeCode?.toUpperCase().includes('WING'))));
    const isSocietyCat = !isAmenityCat && (slotScope === 'SOCIETY' || (!slotScope && Boolean(s.photoTypeCode?.toUpperCase().includes('SOCIETY'))));

    const checkIsAmenityPhoto = (p: PropertyPhotoDto) => {
      const pScope = (p.photoScope || '').toUpperCase().trim();
      return pScope === 'AMENITY' || (!pScope && Boolean(p.photoTypeCode?.toUpperCase().includes('AMENITY')));
    };

    const checkIsWingPhoto = (p: PropertyPhotoDto) => {
      const pScope = (p.photoScope || '').toUpperCase().trim();
      return pScope === 'WING' || (!pScope && !checkIsAmenityPhoto(p) && Boolean(p.photoTypeCode?.toUpperCase().includes('WING')));
    };

    const checkIsSocietyPhoto = (p: PropertyPhotoDto) => {
      const pScope = (p.photoScope || '').toUpperCase().trim();
      return pScope === 'SOCIETY' || (!pScope && !checkIsAmenityPhoto(p) && Boolean(p.photoTypeCode?.toUpperCase().includes('SOCIETY')));
    };

    let matchingPhoto: PropertyPhotoDto | undefined;
    if (isAmenityCat) {
      matchingPhoto = uploadedPhotos.find(p => {
        if (!checkIsAmenityPhoto(p)) return false;
        return isPhotoMatch(s.photoTypeCode, s.photoTypeId, p.photoTypeCode, p.photoTypeId);
      });
    } else if (isWingCat) {
      matchingPhoto = uploadedPhotos.find(p => {
        if (!checkIsWingPhoto(p)) return false;
        if (selectedWingDetailId) {
          if (!p.wingDetailId || Number(p.wingDetailId) !== Number(selectedWingDetailId)) return false;
        }
        return isPhotoMatch(s.photoTypeCode, s.photoTypeId, p.photoTypeCode, p.photoTypeId);
      });
    } else if (isSocietyCat) {
      matchingPhoto = uploadedPhotos.find(p => {
        if (!checkIsSocietyPhoto(p)) return false;
        return isPhotoMatch(s.photoTypeCode, s.photoTypeId, p.photoTypeCode, p.photoTypeId);
      });
      const isPrimarySocietySlot = !Boolean(
        s.photoTypeCode?.toUpperCase().includes('BOARD') ||
        s.photoTypeName?.toLowerCase().includes('board') ||
        s.photoTypeCode?.toUpperCase().includes('SIGN') ||
        s.photoTypeName?.toLowerCase().includes('sign')
      );
      const isFullyLoaded = fullyLoadedIds?.has(s.photoTypeId);
      if (!matchingPhoto && isPrimarySocietySlot && s.hasPhoto && !isFullyLoaded && uploadedPhotos.length === 0 && (societyPhotoFallbackGuid || societyPhotoFallbackUrl)) {
        hasPhoto = true;
        documentGuid = societyPhotoFallbackGuid || documentGuid;
        viewUrl = societyPhotoFallbackUrl || (societyPhotoFallbackGuid ? getViewDocumentUrl(societyPhotoFallbackGuid) : viewUrl);
      }
    } else {
      matchingPhoto = uploadedPhotos.find(p => {
        if (checkIsAmenityPhoto(p) || checkIsWingPhoto(p) || checkIsSocietyPhoto(p)) return false;
        const isPlanPhoto = isPhotoPlanCat(p) || p.remarks?.toLowerCase().includes('property plan') || p.remarks?.toLowerCase().includes('photo plan') || p.photoTypeCode?.toUpperCase().includes('PLAN');
        if (!isPhotoPlanCat(s) && isPlanPhoto) return false;
        if (isPhotoPlanCat(s) && isPlanPhoto) return true;
        return isPhotoMatch(s.photoTypeCode, s.photoTypeId, p.photoTypeCode, p.photoTypeId);
      });
    }

    const isPlanCat = isPhotoPlanCat(s) || s.photoTypeCode?.toUpperCase().includes('PLAN');
    if (matchingPhoto) {
      hasPhoto = true;
      documentGuid = matchingPhoto.documentGuid || documentGuid;
      viewUrl = matchingPhoto.documentGuid ? getViewDocumentUrl(matchingPhoto.documentGuid) : (matchingPhoto.viewUrl || viewUrl);
      propertyPhotoId = matchingPhoto.propertyPhotoId || propertyPhotoId;
    } else if (isWingCat && selectedWingDetailId) {
      hasPhoto = false;
      documentGuid = undefined;
      viewUrl = undefined;
      propertyPhotoId = undefined;
    } else if (!isPlanCat) {
      // For non-plan slots without matching photo: if slot is explicitly marked hasPhoto=false, or uploadedPhotos is populated/loaded, or category is fully loaded, clear values
      if (!s.hasPhoto || (fullyLoadedIds && fullyLoadedIds.has(s.photoTypeId)) || (uploadedPhotos.length > 0 && !hasPhoto)) {
        hasPhoto = false;
        documentGuid = undefined;
        viewUrl = undefined;
        propertyPhotoId = undefined;
      }
    } else {
      // For plan slots without a matching uploaded plan, clear default fallback photo values to avoid fallback bleeding
      hasPhoto = false;
      documentGuid = undefined;
      viewUrl = undefined;
      propertyPhotoId = undefined;
    }

    return {
      photoTypeId: s.photoTypeId,
      photoTypeCode: s.photoTypeCode,
      photoTypeName: nameVal,
      photoScope: s.photoScope,
      isCustom: !systemCodes.includes(s.photoTypeCode.toUpperCase()),
      hasPhoto,
      photoCount: s.photoCount,
      propertyPhotoId,
      documentGuid,
      viewUrl,
    };
  });

  const hasCD = baseCats.some((c) => c.photoTypeCode === 'CHANGE_DETECTION');
  if (!isQuickDataEntry && !hasCD) {
    const cdName = t ? (t.has?.('media.changeDetection') ? t('media.changeDetection') : 'Change Detection') : 'Change Detection';
    baseCats.push({
      photoTypeId: 9999,
      photoTypeCode: 'CHANGE_DETECTION',
      photoTypeName: cdName,
      photoScope: undefined,
      isCustom: false,
      hasPhoto: true,
      photoCount: 2,
      propertyPhotoId: undefined,
      documentGuid: undefined,
      viewUrl: undefined,
    });
  }

  const isAmenity =
    isAmenityProp === true ||
    categoryId === 140 ||
    _propertyTypeId === 140 ||
    entityType === 'AMENITY' ||
    entityType === 'A';

  const isPartitionEmptyOrMain =
    !partitionNo ||
    partitionNo === '0' ||
    String(partitionNo).trim() === '' ||
    String(partitionNo).trim() === '-';

  const hasSociety = Boolean(societyDetailId && Number(societyDetailId) > 0);
  const hasWing = Boolean(selectedWingDetailId && Number(selectedWingDetailId) > 0);
  const hasNeitherSocietyNorWing = !hasSociety && !hasWing;

  const hasBothSocietyAndWing = Boolean(
    hasSociety &&
    hasWing &&
    !isMainProperty
  );

  const isSocietyMainProperty =
    !isAmenity &&
    (isMainProperty || isPartitionEmptyOrMain) &&
    (hasSociety || entityType === 'S' || categoryId === 3) &&
    (categoryId === 1 || categoryId === 3 || entityType === 'S' || Boolean(societyPhotoFallbackGuid) || Boolean(societyPhotoFallbackUrl));

  const isInnerSocietyWingProperty =
    !isAmenity &&
    !isSocietyMainProperty &&
    !isMainProperty &&
    categoryId !== 4 &&
    entityType !== 'W' &&
    (hasBothSocietyAndWing || (categoryId === 1 && (Boolean(selectedWingDetailId) || Boolean(wingName))));

  const isSocietyProperty =
    !isAmenity &&
    !isIndividualRoute &&
    (isMainProperty ||
      categoryId === 1 ||
      categoryId === 3 ||
      categoryId === 4 ||
      entityType === 'S' ||
      entityType === 'W' ||
      entityType === 'APARTMENT' ||
      hasSociety ||
      hasWing ||
      Boolean(wingName));

  const isIndividualProperty =
    !isAmenity &&
    (Boolean(isIndividualRoute) || (!isSocietyProperty && !isMainProperty && (categoryId === 2 || entityType === 'P' || hasNeitherSocietyNorWing)));

  const hasAmenitySlot = baseCats.some(
    (c) =>
      c.photoTypeCode?.toUpperCase() === 'AMENITY_PHOTO' ||
      c.photoTypeCode?.toUpperCase() === 'AMENITY' ||
      c.photoTypeName?.toLowerCase().includes('amenity')
  );
  if (!isQuickDataEntry && isAmenity && !hasAmenitySlot) {
    const amenityName = t ? (t.has?.('media.amenityPhoto') ? t('media.amenityPhoto') : 'Amenity Photo') : 'Amenity Photo';
    baseCats.unshift({
      photoTypeId: 14,
      photoTypeCode: 'AMENITY_PHOTO',
      photoTypeName: amenityName,
      photoScope: undefined,
      isCustom: false,
      hasPhoto: false,
      photoCount: 0,
      propertyPhotoId: undefined,
      documentGuid: undefined,
      viewUrl: undefined,
    });
  }

  const hasPlan = baseCats.some(isPhotoPlanCat);
  const shouldInjectPlan =
    !hasPlan &&
    (isIndividualProperty || isAmenity || (isQuickDataEntry && (isInnerSocietyWingProperty || !isSocietyMainProperty)));

  const corePropertySlotTemplates = [
    { photoTypeId: 1, photoTypeCode: 'PROPERTY_FRONT', defaultName: 'Property Front Photo', displayOrder: 1 },
    { photoTypeId: 2, photoTypeCode: 'PROPERTY_SIDE', defaultName: 'Property Side Photo', displayOrder: 2 },
    { photoTypeId: 3, photoTypeCode: 'PROPERTY_INSIDE', defaultName: 'Property Inside Photo', displayOrder: 3 },
    { photoTypeId: 4, photoTypeCode: 'PROPERTY_BOARD', defaultName: 'Property Board Photo', displayOrder: 4 },
  ];

  const shouldInjectCorePropertySlots =
    (isIndividualProperty && slots.length === 0) ||
    Boolean(isIndividualRoute && !baseCats.some((c) => (c.photoTypeCode || '').toUpperCase().startsWith('PROPERTY_')));

  if (shouldInjectCorePropertySlots) {
    corePropertySlotTemplates.forEach((tpl) => {
      const exists = baseCats.some(
        (c) =>
          c.photoTypeId === tpl.photoTypeId ||
          c.photoTypeCode?.toUpperCase() === tpl.photoTypeCode
      );
      if (!exists) {
        const localizedName = t
          ? getLocalizedCategoryName(tpl.photoTypeCode, tpl.defaultName, t)
          : tpl.defaultName;
        const matchingPhoto = uploadedPhotos.find((p) =>
          isPhotoMatch(tpl.photoTypeCode, tpl.photoTypeId, p.photoTypeCode, p.photoTypeId)
        );
        const hasPhoto = Boolean(matchingPhoto);
        const documentGuid = matchingPhoto?.documentGuid;
        const viewUrl = documentGuid
          ? getViewDocumentUrl(documentGuid)
          : matchingPhoto?.viewUrl;
        const propertyPhotoId = matchingPhoto?.propertyPhotoId;

        baseCats.push({
          photoTypeId: tpl.photoTypeId,
          photoTypeCode: tpl.photoTypeCode,
          photoTypeName: localizedName,
          photoScope: 'PROPERTY',
          isCustom: false,
          hasPhoto,
          photoCount: hasPhoto ? 1 : 0,
          propertyPhotoId,
          documentGuid,
          viewUrl,
        });
      }
    });
  }

  if (isSocietyProperty && slots.length === 0) {
    const societySlotTemplates = [
      { photoTypeId: 5, photoTypeCode: 'SOCIETY_PLACE', defaultName: 'Society Place Photo', displayOrder: 1 },
      { photoTypeId: 6, photoTypeCode: 'SOCIETY_BOARD', defaultName: 'Society Board Photo', displayOrder: 2 },
      { photoTypeId: 7, photoTypeCode: 'SOCIETY_SIGN_BOARD', defaultName: 'Society Sign Board Photo', displayOrder: 3 },
    ];
    const wingSlotTemplates = [
      { photoTypeId: 8, photoTypeCode: 'WING_BUILDING', defaultName: 'Wing Building Photo', displayOrder: 4 },
      { photoTypeId: 9, photoTypeCode: 'WING_PLACE', defaultName: 'Wing Place Photo', displayOrder: 5 },
      { photoTypeId: 10, photoTypeCode: 'WING_BOARD', defaultName: 'Wing Board Photo', displayOrder: 6 },
      { photoTypeId: 11, photoTypeCode: 'WING_SIGN_BOARD', defaultName: 'Wing Sign Board Photo', displayOrder: 7 },
    ];

    societySlotTemplates.forEach((tpl) => {
      const exists = baseCats.some(
        (c) =>
          c.photoTypeId === tpl.photoTypeId ||
          c.photoTypeCode?.toUpperCase() === tpl.photoTypeCode
      );
      if (!exists) {
        const localizedName = t
          ? getLocalizedCategoryName(tpl.photoTypeCode, tpl.defaultName, t)
          : tpl.defaultName;
        const matchingPhoto = uploadedPhotos.find((p) =>
          isPhotoMatch(tpl.photoTypeCode, tpl.photoTypeId, p.photoTypeCode, p.photoTypeId)
        );
        const hasPhoto = Boolean(matchingPhoto);
        const documentGuid = matchingPhoto?.documentGuid;
        const viewUrl = documentGuid
          ? getViewDocumentUrl(documentGuid)
          : matchingPhoto?.viewUrl;
        const propertyPhotoId = matchingPhoto?.propertyPhotoId;

        baseCats.push({
          photoTypeId: tpl.photoTypeId,
          photoTypeCode: tpl.photoTypeCode,
          photoTypeName: localizedName,
          photoScope: 'SOCIETY',
          isCustom: false,
          hasPhoto,
          photoCount: hasPhoto ? 1 : 0,
          propertyPhotoId,
          documentGuid,
          viewUrl,
        });
      }
    });

    wingSlotTemplates.forEach((tpl) => {
      const exists = baseCats.some(
        (c) =>
          c.photoTypeId === tpl.photoTypeId ||
          c.photoTypeCode?.toUpperCase() === tpl.photoTypeCode
      );
      if (!exists) {
        let localizedName = t
          ? getLocalizedCategoryName(tpl.photoTypeCode, tpl.defaultName, t)
          : tpl.defaultName;
        if (wingName) {
          localizedName = formatWingCardLabel(localizedName, wingName);
        }
        const matchingPhoto = uploadedPhotos.find((p) =>
          isPhotoMatch(tpl.photoTypeCode, tpl.photoTypeId, p.photoTypeCode, p.photoTypeId)
        );
        const hasPhoto = Boolean(matchingPhoto);
        const documentGuid = matchingPhoto?.documentGuid;
        const viewUrl = documentGuid
          ? getViewDocumentUrl(documentGuid)
          : matchingPhoto?.viewUrl;
        const propertyPhotoId = matchingPhoto?.propertyPhotoId;

        baseCats.push({
          photoTypeId: tpl.photoTypeId,
          photoTypeCode: tpl.photoTypeCode,
          photoTypeName: localizedName,
          photoScope: 'WING',
          isCustom: false,
          hasPhoto,
          photoCount: hasPhoto ? 1 : 0,
          propertyPhotoId,
          documentGuid,
          viewUrl,
        });
      }
    });
  }

  if (shouldInjectPlan) {
    const planName = isQuickDataEntry
      ? (t ? (t.has?.('media.propertyPlan') ? t('media.propertyPlan') : 'Property Plan') : 'Property Plan')
      : (t ? (t.has?.('media.photoPlan') ? t('media.photoPlan') : 'Photo Plan') : 'Photo Plan');
    const newPlanCat = {
      photoTypeId: 13,
      photoTypeCode: isQuickDataEntry ? 'PROPERTY_PLAN' : 'PHOTO_PLAN',
      photoTypeName: planName,
      photoScope: 'PROPERTY',
      isCustom: false,
      hasPhoto: false,
      photoCount: 0,
      propertyPhotoId: undefined,
      documentGuid: undefined,
      viewUrl: undefined,
    };
    if (isQuickDataEntry) {
      const sideIdx = baseCats.findIndex((c) => (c.photoTypeCode || '').toUpperCase() === 'PROPERTY_SIDE');
      if (sideIdx !== -1) {
        baseCats.splice(sideIdx + 1, 0, newPlanCat);
      } else {
        const frontIdx = baseCats.findIndex((c) => (c.photoTypeCode || '').toUpperCase() === 'PROPERTY_FRONT');
        if (frontIdx !== -1) {
          baseCats.splice(frontIdx + 1, 0, newPlanCat);
        } else {
          baseCats.push(newPlanCat);
        }
      }
    } else {
      baseCats.unshift(newPlanCat);
    }
  }

  if (isQuickDataEntry) {
    baseCats.forEach((c) => {
      if (isPhotoPlanCat(c)) {
        c.photoTypeName = t ? (t.has?.('media.propertyPlan') ? t('media.propertyPlan') : 'Property Plan') : 'Property Plan';
      }
    });
  }

  const filteredCats = baseCats.filter(c => {
    const code = c.photoTypeCode?.toUpperCase() || '';
    const isPlan = isPhotoPlanCat(c);
    const scope = (c.photoScope || '').toUpperCase().trim();
    const isSocietySlot = scope === 'SOCIETY' || (!scope && (code.startsWith('SOCIETY_') || c.photoTypeName?.toLowerCase().includes('society')));
    const isWingSlot = scope === 'WING' || (!scope && (code.startsWith('WING_') || c.photoTypeName?.toLowerCase().includes('wing')));

    if (isQuickDataEntry) {
      // Always exclude GIS / Satellite View and Change Detection from QDE
      if (
        code === 'GIS' ||
        code === 'CHANGE_DETECTION' ||
        code.includes('SATELLITE') ||
        c.photoTypeName?.toLowerCase().includes('satellite view') ||
        c.photoTypeName?.toLowerCase().includes('change detection')
      ) {
        return false;
      }

      // 1. Inner property of society wings: only load property scope slots in QDE
      if (isInnerSocietyWingProperty) {
        if (scope) {
          return scope === 'PROPERTY' || isPlan;
        }
        return code.startsWith('PROPERTY_') || isPlan;
      }

      // 2. Society main property: only load society scope slots in QDE
      if (isSocietyMainProperty) {
        if (scope) {
          return scope === 'SOCIETY';
        }
        return code.startsWith('SOCIETY_') || c.photoTypeName?.toLowerCase().includes('society');
      }

      if (isAmenity) {
        const isAmenitySlot = scope === 'AMENITY' || code.startsWith('AMENITY') || c.photoTypeName?.toLowerCase().includes('amenity');
        return isAmenitySlot || isSocietySlot || isPlan;
      }

      return scope === 'PROPERTY' || isPlan || code.startsWith('PROPERTY_');
    }

    if (isSocietyProperty) {
      // For Society properties (including Apartment screen / master):
      // Only Society, Wing scope slots, and Change Detection should be rendered!
      const isCD = code === 'CHANGE_DETECTION';
      return isSocietySlot || isWingSlot || isCD;
    }

    if (isAmenity) {
      // For Amenity properties:
      // Amenity slot, Photo Plan slot, Change Detection slot, and Society slots if present
      const isAmenitySlot = scope === 'AMENITY' || code.startsWith('AMENITY') || c.photoTypeName?.toLowerCase().includes('amenity');
      const isCD = code === 'CHANGE_DETECTION';
      return isAmenitySlot || isSocietySlot || isPlan || isCD || c.isCustom;
    }

    if (isIndividualProperty) {
      // For Individual properties:
      // Property scope slots, Photo Plan, GIS/Satellite view, Change Detection, and custom slots!
      const isSocietyOrWing = isSocietySlot || isWingSlot;
      const isAmenitySlot = scope === 'AMENITY' || code.startsWith('AMENITY') || c.photoTypeName?.toLowerCase().includes('amenity');
      if (isSocietyOrWing || isAmenitySlot) return false;
      return true;
    }

    return true;
  });

  return filteredCats.map(cat => {
    const catScope = (cat.photoScope || '').toUpperCase().trim();
    const isAmenityCat = catScope === 'AMENITY' || (!catScope && Boolean(cat.photoTypeCode?.toUpperCase().includes('AMENITY')));
    const isWingCat = !isAmenityCat && (catScope === 'WING' || (!catScope && Boolean(cat.photoTypeCode?.toUpperCase().includes('WING'))));
    const isSocietyCat = !isAmenityCat && (catScope === 'SOCIETY' || (!catScope && Boolean(cat.photoTypeCode?.toUpperCase().includes('SOCIETY'))));

    const checkIsAmenityPhoto = (p: PropertyPhotoDto) => {
      const pScope = (p.photoScope || '').toUpperCase().trim();
      return pScope === 'AMENITY' || (!pScope && Boolean(p.photoTypeCode?.toUpperCase().includes('AMENITY')));
    };

    const checkIsWingPhoto = (p: PropertyPhotoDto) => {
      const pScope = (p.photoScope || '').toUpperCase().trim();
      return pScope === 'WING' || (!pScope && !checkIsAmenityPhoto(p) && Boolean(p.photoTypeCode?.toUpperCase().includes('WING')));
    };

    const checkIsSocietyPhoto = (p: PropertyPhotoDto) => {
      const pScope = (p.photoScope || '').toUpperCase().trim();
      return pScope === 'SOCIETY' || (!pScope && !checkIsAmenityPhoto(p) && Boolean(p.photoTypeCode?.toUpperCase().includes('SOCIETY')));
    };

    let catPhotos = uploadedPhotos
      .filter(p => {
        const pIsAmenity = checkIsAmenityPhoto(p);
        const pIsWing = checkIsWingPhoto(p);
        const pIsSociety = checkIsSocietyPhoto(p);

        if (isAmenityCat) {
          if (!pIsAmenity) return false;
        } else if (isWingCat) {
          if (!pIsWing) return false;
          if (selectedWingDetailId) {
            if (!p.wingDetailId || Number(p.wingDetailId) !== Number(selectedWingDetailId)) return false;
          }
        } else if (isSocietyCat) {
          if (!pIsSociety) return false;
          return isPhotoMatch(cat.photoTypeCode, cat.photoTypeId, p.photoTypeCode, p.photoTypeId);
        } else {
          if (pIsAmenity || pIsWing || pIsSociety) return false;
          const isPlanPhoto = isPhotoPlanCat(p) || p.remarks?.toLowerCase().includes('property plan') || p.remarks?.toLowerCase().includes('photo plan') || p.photoTypeCode?.toUpperCase().includes('PLAN');
          if (isPhotoPlanCat(cat) && isPlanPhoto) return true;
          if (!isPhotoPlanCat(cat) && isPlanPhoto) return false;
        }

        return isPhotoMatch(cat.photoTypeCode, cat.photoTypeId, p.photoTypeCode, p.photoTypeId);
      })
      .sort((a, b) => {
        const diff = (a.displayOrder ?? 999) - (b.displayOrder ?? 999);
        if (diff !== 0) return diff;
        return (a.propertyPhotoId ?? 0) - (b.propertyPhotoId ?? 0);
      })
      .map(p => mapPropertyPhotoToAdditionalImage(p, cat.photoTypeName));

    const isFullyLoaded = fullyLoadedIds?.has(cat.photoTypeId);

    if (catPhotos.length === 0 && !isFullyLoaded && cat.hasPhoto && (cat.viewUrl || cat.documentGuid)) {
      const isPlanCat = isPhotoPlanCat(cat);
      const isPlanSlot = isPlanCat || cat.photoTypeCode?.toUpperCase().includes('PLAN');
      if (!isPlanSlot) {
        const effectiveGuid = cat.documentGuid;
        const effectiveViewUrl = cat.viewUrl || (effectiveGuid ? getViewDocumentUrl(effectiveGuid) : undefined);
        const resolvedUrl = effectiveGuid ? getViewDocumentUrl(effectiveGuid) : effectiveViewUrl;
        if (resolvedUrl || effectiveGuid) {
          catPhotos = [{
            src: resolvedUrl || '',
            fullSrc: resolvedUrl || '',
            alt: cat.photoTypeName,
            title: cat.photoTypeName,
            photoTypeId: cat.photoTypeId,
            photoTypeCode: cat.photoTypeCode,
            propertyPhotoId: cat.propertyPhotoId,
            hasPhoto: true,
            documentGuid: effectiveGuid?.toString(),
            downloadUrl: effectiveGuid ? getDownloadDocumentUrl(effectiveGuid.toString()) : (effectiveViewUrl ? effectiveViewUrl.replace('/view', '/download') : undefined),
          }];
        }
      }
    }

    let uploadedCDCount: number | undefined;

    if (cat.photoTypeCode === 'CHANGE_DETECTION') {
      const uploadedCDPhotos = uploadedPhotos
        .filter(p => p.photoTypeId === cat.photoTypeId || p.photoTypeCode === 'CHANGE_DETECTION')
        .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999))
        .map(p => mapPropertyPhotoToAdditionalImage(p, cat.photoTypeName));

      uploadedCDCount = uploadedCDPhotos.length;

      const beforePhoto = uploadedCDPhotos.find(p => p.displayOrder === 1);
      const afterPhoto = uploadedCDPhotos.find(p => p.displayOrder === 2);

      catPhotos = [
        beforePhoto || { src: '', fullSrc: '', alt: 'Before (Old)', title: 'Before (Old)', photoTypeId: cat.photoTypeId, photoTypeCode: 'CHANGE_DETECTION', propertyPhotoId: 9998, hasPhoto: false, displayOrder: 1 },
        afterPhoto || { src: '', fullSrc: '', alt: 'After (New)', title: 'After (New)', photoTypeId: cat.photoTypeId, photoTypeCode: 'CHANGE_DETECTION', propertyPhotoId: 9999, hasPhoto: false, displayOrder: 2 }
      ];
    }

    const count = catPhotos.length;

    let catName = cat.photoTypeName;
    if (wingName && isWingCat) {
      catName = formatWingCardLabel(catName, wingName).replace(/(\([^)]+\))\s*\1+/g, '$1');
    }

    return {
      ...cat,
      photoTypeName: catName,
      photoCount: count,
      images: catPhotos,
      ...(uploadedCDCount !== undefined ? { photoCount: uploadedCDCount } : {}),
    };
  });
}

export function mapGroupedResponseToCategories(
  groupedData: PropertyPhotoGalleryDto,
  t?: (key: string) => string
): PhotoCategory[] {
  const systemCodes = ['FRONT', 'FLOOR', 'GIS', 'BACK', 'LIVING', 'KITCHEN', 'BEDROOM', 'BATHROOM', 'BALCONY', 'TERRACE', 'PARKING', 'CHANGE_DETECTION', 'PHOTO_PLAN'];
  
  return (groupedData.photoTypes || []).map(group => {
    const nameFallback = group.photoTypeName || '';
    const nameVal = t ? getLocalizedCategoryName(group.photoTypeCode, nameFallback, t) : nameFallback;
    const mappedImages = (group.photos || [])
      .sort((a, b) => {
        const diff = (a.displayOrder ?? 999) - (b.displayOrder ?? 999);
        if (diff !== 0) return diff;
        return (a.propertyPhotoId ?? 0) - (b.propertyPhotoId ?? 0);
      })
      .map(p => mapPropertyPhotoToAdditionalImage(p, nameVal));

    return {
      photoTypeId: group.photoTypeId,
      photoTypeCode: group.photoTypeCode,
      photoTypeName: nameVal,
      isCustom: !systemCodes.includes(group.photoTypeCode.toUpperCase()),
      images: mappedImages,
    };
  });
}
