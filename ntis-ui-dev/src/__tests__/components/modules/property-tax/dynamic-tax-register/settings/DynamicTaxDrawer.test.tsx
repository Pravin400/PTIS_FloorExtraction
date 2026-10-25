import { render, screen } from '@testing-library/react';
import DynamicTaxDrawer from '@/components/modules/property-tax/dynamic-tax-register/settings/DynamicTaxDrawer';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/en/property-tax/dynamic-tax-register/add/1',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ locale: 'en' }),
}));

vi.mock('@/components/common/ConfirmProvider', () => ({
  useConfirm: () => ({ confirm: vi.fn() }),
}));

describe('DynamicTaxDrawer', () => {
  const props: Parameters<typeof DynamicTaxDrawer>[0] = {
    id: '1',
    initialTab: 'general',
    taxRow: null,
    ruleOptions: [],
    yearRangeOptions: [],
    valueRows: [],
    valueRowsTotalCount: 0,
    masterRows: [],
    masterRowsTotalCount: 0,
    hybridConfig: null,
    masterSource: null,
    typeOfUseOptions: [],
    masterKeyOptionsBySource: { PropertyType: [], OwnerType: [], TypeOfUse: [] },
    conditionRows: [],
    conditionFields: [],
    conditionScopeId: null,
    taxCategoryOptions: [],
    referenceTaxOptions: [],
    valueLoadFailed: false,
    masterLoadFailed: false,
    hybridLoadFailed: false,
  };

  it('renders drawer layout', () => {
    render(<DynamicTaxDrawer {...props} />);
    expect(screen.getByText(/drawer\.generalTab/)).toBeInTheDocument();
  });
});
