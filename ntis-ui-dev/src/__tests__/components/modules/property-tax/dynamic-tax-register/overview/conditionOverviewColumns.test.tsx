import { getConditionOverviewColumns } from '@/components/modules/property-tax/dynamic-tax-register/overview/conditionOverviewColumns';
import type { ConditionOverviewRow } from '@/types/dynamic-tax-register.types';
import type { FieldConfig } from '@/types/rule-engine';

describe('getConditionOverviewColumns', () => {
  const mockT = vi.fn((key: string) => key);
  const fields: FieldConfig[] = [];

  it('returns columns length 8', () => {
    const columns = getConditionOverviewColumns({ t: mockT, fields });
    expect(columns).toHaveLength(8);
    expect(columns.map((c) => c.key)).toEqual([
      'sortOrder',
      'taxName',
      'conditions',
      'resultValue',
      'yearRangeLabel',
      'assessmentBasis',
      'conditionEvaluationScope',
      'isActive',
    ]);
  });

  it('renders status badge correctly', () => {
    const columns = getConditionOverviewColumns({ t: mockT, fields });
    const statusCol = columns.find((c) => c.key === 'isActive');
    const dummyRow = { isActive: true } as ConditionOverviewRow;
    const res = statusCol?.render?.(true, dummyRow, 0);
    expect(res).toBeDefined();
  });

  it('configures conditionEvaluationScope column correctly', () => {
    const columns = getConditionOverviewColumns({ t: mockT, fields });
    const scopeCol = columns.find((c) => c.key === 'conditionEvaluationScope');
    expect(scopeCol).toBeDefined();
    expect(scopeCol?.label).toBe('condition.conditionEvaluationScope');
    expect(scopeCol?.width).toBe('130px');
    expect(scopeCol?.align).toBe('center');
  });

  it('renders conditionEvaluationScope correctly for ALL_FLOORS_AGGREGATED', () => {
    const columns = getConditionOverviewColumns({ t: mockT, fields });
    const scopeCol = columns.find((c) => c.key === 'conditionEvaluationScope');
    const row = {
      conditionEvaluationScope: 'ALL_FLOORS_AGGREGATED',
    } as ConditionOverviewRow;
    const rendered = scopeCol?.render?.(row.conditionEvaluationScope, row, 0);
    expect(rendered).toBeDefined();
    expect(rendered).toMatchObject({
      props: {
        children: 'condition.allFloorsAggregatedOption',
      },
    });
  });

  it('renders conditionEvaluationScope correctly for FLOOR_WISE and default fallback', () => {
    const columns = getConditionOverviewColumns({ t: mockT, fields });
    const scopeCol = columns.find((c) => c.key === 'conditionEvaluationScope');

    const floorWiseRow = {
      conditionEvaluationScope: 'FLOOR_WISE',
    } as ConditionOverviewRow;
    const renderedFloorWise = scopeCol?.render?.(floorWiseRow.conditionEvaluationScope, floorWiseRow, 0);
    expect(renderedFloorWise).toMatchObject({
      props: {
        children: 'condition.floorWiseOption',
      },
    });

    const defaultRow = {} as ConditionOverviewRow;
    const renderedDefault = scopeCol?.render?.(defaultRow.conditionEvaluationScope, defaultRow, 0);
    expect(renderedDefault).toMatchObject({
      props: {
        children: 'condition.floorWiseOption',
      },
    });
  });
});
