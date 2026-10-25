import { describe, it, expect } from 'vitest';

// Sample utility functions to test
describe('Format Utilities', () => {
  describe('formatCurrency', () => {
    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    };

    it('formats positive numbers correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('formats zero correctly', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('formats negative numbers correctly', () => {
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
    });
  });

  describe('formatDate', () => {
    const formatDate = (date: Date): string => {
      return date.toISOString().split('T')[0];
    };

    it('formats date to YYYY-MM-DD', () => {
      const date = new Date('2026-01-15');
      expect(formatDate(date)).toBe('2026-01-15');
    });
  });
});
