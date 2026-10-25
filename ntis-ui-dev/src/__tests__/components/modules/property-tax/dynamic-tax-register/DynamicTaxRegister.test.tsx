import { render, screen } from '@testing-library/react';
import DynamicTaxRegister from '@/components/modules/property-tax/dynamic-tax-register/DynamicTaxRegister';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/en/property-tax/dynamic-tax-register',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ locale: 'en' }),
}));

describe('DynamicTaxRegister', () => {
  const props = {
    data: [],
    stats: {
      total: 10,
      valueBased: 4,
      conditionBased: 3,
      masterBased: 2,
      hybrid: 1,
    },
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 1,
    search: '',
    mode: 'all',
    status: 'all',
  };

  it('renders stats and table correctly', () => {
    render(<DynamicTaxRegister {...props} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
