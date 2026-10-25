/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WardAbstractDrawer from '@/components/modules/property-tax/taxZoningmasterNew/WardAbstractDrawer';
import { WardZoningAbstractRow } from '@/types/taxZoningRange.types';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

vi.mock('@/components/common/Card', () => ({
  Card: ({ children, ...p }: any) => <div data-testid="card" {...p}>{children}</div>,
}));

vi.mock('@/components/common/MasterTable', () => ({
  MasterTable: ({ columns, data, onPageChange }: any) => (
    <div data-testid="master-table">
      <div data-testid="columns">
        {columns.map((c: any) => (
          <span key={c.key} data-testid="col-label">{c.label}</span>
        ))}
      </div>
      <div data-testid="rows">
        {data.map((row: any, i: number) => (
          <div key={i} data-testid="row">{JSON.stringify(row)}</div>
        ))}
      </div>
      <button data-testid="prev-btn" onClick={() => onPageChange(1)}>Prev</button>
      <button data-testid="next-btn" onClick={() => onPageChange(2)}>Next</button>
    </div>
  ),
}));

let filteredDataOverride: WardZoningAbstractRow[] | null = null;
vi.mock('@/hooks/taxZoningRange/useWardAbstract', () => ({
  useWardAbstract: (data: WardZoningAbstractRow[]) => ({ filteredData: filteredDataOverride ?? data }),
}));

const baseData: WardZoningAbstractRow[] = [
  {
    wardId: 1,
    wardNo: 'W1',
    totalProperties: 100,
    coveredProperties: 60,
    pendingProperties: 40,
    coveragePercent: 60,
    zoneCounts: [{ taxZoneId: 1, taxZoneNo: 'A', count: 30 }],
  },
];

const baseProps = {
  data: baseData,
  pageNumber: 1,
  pageSize: 10,
  totalCount: 1,
  totalPages: 1,
  zoneLabels: ['A', 'B'],
  ulbName: 'Test ULB',
  onPageChange: vi.fn(),
  onPageSizeChange: vi.fn(),
  overallTotalProperties: 500,
  overallCoveredProperties: 300,
  overallPendingProperties: 200,
  overallCoveragePercent: 60,
};

describe('WardAbstractDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    filteredDataOverride = null;
  });

  it('renders KPI cards with overall props', () => {
    render(<WardAbstractDrawer {...baseProps} />);
    expect(screen.getByText('totalProperties')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('covered')).toBeInTheDocument();
    expect(screen.getByText('300')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('appends a TOTAL row using totalRowLabel', () => {
    render(<WardAbstractDrawer {...baseProps} />);
    const rows = screen.getAllByTestId('row');
    const lastRow = rows[rows.length - 1];
    expect(lastRow.textContent).toContain('totalRowLabel');
    expect(lastRow.textContent).toContain('500');
  });

  it('renders one zone column per zoneLabels entry with prefixed label', () => {
    render(<WardAbstractDrawer {...baseProps} />);
    const labels = screen.getAllByTestId('col-label').map((el) => el.textContent);
    expect(labels).toContain('columns.zonePrefix A');
    expect(labels).toContain('columns.zonePrefix B');
  });

  it('renders the optional searchInput slot when passed', () => {
    render(<WardAbstractDrawer {...baseProps} searchInput={<div data-testid="search-slot">search</div>} />);
    expect(screen.getByTestId('search-slot')).toBeInTheDocument();
  });

  it('does not render search slot when not passed', () => {
    render(<WardAbstractDrawer {...baseProps} />);
    expect(screen.queryByTestId('search-slot')).not.toBeInTheDocument();
  });

  it('calls onPageChange when pagination buttons are clicked', () => {
    render(<WardAbstractDrawer {...baseProps} />);
    fireEvent.click(screen.getByTestId('next-btn'));
    expect(baseProps.onPageChange).toHaveBeenCalledWith(2);
  });
});
