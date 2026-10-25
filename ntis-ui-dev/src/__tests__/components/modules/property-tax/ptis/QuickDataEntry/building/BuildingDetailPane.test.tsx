import { vi } from 'vitest';

// HOISTED MOCKS
vi.mock('server-only', () => ({}));
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));
vi.mock('@/services/api.service', () => ({ apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }));
vi.mock('@/lib/utils/document-client-utils', () => ({
  downloadDocumentClient: vi.fn(),
  getDocumentBlobUrl: vi.fn(() => Promise.resolve({ url: 'blob:mock-url' })),
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { BuildingDetailPane } from '@/components/modules/property-tax/ptis/QuickDataEntry/building/BuildingDetailPane';
import { CertificateData } from '@/types/building-permission.types';
import { FloorData } from '@/types/room-details.types';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), refresh: vi.fn() })),
  useParams: vi.fn(() => ({ locale: 'en' })),
  usePathname: vi.fn(() => '/en/property-tax/ptis/QuickDataEntry/123/Building'),
  useSearchParams: vi.fn(() => new URLSearchParams('')),
}));

const mockTranslations: Record<string, string> = {
  'common.saveChanges': 'Save Changes',
  'building.deleteCertificate': 'Delete Certificate & Data',
  'building.viewDocument': 'View Document',
  'building.downloadDocument': 'Download Document',
  'building.deleteDocument': 'Delete Document',
  'actions.saving': 'Saving...',
  'building.saveError': 'Failed to save changes',
  'building.deleteError': 'Failed to delete certificate',
  'building.floorsOverview': 'Floors Overview',
};

const mockT = (key: string) => mockTranslations[key] || key;

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => mockTranslations[key] || key,
  useLocale: () => 'en',
}));

// Mock useConfirm
vi.mock('@/components/common/ConfirmProvider', () => ({
  useConfirm: () => ({ confirm: vi.fn(({ onConfirm }) => onConfirm()) }),
}));

const mockCertData: CertificateData = {
  certificateTypeId: 1,
  certificateTypeName: 'Completion Certificate',
  enabled: true,
  number: 'CC-101',
  date: '2024-01-01',
  documentGuid: 'doc-guid-101',
  fileName: 'cc.pdf',
  propertyCertificateId: 501,
};

describe('BuildingDetailPane', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with certificate details', () => {
    render(
      <BuildingDetailPane
        data={mockCertData}
        onInputChange={vi.fn()}
        onFileUpload={vi.fn()}
        t={mockT}
        hasChanges={false}
      />
    );

    expect(screen.getByDisplayValue('CC-101')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2024-01-01')).toBeInTheDocument();
  });

  it('disables Save button when hasChanges is false', () => {
    const handleSave = vi.fn();
    render(
      <BuildingDetailPane
        data={mockCertData}
        onInputChange={vi.fn()}
        onFileUpload={vi.fn()}
        t={mockT}
        hasChanges={false}
        onSave={handleSave}
      />
    );

    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    expect(saveBtn).toBeDisabled();
    fireEvent.click(saveBtn);
    expect(handleSave).not.toHaveBeenCalled();
  });

  it('disables Save button when certificate number is missing even if hasChanges is true', () => {
    const handleSave = vi.fn();
    const incompleteData: CertificateData = {
      ...mockCertData,
      number: '',
    };
    render(
      <BuildingDetailPane
        data={incompleteData}
        onInputChange={vi.fn()}
        onFileUpload={vi.fn()}
        t={mockT}
        hasChanges={true}
        onSave={handleSave}
      />
    );

    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    expect(saveBtn).toBeDisabled();
    fireEvent.click(saveBtn);
    expect(handleSave).not.toHaveBeenCalled();
  });

  it('disables Save button when certificate date is missing even if hasChanges is true', () => {
    const handleSave = vi.fn();
    const incompleteData: CertificateData = {
      ...mockCertData,
      date: '',
    };
    render(
      <BuildingDetailPane
        data={incompleteData}
        onInputChange={vi.fn()}
        onFileUpload={vi.fn()}
        t={mockT}
        hasChanges={true}
        onSave={handleSave}
      />
    );

    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    expect(saveBtn).toBeDisabled();
    fireEvent.click(saveBtn);
    expect(handleSave).not.toHaveBeenCalled();
  });

  it('disables Save button when document is missing even if hasChanges is true', () => {
    const handleSave = vi.fn();
    const incompleteData: CertificateData = {
      ...mockCertData,
      documentGuid: undefined,
      fileName: undefined,
    };
    render(
      <BuildingDetailPane
        data={incompleteData}
        onInputChange={vi.fn()}
        onFileUpload={vi.fn()}
        t={mockT}
        hasChanges={true}
        onSave={handleSave}
      />
    );

    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    expect(saveBtn).toBeDisabled();
    fireEvent.click(saveBtn);
    expect(handleSave).not.toHaveBeenCalled();
  });

  it('enables Save button when hasChanges is true and triggers onSave on click', async () => {
    const handleSave = vi.fn().mockResolvedValue({ success: true });
    render(
      <BuildingDetailPane
        data={mockCertData}
        onInputChange={vi.fn()}
        onFileUpload={vi.fn()}
        t={mockT}
        hasChanges={true}
        onSave={handleSave}
      />
    );

    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    expect(saveBtn).not.toBeDisabled();
    fireEvent.click(saveBtn);
    await waitFor(() => {
      expect(handleSave).toHaveBeenCalled();
    });
  });

  it('displays loading state on Save button when isSaving is true', () => {
    render(
      <BuildingDetailPane
        data={mockCertData}
        onInputChange={vi.fn()}
        onFileUpload={vi.fn()}
        t={mockT}
        hasChanges={true}
        isSaving={true}
        onSave={vi.fn()}
      />
    );

    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    expect(saveBtn).toBeDisabled();
  });

  it('displays Delete button for existing certificate and handles deletion with loading state', async () => {
    const handleDelete = vi.fn().mockResolvedValue({ success: true });
    render(
      <BuildingDetailPane
        data={mockCertData}
        onInputChange={vi.fn()}
        onFileUpload={vi.fn()}
        t={mockT}
        hasChanges={false}
        onDeleteCertificate={handleDelete}
        onSave={vi.fn()}
      />
    );

    const deleteBtn = screen.getByRole('button', { name: /Delete Certificate & Data/i });
    expect(deleteBtn).toBeInTheDocument();
    expect(deleteBtn).not.toBeDisabled();

    fireEvent.click(deleteBtn);
    await waitFor(() => {
      expect(handleDelete).toHaveBeenCalled();
    });
  });

  it('displays error banner when save action fails with an error', async () => {
    const handleSave = vi.fn().mockResolvedValue({ success: false, message: 'Server rejected the certificate number' });
    render(
      <BuildingDetailPane
        data={mockCertData}
        onInputChange={vi.fn()}
        onFileUpload={vi.fn()}
        t={mockT}
        hasChanges={true}
        onSave={handleSave}
      />
    );

    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText('Server rejected the certificate number')).toBeInTheDocument();
    });
  });

  it('does not render floors table when property has 0 floors', () => {
    render(
      <BuildingDetailPane
        data={mockCertData}
        initialFloors={[]}
        floors={[]}
        onInputChange={vi.fn()}
        onFileUpload={vi.fn()}
        t={mockT}
      />
    );

    expect(screen.queryByText(/Floors Overview/i)).not.toBeInTheDocument();
  });

  it('renders floors table when property has greater than 0 floors', () => {
    const mockFloors: FloorData[] = [
      {
        id: 1,
        propertyDetailsId: 101,
        floor: 'Ground Floor',
        floorDescription: 'Ground Floor',
        conTyp: 'RCC',
        use: 'Residential',
        subFloor: '',
        conYr: '',
        asstYr: '',
        subTyp: '',
        rooms: 0,
        areaSqFt: 0,
        areaSqM: 0,
        builtupAreaSqFt: 0,
        builtupAreaSqM: 0,
        renter: false,
      },
    ];

    render(
      <BuildingDetailPane
        data={mockCertData}
        initialFloors={mockFloors}
        floors={[]}
        onInputChange={vi.fn()}
        onFileUpload={vi.fn()}
        t={mockT}
      />
    );

    expect(screen.getByText(/Floors Overview/i)).toBeInTheDocument();
  });

  it('does not show save error message when a validation error is present', async () => {
    const onSaveMock = vi.fn().mockResolvedValue({ success: false, isValid: false });

    render(
      <BuildingDetailPane
        data={mockCertData}
        fieldErrors={{ date: 'CC date must be before OC date' }}
        saveError="Error saving building permissions!"
        onInputChange={vi.fn()}
        onFileUpload={vi.fn()}
        onSave={onSaveMock}
        hasChanges={true}
        t={mockT}
      />
    );

    // Field-level validation error should be visible
    expect(screen.getByText('CC date must be before OC date')).toBeInTheDocument();
    // Generic save error message must NOT be displayed
    expect(screen.queryByText('Error saving building permissions!')).not.toBeInTheDocument();
  });
});
