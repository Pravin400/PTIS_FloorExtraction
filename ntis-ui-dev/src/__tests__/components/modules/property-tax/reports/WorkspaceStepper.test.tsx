import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Stepper } from '@/components/modules/property-tax/reports/WorkspaceStepper';
import type { ReportWorkspaceCopy } from '@/types/report.types';


// ---------------------------------------------------------------------------
// Shared workspace copy fixture
// ---------------------------------------------------------------------------
const workspaceCopy: ReportWorkspaceCopy = {
  steps: {
    selectCategory: 'Select Category',
    selectReport: 'Select Report',
    setParameters: 'Set Parameters',
    generateReport: 'Generate Report',
  },
  tabs: { generateReport: 'Generate Report', myReports: 'Download Report' },
  toast: {
    generatedSuccess: '',
    generationFailed: '',
    generatingPreview: '',
    preparingDocument: '',
  },
  reportsCount: '{count} reports',
  emptyState: { title: '', subtitle: '' },
  noReportsFound: '',
  reportsHeader: '{category} Reports',
  configureParameters: 'Configure Parameters',
  generating: { title: '', subtitle: '', cancel: '' },
  preview: { title: '', downloadPdf: '', idLabel: '' },
  confirm: { title: '', description: '', btnGo: '', btnClose: '' },
};

describe('Stepper', () => {
  it('renders all 4 step labels', () => {
    render(<Stepper currentStep={1} copy={workspaceCopy} />);
    expect(screen.getByText('Select Category')).toBeInTheDocument();
    expect(screen.getByText('Select Report')).toBeInTheDocument();
    expect(screen.getByText('Set Parameters')).toBeInTheDocument();
    expect(screen.getByText('Generate Report')).toBeInTheDocument();
  });

  it('highlights the active step (step 2)', () => {
    render(<Stepper currentStep={2} copy={workspaceCopy} />);
    const selectReportLabel = screen.getByText('Select Report');
    // Active step label has the blue colour class
    expect(selectReportLabel.className).toContain('text-[#004c8c]');
  });

  it('marks completed steps with green text', () => {
    render(<Stepper currentStep={3} copy={workspaceCopy} />);
    // Steps 1 & 2 should be done (green)
    const selectCategoryLabel = screen.getByText('Select Category');
    expect(selectCategoryLabel.className).toContain('text-green-600');
    const selectReportLabel = screen.getByText('Select Report');
    expect(selectReportLabel.className).toContain('text-green-600');
  });

  it('marks future steps with gray text', () => {
    render(<Stepper currentStep={1} copy={workspaceCopy} />);
    // Steps 2, 3, 4 should be greyed out
    const selectReportLabel = screen.getByText('Select Report');
    expect(selectReportLabel.className).toContain('text-gray-400');
  });

  it('renders a check icon for completed steps', () => {
    const { container } = render(<Stepper currentStep={3} copy={workspaceCopy} />);
    // Completed steps render an SVG check icon instead of a step number
    const checkIcons = container.querySelectorAll('svg');
    // At least 2 check icons for steps 1 & 2
    expect(checkIcons.length).toBeGreaterThanOrEqual(2);
  });

  it('renders 3 connector lines between the 4 steps', () => {
    const { container } = render(<Stepper currentStep={1} copy={workspaceCopy} />);
    // The connector is a div with h-0.5 class
    const connectors = container.querySelectorAll('.h-0\\.5');
    expect(connectors).toHaveLength(3);
  });
});
