import { describe, expect, it } from 'vitest';
import {
  buildExpandedRowsHref,
  formatTaxAmount,
  getTaxTranslationKey,
  parseExpandedRowIds,
} from '@/lib/utils/ptis';

describe('PTIS utilities', () => {
  describe('getTaxTranslationKey', () => {
    it('maps known uppercase API tax names to locale keys', () => {
      expect(getTaxTranslationKey('GENERAL TAX')).toBe('generalTax');
      expect(getTaxTranslationKey('SPECIAL WATER CESS')).toBe('spWaterCess');
    });

    it('normalizes spaced names and preserves camelCase values', () => {
      expect(getTaxTranslationKey('Water Benefit Cess')).toBe('waterBenefitCess');
      expect(getTaxTranslationKey('runTimePenalty')).toBe('runTimePenalty');
    });
  });

  describe('parseExpandedRowIds', () => {
    it('keeps only positive integer ids', () => {
      expect(parseExpandedRowIds('1, 2, abc, -1, 0, 3.5, 4')).toEqual([1, 2, 4]);
    });

    it('merges all values when the query param is array-valued (preserves state)', () => {
      expect(parseExpandedRowIds(['1,2', '4,5'])).toEqual([1, 2, 4, 5]);
    });

    it('returns an empty array for missing values', () => {
      expect(parseExpandedRowIds(undefined)).toEqual([]);
      expect(parseExpandedRowIds('')).toEqual([]);
    });
  });

  describe('buildExpandedRowsHref', () => {
    it('adds an id to the expanded query param', () => {
      expect(
        buildExpandedRowsHref(
          { propertyId: '10', tab: 'rateable' },
          7,
          [1, 2],
          'rateableExpand'
        )
      ).toBe('?propertyId=10&tab=rateable&rateableExpand=1%2C2%2C7');
    });

    it('removes an id when toggled off', () => {
      expect(
        buildExpandedRowsHref(
          { propertyId: '10', tab: 'capital', capitalExpand: '2,7' },
          7,
          [2, 7],
          'capitalExpand'
        )
      ).toBe('?propertyId=10&tab=capital&capitalExpand=2');
    });
  });

  describe('formatTaxAmount', () => {
    it('formats missing and decimal values consistently', () => {
      expect(formatTaxAmount('Rs.', undefined)).toBe('Rs. 0.00');
      expect(formatTaxAmount('Rs.', 1234.5)).toBe('Rs. 1,234.50');
    });
  });
});
