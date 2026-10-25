import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

import { renderHook, act } from '@testing-library/react';
import { usePropertyMedia } from '@/hooks/ptis/photoplan/usePropertyMedia';

describe('usePropertyMedia', () => {
  const mockInitialSlots = [
    {
      photoTypeId: 1,
      photoTypeCode: 'PROPERTY_PHOTO',
      photoTypeName: 'Property Photo',
      hasPhoto: true,
      photoCount: 1,
      viewUrl: '/documents/1/view',
    },
    {
      photoTypeId: 2,
      photoTypeCode: 'PHOTO_PLAN',
      photoTypeName: 'Photo Plan',
      hasPhoto: false,
      photoCount: 0,
    },
  ];

  const mockInitialPhotos = [
    {
      propertyPhotoId: 101,
      propertyId: 42,
      photoTypeId: 1,
      photoTypeCode: 'PROPERTY_PHOTO',
      photoTypeName: 'Property Photo',
      viewUrl: '/documents/1/view',
      downloadUrl: '/documents/1/download',
      documentGuid: 'guid-101',
      displayOrder: 1,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with mapped categories based on initial slots and photos', () => {
    const { result } = renderHook(() =>
      usePropertyMedia({
        initialPhotoSlots: mockInitialSlots,
        initialPhotos: mockInitialPhotos,
        propertyId: 42,
      })
    );

    expect(result.current.photos).toHaveLength(1);
    expect(result.current.categories).toBeDefined();
    expect(result.current.showMoreImages).toBe(false);
  });

  it('updates photos list on handleCategoriesChange call', () => {
    const onPhotosChange = vi.fn();
    const onPhotoSlotsChange = vi.fn();

    const { result } = renderHook(() =>
      usePropertyMedia({
        initialPhotoSlots: mockInitialSlots,
        initialPhotos: mockInitialPhotos,
        propertyId: 42,
        onPhotosChange,
        onPhotoSlotsChange,
      })
    );

    const updatedCategories = [
      {
        photoTypeId: 1,
        photoTypeCode: 'PROPERTY_PHOTO',
        photoTypeName: 'Property Photo',
        photoCount: 1,
        images: [
          {
            src: '/documents/1/view',
            title: 'Updated Photo 1',
            propertyPhotoId: 101,
            photoTypeId: 1,
            photoTypeCode: 'PROPERTY_PHOTO',
            hasPhoto: true,
            displayOrder: 1,
          },
        ],
      },
    ];

    act(() => {
      result.current.handleCategoriesChange(
        updatedCategories as unknown as Parameters<typeof result.current.handleCategoriesChange>[0]
      );
    });

    expect(onPhotosChange).toHaveBeenCalled();
    expect(onPhotoSlotsChange).toHaveBeenCalled();
  });

  it('excludes PHOTO_PLAN category when isMainProperty is true', () => {
    const { result } = renderHook(() =>
      usePropertyMedia({
        initialPhotoSlots: mockInitialSlots,
        initialPhotos: mockInitialPhotos,
        propertyId: 42,
        isMainProperty: true,
      })
    );

    const hasPhotoPlan = result.current.categories.some(
      (c) => c.photoTypeCode?.toUpperCase() === 'PHOTO_PLAN' || c.photoTypeName?.toLowerCase().includes('photo plan')
    );
    expect(hasPhotoPlan).toBe(false);
    expect(result.current.photoPlanCategory).toBeUndefined();
  });

  it('includes PHOTO_PLAN category when isMainProperty is false', () => {
    const { result } = renderHook(() =>
      usePropertyMedia({
        initialPhotoSlots: mockInitialSlots,
        initialPhotos: mockInitialPhotos,
        propertyId: 42,
        isMainProperty: false,
      })
    );

    const hasPhotoPlan = result.current.categories.some(
      (c) => c.photoTypeCode?.toUpperCase() === 'PHOTO_PLAN' || c.photoTypeName?.toLowerCase().includes('photo plan')
    );
    expect(hasPhotoPlan).toBe(true);
    expect(result.current.photoPlanCategory).toBeDefined();
  });

  it('includes PHOTO_PLAN category for Amenity property (propertyTypeId=140 or entityType=S)', () => {
    const { result } = renderHook(() =>
      usePropertyMedia({
        initialPhotoSlots: [
          {
            photoTypeId: 99,
            photoTypeCode: 'AMENITY_PHOTO',
            photoTypeName: 'Amenity Photo',
            hasPhoto: true,
            photoCount: 1,
          },
        ],
        initialPhotos: [],
        propertyId: 205,
        propertyTypeId: 140,
        entityType: 'S',
        isMainProperty: false,
      })
    );

    const hasPhotoPlan = result.current.categories.some(
      (c) => c.photoTypeCode?.toUpperCase() === 'PHOTO_PLAN' || c.photoTypeName?.toLowerCase().includes('photo plan')
    );
    const hasChangeDetection = result.current.categories.some(
      (c) => c.photoTypeCode?.toUpperCase() === 'CHANGE_DETECTION' || c.photoTypeName?.toLowerCase().includes('change detection')
    );

    expect(hasPhotoPlan).toBe(true);
    expect(result.current.photoPlanCategory).toBeDefined();
    expect(hasChangeDetection).toBe(true);
  });

  it('correctly maps societyPhoto to Society Place Photo and excludes Society Board Photo', () => {
    const multiCategoriesSlots = [
      {
        photoTypeId: 10,
        photoTypeCode: 'SOCIETY_BOARD',
        photoTypeName: 'Society Board Photo',
        hasPhoto: true,
        photoCount: 1,
      },
      {
        photoTypeId: 11,
        photoTypeCode: 'SOCIETY_PLACE',
        photoTypeName: 'Society Place Photo',
        hasPhoto: true,
        photoCount: 1,
      },
      {
        photoTypeId: 12,
        photoTypeCode: 'WING_BUILDING',
        photoTypeName: 'Wing Building Photo',
        hasPhoto: true,
        photoCount: 1,
      },
    ];

    const multiPhotos = [
      {
        propertyPhotoId: 201,
        propertyId: 42,
        photoTypeId: 10,
        photoTypeCode: 'SOCIETY_BOARD',
        photoTypeName: 'Society Board Photo',
        viewUrl: '/documents/board/view',
        documentGuid: 'guid-board',
        displayOrder: 1,
      },
      {
        propertyPhotoId: 202,
        propertyId: 42,
        photoTypeId: 11,
        photoTypeCode: 'SOCIETY_PLACE',
        photoTypeName: 'Society Place Photo',
        viewUrl: '/documents/place/view',
        documentGuid: 'guid-place',
        displayOrder: 1,
      },
      {
        propertyPhotoId: 203,
        propertyId: 42,
        photoTypeId: 12,
        photoTypeCode: 'WING_BUILDING',
        photoTypeName: 'Wing Building Photo',
        viewUrl: '/documents/wing/view',
        documentGuid: 'guid-wing',
        displayOrder: 1,
      },
    ];

    const { result } = renderHook(() =>
      usePropertyMedia({
        initialPhotoSlots: multiCategoriesSlots,
        initialPhotos: multiPhotos,
        propertyId: 42,
        isMainProperty: true,
      })
    );

    expect(result.current.societyPhotoCategory?.photoTypeCode).toBe('SOCIETY_PLACE');
    expect(result.current.societyPhoto?.documentGuid).toBe('guid-place');
    expect(result.current.societyPhoto?.documentGuid).not.toBe('guid-board');
    expect(result.current.societyPhoto?.documentGuid).not.toBe('guid-wing');
  });

  it('generates coordinate-based satellite tile URL for gisPhoto when initial coordinates are provided', () => {
    const { result } = renderHook(() =>
      usePropertyMedia({
        initialPhotoSlots: mockInitialSlots,
        initialPhotos: mockInitialPhotos,
        propertyId: 42,
        initialLatitude: 19.84,
        initialLongitude: 75.88,
      })
    );

    expect(result.current.gisPhoto).toBeDefined();
    expect(result.current.gisPhoto.src).toContain('arcgis.com');
    expect(result.current.gisPhoto.src).toContain('/17/58163/93163');
  });

  it('inherits coordinates from wings when property-level coordinates are absent', () => {
    const mockWings = [
      {
        wingDetailId: 10,
        wingName: 'A Wing',
        latitude: 19.84,
        longitude: 75.88,
      },
    ];

    const { result } = renderHook(() =>
      usePropertyMedia({
        initialPhotoSlots: mockInitialSlots,
        initialPhotos: mockInitialPhotos,
        propertyId: 42,
        wings: mockWings,
        wingDetailId: 10,
      })
    );

    expect(result.current.gisPhoto).toBeDefined();
    expect(result.current.gisPhoto.src).toContain('arcgis.com');
    expect(result.current.gisPhoto.src).toContain('/17/58163/93163');
  });
});
