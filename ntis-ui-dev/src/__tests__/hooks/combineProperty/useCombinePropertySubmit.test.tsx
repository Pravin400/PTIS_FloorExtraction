import { renderHook, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { ConfirmContextType } from '@/components/common/ConfirmProvider';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCombinePropertySubmit } from '@/hooks/combineProperty/useCombinePropertySubmit';
import { fetchPropertyCombineDetailsAction, createCombinePropertyAction } from '@/app/[locale]/property-tax/ptis/combineproperty/action';
import { toast } from 'sonner';
import { PropertyCombineDetails } from '@/types/combine-property.types';

const mockPush = vi.fn();
const mockRouter = { push: mockPush, replace: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() };
const mockConfirm = vi.fn();
const mockSetReviewData = vi.fn();
const mockSetCheckedPropertyIds = vi.fn();
const mockSetIsReviewing = vi.fn();
const mockSetShowPropertyTypeDropdown = vi.fn();
const mockSetRemarkError = vi.fn();
const mockHandleClear = vi.fn();
const mockT = vi.fn((k) => k);

vi.mock('@/app/[locale]/property-tax/ptis/combineproperty/action', () => ({
  fetchPropertyCombineDetailsAction: vi.fn(),
  createCombinePropertyAction: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
    success: vi.fn(),
  },
}));

describe('useCombinePropertySubmit', () => {
  const defaultProps = {
    selectedWardId: '1',
    selectedPropertyNo: 'P1',
    submitPropertyNos: 'P2,P3',
    partitionNo: 'A1,A2',
    basePartitionNo: 'A0',
    selectedBasePropertyId: '10',
    checkedProperties: [],
    selectedPropertyType: '',
    remark: 'test remark',
    t: mockT,
    setReviewData: mockSetReviewData,
    setCheckedPropertyIds: mockSetCheckedPropertyIds,
    setIsReviewing: mockSetIsReviewing,
    setShowPropertyTypeDropdown: mockSetShowPropertyTypeDropdown,
    setRemarkError: mockSetRemarkError,
    handleClear: mockHandleClear,
    router: mockRouter as unknown as ReturnType<typeof useRouter>,
    confirm: mockConfirm as unknown as ConfirmContextType['confirm'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles proceed correctly', async () => {
    const mockDetails = [{ propertyId: 1 }] as PropertyCombineDetails[];
    vi.mocked(fetchPropertyCombineDetailsAction).mockResolvedValue(mockDetails);

    const { result } = renderHook(() => useCombinePropertySubmit(defaultProps));

    await act(async () => {
      result.current.handleProceed();
    });

    expect(mockSetIsReviewing).toHaveBeenCalledWith(true);
    expect(fetchPropertyCombineDetailsAction).toHaveBeenCalledWith({
      wardId: 1,
      propertyNo: 'P2,P3,P1',
      partitionNo: 'A1,A2,A0'
    });
    expect(mockSetReviewData).toHaveBeenCalledWith(mockDetails);
    expect(mockSetCheckedPropertyIds).toHaveBeenCalled();
  });

  it('shows error if proceed is called without properties', () => {
    const { result } = renderHook(() => useCombinePropertySubmit({
      ...defaultProps,
      partitionNo: '',
      submitPropertyNos: '',
      basePartitionNo: ''
    }));

    act(() => {
      result.current.handleProceed();
    });

    expect(toast.error).toHaveBeenCalledWith('selectAtLeastOne');
  });

  it('handles combine with valid data', async () => {
    mockConfirm.mockImplementation((payload) => payload.onConfirm());
    vi.mocked(createCombinePropertyAction).mockResolvedValue({ success: true, message: 'Success' });

    const props = {
      ...defaultProps,
      checkedProperties: [
        { propertyId: 1, ownerName: 'A', propertyTypeId: 1 },
        { propertyId: 2, ownerName: 'A', propertyTypeId: 1 }
      ] as PropertyCombineDetails[]
    };

    const { result } = renderHook(() => useCombinePropertySubmit(props));

    await act(async () => {
      await result.current.handleCombine();
    });

    expect(mockConfirm).toHaveBeenCalled();
    expect(createCombinePropertyAction).toHaveBeenCalledWith({
      sourcePropertyId: 10,
      combinedPropertyIds: '1,2',
      combineReason: 'test remark',
      propertyTypeId: 1,
      overrideOwnerNameMismatch: false
    });
    expect(toast.success).toHaveBeenCalled();
  });

  it('prevents combine if missing owner name', async () => {
    const props = {
      ...defaultProps,
      checkedProperties: [
        { propertyId: 1, ownerName: '', propertyTypeId: 1 }
      ] as PropertyCombineDetails[]
    };

    const { result } = renderHook(() => useCombinePropertySubmit(props));

    await act(async () => {
      await result.current.handleCombine();
    });

    expect(toast.warning).toHaveBeenCalledWith('missingOwnerError');
  });

  it('prompts for property type if mismatch exists', async () => {
    const props = {
      ...defaultProps,
      checkedProperties: [
        { propertyId: 1, ownerName: 'A', propertyTypeId: 1 },
        { propertyId: 2, ownerName: 'A', propertyTypeId: 2 }
      ] as PropertyCombineDetails[]
    };

    const { result } = renderHook(() => useCombinePropertySubmit(props));

    await act(async () => {
      await result.current.handleCombine();
    });

    expect(mockSetShowPropertyTypeDropdown).toHaveBeenCalledWith(true);
    expect(toast.warning).toHaveBeenCalled();
  });

  it('shows error if remark is empty', async () => {
    const props = {
      ...defaultProps,
      remark: '   ',
      checkedProperties: [
        { propertyId: 1, ownerName: 'A', propertyTypeId: 1 }
      ] as PropertyCombineDetails[]
    };

    const { result } = renderHook(() => useCombinePropertySubmit(props));

    await act(async () => {
      await result.current.handleCombine();
    });

    expect(mockSetRemarkError).toHaveBeenCalledWith(true);
  });
});
