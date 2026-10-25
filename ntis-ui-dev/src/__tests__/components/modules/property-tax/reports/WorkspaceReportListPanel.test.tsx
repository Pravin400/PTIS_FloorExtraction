import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReportListPanel } from '@/components/modules/property-tax/reports/WorkspaceReportListPanel';
import type { Category, ReportDefinition, ReportWorkspaceCopy } from '@/types/report.types';
import { Home } from 'lucide-react';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------
const activeCategoryDef: Category = {
  key: 'assessment',
  name: 'Assessment',
  icon: Home,
  color: 'text-[#800000]',
  bgColor: 'bg-transparent',
  borderColor: 'border-[#800000]',
  glowClass: 'shadow-[#800000]/20',
  iconBg: 'bg-transparent',
};

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
  noReportsFound: 'No reports found for this category.',
  reportsHeader: '{category} Reports',
  configureParameters: 'Configure Parameters',
  generating: { title: '', subtitle: '', cancel: '' },
  preview: { title: '', downloadPdf: '', idLabel: '' },
  confirm: { title: '', description: '', btnGo: '', btnClose: '' },
};

function makeReport(id: number, name: string): ReportDefinition {
  return {
    id,
    reportCode: `RPT-${id}`,
    reportName: name,
    category: 'assessment',
    description: '',
    templateFile: '',
    dataProviderCode: '',
    isActive: true,
    sortOrder: id,
  };
}

// ===========================================================================
// Tests
// ===========================================================================
describe('ReportListPanel', () => {
  it('renders the category name in the header', () => {
    render(
      <ReportListPanel
        activeCategoryDef={activeCategoryDef}
        activeReports={[]}
        workspaceCopy={workspaceCopy}
        onSelectReport={vi.fn()}
      />
    );
    expect(screen.getByText('Assessment')).toBeInTheDocument();
  });

  it('shows report count badge', () => {
    const reports = [makeReport(1, 'Report A'), makeReport(2, 'Report B')];
    render(
      <ReportListPanel
        activeCategoryDef={activeCategoryDef}
        activeReports={reports}
        workspaceCopy={workspaceCopy}
        onSelectReport={vi.fn()}
      />
    );
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows empty state message when there are no reports', () => {
    render(
      <ReportListPanel
        activeCategoryDef={activeCategoryDef}
        activeReports={[]}
        workspaceCopy={workspaceCopy}
        onSelectReport={vi.fn()}
      />
    );
    expect(screen.getByText('No reports found for this category.')).toBeInTheDocument();
  });

  it('renders a button for each report', () => {
    const reports = [makeReport(1, 'No Due Certificate'), makeReport(2, 'Transfer Certificate')];
    render(
      <ReportListPanel
        activeCategoryDef={activeCategoryDef}
        activeReports={reports}
        workspaceCopy={workspaceCopy}
        onSelectReport={vi.fn()}
      />
    );
    expect(screen.getByText('No Due Certificate')).toBeInTheDocument();
    expect(screen.getByText('Transfer Certificate')).toBeInTheDocument();
  });

  it('calls onSelectReport with the correct report when a card is clicked', () => {
    const handleSelect = vi.fn();
    const reports = [makeReport(1, 'Report A'), makeReport(2, 'Report B')];
    render(
      <ReportListPanel
        activeCategoryDef={activeCategoryDef}
        activeReports={reports}
        workspaceCopy={workspaceCopy}
        onSelectReport={handleSelect}
      />
    );
    fireEvent.click(screen.getByText('Report B'));
    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith(reports[1]);
  });

  it('uses category key as fallback when name is missing', () => {
    const catWithoutName: Category = { ...activeCategoryDef, name: undefined };
    render(
      <ReportListPanel
        activeCategoryDef={catWithoutName}
        activeReports={[]}
        workspaceCopy={workspaceCopy}
        onSelectReport={vi.fn()}
      />
    );
    expect(screen.getByText('assessment')).toBeInTheDocument();
  });
});
