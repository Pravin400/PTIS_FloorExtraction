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

vi.mock('@/lib/api/asset-masters/asset-type-crud.service', () => ({
  assetTypeService: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getById: vi.fn(),
  }
}));

import { revalidatePath } from 'next/cache';
import {
  saveAssetTypeAction,
  deleteAssetTypeAction,
  getAssetTypeByIdAction
} from '@/app/[locale]/assets/configuration/master-data/asset-type/actions';
import { assetTypeService } from '@/lib/api/asset-masters/asset-type-crud.service';

describe('AssetType Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveAssetTypeAction', () => {
    it('creates a record successfully and revalidates paths', async () => {
      vi.mocked(assetTypeService.create).mockResolvedValue({} as any);
      const formData = new FormData();
      formData.append('code', 'CODE1');
      formData.append('name', 'Name 1');
      formData.append('isActive', 'true');

      const result = await saveAssetTypeAction('', formData);
      expect(result.ok).toBe(true);
      expect(result.mode).toBe('create');
      expect(assetTypeService.create).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalled();
    });

    it('updates a record successfully and revalidates paths', async () => {
      vi.mocked(assetTypeService.update).mockResolvedValue({} as any);
      const formData = new FormData();
      formData.append('code', 'CODE2');
      formData.append('name', 'Name 2');
      formData.append('isActive', 'true');

      const result = await saveAssetTypeAction('10', formData);
      expect(result.ok).toBe(true);
      expect(result.mode).toBe('update');
      expect(assetTypeService.update).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalled();
    });

    it('handles errors gracefully', async () => {
      vi.mocked(assetTypeService.create).mockRejectedValue(new Error('Database error'));
      const formData = new FormData();
      const result = await saveAssetTypeAction('', formData);
      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('deleteAssetTypeAction', () => {
    it('deletes a record successfully', async () => {
      vi.mocked(assetTypeService.delete).mockResolvedValue(true as any);
      const formData = new FormData();
      formData.append('id', '5');

      const result = await deleteAssetTypeAction(formData);
      expect(result.ok).toBe(true);
      expect(assetTypeService.delete).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalled();
    });

    it('handles deletion errors gracefully', async () => {
      vi.mocked(assetTypeService.delete).mockRejectedValue(new Error('Cannot delete'));
      const formData = new FormData();
      formData.append('id', '5');

      const result = await deleteAssetTypeAction(formData);
      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getAssetTypeByIdAction', () => {
    it('fetches single record by ID', async () => {
      const mockItem = { id: 2, code: 'C2', name: 'N2', isActive: true };
      vi.mocked(assetTypeService.getById).mockResolvedValue(mockItem as any);

      const result = await getAssetTypeByIdAction(2);
      expect(result).toBeDefined();
      expect(assetTypeService.getById).toHaveBeenCalledWith('2');
    });

    it('returns null if record not found', async () => {
      vi.mocked(assetTypeService.getById).mockResolvedValue(null as any);
      const result = await getAssetTypeByIdAction(999);
      expect(result).toBeNull();
    });
  });
});

