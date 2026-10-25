/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from 'vitest';
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: vi.fn(() => Promise.resolve({ get: vi.fn(), getAll: vi.fn() })) }));
vi.mock('@/lib/utils/cookie', () => ({ getUserIdFromCookies: vi.fn(() => 1) }));

vi.mock('@/lib/api/asset-masters/inventory-condition.service', () => ({
  inventoryConditionService: { create: vi.fn(), update: vi.fn(), delete: vi.fn(), getById: vi.fn(), getAll: vi.fn() }
}));

import { createInventoryConditionAction, updateInventoryConditionAction, deleteInventoryConditionAction, getInventoryConditionByIdAction } from '@/app/[locale]/assets/configuration/master-data/inventory-condition/actions';
import { inventoryConditionService } from '@/lib/api/asset-masters/inventory-condition.service';

describe('InventoryCondition Actions', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it('creates', async () => {
    vi.mocked(inventoryConditionService.create).mockResolvedValue({ id: 1 } as any);
    const result = await createInventoryConditionAction({ inventoryItemCategoryId: 1, conditionType: "Inventory", conditionName: "New", conditionFactor: 0.5, displayOrder: 1, description: "", isActive: true } as any);
    expect(result.success).toBe(true);
  });
  it('updates', async () => {
    vi.mocked(inventoryConditionService.update).mockResolvedValue({ id: 1 } as any);
    const result = await updateInventoryConditionAction({ id: 1, inventoryItemCategoryId: 1, conditionType: "Inventory", conditionName: "Up", conditionFactor: 0.5, displayOrder: 1, description: "", isActive: true } as any);
    expect(result.success).toBe(true);
  });
  it('deletes', async () => {
    vi.mocked(inventoryConditionService.delete).mockResolvedValue(true as any);
    const result = await deleteInventoryConditionAction('1');
    expect(result.success).toBe(true);
  });
  it('gets by id', async () => {
    vi.mocked(inventoryConditionService.getById).mockResolvedValue({ id: 1 } as any);
    const result = await getInventoryConditionByIdAction('1');
    expect(result).toBeDefined();
  });
});
