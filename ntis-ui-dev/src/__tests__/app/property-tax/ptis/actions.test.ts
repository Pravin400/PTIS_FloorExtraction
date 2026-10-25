import {
  getPropertyListByWardAction,
  fetchWardIdAction,
} from '@/app/[locale]/property-tax/ptis/actions';
import { ptisService } from '@/lib/api/ptis/tab/ptis.service';

vi.mock('next-intl/server', () => ({
  getTranslations: () => async (key: string) => key,
}));

vi.mock('@/lib/api/ptis/tab/ptis.service', () => ({
  ptisService: {
    getPropertyListByWard: vi.fn(),
    getWardByNo: vi.fn(),
    getWardList: vi.fn(),
  },
}));

describe('PTIS Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPropertyListByWardAction', () => {
    it('returns error if wardId is invalid', async () => {
      const result = await getPropertyListByWardAction(0);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('successfully fetches property list by ward', async () => {
      const mockProps = [
        { propertyId: 1, propertyNo: '101', partitionNo: '0' },
      ];
      vi.mocked(ptisService.getPropertyListByWard).mockResolvedValueOnce({
        success: true,
        data: mockProps as never,
      });

      const result = await getPropertyListByWardAction(14, 500);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProps);
      expect(ptisService.getPropertyListByWard).toHaveBeenCalledWith(14, 500);
    });

    it('handles failure from ptisService', async () => {
      vi.mocked(ptisService.getPropertyListByWard).mockResolvedValueOnce({
        success: false,
        error: 'Failed to fetch properties',
      });

      const result = await getPropertyListByWardAction(14);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch properties');
    });
  });

  describe('fetchWardIdAction', () => {
    it('returns wardId when ward exists', async () => {
      vi.mocked(ptisService.getWardByNo).mockResolvedValueOnce({
        success: true,
        data: { wardId: 14 } as never,
      });

      const result = await fetchWardIdAction('LS14');
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ wardId: 14 });
    });

    it('returns error when ward is not found', async () => {
      vi.mocked(ptisService.getWardByNo).mockResolvedValueOnce({
        success: false,
        error: 'Ward not found',
      });

      const result = await fetchWardIdAction('UNKNOWN');
      expect(result.success).toBe(false);
    });
  });
});
