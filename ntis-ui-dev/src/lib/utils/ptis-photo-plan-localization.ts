import type { PhotoCategory } from '@/components/modules/property-tax/ptis/media/PhotoPlanSidebar';
import type { AdditionalImage } from '@/components/modules/property-tax/ptis/media/MediaImageCards';

/**
 * Maps system photo type codes and fallback names to localized translation keys in ptis.json (media.*).
 * Uses the next-intl translation function 't'.
 */
export function getLocalizedCategoryName(
  code: string,
  fallbackName: string,
  t: (key: string) => string
): string {
  const codeUpper = (code || '').toUpperCase().trim();
  const fallbackLower = (fallbackName || '').toLowerCase().trim();

  const mapping: Record<string, string> = {
    PROPERTY_PHOTO: 'media.propertyPhoto',
    PROPERTY: 'media.propertyPhoto',
    PROPERTY_FRONT_PHOTO: 'media.propertyFrontPhoto',
    PROPERTY_FRONT: 'media.propertyFrontPhoto',
    FRONT_PHOTO: 'media.propertyFrontPhoto',
    FRONT: 'media.buildingPhoto',
    PROPERTY_SIDE_PHOTO: 'media.propertySidePhoto',
    PROPERTY_SIDE: 'media.propertySidePhoto',
    SIDE_PHOTO: 'media.propertySidePhoto',
    PROPERTY_INSIDE_PHOTO: 'media.propertyInsidePhoto',
    PROPERTY_INSIDE: 'media.propertyInsidePhoto',
    INSIDE_PHOTO: 'media.propertyInsidePhoto',
    PROPERTY_BOARD_PHOTO: 'media.propertyBoardPhoto',
    PROPERTY_BOARD: 'media.propertyBoardPhoto',
    BOARD_PHOTO: 'media.propertyBoardPhoto',
    AMENITY_PHOTO: 'media.amenityPhoto',
    AMENITY: 'media.amenityPhoto',
    SOCIETY_PHOTO: 'media.societyPhoto',
    SOCIETY: 'media.societyPhoto',
    WING_PHOTO: 'media.wingPhoto',
    WING: 'media.wingPhoto',
    PROPERTY_PLAN: 'media.photoPlan',
    'PROPERTY PLAN': 'media.photoPlan',
    PROPERTYPLAN: 'media.photoPlan',
    PHOTO_PLAN: 'media.photoPlan',
    'PHOTO PLAN': 'media.photoPlan',
    PHOTOPLAN: 'media.photoPlan',
    BUILDING: 'media.buildingPhoto',
    BUILDING_PHOTO: 'media.buildingPhoto',
    WING_BUILDING: 'media.wingBuildingPhoto',
    WING_BUILDING_PHOTO: 'media.wingBuildingPhoto',
    WING_PLACE: 'media.wingPlacePhoto',
    WING_PLACE_PHOTO: 'media.wingPlacePhoto',
    WING_BOARD: 'media.wingBoardPhoto',
    WING_BOARD_PHOTO: 'media.wingBoardPhoto',
    WING_SIGN_BOARD: 'media.wingSignBoardPhoto',
    WING_SIGN_BOARD_PHOTO: 'media.wingSignBoardPhoto',
    WING_SIGNBOARD: 'media.wingSignBoardPhoto',
    SOCIETY_PLACE: 'media.societyPlacePhoto',
    SOCIETY_PLACE_PHOTO: 'media.societyPlacePhoto',
    SOCIETY_BOARD: 'media.societyBoardPhoto',
    SOCIETY_BOARD_PHOTO: 'media.societyBoardPhoto',
    SOCIETY_SIGN_BOARD: 'media.societySignBoardPhoto',
    SOCIETY_SIGN_BOARD_PHOTO: 'media.societySignBoardPhoto',
    SOCIETY_SIGNBOARD: 'media.societySignBoardPhoto',
    FLOOR: 'media.floorPlan',
    GIS: 'media.satelliteView',
    BACK: 'media.rearElevation',
    LIVING: 'media.livingRoom',
    KITCHEN: 'media.kitchen',
    BEDROOM: 'media.bedroom',
    BATHROOM: 'media.bathroom',
    BALCONY: 'media.balcony',
    TERRACE: 'media.terraceView',
    PARKING: 'media.parkingView',
    SIGN_BOARD: 'media.signBoardPhoto',
    SIGN_BOARD_PHOTO: 'media.signBoardPhoto',
    SIGNBOARD: 'media.signBoardPhoto',
    ADVERTISEMENT: 'media.advertisementBoardPhoto',
    ADVERTISEMENT_BOARD: 'media.advertisementBoardPhoto',
    ADVERTISEMENT_BOARD_PHOTO: 'media.advertisementBoardPhoto',
    OWNER_SIGNATURE: 'media.ownerSignaturePhoto',
    OWNER_SIGNATURE_PHOTO: 'media.ownerSignaturePhoto',
    SIGNATURE: 'media.ownerSignaturePhoto',
    OTHER: 'media.otherPhoto',
    OTHER_PHOTO: 'media.otherPhoto',
    CHANGE_DETECTION: 'media.changeDetection',
  };

  const nameMapping: Record<string, string> = {
    'property front photo': 'media.propertyFrontPhoto',
    'property side photo': 'media.propertySidePhoto',
    'property inside photo': 'media.propertyInsidePhoto',
    'property board photo': 'media.propertyBoardPhoto',
    'photo plan': 'media.photoPlan',
    'property plan': 'media.photoPlan',
    'amenity photo': 'media.amenityPhoto',
    'society photo': 'media.societyPhoto',
    'society place photo': 'media.societyPlacePhoto',
    'society board photo': 'media.societyBoardPhoto',
    'society sign board photo': 'media.societySignBoardPhoto',
    'wing photo': 'media.wingPhoto',
    'wing building photo': 'media.wingBuildingPhoto',
    'wing place photo': 'media.wingPlacePhoto',
    'wing board photo': 'media.wingBoardPhoto',
    'wing sign board photo': 'media.wingSignBoardPhoto',
    'property photo': 'media.propertyPhoto',
    'change detection': 'media.changeDetection',
    'gis / satellite view': 'media.satelliteView',
    'satellite view': 'media.satelliteView',
    'building photo': 'media.buildingPhoto',
  };

  const key = mapping[codeUpper] || nameMapping[fallbackLower];

  if (key) {
    try {
      const hasKey =
        typeof (t as unknown as { has?: (k: string) => boolean }).has === 'function'
          ? !!(t as unknown as { has: (k: string) => boolean }).has(key)
          : true;
      if (hasKey) {
        const val = t(key);
        if (val && val !== key) {
          return val;
        }
      }
    } catch {
      // Fallback if key is missing in translation file
    }
  }
  return fallbackName;
}

/**
 * Returns the standard English category/slot name for a given photoTypeCode.
 * If the code is not standard, it defaults to the fallbackName.
 */
export function getEnglishCategoryName(code: string, fallbackName: string): string {
  if (!code) return fallbackName;
  const codeUpper = code.toUpperCase();
  const mapping: Record<string, string> = {
    PROPERTY_PHOTO: 'Property Photo',
    PROPERTY: 'Property Photo',
    PROPERTY_FRONT_PHOTO: 'Property Front Photo',
    PROPERTY_SIDE_PHOTO: 'Property Side Photo',
    PROPERTY_INSIDE_PHOTO: 'Property Inside Photo',
    PROPERTY_BOARD_PHOTO: 'Property Board Photo',
    AMENITY_PHOTO: 'Amenity Photo',
    SOCIETY_PHOTO: 'Society Photo',
    WING_PHOTO: 'Wing Photo',
    PROPERTY_PLAN: 'Property Plan',
    'PROPERTY PLAN': 'Property Plan',
    PROPERTYPLAN: 'Property Plan',
    PHOTO_PLAN: 'Photo Plan',
    'PHOTO PLAN': 'Photo Plan',
    PHOTOPLAN: 'Photo Plan',
    BUILDING: 'Building Photo',
    BUILDING_PHOTO: 'Building Photo',
    WING_BUILDING: 'Wing Building Photo',
    WING_BUILDING_PHOTO: 'Wing Building Photo',
    WING_PLACE: 'Wing Place Photo',
    WING_PLACE_PHOTO: 'Wing Place Photo',
    WING_BOARD: 'Wing Board Photo',
    WING_BOARD_PHOTO: 'Wing Board Photo',
    WING_SIGN_BOARD: 'Wing Sign Board Photo',
    WING_SIGN_BOARD_PHOTO: 'Wing Sign Board Photo',
    WING_SIGNBOARD: 'Wing Sign Board Photo',
    SOCIETY_PLACE: 'Society Place Photo',
    SOCIETY_PLACE_PHOTO: 'Society Place Photo',
    SOCIETY_BOARD: 'Society Board Photo',
    SOCIETY_BOARD_PHOTO: 'Society Board Photo',
    SOCIETY_SIGN_BOARD: 'Society Sign Board Photo',
    SOCIETY_SIGN_BOARD_PHOTO: 'Society Sign Board Photo',
    SOCIETY_SIGNBOARD: 'Society Sign Board Photo',
    FRONT: 'Building Photo',
    FLOOR: 'Floor Plan',
    GIS: 'GIS / Satellite View',
    BACK: 'Rear Elevation',
    LIVING: 'Living Room',
    KITCHEN: 'Kitchen',
    BEDROOM: 'Bedroom',
    BATHROOM: 'Bathroom',
    BALCONY: 'Balcony',
    TERRACE: 'Terrace View',
    PARKING: 'Parking View',
    SIGN_BOARD: 'Sign Board Photo',
    SIGN_BOARD_PHOTO: 'Sign Board Photo',
    SIGNBOARD: 'Sign Board Photo',
    ADVERTISEMENT: 'Advertisement Board Photo',
    ADVERTISEMENT_BOARD: 'Advertisement Board Photo',
    ADVERTISEMENT_BOARD_PHOTO: 'Advertisement Board Photo',
    OWNER_SIGNATURE: 'Owner Signature Photo',
    OWNER_SIGNATURE_PHOTO: 'Owner Signature Photo',
    SIGNATURE: 'Owner Signature Photo',
    OTHER: 'Other Photo',
    OTHER_PHOTO: 'Other Photo',
    CHANGE_DETECTION: 'Change Detection',
  };
  return mapping[codeUpper] || fallbackName;
}

export function patchCategory(
  cats: PhotoCategory[],
  idx: number,
  images: AdditionalImage[]
): PhotoCategory[] {
  return cats.map((c, i) => (i === idx ? { ...c, images, photoCount: images.length } : c));
}

export function sortByOrder(imgs: AdditionalImage[]): AdditionalImage[] {
  return [...imgs].sort((a, b) => {
    const diff = (a.displayOrder ?? 999) - (b.displayOrder ?? 999);
    if (diff !== 0) return diff;
    return (a.propertyPhotoId ?? 0) - (b.propertyPhotoId ?? 0);
  });
}

export function hasCategoryChanged(cached: PhotoCategory, incoming: PhotoCategory): boolean {
  if (cached.images.length !== incoming.images.length) return true;
  return cached.images.some((img, i) => {
    const next = incoming.images[i];
    return !next || img.propertyPhotoId !== next.propertyPhotoId || img.src !== next.src;
  });
}

export function mergeCategories(prev: PhotoCategory[], incoming: PhotoCategory[]): PhotoCategory[] {
  return incoming.map((inc) => {
    const existing = prev.find((p) => p.photoTypeId === inc.photoTypeId);
    if (!existing || hasCategoryChanged(existing, inc)) return { ...inc, images: inc.images || [] };
    return existing;
  });
}

export function areCategoriesEqual(a: PhotoCategory[], b: PhotoCategory[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;

  return a.every((cat, i) => {
    const other = b[i];
    if (!other) return false;

    if (cat.photoTypeId !== other.photoTypeId) return false;
    if (cat.photoTypeCode !== other.photoTypeCode) return false;
    if (cat.photoTypeName !== other.photoTypeName) return false;

    if (cat.images.length !== other.images.length) return false;

    return cat.images.every((img, j) => {
      const oImg = other.images[j];
      return (
        img.propertyPhotoId === oImg?.propertyPhotoId &&
        img.src === oImg?.src &&
        img.fullSrc === oImg?.fullSrc &&
        img.hasPhoto === oImg?.hasPhoto &&
        img.displayOrder === oImg?.displayOrder &&
        img.title === oImg?.title &&
        img.alt === oImg?.alt &&
        img.remarks === oImg?.remarks &&
        img.documentGuid === oImg?.documentGuid &&
        img.downloadUrl === oImg?.downloadUrl
      );
    });
  });
}
