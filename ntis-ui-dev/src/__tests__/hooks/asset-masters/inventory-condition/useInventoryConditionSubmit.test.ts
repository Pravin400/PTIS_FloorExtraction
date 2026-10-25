/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { useInventoryConditionSubmit } from '@/hooks/asset-masters/inventory-condition/useInventoryConditionSubmit';

vi.mock('@/app/[locale]/assets/configuration/master-data/inventory-condition/actions', () => ({
  createInventoryConditionAction: vi.fn(),
  updateInventoryConditionAction: vi.fn(),
  saveInventoryConditionAction: vi.fn()
}));
vi.mock('next/navigation', () => ({ useRouter: vi.fn() }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));

describe('useInventoryConditionSubmit', () => {
  it('initializes', () => {
    const props = {} as any;
    const { result } = renderHook(() => useInventoryConditionSubmit(props));
    expect(result.current.handleSubmit).toBeDefined();
  });
});
