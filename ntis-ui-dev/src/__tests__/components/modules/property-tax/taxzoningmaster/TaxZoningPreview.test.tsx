/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TaxZoningPreview } from '@/components/modules/property-tax/taxzoningmaster/TaxZoningPreview';
import type { TaxZoningPageProps } from '@/types/taxzoning.types';

vi.mock('@/components/common', () => ({
  Card: ({ children, ...p }: any) => <div data-testid="card" {...p}>{children}</div>,
  CardHeader: ({ children, ...p }: any) => <div {...p}>{children}</div>,
}));
vi.mock('@/components/common/MasterTable', () => ({
  MasterTable: ({ data }: any) => <div data-testid="master-table">{data?.length ?? 0} rows</div>,
}));

const t = (key: string) => key;
const mockTaxZones = {
  items: [{ id: 1, taxZoneNo: 'TZ1', taxZoneType: 'R', isActive: true, remark: null, createdDate: '', updatedDate: null }],
  pageNumber: 1, pageSize: 10, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false,
} as TaxZoningPageProps['taxZones'];

const mockWardsData = {
  items: [{ id: 1, wardNo: 'W1', zoneNo: '1', description: null, descriptionEnglish: null, sequenceNo: null, isActive: true, createdBy: null, createdDate: '', updatedBy: null, updatedDate: null }],
  pageNumber: 1, pageSize: 10, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false,
} as TaxZoningPageProps['wardsData'];

const baseProps = {
  t,
  previewData: [],
  pagedPreviewData: [],
  previewColumns: [{ key: 'taxZoneNo' as const, label: 'Tax Zone' }, { key: 'wardNo' as const, label: 'Ward' }, { key: 'propertyNo' as const, label: 'Property' }],
  previewPage: 1,
  setPreviewPage: vi.fn(),
  PREVIEW_PAGE_SIZE: 5,
  zone: '',
  ward: [] as string[],
  fromProps: '',
  toProps: '',
  taxZones: mockTaxZones,
  wardsData: mockWardsData,
};

describe('TaxZoningPreview', () => {
  it('should render preview title', () => {
    render(<TaxZoningPreview {...baseProps} />);
    expect(screen.getByText('preview.title')).toBeInTheDocument();
  });

  it('should show 0 Property No badge when no data', () => {
    render(<TaxZoningPreview {...baseProps} />);
    expect(screen.getByText(/0.*columns.propertyNo/)).toBeInTheDocument();
  });

  it('should show empty state when no preview data', () => {
    render(<TaxZoningPreview {...baseProps} />);
    expect(screen.getByText('preview.noPropertiesToPreview')).toBeInTheDocument();
  });

  it('should show table when preview data exists', () => {
    const data = [{ taxZoneNo: 'TZ1', wardNo: 'W1', propertyNo: '10' }];
    render(<TaxZoningPreview {...baseProps} previewData={data} pagedPreviewData={data} />);
    expect(screen.getByTestId('master-table')).toBeInTheDocument();
  });

  it('should display resolved zone name when zone is selected', () => {
    render(<TaxZoningPreview {...baseProps} zone="1" />);
    expect(screen.getByText('TZ1')).toBeInTheDocument();
  });

  it('should display resolved ward name when ward is selected', () => {
    render(<TaxZoningPreview {...baseProps} ward={['1']} />);
    expect(screen.getByText('W1')).toBeInTheDocument();
  });

  it('should show property range when from/to set', () => {
    render(<TaxZoningPreview {...baseProps} fromProps="10" toProps="20" />);
    expect(screen.getByText('10 → 20')).toBeInTheDocument();
  });

  it('should show count badge with correct number', () => {
    const data = [
      { taxZoneNo: 'TZ1', wardNo: 'W1', propertyNo: '10' },
      { taxZoneNo: 'TZ1', wardNo: 'W1', propertyNo: '11' },
    ];
    render(<TaxZoningPreview {...baseProps} previewData={data} pagedPreviewData={data} />);
    expect(screen.getByText(/2.*columns.propertyNo/)).toBeInTheDocument();
  });
});
