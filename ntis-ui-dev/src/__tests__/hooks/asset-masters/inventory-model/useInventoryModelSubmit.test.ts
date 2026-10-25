/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { useInventoryModelSubmit } from '@/hooks/asset-masters/inventory-model/useInventoryModelSubmit';

vi.mock('@/app/[locale]/assets/configuration/master-data/inventory-model/actions', () => ({
  createInventoryModelAction: vi.fn(),
  updateInventoryModelAction: vi.fn(),
  saveInventoryModelAction: vi.fn()
}));
vi.mock('next/navigation', () => ({ useRouter: vi.fn() }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));

describe('useInventoryModelSubmit', () => {
  it('initializes', () => {
    const props = {} as any;
    const { result } = renderHook(() => useInventoryModelSubmit(props));
    expect(result.current.handleSubmit).toBeDefined();
  });
});
