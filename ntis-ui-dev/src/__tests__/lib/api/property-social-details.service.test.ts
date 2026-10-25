import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getPropertySocialDetailsByFilters,
  normalizePropertySocialDetailsDto,
  isPropertySocialDetailsShape,
} from '@/lib/api/property-social-details.service';
import { apiClient } from '@/services/api.service';

vi.mock('@/services/api.service', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('property-social-details.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('normalizePropertySocialDetailsDto', () => {
    it('should correctly normalize PascalCase fields from SQL/C# backend', () => {
      const rawPascal = {
        Id: 2746536,
        PropertyId: null,
        SocialAttributeId: 12,
        BitValue: 1,
        IntValue: 0,
        DecimalValue: 0.0,
        TextValue: 'string',
        DateValue: '2026-09-24',
        DocumentBindingId: 30427,
        Remark: 'apartment level',
        IsActive: 0,
        WingDetailId: null,
        SocietyDetailId: 1507857,
        EntityType: 'S',
      };

      const normalized = normalizePropertySocialDetailsDto(rawPascal);

      expect(normalized.id).toBe(2746536);
      expect(normalized.propertyId).toBe(0);
      expect(normalized.socialAttributeId).toBe(12);
      expect(normalized.bitValue).toBe(true);
      expect(normalized.documentBindingId).toBe(30427);
      expect(normalized.remark).toBe('apartment level');
      expect(normalized.societyDetailId).toBe(1507857);
      expect(normalized.wingDetailId).toBeNull();
      expect(normalized.entityType).toBe('S');
      expect(normalized.isActive).toBe(false);
    });

    it('should correctly normalize camelCase fields', () => {
      const rawCamel = {
        id: 2747542,
        propertyId: 0,
        socialAttributeId: 12,
        bitValue: true,
        intValue: 5,
        decimalValue: 10.5,
        textValue: 'Custom Remark',
        dateValue: '2026-09-25',
        documentBindingId: 31425,
        remark: 'apartment level',
        isActive: true,
        wingDetailId: 101,
        societyDetailId: 1507857,
        entityType: 'W',
      };

      const normalized = normalizePropertySocialDetailsDto(rawCamel);

      expect(normalized.id).toBe(2747542);
      expect(normalized.propertyId).toBe(0);
      expect(normalized.socialAttributeId).toBe(12);
      expect(normalized.bitValue).toBe(true);
      expect(normalized.intValue).toBe(5);
      expect(normalized.decimalValue).toBe(10.5);
      expect(normalized.textValue).toBe('Custom Remark');
      expect(normalized.documentBindingId).toBe(31425);
      expect(normalized.wingDetailId).toBe(101);
      expect(normalized.societyDetailId).toBe(1507857);
      expect(normalized.entityType).toBe('W');
      expect(normalized.isActive).toBe(true);
    });
  });

  describe('isPropertySocialDetailsShape', () => {
    it('should return true for valid object with id or socialAttributeId', () => {
      expect(isPropertySocialDetailsShape({ id: 1, socialAttributeId: 12 })).toBe(true);
      expect(isPropertySocialDetailsShape({ Id: 1, SocialAttributeId: 12 })).toBe(true);
      expect(isPropertySocialDetailsShape({ socialAttributeId: 12 })).toBe(true);
    });

    it('should return false for invalid or null values', () => {
      expect(isPropertySocialDetailsShape(null)).toBe(false);
      expect(isPropertySocialDetailsShape('string')).toBe(false);
      expect(isPropertySocialDetailsShape(123)).toBe(false);
    });
  });

  describe('getPropertySocialDetailsByFilters', () => {
    it('should handle direct array response with PascalCase items', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        statusCode: 200,
        data: [
          {
            Id: 2746536,
            SocialAttributeId: 12,
            BitValue: 1,
            SocietyDetailId: 1507857,
            Remark: 'apartment level',
          },
        ],
      });

      const result = await getPropertySocialDetailsByFilters(undefined, 1507857);

      expect(result).not.toBeNull();
      expect(result).toHaveLength(1);
      expect(result?.[0].id).toBe(2746536);
      expect(result?.[0].socialAttributeId).toBe(12);
      expect(result?.[0].bitValue).toBe(true);
      expect(result?.[0].societyDetailId).toBe(1507857);
    });

    it('should handle wrapped response object with { Items: [...] }', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        statusCode: 200,
        data: {
          Items: [
            {
              Id: 2747542,
              SocialAttributeId: 12,
              BitValue: 1,
              SocietyDetailId: 1507857,
            },
          ],
        },
      });

      const result = await getPropertySocialDetailsByFilters(undefined, 1507857);

      expect(result).not.toBeNull();
      expect(result).toHaveLength(1);
      expect(result?.[0].id).toBe(2747542);
    });

    it('should handle API response with { data: { appliedAttributes: [...] } }', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        statusCode: 200,
        data: {
          appliedAttributes: [
            {
              propertySocialDetailId: 2747546,
              socialAttributeId: 12,
              bitValue: true,
              societyDetailId: 1507857,
              remark: 'apartment level',
              documentBindingId: 31435,
              documentGuid: '11111111-2222-3333-4444-555555555555',
              fileName: 'bill.pdf',
              entityType: 'S',
              inheritedFrom: 'Apartment',
            },
          ],
        },
      });

      const result = await getPropertySocialDetailsByFilters(undefined, 1507857);

      expect(result).not.toBeNull();
      expect(result).toHaveLength(1);
      expect(result?.[0].id).toBe(2747546);
      expect(result?.[0].documentBindingId).toBe(31435);
      expect(result?.[0].documentGuid).toBe('11111111-2222-3333-4444-555555555555');
      expect(result?.[0].fileName).toBe('bill.pdf');
      expect(result?.[0].documentUrl).toBe('/api/documents/11111111-2222-3333-4444-555555555555/view');
      expect(result?.[0].entityType).toBe('S');
      expect(result?.[0].inheritedFrom).toBe('Apartment');
    });

    it('should return null when response fails or data is empty', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: false,
        statusCode: 500,
        error: 'Server error',
      });

      const result = await getPropertySocialDetailsByFilters(undefined, 1507857);
      expect(result).toBeNull();
    });

    it('should pass allLevels and entityType query parameters and normalize wingName and unitNo', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        statusCode: 200,
        data: [
          {
            id: 2748556,
            propertyId: 2079050,
            socialAttributeId: 10,
            wingDetailId: 1530993,
            societyDetailId: 1507857,
            wingName: 'BWING',
            unitNo: 'B10',
            entityType: 'P',
            remark: 'BWING-B10',
          },
        ],
      });

      const result = await getPropertySocialDetailsByFilters(undefined, 1507857, undefined, undefined, 'P', true);

      expect(apiClient.get).toHaveBeenCalledWith(
        '/PropertySocialDetails/by-filters?societyDetailId=1507857&entityType=P&allLevels=true'
      );
      expect(result).not.toBeNull();
      expect(result).toHaveLength(1);
      expect(result?.[0].wingName).toBe('BWING');
      expect(result?.[0].unitNo).toBe('B10');
      expect(result?.[0].entityType).toBe('P');
    });
  });
});
