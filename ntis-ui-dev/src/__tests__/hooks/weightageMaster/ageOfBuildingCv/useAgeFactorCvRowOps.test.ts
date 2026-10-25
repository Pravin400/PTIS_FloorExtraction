import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAgeFactorCvRowOps } from '@/hooks/weightageMaster/ageFactorCv/useAgeFactorCvRowOps';
import { AgeFactorCVMaster } from '@/types/ageFactorCv.types';

// Mock server actions
vi.mock('@/app/[locale]/property-tax/weightage-master/age-weightage/action', () => ({
  createAgeFactorCVMasterAction: vi.fn(() => Promise.resolve({ success: true })),
  updateAgeFactorCVMasterAction: vi.fn(() => Promise.resolve({ success: true })),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('useAgeFactorCvRowOps', () => {
  const mockAddToast = vi.fn();
  const mockSetEditableRows = vi.fn();
  const mockSetSessionCreatedUids = vi.fn();
  const mockGetRowUid = (row: AgeFactorCVMaster) => row.id.toString();

  const defaultProps = {
    selectedYear: '2024',
    editableRows: {},
    setEditableRows: mockSetEditableRows,
    setSessionCreatedUids: mockSetSessionCreatedUids,
    addToast: mockAddToast,
    getRowUid: mockGetRowUid,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handleUpdate should show warning if no changes', async () => {
    const { result } = renderHook(() => useAgeFactorCvRowOps(defaultProps));
    const row = { id: 1, factor: 1.0 } as AgeFactorCVMaster;

    await act(async () => {
      await result.current.handleUpdate(row);
    });

    expect(mockAddToast).toHaveBeenCalledWith('warning', expect.any(String));
  });

  it('handleUpdate should call update action for existing row', async () => {
    const row = { id: 1, constructionTypeId: 1, ageFrom: 0, ageTo: 5, factor: 1.0, yearRangeCVId: 2024, isActive: true } as AgeFactorCVMaster;
    const editableRows = { '1': { ...row, factor: 1.5 } };
    const { result } = renderHook(() => useAgeFactorCvRowOps({ ...defaultProps, editableRows }));

    const { updateAgeFactorCVMasterAction } = await import('@/app/[locale]/property-tax/weightage-master/age-weightage/action');

    await act(async () => {
      await result.current.handleUpdate(row);
    });

    expect(updateAgeFactorCVMasterAction).toHaveBeenCalled();
    expect(mockAddToast).toHaveBeenCalledWith('success', expect.any(String));
  });

  it('handleCancelRow should remove row from editable state', () => {
    const { result } = renderHook(() => useAgeFactorCvRowOps(defaultProps));
    const row = { id: 1 } as AgeFactorCVMaster;

    act(() => {
      result.current.handleCancelRow(row);
    });

    expect(mockSetEditableRows).toHaveBeenCalled();
  });
});
