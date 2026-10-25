import { renderHook, act } from '@testing-library/react';
import { toast } from 'sonner';
import { useDynamicTaxConditionRowOps } from '@/hooks/dynamic-tax-register/condition/useDynamicTaxConditionRowOps';
import type { ConditionRuleRow } from '@/types/dynamic-tax-register.types';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/app/[locale]/property-tax/dynamic-tax-register/action', () => ({
  saveConditionRuleRowsAction: vi.fn().mockResolvedValue({ success: true }),
  deleteConditionRuleRowAction: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/components/common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/common')>();
  return {
    ...actual,
    useConfirm: () => ({ confirm: vi.fn() }),
  };
});

const emptyConditionRows: Parameters<typeof useDynamicTaxConditionRowOps>[0]['conditionRows'] = [];

const createMockRow = (
  id: number,
  conditionEvaluationScope: 'FLOOR_WISE' | 'ALL_FLOORS_AGGREGATED'
): ConditionRuleRow => ({
  id,
  taxId: 1,
  ruleDefinitionId: null,
  sortOrder: id,
  conditions: [
    {
      id: `cond-${id}`,
      fieldId: 'area',
      operator: 'EQUAL',
      value: '100',
      logicalOperator: 'AND',
    },
  ],
  assessmentYearRangeId: 1,
  resultMode: 'FIXED',
  resultBase: 'NONE',
  resultValue: 10,
  referenceTaxId: null,
  unitFieldId: null,
  isActive: true,
  stopFurtherProcessing: false,
  assessmentBasis: 'PROPERTY_BASED',
  conditionEvaluationScope,
});

describe('useDynamicTaxConditionRowOps', () => {
  const routerMock = { push: vi.fn(), replace: vi.fn(), refresh: vi.fn() } as unknown as Parameters<typeof useDynamicTaxConditionRowOps>[0]['router'];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('manages row operations correctly', () => {
    const { result } = renderHook(() =>
      useDynamicTaxConditionRowOps({
        numericId: 1,
        taxRow: null,
        conditionRows: emptyConditionRows,
        fields: [],
        generalRuleDefinitionId: '',
        router: routerMock,
      })
    );

    expect(result.current.rows).toEqual([]);

    act(() => {
      result.current.handleAddRow();
    });

    expect(result.current.rows).toHaveLength(1);
    expect(result.current.dirty).toBe(true);
  });

  it('allows two rows that differ only by conditionEvaluationScope', async () => {
    const differingScopeRows: ConditionRuleRow[] = [
      createMockRow(1, 'FLOOR_WISE'),
      createMockRow(2, 'ALL_FLOORS_AGGREGATED'),
    ];

    const { result } = renderHook(() =>
      useDynamicTaxConditionRowOps({
        numericId: 1,
        taxRow: null,
        conditionRows: differingScopeRows,
        fields: [],
        generalRuleDefinitionId: '',
        router: routerMock,
      })
    );

    let saved = false;
    await act(async () => {
      saved = await result.current.handleSave();
    });

    expect(saved).toBe(true);
    expect(toast.error).not.toHaveBeenCalledWith('messages.condition.duplicateRows');
  });

  it('rejects duplicate rows with identical conditions, result, and conditionEvaluationScope', async () => {
    const duplicateRows: ConditionRuleRow[] = [
      createMockRow(1, 'FLOOR_WISE'),
      createMockRow(2, 'FLOOR_WISE'),
    ];

    const { result } = renderHook(() =>
      useDynamicTaxConditionRowOps({
        numericId: 1,
        taxRow: null,
        conditionRows: duplicateRows,
        fields: [],
        generalRuleDefinitionId: '',
        router: routerMock,
      })
    );

    let saved = true;
    await act(async () => {
      saved = await result.current.handleSave();
    });

    expect(saved).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('messages.condition.duplicateRows');
  });
});
