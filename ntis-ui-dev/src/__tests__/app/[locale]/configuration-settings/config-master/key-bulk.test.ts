import { beforeEach, describe, expect, it, vi } from 'vitest';

const { verifySessionMock, getLocaleFromHeadersMock, tConfigMessageMock, revalidatePathMock } =
  vi.hoisted(() => ({
    verifySessionMock: vi.fn(),
    getLocaleFromHeadersMock: vi.fn(),
    tConfigMessageMock: vi.fn(),
    revalidatePathMock: vi.fn(),
  }));

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock('@/app/[locale]/configuration-settings/config-master/actions/utils', () => ({
  verifySession: verifySessionMock,
  getLocaleFromHeaders: getLocaleFromHeadersMock,
  tConfigMessage: tConfigMessageMock,
  processBatch: async <T, R>(items: T[], processor: (item: T) => Promise<R>) =>
    Promise.all(items.map(processor)),
  MAX_CONCURRENT_UPDATES: 10,
}));

vi.mock('@/lib/api/configuration-settings/config-master/configMaster.service', () => ({
  configMasterService: {
    getAllConfigKeys: vi.fn(),
    updateConfigKey: vi.fn(),
  },
}));

import { configMasterService } from '@/lib/api/configuration-settings/config-master/configMaster.service';
import { updateAllConfigKeysStatusByCategoryIdAction } from '@/app/[locale]/configuration-settings/config-master/actions/key-bulk';

describe('updateAllConfigKeysStatusByCategoryIdAction', () => {
  beforeEach(() => {
    verifySessionMock.mockReset();
    getLocaleFromHeadersMock.mockReset();
    tConfigMessageMock.mockReset();
    revalidatePathMock.mockReset();
  });

  it('returns a dedicated success message when no configurations exist in the category', async () => {
    verifySessionMock.mockResolvedValue(7);
    tConfigMessageMock.mockImplementation(async (_key: string, fallback: string) => fallback);

    vi.mocked(configMasterService.getAllConfigKeys).mockResolvedValue({
      success: true,
      data: [{ categoryId: 99, isEnabled: true, configKeyId: 1 }] as never,
    });

    const result = await updateAllConfigKeysStatusByCategoryIdAction(5, true);

    expect(result).toMatchObject({
      success: true,
      message: 'No configurations found in this category',
    });
    expect(tConfigMessageMock).toHaveBeenCalledWith(
      'noConfigurationsFound',
      'No configurations found in this category'
    );
  });

  it('returns a stable success message when all configurations already match the requested state', async () => {
    verifySessionMock.mockResolvedValue(7);
    tConfigMessageMock.mockImplementation(async (_key: string, fallback: string) => fallback);

    vi.mocked(configMasterService.getAllConfigKeys).mockResolvedValue({
      success: true,
      data: [
        {
          categoryId: 5,
          isEnabled: true,
          configKeyId: 1,
        },
      ] as never,
    });

    const result = await updateAllConfigKeysStatusByCategoryIdAction(5, true);

    expect(result).toMatchObject({
      success: true,
      message: 'All configurations are already in the desired state',
    });
    expect(tConfigMessageMock).toHaveBeenCalledWith(
      'configAlreadyInDesiredState',
      'All configurations are already in the desired state'
    );
  });
});
