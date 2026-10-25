import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  usePropertyPhotosQuery,
  areSlotsEqual,
  arePhotosEqual,
} from '@/hooks/ptis/photoplan/usePropertyPhotosQuery';
import * as mediaFetchActions from '@/app/[locale]/property-tax/ptis/media-fetch.action';

vi.mock('@/app/[locale]/property-tax/ptis/media-fetch.action', () => ({
  getPhotoSlotsAction: vi.fn(),
  getPropertyPhotosAction: vi.fn(),
}));

describe('usePropertyPhotosQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('compares slots and photos equality helpers correctly', () => {
    const slotsA = [{ photoTypeId: 1, photoTypeCode: 'P', photoTypeName: 'Prop', hasPhoto: true, photoCount: 1, propertyPhotoId: 10, viewUrl: '/url' }];
    const slotsB = [{ photoTypeId: 1, photoTypeCode: 'P', photoTypeName: 'Prop', hasPhoto: true, photoCount: 1, propertyPhotoId: 10, viewUrl: '/url' }];
    const slotsC = [{ photoTypeId: 2, photoTypeCode: 'Q', photoTypeName: 'Prop2', hasPhoto: false, photoCount: 0 }];
    const photosA = [{ propertyPhotoId: 1, propertyId: 42, photoTypeId: 1, photoTypeCode: 'P', photoTypeName: 'Prop', viewUrl: '/v', downloadUrl: '/d', documentGuid: 'g1', displayOrder: 1, remarks: 'r', fileName: 'f.png', mimeType: 'image/png' }];
    const photosB = [{ propertyPhotoId: 2, propertyId: 42, photoTypeId: 2, photoTypeCode: 'Q', photoTypeName: 'Prop2', viewUrl: '/v2', downloadUrl: '/d2', documentGuid: 'g2', displayOrder: 2, remarks: 'r2', fileName: 'f2.png', mimeType: 'image/png' }];

    expect(areSlotsEqual(slotsA, slotsB)).toBe(true);
    expect(areSlotsEqual(slotsA, slotsC)).toBe(false);
    expect(arePhotosEqual(photosA, photosA)).toBe(true);
    expect(arePhotosEqual(photosA, photosB)).toBe(false);
  });

  it('supports dynamic fetching and refetching photo slots and photos without caching', async () => {
    vi.mocked(mediaFetchActions.getPhotoSlotsAction).mockResolvedValue({
      success: true,
      data: [{ photoTypeId: 1, photoTypeCode: 'PROP', photoTypeName: 'Property Photo', hasPhoto: true, photoCount: 1 }],
    } as unknown as Awaited<ReturnType<typeof mediaFetchActions.getPhotoSlotsAction>>);

    vi.mocked(mediaFetchActions.getPropertyPhotosAction).mockResolvedValue({
      success: true,
      data: [{ propertyPhotoId: 101, photoTypeId: 1, documentGuid: 'guid-101' }],
    } as unknown as Awaited<ReturnType<typeof mediaFetchActions.getPropertyPhotosAction>>);

    const { result } = renderHook(() => usePropertyPhotosQuery(42, false, false));

    await act(async () => {
      await result.current.refetch();
    });

    expect(mediaFetchActions.getPhotoSlotsAction).toHaveBeenCalledWith(42);
    expect(mediaFetchActions.getPropertyPhotosAction).toHaveBeenCalledWith(42);
    expect(result.current.photoSlots).toHaveLength(1);
    expect(result.current.photos).toHaveLength(1);
  });

  it('fetches photos when initialPhotoSlots are provided by SSR but initialPhotos is empty', async () => {
    vi.mocked(mediaFetchActions.getPhotoSlotsAction).mockResolvedValue({
      success: true,
      data: [{ photoTypeId: 1, photoTypeCode: 'PROP', photoTypeName: 'Property Photo', hasPhoto: true, photoCount: 1 }],
    } as unknown as Awaited<ReturnType<typeof mediaFetchActions.getPhotoSlotsAction>>);

    vi.mocked(mediaFetchActions.getPropertyPhotosAction).mockResolvedValue({
      success: true,
      data: [{ propertyPhotoId: 101, photoTypeId: 1, documentGuid: 'guid-101' }],
    } as unknown as Awaited<ReturnType<typeof mediaFetchActions.getPropertyPhotosAction>>);

    const initialSlots = [{ photoTypeId: 1, photoTypeCode: 'PROP', photoTypeName: 'Property Photo', hasPhoto: false, photoCount: 0 }];
    const { result } = renderHook(() =>
      usePropertyPhotosQuery(42, false, false, initialSlots, [])
    );

    // Initial slots are rendered immediately without skeleton
    expect(result.current.photoSlots).toHaveLength(1);

    await act(async () => {
      // allow useEffect fetch to run
      await Promise.resolve();
    });

    expect(mediaFetchActions.getPropertyPhotosAction).toHaveBeenCalledWith(42);
  });
});
