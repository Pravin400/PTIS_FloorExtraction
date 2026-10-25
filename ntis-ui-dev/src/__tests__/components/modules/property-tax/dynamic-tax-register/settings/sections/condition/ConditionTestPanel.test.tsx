import { render, screen } from '@testing-library/react';
import { ConditionTestPanel } from '@/components/modules/property-tax/dynamic-tax-register/settings/sections/condition/ConditionTestPanel';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('ConditionTestPanel', () => {
  const conditionMock = {
    open: true,
    handleClose: vi.fn(),
    zoneId: '',
    wardId: '',
    propertyNo: '',
    partitionKey: '',
    financeYear: '',
    setFinanceYear: vi.fn(),
    zoneOptions: [],
    wardOptions: [],
    propertyOptions: [],
    partitionOptions: [],
    financeYearOptions: [],
    wardsLoading: false,
    propertiesLoading: false,
    onZoneChange: vi.fn(),
    onWardChange: vi.fn(),
    onPropertyChange: vi.fn(),
    onPartitionChange: vi.fn(),
    testBusy: false,
    testResult: null,
    handleRunTest: vi.fn(),
    fields: [],
  };

  it('renders test panel title when open', () => {
    render(<ConditionTestPanel condition={conditionMock as unknown as Parameters<typeof ConditionTestPanel>[0]['condition']} />);
    expect(screen.getByText('condition.testPanel.title')).toBeInTheDocument();
  });
});
