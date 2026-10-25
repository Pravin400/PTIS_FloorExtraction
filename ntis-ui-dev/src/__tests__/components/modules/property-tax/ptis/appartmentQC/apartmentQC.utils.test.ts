import { describe, it, expect, vi } from 'vitest';
import type { ApartmentQCDetail } from '@/types/apartmentQC.types';
import {
  emptyPagedResponse,
  mainTabs,
  subTabsList,
  transformApartmentData,
  getTabTitle,
} from '@/components/modules/property-tax/ptis/appartmentQC/apartmentQC.utils';

// Mock the format utility
vi.mock('@/lib/utils/format', () => ({
  formatNumericDate: (date: unknown) => date ? '01/01/2024' : '-',
}));

describe('apartmentQC.utils', () => {
  describe('emptyPagedResponse', () => {
    it('should return an empty paged response with default values', () => {
      expect(emptyPagedResponse).toEqual({
        items: [],
        totalCount: 0,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      });
    });
  });

  describe('mainTabs', () => {
    it('should have the correct main tabs', () => {
      expect(mainTabs).toEqual([
        { value: 'amenities', label: 'Amenities', icon: 'Building2' },
        { value: 'commercial', label: 'Commercial Units', icon: 'Building' },
        { value: 'residential', label: 'Residential Units', icon: 'Home' },
      ]);
    });
  });

  describe('subTabsList', () => {
    it('should have the correct sub tabs', () => {
      expect(subTabsList).toEqual([
        { value: 'rateable', label: 'Rateable', icon: 'Calculator' },
        { value: 'capital', label: 'Capital', icon: 'IndianRupee' },
        { value: 'dual-method', label: 'Dual Method', icon: 'GitMerge' },
      ]);
    });
  });

  describe('transformApartmentData', () => {
    it('should transform data for commercial/residential tab', () => {
      const mockItems: Partial<ApartmentQCDetail>[] = [
        {
          id: 1,
          pdnId: 1,
          taxZoneId: 1,
          zoneNo: '1',
          propertyNo: '123',
          oldPropertyNo: '123',
          flatOrShopNo: 'A-101',
          flatOrShopName: 'Shop 1',
          ownerName: 'John Doe',
          occupierName: 'Jane Doe',
          rentMonthly: 1000,
          renterName: 'Renter 1',
          typeOfUse: 'Residential',
          type: 'Flat',
          floor: '1st Floor',
          assessmentYear: '2024',
          constructionYear: '2023',
          constructionType: 'Brick',
          carpetASqFt: 1000,
          carpetASqMtr: 92.9,
          builtupASqFt: 1200,
          builtupASqMtr: 111.48,
          oldConstructionArea: 800,
          oldRV: 5000,
          oldTotalTax: 1000,
          rateableValue: 6000,
          capitalValue: 100000,
          newTaxTotal: 1200,
          newTaxTotalRV: 1100,
          newTaxTotalCV: 100,
          mobileNo: '1234567890',
          emailId: 'test@test.com',
          ocDate: '2024-01-01',
          bhk: '1',
          wardNo: '1',
          wingName: 'A',
        },
      ];
      const transformed = transformApartmentData(mockItems as ApartmentQCDetail[], 'commercial');
      expect(transformed[0].oldPropertyNo).toBe('123');
      expect(transformed[0].flatOrShopNo).toBe('A-101');
      expect(transformed[0].flatOrShopName).toBe('Shop 1');
      expect(transformed[0].ownerName).toBe('John Doe');
    });

    it('should transform data for amenities tab', () => {
      const mockItems: Partial<ApartmentQCDetail>[] = [
        {
          id: 1,
          pdnId: 1,
          taxZoneId: 1,
          zoneNo: '1',
          propertyNo: '123',
          floor: '1st Floor',
          assessmentYear: '2024',
          constructionYear: '2023',
          typeOfUse: 'Residential',
          carpetASqFt: 1000,
          carpetASqMtr: 92.9,
          builtupASqFt: 1200,
          builtupASqMtr: 111.48,
          oldConstructionArea: 800,
          oldRV: 5000,
          newTaxTotalRV: 6000,
          newTaxTotalCV: 100000,
          ocDate: '2024-01-01',
        },
      ];
      const transformed = transformApartmentData(mockItems as ApartmentQCDetail[], 'amenities');
      expect(transformed[0].propertyNo).toBe('123');
      expect(transformed[0].floor).toBe('1st Floor');
    });

    it('should handle null/undefined values', () => {
      const mockItems: Partial<ApartmentQCDetail>[] = [{}];
      const transformed = transformApartmentData(mockItems as ApartmentQCDetail[], 'residential');
      expect(transformed[0].oldPropertyNo).toBeUndefined();
      expect(transformed[0].flatOrShopNo).toBe('-');
      expect(transformed[0].rentMonthly).toBe('-');
    });
  });

  describe('getTabTitle', () => {
    it('should return correct title for commercial tab', () => {
      const t = (key: string) => key;
      expect(getTabTitle('commercial', t)).toBe('apartmentTabs.commercialTitle');
    });

    it('should return correct title for residential tab', () => {
      const t = (key: string) => key;
      expect(getTabTitle('residential', t)).toBe('apartmentTabs.residentialTitle');
    });

    it('should return default title for amenities tab', () => {
      const t = (key: string) => key;
      expect(getTabTitle('amenities', t)).toBe('apartmentTabs.amenitiesTitle');
    });
  });
});