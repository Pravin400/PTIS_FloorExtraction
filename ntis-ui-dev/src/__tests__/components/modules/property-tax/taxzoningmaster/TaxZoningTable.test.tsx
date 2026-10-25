/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TaxZoningTable } from '@/components/modules/property-tax/taxzoningmaster/TaxZoningTable';
import type { ZoningRecord } from '@/types/taxzoning.types';

vi.mock('@/components/common/MasterTable', () => ({
  MasterTable: ({ headerExtra, data }: any) => (
    <div data-testid="master-table">
      {headerExtra}
      <span data-testid="row-count">{data?.length ?? 0}</span>
    </div>
  ),
}));
vi.mock('@/components/common', () => ({
  AddButton: ({ label, disabled, onClick }: any) => <button data-testid="bulk-btn" disabled={disabled} onClick={onClick}>{label}</button>,
  CancelButton: ({ label, onClick }: any) => <button data-testid="clear-btn" onClick={onClick}>{label}</button>,
  ExportButton: ({ label, onClick }: any) => <button data-testid="export-btn" onClick={onClick}>{label}</button>,
  ImportButton: ({ label, onClick }: any) => <button data-testid="import-btn" onClick={onClick}>{label}</button>,
  Input: vi.fn(() => null),
}));

const t = (key: string) => key;
const baseProps = {
  t,
  columns: [{ key: 'wardNo' as const, label: 'Ward' }],
  tableRecords: [] as ZoningRecord[],
  currentPage: 1,
  pageSizes: '5',
  totalCount: 0,
  totalPages: 1,
  loading: false,
  changePage: vi.fn(),
  changePageSize: vi.fn(),
  pageSizeOptions: [5, 10, 20],
  hasImportedData: false,
  saving: false,
  handleBulkUpdate: vi.fn(),
  handleClearImported: vi.fn(),
  handleImportFile: vi.fn(),
  handleExportCSV: vi.fn(),
  fileInputRef: { current: null },
};

describe('TaxZoningTable', () => {
  it('should render the zoning records title', () => {
    render(<TaxZoningTable {...baseProps} />);
    expect(screen.getByText('table.zoningRecords')).toBeInTheDocument();
  });

  it('should disable bulk update button when no imported data', () => {
    render(<TaxZoningTable {...baseProps} hasImportedData={false} />);
    expect(screen.getByTestId('bulk-btn')).toBeDisabled();
  });

  it('should enable bulk update button when imported data exists', () => {
    render(<TaxZoningTable {...baseProps} hasImportedData={true} />);
    expect(screen.getByTestId('bulk-btn')).not.toBeDisabled();
  });

  it('should show clear button only when imported data exists', () => {
    const { rerender } = render(<TaxZoningTable {...baseProps} hasImportedData={false} />);
    expect(screen.queryByTestId('clear-btn')).not.toBeInTheDocument();

    rerender(<TaxZoningTable {...baseProps} hasImportedData={true} />);
    expect(screen.getByTestId('clear-btn')).toBeInTheDocument();
  });

  it('should render export and import buttons', () => {
    render(<TaxZoningTable {...baseProps} />);
    expect(screen.getByTestId('export-btn')).toBeInTheDocument();
    expect(screen.getByTestId('import-btn')).toBeInTheDocument();
  });

  it('should disable bulk update when saving', () => {
    render(<TaxZoningTable {...baseProps} hasImportedData={true} saving={true} />);
    expect(screen.getByTestId('bulk-btn')).toBeDisabled();
  });
});
