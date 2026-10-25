import { render, screen } from '@testing-library/react';
import { ConditionOverviewTable } from '@/components/modules/property-tax/dynamic-tax-register/overview/ConditionOverviewTable';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('ConditionOverviewTable', () => {
  const props = {
    rows: [],
    fields: [],
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
  };

  it('renders table correctly', () => {
    render(<ConditionOverviewTable {...props} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('renders load failed state when loadFailed is true', () => {
    render(<ConditionOverviewTable {...props} loadFailed={true} />);
    expect(screen.getByText('overview.loadError')).toBeInTheDocument();
  });
});
