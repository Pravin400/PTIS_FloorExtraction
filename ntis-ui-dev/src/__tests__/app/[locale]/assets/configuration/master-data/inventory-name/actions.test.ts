/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from 'vitest';
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: vi.fn(() => Promise.resolve({ get: vi.fn(), getAll: vi.fn() })) }));
vi.mock('@/lib/utils/cookie', () => ({ getUserIdFromCookies: vi.fn(() => 1) }));

vi.mock('@/lib/api/asset-masters/inventory-item-name.service', () => ({
  inventoryItemNameService: { create: vi.fn(), update: vi.fn(), delete: vi.fn(), getById: vi.fn(), getAll: vi.fn() }
}));

import { createInventoryNameAction, updateInventoryNameAction, deleteInventoryNameAction, getInventoryNameByIdAction } from '@/app/[locale]/assets/configuration/master-data/inventory-name/actions';
import { inventoryItemNameService } from '@/lib/api/asset-masters/inventory-item-name.service';

describe('InventoryName Actions', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it('creates', async () => {
    vi.mocked(inventoryItemNameService.create).mockResolvedValue({ id: 1 } as any);
    const result = await createInventoryNameAction({ inventoryItemCategoryId: 1, subTypeCode: "C001", subTypeName: "New", description: "", displayOrder: 1, isActive: true } as any);
    expect(result.success).toBe(true);
  });
  it('rejects invalid display order on create', async () => {
    const result = await createInventoryNameAction({ inventoryItemCategoryId: 1, subTypeCode: "C001", subTypeName: "New", description: "", displayOrder: -1, isActive: true } as any);
    expect(result.success).toBe(false);
    expect((result as any).field).toBe('displayOrder');
  });
  it('updates', async () => {
    vi.mocked(inventoryItemNameService.update).mockResolvedValue({ id: 1 } as any);
    const result = await updateInventoryNameAction({ id: 1, inventoryItemCategoryId: 1, subTypeCode: "C001", subTypeName: "Up", description: "", displayOrder: 1, isActive: true } as any);
    expect(result.success).toBe(true);
  });
  it('rejects invalid display order on update', async () => {
    const result = await updateInventoryNameAction({ id: 1, inventoryItemCategoryId: 1, subTypeCode: "C001", subTypeName: "Up", description: "", displayOrder: 0, isActive: true } as any);
    expect(result.success).toBe(false);
    expect((result as any).field).toBe('displayOrder');
  });
  it('deletes', async () => {
    vi.mocked(inventoryItemNameService.delete).mockResolvedValue(true as any);
    const result = await deleteInventoryNameAction('1');
    expect(result.success).toBe(true);
  });
  it('gets by id', async () => {
    vi.mocked(inventoryItemNameService.getAll).mockResolvedValue({ items: [{ id: 1 }] } as any);
    const result = await getInventoryNameByIdAction('1');
    expect(result).toBeDefined();
  });
});
