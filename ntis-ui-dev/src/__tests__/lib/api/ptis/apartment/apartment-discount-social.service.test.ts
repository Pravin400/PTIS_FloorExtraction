import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getApartmentSocialAndDiscountDetailsService } from '@/lib/api/ptis/apartment/apartment-discount-social.service';
import { apiClient } from '@/services/api.service';

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
  }),
}));

describe('getApartmentSocialAndDiscountDetailsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns failure when societyDetailId is invalid', async () => {
    const result = await getApartmentSocialAndDiscountDetailsService(0);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid society detail ID');
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('strictly calls dedicated society grid endpoint without query parameters and maps records across all levels', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      success: true,
      statusCode: 200,
      data: {
        items: {
          discountData: {
            appliedAttributes: [
              {
                propertySocialDetailId: 101,
                societyDetailId: 100,
                level: 'Apartment',
                entityType: 'S',
                socialAttributeId: 1,
                socialAttributeName: 'Solar Society',
                socialAttributeCode: 'SOLAR_SOC',
                bitValue: true,
                documentBindingId: 501,
                isDiscountApplicable: true,
              },
              {
                propertySocialDetailId: 102,
                societyDetailId: 100,
                wingDetailId: 20,
                wingName: 'Wing A',
                level: 'Wing',
                entityType: 'W',
                socialAttributeId: 2,
                socialAttributeName: 'STP Wing A',
                socialAttributeCode: 'STP_WING',
                bitValue: true,
                documentBindingId: 502,
                isDiscountApplicable: true,
              },
              {
                propertySocialDetailId: 103,
                societyDetailId: 100,
                wingDetailId: 20,
                propertyId: 3001,
                wingName: 'Wing A',
                partitionNo: '101',
                displayLevelLabel: 'Wing A - 101 Unit',
                level: 'Unit',
                entityType: 'P',
                socialAttributeId: 3,
                socialAttributeName: 'EV Unit 101',
                socialAttributeCode: 'EV_UNIT',
                bitValue: true,
                documentBindingId: 503,
                isDiscountApplicable: true,
              },
            ],
          },
          socialData: {
            appliedAttributes: [
              {
                propertySocialDetailId: 104,
                societyDetailId: 100,
                wingDetailId: 20,
                propertyId: 3001,
                wingName: 'Wing A',
                partitionNo: '101',
                displayLevelLabel: 'Wing A - 101 Unit',
                level: 'Unit',
                entityType: 'P',
                socialAttributeId: 4,
                socialAttributeName: 'Handicapped Unit',
                socialAttributeCode: 'HANDICAPPED',
                bitValue: true,
                documentBindingId: 504,
                isDiscountApplicable: false,
              },
            ],
          },
          levelCounts: {
            all: 4,
            apartment: 1,
            wing: 1,
            unit: 2,
          },
        },
      },
    });

    const result = await getApartmentSocialAndDiscountDetailsService(100);

    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(apiClient.get).toHaveBeenCalledWith('/PropertySocialDetails/society/100/discount-and-social-grid');
    expect(result.success).toBe(true);
    expect(result.discountData.items).toHaveLength(3);
    expect(result.socialData.items).toHaveLength(1);
    expect(result.levelCounts.apartment).toBe(1);
    expect(result.levelCounts.wing).toBe(1);
    expect(result.levelCounts.unit).toBe(2);
    expect(result.levelCounts.all).toBe(4);
  });

  it('handles API errors cleanly without falling back to other endpoints', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      success: false,
      statusCode: 500,
      error: 'Server error',
      message: 'Internal server error',
    });

    const result = await getApartmentSocialAndDiscountDetailsService(100);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Internal server error');
    expect(result.discountData.items).toHaveLength(0);
    expect(result.socialData.items).toHaveLength(0);
  });
});
