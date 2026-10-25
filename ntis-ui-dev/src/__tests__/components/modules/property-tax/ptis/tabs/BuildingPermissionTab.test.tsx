import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import BuildingPermissionTab from '@/components/modules/property-tax/ptis/tabs/BuildingPermissionTab';
import type { BuildingPermissionData, BuildingPermissionItem } from '@/types/ptis.types';
import * as documentUtils from '@/lib/utils/document-client-utils';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'building.certificateName': 'Certificate Name',
      'building.certificateNo': 'Certificate No.',
      'building.issueDate': 'Issue Date',
      'building.certificateDate': 'Certificate Date',
      'building.copyCertificateNo': 'Copy Certificate No.',
      'building.copied': 'Copied!',
      'building.action': 'Action',
      'building.propertyScope': 'Property Level',
      'building.viewDocument': 'View Document',
      'building.noDocumentAttached': 'No document attached',
      'building.editCertificate': 'Edit Certificate',
      'building.editBuildingPermission': 'Edit Building Permission',
      'building.filters': 'FILTERS',
      'building.allCertificates': 'All Certificates',
      'building.clearFilter': 'Clear Filter',
      'building.edit': 'Edit',
      'building.view': 'View',
      'building.noCertificatesAttached': 'No attached certificates available for this property.',
      'building.loadingCertificates': 'Loading Building Permission Data...',
      'building.loadError': 'Failed to load building permission records.',
      'common.retry': 'Retry',
      noDataAvailable: 'No data available',
    };
    return translations[key] || key;
  },
  useLocale: () => 'en',
}));

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock DocumentViewerModal and DocumentThumbnail
vi.mock('@/components/common', () => ({
  DocumentViewerModal: ({
    isOpen,
    fileName,
    onClose,
  }: {
    isOpen: boolean;
    fileName: string;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div data-testid="doc-viewer-modal">
        <span>{fileName}</span>
        <button type="button" onClick={onClose}>
          Close Viewer
        </button>
      </div>
    ) : null,
  DocumentThumbnail: ({
    documentGuid,
    onClick,
  }: {
    documentGuid?: string;
    alt?: string;
    onClick?: () => void;
  }) => (
    <div data-testid="doc-thumbnail" data-guid={documentGuid} onClick={onClick}>
      <span>Document Preview</span>
    </div>
  ),
  Select: ({
    options,
    value,
    onChange,
    ariaLabel,
  }: {
    options: Array<{ label: string; value: string }>;
    value?: string;
    onChange?: (e: unknown, value: string) => void;
    ariaLabel?: string;
  }) => (
    <select
      aria-label={ariaLabel || 'Select'}
      data-testid="select-filter"
      value={value}
      onChange={(e) => onChange?.(e, e.target.value)}
    >
      {options?.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
}));

const createMockItem = (overrides?: Partial<BuildingPermissionItem>): BuildingPermissionItem => ({
  certificateTypeId: 101,
  certificateTypeName: 'Commencement Certificate',
  displayOrder: 1,
  hasCertificate: true,
  propertyCertificateId: 1,
  isActive: true,
  certificateNo: 'CC/2026/001',
  issueDate: '2026-01-15T00:00:00Z',
  documentGuid: 'doc-guid-1',
  fileName: 'commencement.pdf',
  ...overrides,
});

describe('BuildingPermissionTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state when isLoading is true', () => {
    render(<BuildingPermissionTab isLoading={true} />);
    expect(screen.getByText('Loading Building Permission Data...')).toBeInTheDocument();
  });

  it('renders error state when error is provided and allows retry', () => {
    const onRetryMock = vi.fn();
    render(
      <BuildingPermissionTab
        error="Unable to fetch permissions"
        onRetry={onRetryMock}
      />
    );
    expect(screen.getByText('Unable to fetch permissions')).toBeInTheDocument();
    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
    fireEvent.click(retryButton);
    expect(onRetryMock).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when data has no items', () => {
    const emptyData: BuildingPermissionData = {
      items: [],
    };
    render(<BuildingPermissionTab data={emptyData} />);
    expect(
      screen.getByText('No attached certificates available for this property.')
    ).toBeInTheDocument();
  });

  it('renders cards with scrollable container when certificates exist', () => {
    const mockData: BuildingPermissionData = {
      items: [
        createMockItem({
          propertyCertificateId: 1,
          certificateTypeId: 101,
          certificateTypeName: 'Commencement Certificate',
          certificateNo: 'CC/2026/001',
        }),
        createMockItem({
          propertyCertificateId: 2,
          certificateTypeId: 102,
          certificateTypeName: 'Occupancy Certificate',
          certificateNo: 'OC/2026/002',
          fileName: 'occupancy.pdf',
        }),
      ],
    };

    const { container } = render(
      <BuildingPermissionTab
        data={mockData}
        propertyId={123}
        wardNo="W01"
        wardId={5}
        propertyNo="P100"
      />
    );

    // Verify container has scrollable classes
    const scrollContainer = container.querySelector('[data-testid="building-permission-cards-container"]');
    expect(scrollContainer).toBeInTheDocument();
    expect(scrollContainer).toHaveClass('overflow-y-auto');
    expect(scrollContainer).toHaveClass('custom-scrollbar');

    // Verify card titles and items
    expect(screen.getAllByText('Commencement Certificate').length).toBeGreaterThan(0);
    expect(screen.getByText('CC/2026/001')).toBeInTheDocument();
    expect(screen.getAllByText('Occupancy Certificate').length).toBeGreaterThan(0);
    expect(screen.getByText('OC/2026/002')).toBeInTheDocument();
  });

  it('handles edit certificate navigation correctly', () => {
    const mockData: BuildingPermissionData = {
      items: [
        createMockItem({
          propertyCertificateId: 1,
          certificateTypeId: 101,
          certificateTypeName: 'Commencement Certificate',
          certificateNo: 'CC/2026/001',
        }),
      ],
    };

    render(
      <BuildingPermissionTab
        data={mockData}
        propertyId={123}
        wardNo="W01"
        wardId={5}
        propertyNo="P100"
      />
    );

    const editButton = screen.getByLabelText('Edit Certificate');
    fireEvent.click(editButton);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('/en/property-tax/ptis/QuickDataEntry/123/Building')
    );
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('certificateTypeId=101')
    );
  });

  it('opens document viewer when clicking view document button', async () => {
    vi.spyOn(documentUtils, 'getDocumentBlobUrl').mockResolvedValue({
      url: 'blob:http://localhost/test-blob',
      contentType: 'application/pdf',
    });

    const mockData: BuildingPermissionData = {
      items: [
        createMockItem({
          propertyCertificateId: 1,
          fileName: 'cert.pdf',
        }),
      ],
    };

    render(
      <BuildingPermissionTab
        data={mockData}
        propertyId={123}
      />
    );

    const viewButton = screen.getByLabelText('View Document');
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByTestId('doc-viewer-modal')).toBeInTheDocument();
      expect(screen.getByText('cert.pdf')).toBeInTheDocument();
    });
  });

  it('renders Wing Level badge and navigates to Wing level on edit for wing covered certificates', () => {
    const mockData: BuildingPermissionData = {
      items: [
        createMockItem({
          propertyCertificateId: 10,
          certificateTypeId: 101,
          certificateTypeName: 'Commencement Certificate',
          certificateNo: 'wing-level-a',
          level: 'Wing',
          wingName: 'Wing A',
          wingDetailId: 501,
        }),
      ],
    };

    render(
      <BuildingPermissionTab
        data={mockData}
        propertyId={123}
        partitionNo="A4"
        societyDetailId={99}
      />
    );

    expect(screen.getByText('Wing Level (Wing A)')).toBeInTheDocument();

    const editButton = screen.getByLabelText('Edit Certificate');
    fireEvent.click(editButton);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('level=Wing')
    );
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('wingDetailId=501')
    );
  });

  it('renders Apartment Level badge and navigates to Apartment level on edit for apartment certificates', () => {
    const mockData: BuildingPermissionData = {
      items: [
        createMockItem({
          propertyCertificateId: 20,
          certificateTypeId: 102,
          certificateTypeName: 'Occupancy Certificate',
          certificateNo: 'APT/2026/001',
          level: 'Apartment',
          societyDetailId: 99,
        }),
      ],
    };

    render(
      <BuildingPermissionTab
        data={mockData}
        propertyId={123}
        partitionNo="A4"
        societyDetailId={99}
      />
    );

    expect(screen.getByText('building.apartmentLevel')).toBeInTheDocument();

    const editButton = screen.getByLabelText('Edit Certificate');
    fireEvent.click(editButton);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('level=Apartment')
    );
  });

  it('filters certificates when selecting an option from certificate type dropdown', () => {
    const mockData: BuildingPermissionData = {
      items: [
        createMockItem({
          propertyCertificateId: 1,
          certificateTypeId: 101,
          certificateTypeName: 'Commencement Certificate',
          certificateNo: 'CC-101',
        }),
        createMockItem({
          propertyCertificateId: 2,
          certificateTypeId: 102,
          certificateTypeName: 'Occupancy Certificate',
          certificateNo: 'OC-102',
        }),
      ],
    };

    render(
      <BuildingPermissionTab
        data={mockData}
        propertyId={123}
      />
    );

    expect(screen.getByText('CC-101')).toBeInTheDocument();
    expect(screen.getByText('OC-102')).toBeInTheDocument();

    const select = screen.getByTestId('select-filter');
    fireEvent.change(select, { target: { value: 'Occupancy Certificate' } });

    expect(screen.getByText('OC-102')).toBeInTheDocument();
    expect(screen.queryByText('CC-101')).not.toBeInTheDocument();

    const clearButton = screen.getByRole('button', { name: /Clear Filter/i });
    fireEvent.click(clearButton);

    expect(screen.getByText('CC-101')).toBeInTheDocument();
    expect(screen.getByText('OC-102')).toBeInTheDocument();
  });

  it('redirects to QDE Building drawer when toolbar edit button is clicked', () => {
    const mockData: BuildingPermissionData = {
      items: [
        createMockItem({
          propertyCertificateId: 1,
          certificateTypeId: 101,
          certificateTypeName: 'Commencement Certificate',
        }),
      ],
    };

    render(
      <BuildingPermissionTab
        data={mockData}
        propertyId={123}
        wardNo="W01"
        wardId={5}
        propertyNo="P100"
      />
    );

    const toolbarEditButton = screen.getByRole('button', { name: /Edit Building Permission/i });
    expect(toolbarEditButton).toBeInTheDocument();
    fireEvent.click(toolbarEditButton);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('/en/property-tax/ptis/QuickDataEntry/123/Building')
    );
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('returnTab=buildingpermission')
    );
  });

  it('truncates certificate numbers longer than 25 characters with ellipsis and preserves copy button', () => {
    const longCertNumber = '123456789012345678901234567890';
    const mockData: BuildingPermissionData = {
      items: [
        createMockItem({
          propertyCertificateId: 1,
          certificateTypeId: 101,
          certificateTypeName: 'Occupancy Certificate',
          certificateNo: longCertNumber,
        }),
      ],
    };

    render(
      <BuildingPermissionTab
        data={mockData}
        propertyId={123}
      />
    );

    const expectedDisplay = `${longCertNumber.slice(0, 25)}...`;
    expect(screen.getByText(expectedDisplay)).toBeInTheDocument();
    expect(screen.getByText('Certificate No.:')).toBeInTheDocument();
    expect(screen.getByText('Issue Date:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copy Certificate No\./i })).toBeInTheDocument();
  });
});

