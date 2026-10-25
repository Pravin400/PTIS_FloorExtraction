import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getApartmentDetailsWingWise,
  getApartmentPropertyTaxDetailsRv,
  getApartmentPropertyTaxDetailsCv,
} from '@/lib/api/ptis/apartment-details.service';
import { apiClient } from '@/services/api.service';

vi.mock('@/services/api.service', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('apartment-details.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getApartmentDetailsWingWise', () => {
    it('should format URL with WingDetailId and pagination parameters', async () => {
      const mockApiResponse = {
        success: true,
        data: {
          items: {
            items: [
              {
                newSurvey: {
                  id: 1491536,
                  propertyNo: '1',
                  wing: 'B',
                  propertyTypeName: 'निवासी',
                  carpetASqFt: 243.91,
                  photos: [
                    {
                      documentGuid: '5870b515-ab58-4f61-ac6a-08ca2bf65d01',
                      photoTypeCode: 'PROPERTY_PHOTO',
                    },
                  ],
                },
                oldSurvey: {
                  id: 0,
                  propertyNo: '',
                },
                difference: {
                  carpetAreaSqFeetDiff: 243.91,
                  totalTaxDiff: 0,
                },
              },
            ],
            totalCount: 39,
            pageNumber: 1,
            pageSize: 10,
            totalPages: 4,
            hasPrevious: false,
            hasNext: true,
          },
          message: 'Record found successfully',
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockApiResponse);

      const result = await getApartmentDetailsWingWise({
        wingDetailId: 1519804,
        pageNumber: 1,
        pageSize: 10,
        searchTerm: 'Patil',
        sortBy: 'flatOrShopNo',
        sortOrder: 'asc',
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/ApartmentQC/apartment-details-wing-wise?WingDetailId=1519804&PageNumber=1&PageSize=10&SearchTerm=Patil&SortBy=flatOrShopNo&SortOrder=asc',
        { cache: 'no-store' }
      );

      expect(result.success).toBe(true);
      expect(result.data?.items.length).toBe(1);
      expect(result.data?.totalCount).toBe(39);
      expect(result.data?.items[0].newSurvey.id).toBe(1491536);
      expect(result.data?.items[0].newSurvey.photos?.[0].documentGuid).toBe(
        '5870b515-ab58-4f61-ac6a-08ca2bf65d01'
      );
    });

    it('should handle API failure gracefully without throwing', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: false,
        error: 'Apartment details not found',
      });

      const result = await getApartmentDetailsWingWise({ wingDetailId: 99999 });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Apartment details not found');
    });
  });

  describe('getApartmentPropertyTaxDetailsRv and Cv', () => {
    it('should validate propertyId and call RV endpoint', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: { taxAmounts: [{ taxHead: 'General Tax', amount: 1000 }] },
      });

      const result = await getApartmentPropertyTaxDetailsRv(1491536);
      expect(apiClient.get).toHaveBeenCalledWith(
        '/Property/apartment-property-tax-details-rv?Id=1491536',
        { cache: 'no-store' }
      );
      expect(result.success).toBe(true);
    });

    it('should validate propertyId and call CV endpoint', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: { taxAmounts: [{ taxHead: 'Capital Value Tax', amount: 2000 }] },
      });

      const result = await getApartmentPropertyTaxDetailsCv(1491536);
      expect(apiClient.get).toHaveBeenCalledWith(
        '/Property/apartment-property-tax-details-cv?Id=1491536',
        { cache: 'no-store' }
      );
      expect(result.success).toBe(true);
    });

    it('should reject invalid property ID gracefully', async () => {
      const result = await getApartmentPropertyTaxDetailsRv(0);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Valid Property ID is required');
    });
  });
});
