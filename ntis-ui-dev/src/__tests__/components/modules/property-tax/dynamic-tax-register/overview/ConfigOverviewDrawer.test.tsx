import { render, screen } from '@testing-library/react';
import { ConfigOverviewDrawer } from '@/components/modules/property-tax/dynamic-tax-register/overview/ConfigOverviewDrawer';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/en/property-tax/dynamic-tax-register',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ locale: 'en' }),
}));

describe('ConfigOverviewDrawer', () => {
  const props = {
    view: {
      tab: 'value',
      valueRows: [],
      valuePage: 1,
      valuePageSize: 10,
      valueTotalCount: 0,
      conditionRows: [],
      conditionFields: [],
      conditionPage: 1,
      conditionPageSize: 10,
      conditionTotalCount: 0,
      masterRows: [],
      masterPage: 1,
      masterPageSize: 10,
      masterTotalCount: 0,
      masterTaxOptions: [],
      masterKeyOptions: [],
      yearRangeOptions: [],
      typeOfUseGroups: [],
      descriptionOptions: [],
      filters: {
        valYear: 'all',
        valType: 'all',
        valDesc: 'all',
        mstTax: 'all',
        mstMaster: 'all',
      },
      loadFailed: false,
    },
  };

  it('renders overview drawer title', () => {
    render(<ConfigOverviewDrawer view={props.view as unknown as Parameters<typeof ConfigOverviewDrawer>[0]['view']} />);
    expect(screen.getByText('overview.title')).toBeInTheDocument();
  });
});
