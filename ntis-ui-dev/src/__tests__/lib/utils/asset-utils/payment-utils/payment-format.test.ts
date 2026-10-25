import { describe, expect, it } from 'vitest';
import { fmt, fmtDisplayDate } from '@/lib/utils/asset-utils/payment-utils/payment-format';

describe('payment-format utilities', () => {
  describe('fmt', () => {
    it('formats positive numbers as currency strings', () => {
      expect(fmt(1234.56)).toBe('1,234.56');
    });

    it('formats null or undefined as 0.00', () => {
      expect(fmt(null)).toBe('0.00');
      expect(fmt(undefined)).toBe('0.00');
    });
  });

  describe('fmtDisplayDate', () => {
    it('formats ISO date strings to DD/MM/YYYY format', () => {
      expect(fmtDisplayDate('2025-06-01')).toBe('01/06/2025');
    });

    it('returns hyphen for empty or invalid dates', () => {
      expect(fmtDisplayDate('')).toBe('-');
      expect(fmtDisplayDate(null as unknown as string)).toBe('-');
    });
  });
});
