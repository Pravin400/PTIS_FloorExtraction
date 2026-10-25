import { beforeEach, describe, expect, it, vi } from 'vitest';

const { headersMock, getTranslationsMock } = vi.hoisted(() => ({
  headersMock: vi.fn(),
  getTranslationsMock: vi.fn(),
}));

vi.mock('next/headers', () => ({
  headers: headersMock,
  cookies: vi.fn(),
}));

vi.mock('next-intl/server', () => ({
  getTranslations: getTranslationsMock,
}));

import { tConfigMessage } from '@/app/[locale]/configuration-settings/config-master/actions/utils';

describe('config-master action utils', () => {
  beforeEach(() => {
    headersMock.mockReset();
    getTranslationsMock.mockReset();
  });

  it('falls back when next-intl returns the raw nested key path', async () => {
    headersMock.mockResolvedValue({
      get: (name: string) => (name === 'x-pathname' ? '/en/configuration-settings/config-master' : null),
    });
    getTranslationsMock.mockResolvedValue((key: string) => `configMaster.messages.${key}`);

    await expect(tConfigMessage('configBulkEnabled', 'All configurations enabled successfully')).resolves.toBe(
      'All configurations enabled successfully'
    );
  });

  it('returns the translated message when the key resolves correctly', async () => {
    headersMock.mockResolvedValue({
      get: (name: string) => (name === 'x-pathname' ? '/en/configuration-settings/config-master' : null),
    });
    getTranslationsMock.mockResolvedValue(() => 'Translated message');

    await expect(tConfigMessage('configBulkEnabled', 'All configurations enabled successfully')).resolves.toBe(
      'Translated message'
    );
  });
});
