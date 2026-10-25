import { render, screen } from '@testing-library/react';
import { ConditionSection } from '@/components/modules/property-tax/dynamic-tax-register/settings/sections/condition/ConditionSection';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('ConditionSection', () => {
  const conditionMock = {
    rows: [],
    fields: [],
    scopeMissing: false,
    dirty: false,
    busy: false,
    expandedRowId: null,
    toggleExpandRow: vi.fn(),
    handleAddRow: vi.fn(),
    handleRemoveRow: vi.fn(),
    handleMoveRow: vi.fn(),
    handleToggleActive: vi.fn(),
    handleToggleStopFurtherProcessing: vi.fn(),
    handleSetAssessmentBasis: vi.fn(),
    patchRowEffect: vi.fn(),
    handleAddCondition: vi.fn(),
    handleRemoveCondition: vi.fn(),
    patchCondition: vi.fn(),
    handleSave: vi.fn(),
    handleOpen: vi.fn(),
    testDisabledReason: null,
    testOpen: false,
    setTestOpen: vi.fn(),
    testValues: {},
    setTestValue: vi.fn(),
    testBusy: false,
    testResult: null,
    handleRunTest: vi.fn(),
    zoneOptions: [],
    wardOptions: [],
    propertyOptions: [],
    partitionOptions: [],
    financeYearOptions: [],
    resolveApiValueLabel: vi.fn(),
    yearRangeOptions: [],
    taxOptions: [],
    loadFailed: false,
  };

  it('renders condition section structure', () => {
    render(<ConditionSection condition={conditionMock as unknown as Parameters<typeof ConditionSection>[0]['condition']} />);
    expect(screen.getByText('condition.noRowsYet')).toBeInTheDocument();
  });
});
