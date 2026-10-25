import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BuildingPermissionSection } from '@/components/modules/property-tax/ptis/QuickDataEntry/building/BuildingPermissionSection';
import type {
  WingOption,
  UnitSelectionItem,
  CertificateTypeMasterOption,
} from '@/types/building-permission.types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({ locale: 'en', propertyId: '100' }),
  usePathname: () => '/en/property-tax/ptis/QuickDataEntry/100/Building',
  useSearchParams: () => new URLSearchParams(''),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) =>
    ({
      'building.selectUnits': 'SELECT UNITS',
      'building.unit': 'UNIT',
      'building.wing': 'WING',
      'building.certificateStatus': 'CERTIFICATE STATUS',
      'building.statusApplied': 'Applied',
      'building.unitAlreadyHasCertTooltip': 'This unit already has an applied certificate. Use the Edit action to modify.',
      'building.uploaded': 'Uploaded',
      'building.save': 'Save Changes',
      'common.saveChanges': 'Save Changes',
      'common.edit': 'Edit Unit Certificate',
      'common.actions': 'ACTION',
      'validation.dateBeforeConstructionYear': 'Date must be greater than or equal to construction year (2020)',
    }[key] || key),
  useLocale: () => 'en',
}));

const mockConfirm = vi.fn(({ onConfirm }) => onConfirm?.());
vi.mock('@/components/common/ConfirmProvider', () => ({
  useConfirm: () => ({
    confirm: mockConfirm,
  }),
}));

const defaultMockUnits: UnitSelectionItem[] = [
  {
    propertyDetailsId: 101,
    propertyId: 201,
    unitNo: 'A8',
    wingName: 'Wing A',
    floorName: '1st Floor',
    useName: 'Residential',
    wingDetailId: 10,
    isSelected: false,
  },
  {
    propertyDetailsId: 102,
    propertyId: 202,
    unitNo: 'A9',
    wingName: 'Wing A',
    floorName: '1st Floor',
    useName: 'Residential',
    wingDetailId: 10,
    isSelected: false,
  },
];

const mockCertificateGrid = {
  societyCertificates: [],
  wingCertificates: [],
  unitCertificates: [
    {
      level: 'Unit',
      entityType: 'P',
      propertyDetailsId: 101,
      propertyId: 201,
      certificateTypeId: 3,
      certificateNumber: 'APARTMENT-LS14-116-A8',
      certificateDate: '2020-04-21',
      propertyCertificateId: 888,
      hasDocument: true,
      documentGuid: 'doc-guid-888',
      fileName: 'cert-a8.pdf',
      status: 'Active',
    },
  ],
};

vi.mock(
  '@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/Building/action',
  () => ({
    getUnitsByPropertyAction: vi.fn(() =>
      Promise.resolve({
        success: true,
        data: defaultMockUnits,
        totalCount: 2,
      })
    ),
    getApartmentQcCertificateGridAction: vi.fn(() =>
      Promise.resolve({
        success: true,
        data: mockCertificateGrid,
      })
    ),
    getUnitCertificatesByPropertyIdsAction: vi.fn(() =>
      Promise.resolve({
        success: true,
        data: [],
      })
    ),
    deletePropertyCertificateRecordAction: vi.fn(() =>
      Promise.resolve({ success: true, message: 'Deleted' })
    ),
  })
);

describe('BuildingPermissionSection - SELECT UNITS safeguards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockWings: WingOption[] = [
    { wingDetailId: 10, wingName: 'Wing A' },
  ];

  const mockUnits: UnitSelectionItem[] = [...defaultMockUnits];

  const mockCertificateTypes: CertificateTypeMasterOption[] = [
    {
      certificateTypeId: 3,
      certificateTypeName: 'Build Completion Certificate',
      certificateTypeCode: 'CC',
      badgeCode: 'CC',
      displayOrder: 1,
    },
  ];

  it('disables checkbox for a unit with an existing direct certificate while keeping non-direct units selectable', async () => {
    render(
      <BuildingPermissionSection
        propertyId="100"
        societyId={1}
        wings={mockWings}
        units={mockUnits}
        certificateTypes={mockCertificateTypes}
        initialCertificateGrid={mockCertificateGrid}
        initialLevel="Unit"
        initialCertificateTypeId={3}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('SELECT UNITS')).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    // First checkbox is header select-all, second is Unit A8 (has cert), third is Unit A9 (no cert)
    expect(checkboxes.length).toBe(3);

    const a8Checkbox = checkboxes[1];
    const a9Checkbox = checkboxes[2];

    // Direct-applied unit A8 checkbox must be disabled
    expect(a8Checkbox).toBeDisabled();
    // Non-direct unit A9 checkbox is enabled
    expect(a9Checkbox).not.toBeDisabled();

    // Clicking A8 disabled checkbox does NOT select it
    fireEvent.click(a8Checkbox);
    expect(a8Checkbox).not.toBeChecked();

    // Clicking A9 checkbox selects it
    fireEvent.click(a9Checkbox);
    expect(a9Checkbox).toBeChecked();
  });

  it('renders document uploaded badge with attachment icon next to the unit name', async () => {
    render(
      <BuildingPermissionSection
        propertyId="100"
        societyId={1}
        wings={mockWings}
        units={mockUnits}
        certificateTypes={mockCertificateTypes}
        initialCertificateGrid={mockCertificateGrid}
        initialLevel="Unit"
        initialCertificateTypeId={3}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('A8')).toBeInTheDocument();
    });

    // The Uploaded badge should be visible for A8 which has an existing certificate
    expect(screen.getByText('Uploaded')).toBeInTheDocument();
    // Certificate status pill should display the existing certificate number
    expect(screen.getByText('#APARTMENT-LS14-116-A8')).toBeInTheDocument();
  });

  it('ignores row click for direct-applied unit while selecting regular unit rows', async () => {
    render(
      <BuildingPermissionSection
        propertyId="100"
        societyId={1}
        wings={mockWings}
        units={mockUnits}
        certificateTypes={mockCertificateTypes}
        initialCertificateGrid={mockCertificateGrid}
        initialLevel="Unit"
        initialCertificateTypeId={3}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('A8')).toBeInTheDocument();
    });

    const a8Row = screen.getByText('A8').closest('tr');
    expect(a8Row).toBeInTheDocument();
    if (a8Row) {
      fireEvent.click(a8Row);
    }

    const checkboxes = screen.getAllByRole('checkbox');
    const a8Checkbox = checkboxes[1];
    // Row click on direct-applied unit must NOT toggle selection
    expect(a8Checkbox).not.toBeChecked();

    // Now click A9 which has no direct certificate
    const a9Row = screen.getByText('A9').closest('tr');
    if (a9Row) {
      fireEvent.click(a9Row);
    }

    const a9Checkbox = checkboxes[2];
    expect(a9Checkbox).toBeChecked();
  });

  it('selects only non-direct units when header checkbox is clicked, skipping direct-applied units', async () => {
    render(
      <BuildingPermissionSection
        propertyId="100"
        societyId={1}
        wings={mockWings}
        units={mockUnits}
        certificateTypes={mockCertificateTypes}
        initialCertificateGrid={mockCertificateGrid}
        initialLevel="Unit"
        initialCertificateTypeId={3}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('A8')).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    const headerCheckbox = checkboxes[0];
    const a8Checkbox = checkboxes[1];
    const a9Checkbox = checkboxes[2];

    fireEvent.click(headerCheckbox);

    // Direct-applied unit A8 must remain unchecked
    expect(a8Checkbox).not.toBeChecked();
    // Non-direct unit A9 must be checked
    expect(a9Checkbox).toBeChecked();
  });

  it('allows clicking the dedicated Edit action button to select a unit with existing certificate', async () => {
    render(
      <BuildingPermissionSection
        propertyId="100"
        societyId={1}
        wings={mockWings}
        units={mockUnits}
        certificateTypes={mockCertificateTypes}
        initialCertificateGrid={mockCertificateGrid}
        initialLevel="Unit"
        initialCertificateTypeId={3}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('A8')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByTitle('Edit Unit Certificate');
    expect(editButtons.length).toBeGreaterThan(0);

    // Clicking Edit on A8 sets selection for editing
    fireEvent.click(editButtons[0]);

    const checkboxes = screen.getAllByRole('checkbox');
    const a8Checkbox = checkboxes[1];
    expect(a8Checkbox).toBeChecked();
  });

  it('preserves existing document reference and flags isFileModified as false when editing certificate text', async () => {
    const handleSaveMock = vi.fn().mockResolvedValue(true);

    render(
      <BuildingPermissionSection
        propertyId="100"
        societyId={1}
        wings={mockWings}
        units={mockUnits}
        certificateTypes={mockCertificateTypes}
        initialCertificateGrid={mockCertificateGrid}
        initialLevel="Unit"
        initialCertificateTypeId={3}
        onSave={handleSaveMock}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('A8')).toBeInTheDocument();
    });

    // 1. Select unit A8 to edit
    const editButtons = screen.getAllByTitle('Edit Unit Certificate');
    fireEvent.click(editButtons[0]);

    // 2. Change the certificate number
    const numberInput = screen.getByDisplayValue('APARTMENT-LS14-116-A8');
    fireEvent.change(numberInput, { target: { value: 'APARTMENT-LS14-116-A8-UPDATED' } });

    // 3. Click Save Changes
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(handleSaveMock).toHaveBeenCalledTimes(1);
    });

    const payload = handleSaveMock.mock.calls[0][0];
    expect(payload.certificateNumber).toBe('APARTMENT-LS14-116-A8-UPDATED');
    expect(payload.attachedFiles).toEqual([]);
    expect(payload.documentGuid).toBe('doc-guid-888');
    expect(payload.existingDocumentGuid).toBe('doc-guid-888');
    expect(payload.propertyCertificateId).toBe(888);
    expect(payload.fileName).toBe('cert-a8.pdf');
    expect(payload.isFileModified).toBe(false);
    expect(payload.preserveExistingDocument).toBe(true);
    expect(payload.hasExistingDocument).toBe(true);
  });

  it('passes newly attached file and sets isFileModified to true when a file is replaced', async () => {
    const handleSaveMock = vi.fn().mockResolvedValue(true);

    render(
      <BuildingPermissionSection
        propertyId="100"
        societyId={1}
        wings={mockWings}
        units={mockUnits}
        certificateTypes={mockCertificateTypes}
        initialCertificateGrid={mockCertificateGrid}
        initialLevel="Unit"
        initialCertificateTypeId={3}
        onSave={handleSaveMock}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('A8')).toBeInTheDocument();
    });

    // 1. Select unit A8 to edit
    const editButtons = screen.getAllByTitle('Edit Unit Certificate');
    fireEvent.click(editButtons[0]);

    // 2. Upload a replacement file
    const newFile = new File(['dummy-content'], 'new-cert.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();
    fireEvent.change(fileInput, { target: { files: [newFile] } });

    // 3. Click Save Changes
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(handleSaveMock).toHaveBeenCalledTimes(1);
    });

    const payload = handleSaveMock.mock.calls[0][0];
    expect(payload.attachedFiles.length).toBe(1);
    expect(payload.attachedFiles[0].name).toBe('new-cert.pdf');
    expect(payload.isFileModified).toBe(true);
  });

  it('shows validation error when certificate date is before construction year', async () => {
    const handleSaveMock = vi.fn();
    const unitsWithConstYear: UnitSelectionItem[] = [
      {
        propertyDetailsId: 101,
        propertyId: 201,
        unitNo: 'A8',
        wingName: 'Wing A',
        floorName: '1st Floor',
        useName: 'Residential',
        wingDetailId: 10,
        isSelected: false,
        constructionYear: '2020',
      },
    ];

    render(
      <BuildingPermissionSection
        propertyId="100"
        societyId={1}
        wings={mockWings}
        units={unitsWithConstYear}
        certificateTypes={mockCertificateTypes}
        initialCertificateGrid={mockCertificateGrid}
        initialLevel="Unit"
        initialCertificateTypeId={3}
        propertyConstructionYear="2020"
        onSave={handleSaveMock}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('A8')).toBeInTheDocument();
    });

    // 1. Select unit A8 to edit
    const editButtons = screen.getAllByTitle('Edit Unit Certificate');
    fireEvent.click(editButtons[0]);

    // 2. Change certificate date to year 2018 (before construction year 2020)
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    expect(dateInput).not.toBeNull();
    fireEvent.change(dateInput, { target: { value: '2018-05-15' } });

    // 3. Click Save Changes
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    // 4. Save should be blocked and validation message should appear
    await waitFor(() => {
      expect(handleSaveMock).not.toHaveBeenCalled();
      expect(screen.getAllByText(/Date must be greater than or equal to construction year/i).length).toBeGreaterThan(0);
    });
  });

  it('passes direct applied unit in payload when explicitly edited via edit button', async () => {
    const handleSaveMock = vi.fn().mockResolvedValue(true);

    render(
      <BuildingPermissionSection
        propertyId="100"
        societyId={1}
        wings={mockWings}
        units={mockUnits}
        certificateTypes={mockCertificateTypes}
        initialCertificateGrid={mockCertificateGrid}
        initialLevel="Unit"
        initialCertificateTypeId={3}
        onSave={handleSaveMock}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('A8')).toBeInTheDocument();
    });

    // Explicitly click Edit button on direct unit A8 (propertyDetailsId 101, propertyId 201)
    const editButtons = screen.getAllByTitle('Edit Unit Certificate');
    fireEvent.click(editButtons[0]);

    // Update certificate number to make form dirty
    const numberInput = screen.getByDisplayValue('APARTMENT-LS14-116-A8');
    fireEvent.change(numberInput, { target: { value: 'APARTMENT-LS14-116-A8-MOD' } });

    // Save changes
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(handleSaveMock).toHaveBeenCalledTimes(1);
    });

    const payload = handleSaveMock.mock.calls[0][0];
    expect(payload.selectedUnitIds).toEqual([201]);
    expect(payload.selectedUnitDetailsIds).toEqual([101]);
  });

  it('excludes direct applied unit from payload when non-direct units are saved', async () => {
    const handleSaveMock = vi.fn().mockResolvedValue(true);

    render(
      <BuildingPermissionSection
        propertyId="100"
        societyId={1}
        wings={mockWings}
        units={mockUnits}
        certificateTypes={mockCertificateTypes}
        initialCertificateGrid={mockCertificateGrid}
        initialLevel="Unit"
        initialCertificateTypeId={3}
        onSave={handleSaveMock}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('A9')).toBeInTheDocument();
    });

    // Select non-direct unit A9 via checkbox (propertyDetailsId 102, propertyId 202)
    const checkboxes = screen.getAllByRole('checkbox');
    const a9Checkbox = checkboxes[2];
    fireEvent.click(a9Checkbox);
    expect(a9Checkbox).toBeChecked();

    // Fill certificate details
    const numberInput = screen.getByPlaceholderText('building.certificateNumberPlaceholder');
    fireEvent.change(numberInput, { target: { value: 'CC-FOR-A9' } });

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    expect(dateInput).not.toBeNull();
    fireEvent.change(dateInput, { target: { value: '2024-06-01' } });

    // Attach document
    const dummyFile = new File(['dummy-content'], 'a9-cert.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();
    fireEvent.change(fileInput, { target: { files: [dummyFile] } });

    // Save changes
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(handleSaveMock).toHaveBeenCalledTimes(1);
    });

    const payload = handleSaveMock.mock.calls[0][0];
    // Must contain A9 (202), and must NOT contain A8 (201)
    expect(payload.selectedUnitIds).toEqual([202]);
    expect(payload.selectedUnitDetailsIds).toEqual([102]);
    expect(payload.selectedUnitIds).not.toContain(201);
  });
});
