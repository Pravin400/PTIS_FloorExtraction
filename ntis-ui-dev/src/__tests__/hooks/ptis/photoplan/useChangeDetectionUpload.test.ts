import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChangeDetectionUpload } from '@/hooks/ptis/photoplan/useChangeDetectionUpload';
import * as photoPlanActions from '@/app/[locale]/property-tax/ptis/PhotoPlan.action';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/components/common', () => ({
  useConfirm: () => ({ confirm: vi.fn() }),
}));

vi.mock('@/components/common/ConfirmProvider', () => ({
  useConfirm: () => ({ confirm: vi.fn() }),
}));

vi.mock('@/app/[locale]/property-tax/ptis/PhotoPlan.action', () => ({
  uploadPropertyPhotoAction: vi.fn(),
  replacePropertyPhotoAction: vi.fn(),
  deletePropertyPhotoAction: vi.fn(),
}));

describe('useChangeDetectionUpload', () => {
  const mockCategory = {
    photoTypeId: 99,
    photoTypeCode: 'CHANGE_DETECTION',
    photoTypeName: 'Change Detection',
    photoCount: 0,
    images: [
      { src: '', title: 'Before (Old)', displayOrder: 1, hasPhoto: false },
      { src: '', title: 'After (New)', displayOrder: 2, hasPhoto: false },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uploads change detection image when handleUploadOrReplaceImage is called', async () => {
    vi.mocked(photoPlanActions.uploadPropertyPhotoAction).mockResolvedValueOnce({
      success: true,
      data: { propertyPhotoId: 999, documentGuid: 'cd-guid-1' },
    } as unknown as Awaited<ReturnType<typeof photoPlanActions.uploadPropertyPhotoAction>>);

    const onImagesChange = vi.fn();
    const { result } = renderHook(() =>
      useChangeDetectionUpload({
        activeCategory: mockCategory as unknown as Parameters<typeof useChangeDetectionUpload>[0]['activeCategory'],
        propertyId: 42,
        onImagesChange,
      })
    );

    const file = new File(['content'], 'before.png', { type: 'image/png' });

    await act(async () => {
      await result.current.handleUploadOrReplaceImage(file, 'before');
    });

    expect(photoPlanActions.uploadPropertyPhotoAction).toHaveBeenCalled();
    expect(onImagesChange).toHaveBeenCalled();
  });
});
