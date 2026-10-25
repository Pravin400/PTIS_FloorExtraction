import { describe, it, expect, vi } from 'vitest';
import {
  getLocalizedCategoryName,
  getEnglishCategoryName,
  patchCategory,
  sortByOrder,
  hasCategoryChanged,
  mergeCategories,
  areCategoriesEqual,
} from '@/lib/utils/ptis-photo-plan-localization';
import type { PhotoCategory } from '@/components/modules/property-tax/ptis/media/PhotoPlanSidebar';
import type { AdditionalImage } from '@/components/modules/property-tax/ptis/media/MediaImageCards';

describe('ptis-photo-plan-localization', () => {
  describe('getLocalizedCategoryName', () => {
    it('returns fallbackName when code is empty', () => {
      const mockT = vi.fn();
      expect(getLocalizedCategoryName('', 'Fallback', mockT)).toBe('Fallback');
    });

    it('translates known category codes using translation function t', () => {
      const mockT = vi.fn((key: string) => {
        if (key === 'media.propertyPhoto') return 'Localized Property Photo';
        return key;
      });
      expect(getLocalizedCategoryName('PROPERTY_PHOTO', 'Fallback', mockT)).toBe('Localized Property Photo');
    });

    it('returns fallbackName if key translation is missing or throws error', () => {
      const mockT = vi.fn(() => {
        throw new Error('Key not found');
      });
      expect(getLocalizedCategoryName('PROPERTY_PHOTO', 'Fallback', mockT)).toBe('Fallback');
    });

    it('returns fallbackName for unmapped code', () => {
      const mockT = vi.fn((key: string) => key);
      expect(getLocalizedCategoryName('UNKNOWN_CODE', 'Custom Fallback', mockT)).toBe('Custom Fallback');
    });
  });

  describe('getEnglishCategoryName', () => {
    it('returns standard English category name for mapped codes', () => {
      expect(getEnglishCategoryName('PROPERTY_PHOTO', 'Fallback')).toBe('Property Photo');
      expect(getEnglishCategoryName('PHOTO_PLAN', 'Fallback')).toBe('Photo Plan');
      expect(getEnglishCategoryName('BUILDING', 'Fallback')).toBe('Building Photo');
      expect(getEnglishCategoryName('SIGN_BOARD', 'Fallback')).toBe('Sign Board Photo');
      expect(getEnglishCategoryName('ADVERTISEMENT', 'Fallback')).toBe('Advertisement Board Photo');
      expect(getEnglishCategoryName('OWNER_SIGNATURE', 'Fallback')).toBe('Owner Signature Photo');
      expect(getEnglishCategoryName('OTHER', 'Fallback')).toBe('Other Photo');
    });

    it('returns fallbackName for unmapped or empty codes', () => {
      expect(getEnglishCategoryName('', 'Default Name')).toBe('Default Name');
      expect(getEnglishCategoryName('CUSTOM_CODE', 'Default Name')).toBe('Default Name');
    });
  });

  describe('patchCategory', () => {
    it('replaces images for target category index', () => {
      const categories: PhotoCategory[] = [
        { photoTypeId: 1, photoTypeCode: 'PROP', photoTypeName: 'Property', photoCount: 0, images: [] },
        { photoTypeId: 2, photoTypeCode: 'PLAN', photoTypeName: 'Plan', photoCount: 0, images: [] },
      ];
      const newImages: AdditionalImage[] = [
        { src: 'img1.jpg', fullSrc: 'img1.jpg', alt: 'Photo 1', photoTypeId: 1, propertyPhotoId: 101, title: 'Photo 1' },
      ];

      const result = patchCategory(categories, 0, newImages);
      expect(result[0].images).toHaveLength(1);
      expect(result[0].photoCount).toBe(1);
      expect(result[1].images).toHaveLength(0);
    });
  });

  describe('sortByOrder', () => {
    it('sorts images by displayOrder then by propertyPhotoId', () => {
      const images: AdditionalImage[] = [
        { src: 'b.jpg', fullSrc: 'b.jpg', alt: 'b', title: 'b', displayOrder: 2, propertyPhotoId: 10 },
        { src: 'a.jpg', fullSrc: 'a.jpg', alt: 'a', title: 'a', displayOrder: 1, propertyPhotoId: 5 },
        { src: 'c.jpg', fullSrc: 'c.jpg', alt: 'c', title: 'c', displayOrder: 2, propertyPhotoId: 3 },
      ];

      const sorted = sortByOrder(images);
      expect(sorted[0].src).toBe('a.jpg');
      expect(sorted[1].src).toBe('c.jpg');
      expect(sorted[2].src).toBe('b.jpg');
    });
  });

  describe('hasCategoryChanged', () => {
    it('detects changes in image list length or photo attributes', () => {
      const cat1: PhotoCategory = {
        photoTypeId: 1, photoTypeCode: 'P', photoTypeName: 'P', photoCount: 1,
        images: [{ src: '1.jpg', fullSrc: '1.jpg', alt: '1', title: '1', propertyPhotoId: 101 }],
      };
      const cat2: PhotoCategory = {
        photoTypeId: 1, photoTypeCode: 'P', photoTypeName: 'P', photoCount: 2,
        images: [
          { src: '1.jpg', fullSrc: '1.jpg', alt: '1', title: '1', propertyPhotoId: 101 },
          { src: '2.jpg', fullSrc: '2.jpg', alt: '2', title: '2', propertyPhotoId: 102 },
        ],
      };

      expect(hasCategoryChanged(cat1, cat2)).toBe(true);
      expect(hasCategoryChanged(cat1, cat1)).toBe(false);
    });
  });

  describe('mergeCategories', () => {
    it('merges incoming categories with existing cached ones', () => {
      const prev: PhotoCategory[] = [
        { photoTypeId: 1, photoTypeCode: 'P', photoTypeName: 'P', photoCount: 1, images: [{ src: '1.jpg', fullSrc: '1.jpg', alt: '1', title: '1', propertyPhotoId: 101 }] },
      ];
      const incoming: PhotoCategory[] = [
        { photoTypeId: 1, photoTypeCode: 'P', photoTypeName: 'P', photoCount: 1, images: [{ src: '1.jpg', fullSrc: '1.jpg', alt: '1', title: '1', propertyPhotoId: 101 }] },
        { photoTypeId: 2, photoTypeCode: 'Q', photoTypeName: 'Q', photoCount: 0, images: [] },
      ];

      const merged = mergeCategories(prev, incoming);
      expect(merged).toHaveLength(2);
      expect(merged[0]).toBe(prev[0]);
    });
  });

  describe('areCategoriesEqual', () => {
    it('returns true for identical category lists', () => {
      const catList: PhotoCategory[] = [
        {
          photoTypeId: 1, photoTypeCode: 'P', photoTypeName: 'P', photoCount: 1,
          images: [{ src: '1.jpg', fullSrc: '1.jpg', alt: 'T', propertyPhotoId: 101, title: 'T', hasPhoto: true }],
        },
      ];
      expect(areCategoriesEqual(catList, catList)).toBe(true);
      expect(areCategoriesEqual(catList, [...catList])).toBe(true);
    });

    it('returns false when categories differ in length or attributes', () => {
      const listA: PhotoCategory[] = [
        { photoTypeId: 1, photoTypeCode: 'P', photoTypeName: 'P', photoCount: 1, images: [] },
      ];
      const listB: PhotoCategory[] = [
        { photoTypeId: 1, photoTypeCode: 'P', photoTypeName: 'P', photoCount: 1, images: [] },
        { photoTypeId: 2, photoTypeCode: 'Q', photoTypeName: 'Q', photoCount: 0, images: [] },
      ];

      expect(areCategoriesEqual(listA, listB)).toBe(false);
    });
  });
});
