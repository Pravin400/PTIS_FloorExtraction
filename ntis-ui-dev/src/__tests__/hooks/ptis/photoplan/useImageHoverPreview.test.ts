import { describe, it, expect, vi } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

import { renderHook, act } from '@testing-library/react';
import { useImageHoverPreview } from '@/hooks/ptis/photoplan/useImageHoverPreview';
import { usePropertyMedia } from '@/hooks/ptis/photoplan/usePropertyMedia';

describe('useImageHoverPreview', () => {
  it('sets and resets hover preview state', () => {
    const { result } = renderHook(() => useImageHoverPreview());

    expect(result.current.hoverPreview).toBeNull();

    act(() => {
      result.current.handleImageHover('/test.jpg', 'Test Title');
    });

    expect(result.current.hoverPreview).toEqual({
      src: '/test.jpg',
      src2: undefined,
      title: 'Test Title',
      beforeLabel: undefined,
      afterLabel: undefined,
      fallbackSrc: undefined,
      fallbackSrc2: undefined,
    });

    act(() => {
      result.current.resetHoverPreview();
    });

    expect(result.current.hoverPreview).toBeNull();
  });
});

describe('usePropertyMedia hover preview sync', () => {
  it('resets hover preview when propertyId changes', () => {
    const initialProps = {
      propertyId: 101,
      initialPhotos: [{ propertyPhotoId: 1, propertyId: 101, photoTypeId: 1, viewUrl: '/p101.jpg', photoTypeName: 'Photo', photoTypeCode: 'PHOTO' }],
    };

    const { result, rerender } = renderHook(
      (props) => usePropertyMedia(props),
      { initialProps }
    );

    act(() => {
      result.current.handleImageHover('/p101.jpg', 'Property 101 Photo');
    });

    expect(result.current.hoverPreview).not.toBeNull();

    // Rerender with a new propertyId
    rerender({
      propertyId: 102,
      initialPhotos: [{ propertyPhotoId: 2, propertyId: 102, photoTypeId: 1, viewUrl: '/p102.jpg', photoTypeName: 'Photo', photoTypeCode: 'PHOTO' }],
    });

    expect(result.current.hoverPreview).toBeNull();
  });

  it('resets hover preview when initialPhotos change', () => {
    const initialProps = {
      propertyId: 101,
      initialPhotos: [{ propertyPhotoId: 1, propertyId: 101, photoTypeId: 1, viewUrl: '/p101.jpg', photoTypeName: 'Photo', photoTypeCode: 'PHOTO' }],
    };

    const { result, rerender } = renderHook(
      (props) => usePropertyMedia(props),
      { initialProps }
    );

    act(() => {
      result.current.handleImageHover('/p101.jpg', 'Property 101 Photo');
    });

    expect(result.current.hoverPreview).not.toBeNull();

    // Rerender with updated initialPhotos
    rerender({
      propertyId: 101,
      initialPhotos: [{ propertyPhotoId: 2, propertyId: 101, photoTypeId: 1, viewUrl: '/p101_v2.jpg', photoTypeName: 'Photo', photoTypeCode: 'PHOTO' }],
    });

    expect(result.current.hoverPreview).toBeNull();
  });
});
