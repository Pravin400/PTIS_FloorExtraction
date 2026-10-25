import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPhotoSlotsAction, getPropertyPhotosAction } from '@/app/[locale]/property-tax/ptis/media-fetch.action';
import { photoPlanService } from '@/lib/api/ptis/photoplan/photoplan.service';

vi.mock('@/lib/api/ptis/photoplan/photoplan.service', () => ({
  photoPlanService: {
    getPhotoTypesWithStatus: vi.fn(),
    getAllPropertyPhotoTypes: vi.fn(),
    getPhotosByProperty: vi.fn(),
  },
}));

describe('media-fetch.action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPhotoSlotsAction', () => {
    it('returns failure when both photo slots and photo types requests fail', async () => {
      vi.mocked(photoPlanService.getPhotoTypesWithStatus).mockResolvedValue({
        success: false,
        error: 'Failed to retrieve photo types with status',
      });
      vi.mocked(photoPlanService.getAllPropertyPhotoTypes).mockResolvedValue({
        success: false,
        error: 'Failed to retrieve all photo types',
      });

      const result = await getPhotoSlotsAction(123);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to retrieve photo types with status');
    });

    it('returns partial success when photo types succeed even if photo slots with status fails', async () => {
      vi.mocked(photoPlanService.getPhotoTypesWithStatus).mockResolvedValue({
        success: false,
        error: 'Network error',
      });
      vi.mocked(photoPlanService.getAllPropertyPhotoTypes).mockResolvedValue({
        success: true,
        data: [
          {
            id: 1,
            photoTypeCode: 'FRONT',
            photoTypeName: 'Front View',
            photoScope: 'PROPERTY',
            displayOrder: 1,
            isActive: true,
          },
        ],
      });

      const result = await getPhotoSlotsAction(123);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].photoTypeCode).toBe('FRONT');
    });

    it('returns slots when photoSlotsRes succeeds', async () => {
      vi.mocked(photoPlanService.getPhotoTypesWithStatus).mockResolvedValue({
        success: true,
        data: [
          {
            photoTypeId: 2,
            photoTypeCode: 'REAR',
            photoTypeName: 'Rear View',
            photoScope: 'PROPERTY',
            displayOrder: 2,
            hasPhoto: true,
            photoCount: 1,
          },
        ],
      });
      vi.mocked(photoPlanService.getAllPropertyPhotoTypes).mockResolvedValue({
        success: false,
      });

      const result = await getPhotoSlotsAction(123);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].photoTypeCode).toBe('REAR');
    });
  });

  describe('getPropertyPhotosAction', () => {
    it('returns failure when getPhotosByProperty fails', async () => {
      vi.mocked(photoPlanService.getPhotosByProperty).mockResolvedValue({
        success: false,
        error: 'Backend timeout',
      });

      const result = await getPropertyPhotosAction(123);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Backend timeout');
    });

    it('returns photos when getPhotosByProperty succeeds', async () => {
      vi.mocked(photoPlanService.getPhotosByProperty).mockResolvedValue({
        success: true,
        data: [
          {
            propertyPhotoId: 10,
            propertyId: 123,
            photoTypeId: 1,
            photoTypeCode: 'FRONT',
            photoTypeName: 'Front View',
            displayOrder: 1,
          },
        ],
      });

      const result = await getPropertyPhotosAction(123);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });
});
