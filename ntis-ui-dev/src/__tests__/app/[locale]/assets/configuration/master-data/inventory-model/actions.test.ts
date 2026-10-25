/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/headers', () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      get: vi.fn(() => undefined),
      getAll: vi.fn(() => []),
    })
  ),
}));
vi.mock('@/lib/utils/cookie', () => ({
  getUserIdFromCookies: vi.fn(() => 1),
}));

vi.mock('@/lib/api/asset-masters/inventory-model.service', () => ({
  inventoryModelService: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getById: vi.fn(),
  }
}));

import { revalidatePath } from 'next/cache';
import {
  saveInventoryModelAction,
  deleteInventoryModelAction,
  getInventoryModelByIdAction
} from '@/app/[locale]/assets/configuration/master-data/inventory-model/actions';
import { inventoryModelService } from '@/lib/api/asset-masters/inventory-model.service';

describe('InventoryModel Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveInventoryModelAction', () => {
    it('creates a record successfully and revalidates paths', async () => {
      vi.mocked(inventoryModelService.create).mockResolvedValue({} as any);
      const formData = new FormData();
      formData.append('code', 'CODE1');
      formData.append('name', 'Name 1');
      formData.append('group', '1');
      formData.append('displayOrder', '1');
      formData.append('isActive', 'true');

      const result = await saveInventoryModelAction('', formData);
      expect(result.ok).toBe(true);
      expect(result.mode).toBe('create');
      expect(inventoryModelService.create).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalled();
    });

    it('updates a record successfully and revalidates paths', async () => {
      vi.mocked(inventoryModelService.update).mockResolvedValue({} as any);
      const formData = new FormData();
      formData.append('code', 'CODE2');
      formData.append('name', 'Name 2');
      formData.append('group', '1');
      formData.append('displayOrder', '2');
      formData.append('isActive', 'true');

      const result = await saveInventoryModelAction('10', formData);
      expect(result.ok).toBe(true);
      expect(result.mode).toBe('update');
      expect(inventoryModelService.update).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalled();
    });

    it('rejects invalid displayOrder', async () => {
      const formData = new FormData();
      formData.append('name', 'Name 1');
      formData.append('group', '1');
      formData.append('displayOrder', '-5');

      const result = await saveInventoryModelAction('', formData);
      expect(result.ok).toBe(false);
      expect(result.error).toBe('Invalid display order');
    });

    it('handles errors gracefully', async () => {
      vi.mocked(inventoryModelService.create).mockRejectedValue(new Error('Database error'));
      const formData = new FormData();
      formData.append('group', '1');
      formData.append('displayOrder', '1');
      const result = await saveInventoryModelAction('', formData);
      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('deleteInventoryModelAction', () => {
    it('deletes a record successfully', async () => {
      vi.mocked(inventoryModelService.delete).mockResolvedValue(true as any);
      const formData = new FormData();
      formData.append('id', '5');

      const result = await deleteInventoryModelAction(formData);
      expect(result.ok).toBe(true);
      expect(inventoryModelService.delete).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalled();
    });

    it('handles deletion errors gracefully', async () => {
      vi.mocked(inventoryModelService.delete).mockRejectedValue(new Error('Cannot delete'));
      const formData = new FormData();
      formData.append('id', '5');

      const result = await deleteInventoryModelAction(formData);
      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getInventoryModelByIdAction', () => {
    it('fetches single record by ID', async () => {
      const mockItem = { id: 2, code: 'C2', name: 'N2', isActive: true };
      vi.mocked(inventoryModelService.getById).mockResolvedValue(mockItem as any);

      const result = await getInventoryModelByIdAction(2);
      expect(result).toBeDefined();
      expect(inventoryModelService.getById).toHaveBeenCalledWith('2');
    });

    it('returns null if record not found', async () => {
      vi.mocked(inventoryModelService.getById).mockResolvedValue(null as any);
      const result = await getInventoryModelByIdAction(999);
      expect(result).toBeNull();
    });
  });
});

