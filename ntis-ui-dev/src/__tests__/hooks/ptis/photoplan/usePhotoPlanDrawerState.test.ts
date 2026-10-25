import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePhotoPlanDrawerState } from '@/hooks/ptis/photoplan/usePhotoPlanDrawerState';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/en/property-tax/ptis',
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

vi.mock('@/components/common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/common')>();
  return {
    ...actual,
    useConfirm: () => ({ confirm: vi.fn().mockResolvedValue(true) }),
  };
});

describe('usePhotoPlanDrawerState', () => {
  const mockCategories = [
    {
      photoTypeId: 1,
      photoTypeCode: 'PROPERTY_PHOTO',
      photoTypeName: 'Property Photo',
      photoCount: 1,
      images: [
        { src: '/img1.jpg', fullSrc: '/img1.jpg', alt: 'Photo 1', propertyPhotoId: 101, title: 'Photo 1' },
      ],
    },
  ];

  const defaultProps = {
    categories: mockCategories,
    onCategoriesChange: vi.fn(),
    onPhotosChange: vi.fn(),
    propertyId: 42,
    initialCategoryIndex: 0,
    fullyLoadedIds: new Set<number>(),
    onFullyLoadedIdsChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes drawer state with selected category and view mode', () => {
    const { result } = renderHook(() => usePhotoPlanDrawerState(defaultProps));

    expect(result.current.selectedCategoryIndex).toBe(0);
    expect(result.current.cachedCategories).toHaveLength(1);
  });
});
