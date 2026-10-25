import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAssetPropertyMedia } from '@/hooks/asset-hooks/useAssetPropertyMedia';
import type { PhotoCategory } from '@/types/asset/media.types';

vi.mock('next-intl', () => ({
  useTranslations: () => {
    const t = (key: string) => key;
    t.has = () => false;
    return t;
  },
}));

describe('useAssetPropertyMedia Hook', () => {
  it('initializes with default empty state', () => {
    const { result } = renderHook(() =>
      useAssetPropertyMedia({
        initialPhotoSlots: [],
        initialPhotos: [],
        propertyId: 100,
      })
    );

    expect(result.current.categories).toEqual([]);
    expect(result.current.hoverPreview).toBeNull();
    expect(result.current.photoPlanCategory).toBeUndefined();
    expect(result.current.propertyPhotoCategory).toBeUndefined();
  });

  it('handles image hover and leave events', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useAssetPropertyMedia({
        initialPhotoSlots: [],
        initialPhotos: [],
        propertyId: 100,
      })
    );

    act(() => {
      result.current.handleImageHover('/test-image.jpg', 'Test Title', '/test-secondary.jpg');
    });

    expect(result.current.hoverPreview).toEqual({
      src: '/test-image.jpg',
      src2: '/test-secondary.jpg',
      title: 'Test Title',
    });

    act(() => {
      result.current.handleImageLeave();
      vi.advanceTimersByTime(200);
    });

    expect(result.current.hoverPreview).toBeNull();
    vi.useRealTimers();
  });

  it('updates categories correctly on handleCategoriesChange', () => {
    const { result } = renderHook(() =>
      useAssetPropertyMedia({
        initialPhotoSlots: [],
        initialPhotos: [],
        propertyId: 100,
      })
    );

    const mockCategory: PhotoCategory = {
      photoTypeId: 1,
      photoTypeCode: 'PROPERTY_PHOTO',
      photoTypeName: 'Asset Photo',
      images: [
        {
          propertyPhotoId: 999,
          hasPhoto: true,
          src: 'https://example.com/asset.jpg',
          fullSrc: 'https://example.com/asset.jpg',
          alt: 'Front View',
          title: 'Front View',
          photoTypeId: 1,
          photoTypeCode: 'PROPERTY_PHOTO',
        },
      ],
    };

    act(() => {
      result.current.handleCategoriesChange([mockCategory]);
    });

    expect(result.current.categories).toBeDefined();
  });
});
