/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from 'vitest';
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: vi.fn(() => Promise.resolve({ get: vi.fn(), getAll: vi.fn() })) }));
vi.mock('@/lib/utils/cookie', () => ({ getUserIdFromCookies: vi.fn(() => 1) }));

vi.mock('@/lib/api/asset-masters/ownership-type.service', () => ({
  ownershipTypeService: { create: vi.fn(), update: vi.fn(), delete: vi.fn(), getById: vi.fn(), getAll: vi.fn() }
}));

import { createOwnershipTypeAction, updateOwnershipTypeAction, deleteOwnershipTypeAction, getOwnershipTypeByIdAction } from '@/app/[locale]/assets/configuration/master-data/ownership-type/actions';
import { ownershipTypeService } from '@/lib/api/asset-masters/ownership-type.service';

describe('OwnershipType Actions', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it('creates', async () => {
    vi.mocked(ownershipTypeService.create).mockResolvedValue({ id: 1 } as any);
    const result = await createOwnershipTypeAction({ ownershipTypeName: 'New', description: '', isActive: true } as any);
    expect(result.success).toBe(true);
  });
  it('updates', async () => {
    vi.mocked(ownershipTypeService.update).mockResolvedValue({ id: 1 } as any);
    const result = await updateOwnershipTypeAction({ id: 1, ownershipTypeName: 'Up', description: '', isActive: true } as any);
    expect(result.success).toBe(true);
  });
  it('deletes', async () => {
    vi.mocked(ownershipTypeService.delete).mockResolvedValue(true as any);
    const result = await deleteOwnershipTypeAction('1');
    expect(result.success).toBe(true);
  });
  it('gets by id', async () => {
    vi.mocked(ownershipTypeService.getById).mockResolvedValue({ id: 1 } as any);
    const result = await getOwnershipTypeByIdAction('1');
    expect(result).toBeDefined();
  });
});
