import { render, screen } from '@testing-library/react';
import { ValueHeaderExtra } from '@/components/modules/property-tax/dynamic-tax-register/settings/sections/value/ValueHeaderExtra';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('ValueHeaderExtra', () => {
  const props: Parameters<typeof ValueHeaderExtra>[0] = {
    valBaseType: 'RV',
    setValBaseType: vi.fn(),
    valYearId: 0,
    yearSelectOptions: [],
    onValYearChange: vi.fn(),
    valUserGroup: 'all',
    userGroupOptions: [],
    onValGroupChange: vi.fn(),
    valBulk: '0',
    setValBulk: vi.fn(),
    valBusy: false,
    handleValBulkApply: vi.fn(),
  };

  it('renders value header extra filter controls', () => {
    render(<ValueHeaderExtra {...props} />);
    expect(screen.getByText('value.baseType')).toBeInTheDocument();
  });
});
