import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useConfirm } from '@/components/common';
import { useSingleAssessment } from '@/hooks/extendedAreaAssessment/useSingleAssessment';
import { useSection129SaveActions } from '@/hooks/extendedAreaAssessment/useSection129SaveActions';
import { useSection129ExportActions } from '@/hooks/extendedAreaAssessment/useSection129ExportActions';
import { useSection129SearchActions } from '@/hooks/extendedAreaAssessment/useSection129SearchActions';
import type { Section129ActionResult } from '@/app/[locale]/property-tax/extended-area-assesment/single-assessment/action';
import type { Section129ScheduleApi } from '@/types/section129.types';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => (key: string) => key),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/components/common', () => ({
  useConfirm: vi.fn(() => ({ confirm: vi.fn() })),
}));

vi.mock('@/hooks/extendedAreaAssessment/useSection129SaveActions', () => ({
  useSection129SaveActions: vi.fn(() => ({ handleSave: vi.fn(), handleRecalculate: vi.fn() })),
}));

vi.mock('@/hooks/extendedAreaAssessment/useSection129ExportActions', () => ({
  useSection129ExportActions: vi.fn(() => ({
    handleExportCsv: vi.fn(),
    handlePrint: vi.fn(),
    pdfPreviewUrl: null,
    closePdfPreview: vi.fn(),
  })),
}));

vi.mock('@/hooks/extendedAreaAssessment/useSection129SearchActions', () => ({
  useSection129SearchActions: vi.fn(() => ({
    isSearching: false,
    handleSearch: vi.fn(),
    handleSearchAny: vi.fn(),
    handleReset: vi.fn(),
  })),
}));

function buildApiFixture(overrides: Partial<Section129ScheduleApi> = {}): Section129ScheduleApi {
  return {
    propertyId: 549439,
    wardId: 1,
    baseTaxCode: 'General Tax',
    currentFinancialYear: '2026-27',
    upic: 'MM1100150000',
    oldGpNo: 'MM11001000',
    ownerName: 'The Holder',
    address: 'Address',
    useType: 'Residential',
    zone: 'Ward MM11',
    isApplied: true,
    assessmentYear: '2024',
    appliedDate: null,
    areaInclusionDate: null,
    ocDate: null,
    useOcDateBasis: false,
    oldTax: 1240,
    fullGeneralTax: 1963,
    taxableValue: 2394,
    generalTaxRate: 0,
    areaChanged: false,
    useChanged: false,
    otherStructuralChange: false,
    otherStructuralChangeEffectiveDate: null,
    changeDetailsRemark: null,
    caseStatus: 'Calculated',
    remarks: null,
    rows: [],
    recalculateBlockedReason: null,
    ...overrides,
  };
}

describe('useSingleAssessment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ refresh: vi.fn() } as never);
    vi.mocked(useConfirm).mockReturnValue({ confirm: vi.fn() } as never);
    vi.mocked(useSection129SaveActions).mockReturnValue({ handleSave: vi.fn(), handleRecalculate: vi.fn() });
    vi.mocked(useSection129ExportActions).mockReturnValue({
      handleExportCsv: vi.fn(),
      handlePrint: vi.fn(),
      pdfPreviewUrl: null,
      closePdfPreview: vi.fn(),
    });
    vi.mocked(useSection129SearchActions).mockReturnValue({
      isSearching: false,
      handleSearch: vi.fn(),
      handleSearchAny: vi.fn(),
      handleReset: vi.fn(),
    });
  });

  it('starts with a blank form and an empty result when nothing was pre-loaded', () => {
    const { result } = renderHook(() => useSingleAssessment());
    expect(result.current.propertyId).toBeNull();
    expect(result.current.form.upic).toBe('');
    expect(result.current.result.rows).toEqual([]);
  });

  it('seeds the UPIC/Old GP fields from initialUpic/initialOldGpNo even with no search result', () => {
    const { result } = renderHook(() => useSingleAssessment({ initialUpic: 'MM1', initialOldGpNo: 'GP1' }));
    expect(result.current.form.upic).toBe('MM1');
    expect(result.current.form.oldGpNo).toBe('GP1');
  });

  it('seeds propertyId/form/result from a successful initialSearchResult', () => {
    const initialSearchResult: Section129ActionResult = { success: true, data: buildApiFixture() };
    const { result } = renderHook(() => useSingleAssessment({ initialSearchResult }));
    expect(result.current.propertyId).toBe(549439);
    expect(result.current.form.ownerName).toBe('The Holder');
    expect(result.current.result.currentFy).toBe('2026-27');
  });

  it('seeds the empty result with the SSR-provided current finance year when nothing was searched', () => {
    const { result } = renderHook(() => useSingleAssessment({ initialCurrentFinancialYear: '2029-30' }));
    expect(result.current.result.currentFy).toBe('2029-30');
  });

  it('shows an error toast (via effect) when initialSearchResult failed', () => {
    const initialSearchResult: Section129ActionResult = { success: false, data: null, error: 'Property not found' };
    renderHook(() => useSingleAssessment({ initialSearchResult }));
    expect(toast.error).toHaveBeenCalledWith('Property not found');
  });

  describe('setField', () => {
    it('updates a single form field without touching the rest', () => {
      const { result } = renderHook(() => useSingleAssessment());
      act(() => result.current.setField('upic', 'NEWUPIC'));
      expect(result.current.form.upic).toBe('NEWUPIC');
      expect(result.current.form.oldGpNo).toBe('');
    });
  });

  describe('syncGeneralTax', () => {
    it('updates taxableValue and generalRate together', () => {
      const { result } = renderHook(() => useSingleAssessment());
      act(() => result.current.syncGeneralTax(5000, 12.5));
      expect(result.current.form.taxableValue).toBe(5000);
      expect(result.current.form.generalRate).toBe(12.5);
    });
  });

  describe('toggleChangeField and `changed`', () => {
    it('is false when every change flag is "no"', () => {
      const { result } = renderHook(() => useSingleAssessment());
      expect(result.current.changed).toBe(false);
    });

    it('becomes true when any change flag is set to "yes"', () => {
      const { result } = renderHook(() => useSingleAssessment());
      act(() => result.current.toggleChangeField('areaChanged', 'yes'));
      expect(result.current.changed).toBe(true);
    });

    it('clears changeDate/changeDetails once every flag is back to "no"', () => {
      const { result } = renderHook(() => useSingleAssessment());
      act(() => result.current.toggleChangeField('areaChanged', 'yes'));
      act(() => result.current.setField('changeDate', '2026-01-01'));
      act(() => result.current.setField('changeDetails', 'some remark'));
      act(() => result.current.toggleChangeField('areaChanged', 'no'));
      expect(result.current.changed).toBe(false);
      expect(result.current.form.changeDate).toBe('');
      expect(result.current.form.changeDetails).toBe('');
    });

    it('keeps changeDate/changeDetails when a different change flag is still "yes"', () => {
      const { result } = renderHook(() => useSingleAssessment());
      act(() => result.current.toggleChangeField('areaChanged', 'yes'));
      act(() => result.current.toggleChangeField('useChanged', 'yes'));
      act(() => result.current.setField('changeDate', '2026-01-01'));
      act(() => result.current.toggleChangeField('areaChanged', 'no'));
      expect(result.current.changed).toBe(true);
      expect(result.current.form.changeDate).toBe('2026-01-01');
    });
  });

  it('exposes the search/save/export actions from their respective sub-hooks', () => {
    const { result } = renderHook(() => useSingleAssessment());
    expect(typeof result.current.handleSearch).toBe('function');
    expect(typeof result.current.handleSave).toBe('function');
    expect(typeof result.current.handleExportCsv).toBe('function');
    expect(result.current.pdfPreviewUrl).toBeNull();
  });
});
