import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReportGeneratingOverlay } from '@/components/modules/property-tax/reports/ReportGeneratingOverlay';
import type { ReportWorkspaceCopy } from '@/types/report.types';

// ---------------------------------------------------------------------------
// Shared copy fixture
// ---------------------------------------------------------------------------
const workspaceCopy: ReportWorkspaceCopy = {
  steps: {
    selectCategory: '',
    selectReport: '',
    setParameters: '',
    generateReport: '',
  },
  tabs: { generateReport: '', myReports: '' },
  toast: {
    generatedSuccess: '',
    generationFailed: '',
    generatingPreview: 'Generating secure preview...',
    preparingDocument: '',
  },
  reportsCount: '',
  emptyState: { title: '', subtitle: '' },
  noReportsFound: '',
  reportsHeader: '',
  configureParameters: '',
  generating: {
    title: 'Preparing Report',
    subtitle: 'Please wait...',
    cancel: 'Cancel',
  },
  preview: { title: '', downloadPdf: '', idLabel: '' },
  confirm: { title: '', description: '', btnGo: '', btnClose: '' },
};

// ===========================================================================
// Tests
// ===========================================================================
describe('ReportGeneratingOverlay', () => {
  it('renders the generating title', () => {
    render(<ReportGeneratingOverlay copy={workspaceCopy} onCancel={vi.fn()} />);
    expect(screen.getByText('Preparing Report')).toBeInTheDocument();
  });

  it('renders the generating subtitle', () => {
    render(<ReportGeneratingOverlay copy={workspaceCopy} onCancel={vi.fn()} />);
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  it('renders the generating preview toast text', () => {
    render(<ReportGeneratingOverlay copy={workspaceCopy} onCancel={vi.fn()} />);
    expect(screen.getByText('Generating secure preview...')).toBeInTheDocument();
  });

  it('renders cancel button with correct label', () => {
    render(<ReportGeneratingOverlay copy={workspaceCopy} onCancel={vi.fn()} />);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    const handleCancel = vi.fn();
    render(<ReportGeneratingOverlay copy={workspaceCopy} onCancel={handleCancel} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it('renders with a full-screen overlay backdrop', () => {
    const { container } = render(
      <ReportGeneratingOverlay copy={workspaceCopy} onCancel={vi.fn()} />
    );
    const overlay = container.firstElementChild!;
    expect(overlay.className).toContain('fixed');
    expect(overlay.className).toContain('inset-0');
  });
});
