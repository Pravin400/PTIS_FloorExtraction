import { describe, it, expect } from 'vitest';
import {
  calculateLicenseEndDate,
  calculateRenewalAlerts,
  generateLicenseKey,
} from '@/lib/utils/ulb-configuration.utils';

describe('ulb-configuration.utils', () => {
  it('calculates license end date from start date and duration in months', () => {
    expect(calculateLicenseEndDate('2026-06-01', '12')).toBe('2027-06-01');
  });

  it('returns empty end date when duration is custom', () => {
    expect(calculateLicenseEndDate('2026-06-01', 'custom')).toBe('');
  });

  it('builds renewal alerts for a valid end date', () => {
    const alerts = calculateRenewalAlerts('2027-06-01');
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts.some((alert) => alert.label === 'Expiry Day')).toBe(true);
  });

  it('generates license key in XXXX-XXXX-XXXX-XXXX format', () => {
    const key = generateLicenseKey();
    expect(key).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });
});
