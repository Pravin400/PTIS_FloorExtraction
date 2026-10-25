import { render, screen } from '@testing-library/react';
import { ValueOverviewTab } from '@/components/modules/property-tax/dynamic-tax-register/overview/ValueOverviewTab';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('ValueOverviewTab', () => {
  const props = {
    taxes: [{ taxId: 1, taxName: 'General Tax', taxCode: 'GT' }],
    rows: [],
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
    yearRangeOptions: [],
    typeOfUseGroups: [],
    descriptionOptions: [],
    yearValue: 'all',
    typeValue: 'all',
    descValue: 'all',
    onYearChange: vi.fn(),
    onTypeChange: vi.fn(),
    onDescChange: vi.fn(),
  };

  it('renders value overview tab table', () => {
    render(<ValueOverviewTab {...props} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('shows empty text when taxes list is empty and not loading', () => {
    render(<ValueOverviewTab {...props} taxes={[]} loading={false} />);
    expect(screen.getByText('overview.emptyValue')).toBeInTheDocument();
  });
});
