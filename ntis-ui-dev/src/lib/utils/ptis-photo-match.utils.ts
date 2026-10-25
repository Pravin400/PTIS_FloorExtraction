import { getViewDocumentUrl } from './document-utils';
import { withCacheBuster } from './cache-buster';
import { PHOTO_TYPE_CODES } from '@/lib/constants/photo-type-codes';

export interface PhotoItemLike {
  photoTypeCode?: string | null;
  photoTypeName?: string | null;
  photoTypeId?: number | null;
  documentGuid?: string | number | null;
  viewUrl?: string | null;
  src?: string | null;
  fullSrc?: string | null;
  hasPhoto?: boolean | null;
  photoScope?: string | null;
}

/**
 * Checks whether a given photo type code and name represent a Property Front Photo.
 * Strictly excludes other property-scope media such as Photo Plans, Side Photos,
 * Inside Photos, Signboards, Amenities, GIS/Satellite, Signatures, Society & Wing photos.
 */
export function isPropertyFrontPhoto(
  itemOrCode?: PhotoItemLike | string | null,
  nameOrNull?: string | null
): boolean {
  if (!itemOrCode && !nameOrNull) return false;

  let code = '';
  let name = '';
  let scope = '';

  if (typeof itemOrCode === 'object' && itemOrCode !== null) {
    code = (itemOrCode.photoTypeCode || '').toUpperCase().trim();
    name = (itemOrCode.photoTypeName || '').toUpperCase().trim();
    scope = (itemOrCode.photoScope || '').toUpperCase().trim();
  } else {
    code = String(itemOrCode || '').toUpperCase().trim();
    name = String(nameOrNull || '').toUpperCase().trim();
  }

  // Exact PhotoTypeCode match
  if (code === PHOTO_TYPE_CODES.PROPERTY_FRONT) {
    return true;
  }

  // If explicitly society or wing scoped, it is not an individual property front photo
  if (scope === 'SOCIETY' || scope === 'WING') {
    return false;
  }

  // Explicit exclusions for non-front property media categories
  const excludedKeywords = [
    'PLAN',
    'SIDE',
    'INSIDE',
    'BOARD',
    'SIGN',
    'SIGNATURE',
    'AMENITY',
    'GIS',
    'SATELLITE',
    'FLOOR',
    'CHANGE_DETECTION',
    'SOCIETY',
    'WING',
    'OTHER',
    'TAX',
  ];

  for (const keyword of excludedKeywords) {
    if (code.includes(keyword) || name.includes(keyword)) {
      return false;
    }
  }

  // Positive match: Front photo type codes or names
  const isFrontCode =
    code === 'PROPERTY_FRONT' ||
    code === 'PROPERTY_FRONT_PHOTO' ||
    code === 'FRONT_PHOTO' ||
    code === 'PROPERTY_PHOTO' ||
    code === 'PROPERTY' ||
    code === 'FRONT' ||
    code.includes('FRONT');

  const isFrontName =
    name.includes('FRONT') ||
    name === 'PROPERTY PHOTO' ||
    name === 'PROPERTY FRONT PHOTO' ||
    name === 'FRONT PHOTO' ||
    name === 'PROPERTY FRONT';

  return isFrontCode || isFrontName;
}

/**
 * Checks whether a given photo represents an Amenity Photo (AMENITY_PHOTO).
 */
export function isAmenityPhoto(
  itemOrCode?: PhotoItemLike | string | null,
  nameOrNull?: string | null
): boolean {
  if (!itemOrCode && !nameOrNull) return false;

  let code = '';
  let name = '';

  if (typeof itemOrCode === 'object' && itemOrCode !== null) {
    code = (itemOrCode.photoTypeCode || '').toUpperCase().trim();
    name = (itemOrCode.photoTypeName || '').toUpperCase().trim();
  } else {
    code = String(itemOrCode || '').toUpperCase().trim();
    name = String(nameOrNull || '').toUpperCase().trim();
  }

  if (code === PHOTO_TYPE_CODES.AMENITY_PHOTO) {
    return true;
  }

  return (
    code === 'AMENITY' ||
    code.startsWith('AMENITY_') ||
    code.includes('AMENITY') ||
    name.includes('AMENITY')
  );
}

/**
 * Checks whether a given photo represents a Wing Building / Wing Photo (WING_BUILDING).
 */
export function isWingPhoto(
  itemOrCode?: PhotoItemLike | string | null,
  nameOrNull?: string | null
): boolean {
  if (!itemOrCode && !nameOrNull) return false;

  let code = '';
  let name = '';
  let scope = '';

  if (typeof itemOrCode === 'object' && itemOrCode !== null) {
    code = (itemOrCode.photoTypeCode || '').toUpperCase().trim();
    name = (itemOrCode.photoTypeName || '').toUpperCase().trim();
    scope = (itemOrCode.photoScope || '').toUpperCase().trim();
  } else {
    code = String(itemOrCode || '').toUpperCase().trim();
    name = String(nameOrNull || '').toUpperCase().trim();
  }

  if (code.includes('PLAN') || name.includes('PLAN')) {
    return false;
  }

  if (code === PHOTO_TYPE_CODES.WING_BUILDING) {
    return true;
  }

  return (
    scope === 'WING' ||
    code === 'WING_PHOTO' ||
    code === 'WING_BUILDING_PHOTO' ||
    code === 'WING' ||
    code.startsWith('WING_') ||
    name.includes('WING')
  );
}

/**
 * Checks whether a given photo represents a Society Place Photo (SOCIETY_PLACE).
 */
export function isSocietyPlacePhoto(
  itemOrCode?: PhotoItemLike | string | null,
  nameOrNull?: string | null
): boolean {
  if (!itemOrCode && !nameOrNull) return false;

  let code = '';
  let name = '';

  if (typeof itemOrCode === 'object' && itemOrCode !== null) {
    code = (itemOrCode.photoTypeCode || '').toUpperCase().trim();
    name = (itemOrCode.photoTypeName || '').toUpperCase().trim();
  } else {
    code = String(itemOrCode || '').toUpperCase().trim();
    name = String(nameOrNull || '').toUpperCase().trim();
  }

  if (code === PHOTO_TYPE_CODES.SOCIETY_PLACE) {
    return true;
  }

  return (
    code === 'SOCIETY_PLACE_PHOTO' ||
    (name.includes('SOCIETY') && name.includes('PLACE')) ||
    name === 'SOCIETY PLACE PHOTO'
  );
}

/**
 * Checks whether a given photo type code and name represent a Society Photo.
 * Matches Society Place, Society Building, Society Photo, Society Board, etc.
 */
export function isSocietyPhoto(
  itemOrCode?: PhotoItemLike | string | null,
  nameOrNull?: string | null
): boolean {
  if (!itemOrCode && !nameOrNull) return false;

  let code = '';
  let name = '';
  let scope = '';

  if (typeof itemOrCode === 'object' && itemOrCode !== null) {
    code = (itemOrCode.photoTypeCode || '').toUpperCase().trim();
    name = (itemOrCode.photoTypeName || '').toUpperCase().trim();
    scope = (itemOrCode.photoScope || '').toUpperCase().trim();
  } else {
    code = String(itemOrCode || '').toUpperCase().trim();
    name = String(nameOrNull || '').toUpperCase().trim();
  }

  if (code === PHOTO_TYPE_CODES.SOCIETY_PLACE) {
    return true;
  }

  if (scope === 'SOCIETY') {
    return true;
  }

  // Exclude individual unit photos or property plans
  if (
    code.startsWith('PROPERTY_') &&
    !code.includes('SOCIETY') &&
    (code.includes('FRONT') || code.includes('PLAN') || code.includes('SIDE') || code.includes('INSIDE'))
  ) {
    return false;
  }

  if (code.startsWith('WING_') || name.startsWith('WING')) {
    return false;
  }

  return (
    code.startsWith('SOCIETY_') ||
    code === 'SOCIETY' ||
    code.includes('SOCIETY') ||
    name.includes('SOCIETY')
  );
}

/**
 * Checks whether a given photo represents a Property Plan (PROPERTY_PLAN).
 */
export function isPropertyPlanPhoto(
  itemOrCode?: PhotoItemLike | string | null,
  nameOrNull?: string | null
): boolean {
  if (!itemOrCode && !nameOrNull) return false;

  let code = '';
  let name = '';

  if (typeof itemOrCode === 'object' && itemOrCode !== null) {
    code = (itemOrCode.photoTypeCode || '').toUpperCase().trim();
    name = (itemOrCode.photoTypeName || '').toUpperCase().trim();
  } else {
    code = String(itemOrCode || '').toUpperCase().trim();
    name = String(nameOrNull || '').toUpperCase().trim();
  }

  if (code === PHOTO_TYPE_CODES.PROPERTY_PLAN) {
    return true;
  }

  return (
    code === 'PROPERTY_PLAN_PHOTO' ||
    code === 'PHOTO_PLAN' ||
    code === 'DRAW_PLAN' ||
    code === 'PLAN' ||
    name === 'PROPERTY PLAN' ||
    name === 'PHOTO PLAN' ||
    name.includes('PROPERTY PLAN') ||
    name.includes('PHOTO PLAN')
  );
}

/**
 * Checks whether a photo matches any of the 5 primary property photo types:
 * 1. PROPERTY_FRONT
 * 2. SOCIETY_PLACE
 * 3. WING_BUILDING
 * 4. AMENITY_PHOTO
 * 5. PROPERTY_PLAN
 */
export function isPrimaryPropertyPhoto(
  itemOrCode?: PhotoItemLike | string | null,
  nameOrNull?: string | null
): boolean {
  if (!itemOrCode && !nameOrNull) return false;

  let code = '';

  if (typeof itemOrCode === 'object' && itemOrCode !== null) {
    code = (itemOrCode.photoTypeCode || '').toUpperCase().trim();
  } else {
    code = String(itemOrCode || '').toUpperCase().trim();
  }

  if (
    code === PHOTO_TYPE_CODES.PROPERTY_FRONT ||
    code === PHOTO_TYPE_CODES.SOCIETY_PLACE ||
    code === PHOTO_TYPE_CODES.WING_BUILDING ||
    code === PHOTO_TYPE_CODES.AMENITY_PHOTO ||
    code === PHOTO_TYPE_CODES.PROPERTY_PLAN
  ) {
    return true;
  }

  return (
    isPropertyFrontPhoto(itemOrCode, nameOrNull) ||
    isSocietyPlacePhoto(itemOrCode, nameOrNull) ||
    isWingPhoto(itemOrCode, nameOrNull) ||
    isAmenityPhoto(itemOrCode, nameOrNull) ||
    isPropertyPlanPhoto(itemOrCode, nameOrNull)
  );
}

/**
 * Filter that strictly ensures only the 5 allowed PhotoTypeCodes sync with the property details section:
 * - PROPERTY_FRONT
 * - SOCIETY_PLACE
 * - WING_BUILDING
 * - AMENITY_PHOTO
 * - PROPERTY_PLAN
 */
export function isSyncAllowedPhoto(
  itemOrCode?: PhotoItemLike | string | null,
  nameOrNull?: string | null
): boolean {
  return isPrimaryPropertyPhoto(itemOrCode, nameOrNull);
}

/**
 * Assigns priority ranking to society photo types:
 * 1. Society Place Photo
 * 2. Society Photo / Building
 * 3. Society Board / Signboard
 * 4. Other society photos
 */
export function getSocietyPhotoPriority(item: PhotoItemLike): number {
  const code = (item.photoTypeCode || '').toUpperCase().trim();
  const name = (item.photoTypeName || '').toUpperCase().trim();

  if (code === PHOTO_TYPE_CODES.SOCIETY_PLACE || code === 'SOCIETY_PLACE_PHOTO' || name.includes('PLACE')) {
    return 1;
  }
  if (
    code === 'SOCIETY_PHOTO' ||
    code === 'SOCIETY_BUILDING' ||
    code === 'SOCIETY' ||
    name.includes('PHOTO') ||
    name.includes('BUILDING')
  ) {
    return 2;
  }
  if (
    code === 'SOCIETY_BOARD' ||
    code === 'SOCIETY_BOARD_PHOTO' ||
    code === 'SOCIETY_SIGN_BOARD' ||
    code === 'SOCIETY_SIGNBOARD' ||
    name.includes('BOARD') ||
    name.includes('SIGN')
  ) {
    return 3;
  }
  if (isSocietyPhoto(item)) {
    return 4;
  }
  return 999;
}

/**
 * Resolves the primary Property Front Photo document GUID and URL dynamically.
 * Returns undefined if no Front Photo exists (strictly never falls back to Plan, Signature, etc.).
 */
export function resolvePropertyFrontPhoto(
  initialPhotos?: unknown,
  initialPhotoSlots?: unknown
): { guid?: string; url?: string } {
  const photoList = (Array.isArray(initialPhotos) ? initialPhotos : []) as PhotoItemLike[];
  const slotList = (Array.isArray(initialPhotoSlots) ? initialPhotoSlots : []) as PhotoItemLike[];

  // 1. Check actual photos first for Property Front Photo
  const matchingPhoto = photoList.find((p) => isPropertyFrontPhoto(p) && (p.documentGuid || p.viewUrl || p.src));
  if (matchingPhoto) {
    const guid = matchingPhoto.documentGuid ? String(matchingPhoto.documentGuid) : undefined;
    const url = matchingPhoto.viewUrl || matchingPhoto.src || matchingPhoto.fullSrc || (guid ? getViewDocumentUrl(guid) : undefined);
    return { guid, url };
  }

  // 2. Check slots with uploaded photo for Property Front Photo
  const matchingSlot = slotList.find(
    (s) => Boolean(s.hasPhoto) && isPropertyFrontPhoto(s) && (s.documentGuid || s.viewUrl || s.src)
  );
  if (matchingSlot) {
    const guid = matchingSlot.documentGuid ? String(matchingSlot.documentGuid) : undefined;
    const url = matchingSlot.viewUrl || matchingSlot.src || matchingSlot.fullSrc || (guid ? getViewDocumentUrl(guid) : undefined);
    return { guid, url };
  }

  // Return undefined — no fallback to other property photo categories
  return { guid: undefined, url: undefined };
}

/**
 * Resolves the Amenity Photo document GUID and URL dynamically.
 */
export function resolveAmenityPhoto(
  initialPhotos?: unknown,
  initialPhotoSlots?: unknown
): { guid?: string; url?: string } {
  const photoList = (Array.isArray(initialPhotos) ? initialPhotos : []) as PhotoItemLike[];
  const slotList = (Array.isArray(initialPhotoSlots) ? initialPhotoSlots : []) as PhotoItemLike[];

  const matchingPhoto = photoList.find((p) => isAmenityPhoto(p) && (p.documentGuid || p.viewUrl || p.src));
  if (matchingPhoto) {
    const guid = matchingPhoto.documentGuid ? String(matchingPhoto.documentGuid) : undefined;
    const url = matchingPhoto.viewUrl || matchingPhoto.src || matchingPhoto.fullSrc || (guid ? getViewDocumentUrl(guid) : undefined);
    return { guid, url };
  }

  const matchingSlot = slotList.find(
    (s) => Boolean(s.hasPhoto) && isAmenityPhoto(s) && (s.documentGuid || s.viewUrl || s.src)
  );
  if (matchingSlot) {
    const guid = matchingSlot.documentGuid ? String(matchingSlot.documentGuid) : undefined;
    const url = matchingSlot.viewUrl || matchingSlot.src || matchingSlot.fullSrc || (guid ? getViewDocumentUrl(guid) : undefined);
    return { guid, url };
  }

  return { guid: undefined, url: undefined };
}

/**
 * Resolves the Wing Photo document GUID and URL dynamically.
 */
export function resolveWingPhoto(
  initialPhotos?: unknown,
  initialPhotoSlots?: unknown
): { guid?: string; url?: string } {
  const photoList = (Array.isArray(initialPhotos) ? initialPhotos : []) as PhotoItemLike[];
  const slotList = (Array.isArray(initialPhotoSlots) ? initialPhotoSlots : []) as PhotoItemLike[];

  const matchingPhoto = photoList.find((p) => isWingPhoto(p) && (p.documentGuid || p.viewUrl || p.src));
  if (matchingPhoto) {
    const guid = matchingPhoto.documentGuid ? String(matchingPhoto.documentGuid) : undefined;
    const url = matchingPhoto.viewUrl || matchingPhoto.src || matchingPhoto.fullSrc || (guid ? getViewDocumentUrl(guid) : undefined);
    return { guid, url };
  }

  const matchingSlot = slotList.find(
    (s) => Boolean(s.hasPhoto) && isWingPhoto(s) && (s.documentGuid || s.viewUrl || s.src)
  );
  if (matchingSlot) {
    const guid = matchingSlot.documentGuid ? String(matchingSlot.documentGuid) : undefined;
    const url = matchingSlot.viewUrl || matchingSlot.src || matchingSlot.fullSrc || (guid ? getViewDocumentUrl(guid) : undefined);
    return { guid, url };
  }

  return { guid: undefined, url: undefined };
}

/**
 * Resolves the Society Photo document GUID and URL dynamically.
 * Prioritizes Society Place Photo > Society Photo > Society Board Photo.
 * Returns undefined if no Society Photo exists.
 */
export function resolveSocietyPhoto(
  initialPhotos?: unknown,
  initialPhotoSlots?: unknown
): { guid?: string; url?: string } {
  const photoList = (Array.isArray(initialPhotos) ? initialPhotos : []) as PhotoItemLike[];
  const slotList = (Array.isArray(initialPhotoSlots) ? initialPhotoSlots : []) as PhotoItemLike[];

  const validPhotos = photoList.filter((p) => isSocietyPhoto(p) && (p.documentGuid || p.viewUrl || p.src));
  const validSlots = slotList.filter(
    (s) => Boolean(s.hasPhoto) && isSocietyPhoto(s) && (s.documentGuid || s.viewUrl || s.src)
  );

  const allSocietyCandidates = [...validPhotos, ...validSlots].sort(
    (a, b) => getSocietyPhotoPriority(a) - getSocietyPhotoPriority(b)
  );

  const bestMatch = allSocietyCandidates[0];
  if (bestMatch) {
    const guid = bestMatch.documentGuid ? String(bestMatch.documentGuid) : undefined;
    const url = bestMatch.viewUrl || bestMatch.src || bestMatch.fullSrc || (guid ? getViewDocumentUrl(guid) : undefined);
    return { guid, url };
  }

  return { guid: undefined, url: undefined };
}

/**
 * Resolves the primary photo document GUID and URL across all 4 primary types:
 * PROPERTY_FRONT (1), SOCIETY_PLACE (5), WING_BUILDING (8), AMENITY_PHOTO (12/14).
 */
export function resolvePrimaryPropertyPhoto(
  initialPhotos?: unknown,
  initialPhotoSlots?: unknown,
  options?: { isAmenity?: boolean; isSociety?: boolean; isWing?: boolean }
): { guid?: string; url?: string } {
  if (options?.isAmenity) {
    const amenity = resolveAmenityPhoto(initialPhotos, initialPhotoSlots);
    if (amenity.guid || amenity.url) return amenity;
  }

  if (options?.isSociety) {
    const soc = resolveSocietyPhoto(initialPhotos, initialPhotoSlots);
    if (soc.guid || soc.url) return soc;
  }

  if (options?.isWing) {
    const wing = resolveWingPhoto(initialPhotos, initialPhotoSlots);
    if (wing.guid || wing.url) return wing;
  }

  // Check front photo first
  const front = resolvePropertyFrontPhoto(initialPhotos, initialPhotoSlots);
  if (front.guid || front.url) return front;

  // Check amenity photo
  const amenity = resolveAmenityPhoto(initialPhotos, initialPhotoSlots);
  if (amenity.guid || amenity.url) return amenity;

  // Check wing photo
  const wing = resolveWingPhoto(initialPhotos, initialPhotoSlots);
  if (wing.guid || wing.url) return wing;

  // Check society photo
  const soc = resolveSocietyPhoto(initialPhotos, initialPhotoSlots);
  if (soc.guid || soc.url) return soc;

  return { guid: undefined, url: undefined };
}

export interface MediaUpdateResult {
  photoGuid?: string;
  imageUrl?: string;
  isDeleted: boolean;
}

/**
 * Parses custom media update event payloads and produces unified photoGuid, imageUrl, and deletion status.
 */
export function parseMediaEventPayload(detail: unknown): MediaUpdateResult {
  const d = typeof detail === 'object' && detail !== null ? (detail as Record<string, unknown>) : {};
  const docGuid = d.documentGuid != null && d.documentGuid !== '' ? String(d.documentGuid) : undefined;
  const pUrl = typeof d.photoUrl === 'string' ? d.photoUrl : (typeof d.viewUrl === 'string' ? d.viewUrl : undefined);
  const isDeleted = Boolean(d.isDeleted || d.deleted || (!docGuid && !pUrl));

  if (isDeleted || (!docGuid && !pUrl)) {
    return { isDeleted: true };
  }

  const timestamp = Date.now();
  if (docGuid) {
    const baseDocUrl = getViewDocumentUrl(docGuid);
    const resolvedUrl = withCacheBuster(pUrl || baseDocUrl, timestamp);
    return { photoGuid: docGuid, imageUrl: resolvedUrl, isDeleted: false };
  }

  const resolvedUrl = withCacheBuster(pUrl!, timestamp);
  return { imageUrl: resolvedUrl, isDeleted: false };
}

