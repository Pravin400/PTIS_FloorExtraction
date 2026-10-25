import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePropertyEditScreenSubmission } from '@/hooks/apartmentQc/usePropertyEditScreenSubmission';
import type { ApartmentQCDetail } from '@/types/apartmentQC.types';
import type { DrawerFormData } from '@/types/propertyEditScreenDrawer.types';

vi.mock('@/app/[locale]/property-tax/ptis/appartmentQC/action', () => ({
  updateBasicDetailsAction: vi.fn().mockResolvedValue({ success: true }),
  updateFloorQCDetailsBulkAction: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  }
}));

describe('usePropertyEditScreenSubmission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockArgs = {
    propertyData: { id: 123 } as unknown as ApartmentQCDetail,
    formData: { ownerName: 'Test' } as unknown as DrawerFormData,
    validateForm: vi.fn().mockReturnValue(true),
    validateFloorYears: vi.fn().mockReturnValue([]),
    onSaveOrClose: vi.fn(),
  };

  it('should initialize successfully', () => {
    const { result } = renderHook(() => usePropertyEditScreenSubmission(mockArgs));
    expect(result.current.handleSave).toBeDefined();
  });

  it('should handle basic details save success', async () => {
    const { result } = renderHook(() => usePropertyEditScreenSubmission(mockArgs));

    await act(async () => {
      await result.current.handleSave();
    });

    expect(mockArgs.onSaveOrClose).toHaveBeenCalled();
  });

  it('should handle save error when validation fails', async () => {
    const { result } = renderHook(() => usePropertyEditScreenSubmission({
      ...mockArgs,
      validateForm: vi.fn().mockReturnValue(false),
    }));

    await act(async () => {
      await result.current.handleSave();
    });

    expect(mockArgs.onSaveOrClose).not.toHaveBeenCalled();
  });
});
