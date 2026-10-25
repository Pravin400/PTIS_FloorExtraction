import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReportPreviewOverlay } from '@/components/modules/property-tax/reports/ReportPreviewOverlay';
import type { ReportDefinition, ReportWorkspaceCopy } from '@/types/report.types';

// Mock common UI components that may not render in jsdom
vi.mock('@/components/common', () => ({
  Button: ({ children, onClick, ...rest }: Record<string, unknown>) => (
    <button onClick={onClick as () => void} {...rest}>{children as React.ReactNode}</button>
  ),
  IconButton: ({ onClick, 'aria-label': ariaLabel }: Record<string, unknown>) => (
    <button onClick={onClick as () => void} aria-label={ariaLabel as string}>×</button>
  ),
  Badge: ({ children, ...rest }: Record<string, unknown>) => (
    <div {...rest}>{children as React.ReactNode}</div>
  ),
}));

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------
const workspaceCopy: ReportWorkspaceCopy = {
  steps: { selectCategory: '', selectReport: '', setParameters: '', generateReport: '' },
  tabs: { generateReport: '', myReports: '' },
  toast: {
    generatedSuccess: '',
    generationFailed: '',
    generatingPreview: '',
    preparingDocument: 'Preparing document preview...',
  },
  reportsCount: '',
  emptyState: { title: '', subtitle: '' },
  noReportsFound: '',
  reportsHeader: '',
  configureParameters: '',
  generating: { title: '', subtitle: '', cancel: '' },
  preview: { title: 'Report Preview', downloadPdf: 'PDF', idLabel: 'ID: {id}' },
  confirm: { title: '', description: '', btnGo: '', btnClose: '' },
};

const sampleReport: ReportDefinition = {
  id: 1,
  reportCode: 'NoDue',
  reportName: 'No Due Certificate',
  category: 'assessment',
  description: '',
  templateFile: '',
  dataProviderCode: '',
  isActive: true,
  sortOrder: 1,
};

// ===========================================================================
// Tests
// ===========================================================================
describe('ReportPreviewOverlay', () => {
  const defaultProps = {
    requestId: 'req-123',
    report: sampleReport,
    pdfLoading: false,
    copy: workspaceCopy,
    onPdfLoad: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders the report name in the header', () => {
    render(<ReportPreviewOverlay {...defaultProps} />);
    expect(screen.getByText('No Due Certificate')).toBeInTheDocument();
  });

  it('renders the fallback title when report is null', () => {
    render(<ReportPreviewOverlay {...defaultProps} report={null} />);
    expect(screen.getByText('Report Preview')).toBeInTheDocument();
  });

  it('renders the download PDF button', () => {
    render(<ReportPreviewOverlay {...defaultProps} />);
    expect(screen.getByText('PDF')).toBeInTheDocument();
  });

  it('renders a close button with correct aria-label', () => {
    render(<ReportPreviewOverlay {...defaultProps} />);
    const closeBtn = screen.getByLabelText('Close preview');
    expect(closeBtn).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    const handleClose = vi.fn();
    render(<ReportPreviewOverlay {...defaultProps} onClose={handleClose} />);
    fireEvent.click(screen.getByLabelText('Close preview'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('shows loading spinner when pdfLoading is true', () => {
    render(<ReportPreviewOverlay {...defaultProps} pdfLoading={true} />);
    expect(screen.getByText('Preparing document preview...')).toBeInTheDocument();
  });

  it('does not show loading text when pdfLoading is false', () => {
    render(<ReportPreviewOverlay {...defaultProps} pdfLoading={false} />);
    expect(screen.queryByText('Preparing document preview...')).not.toBeInTheDocument();
  });

  it('renders a full-screen overlay', () => {
    const { container } = render(<ReportPreviewOverlay {...defaultProps} />);
    const overlay = container.firstElementChild!;
    expect(overlay.className).toContain('fixed');
    expect(overlay.className).toContain('inset-0');
  });

  it('renders an object element for the PDF', () => {
    const { container } = render(<ReportPreviewOverlay {...defaultProps} />);
    const obj = container.querySelector('object');
    expect(obj).not.toBeNull();
    expect(obj!.getAttribute('type')).toBe('application/pdf');
  });

  it('constructs the PDF URL from the requestId', () => {
    const { container } = render(<ReportPreviewOverlay {...defaultProps} />);
    const obj = container.querySelector('object')!;
    expect(obj.getAttribute('data')).toContain('/api/designer-report-download/req-123');
  });

  it('uses the HTML designer download proxy', () => {
    const { container } = render(<ReportPreviewOverlay {...defaultProps} />);
    const obj = container.querySelector('object')!;
    expect(obj.getAttribute('data')).toContain('/api/designer-report-download/req-123');
  });
});
