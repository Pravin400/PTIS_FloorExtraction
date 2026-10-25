import { render, screen } from '@testing-library/react';
import { HybridSection } from '@/components/modules/property-tax/dynamic-tax-register/settings/sections/HybridSection';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('HybridSection', () => {
  const hybridMock = {
    hybEvalPriority: 'MASTER_THEN_CONDITION',
    setHybEvalPriority: vi.fn(),
    hybFallback: 'DEFAULT_ZERO',
    setHybFallback: vi.fn(),
    hybBase: 'NONE',
    setHybBase: vi.fn(),
    hybBusy: false,
    handleHybridSave: vi.fn(),
    hybFieldOpen: true,
    setHybFieldOpen: vi.fn(),
    hybDataOpen: true,
    setHybDataOpen: vi.fn(),
    loadFailed: false,
    dirty: false,
  };

  const masterMock = {
    mstRuleDefinitionId: '',
    handleHybridMasterRuleChange: vi.fn(),
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
    mstPagedRows: [],
    mstFilteredLocalCount: 0,
    mstSeededLocally: false,
    mstPage: 1,
    mstPageSize: 10,
    mstTotalPages: 1,
    patchMstRow: vi.fn(),
    onMstPageChange: vi.fn(),
    onMstPageSizeChange: vi.fn(),
    handleMstSave: vi.fn(),
    handleSeedMaster: vi.fn(),
    loadFailed: false,
  };

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

  it('renders hybrid section strategy form and collapsible headers', () => {
    render(
      <HybridSection
        hybrid={hybridMock as unknown as Parameters<typeof HybridSection>[0]['hybrid']}
        master={masterMock as unknown as Parameters<typeof HybridSection>[0]['master']}
        condition={conditionMock as unknown as Parameters<typeof HybridSection>[0]['condition']}
        ruleOptions={[]}
        yearRangeOptions={[]}
        onRetryLoad={vi.fn()}
      />
    );
    expect(screen.getByText('hybrid.conditionRuleSection')).toBeInTheDocument();
    expect(screen.getByText('hybrid.masterDataMapping')).toBeInTheDocument();
  });
});
