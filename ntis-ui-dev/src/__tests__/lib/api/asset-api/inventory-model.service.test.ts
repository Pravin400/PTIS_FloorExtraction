 
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { inventoryModelService } from '@/lib/api/asset-masters/inventory-model.service';
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

describe('inventoryModelService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should query /InventoryItemModel with filters', async () => {
      const mockRes = {
        success: true,
        data: {
          items: [{ id: 1, modelName: 'SuperChair 2000' }],
          totalCount: 1,
          totalPages: 1,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockRes);

      const result = await inventoryModelService.getAll({ PageNumber: 1, PageSize: 10, SearchTerm: 'SuperChair' });

      expect(apiClient.get).toHaveBeenCalledWith('/InventoryItemModel?PageNumber=1&PageSize=10&SearchTerm=SuperChair&MarkedForDeletion=false');
      expect(result.items[0].modelName).toBe('SuperChair 2000');
    });

    it('should throw ApiError if get request returns success=false', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: false,
        statusCode: 500,
        error: 'Failed to retrieve models',
      });

      await expect(inventoryModelService.getAll()).rejects.toThrow(ApiError);
    });
  });

  describe('getById', () => {
    it('should query /InventoryItemModel/{id}', async () => {
      const mockModel = { id: 3, modelName: 'Table Deluxe' };
      vi.mocked(apiClient.get).mockResolvedValue({ success: true, data: mockModel });

      const result = await inventoryModelService.getById(3);

      expect(apiClient.get).toHaveBeenCalledWith('/InventoryItemModel/3');
      expect(result.modelName).toBe('Table Deluxe');
    });
  });

  describe('create', () => {
    it('should POST payload to /InventoryItemModel', async () => {
      const payload = { modelName: 'Executive Desk', inventoryItemNameId: 4, displayOrder: 1 };
      vi.mocked(apiClient.post).mockResolvedValue({ success: true, data: { id: 22, ...payload } });

      const result = await inventoryModelService.create(payload);

      expect(apiClient.post).toHaveBeenCalledWith('/InventoryItemModel', payload);
      expect(result.id).toBe(22);
    });
  });

  describe('update', () => {
    it('should PUT payload to /InventoryItemModel/{id}', async () => {
      const payload = { modelName: 'Executive Desk V2', inventoryItemNameId: 4, displayOrder: 1 };
      vi.mocked(apiClient.put).mockResolvedValue({ success: true, data: { id: 22, ...payload } });

      const result = await inventoryModelService.update(22, payload);

      expect(apiClient.put).toHaveBeenCalledWith('/InventoryItemModel/22', payload);
      expect(result.modelName).toBe('Executive Desk V2');
    });
  });

  describe('delete', () => {
    it('should DELETE category at /InventoryItemModel/{id}', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({ success: true, data: {} });

      await inventoryModelService.delete(22);

      expect(apiClient.delete).toHaveBeenCalledWith('/InventoryItemModel/22');
    });
  });
});
