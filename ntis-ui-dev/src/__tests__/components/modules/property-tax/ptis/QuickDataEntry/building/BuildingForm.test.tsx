import { vi } from 'vitest';

// HOISTED MOCKS
vi.mock('server-only', () => ({}));
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));
vi.mock('@/services/api.service', () => ({ apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }));
vi.mock('@/lib/api/document.service', () => ({ uploadDocument: vi.fn(), getViewDocumentUrl: vi.fn(() => 'mock-url') }));
vi.mock('@/lib/api/building.service', () => ({ getCertificateTypesWithStatus: vi.fn(), replaceCertificateDocument: vi.fn(), bulkSaveCertificates: vi.fn() }));

import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, Mock } from 'vitest';
import BuildingForm from '@/components/modules/property-tax/ptis/QuickDataEntry/building/BuildingForm';
import { PropertyCertificateWithStatusDto } from '@/types/building-permission.types';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() })),
  useParams: vi.fn(() => ({ locale: 'en', propertyId: '123' })),
  usePathname: vi.fn(() => '/en/property-tax/ptis/QuickDataEntry/123/Building'),
  useSearchParams: vi.fn(() => new URLSearchParams('')),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => ({
    'building.title': 'Building Permissions & Documents',
    'building.apartmentLevel': 'Apartment Level',
    'building.wingLevel': 'Wing Level',
    'building.unitLevel': 'Unit Level',
    'common.saveChanges': 'Save Changes',
  }[key] || key),
  useLocale: () => 'en',
}));

// Mock useConfirm
vi.mock('@/components/common/ConfirmProvider', () => ({
  useConfirm: () => ({ confirm: vi.fn(({ onConfirm }) => onConfirm()) }),
}));

vi.mock('@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/Building/action', () => ({
  getBuildingPermissionsAction: vi.fn(),
  replaceCertificateDocumentAction: vi.fn(),
  saveBuildingPermissionsAction: vi.fn(),
  saveCertificateAction: vi.fn(),
  getCertificateTypeMasterAction: vi.fn(() => Promise.resolve({ success: true, data: [] })),
  getWingsByPropertyAction: vi.fn(() => Promise.resolve({ success: true, data: [] })),
  getUnitsByPropertyAction: vi.fn(() => Promise.resolve({ success: true, data: [] })),
  getApartmentQcCertificateGridAction: vi.fn(() => Promise.resolve({ success: true, data: { wingCount: 4, unitCount: 48, records: [] } })),
  postApartmentQcCertificateRecordAction: vi.fn(() => Promise.resolve({ success: true, message: 'Saved successfully' })),
}));

import {
  saveCertificateAction
} from '@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/Building/action';

const mockInitialData: PropertyCertificateWithStatusDto[] = [
  { certificateTypeId: 1, certificateTypeName: "Completion Certificate", displayOrder: 10, hasCertificate: true, propertyCertificateId: 1001, isActive: true, certificateNo: "CC-001000", issueDate: "2023-01-01T00:00:00", documentGuid: "guid-123", fileName: "cc.pdf" },
  { certificateTypeId: 3, certificateTypeName: "Electricity Bill", displayOrder: 20, hasCertificate: false, propertyCertificateId: null, isActive: false, certificateNo: null, issueDate: null, documentGuid: null, fileName: null }
];

describe('BuildingForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with initial data', () => {
    render(<BuildingForm initialBuildingPermission={mockInitialData} propertyId="123" categoryId={1} categoryName="Apartment" />);
    expect(screen.getByText('Building Permissions & Documents')).toBeInTheDocument();
    expect(screen.getByText('Apartment Level')).toBeInTheDocument();
    expect(screen.getByText('Wing Level')).toBeInTheDocument();
    expect(screen.getByText('Unit Level')).toBeInTheDocument();
  });

  it('supports level selection switching to Wing Level and Unit Level', async () => {
    render(<BuildingForm initialBuildingPermission={mockInitialData} propertyId="123" categoryId={1} categoryName="Apartment" />);
    
    const wingLevelBtn = screen.getByRole('button', { name: /Wing Level/i });
    await act(async () => {
      fireEvent.click(wingLevelBtn);
    });

    const unitLevelBtn = screen.getByRole('button', { name: /Unit Level/i });
    await act(async () => {
      fireEvent.click(unitLevelBtn);
    });
  });

  it('allows clicking Save Changes button', async () => {
    (saveCertificateAction as Mock).mockResolvedValue({ success: true, data: { propertyCertificateId: 100 } });
    render(<BuildingForm initialBuildingPermission={mockInitialData} propertyId="123" categoryId={1} categoryName="Apartment" />);
    
    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    expect(saveBtn).toBeInTheDocument();
    fireEvent.click(saveBtn);

    await screen.findByRole('button', { name: /Save Changes/i });
  });
});
