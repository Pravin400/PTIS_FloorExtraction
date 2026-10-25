/**
 * Tests for applicableRateHelper utility
 */

import { describe, it, expect } from 'vitest';
import { findApplicableRate, resolveRateType } from '@/components/modules/property-tax/waterconnection/utils/applicableRateHelper';
import { mockRateMasters } from '@/__tests__/utils/waterConnectionTestUtils';

describe('findApplicableRate', () => {
  describe('when typeId or sizeId is empty', () => {
    it('should return null rate and notFound false when typeId is empty', () => {
      const result = findApplicableRate('', 1, mockRateMasters);
      expect(result).toEqual({ rate: null, notFound: false });
    });

    it('should return null rate and notFound false when sizeId is empty', () => {
      const result = findApplicableRate(1, '', mockRateMasters);
      expect(result).toEqual({ rate: null, notFound: false });
    });

    it('should return null rate and notFound false when both are empty', () => {
      const result = findApplicableRate('', '', mockRateMasters);
      expect(result).toEqual({ rate: null, notFound: false });
    });
  });

  describe('when valid typeId and sizeId are provided', () => {
    it('should return the correct rate for Domestic + 0.5 Inch', () => {
      const result = findApplicableRate(1, 1, mockRateMasters);
      expect(result.rate).toBe(1200); // Latest finance year 2024
      expect(result.notFound).toBe(false);
    });

    it('should return the correct rate for Domestic + 0.75 Inch', () => {
      const result = findApplicableRate(1, 2, mockRateMasters);
      expect(result.rate).toBe(1800);
      expect(result.notFound).toBe(false);
    });

    it('should return the correct rate for Commercial + 0.5 Inch', () => {
      const result = findApplicableRate(2, 1, mockRateMasters);
      expect(result.rate).toBe(2400);
      expect(result.notFound).toBe(false);
    });
  });

  describe('when no matching rate is found', () => {
    it('should return notFound true for non-existent combination', () => {
      const result = findApplicableRate(3, 3, mockRateMasters); // Industrial + 1 Inch - not in mock data
      expect(result.rate).toBe(null);
      expect(result.notFound).toBe(true);
    });

    it('should return notFound true for non-existent typeId', () => {
      const result = findApplicableRate(999, 1, mockRateMasters);
      expect(result.rate).toBe(null);
      expect(result.notFound).toBe(true);
    });

    it('should return notFound true for non-existent sizeId', () => {
      const result = findApplicableRate(1, 999, mockRateMasters);
      expect(result.rate).toBe(null);
      expect(result.notFound).toBe(true);
    });
  });

  describe('when multiple finance years exist', () => {
    it('should return the rate from the most recent finance year', () => {
      // mockRateMasters has Domestic + 0.5 Inch for both 2023 (1000) and 2024 (1200)
      const result = findApplicableRate(1, 1, mockRateMasters);
      expect(result.rate).toBe(1200); // 2024 rate, not 2023
      expect(result.notFound).toBe(false);
    });
  });

  describe('when rateMasters array is empty', () => {
    it('should return notFound true', () => {
      const result = findApplicableRate(1, 1, []);
      expect(result.rate).toBe(null);
      expect(result.notFound).toBe(true);
    });
  });

  describe('when rate is inactive', () => {
    it('should not return inactive rates', () => {
      const ratesWithInactive = [
        {
          id: 1,
          waterConnectionTypeId: 1,
          connectionTypeName: 'Domestic',
          waterConnectionSizeId: 1,
          connectionSizeDisplay: '0.5 Inch',
          financeYearId: 2024,
          yearCode: '2024-25',
          yearlyRate: 1200,
          isActive: false, // Inactive
        },
      ];
      const result = findApplicableRate(1, 1, ratesWithInactive);
      expect(result.rate).toBe(null);
      expect(result.notFound).toBe(true);
    });
  });

  describe('type coercion', () => {
    it('should handle string typeId and sizeId', () => {
      // The function uses Number() to convert, so this should work
      const result = findApplicableRate(1, 1, mockRateMasters);
      expect(result.rate).toBe(1200);
      expect(result.notFound).toBe(false);
    });
  });
});

describe('resolveRateType', () => {
  it('should return quarterly when category is Quarterly', () => {
    expect(resolveRateType('Quarterly')).toBe('quarterly');
    expect(resolveRateType('quarterly')).toBe('quarterly');
  });

  it('should return monthly when category is Monthly', () => {
    expect(resolveRateType('Monthly')).toBe('monthly');
    expect(resolveRateType('monthly')).toBe('monthly');
  });

  it('should return yearly when category is Yearly', () => {
    expect(resolveRateType('Yearly')).toBe('yearly');
    expect(resolveRateType('yearly')).toBe('yearly');
  });

  it('should infer rateType from rateMasters if category is null', () => {
    const quarterlyOnlyRates = [
      {
        id: 1,
        waterConnectionTypeId: 3,
        waterConnectionSizeId: 2,
        financeYearId: 2024,
        yearlyRate: 0,
        quarterlyRate: 450,
        monthlyRate: 0,
        isActive: true,
      },
    ];
    expect(resolveRateType(null, 3, 2, quarterlyOnlyRates)).toBe('quarterly');
  });

  it('should default to yearly if no category and no rateMasters match', () => {
    expect(resolveRateType(null)).toBe('yearly');
  });
});
