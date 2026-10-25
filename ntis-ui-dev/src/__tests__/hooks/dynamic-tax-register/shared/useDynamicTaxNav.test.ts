import { renderHook } from '@testing-library/react';
import { useDynamicTaxNav } from '@/hooks/dynamic-tax-register/shared/useDynamicTaxNav';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/en/property-tax/dynamic-tax-register',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ locale: 'en' }),
}));

vi.mock('@/components/common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/common')>();
  return {
    ...actual,
    useConfirm: () => ({ confirm: vi.fn() }),
  };
});

describe('useDynamicTaxNav', () => {
  it('initializes nav state and routing helpers', () => {
    const { result } = renderHook(() => useDynamicTaxNav('1', null, undefined, 'general'));
    expect(result.current.locale).toBe('en');
    expect(typeof result.current.handleClose).toBe('function');
  });
});
