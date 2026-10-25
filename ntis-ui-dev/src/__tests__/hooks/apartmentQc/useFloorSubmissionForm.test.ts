import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFloorSubmissionForm } from '@/hooks/apartmentQc/useFloorSubmissionForm';
import type { FloorSubmissionRow } from '@/types/apartmentQC.types';

const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => '/en/property-tax/ptis/appartmentQC',
  useSearchParams: () => ({
    get: (key: string) => {
      if (key === 'editPropertyId') return '550299';
      return null;
    },
    toString: () => '',
  }),
}));

const mockUpdateFloorQCDetailAction = vi.fn();

vi.mock('@/app/[locale]/property-tax/ptis/appartmentQC/action', () => ({
  updateFloorQCDetailAction: (...args: unknown[]) => mockUpdateFloorQCDetailAction(...args),
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

describe('useFloorSubmissionForm', () => {
  const initialRow: FloorSubmissionRow = {
    id: 'row-206147',
    pdnId: 206147,
    floorId: '1',
    conYear: '2010',
    asstYear: '2011',
    constructionTypeId: '2',
    typeOfUseId: '3',
    subTypeOfUseId: '4',
    noOfRooms: '2',
    area: '100',
    rentMY: '0/0',
    rateMY: '0/0',
    rentalValue: '0',
    depreciation: '0',
    alv: '0',
    mr: '0',
    rv: '0',
    sdrr: '0',
    baseValue: '0',
    floorFactor: '0',
    ageFactor: '0',
    ntbFactor: '0',
    useFactor: '0',
    capitalValue: '0',
    propertyId: 550299,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets validation errors and skips save for invalid year format', async () => {
    const onSaveSuccess = vi.fn();
    const { result } = renderHook(() => useFloorSubmissionForm(initialRow, onSaveSuccess));

    act(() => {
      result.current.handleFieldChange('conYear', '20');
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.errors.conYear).toBe('floorQC.validation.invalidYear');
    expect(mockUpdateFloorQCDetailAction).not.toHaveBeenCalled();
    expect(onSaveSuccess).not.toHaveBeenCalled();
  });

  it('saves successfully with valid payload and triggers callback', async () => {
    const onSaveSuccess = vi.fn();
    mockUpdateFloorQCDetailAction.mockResolvedValueOnce({ success: true });

    const { result } = renderHook(() => useFloorSubmissionForm(initialRow, onSaveSuccess));

    await act(async () => {
      await result.current.handleSave();
    });

    expect(mockUpdateFloorQCDetailAction).toHaveBeenCalledWith(
      550299,
      206147,
      {
        floorId: 1,
        constructionTypeId: 2,
        typeOfUseId: 3,
        subTypeOfUseId: 4,
        constructionYear: '2010',
        assessmentYear: '2011',
      }
    );
    expect(toastSuccess).toHaveBeenCalled();
    expect(onSaveSuccess).toHaveBeenCalledTimes(1);
  });
});
