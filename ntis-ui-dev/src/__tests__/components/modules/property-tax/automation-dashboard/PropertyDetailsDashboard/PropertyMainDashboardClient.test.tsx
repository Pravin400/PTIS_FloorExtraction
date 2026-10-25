import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import PropertyMainDashboardClient from '@/components/modules/property-tax/automation-dashboard/PropertyDetailsDashboard/PropertyMainDashboardClient';
import type {
  PropertySubGridDetailsItems,
  PropertySubGridProperty,
  WardItem,
  PropertyTypeMasterItem,
} from '@/types/automation-dashboard/property-dashboard/property-subgrid-details.type';

const pushMock = vi.fn();
let searchParamsState = new URLSearchParams('stage=geoSequencing&workflowStageId=2&pageNumber=2&pageSize=10&wardId=3&source=division&imageId=101');
let lastAutomationTableProps: Record<string, unknown> | null = null;

vi.mock('next/navigation', () => ({
  useSearchParams: () => searchParamsState,
  useRouter: () => ({ push: pushMock }),
  useParams: () => ({ zoneId: '13' }),
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/components/common/AutomationTable', () => ({
  AutomationTable: (props: Record<string, unknown>) => {
    lastAutomationTableProps = props;
    return (
      <div>
        <button
          data-testid="page-change"
          onClick={() => {
            const onPageChange = props.onPageChange as ((n: number) => void) | undefined;
            onPageChange?.(3);
          }}
        >
          page-change
        </button>
        <button
          data-testid="page-size-change"
          onClick={() => {
            const onPageSizeChange = props.onPageSizeChange as ((n: number) => void) | undefined;
            onPageSizeChange?.(25);
          }}
        >
          page-size-change
        </button>
      </div>
    );
  },
}));

vi.mock('@/components/modules/property-tax/automation-dashboard/PropertyDetailsDashboard/PropertyDashboardHeader', () => ({
  PropertyDashboardHeader: ({ onClearFilters }: { onClearFilters: () => void }) => (
    <button data-testid="clear-filters" onClick={onClearFilters}>
      clear-filters
    </button>
  ),
}));

vi.mock('@/components/modules/property-tax/automation-dashboard/PropertyDetailsDashboard/PropertyDashboardColumns', () => ({
  getPropertyDashboardHeaderRows: () => [[{ label: 'h' }]],
  getPropertyDashboardColumns: () => [{ key: 'propertyId', label: 'id' }],
}));

vi.mock('@/components/common', () => ({
  DocumentViewerModal: ({ isOpen, onClose, fileName, fileUrl }: { isOpen: boolean; onClose: () => void; fileName: string; fileUrl: string }) => (
    <div>
      <div data-testid="viewer-open">{String(isOpen)}</div>
      <div data-testid="viewer-file-name">{fileName}</div>
      <div data-testid="viewer-file-url">{fileUrl}</div>
      <button data-testid="viewer-close" onClick={onClose}>close</button>
    </div>
  ),
}));

vi.mock('@/lib/utils/automation-dashboard/mapUtils', () => ({
  handleLocationClick: vi.fn(),
}));

describe('PropertyMainDashboardClient', () => {
  const property: PropertySubGridProperty = {
    propertyId: 101,
    propertyNo: 'PROP-101',
    category: 'Residential',
    propertyDescription: 'Apartment',
    propertyType: 'Normal',
    ownerName: 'Owner',
    occupierName: 'Occupier',
    mobileNo: '9999999999',
    address: 'Address',
    flatOrShopName: 'Shop-1',
    assessmentStatus: 'Assessed',
    floorCount: 2,
    propertyDetailsCount: 3,
    documentGuid: 'doc-guid-101',
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
      oldRecord: { area: '1', use: 'U', rv: '1', cValue: '1', rTax: '1', totalTax: '1' },
      newRecord: { area: '2', use: 'U', rv: '2', cValue: '2', rTax: '2', totalTax: '2' },
    },
  };

  const serverData: PropertySubGridDetailsItems = {
    workflowStageId: 2,
    workflowStageName: 'Geo',
    zoneId: 13,
    zoneName: 'Zone 13',
    properties: [property],
    totalCount: 45,
  };

  const wardsData: WardItem[] = [
    {
      id: 3,
      wardNo: 'W-3',
      zoneId: 13,
      description: 'Ward 3',
      sequenceNo: 1,
      isActive: true,
      createdDate: '2025-01-01',
      updatedDate: '2025-01-01',
    },
  ];

  const propertyType: PropertyTypeMasterItem[] = [
    {
      id: 1,
      propertyDescription: 'Residential Type',
      type: 'R',
      searchSequence: 1,
      propertyTypeCategoryId: null,
      isActive: true,
      createdDate: '2025-01-01',
      updatedDate: null,
    },
  ];

  beforeEach(() => {
    pushMock.mockReset();
    searchParamsState = new URLSearchParams('stage=geoSequencing&workflowStageId=2&pageNumber=2&pageSize=10&wardId=3&source=division&imageId=101');
    lastAutomationTableProps = null;
  });

  function renderPage() {
    return render(
      <PropertyMainDashboardClient
        serverData={serverData}
        wardsData={wardsData}
        propertyType={propertyType}
      />
    );
  }

  it('passes paginated data and computed pagination values to AutomationTable', () => {
    renderPage();

    expect(lastAutomationTableProps).not.toBeNull();
    expect(lastAutomationTableProps?.data).toEqual([property]);
    expect(lastAutomationTableProps?.pageNumber).toBe(2);
    expect(lastAutomationTableProps?.pageSize).toBe(10);
    expect(lastAutomationTableProps?.totalCount).toBe(45);
    expect(lastAutomationTableProps?.totalPages).toBe(5);
  });

  it('updates URL for page change and page size change', () => {
    renderPage();

    fireEvent.click(screen.getByTestId('page-change'));
    expect(pushMock).toHaveBeenCalledWith(
      '?stage=geoSequencing&workflowStageId=2&pageNumber=3&pageSize=10&wardId=3&source=division&imageId=101'
    );

    fireEvent.click(screen.getByTestId('page-size-change'));
    expect(pushMock).toHaveBeenCalledWith(
      '?stage=geoSequencing&workflowStageId=2&pageNumber=1&pageSize=25&wardId=3&source=division&imageId=101'
    );
  });

  it('clears filters and controls document viewer via URL params', () => {
    renderPage();

    expect(screen.getByTestId('viewer-open')).toHaveTextContent('true');
    expect(screen.getByTestId('viewer-file-name')).toHaveTextContent('Property_Image_PROP-101.jpg');
    expect(screen.getByTestId('viewer-file-url')).toHaveTextContent('doc-guid-101');

    fireEvent.click(screen.getByTestId('clear-filters'));
    expect(pushMock).toHaveBeenCalledWith(
      '?stage=geoSequencing&workflowStageId=2&pageNumber=1&pageSize=10&source=division&imageId=101'
    );

    fireEvent.click(screen.getByTestId('viewer-close'));
    expect(pushMock).toHaveBeenCalledWith(
      '?stage=geoSequencing&workflowStageId=2&pageNumber=2&pageSize=10&wardId=3&source=division'
    );
  });
});
