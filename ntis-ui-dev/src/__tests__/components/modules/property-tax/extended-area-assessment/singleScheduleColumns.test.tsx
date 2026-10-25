import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { getSingleScheduleColumns, type ScheduleTableRow } from '@/components/modules/property-tax/extended-area-assessment/singleScheduleColumns';

const t = (key: string) => key;

function findColumn(columns: ReturnType<typeof getSingleScheduleColumns>, key: string) {
  const col = columns.find((c) => c.key === key);
  if (!col) throw new Error(`Column "${key}" not found`);
  return col;
}

const row: ScheduleTableRow = {
  srNo: 1,
  financialYear: '2026-27',
  stage: 'Section 129 - 60 Percent',
  municipalPctLabel: '60%',
  stageTax: 1177.8,
  oldGpTax: 1240,
  applicableTax: 1240,
  totalDemand: 1240,
  difference: 723,
  ruleApplied: 'Which is More: Old GP Tax',
  status: 'Current',
};

describe('getSingleScheduleColumns', () => {
  it('returns 11 columns covering every schedule field', () => {
    const columns = getSingleScheduleColumns(t);
    expect(columns).toHaveLength(11);
    expect(columns.map((c) => c.key)).toEqual([
      'srNo',
      'financialYear',
      'stage',
      'municipalPctLabel',
      'stageTax',
      'oldGpTax',
      'applicableTax',
      'totalDemand',
      'difference',
      'ruleApplied',
      'status',
    ]);
  });

  it('uses the translated label for GEN mode', () => {
    const columns = getSingleScheduleColumns(t, 'General Tax');
    expect(findColumn(columns, 'municipalPctLabel').label).toBe('scheduleTable.columns.municipalPct');
    expect(findColumn(columns, 'oldGpTax').label).toBe('scheduleTable.columns.oldGpTax');
    expect(findColumn(columns, 'applicableTax').label).toBe('scheduleTable.columns.applicableTax');
  });

  it('swaps in Tax-Total-specific label keys when baseTaxCode is "Tax Total"', () => {
    const columns = getSingleScheduleColumns(t, 'Tax Total');
    expect(findColumn(columns, 'municipalPctLabel').label).toBe('scheduleTable.columns.municipalTotalTaxPct');
    expect(findColumn(columns, 'oldGpTax').label).toBe('scheduleTable.columns.oldGpTotalTax');
    expect(findColumn(columns, 'applicableTax').label).toBe('scheduleTable.columns.applicableTotalTax');
  });

  it('formats currency columns via the shared money() formatter', () => {
    const columns = getSingleScheduleColumns(t);
    const stageTaxCol = findColumn(columns, 'stageTax');
    expect(stageTaxCol.render?.(row.stageTax, row, 0)).toBe('₹1,177.80');

    const totalDemandCol = findColumn(columns, 'totalDemand');
    expect(totalDemandCol.render?.(row.totalDemand, row, 0)).toBe('₹1,240.00');
  });

  it('treats a null/undefined currency value as ₹0.00', () => {
    const columns = getSingleScheduleColumns(t);
    const differenceCol = findColumn(columns, 'difference');
    expect(differenceCol.render?.(undefined, row, 0)).toBe('₹0.00');
  });

  it('renders the status column as a translated Badge matching the row status', () => {
    const columns = getSingleScheduleColumns(t);
    const statusCol = findColumn(columns, 'status');
    render(<>{statusCol.render?.(row.status, row, 0)}</>);
    expect(screen.getByText('scheduleTable.status.current')).toBeInTheDocument();
  });
});
