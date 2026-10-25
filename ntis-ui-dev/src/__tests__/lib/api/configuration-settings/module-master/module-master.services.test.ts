import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiError } from '@/lib/utils/api';

vi.mock('@/services/api.service', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/api/configuration-settings/module-master/module-master.validator', () => ({
  normalizeModuleData: (data: unknown) => data,
}));

import { apiClient } from '@/services/api.service';
import {
  getModuleMastersPaged,
  getModuleMasterById,
  createModuleMaster,
  updateModuleMaster,
  deleteModuleMaster,
  getModuleMastersSummary,
} from '@/lib/api/configuration-settings/module-master/module-master.services';
import type { ModuleMaster } from '@/types/moduleMaster.types';

const mockModule: ModuleMaster = {
  moduleId: 1,
  departmentId: 10,
  moduleCode: 'MOD001',
  moduleName: 'Admin Module',
  moduleNameLocal: 'एडमिन',
  moduleIcon: 'settings',
  moduleLabel: 'Admin',
  moduleDescription: 'Admin module description',
  departmentName: 'IT',
  isActive: true,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Module Master Service', () => {
  describe('getModuleMastersPaged', () => {
    it('returns normalized paged data on success with standard paginated shape', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: {
          items: [mockModule],
          totalCount: 1,
          totalPages: 1,
        },
        statusCode: 200,
      });

      const result = await getModuleMastersPaged(1, 10);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].moduleId).toBe(1);
      expect(result.totalCount).toBe(1);
    });

    it('returns normalized paged data on success with raw array shape', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: [mockModule],
        statusCode: 200,
      });

      const result = await getModuleMastersPaged(1, 10);
      expect(result.items).toHaveLength(1);
      expect(result.totalCount).toBe(1);
    });

    it('throws ApiError on failure response', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: false,
        error: 'Fetch failed',
        statusCode: 500,
      });

      await expect(getModuleMastersPaged(1, 10)).rejects.toThrow(ApiError);
    });
  });

  describe('getModuleMasterById', () => {
    it('returns normalized module data on success', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockModule,
        statusCode: 200,
      });

      const result = await getModuleMasterById(1);
      expect(result.moduleId).toBe(1);
    });

    it('throws ApiError on failure response', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: false,
        error: 'Not Found',
        statusCode: 404,
      });

      await expect(getModuleMasterById(1)).rejects.toThrow(ApiError);
    });
  });

  describe('createModuleMaster', () => {
    it('resolves on success', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
        data: null,
        statusCode: 201,
      });

      await expect(createModuleMaster(mockModule as never, 123)).resolves.toBeUndefined();
      expect(apiClient.post).toHaveBeenCalledWith(
        '/ModuleMaster',
        expect.objectContaining({
          moduleId: 0,
          createdBy: 123,
        })
      );
    });

    it('throws ApiError on failure response', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        success: false,
        error: 'Bad Request',
        statusCode: 400,
      });

      await expect(createModuleMaster(mockModule as never, 123)).rejects.toThrow(ApiError);
    });
  });

  describe('updateModuleMaster', () => {
    it('resolves on success', async () => {
      vi.mocked(apiClient.put).mockResolvedValue({
        success: true,
        data: null,
        statusCode: 200,
      });

      await expect(updateModuleMaster(1, mockModule as never, 123)).resolves.toBeUndefined();
      expect(apiClient.put).toHaveBeenCalledWith(
        '/ModuleMaster/1',
        expect.objectContaining({
          moduleId: 1,
          updatedBy: 123,
        })
      );
    });

    it('throws ApiError on failure response', async () => {
      vi.mocked(apiClient.put).mockResolvedValue({
        success: false,
        error: 'Conflict',
        statusCode: 409,
      });

      await expect(updateModuleMaster(1, mockModule as never, 123)).rejects.toThrow(ApiError);
    });
  });

  describe('deleteModuleMaster', () => {
    it('resolves on success', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({
        success: true,
        data: null,
        statusCode: 200,
      });

      await expect(deleteModuleMaster(1)).resolves.toBeUndefined();
      expect(apiClient.delete).toHaveBeenCalledWith('/ModuleMaster/1');
    });

    it('throws ApiError on failure response', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({
        success: false,
        error: 'Forbidden',
        statusCode: 403,
      });

      await expect(deleteModuleMaster(1)).rejects.toThrow(ApiError);
    });
  });

  describe('getModuleMastersSummary', () => {
    it('returns empty array if first page has no items', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: { items: [], totalPages: 0, totalCount: 0 },
        statusCode: 200,
      });

      const result = await getModuleMastersSummary();
      expect(result).toEqual([]);
    });

    it('returns unique modules combined from multiple pages under limit', async () => {
      const page1 = {
        items: [{ ...mockModule, moduleId: 1 }],
        totalPages: 2,
        totalCount: 2,
      };
      const page2 = {
        items: [{ ...mockModule, moduleId: 2 }],
        totalPages: 2,
        totalCount: 2,
      };

      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ success: true, data: page1, statusCode: 200 })
        .mockResolvedValueOnce({ success: true, data: page2, statusCode: 200 });

      const result = await getModuleMastersSummary();
      expect(result).toHaveLength(2);
      expect(result.map((m) => m.moduleId)).toEqual([1, 2]);
    });

    it('degrades gracefully and returning partial results when pages exceed safe limit', async () => {
      // Simulate first page indicating 15 total pages (exceeds MAX_SUMMARY_PAGES = 10)
      const page1 = {
        items: [{ ...mockModule, moduleId: 1 }],
        totalPages: 15,
        totalCount: 15,
      };

      // Mock responses for the next 9 pages
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: { items: [], totalPages: 15, totalCount: 15 },
        statusCode: 200,
      });
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        data: page1,
        statusCode: 200,
      });

      const result = await getModuleMastersSummary();

      // Expecting apiClient.get to be called exactly 10 times:
      // 1 for first page + 9 for remaining pages (capping at MAX_SUMMARY_PAGES = 10)
      expect(apiClient.get).toHaveBeenCalledTimes(10);
      expect(result).toHaveLength(1);
    });
  });
});
