import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import {
  getPropertyDashboardColumns,
  getPropertyDashboardHeaderRows,
} from '@/components/modules/property-tax/automation-dashboard/PropertyDetailsDashboard/PropertyDashboardColumns';
import type { PropertySubGridProperty } from '@/types/automation-dashboard/property-dashboard/property-subgrid-details.type';

vi.mock('@/lib/utils/document-utils', () => ({
  getViewDocumentUrl: vi.fn((guid: string) => `https://example.test/docs/${guid}`),
}));

const t = (key: string) => key;

const baseRow: PropertySubGridProperty = {
  propertyId: 101,
  propertyNo: 'PROP-101',
  category: 'Residential',
  propertyDescription: 'Apartment',
  propertyType: 'Normal',
  ownerName: 'Owner Name',
  occupierName: 'Occupier Name',
  mobileNo: '9999999999',
  address: 'Main Road',
  flatOrShopName: 'Shop-1',
  assessmentStatus: 'Assessed',
  floorCount: 3,
  propertyDetailsCount: 2,
  documentGuid: 'guid-123',
  planDocumentGuid: null,
  additionalRevenue: 0,
  qcChecklist: {
    siteQc: true,
    applyTaxes: true,
    officeQc: true,
    dataUpdated: true,
    addTaxes: false,
  },
  propertyDetailsComparison: {
    oldRecord: {
      area: '100',
      use: 'Residential',
      rv: '1000',
      cValue: '200',
      rTax: '50',
      totalTax: '250',
    },
    newRecord: {
      area: '120',
      use: 'Residential',
      rv: '1200',
      cValue: '250',
      rTax: '60',
      totalTax: '310',
    },
  },
};

describe('PropertyDashboardColumns', () => {
  it('returns expected header row structure', () => {
    const rows = getPropertyDashboardHeaderRows(t);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveLength(11);
    expect(rows[1]).toHaveLength(2);
  });

  it('returns expected number of columns and key order boundaries', () => {
    const columns = getPropertyDashboardColumns(t);

    expect(columns).toHaveLength(11);
    expect(columns[0]?.key).toBe('propertyId');
    expect(columns[10]?.key).toBe('documentGuid');
  });

  it('renders image preview when documentGuid exists and triggers click handler', () => {
    const onImageClick = vi.fn();
    const columns = getPropertyDashboardColumns(t, onImageClick);
    const documentColumn = columns.find((c) => c.key === 'documentGuid');

    const node = documentColumn?.render?.(
      baseRow.documentGuid,
      baseRow as PropertySubGridProperty & Record<string, unknown>,
      0
    );

    render(<>{node}</>);

    const image = screen.getByRole('img', { name: 'columns.documents' });
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.test/docs/guid-123');

    fireEvent.click(image);
    expect(onImageClick).toHaveBeenCalledWith(baseRow);
  });

  it('renders placeholder when documentGuid is missing', () => {
    const columns = getPropertyDashboardColumns(t);
    const documentColumn = columns.find((c) => c.key === 'documentGuid');

    const noImageRow = { ...baseRow, documentGuid: null };
    const node = documentColumn?.render?.(
      noImageRow.documentGuid,
      noImageRow as PropertySubGridProperty & Record<string, unknown>,
      0
    );

    const { container } = render(<>{node}</>);
    expect(screen.queryByRole('img', { name: 'columns.documents' })).toBeNull();
    expect(container.querySelectorAll('div').length).toBeGreaterThan(1);
  });
});
