import { render, screen } from '@testing-library/react';
import { MasterTableSection } from '@/components/modules/property-tax/dynamic-tax-register/settings/sections/master/MasterTableSection';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('MasterTableSection', () => {
  const props: Parameters<typeof MasterTableSection>[0] = {
    mstRows: [],
    mstBusy: false,
    mstPage: 1,
    mstPageSize: 10,
    mstTotalPages: 1,
    mstTotalCount: 0,
    yearRangeOptions: [],
    patchMstRow: vi.fn(),
    onMstPageChange: vi.fn(),
    onMstPageSizeChange: vi.fn(),
  };

  it('renders master table section', () => {
    render(<MasterTableSection {...props} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
