import { describe, it, expect } from 'vitest';
import { money } from '@/components/modules/property-tax/extended-area-assessment/formatMoney';

describe('money', () => {
  it('formats a positive number with the ₹ symbol and two decimal places', () => {
    expect(money(1240)).toBe('₹1,240.00');
  });

  it('formats a decimal amount with two decimal places (no rounding beyond that)', () => {
    expect(money(1963.4)).toBe('₹1,963.40');
  });

  it('adds thousands separators for large amounts', () => {
    expect(money(123456.78)).toBe('₹1,23,456.78');
  });

  it('treats 0, null, and undefined all as ₹0.00', () => {
    expect(money(0)).toBe('₹0.00');
    expect(money(null as unknown as number)).toBe('₹0.00');
    expect(money(undefined as unknown as number)).toBe('₹0.00');
  });

  it('formats a negative amount with a leading minus sign', () => {
    expect(money(-500)).toBe('₹-500.00');
  });
});
