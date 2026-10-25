/**
 * Standard Photo Type Codes based on `ptis.PropertyPhotoType`.
 * Used for identifying photo slots, cards, and event synchronizations.
 */
export const PHOTO_TYPE_CODES = {
  PROPERTY_FRONT: 'PROPERTY_FRONT',
  SOCIETY_PLACE: 'SOCIETY_PLACE',
  WING_BUILDING: 'WING_BUILDING',
  AMENITY_PHOTO: 'AMENITY_PHOTO',
  PROPERTY_PLAN: 'PROPERTY_PLAN',
} as const;

export type PhotoTypeCode = (typeof PHOTO_TYPE_CODES)[keyof typeof PHOTO_TYPE_CODES];

export const ALLOWED_SYNC_PHOTO_TYPE_CODES = new Set<string>([
  PHOTO_TYPE_CODES.PROPERTY_FRONT,
  PHOTO_TYPE_CODES.SOCIETY_PLACE,
  PHOTO_TYPE_CODES.WING_BUILDING,
  PHOTO_TYPE_CODES.AMENITY_PHOTO,
  PHOTO_TYPE_CODES.PROPERTY_PLAN,
]);
