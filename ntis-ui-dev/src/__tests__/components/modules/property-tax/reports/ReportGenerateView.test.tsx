import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReportGenerateView } from '@/components/modules/property-tax/reports/ReportGenerateView';
import type { Category, ReportDefinition, ReportWorkspaceCopy, ReportParamsPanelCopy } from '@/types/report.types';
import { Home, BarChart2 } from 'lucide-react';

// Mock next/image
vi.mock('next/image', () => ({
  __esModule: true,
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: Record<string, unknown>) => <img alt="" {...props} />,
}));

// Mock ReportParametersPanel to avoid next-intl context dependency (Label → useTranslations)
vi.mock('@/components/modules/property-tax/reports/ReportParametersPanel', () => ({
  ReportParametersPanel: () => <div data-testid="report-parameters-panel">Parameters Panel</div>,
}));

// ---------------------------------------------------------------------------
// Shared fixtures
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
    generatedSuccess: 'Success!',
    generationFailed: 'Failed!',
    generatingPreview: 'Generating...',
    preparingDocument: 'Preparing...',
  },
  reportsCount: '{count} reports',
  emptyState: {
    title: 'Select a category above',
    subtitle: 'Choose a report type',
  },
  noReportsFound: 'No reports found.',
  reportsHeader: '{category} Reports',
  configureParameters: 'Configure Parameters',
  generating: { title: 'Preparing', subtitle: 'Wait...', cancel: 'Cancel' },
  preview: { title: 'Preview', downloadPdf: 'PDF', idLabel: '' },
  confirm: { title: '', description: '', btnGo: '', btnClose: '' },
};

const paramsCopy: ReportParamsPanelCopy = {
  emptyState: 'Select a report to configure',
  financialYear: 'Financial Year',
  zoneNo: 'Zone No.',
  wardNo: 'Ward No.',
  propertySelection: 'Property Selection',
  propertyNo: 'Property No',
  fromPropertyToProperty: 'From Property To Property',
  fromProperty: 'From Property',
  toProperty: 'To Property',
  selectYear: 'Select year',
  selectZone: 'Select zone',
  selectWard: 'Select ward',
  selectProperty: 'Select property',
  selectStartProperty: 'Start',
  selectEndProperty: 'End',
  loading: 'Loading...',
  selectZoneFirst: 'Select zone first',
  selectWardFirst: 'Select ward first',
  validation: {
    financialYearRequired: 'Required',
    zoneRequired: 'Required',
    wardRequired: 'Required',
    fillAllRequired: 'Fill all',
    networkError: 'Network error',
    failedToQueue: 'Failed',
  },

  reportQueued: 'Report "{name}" submitted.',
  buttons: { reset: 'Reset', generate: 'Generate Report', queuing: 'Queuing...' },
};

const categories: Category[] = [
  {
    key: 'assessment',
    name: 'Assessment',
    icon: Home,
    color: 'text-[#800000]',
    bgColor: 'bg-transparent',
    borderColor: 'border-[#800000]',
    glowClass: 'shadow-[#800000]/20',
    iconBg: 'bg-transparent',
  },
  {
    key: 'amc',
    name: 'AMC',
    icon: BarChart2,
    color: 'text-[#800000]',
    bgColor: 'bg-transparent',
    borderColor: 'border-[#800000]',
    glowClass: 'shadow-[#800000]/20',
    iconBg: 'bg-transparent',
  },
];

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

const reports = [makeReport(1, 'No Due Certificate'), makeReport(2, 'Transfer Certificate')];

const reportsByCategory = new Map<string, ReportDefinition[]>([
  ['assessment', reports],
  ['amc', []],
]);

const defaultProps = {
  currentStep: 1 as const,
  selectedCategory: null,
  selectedReport: null,
  reportsByCategory,
  categories,
  workspaceCopy,
  paramsCopy,
  zones: [],
  financialYears: [],
  fetchWards: vi.fn().mockResolvedValue([]),
  fetchProperties: vi.fn().mockResolvedValue([]),
  onCategoryClick: vi.fn(),
  onSelectReport: vi.fn(),
  onQueued: vi.fn(),
};

// ===========================================================================
// Tests
// ===========================================================================
describe('ReportGenerateView', () => {
  // -------------------------------------------------------------------------
  // Step 1 — initial state
  // -------------------------------------------------------------------------
  describe('Step 1 – initial state', () => {
    it('renders the stepper with all labels', () => {
      render(<ReportGenerateView {...defaultProps} />);
      expect(screen.getByText('Select Category')).toBeInTheDocument();
      expect(screen.getByText('Select Report')).toBeInTheDocument();
      expect(screen.getByText('Set Parameters')).toBeInTheDocument();
      expect(screen.getByText('Generate Report')).toBeInTheDocument();
    });

    it('renders all category cards', () => {
      render(<ReportGenerateView {...defaultProps} />);
      expect(screen.getByText('Assessment')).toBeInTheDocument();
      expect(screen.getByText('AMC')).toBeInTheDocument();
    });

    it('shows report counts for each category', () => {
      render(<ReportGenerateView {...defaultProps} />);
      expect(screen.getByText('2 reports')).toBeInTheDocument(); // assessment
      expect(screen.getByText('0 reports')).toBeInTheDocument(); // amc
    });

    it('shows empty state on step 1', () => {
      render(<ReportGenerateView {...defaultProps} />);
      expect(screen.getByText('Select a category above')).toBeInTheDocument();
      expect(screen.getByText('Choose a report type')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Step 2 — category selected, reports listed
  // -------------------------------------------------------------------------
  describe('Step 2 – category selected', () => {
    it('shows report list when a category is selected', () => {
      render(
        <ReportGenerateView
          {...defaultProps}
          currentStep={2}
          selectedCategory="assessment"
        />
      );
      expect(screen.getByText('No Due Certificate')).toBeInTheDocument();
      expect(screen.getByText('Transfer Certificate')).toBeInTheDocument();
    });

    it('does not show empty state on step 2', () => {
      render(
        <ReportGenerateView
          {...defaultProps}
          currentStep={2}
          selectedCategory="assessment"
        />
      );
      expect(screen.queryByText('Select a category above')).not.toBeInTheDocument();
    });

    it('shows "No reports found" for an empty category', () => {
      render(
        <ReportGenerateView
          {...defaultProps}
          currentStep={2}
          selectedCategory="amc"
        />
      );
      expect(screen.getByText('No reports found.')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Category click delegation
  // -------------------------------------------------------------------------
  describe('category click', () => {
    it('delegates clicks to onCategoryClick', () => {
      const handleCategoryClick = vi.fn();
      render(
        <ReportGenerateView
          {...defaultProps}
          onCategoryClick={handleCategoryClick}
        />
      );
      fireEvent.click(screen.getByText('Assessment'));
      expect(handleCategoryClick).toHaveBeenCalledWith('assessment');
    });
  });

  // -------------------------------------------------------------------------
  // Step 3 — report selected, parameters panel shown
  // -------------------------------------------------------------------------
  describe('Step 3 – report selected', () => {
    it('renders the configure parameters header', () => {
      render(
        <ReportGenerateView
          {...defaultProps}
          currentStep={3}
          selectedCategory="assessment"
          selectedReport={reports[0]}
        />
      );
      expect(screen.getByText('Configure Parameters')).toBeInTheDocument();
    });
  });
});
