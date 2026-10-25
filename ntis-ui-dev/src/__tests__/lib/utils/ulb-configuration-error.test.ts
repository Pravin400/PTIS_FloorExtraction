import { describe, it, expect } from 'vitest';
import { resolveUlbConfigurationErrorMessage } from '@/lib/utils/ulb-configuration-error';

const translate = (key: string) => {
  const map: Record<string, string> = {
    'validation.websiteFormat': 'Please enter a valid website URL',
    'messages.error': 'Something went wrong',
  };
  return map[key] ?? key;
};

describe('ulb-configuration-error', () => {
  it('maps backend error codes to validation messages', () => {
    expect(
      resolveUlbConfigurationErrorMessage('WebsiteUrl_Invalid_Format', translate, 'fallback')
    ).toBe('Please enter a valid website URL');
  });

  it('translates validation keys directly', () => {
    expect(
      resolveUlbConfigurationErrorMessage('validation.websiteFormat', translate, 'fallback')
    ).toBe('Please enter a valid website URL');
  });

  it('returns fallback for unknown errors', () => {
    expect(resolveUlbConfigurationErrorMessage(undefined, translate, 'fallback')).toBe('fallback');
  });
});
