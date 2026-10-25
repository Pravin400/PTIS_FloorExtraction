import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAgeFactorCvBulkOps } from '@/hooks/weightageMaster/ageFactorCv/useAgeFactorCvBulkOps';
import { AgeFactorCVMaster } from "@/types/ageFactorCv.types";

// Mock helpers and actions
vi.mock('@/lib/utils/weightageMaster/ageFactorCv/ageFactorCvBulkHelpers', () => ({
  buildGenerateAllPayload: vi.fn(() => [{ id: 0, factor: 1.0 }]),
  prepareBulkUpdatePayloads: vi.fn(() => ({ creates: [], updates: [] })),
}));

vi.mock('@/lib/utils/weightageMaster/ageFactorCv/ageFactorCvValidation', () => ({
  validateFactorValue: vi.fn(() => ({ isValid: true, factor: 1.2 })),
  matchesFilterCriteria: vi.fn(() => true),
}));

vi.mock('@/app/[locale]/property-tax/weightage-master/age-weightage/action', () => ({
  bulkCreateAgeFactorCVMasterAction: vi.fn(() => Promise.resolve({ success: true })),
  bulkUpdateAgeFactorCVMasterAction: vi.fn(() => Promise.resolve({ success: true })),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('useAgeFactorCvBulkOps', () => {
  const mockAddToast = vi.fn();
  const mockSetEditableRows = vi.fn();
  const mockClearFilters = vi.fn();

  const defaultProps = {
    selectionState: {
      selectedYear: '2024',
      constructionType: ['1'],
      selectedAgeRange: ['0-5'],
      ageFrom: '0',
      ageTo: '5',
      factorValue: '1.2',
    },
    masterData: {
      data: [{ id: 1 } as unknown as AgeFactorCVMaster],
      allAgeFactors: [],
      constructionTypeOptions: [{ label: '1', value: '1' }],
      ageRangeOptions: [{ label: '0-5', value: '0-5' }],
    },
    sessionState: {
      editableRows: {},
      setEditableRows: mockSetEditableRows,
      sessionCreatedUids: new Set<string>(),
      getRowUid: (row: AgeFactorCVMaster) => row.id.toString(),
      findRowByUid: vi.fn(),
    },
    callbacks: {
      addToast: mockAddToast,
      clearFilters: mockClearFilters,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handleApplyFilter should apply factor to matching rows', () => {
    const { result } = renderHook(() => useAgeFactorCvBulkOps(defaultProps));

    act(() => {
      result.current.handleApplyFilter();
    });

    expect(mockSetEditableRows).toHaveBeenCalled();
    expect(mockAddToast).toHaveBeenCalledWith('success', expect.any(String));
  });

  it('handleGenerateAll should call bulk create action', async () => {
    const { result } = renderHook(() => useAgeFactorCvBulkOps(defaultProps));

    const { bulkCreateAgeFactorCVMasterAction } = await import('@/app/[locale]/property-tax/weightage-master/age-weightage/action');

    await act(async () => {
      await result.current.handleGenerateAll();
    });

    expect(bulkCreateAgeFactorCVMasterAction).toHaveBeenCalled();
    expect(mockAddToast).toHaveBeenCalledWith('success', expect.any(String));
  });
});
