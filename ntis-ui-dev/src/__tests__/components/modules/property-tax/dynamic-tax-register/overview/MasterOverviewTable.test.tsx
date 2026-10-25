import { render, screen } from '@testing-library/react';
import { MasterOverviewTable } from '@/components/modules/property-tax/dynamic-tax-register/overview/MasterOverviewTable';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('MasterOverviewTable', () => {
  const props = {
    rows: [],
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
  };

  it('renders master table correctly', () => {
    render(<MasterOverviewTable {...props} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('renders load failed message if loadFailed is set', () => {
    render(<MasterOverviewTable {...props} loadFailed={true} />);
    expect(screen.getByText('overview.loadError')).toBeInTheDocument();
  });
});
