import { describe, it, expect } from 'vitest';
import { 
  getCategoryKey, 
  fmtRupee, 
  mapSummaryToStats, 
  sanitizeDashboardParams 
} from '@/lib/utils/asset-utils/asset-dashboard-helpers';
import type { AssetSummaryData, RawCategory } from '@/types/assets/dashboard/master-dashboard/asset-dashboard.types';

describe('asset-dashboard-helpers', () => {
  describe('getCategoryKey', () => {
    it('should normalize and map valid categories', () => {
      expect(getCategoryKey('land')).toBe('land');
      expect(getCategoryKey('LAND')).toBe('land');
      expect(getCategoryKey('  building  ')).toBe('building');
      expect(getCategoryKey('buildings')).toBe('building');
      expect(getCategoryKey('infrastructure')).toBe('infrastructure');
      expect(getCategoryKey('movable')).toBe('movable');
    });

    it('should return empty string for unmapped categories', () => {
      expect(getCategoryKey('unknown')).toBe('');
      expect(getCategoryKey('')).toBe('');
      expect(getCategoryKey(null as unknown as string)).toBe('');
    });
  });

  describe('fmtRupee', () => {
    it('should format values below 100 as Lakhs', () => {
      expect(fmtRupee(0)).toBe('₹ 0');
      expect(fmtRupee(50)).toBe('₹ 50 Lakh');
      expect(fmtRupee(99.9)).toBe('₹ 99.90 Lakh');
    });

    it('should format values 100 and above as Crores', () => {
      expect(fmtRupee(100)).toBe('₹ 1 Cr');
      expect(fmtRupee(150)).toBe('₹ 1.50 Cr');
      expect(fmtRupee(1000)).toBe('₹ 10 Cr');
    });

    it('should handle negative values correctly', () => {
      // Since it uses >= 100 for Crores, negatives will fall to Lakhs.
      // Usually currency won't be negative but we test it.
      expect(fmtRupee(-50)).toBe('₹ -50 Lakh');
    });
  });

  describe('sanitizeDashboardParams', () => {
    it('should sanitize valid params correctly', () => {
      const params = {
        zone: ' North ',
        ward: ' Ward A ',
        typeId: '12',
        cats: '1,2,3'
      };
      
      const result = sanitizeDashboardParams(params);
      
      expect(result.zone).toBe('North');
      expect(result.ward).toBe('Ward A');
      expect(result.typeId).toBe(12);
      expect(result.categoryId).toBeNull(); // Multiple cats
      expect(result.catsStr).toBe('1,2,3');
    });

    it('should handle single category correctly', () => {
      const params = { cats: '5' };
      const result = sanitizeDashboardParams(params);
      expect(result.categoryId).toBe(5);
    });

    it('should handle default and "all" values', () => {
      const params = { zone: 'all', ward: 'all', typeId: 'invalid' };
      const result = sanitizeDashboardParams(params);
      
      expect(result.zone).toBe('all');
      expect(result.ward).toBe('all');
      expect(result.typeId).toBeNull();
    });
  });

  describe('mapSummaryToStats', () => {
    it('should handle empty or null inputs', () => {
      const result = mapSummaryToStats(null, []);
      
      expect(result.totalAssets.value).toBe('0');
      expect(result.totalValue.value).toBe('₹ 0');
      expect(result.encroachments.value).toBe('0');
      expect(result.maintenance.value).toBe('0');
      expect(result.auctions.value).toBe('0');
      expect(result.acquisitions.value).toBe('0');
    });

    it('should map summary stats correctly', () => {
      const summary: AssetSummaryData = {
        totalAssetsCount: 1500,
        totalAssetsValue: 25000000,
        encroachmentChange: '+5%',
        maintenanceAssets: 10
      };
      
      const categories: RawCategory[] = [
        { categoryName: 'Land', count: 500, value: 100000, categoryId: 1 }
      ];

      const result = mapSummaryToStats(summary, categories);
      
      expect(result.totalAssets.value).toBe('1,500'); // 1500 formatted en-IN
      expect(result.totalValue.value).toBe('₹ 2.50 Cr'); // 250000 -> 2.5Cr
      expect(result.encroachments.change).toBe('+5%');
      expect(result.maintenance.value).toBe('10');
      
      expect(result.totalAssets.backInfo).toHaveLength(1);
      expect(result.totalAssets.backInfo[0].label).toBe('Land');
      expect(result.totalAssets.backInfo[0].value).toBe('500');
    });
  });
});
