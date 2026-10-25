import { render, screen } from '@testing-library/react';
import { HybridOverviewTab } from '@/components/modules/property-tax/dynamic-tax-register/overview/HybridOverviewTab';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('HybridOverviewTab', () => {
  const props: Parameters<typeof HybridOverviewTab>[0] = {
    fields: [],
    conditionRows: [],
    conditionPageNumber: 1,
    conditionPageSize: 10,
    conditionTotalCount: 0,
    onConditionPageChange: vi.fn(),
    onConditionPageSizeChange: vi.fn(),
    masterRows: [],
    masterPageNumber: 1,
    masterPageSize: 10,
    masterTotalCount: 0,
    onMasterPageChange: vi.fn(),
    onMasterPageSizeChange: vi.fn(),
  };

  it('renders condition and master sections in hybrid overview tab', () => {
    render(<HybridOverviewTab {...props} />);
    expect(screen.getByText('overview.emptyHybrid')).toBeInTheDocument();
  });
});
