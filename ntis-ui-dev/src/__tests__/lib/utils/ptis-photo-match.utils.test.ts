import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isPropertyFrontPhoto,
  isSocietyPhoto,
  isAmenityPhoto,
  isWingPhoto,
  isSocietyPlacePhoto,
  isPrimaryPropertyPhoto,
  getSocietyPhotoPriority,
  resolvePropertyFrontPhoto,
  resolveAmenityPhoto,
  resolveSocietyPhoto,
  resolvePrimaryPropertyPhoto,
} from '@/lib/utils/ptis-photo-match.utils';

vi.mock('@/lib/utils/document-utils', () => ({
  getViewDocumentUrl: (guid: string) => `https://test.docs.com/view/${guid}`,
}));

describe('ptis-photo-match.utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isPropertyFrontPhoto', () => {
    it('returns true for front photo codes and names', () => {
      expect(isPropertyFrontPhoto('PROPERTY_FRONT')).toBe(true);
      expect(isPropertyFrontPhoto('PROPERTY_FRONT_PHOTO')).toBe(true);
      expect(isPropertyFrontPhoto('FRONT_PHOTO')).toBe(true);
      expect(isPropertyFrontPhoto('PROPERTY_PHOTO')).toBe(true);
      expect(isPropertyFrontPhoto('FRONT')).toBe(true);
      expect(isPropertyFrontPhoto({ photoTypeCode: 'PROPERTY_FRONT', photoTypeName: 'Property Front Photo' })).toBe(true);
      expect(isPropertyFrontPhoto({ photoTypeCode: 'FRONT', photoTypeName: 'Front View' })).toBe(true);
      expect(isPropertyFrontPhoto({ photoTypeName: 'Property Front Photo' })).toBe(true);
    });

    it('returns false for other property-scope photos', () => {
      expect(isPropertyFrontPhoto('PHOTO_PLAN')).toBe(false);
      expect(isPropertyFrontPhoto('PROPERTY_PLAN')).toBe(false);
      expect(isPropertyFrontPhoto({ photoTypeCode: 'PHOTO_PLAN', photoTypeName: 'Photo Plan' })).toBe(false);
      expect(isPropertyFrontPhoto({ photoTypeCode: 'PROPERTY_SIDE', photoTypeName: 'Property Side Photo' })).toBe(false);
      expect(isPropertyFrontPhoto({ photoTypeCode: 'PROPERTY_INSIDE', photoTypeName: 'Property Inside Photo' })).toBe(false);
      expect(isPropertyFrontPhoto({ photoTypeCode: 'PROPERTY_BOARD', photoTypeName: 'Property Board Photo' })).toBe(false);
      expect(isPropertyFrontPhoto({ photoTypeCode: 'OWNER_SIGNATURE', photoTypeName: 'Owner Signature' })).toBe(false);
      expect(isPropertyFrontPhoto({ photoTypeCode: 'GIS', photoTypeName: 'Satellite View' })).toBe(false);
      expect(isPropertyFrontPhoto({ photoTypeCode: 'FLOOR', photoTypeName: 'Floor Plan' })).toBe(false);
      expect(isPropertyFrontPhoto({ photoTypeCode: 'AMENITY_PHOTO', photoTypeName: 'Amenity Photo' })).toBe(false);
      expect(isPropertyFrontPhoto({ photoTypeCode: 'OTHER', photoTypeName: 'Other Photo' })).toBe(false);
    });

    it('returns false for society and wing scoped photos', () => {
      expect(isPropertyFrontPhoto('SOCIETY_PLACE_PHOTO')).toBe(false);
      expect(isPropertyFrontPhoto('SOCIETY_PHOTO')).toBe(false);
      expect(isPropertyFrontPhoto('WING_BUILDING')).toBe(false);
      expect(isPropertyFrontPhoto({ photoTypeCode: 'FRONT', photoScope: 'SOCIETY' })).toBe(false);
      expect(isPropertyFrontPhoto({ photoTypeCode: 'FRONT', photoScope: 'WING' })).toBe(false);
    });

    it('returns false for empty or null inputs', () => {
      expect(isPropertyFrontPhoto(null)).toBe(false);
      expect(isPropertyFrontPhoto(undefined)).toBe(false);
      expect(isPropertyFrontPhoto('')).toBe(false);
    });
  });

  describe('isAmenityPhoto', () => {
    it('returns true for amenity photo types and codes', () => {
      expect(isAmenityPhoto('AMENITY_PHOTO')).toBe(true);
      expect(isAmenityPhoto({ photoTypeCode: 'AMENITY_PHOTO', photoTypeName: 'Amenity Photo' })).toBe(true);
      expect(isAmenityPhoto({ photoTypeName: 'Amenity Details' })).toBe(true);
    });

    it('returns false for non-amenity photos', () => {
      expect(isAmenityPhoto('PROPERTY_FRONT')).toBe(false);
      expect(isAmenityPhoto('SOCIETY_PLACE')).toBe(false);
      expect(isAmenityPhoto(null)).toBe(false);
    });
  });

  describe('isWingPhoto', () => {
    it('returns true for wing photo types and codes', () => {
      expect(isWingPhoto('WING_BUILDING')).toBe(true);
      expect(isWingPhoto('WING_PHOTO')).toBe(true);
      expect(isWingPhoto({ photoTypeCode: 'WING_BUILDING', photoTypeName: 'Wing Building' })).toBe(true);
      expect(isWingPhoto({ photoScope: 'WING' })).toBe(true);
    });

    it('returns false for non-wing photos', () => {
      expect(isWingPhoto('PROPERTY_FRONT')).toBe(false);
      expect(isWingPhoto('SOCIETY_PLACE')).toBe(false);
      expect(isWingPhoto(null)).toBe(false);
    });
  });

  describe('isSocietyPlacePhoto', () => {
    it('returns true for society place photo types and codes', () => {
      expect(isSocietyPlacePhoto('SOCIETY_PLACE')).toBe(true);
      expect(isSocietyPlacePhoto('SOCIETY_PLACE_PHOTO')).toBe(true);
      expect(isSocietyPlacePhoto({ photoTypeCode: 'SOCIETY_PLACE', photoTypeName: 'Society Place Photo' })).toBe(true);
    });

    it('returns false for other photo types', () => {
      expect(isSocietyPlacePhoto('PROPERTY_FRONT')).toBe(false);
      expect(isSocietyPlacePhoto('WING_BUILDING')).toBe(false);
      expect(isSocietyPlacePhoto(null)).toBe(false);
    });
  });

  describe('isPrimaryPropertyPhoto', () => {
    it('returns true for the 5 sync allowed photo type codes (PROPERTY_FRONT, SOCIETY_PLACE, WING_BUILDING, AMENITY_PHOTO, PROPERTY_PLAN)', () => {
      expect(isPrimaryPropertyPhoto('PROPERTY_FRONT')).toBe(true);
      expect(isPrimaryPropertyPhoto('SOCIETY_PLACE')).toBe(true);
      expect(isPrimaryPropertyPhoto('WING_BUILDING')).toBe(true);
      expect(isPrimaryPropertyPhoto('AMENITY_PHOTO')).toBe(true);
      expect(isPrimaryPropertyPhoto('PROPERTY_PLAN')).toBe(true);
      expect(isPrimaryPropertyPhoto({ photoTypeCode: 'PROPERTY_FRONT' })).toBe(true);
      expect(isPrimaryPropertyPhoto({ photoTypeCode: 'SOCIETY_PLACE' })).toBe(true);
      expect(isPrimaryPropertyPhoto({ photoTypeCode: 'WING_BUILDING' })).toBe(true);
      expect(isPrimaryPropertyPhoto({ photoTypeCode: 'AMENITY_PHOTO' })).toBe(true);
      expect(isPrimaryPropertyPhoto({ photoTypeCode: 'PROPERTY_PLAN' })).toBe(true);
    });

    it('returns false for secondary or excluded media', () => {
      expect(isPrimaryPropertyPhoto('PROPERTY_SIDE')).toBe(false);
      expect(isPrimaryPropertyPhoto('PROPERTY_INSIDE')).toBe(false);
      expect(isPrimaryPropertyPhoto('GIS')).toBe(false);
      expect(isPrimaryPropertyPhoto('OWNER_SIGNATURE')).toBe(false);
      expect(isPrimaryPropertyPhoto(null)).toBe(false);
    });
  });

  describe('isSocietyPhoto', () => {
    it('returns true for society photo codes and names', () => {
      expect(isSocietyPhoto('SOCIETY_PLACE')).toBe(true);
      expect(isSocietyPhoto('SOCIETY_PLACE_PHOTO')).toBe(true);
      expect(isSocietyPhoto('SOCIETY_PHOTO')).toBe(true);
      expect(isSocietyPhoto('SOCIETY_BUILDING')).toBe(true);
      expect(isSocietyPhoto('SOCIETY_BOARD')).toBe(true);
      expect(isSocietyPhoto('SOCIETY_BOARD_PHOTO')).toBe(true);
      expect(isSocietyPhoto('SOCIETY_SIGN_BOARD')).toBe(true);
      expect(isSocietyPhoto('SOCIETY')).toBe(true);
      expect(isSocietyPhoto({ photoTypeCode: 'SOCIETY_PLACE', photoTypeName: 'Society Place Photo' })).toBe(true);
      expect(isSocietyPhoto({ photoScope: 'SOCIETY' })).toBe(true);
    });

    it('returns false for individual property photos and wing photos', () => {
      expect(isSocietyPhoto('PROPERTY_FRONT')).toBe(false);
      expect(isSocietyPhoto('PROPERTY_FRONT_PHOTO')).toBe(false);
      expect(isSocietyPhoto('PHOTO_PLAN')).toBe(false);
      expect(isSocietyPhoto('PROPERTY_PLAN')).toBe(false);
      expect(isSocietyPhoto('WING_BUILDING')).toBe(false);
      expect(isSocietyPhoto('WING_PHOTO')).toBe(false);
    });
  });

  describe('getSocietyPhotoPriority', () => {
    it('ranks Society Place Photo as highest priority (1)', () => {
      expect(getSocietyPhotoPriority({ photoTypeCode: 'SOCIETY_PLACE' })).toBe(1);
      expect(getSocietyPhotoPriority({ photoTypeCode: 'SOCIETY_PLACE_PHOTO' })).toBe(1);
      expect(getSocietyPhotoPriority({ photoTypeName: 'Society Place Photo' })).toBe(1);
    });

    it('ranks Society Building / Photo as priority 2', () => {
      expect(getSocietyPhotoPriority({ photoTypeCode: 'SOCIETY_PHOTO' })).toBe(2);
      expect(getSocietyPhotoPriority({ photoTypeCode: 'SOCIETY_BUILDING' })).toBe(2);
      expect(getSocietyPhotoPriority({ photoTypeCode: 'SOCIETY' })).toBe(2);
    });

    it('ranks Society Board Photo as priority 3', () => {
      expect(getSocietyPhotoPriority({ photoTypeCode: 'SOCIETY_BOARD' })).toBe(3);
      expect(getSocietyPhotoPriority({ photoTypeCode: 'SOCIETY_BOARD_PHOTO' })).toBe(3);
      expect(getSocietyPhotoPriority({ photoTypeCode: 'SOCIETY_SIGN_BOARD' })).toBe(3);
    });
  });

  describe('resolvePropertyFrontPhoto', () => {
    it('maps only property front photo when available', () => {
      const photos = [
        { photoTypeCode: 'PHOTO_PLAN', documentGuid: 'plan-guid-1' },
        { photoTypeCode: 'PROPERTY_FRONT', documentGuid: 'front-guid-1' },
        { photoTypeCode: 'PROPERTY_SIDE', documentGuid: 'side-guid-1' },
      ];

      const res = resolvePropertyFrontPhoto(photos, []);
      expect(res.guid).toBe('front-guid-1');
      expect(res.url).toBe('https://test.docs.com/view/front-guid-1');
    });

    it('returns undefined if only other property photos exist (never falls back to photo plan or side photo)', () => {
      const photos = [
        { photoTypeCode: 'PHOTO_PLAN', photoTypeName: 'Photo Plan', documentGuid: 'plan-guid-1' },
        { photoTypeCode: 'PROPERTY_SIDE', photoTypeName: 'Property Side', documentGuid: 'side-guid-1' },
        { photoTypeCode: 'OWNER_SIGNATURE', photoTypeName: 'Owner Signature', documentGuid: 'sig-guid-1' },
      ];

      const res = resolvePropertyFrontPhoto(photos, []);
      expect(res.guid).toBeUndefined();
      expect(res.url).toBeUndefined();
    });

    it('resolves from photo slots if matching front photo exists with hasPhoto true', () => {
      const slots = [
        { photoTypeCode: 'PHOTO_PLAN', hasPhoto: true, documentGuid: 'plan-guid-1' },
        { photoTypeCode: 'PROPERTY_FRONT_PHOTO', hasPhoto: true, documentGuid: 'slot-front-guid' },
      ];

      const res = resolvePropertyFrontPhoto([], slots);
      expect(res.guid).toBe('slot-front-guid');
      expect(res.url).toBe('https://test.docs.com/view/slot-front-guid');
    });

    it('returns undefined when photos and slots are empty', () => {
      const res = resolvePropertyFrontPhoto([], []);
      expect(res.guid).toBeUndefined();
      expect(res.url).toBeUndefined();
    });
  });

  describe('resolveAmenityPhoto', () => {
    it('resolves amenity photo correctly', () => {
      const photos = [
        { photoTypeCode: 'AMENITY_PHOTO', documentGuid: 'amenity-guid-1' },
      ];
      const res = resolveAmenityPhoto(photos, []);
      expect(res.guid).toBe('amenity-guid-1');
      expect(res.url).toBe('https://test.docs.com/view/amenity-guid-1');
    });
  });

  describe('resolvePrimaryPropertyPhoto', () => {
    it('resolves amenity photo when isAmenity is true', () => {
      const photos = [
        { photoTypeCode: 'AMENITY_PHOTO', documentGuid: 'amenity-guid-1' },
      ];
      const res = resolvePrimaryPropertyPhoto(photos, [], { isAmenity: true });
      expect(res.guid).toBe('amenity-guid-1');
    });

    it('resolves society photo when isSociety is true', () => {
      const photos = [
        { photoTypeCode: 'SOCIETY_PLACE', documentGuid: 'soc-guid-1' },
      ];
      const res = resolvePrimaryPropertyPhoto(photos, [], { isSociety: true });
      expect(res.guid).toBe('soc-guid-1');
    });

    it('resolves front photo by default for individual property', () => {
      const photos = [
        { photoTypeCode: 'PROPERTY_FRONT', documentGuid: 'front-guid-1' },
      ];
      const res = resolvePrimaryPropertyPhoto(photos, []);
      expect(res.guid).toBe('front-guid-1');
    });
  });

  describe('resolveSocietyPhoto', () => {
    it('resolves society photo prioritizing place photo over building and board photos', () => {
      const photos = [
        { photoTypeCode: 'SOCIETY_BOARD', documentGuid: 'board-guid' },
        { photoTypeCode: 'SOCIETY_PLACE_PHOTO', documentGuid: 'place-guid' },
        { photoTypeCode: 'SOCIETY_PHOTO', documentGuid: 'photo-guid' },
      ];

      const res = resolveSocietyPhoto(photos, []);
      expect(res.guid).toBe('place-guid');
      expect(res.url).toBe('https://test.docs.com/view/place-guid');
    });

    it('falls back to society photo if no place photo exists', () => {
      const photos = [
        { photoTypeCode: 'SOCIETY_BOARD', documentGuid: 'board-guid' },
        { photoTypeCode: 'SOCIETY_PHOTO', documentGuid: 'photo-guid' },
      ];

      const res = resolveSocietyPhoto(photos, []);
      expect(res.guid).toBe('photo-guid');
    });

    it('returns undefined if no society photos exist (never falls back to unit photos or photo plans)', () => {
      const photos = [
        { photoTypeCode: 'PROPERTY_FRONT', documentGuid: 'front-guid' },
        { photoTypeCode: 'PHOTO_PLAN', documentGuid: 'plan-guid' },
      ];

      const res = resolveSocietyPhoto(photos, []);
      expect(res.guid).toBeUndefined();
      expect(res.url).toBeUndefined();
    });
  });
});
