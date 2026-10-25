import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getIndividualSocialAndDiscountDetailsService } from '@/lib/api/ptis/individual/individual-discount-social.service';
import { apiClient } from '@/services/api.service';

vi.mock('server-only', () => ({}));
vi.mock('@/services/api.service', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));
vi.mock('@/lib/utils/server-logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe('getIndividualSocialAndDiscountDetailsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return error if propertyId is invalid', async () => {
    const result = await getIndividualSocialAndDiscountDetailsService(0);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid property ID');
  });

  it('should call dedicated individual endpoint with propertyId even when societyDetailId is provided', async () => {
    const mockPropertyId = 2078986;
    const mockSocietyDetailId = 1507857;
    const mockWingDetailId = 1530992;

    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: {
        items: {
          discountData: {
            appliedAttributes: [
              {
                socialAttributeId: 18,
                socialAttributeName: 'Solar Installed',
                bitValue: true,
                remark: 'A11 Unit Solar',
                level: 'Unit',
                entityType: 'P',
                partitionNo: 'A11',
              },
            ],
            nonAppliedAttributes: [],
          },
          socialData: {
            appliedAttributes: [],
            nonAppliedAttributes: [],
          },
        },
      },
    });

    const result = await getIndividualSocialAndDiscountDetailsService(
      mockPropertyId,
      mockSocietyDetailId,
      mockWingDetailId
    );

    expect(apiClient.get).toHaveBeenCalledWith(
      `/PropertySocialDetails/property/${mockPropertyId}/discount-and-social-grid`
    );
    expect(result.success).toBe(true);
    expect(result.discountData.items).toHaveLength(1);
    expect(result.discountData.items[0].socialAttributeId).toBe(18);
  });
});
