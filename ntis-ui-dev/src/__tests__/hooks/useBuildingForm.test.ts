import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBuildingForm } from '@/hooks/useBuildingForm';
import {
  getBuildingPermissionsAction,
  getFloorCertificatesAction,
  deletePropertyCertificateAction,
  saveCertificateAction,
} from '@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/Building/action';
import {
  SaveCertificateResponseDto,
  FloorCertificatesResponseDto,
} from '@/types/building-permission.types';
import { toast } from 'sonner';

vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(''),
  usePathname: () => '/en/property-tax/ptis/QuickDataEntry/100/Building',
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/Building/action', () => ({
  saveBuildingPermissionsAction: vi.fn(),
  getBuildingPermissionsAction: vi.fn(),
  getFloorCertificatesAction: vi.fn(),
  deletePropertyCertificateAction: vi.fn(),
  saveCertificateAction: vi.fn(),
  replaceCertificateDocumentAction: vi.fn(),
}));

vi.mock('@/lib/utils/validateBuildingForm', () => ({
  validateBuildingForm: vi.fn(() => ({
    isValid: true,
    errors: {},
    incompleteCertificates: [],
    fieldErrors: {},
  })),
}));

const mockInitialData = [
  {
    certificateTypeId: 1,
    certificateTypeName: 'Completion Certificate',
    displayOrder: 1,
    hasCertificate: true,
    propertyCertificateId: 101,
    isActive: true,
    certificateNo: 'CC-101',
    issueDate: '2024-01-01T00:00:00',
    documentGuid: 'guid-101',
    fileName: 'cc101.pdf',
  },
  {
    certificateTypeId: 2,
    certificateTypeName: 'Plinth Certificate',
    displayOrder: 2,
    hasCertificate: false,
    propertyCertificateId: null,
    isActive: false,
    certificateNo: null,
    issueDate: null,
    documentGuid: null,
    fileName: null,
  },
];

describe('useBuildingForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes form state correctly from initial data', () => {
    const { result } = renderHook(() =>
      useBuildingForm(mockInitialData, null, '100')
    );

    expect(result.current.buildingPermission[1]).toBeDefined();
    expect(result.current.buildingPermission[1].number).toBe('CC-101');
    expect(result.current.buildingPermission[1].enabled).toBe(true);
    expect(result.current.buildingPermission[2].enabled).toBe(false);
    expect(result.current.isSaving).toBe(false);
  });

  it('handles input changes and toggle enables', () => {
    const { result } = renderHook(() =>
      useBuildingForm(mockInitialData, null, '100')
    );

    act(() => {
      result.current.handleInputChange(1, 'number', 'CC-UPDATED');
    });
    expect(result.current.buildingPermission[1].number).toBe('CC-UPDATED');
    expect(result.current.hasChanges).toBe(true);

    act(() => {
      result.current.handleToggleEnabled(2, true);
    });
    expect(result.current.buildingPermission[2].enabled).toBe(true);
  });

  it('handles saving via standalone saveCertificateAction with overrideData', async () => {
    vi.mocked(saveCertificateAction).mockResolvedValue({
      success: true,
      data: { propertyCertificateId: 101 } as unknown as SaveCertificateResponseDto,
    });
    vi.mocked(getBuildingPermissionsAction).mockResolvedValue({
      success: true,
      data: mockInitialData,
    });
    vi.mocked(getFloorCertificatesAction).mockResolvedValue({
      success: true,
      data: { selectedFloor: null, otherFloors: [] } as unknown as FloorCertificatesResponseDto,
    });

    const { result } = renderHook(() =>
      useBuildingForm(mockInitialData, null, '100')
    );

    let saveResult;
    await act(async () => {
      saveResult = await result.current.handleSave({
        silent: false,
        overrideData: {
          number: 'CC-OVERRIDE',
          date: '2025-01-01',
          documentGuid: 'doc-guid-override',
          existingDocumentGuid: 'doc-guid-override',
          propertyCertificateId: 101,
          isFileModified: false,
        },
      });
    });

    expect(saveCertificateAction).toHaveBeenCalledWith(
      'en',
      '100',
      expect.objectContaining({
        certificateTypeId: 1,
        certificateNo: 'CC-OVERRIDE',
        documentGuid: 'doc-guid-override',
        existingDocumentGuid: 'doc-guid-override',
        propertyCertificateId: 101,
        isFileModified: false,
      })
    );
    expect(saveResult).toEqual({ success: true, isValid: true });
    expect(toast.success).toHaveBeenCalled();
  });

  it('handles saving bulk building permissions when hasChanges is true', async () => {
    vi.mocked(saveCertificateAction).mockResolvedValue({
      success: true,
      data: { propertyCertificateId: 101 } as unknown as SaveCertificateResponseDto,
    });
    vi.mocked(getBuildingPermissionsAction).mockResolvedValue({
      success: true,
      data: mockInitialData,
    });
    vi.mocked(getFloorCertificatesAction).mockResolvedValue({
      success: true,
      data: { selectedFloor: null, otherFloors: [] } as unknown as FloorCertificatesResponseDto,
    });

    const { result } = renderHook(() =>
      useBuildingForm(mockInitialData, null, '100')
    );

    act(() => {
      result.current.handleInputChange(1, 'number', 'CC-MODIFIED');
    });

    let saveResult;
    await act(async () => {
      saveResult = await result.current.handleSave();
    });

    expect(saveCertificateAction).toHaveBeenCalled();
    expect(saveResult).toEqual({ success: true, isValid: true });
    expect(toast.success).toHaveBeenCalled();
  });

  it('handles certificate deletion', async () => {
    vi.mocked(deletePropertyCertificateAction).mockResolvedValue({
      success: true,
      message: 'Deleted successfully',
    });
    vi.mocked(getBuildingPermissionsAction).mockResolvedValue({
      success: true,
      data: [],
    });
    vi.mocked(getFloorCertificatesAction).mockResolvedValue({
      success: true,
      data: { selectedFloor: null, otherFloors: [] } as unknown as FloorCertificatesResponseDto,
    });

    const { result } = renderHook(() =>
      useBuildingForm(mockInitialData, null, '100')
    );

    await act(async () => {
      await result.current.handleDeleteCertificate(1);
    });

    expect(deletePropertyCertificateAction).toHaveBeenCalledWith(100, 1, null, 'en', '100');
    expect(toast.success).toHaveBeenCalled();
  });
});
