/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TaxZoningMasterPage from '@/components/modules/property-tax/taxZoningmasterNew/TaxZoningMasterPage';
import type { TaxZoningMasterPageProps } from '@/types/taxZoningRange.types';

vi.mock('@/components/modules/property-tax/taxZoningmasterNew/DocumentsShowcase', () => ({
  default: () => <div data-testid="documents-showcase" />,
}));

vi.mock('@/components/modules/property-tax/taxZoningmasterNew/CoverageDashboard', () => ({
  default: ({ coverage }: any) => (
    <div data-testid="coverage-dashboard" data-total={coverage.totalProperties} />
  ),
}));

vi.mock('@/components/modules/property-tax/taxZoningmasterNew/TaxZoningViewTable', () => ({
  default: ({ data, taxZones, wardsData, totalCount, pageNumber, pageSize, filters, ulbName }: any) => (
    <div
      data-testid="tax-zoning-view-table"
      data-count={data.length}
      data-tax-zones={taxZones.length}
      data-wards={wardsData.length}
      data-total-count={totalCount}
      data-page-number={pageNumber}
      data-page-size={pageSize}
      data-filters={JSON.stringify(filters)}
      data-ulb-name={ulbName}
    />
  ),
}));

const baseProps: TaxZoningMasterPageProps = {
  data: [
    {
      id: 1, wardId: 1, wardNo: 'W1', taxZoneId: 1, taxZoneNo: 'TZ1',
      fromPropertyNo: '10', toPropertyNo: '20', assignEntireWard: false,
      zoneDescription: 'Desc', isActive: true, createdDate: null, updatedDate: null,
      minPropertyNo: '10', maxPropertyNo: '20', totalProperties: 11,
    },
  ],
  taxZones: {
    items: [{ id: 1, taxZoneNo: 'TZ1', taxZoneType: 'R', remark: null, createdDate: '', updatedDate: null, isActive: true }],
    pageNumber: 1, pageSize: 10, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false,
  },
  wardsData: {
    items: [{ id: 1, wardNo: 'W1', zoneNo: 'Z1', description: null, descriptionEnglish: null, sequenceNo: 1, isActive: true, createdBy: null, createdDate: '', updatedBy: null, updatedDate: null }],
    pageNumber: 1, pageSize: 10, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false,
  },
  coverage: {
    totalProperties: 1000,
    coveredProperties: 750,
    pendingProperties: 250,
    zoneWiseCounts: [{ taxZoneId: 1, taxZoneNo: 'TZ1', count: 400 }],
  },
  totalCount: 1,
  totalPages: 1,
  pageNumber: 1,
  pageSize: 10,
  ulbName: 'Test ULB',
  filters: { wardId: 1 },
};

describe('TaxZoningMasterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders DocumentsShowcase, CoverageDashboard and TaxZoningViewTable', () => {
    render(<TaxZoningMasterPage {...baseProps} />);
    expect(screen.getByTestId('documents-showcase')).toBeInTheDocument();
    expect(screen.getByTestId('coverage-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('tax-zoning-view-table')).toBeInTheDocument();
  });

  it('passes coverage prop through to CoverageDashboard', () => {
    render(<TaxZoningMasterPage {...baseProps} />);
    expect(screen.getByTestId('coverage-dashboard')).toHaveAttribute('data-total', '1000');
  });

  it('passes correct props through to TaxZoningViewTable', () => {
    render(<TaxZoningMasterPage {...baseProps} />);
    const el = screen.getByTestId('tax-zoning-view-table');
    expect(el).toHaveAttribute('data-count', '1');
    expect(el).toHaveAttribute('data-tax-zones', '1');
    expect(el).toHaveAttribute('data-wards', '1');
    expect(el).toHaveAttribute('data-total-count', '1');
    expect(el).toHaveAttribute('data-page-number', '1');
    expect(el).toHaveAttribute('data-page-size', '10');
    expect(el).toHaveAttribute('data-filters', JSON.stringify(baseProps.filters));
    expect(el).toHaveAttribute('data-ulb-name', 'Test ULB');
  });
});
