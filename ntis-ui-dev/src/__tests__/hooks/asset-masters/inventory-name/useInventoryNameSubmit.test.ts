/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { useInventoryNameSubmit } from '@/hooks/asset-masters/inventory-name/useInventoryNameSubmit';

vi.mock('@/app/[locale]/assets/configuration/master-data/inventory-name/actions', () => ({
  createInventoryNameAction: vi.fn(),
  updateInventoryNameAction: vi.fn(),
  saveInventoryNameAction: vi.fn()
}));
vi.mock('next/navigation', () => ({ useRouter: vi.fn() }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));

describe('useInventoryNameSubmit', () => {
  it('initializes', () => {
    const props = {} as any;
    const { result } = renderHook(() => useInventoryNameSubmit(props));
    expect(result.current.handleSubmit).toBeDefined();
  });
});
