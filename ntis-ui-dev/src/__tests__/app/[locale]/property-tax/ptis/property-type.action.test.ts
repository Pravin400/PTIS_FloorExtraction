import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getMaxTypeForSocietyAction,
  getExistingTypesAction,
} from '@/app/[locale]/property-tax/ptis/property-type.action';
import * as propertyTypeService from '@/lib/api/property-type.service';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/api/property-type.service', () => ({
  getMaxTypeForSociety: vi.fn(),
  getExistingTypesForSociety: vi.fn(),
  getPlanTypesForProperty: vi.fn(),
  getNewPlanTypeForProperty: vi.fn(),
  savePlanTypeForProperty: vi.fn(),
  setPropertyType: vi.fn(),
}));

describe('property-type.action (Society endpoints)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMaxTypeForSocietyAction', () => {
    it('should return error for invalid societyDetailId', async () => {
      const res = await getMaxTypeForSocietyAction(0);
      expect(res).toEqual({ success: false, error: 'Invalid SocietyDetailId' });
      expect(propertyTypeService.getMaxTypeForSociety).not.toHaveBeenCalled();
    });

    it('should return maxType on successful service response', async () => {
      vi.mocked(propertyTypeService.getMaxTypeForSociety).mockResolvedValueOnce({
        success: true,
        data: { maxType: 10 },
      });

      const res = await getMaxTypeForSocietyAction(101);
      expect(propertyTypeService.getMaxTypeForSociety).toHaveBeenCalledWith(101);
      expect(res).toEqual({ success: true, data: { maxType: 10 } });
    });

    it('should handle service error gracefully', async () => {
      vi.mocked(propertyTypeService.getMaxTypeForSociety).mockResolvedValueOnce({
        success: false,
        error: 'Failed to fetch',
      });

      const res = await getMaxTypeForSocietyAction(101);
      expect(res).toEqual({ success: false, error: 'Failed to fetch' });
    });
  });

  describe('getExistingTypesAction', () => {
    it('should return empty list if societyDetailId and wingDetailId are missing/invalid', async () => {
      const res = await getExistingTypesAction(0, 0);
      expect(res).toEqual({ success: true, data: [] });
      expect(propertyTypeService.getExistingTypesForSociety).not.toHaveBeenCalled();
    });

    it('should return existing types list from service response', async () => {
      vi.mocked(propertyTypeService.getExistingTypesForSociety).mockResolvedValueOnce({
        success: true,
        data: ['Type1', 'Type2'],
      });

      const res = await getExistingTypesAction(200, 300);
      expect(propertyTypeService.getExistingTypesForSociety).toHaveBeenCalledWith(200, 300);
      expect(res).toEqual({ success: true, data: ['Type1', 'Type2'] });
    });
  });
});
