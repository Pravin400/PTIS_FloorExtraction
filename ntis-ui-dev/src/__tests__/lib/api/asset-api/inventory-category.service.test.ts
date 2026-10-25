/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { inventoryCategoryService } from '@/lib/api/asset-masters/inventory-category.service';
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

describe('inventoryCategoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should query /InventoryItemCategory with query parameters', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [{ id: 1, typeCode: 'IC01', typeName: 'Computer' }],
          totalCount: 1,
          totalPages: 1,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await inventoryCategoryService.getAll({ 
        PageNumber: 2, 
        PageSize: 5, 
        SearchTerm: 'Comp',
        TypeCode: 'TC',
        TypeName: 'ComputerName',
        MarkedForDeletion: true,
      });

      expect(apiClient.get).toHaveBeenCalledWith('/InventoryItemCategory?PageNumber=2&PageSize=5&SearchTerm=Comp&TypeCode=TC&TypeName=ComputerName&MarkedForDeletion=true');
      expect(result.items[0].typeName).toBe('Computer');
    });

    it('should query /InventoryItemCategory without params', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [],
          totalCount: 0,
          totalPages: 0,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await inventoryCategoryService.getAll();

      expect(apiClient.get).toHaveBeenCalledWith('/InventoryItemCategory?MarkedForDeletion=false');
      expect(result.items.length).toBe(0);
    });

    it('should throw ApiError if API call fails', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: false,
        statusCode: 400,
        error: 'Invalid request parameters',
      });

      await expect(inventoryCategoryService.getAll()).rejects.toThrow(ApiError);
    });

    it('should throw ApiError with status 409 if error message mentions duplicate', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: false,
        statusCode: undefined,
        error: 'Duplicate item found',
      });

      try {
        await inventoryCategoryService.getAll();
      } catch (error: any) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.statusCode).toBe(409);
      }
    });
  });

  describe('getById', () => {
    it('should query GET /InventoryItemCategory/{id}', async () => {
      const mockItem = { id: 5, typeCode: 'IC05', typeName: 'Furniture' };
      vi.mocked(apiClient.get).mockResolvedValue({ success: true, data: mockItem });

      const result = await inventoryCategoryService.getById(5);

      expect(apiClient.get).toHaveBeenCalledWith('/InventoryItemCategory/5');
      expect(result.typeName).toBe('Furniture');
    });

    it('should throw ApiError if getById fails', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: false,
        statusCode: 404,
        error: 'Not found',
      });

      await expect(inventoryCategoryService.getById(5)).rejects.toThrow(ApiError);
    });
  });

  describe('create', () => {
    it('should POST payload to /InventoryItemCategory', async () => {
      const payload = { typeCode: 'IC99', typeName: 'New Cat', displayOrder: 1, depreciationRate: 0.1 };
      vi.mocked(apiClient.post).mockResolvedValue({ success: true, data: { id: 12, ...payload } });

      const result = await inventoryCategoryService.create(payload);

      expect(apiClient.post).toHaveBeenCalledWith('/InventoryItemCategory', payload);
      expect(result.id).toBe(12);
    });

    it('should throw ApiError if create fails', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        success: false,
        statusCode: 500,
        error: 'Server error',
      });

      await expect(inventoryCategoryService.create({ typeCode: 'IC99', typeName: 'New Cat', displayOrder: 1, depreciationRate: 0.1 })).rejects.toThrow(ApiError);
    });
  });

  describe('update', () => {
    it('should PUT payload to /InventoryItemCategory/{id}', async () => {
      const payload = { typeCode: 'IC99', typeName: 'Updated Name', displayOrder: 1, depreciationRate: 0.12 };
      vi.mocked(apiClient.put).mockResolvedValue({ success: true, data: { id: 12, ...payload } });

      const result = await inventoryCategoryService.update(12, payload);

      expect(apiClient.put).toHaveBeenCalledWith('/InventoryItemCategory/12', payload);
      expect(result.depreciationRate).toBe(0.12);
    });

    it('should throw ApiError if update fails', async () => {
      vi.mocked(apiClient.put).mockResolvedValue({
        success: false,
        statusCode: 500,
        error: 'Server error',
      });

      await expect(inventoryCategoryService.update(12, { typeCode: 'IC99', typeName: 'Updated Name', displayOrder: 1, depreciationRate: 0.12 })).rejects.toThrow(ApiError);
    });
  });

  describe('delete', () => {
    it('should DELETE category at /InventoryItemCategory/{id}', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({ success: true, data: {} });

      await inventoryCategoryService.delete(12);

      expect(apiClient.delete).toHaveBeenCalledWith('/InventoryItemCategory/12');
    });

    it('should throw ApiError if delete fails', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({
        success: false,
        statusCode: 500,
        error: 'Server error',
      });

      await expect(inventoryCategoryService.delete(12)).rejects.toThrow(ApiError);
    });
  });

  describe('getAssetCategoriesForDropdown', () => {
    it('correctly parses isActive strings and numbers', async () => {
      const mockItems = [
        { id: 1, categoryName: 'Cat 1', isActive: 'false' },
        { id: 2, categoryName: 'Cat 2', isActive: 'true' },
        { id: 3, categoryName: 'Cat 3', isActive: 1 },
        { id: 4, categoryName: 'Cat 4', isActive: 0 },
        { id: 5, categoryName: 'Cat 5' },
      ];
      vi.mocked(apiClient.get).mockResolvedValue({ success: true, data: mockItems });

      const result = await inventoryCategoryService.getAssetCategoriesForDropdown();

      expect(result).toEqual([
        { id: 1, categoryName: 'Cat 1', categoryCode: undefined, isActive: false },
        { id: 2, categoryName: 'Cat 2', categoryCode: undefined, isActive: true },
        { id: 3, categoryName: 'Cat 3', categoryCode: undefined, isActive: true },
        { id: 4, categoryName: 'Cat 4', categoryCode: undefined, isActive: false },
        { id: 5, categoryName: 'Cat 5', categoryCode: undefined, isActive: true },
      ]);
    });
  });
});
