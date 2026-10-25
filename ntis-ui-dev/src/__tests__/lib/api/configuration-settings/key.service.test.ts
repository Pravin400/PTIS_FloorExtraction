import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllConfigKeys } from '@/lib/api/configuration-settings/config-master/key.service';
import { apiClient } from '@/services/api.service';

vi.mock('@/services/api.service', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('key.service - getAllConfigKeys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should normalize config keys successfully', async () => {
    const mockKeys = {
      items: [
        {
          id: 5,
          configKeyId: 5,
          categoryId: 1,
          configCode: 'PASSWORDALGORITHM',
          configName: 'Password Hashing Algorithm',
          description: 'Algorithm used for password hashing',
          dataType: 'String',
          controlType: 'textbox',
          defaultValue: 'BCrypt',
          isActive: true,
        },
      ],
    };

    const mockValues = {
      items: [],
    };

    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url.includes('/ConfigValueMaster')) {
        return Promise.resolve({ success: true, data: mockValues });
      }
      return Promise.resolve({ success: true, data: mockKeys });
    });

    const res = await getAllConfigKeys({ fetchAll: true });
    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    expect(res.data!.length).toBe(1);
    expect(res.data![0].name).toBe('Password Hashing Algorithm');
    expect(res.data![0].controlType).toBe('textbox');
  });

  it('should normalize integer config keys with number control type', async () => {
    const mockKeys = {
      items: [
        {
          id: 6,
          configKeyId: 6,
          categoryId: 1,
          configCode: 'PASSWORDMAXLEN',
          configName: 'Password Max Length',
          description: 'Maximum length of password',
          dataType: 'int',
          controlType: 'number',
          defaultValue: '12',
          isActive: true,
        },
      ],
    };

    const mockValues = {
      items: [],
    };

    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url.includes('/ConfigValueMaster')) {
        return Promise.resolve({ success: true, data: mockValues });
      }
      return Promise.resolve({ success: true, data: mockKeys });
    });

    const res = await getAllConfigKeys({ fetchAll: true });
    expect(res.success).toBe(true);
    expect(res.data![0].dataType).toBe('int');
    expect(res.data![0].defaultValue).toBe('12');
  });
});
