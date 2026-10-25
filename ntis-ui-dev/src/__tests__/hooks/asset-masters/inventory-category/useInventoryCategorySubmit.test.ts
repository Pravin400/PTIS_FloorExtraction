/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { useInventoryCategorySubmit } from '@/hooks/asset-masters/inventory-category/useInventoryCategorySubmit';

vi.mock('@/app/[locale]/assets/configuration/master-data/inventory-category/actions', () => ({
  createInventoryCategoryAction: vi.fn(),
  updateInventoryCategoryAction: vi.fn(),
  saveInventoryCategoryAction: vi.fn()
}));
vi.mock('next/navigation', () => ({ useRouter: vi.fn() }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));

describe('useInventoryCategorySubmit', () => {
  it('initializes', () => {
    const props = {} as any;
    const { result } = renderHook(() => useInventoryCategorySubmit(props));
    expect(result.current.handleSubmit).toBeDefined();
  });
});
