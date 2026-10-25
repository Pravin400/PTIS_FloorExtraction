import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BuildingPermissionRecords } from '@/components/modules/property-tax/ptis/apartment/building-permission/BuildingPermissionRecords';
import type { BuildingPermissionRecord } from '@/types/property-tax/apartment/building-permission-records.types';

const mockPush = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'buildingPermission.title': 'BUILDING PERMISSION RECORDS',
      'buildingPermission.approvedAndVerified': 'Approved & Verified',
      'buildingPermission.appliedPrefix': 'Applied',
      'buildingPermission.columns.certificate': 'CERTIFICATE',
      'buildingPermission.columns.certificateNumber': 'CERTIFICATE NUMBER',
      'buildingPermission.columns.issueDate': 'ISSUE DATE',
      'buildingPermission.columns.certificateType': 'CERTIFICATE TYPE',
      'buildingPermission.columns.permitNoPlan': 'PERMIT NO / PLAN',
      'buildingPermission.columns.sanctionDate': 'SANCTION DATE',
      'buildingPermission.columns.approvedFloors': 'APPROVED FLOORS',
      'buildingPermission.columns.sanctionedArea': 'SANCTIONED AREA',
      'buildingPermission.columns.status': 'STATUS',
      'buildingPermission.columns.action': 'ACTION',
      'buildingPermission.actions.edit': 'Edit',
      'buildingPermission.actions.viewDocument': 'View Document',
      'buildingPermission.noDocumentAttached': 'No document attached for this permit',
      'buildingPermission.statuses.sanctioned': 'Sanctioned',
      'buildingPermission.statuses.revised': 'Revised',
      'buildingPermission.statuses.commenced': 'Commenced',
      'buildingPermission.statuses.taxApplied': 'Tax Applied',
      'buildingPermission.noDataAvailable': 'No building permission or certificate records available',
      'buildingPermission.addPermission': 'Add Building Permission',
      'buildingPermission.filters': 'Filters',
      'buildingPermission.scope': 'Scope',
      'buildingPermission.allCertificates': 'All Certificates',
      'buildingPermission.allCertificateTypes': 'All Certificates',
      'buildingPermission.selectCertificateType': 'Select Certificate',
      'buildingPermission.clearFilter': 'Clear Filter',
      'buildingPermission.noRecordsForFilter': 'No records found for this certificate',
      'buildingPermission.levels.allLevels': 'All Scopes',
      'buildingPermission.levels.apartment': 'Apartment Level',
      'buildingPermission.levels.wing': 'Wing Level',
      'buildingPermission.levels.unit': 'Unit Level',
      'buildingPermission.levels.floor': 'Floor Level',
    };
    return translations[key] || key;
  },
  useLocale: () => 'en',
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useParams: () => ({ locale: 'en' }),
}));

vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/lib/api/ptis/apartment/apartment-qc-top-section.actions', () => ({
  getApartmentQcCertificateGridAction: vi.fn(() =>
    Promise.resolve({
      success: true,
      data: {
        societyCertificates: [],
        wingCertificates: [],
        unitCertificates: [],
        floorCertificates: [],
      },
    })
  ),
  getPropertyCertificateTypeMasterAction: vi.fn(() =>
    Promise.resolve({
      success: true,
      data: [
        { id: 2, certificateTypeCode: 'OC', certificateTypeName: 'Occupancy Certificate' },
        { id: 1, certificateTypeCode: 'CC', certificateTypeName: 'Commencement Certificate' },
      ],
    })
  ),
}));

describe('BuildingPermissionRecords', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly when no records are provided', () => {
    render(<BuildingPermissionRecords />);

    expect(screen.getByText('No building permission or certificate records available')).toBeInTheDocument();
  });

  it('renders empty state when API returns no records (no static mock data)', async () => {
    render(
      <BuildingPermissionRecords
        societyDetailId={1507857}
        wingDetailsId={1}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText('No building permission or certificate records available')
      ).toBeInTheDocument();
      expect(screen.getByText('Add Building Permission')).toBeInTheDocument();
    });

    // Ensure NO static fake data is shown
    expect(screen.queryByText('PERMIT-2024-00981')).not.toBeInTheDocument();
    expect(screen.queryByText('PERMIT-2021-00432')).not.toBeInTheDocument();
    expect(screen.queryByText('CC-2019-00105')).not.toBeInTheDocument();
  });

  it('renders records from live API grid data when present', async () => {
    const rawGridData = {
      societyCertificates: [
        {
          rowNumber: 1,
          certificateNumber: 'BP-2025-LIVE-001',
          certificateDate: '2025-05-15T00:00:00',
          applicableToSubLabel: 'Ground + 12 Floors',
          sanctionedArea: '45,000.00 sq.ft',
          status: 'Sanctioned',
        },
      ],
      wingCertificates: [],
      unitCertificates: [],
      floorCertificates: [],
    };

    render(
      <BuildingPermissionRecords
        rawGridData={rawGridData}
        societyDetailId={1507857}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('BP-2025-LIVE-001')).toBeInTheDocument();
      expect(screen.getByTestId('building-permission-apartment-cards')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId('building-permission-apartment-cards')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'BP-2025-LIVE-001' })).toBeInTheDocument();
    });
  });

  it('renders custom records passed via props', () => {
    const customRecords: BuildingPermissionRecord[] = [
      {
        id: 'cust-1',
        permitNo: 'TEST-PERMIT-001',
        sanctionDate: '01 Feb 2025',
        approvedFloors: 'Ground + 10 Floors',
        sanctionedArea: '50,000.00 sq.ft',
        status: 'Sanctioned',
      },
    ];

    render(<BuildingPermissionRecords records={customRecords} />);

    expect(screen.getByText('TEST-PERMIT-001')).toBeInTheDocument();
    expect(screen.getByText('01 Feb 2025')).toBeInTheDocument();
  });

  it('navigates to QuickDataEntry Building permission page on edit click', () => {
    const customRecords: BuildingPermissionRecord[] = [
      {
        id: '1',
        permitNo: 'PERMIT-123',
        sanctionDate: '01 Jan 2025',
        approvedFloors: 'Ground + 5',
        sanctionedArea: '10,000 sq.ft',
        status: 'Active',
      },
    ];

    render(
      <BuildingPermissionRecords
        records={customRecords}
        propertyId="1485259"
        wardNo="MMMAJOR4"
        wardId="1"
        propertyNo="9"
        societyDetailId={1509001}
        wingDetailsId={1530421}
        wingName="A"
      />
    );

    const editButtons = screen.getAllByRole('button', { name: /^Edit/i });
    expect(editButtons.length).toBeGreaterThan(0);

    fireEvent.click(editButtons[0]);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('/en/property-tax/ptis/QuickDataEntry/1485259/Building?')
    );
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('societyId=1509001'));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('wingDetailId=1530421'));
  });

  it('renders dynamic certificate type and code without static constants', async () => {
    const rawGridData = {
      societyCertificates: [
        {
          rowNumber: 1,
          propertyCertificateId: 101,
          certificateTypeId: 2,
          certificateNumber: 'apartment-level',
          certificateDate: '2025-06-20T00:00:00',
          sanctionedArea: 12500,
          status: 'Sanctioned',
          taxApplied: true,
        },
      ],
      wingCertificates: [],
      unitCertificates: [],
      floorCertificates: [],
    };

    render(
      <BuildingPermissionRecords
        rawGridData={rawGridData}
        societyDetailId={1507857}
        masterTypes={[
          { id: 2, certificateTypeCode: 'OC', certificateTypeName: 'Occupancy Certificate' },
        ]}
      />
    );

    await waitFor(() => {
      // Applied banner
      expect(screen.getAllByText('Occupancy Certificate').length).toBeGreaterThan(0);
      expect(screen.getAllByText('OC').length).toBeGreaterThan(0);
      expect(screen.getByText('apartment-level')).toBeInTheDocument();

    });
  });

  it('deduplicates inherited wing certificates so duplicate keys and rows are avoided', async () => {
    const rawGridData = {
      societyCertificates: [
        {
          rowNumber: 1,
          propertyCertificateId: 201,
          certificateTypeId: 2,
          certificateNumber: 'apartment-level',
          certificateDate: '2025-06-20T00:00:00',
          level: 'Apartment',
          status: 'Sanctioned',
        },
      ],
      wingCertificates: [
        // Duplicate copy inherited from society level by backend
        {
          rowNumber: 1,
          propertyCertificateId: 201,
          certificateTypeId: 2,
          certificateNumber: 'apartment-level',
          certificateDate: '2025-06-20T00:00:00',
          level: 'Wing',
          status: 'Sanctioned',
        },
      ],
      unitCertificates: [],
      floorCertificates: [],
    };

    render(
      <BuildingPermissionRecords
        rawGridData={rawGridData}
        societyDetailId={1507857}
        masterTypes={[
          { id: 2, certificateTypeCode: 'OC', certificateTypeName: 'Occupancy Certificate' },
        ]}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'apartment-level' })).toBeInTheDocument();
      expect(screen.getByTestId('building-permission-apartment-cards')).toBeInTheDocument();
    });

    // Verify only 1 card is rendered for the duplicate
    const duplicateButtons = screen.getAllByRole('button', { name: 'apartment-level' });
    expect(duplicateButtons).toHaveLength(1);
  });

  it('renders apartment, wing-wise, and unit-wise records with their respective level badges', async () => {
    const rawGridData = {
      societyCertificates: [
        {
          rowNumber: 1,
          propertyCertificateId: 101,
          certificateTypeId: 1,
          certificateNumber: 'APARTMENT-SOCIETY-CC',
          certificateDate: '2024-01-15T00:00:00',
          sanctionedArea: 80000,
          status: 'Sanctioned',
          level: 'Apartment',
        },
      ],
      wingCertificates: [
        {
          rowNumber: 1,
          propertyCertificateId: 102,
          certificateTypeId: 1,
          certificateNumber: 'APARTMENT-LS14-116-D-WING',
          certificateDate: '2024-05-10T00:00:00',
          sanctionedArea: 20000,
          status: 'Sanctioned',
          wingDetailId: 1530995,
          wingName: 'Wing D',
          applicableToLabel: 'Wing D',
          level: 'Wing',
        },
      ],
      unitCertificates: [
        {
          rowNumber: 1,
          propertyCertificateId: 103,
          certificateTypeId: 2,
          certificateNumber: 'UNIT-101-OC',
          certificateDate: '2024-09-01T00:00:00',
          sanctionedArea: 1200,
          status: 'Sanctioned',
          applicableToLabel: '101',
          level: 'Unit',
        },
      ],
      floorCertificates: [],
    };

    render(
      <BuildingPermissionRecords
        rawGridData={rawGridData}
        societyDetailId={1507857}
        wingDetailsId={1530992} // active wing is Asha (1530992), but Wing D (1530995) must still be visible!
        masterTypes={[
          { id: 1, certificateTypeCode: 'CC', certificateTypeName: 'Commencement Certificate' },
          { id: 2, certificateTypeCode: 'OC', certificateTypeName: 'Occupancy Certificate' },
        ]}
      />
    );

    await waitFor(() => {
      // 1. All three records must be present
      expect(screen.getByRole('button', { name: 'APARTMENT-SOCIETY-CC' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'APARTMENT-LS14-116-D-WING' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'UNIT-101-OC' })).toBeInTheDocument();

      // 2. Respective level badges must be rendered
      expect(screen.getAllByText('Apartment Level').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Wing D').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Unit 101').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('filters records by Scope/Level when scope pill is clicked and clears filter', async () => {
    const rawGridData = {
      societyCertificates: [
        {
          rowNumber: 1,
          propertyCertificateId: 101,
          certificateTypeId: 1,
          certificateNumber: 'SOCIETY-PERMIT-01',
          status: 'Sanctioned',
          level: 'Apartment',
        },
      ],
      wingCertificates: [
        {
          rowNumber: 1,
          propertyCertificateId: 102,
          certificateTypeId: 1,
          certificateNumber: 'WING-D-PERMIT-02',
          status: 'Sanctioned',
          wingName: 'Wing D',
          applicableToLabel: 'Wing D',
          level: 'Wing',
        },
      ],
      unitCertificates: [],
      floorCertificates: [],
    };

    render(
      <BuildingPermissionRecords
        rawGridData={rawGridData}
        societyDetailId={1507857}
        masterTypes={[
          { id: 1, certificateTypeCode: 'CC', certificateTypeName: 'Commencement Certificate' },
        ]}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'SOCIETY-PERMIT-01' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'WING-D-PERMIT-02' })).toBeInTheDocument();
    });

    // Scope filter buttons exist
    const wingScopeButton = screen.getByRole('button', { name: /Wing Level/i });
    expect(wingScopeButton).toBeInTheDocument();

    // Click "Wing Level" filter
    fireEvent.click(wingScopeButton);

    await waitFor(() => {
      // Only Wing D permit is visible
      expect(screen.getByRole('button', { name: 'WING-D-PERMIT-02' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'SOCIETY-PERMIT-01' })).not.toBeInTheDocument();
    });

    // Clear filter
    const clearButton = screen.getByRole('button', { name: /Clear/i });
    fireEvent.click(clearButton);

    await waitFor(() => {
      // Both permits visible again
      expect(screen.getByRole('button', { name: 'SOCIETY-PERMIT-01' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'WING-D-PERMIT-02' })).toBeInTheDocument();
    });

    // Re-clicking an active scope button toggles it back to ALL
    const aptScopeButton = screen.getByRole('button', { name: /Apartment Level/i });
    fireEvent.click(aptScopeButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'SOCIETY-PERMIT-01' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'WING-D-PERMIT-02' })).not.toBeInTheDocument();
    });

    // Click again to toggle off
    fireEvent.click(aptScopeButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'SOCIETY-PERMIT-01' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'WING-D-PERMIT-02' })).toBeInTheDocument();
    });
  });

  it('filters records by Certificate Type using the dropdown', async () => {
    const rawGridData = {
      societyCertificates: [
        {
          rowNumber: 1,
          propertyCertificateId: 101,
          certificateTypeId: 1,
          certificateNumber: 'CC-PERMIT-01',
          status: 'Sanctioned',
          level: 'Apartment',
        },
        {
          rowNumber: 2,
          propertyCertificateId: 102,
          certificateTypeId: 2,
          certificateNumber: 'OC-PERMIT-02',
          status: 'Sanctioned',
          level: 'Apartment',
        },
      ],
      wingCertificates: [],
      unitCertificates: [],
      floorCertificates: [],
    };

    render(
      <BuildingPermissionRecords
        rawGridData={rawGridData}
        societyDetailId={1507857}
        masterTypes={[
          { id: 1, certificateTypeCode: 'CC', certificateTypeName: 'Completion Certificate' },
          { id: 2, certificateTypeCode: 'OC', certificateTypeName: 'Occupancy Certificate' },
        ]}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'CC-PERMIT-01' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'OC-PERMIT-02' })).toBeInTheDocument();
    });

    // Find the select combobox
    const combobox = screen.getByRole('combobox');
    expect(combobox).toBeInTheDocument();

    // Open the dropdown
    fireEvent.click(combobox);

    // Select "Completion Certificate (CC) (1)"
    const ccOption = screen.getByRole('option', { name: /Completion Certificate/i });
    fireEvent.click(ccOption);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'CC-PERMIT-01' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'OC-PERMIT-02' })).not.toBeInTheDocument();
    });

    // Reset via Clear Filter
    const clearButton = screen.getByRole('button', { name: /Clear/i });
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'CC-PERMIT-01' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'OC-PERMIT-02' })).toBeInTheDocument();
    });
  });

  it('renders Eye view button and Pencil edit button in Action column', () => {
    const customRecords: BuildingPermissionRecord[] = [
      {
        id: 'rec-with-doc',
        permitNo: 'BP-VIEW-TEST-001',
        sanctionDate: '10 Mar 2025',
        documentGuid: 'doc-guid-12345',
        status: 'Sanctioned',
      },
      {
        id: 'rec-no-doc',
        permitNo: 'BP-NO-DOC-002',
        sanctionDate: '11 Mar 2025',
        status: 'Pending',
      },
    ];

    render(<BuildingPermissionRecords records={customRecords} />);

    // Eye button for record with document is enabled
    const viewButtonWithDoc = screen.getByRole('button', { name: 'View document BP-VIEW-TEST-001' });
    expect(viewButtonWithDoc).toBeInTheDocument();
    expect(viewButtonWithDoc).not.toBeDisabled();

    // Eye button for record without document is disabled
    const viewButtonNoDoc = screen.getByRole('button', { name: 'View document BP-NO-DOC-002' });
    expect(viewButtonNoDoc).toBeInTheDocument();
    expect(viewButtonNoDoc).toBeDisabled();

    // Pencil edit buttons exist for both records
    const editButton1 = screen.getByRole('button', { name: 'Edit BP-VIEW-TEST-001' });
    const editButton2 = screen.getByRole('button', { name: 'Edit BP-NO-DOC-002' });
    expect(editButton1).toBeInTheDocument();
    expect(editButton2).toBeInTheDocument();
  });
});

