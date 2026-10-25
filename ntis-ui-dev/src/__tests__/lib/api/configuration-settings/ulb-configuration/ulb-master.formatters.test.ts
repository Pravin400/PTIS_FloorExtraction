import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isValidIndianPhone,
  isValidPincode,
  isValidWebsiteUrl,
  normalizeWebsiteUrl,
} from '@/lib/api/configuration-settings/ulb-configuration/ulb-master.formatters';

describe('ulb-master.formatters', () => {
  describe('normalizeWebsiteUrl', () => {
    it('prepends https when protocol is missing', () => {
      expect(normalizeWebsiteUrl('akolamc.in')).toBe('https://akolamc.in');
    });

    it('preserves existing https URL', () => {
      expect(normalizeWebsiteUrl('https://www.ulb.gov.in')).toBe('https://www.ulb.gov.in');
    });

    it('returns empty string for blank input', () => {
      expect(normalizeWebsiteUrl('   ')).toBe('');
    });
  });

  describe('isValidWebsiteUrl', () => {
    it('accepts domain without protocol', () => {
      expect(isValidWebsiteUrl('akolamc.in')).toBe(true);
    });

    it('accepts full https URL', () => {
      expect(isValidWebsiteUrl('https://www.ulb.gov.in')).toBe(true);
    });

    it('allows empty optional website', () => {
      expect(isValidWebsiteUrl('')).toBe(true);
    });
  });

  describe('isValidEmail', () => {
    it('accepts valid email', () => {
      expect(isValidEmail('user@ulb.gov.in')).toBe(true);
    });

    it('rejects invalid email', () => {
      expect(isValidEmail('not-an-email')).toBe(false);
    });
  });

  describe('isValidIndianPhone', () => {
    it('accepts valid 10-digit mobile', () => {
      expect(isValidIndianPhone('9876543210')).toBe(true);
    });

    it('rejects short number', () => {
      expect(isValidIndianPhone('111111')).toBe(false);
    });
  });

  describe('isValidPincode', () => {
    it('accepts valid 6-digit pincode', () => {
      expect(isValidPincode('444000')).toBe(true);
    });

    it('rejects pincode starting with zero', () => {
      expect(isValidPincode('012345')).toBe(false);
    });
  });
});
