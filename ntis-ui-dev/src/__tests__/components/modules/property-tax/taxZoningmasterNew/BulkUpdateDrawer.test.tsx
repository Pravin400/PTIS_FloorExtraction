/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BulkUpdateDrawer from '@/components/modules/property-tax/taxZoningmasterNew/BulkUpdateDrawer';
import { BulkTaxZoningRangeRow } from '@/types/taxZoningRange.types';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/components/common/Card', () => ({
  Card: ({ children, ...p }: any) => <div data-testid="card" {...p}>{children}</div>,
}));

vi.mock('@/components/common/ActionButtons', () => ({
  DownloadButton: ({ label, onClick, ...p }: any) => <button data-testid="download-btn" onClick={onClick} {...p}>{label}</button>,
  ImportButton: ({ label, onClick, disabled, ...p }: any) => <button data-testid="import-btn" onClick={onClick} disabled={disabled} {...p}>{label}</button>,
  ApplyButton: ({ label, onClick, disabled, ...p }: any) => <button data-testid="apply-btn" onClick={onClick} disabled={disabled} {...p}>{label}</button>,
  CancelButton: ({ onClick, ...p }: any) => <button data-testid="cancel-btn" onClick={onClick} {...p}>Cancel</button>,
  IconOnlyActionButton: ({ onClick, icon: _icon, "aria-label": ariaLabel, ...p }: any) => <button data-testid="close-btn" aria-label={ariaLabel} onClick={onClick} {...p} />,
}));

const baseProps = {
  onClose: vi.fn(),
  onDownloadTemplate: vi.fn(),
  onImportFile: vi.fn(),
  fileName: null as string | null,
  rows: [] as BulkTaxZoningRangeRow[],
  hasValidRows: false,
  hasInvalidRows: false,
  importing: false,
  saving: false,
  onApply: vi.fn(),
};

describe('BulkUpdateDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (!Element.prototype.scrollTo) {
      Element.prototype.scrollTo = vi.fn() as any;
    }
  });

  it('highlights step 3 when rows.length > 0', () => {
    const rows: BulkTaxZoningRangeRow[] = [
      { wardNo: 'W1', wardId: 1, fromPropertyNo: '1', toPropertyNo: '2', taxZoneNo: 'Z1', taxZoneId: 1, zoneDescription: 'desc', status: 'New' },
    ];
    render(<BulkUpdateDrawer {...baseProps} rows={rows} hasValidRows={true} />);
    expect(screen.getByText('stepIndicator3Title').closest('div.flex-1')).toHaveClass('bg-[#f1f8ff]');
  });

  it('clicking DownloadButton calls onDownloadTemplate', () => {
    render(<BulkUpdateDrawer {...baseProps} />);
    fireEvent.click(screen.getByTestId('download-btn'));
    expect(baseProps.onDownloadTemplate).toHaveBeenCalled();
  });

  it('selecting a file via hidden input calls onImportFile', () => {
    const { container } = render(<BulkUpdateDrawer {...baseProps} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'test.xlsx');
    fireEvent.change(input, { target: { files: [file] } });
    expect(baseProps.onImportFile).toHaveBeenCalled();
  });

  it('renders rows table with correct columns when rows present', () => {
    const rows: BulkTaxZoningRangeRow[] = [
      { wardNo: 'W1', wardId: 1, fromPropertyNo: '10', toPropertyNo: '20', taxZoneNo: 'Z1', taxZoneId: 1, zoneDescription: 'desc', status: 'New' },
      { wardNo: 'W2', wardId: 2, fromPropertyNo: '5', toPropertyNo: '6', taxZoneNo: 'Z2', zoneDescription: 'desc', status: 'Invalid', errors: ['bad row'] },
      { wardNo: 'W3', wardId: 3, fromPropertyNo: '1', toPropertyNo: '3', taxZoneNo: 'Z3', taxZoneId: 3, zoneDescription: 'desc', status: 'Updated' },
    ];
    render(<BulkUpdateDrawer {...baseProps} rows={rows} hasValidRows={true} hasInvalidRows={true} />);
    expect(screen.getByText('colWard')).toBeInTheDocument();
    expect(screen.getByText('colFrom')).toBeInTheDocument();
    expect(screen.getByText('colTo')).toBeInTheDocument();
    expect(screen.getByText('colZone')).toBeInTheDocument();
    expect(screen.getByText('colStatus')).toBeInTheDocument();
    expect(screen.getByText('colErrors')).toBeInTheDocument();
    expect(screen.getByText('W1')).toBeInTheDocument();
    expect(screen.getByText('statusNew')).toBeInTheDocument();
    expect(screen.getByText('statusInvalid')).toBeInTheDocument();
    expect(screen.getByText('statusUpdated')).toBeInTheDocument();
    expect(screen.getByText('bad row')).toBeInTheDocument();
  });

  it('shows resolve invalid rows message only when hasInvalidRows is true', () => {
    const { rerender } = render(<BulkUpdateDrawer {...baseProps} hasInvalidRows={false} />);
    expect(screen.queryByText('resolveInvalid')).not.toBeInTheDocument();
    rerender(<BulkUpdateDrawer {...baseProps} hasInvalidRows={true} />);
    expect(screen.getByText('resolveInvalid')).toBeInTheDocument();
  });

  it('ApplyButton disabled when hasValidRows is false', () => {
    render(<BulkUpdateDrawer {...baseProps} hasValidRows={false} />);
    expect(screen.getByTestId('apply-btn')).toBeDisabled();
  });

  it('ApplyButton disabled when saving is true', () => {
    render(<BulkUpdateDrawer {...baseProps} hasValidRows={true} saving={true} />);
    expect(screen.getByTestId('apply-btn')).toBeDisabled();
  });

  it('ApplyButton disabled when importing is true', () => {
    render(<BulkUpdateDrawer {...baseProps} hasValidRows={true} importing={true} />);
    expect(screen.getByTestId('apply-btn')).toBeDisabled();
  });

  it('ApplyButton calls onApply when clicked and enabled', () => {
    render(<BulkUpdateDrawer {...baseProps} hasValidRows={true} />);
    const btn = screen.getByTestId('apply-btn');
    expect(btn).not.toBeDisabled();
    fireEvent.click(btn);
    expect(baseProps.onApply).toHaveBeenCalled();
  });
});
