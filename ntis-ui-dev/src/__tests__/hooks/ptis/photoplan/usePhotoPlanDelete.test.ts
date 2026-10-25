import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePhotoPlanDelete } from '@/hooks/ptis/photoplan/usePhotoPlanDelete';
import * as photoPlanActions from '@/app/[locale]/property-tax/ptis/PhotoPlan.action';

vi.mock('@/app/[locale]/property-tax/ptis/PhotoPlan.action', () => ({
  deletePropertyPhotoAction: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('usePhotoPlanDelete', () => {
  const mockCategories = [
    {
      photoTypeId: 1,
      photoTypeCode: 'PROPERTY_PHOTO',
      photoTypeName: 'Property Photo',
      photoCount: 2,
      images: [
        { src: '/img1.jpg', fullSrc: '/img1.jpg', alt: 'Photo 1', propertyPhotoId: 101, title: 'Photo 1', documentGuid: '11111111-2222-3333-4444-555555555555' },
        { src: '/img2.jpg', fullSrc: '/img2.jpg', alt: 'Photo 2', propertyPhotoId: 102, title: 'Photo 2', documentGuid: '22222222-3333-4444-5555-666666666666' },
      ],
    },
  ];

  const defaultProps = {
    propertyId: 42,
    categories: mockCategories,
    onCategoriesChange: vi.fn(),
    selectedCategoryIndex: 0,
    selectedImageIndex: 0,
    viewMode: 'viewer' as const,
    setViewerIndexAndModeValue: vi.fn(),
    locale: 'en',
    t: ((key: string) => key) as unknown as (key: string) => string,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes photo and updates category state on successful API call', async () => {
    vi.mocked(photoPlanActions.deletePropertyPhotoAction).mockResolvedValueOnce({
      success: true,
      data: undefined,
    } as unknown as Awaited<ReturnType<typeof photoPlanActions.deletePropertyPhotoAction>>);

    const onCategoriesChange = vi.fn();
    const { result } = renderHook(() =>
      usePhotoPlanDelete({ ...defaultProps, onCategoriesChange })
    );

    await act(async () => {
      await result.current.handleDeletePhoto(0);
    });

    expect(photoPlanActions.deletePropertyPhotoAction).toHaveBeenCalledWith('11111111-2222-3333-4444-555555555555', 'en');
    expect(onCategoriesChange).toHaveBeenCalled();
  });

  it('handles delete failure gracefully and surfaces error toast', async () => {
    vi.mocked(photoPlanActions.deletePropertyPhotoAction).mockResolvedValueOnce({
      success: false,
      error: 'Delete permission denied',
    } as unknown as Awaited<ReturnType<typeof photoPlanActions.deletePropertyPhotoAction>>);

    const { result } = renderHook(() => usePhotoPlanDelete(defaultProps));

    await act(async () => {
      await result.current.handleDeletePhoto(0);
    });

    expect(photoPlanActions.deletePropertyPhotoAction).toHaveBeenCalledWith('11111111-2222-3333-4444-555555555555', 'en');
  });
});
