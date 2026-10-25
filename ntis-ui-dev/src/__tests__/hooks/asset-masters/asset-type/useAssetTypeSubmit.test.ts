/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { useAssetTypeSubmit } from '@/hooks/asset-masters/asset-type/useAssetTypeSubmit';

vi.mock('@/app/[locale]/assets/configuration/master-data/asset-type/actions', () => ({
  createAssetTypeAction: vi.fn(),
  updateAssetTypeAction: vi.fn(),
  saveAssetTypeAction: vi.fn()
}));
vi.mock('next/navigation', () => ({ useRouter: vi.fn() }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));

describe('useAssetTypeSubmit', () => {
  it('initializes', () => {
    const props = {} as any;
    const { result } = renderHook(() => useAssetTypeSubmit(props));
    expect(result.current.handleSubmit).toBeDefined();
  });
});
