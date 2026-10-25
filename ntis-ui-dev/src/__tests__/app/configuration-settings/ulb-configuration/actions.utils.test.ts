import { describe, it, expect } from 'vitest';
import { parseApiError } from '@/app/[locale]/configuration-settings/ulb-configuration/actions.utils';

describe('ulb-configuration actions.utils', () => {
  it('maps known API error code to validation key', () => {
    expect(parseApiError('WebsiteUrl_Invalid_Format')).toBe('validation.websiteFormat');
  });

  it('extracts error code from JSON errors object', () => {
    const body = JSON.stringify({
      errors: {
        WebsiteUrl: ['WebsiteUrl_Invalid_Format'],
      },
    });
    expect(parseApiError(body)).toBe('validation.websiteFormat');
  });

  it('returns default key for unknown errors', () => {
    expect(parseApiError('SomethingUnexpected', 'messages.errorOccurred')).toBe(
      'messages.errorOccurred'
    );
  });
});
