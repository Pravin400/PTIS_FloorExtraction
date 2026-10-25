import { render, screen } from '@testing-library/react';
import { MasterFilterBar } from '@/components/modules/property-tax/dynamic-tax-register/settings/sections/master/MasterFilterBar';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('MasterFilterBar', () => {
  const props: Parameters<typeof MasterFilterBar>[0] = {
    ruleOptions: [],
    ruleNameValue: '',
    onRuleNameChange: vi.fn(),
    mstYearId: 0,
    mstYearSelectOptions: [],
    onMstYearChange: vi.fn(),
    mstBulkMode: 'FIXED',
    setMstBulkMode: vi.fn(),
    mstBulkBase: 'NONE',
    setMstBulkBase: vi.fn(),
    mstBulk: '0',
    setMstBulk: vi.fn(),
    mstBusy: false,
    handleMstBulkApply: vi.fn(),
  };

  it('renders master filter bar controls', () => {
    render(<MasterFilterBar {...props} />);
    expect(screen.getByText('aliasFallback.assessment aliasFallback.yearRangeSuffix')).toBeInTheDocument();
  });
});
