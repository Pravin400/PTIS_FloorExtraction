/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useOldTaxationForm } from '@/hooks/ptis/QuickDataEntry/Olddetails/useOldTaxationForm';
import { toast } from 'sonner';
import { useConfirm } from '@/components/common';
import { useParams } from 'next/navigation';
import { updatePropertyOldDetailsAction } from '@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/OldDetails/old-taxation/action';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/components/common', () => ({
  useConfirm: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/OldDetails/old-taxation/action', () => ({
  updatePropertyOldDetailsAction: vi.fn(),
}));

describe('useOldTaxationForm', () => {
  const mockPropertyOldDetails = {
    propertyId: 123,
    oldPlotNo: 'P1',
    oldCarpetAreaSqFeet: 100,
    oldRV: 500,
    oldALV: 600,
    oldGeneralTax: 100,
    oldTotalTax: 1000,
    oldWardNo: 'W1',
    oldPropertyNo: 'PN1',
    oldPartitionNo: 'PR1',
    oldEgovNo: 'E1',
    oldPlotArea: 200,
    oldZoneNo: 'Z1',
    oldCSN: null,
    oldConstructionArea: 250,
    oldConstructionYear: '2020',
    oldCarpetAreaSqMeter: 10,
    oldConstructionTypeId: 1,
    oldTypeOfUseId: 1,
  };

  const mockConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useConfirm).mockReturnValue({ confirm: mockConfirm } as any);
    vi.mocked(useParams).mockReturnValue({ propertyId: '123', locale: 'en' } as any);
  });

  it('should initialize with provided data', () => {
    const { result } = renderHook(() => useOldTaxationForm(mockPropertyOldDetails));

    expect(result.current.formData.oldPlotNo).toBe('P1');
    expect(result.current.formData.oldRV).toBe('500');
  });

  it('should update form data when handleInputChange is called', () => {
    const { result } = renderHook(() => useOldTaxationForm(mockPropertyOldDetails));

    act(() => {
      result.current.handleInputChange('oldPlotNo', 'P2');
    });

    expect(result.current.formData.oldPlotNo).toBe('P2');
  });

  it('should call updatePropertyOldDetailsAction on confirm', async () => {
    mockConfirm.mockImplementation(({ onConfirm }) => onConfirm());
    (updatePropertyOldDetailsAction as any).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useOldTaxationForm(mockPropertyOldDetails));

    await act(async () => {
      result.current.handleUpdate();
    });

    expect(mockConfirm).toHaveBeenCalled();
    expect(updatePropertyOldDetailsAction).toHaveBeenCalledWith(123, expect.any(Object), 'en');
    expect(toast.success).toHaveBeenCalled();
  });

  it('should show error toast if update fails', async () => {
    mockConfirm.mockImplementation(({ onConfirm }) => onConfirm());
    (updatePropertyOldDetailsAction as any).mockResolvedValue({ success: false, error: 'API Error' });

    const { result } = renderHook(() => useOldTaxationForm(mockPropertyOldDetails));

    await act(async () => {
      result.current.handleUpdate();
    });

    expect(toast.error).toHaveBeenCalled();
  });

  it('should compute isChanged correctly when fields are modified', () => {
    const { result } = renderHook(() => useOldTaxationForm(mockPropertyOldDetails));

    expect(result.current.isChanged).toBe(false);

    act(() => {
      result.current.handleInputChange('oldPlotNo', 'P2');
    });

    expect(result.current.isChanged).toBe(true);
  });

  it('should support Devanagari digits in input fields and sanitize them correctly', () => {
    const { result } = renderHook(() => useOldTaxationForm(mockPropertyOldDetails));

    act(() => {
      result.current.handleInputChange('oldPlotArea', '१५००.२५');
    });
    expect(result.current.formData.oldPlotArea).toBe('१५००.२५');

    act(() => {
      result.current.handleInputChange('oldRV', '५०००');
    });
    expect(result.current.formData.oldRV).toBe('५०००');
  });

  it('should translate Devanagari digits to standard English numbers on submit', async () => {
    mockConfirm.mockImplementation(({ onConfirm }) => onConfirm());
    (updatePropertyOldDetailsAction as any).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useOldTaxationForm(mockPropertyOldDetails));

    act(() => {
      result.current.handleInputChange('oldPlotArea', '१५००.२५');
      result.current.handleInputChange('oldRV', '५०००');
    });

    await act(async () => {
      result.current.handleUpdate();
    });

    expect(updatePropertyOldDetailsAction).toHaveBeenCalledWith(
      123,
      expect.objectContaining({
        oldPlotArea: 1500.25,
        oldRV: 5000,
      }),
      'en'
    );
  });

  it('should compute isChanged as false if equivalent Marathi digits are entered', () => {
    const { result } = renderHook(() => useOldTaxationForm(mockPropertyOldDetails));

    expect(result.current.isChanged).toBe(false);

    act(() => {
      // mockPropertyOldDetails has oldPlotArea: 200, oldRV: 500
      result.current.handleInputChange('oldPlotArea', '२००');
      result.current.handleInputChange('oldRV', '५००');
    });

    expect(result.current.isChanged).toBe(false);
  });

  it('should fail validation and show error toast if Plot Area is empty or invalid', async () => {
    const { result } = renderHook(() => useOldTaxationForm({ ...mockPropertyOldDetails, oldPlotArea: 0 }));

    await act(async () => {
      result.current.handleUpdate();
    });

    expect(mockConfirm).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('oldDetails.validation.fillRequiredFields');
  });

  it('should compute isRequiredFieldsValid correctly when required fields are missing', () => {
    const { result } = renderHook(() => useOldTaxationForm(mockPropertyOldDetails));

    expect(result.current.isRequiredFieldsValid).toBe(true);

    act(() => {
      result.current.handleInputChange('oldPlotArea', '');
    });

    expect(result.current.isRequiredFieldsValid).toBe(false);
  });

  it('should only show errors after attemptedSubmit is true', () => {
    const { result } = renderHook(() => useOldTaxationForm(mockPropertyOldDetails));

    // Initially attemptedSubmit is false, so errors shouldn't show even if field is changed and invalid
    act(() => {
      result.current.handleInputChange('oldPlotArea', '');
    });
    expect(result.current.showError('oldPlotArea', false)).toBe(false);

    // Call handleUpdate to trigger attemptedSubmit = true
    act(() => {
      result.current.handleUpdate();
    });
    expect(result.current.showError('oldPlotArea', false)).toBe(true);
  });
});
