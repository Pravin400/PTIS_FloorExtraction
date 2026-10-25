/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PropertyPhotoDto, PropertyPhotoTypeWithStatusDto, PropertyPhotoGalleryDto } from '@/types/photoplan.types';
import type { PhotoCategory, AdditionalImage } from '@/types/asset/media.types';
import type { PhotoCategoryPayloadInput } from '@/types/asset/municipal-Asset/new-add-new-asset';
import { getViewDocumentUrl, getDownloadDocumentUrl } from '@/lib/utils/document-utils';
import { getLocalizedCategoryName } from '@/lib/utils/asset-utils/asset-photo-plan-localization';

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
    'asset photo plan', 'asset plan', 'asset photo', 'asset image'
  ];

  const checkIsDefaultName = (name: string) => {
    const lower = name.toLowerCase().trim();
    const cleanLower = lower.replace(/\s*\(existing\)\s*$/, '').trim();
    return (
      !lower ||
      defaultEnglishNames.includes(lower) ||
      defaultEnglishNames.includes(cleanLower) ||
      lower === p.photoTypeCode?.toLowerCase() ||
      lower === categoryName.toLowerCase() ||
      cleanLower === categoryName.toLowerCase()
    );
  };

  if (remarksStr.includes(' | ')) {
    const [namePart, ...remarkParts] = remarksStr.split(' | ');
    const trimmedName = namePart?.trim() || '';
    const isDefault = checkIsDefaultName(trimmedName);
    parsedTitle = isDefault ? categoryName : trimmedName;
    parsedRemarks = remarkParts.join(' | ');
  } else if (remarksStr) {
    const trimmedRemarks = remarksStr.trim();
    const isDefault = checkIsDefaultName(trimmedRemarks);
    parsedTitle = isDefault ? categoryName : trimmedRemarks;
  }

  const resolvedUrl = p.documentGuid ? getViewDocumentUrl(p.documentGuid) : p.viewUrl;
  return {
    src: resolvedUrl || '', fullSrc: resolvedUrl || '', alt: parsedTitle, title: parsedTitle,
    photoTypeId: p.photoTypeId, photoTypeCode: p.photoTypeCode, propertyPhotoId: p.propertyPhotoId,
    hasPhoto: true, remarks: parsedRemarks, displayOrder: p.displayOrder, documentGuid: p.documentGuid?.toString(),
    downloadUrl: p.downloadUrl || (p.documentGuid ? getDownloadDocumentUrl(p.documentGuid.toString()) : undefined),
    fileName: p.fileName, photoTypeName: p.photoTypeName,
    file: (p as any).file,
  };
}

export function findCategory(categories: PhotoCategory[], codeKeywords: string[], nameKeywords: string[]) {
  return categories.find(c => {
    const code = c.photoTypeCode?.toUpperCase() || '', name = c.photoTypeName?.toLowerCase() || '';
    return codeKeywords.some(kw => code.includes(kw)) || nameKeywords.some(kw => name.includes(kw));
  });
}

export function mapSlotsToCategories(
  slots: PropertyPhotoTypeWithStatusDto[],
  uploadedPhotos: PropertyPhotoDto[] = [],
  fullyLoadedIds?: Set<number>,
  t?: ((key: string) => string) & { has?: (key: string) => boolean },
  tForm?: (key: string) => string
): PhotoCategory[] {
  const systemCodes = ['FRONT', 'FLOOR', 'GIS', 'BACK', 'LIVING', 'KITCHEN', 'BEDROOM', 'BATHROOM', 'BALCONY', 'TERRACE', 'PARKING', 'CHANGE_DETECTION'];
  const baseCats = slots.map(s => {
    const nameFallback = s.photoTypeName || '';
    let nameVal = t ? getLocalizedCategoryName(s.photoTypeCode, nameFallback, t) : nameFallback;
    if (s.photoTypeCode?.toUpperCase() === 'PROPERTY_PHOTO' || s.photoTypeCode?.toUpperCase() === 'PROPERTY') {
      nameVal = tForm ? tForm('labels.assetPhoto') : 'Asset Photo';
    }
    return {
      photoTypeId: s.photoTypeId,
      photoTypeCode: s.photoTypeCode,
      photoTypeName: nameVal,
      isCustom: !systemCodes.includes(s.photoTypeCode.toUpperCase()),
      hasPhoto: s.hasPhoto,
      photoCount: s.photoCount,
      propertyPhotoId: s.propertyPhotoId,
      documentGuid: s.documentGuid,
      viewUrl: s.viewUrl,
    };
  });

  return baseCats.map(cat => {
    let catPhotos = uploadedPhotos
      .filter(p => p.photoTypeId === cat.photoTypeId)
      .sort((a, b) => {
        const diff = (a.displayOrder ?? 999) - (b.displayOrder ?? 999);
        if (diff !== 0) return diff;
        return (a.propertyPhotoId ?? 0) - (b.propertyPhotoId ?? 0);
      })
      .map(p => mapPropertyPhotoToAdditionalImage(p, cat.photoTypeName));

    const isFullyLoaded = fullyLoadedIds?.has(cat.photoTypeId);

    if (catPhotos.length === 0 && !isFullyLoaded && cat.hasPhoto && (cat.viewUrl || cat.documentGuid)) {
      const resolvedUrl = cat.documentGuid ? getViewDocumentUrl(cat.documentGuid) : cat.viewUrl;
      catPhotos = [{
        src: resolvedUrl || '',
        fullSrc: resolvedUrl || '',
        alt: cat.photoTypeName,
        title: cat.photoTypeName,
        photoTypeId: cat.photoTypeId,
        photoTypeCode: cat.photoTypeCode,
        propertyPhotoId: cat.propertyPhotoId,
        hasPhoto: true,
        documentGuid: cat.documentGuid?.toString(),
        downloadUrl: cat.documentGuid ? getDownloadDocumentUrl(cat.documentGuid.toString()) : (cat.viewUrl ? cat.viewUrl.replace('/view', '/download') : undefined),
      }];
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

    return {
      ...cat,
      images: catPhotos,
      ...(uploadedCDCount !== undefined ? { photoCount: uploadedCDCount } : {}),
    };
  });
}

export function mapGroupedResponseToCategories(
  groupedData: PropertyPhotoGalleryDto,
  t?: (key: string) => string,
  tForm?: (key: string) => string
): PhotoCategory[] {
  const systemCodes = ['FRONT', 'FLOOR', 'GIS', 'BACK', 'LIVING', 'KITCHEN', 'BEDROOM', 'BATHROOM', 'BALCONY', 'TERRACE', 'PARKING', 'CHANGE_DETECTION'];
  
  return (groupedData.photoTypes || []).map(group => {
    const nameFallback = group.photoTypeName || '';
    let nameVal = t ? getLocalizedCategoryName(group.photoTypeCode, nameFallback, t) : nameFallback;
    if (group.photoTypeCode?.toUpperCase() === 'PROPERTY_PHOTO' || group.photoTypeCode?.toUpperCase() === 'PROPERTY') {
      nameVal = tForm ? tForm('labels.assetPhoto') : 'Asset Photo';
    }
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
