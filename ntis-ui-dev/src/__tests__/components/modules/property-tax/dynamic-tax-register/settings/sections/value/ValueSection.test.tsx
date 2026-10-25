import { render, screen } from '@testing-library/react';
import { ValueSection } from '@/components/modules/property-tax/dynamic-tax-register/settings/sections/value/ValueSection';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('ValueSection', () => {
  const valueMock = {
    valBaseType: 'RV',
    setValBaseType: vi.fn(),
    valYearId: 0,
    yearSelectOptions: [],
    onValYearChange: vi.fn(),
    valUserGroup: 'all',
    valUserGroupOptions: [],
    onValGroupChange: vi.fn(),
    valBulk: '0',
    setValBulk: vi.fn(),
    valPage: 1,
    valPageSize: 10,
    valTotalPages: 1,
    valFilteredCount: 0,
    valPagedRows: [],
    patchValRow: vi.fn(),
    onValPageChange: vi.fn(),
    onValPageSizeChange: vi.fn(),
    handleValSave: vi.fn(),
    valBusy: false,
    valDirty: false,
    loadFailed: false,
  };

  it('renders value section table', () => {
    render(<ValueSection value={valueMock as unknown as Parameters<typeof ValueSection>[0]['value']} onRetryLoad={vi.fn()} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
