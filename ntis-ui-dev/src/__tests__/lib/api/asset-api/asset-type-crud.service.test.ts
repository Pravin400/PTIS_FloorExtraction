 
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assetTypeService } from '@/lib/api/asset-masters/asset-type-crud.service';
import { apiClient } from '@/services/api.service';
import { ApiError } from '@/lib/utils/api';

vi.mock('@/services/api.service', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('assetTypeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should query /AssetType with default parameters and return normalized response', async () => {
      const mockApiResponse = {
        success: true,
        data: {
          items: [
            {
              id: 1,
              typeCode: 'AT01',
              typeName: 'Building',
              categoryId: 10,
              categoryName: 'Buildings',
              description: 'Standard building asset',
              isActive: true,
              allowUnitRegistration: true,
              allowRoomRegistration: false,
              isSubUnit: true,
            },
          ],
          totalCount: 1,
          totalPages: 1,
          pageNumber: 1,
          pageSize: 10,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockApiResponse);

      const result = await assetTypeService.getAll({ PageNumber: 1, PageSize: 10 });

      expect(apiClient.get).toHaveBeenCalledWith('/AssetType?PageNumber=1&PageSize=10&MarkedForDeletion=false', { cache: 'no-store' });
      expect(result.items[0]).toEqual({
        id: 1,
        typeCode: 'AT01',
        typeName: 'Building',
        typeNameLocal: '',
        categoryId: 10,
        categoryName: 'Buildings',
        isActive: true,
        createdDate: '',
        updatedDate: null,
        name: 'Building',
        code: 'AT01',
        status: 'Active',
        description: 'Standard building asset',
        backendId: 1,
        group: '10',
        allowRoomRegistration: false,
        allowUnitRegistration: true,
        isSubUnit: true,
      });
      expect(result.totalCount).toBe(1);
    });

    it('should normalize string false isSubUnit values as false', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: { items: [{ id: 2, typeCode: 'AT02', typeName: 'Land', isSubUnit: 'false' }] },
      });

      const result = await assetTypeService.getAll();

      expect(result.items[0].isSubUnit).toBe(false);
    });

    it('should throw ApiError if apiClient returns success=false', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: false,
        statusCode: 500,
        error: 'Failed to fetch',
      });

      await expect(assetTypeService.getAll()).rejects.toThrow(ApiError);
    });
  });

  describe('getById', () => {
    it('should call GET /AssetType/{id}', async () => {
      const mockType = { id: 1, typeName: 'Equipment' };
      vi.mocked(apiClient.get).mockResolvedValue({ success: true, data: mockType });

      const result = await assetTypeService.getById(1);

      expect(apiClient.get).toHaveBeenCalledWith('/AssetType/1');
      expect(result).toEqual(mockType);
    });
  });

  describe('create', () => {
    it('should POST payload to /AssetType and return created record', async () => {
      const payload = { typeCode: 'T1', typeName: 'Test' };
      vi.mocked(apiClient.post).mockResolvedValue({ success: true, data: { id: 100, ...payload } });

      const result = await assetTypeService.create(payload);

      expect(apiClient.post).toHaveBeenCalledWith('/AssetType', payload);
      expect(result.id).toBe(100);
    });

    it('should append payload message and throw ApiError if creation fails', async () => {
      const payload = { typeCode: 'T1' };
      vi.mocked(apiClient.post).mockResolvedValue({ success: false, statusCode: 400, error: 'Bad request' });

      await expect(assetTypeService.create(payload)).rejects.toThrow(ApiError);
    });
  });

  describe('update', () => {
    it('should PUT payload to /AssetType/{id}', async () => {
      const payload = { id: 2, typeName: 'Modified' };
      vi.mocked(apiClient.put).mockResolvedValue({ success: true, data: payload });

      const result = await assetTypeService.update(2, payload);

      expect(apiClient.put).toHaveBeenCalledWith('/AssetType/2', payload);
      expect(result.typeName).toBe('Modified');
    });
  });

  describe('delete', () => {
    it('should DELETE with userId query param if provided', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({ success: true, data: {} });

      await assetTypeService.delete(2, 42);

      expect(apiClient.delete).toHaveBeenCalledWith('/AssetType/2?userId=42');
    });
  });
});
