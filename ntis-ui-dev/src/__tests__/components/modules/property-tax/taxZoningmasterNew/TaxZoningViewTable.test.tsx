/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TaxZoningViewTable from '@/components/modules/property-tax/taxZoningmasterNew/TaxZoningViewTable';
import type { TaxZone, Ward, TaxZoningRange } from '@/types/taxZoningRange.types';

const pushMock = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key} ${JSON.stringify(values)}` : key,
  useLocale: () => 'en',
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
  useRouter: () => ({ push: pushMock, replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const filtersState: any = {
  filterWard: '',
  setFilterWard: vi.fn(),
  filterFrom: '',
  setFilterFrom: vi.fn(),
  filterTo: '',
  setFilterTo: vi.fn(),
  filterZone: '',
  setFilterZone: vi.fn(),
  search: '',
  setSearch: vi.fn(),
  handleApplyFilters: vi.fn(),
  handleClearFilters: vi.fn(),
  changePage: vi.fn(),
  changePageSize: vi.fn(),
};

vi.mock('@/hooks/taxZoningRange/useTaxZoningRange', () => ({
  useTaxZoningRangeFilters: (..._args: any[]) => filtersState,
  comparePropertyNo: (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true }),
}));

const exportState: any = {
  isExportingExcel: false,
  handleExportExcel: vi.fn(),
  isExportingPending: false,
  handleExportPending: vi.fn(),
};

vi.mock('@/hooks/taxZoningRange/useTaxZoningExport', () => ({
  useTaxZoningExport: (..._args: any[]) => exportState,
}));

vi.mock('@/app/[locale]/property-tax/taxzoningmaster/actions', () => ({
  fetchPropertiesByWardAction: vi.fn().mockResolvedValue({ success: true, data: { items: [] } }),
}));

vi.mock('@/components/common/MasterTable', () => ({
  MasterTable: ({ columns, data, onPageChange }: any) => (
    <div data-testid="master-table">
      <table>
        <thead>
          <tr>
            {columns.map((col: any, i: number) => (
              <th key={i}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row: any, i: number) => (
            <tr key={i} data-testid="table-row">
              <td>{row.wardNo}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button data-testid="prev-btn" onClick={() => onPageChange?.(0)}>Prev</button>
      <button data-testid="next-btn" onClick={() => onPageChange?.(2)}>Next</button>
    </div>
  ),
  Column: {},
}));

vi.mock('@/components/common/SearchSelect', () => ({
  SearchSelect: ({ name, value, onChange, placeholder, disabled }: any) => (
    <select
      data-testid={`select-${name}`}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(name, e.target.value)}
    >
      <option value="">{placeholder}</option>
    </select>
  ),
}));

vi.mock('@/components/common/SearchInput', () => ({
  SearchInput: ({ value, onChange, placeholder }: any) => (
    <input
      data-testid="search-input"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

const wardsData: Ward[] = [
  { id: 1, wardNo: 'W1', zoneNo: 'Z1', description: null, descriptionEnglish: null, sequenceNo: 1, isActive: true, createdBy: null, createdDate: '', updatedBy: null, updatedDate: null },
];

const taxZones: TaxZone[] = [
  { id: 1, taxZoneNo: 'TZ1', taxZoneType: 'R', remark: null, createdDate: '', updatedDate: null, isActive: true },
];

const data: TaxZoningRange[] = [
  {
    id: 1, wardId: 1, wardNo: 'W1', taxZoneId: 1, taxZoneNo: 'TZ1',
    fromPropertyNo: '10', toPropertyNo: '20', assignEntireWard: false,
    zoneDescription: 'Desc', isActive: true, createdDate: null, updatedDate: null,
    minPropertyNo: '10', maxPropertyNo: '20', totalProperties: 11,
  },
];

function makeProps(overrides: Partial<React.ComponentProps<typeof TaxZoningViewTable>> = {}) {
  return {
    data,
    taxZones,
    wardsData,
    totalCount: 1,
    pageNumber: 1,
    pageSize: 10,
    filters: {},
    ...overrides,
  };
}

describe('TaxZoningViewTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the heading', () => {
    render(<TaxZoningViewTable {...makeProps()} />);
    expect(screen.getByText('heading')).toBeInTheDocument();
  });

  it('navigates to ward-wise zoning abstract page when button clicked', () => {
    render(<TaxZoningViewTable {...makeProps()} />);
    fireEvent.click(screen.getByText(/^wardAbstractBtn/));
    expect(pushMock).toHaveBeenCalledWith('/en/property-tax/taxzoningmaster/wardwisezoninglist');
  });

  it('navigates to bulk update page when button clicked', () => {
    render(<TaxZoningViewTable {...makeProps()} />);
    fireEvent.click(screen.getByText('bulkUpdateBtn'));
    expect(pushMock).toHaveBeenCalledWith('/en/property-tax/taxzoningmaster/bulkupdateZoning');
  });

  it('navigates to add zoning range page when button clicked', () => {
    render(<TaxZoningViewTable {...makeProps()} />);
    fireEvent.click(screen.getByText('addZoningRangeBtn'));
    expect(pushMock).toHaveBeenCalledWith('/en/property-tax/taxzoningmaster/addtaxzoning/0');
  });

  it('renders MasterTable with the passed data', () => {
    render(<TaxZoningViewTable {...makeProps()} />);
    expect(screen.getByTestId('master-table')).toBeInTheDocument();
    const rows = screen.getAllByTestId('table-row');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent('W1');
  });

  it('shows "all records" feedback text when no filters are active', () => {
    render(<TaxZoningViewTable {...makeProps({ filters: {} })} />);
    expect(screen.getByText('allRecordsDisplayed')).toBeInTheDocument();
    expect(screen.queryByText(/filteredRecordsShowing/)).not.toBeInTheDocument();
  });

  it('shows "filtered records" feedback text when a filter is active', () => {
    render(<TaxZoningViewTable {...makeProps({ filters: { wardId: 1 } })} />);
    expect(screen.queryByText('allRecordsDisplayed')).not.toBeInTheDocument();
    expect(screen.getByText(/filteredRecordsShowing/)).toBeInTheDocument();
  });

  it('shows "filtered records" feedback text when a search filter is active', () => {
    render(<TaxZoningViewTable {...makeProps({ filters: { search: 'abc' } })} />);
    expect(screen.queryByText('allRecordsDisplayed')).not.toBeInTheDocument();
    expect(screen.getByText(/filteredRecordsShowing/)).toBeInTheDocument();
  });
});
