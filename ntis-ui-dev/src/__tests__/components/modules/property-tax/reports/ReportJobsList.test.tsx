import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportJobsList } from '@/components/modules/property-tax/reports/ReportJobsList';
import type { ReportJob, ReportJobsCopy, ReportDefinition } from '@/types/report.types';

// Mock MasterTable and other common components
vi.mock('@/components/common', () => ({
  MasterTable: ({ data, columns, loading, renderActions }: Record<string, unknown>) => {
    const items = data as ReportJob[];
    const cols = columns as { key: string; label: string; render?: (v: unknown, row: ReportJob) => React.ReactNode }[];
    if (loading) return <div data-testid="loading">Loading...</div>;
    return (
      <table data-testid="master-table">
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr key={row.reportRequestId}>
              {cols.map((c) => (
                <td key={c.key}>{c.render ? c.render(row[c.key as keyof ReportJob], row) : String(row[c.key as keyof ReportJob])}</td>
              ))}
              <td>{(renderActions as (row: ReportJob) => React.ReactNode)(row)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  },
  Badge: ({ children, variant, dot }: { children: React.ReactNode; variant?: string; dot?: boolean }) => (
    <span data-variant={variant} data-dot={dot}>{children}</span>
  ),
  PreviewButton: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------
const jobsCopy: ReportJobsCopy = {
  title: 'My Reports',
  refresh: 'Refresh',
  empty: 'No reports yet.',
  download: 'Download',
  preview: 'Preview',
  previewTitle: 'Preview Report',
  columns: {
    report: 'Report Name',
    status: 'Status',
    requested: 'Requested',
    completed: 'Completed',
    actions: 'Actions',
  },
  statuses: {
    Pending: 'Pending',
    Processing: 'Processing',
    Completed: 'Completed',
    Failed: 'Failed',
    Cancelled: 'Cancelled',
    Retrying: 'Retrying',
  },
};

const reportDefinitions: ReportDefinition[] = [
  {
    id: 1,
    reportCode: 'NoDue',
    reportName: 'No Due Certificate',
    category: 'assessment',
    description: '',
    templateFile: '',
    dataProviderCode: '',
    isActive: true,
    sortOrder: 1,
  },
];

function makeJob(overrides: Partial<ReportJob> = {}): ReportJob {
  return {
    reportRequestId: 'req-001',
    reportCode: 'NoDue',
    status: 'Completed',
    createdDate: '2026-07-20T10:00:00Z',
    completedDate: '2026-07-20T10:05:00Z',
    errorMessage: null,
    downloadAvailable: true,
    ...overrides,
  };
}

// ===========================================================================
// Tests
// ===========================================================================
describe('ReportJobsList', () => {
  it('renders the table with column headers', () => {
    render(
      <ReportJobsList
        jobs={[makeJob()]}
        loading={false}
        copy={jobsCopy}
        reportDefinitions={reportDefinitions}
      />
    );
    expect(screen.getByText('Report Name')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Requested')).toBeInTheDocument();
    // "Completed" appears both as a column header and as the job status badge
    expect(screen.getAllByText('Completed').length).toBeGreaterThanOrEqual(1);
  });

  it('maps reportCode to reportName using definitions', () => {
    render(
      <ReportJobsList
        jobs={[makeJob()]}
        loading={false}
        copy={jobsCopy}
        reportDefinitions={reportDefinitions}
      />
    );
    expect(screen.getByText('No Due Certificate')).toBeInTheDocument();
  });

  it('falls back to reportCode when definition is not found', () => {
    const unknownJob = makeJob({ reportCode: 'UnknownCode' });
    render(
      <ReportJobsList
        jobs={[unknownJob]}
        loading={false}
        copy={jobsCopy}
        reportDefinitions={reportDefinitions}
      />
    );
    expect(screen.getByText('UnknownCode')).toBeInTheDocument();
  });

  it('displays localised status label', () => {
    render(
      <ReportJobsList
        jobs={[makeJob({ status: 'Pending' })]}
        loading={false}
        copy={jobsCopy}
        reportDefinitions={reportDefinitions}
      />
    );
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('shows empty state when there are no jobs', () => {
    render(
      <ReportJobsList
        jobs={[]}
        loading={false}
        copy={jobsCopy}
        reportDefinitions={reportDefinitions}
      />
    );
    expect(screen.getByText('No reports yet.')).toBeInTheDocument();
  });

  it('renders Download link for a completed job', () => {
    render(
      <ReportJobsList
        jobs={[makeJob()]}
        loading={false}
        copy={jobsCopy}
        reportDefinitions={reportDefinitions}
      />
    );
    expect(screen.getByText('Download')).toBeInTheDocument();
  });

  it('renders Preview button for a completed job', () => {
    render(
      <ReportJobsList
        jobs={[makeJob()]}
        loading={false}
        copy={jobsCopy}
        reportDefinitions={reportDefinitions}
      />
    );
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('renders a dash when download is not available', () => {
    const noDownloadJob = makeJob({ downloadAvailable: false });
    render(
      <ReportJobsList
        jobs={[noDownloadJob]}
        loading={false}
        copy={jobsCopy}
        reportDefinitions={reportDefinitions}
      />
    );
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('calls onPreview when Preview button is clicked', () => {
    const handlePreview = vi.fn();
    render(
      <ReportJobsList
        jobs={[makeJob()]}
        loading={false}
        copy={jobsCopy}
        reportDefinitions={reportDefinitions}
        onPreview={handlePreview}
      />
    );
    const previewBtn = screen.getByText('Preview');
    previewBtn.click();
    expect(handlePreview).toHaveBeenCalledWith('req-001');
  });

  it('uses HTML preview and download routes', () => {
    const handlePreview = vi.fn();
    render(
      <ReportJobsList
        jobs={[makeJob()]}
        loading={false}
        copy={jobsCopy}
        reportDefinitions={reportDefinitions}
        onPreview={handlePreview}
      />
    );

    screen.getByText('Preview').click();
    expect(handlePreview).toHaveBeenCalledWith('req-001');
    expect(screen.getByText('Download').closest('a')).toHaveAttribute(
      'href',
      '/api/designer-report-download/req-001',
    );
  });

  it('formats dates for created and completed columns', () => {
    const job = makeJob({
      createdDate: '2026-07-20T10:00:00Z',
      completedDate: null,
    });
    render(
      <ReportJobsList
        jobs={[job]}
        loading={false}
        copy={jobsCopy}
        reportDefinitions={reportDefinitions}
      />
    );
    // completedDate = null should render as '-'
    // There can be multiple '-' (one for no-download, one for completedDate)
    const dashes = screen.getAllByText('-');
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });
});
