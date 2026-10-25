import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'sonner';
import { useSection129SaveActions } from '@/hooks/extendedAreaAssessment/useSection129SaveActions';
import { applySection129AAction, recalculateSection129AAction } from '@/app/[locale]/property-tax/extended-area-assesment/single-assessment/action';
import { emptyForm, emptyResult } from '@/hooks/extendedAreaAssessment/mapSection129Api';
import type { Section129ScheduleApi } from '@/types/section129.types';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/app/[locale]/property-tax/extended-area-assesment/single-assessment/action', () => ({
  applySection129AAction: vi.fn(),
  recalculateSection129AAction: vi.fn(),
}));

// By default auto-confirms (invokes onConfirm immediately), so existing recalculate assertions
// don't need to change; tests for the confirmation dialog itself override this per-test.
const { confirmMock } = vi.hoisted(() => ({ confirmMock: vi.fn() }));
vi.mock('@/components/common', () => ({
  useConfirm: () => ({ confirm: confirmMock }),
}));

const t = ((key: string) => key) as unknown as Parameters<typeof useSection129SaveActions>[0]['t'];

function buildApiResponse(overrides: Partial<Section129ScheduleApi> = {}): Section129ScheduleApi {
  return {
    propertyId: 549439,
    wardId: 1,
    baseTaxCode: 'General Tax',
    currentFinancialYear: '2026-27',
    upic: 'MM1100150000',
    oldGpNo: null,
    ownerName: 'The Holder',
    address: 'Address',
    useType: 'Residential',
    zone: 'Ward MM11',
    isApplied: true,
    assessmentYear: '2025',
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

describe('useSection129SaveActions', () => {
  const setForm = vi.fn();
  const setResult = vi.fn();
  const setIsSaving = vi.fn();
  const router = { refresh: vi.fn() } as unknown as Parameters<typeof useSection129SaveActions>[0]['router'];

  beforeEach(() => {
    vi.clearAllMocks();
    confirmMock.mockImplementation((payload: { onConfirm: () => void | Promise<void> }) => {
      void payload.onConfirm();
    });
  });

  function setup(overrides: Partial<Parameters<typeof useSection129SaveActions>[0]> = {}) {
    return renderHook(() =>
      useSection129SaveActions({
        propertyId: 549439,
        form: emptyForm(),
        result: emptyResult('2026-27'),
        changed: false,
        setForm,
        setResult,
        setIsSaving,
        t,
        router,
        ...overrides,
      })
    );
  }

  describe('handleSave', () => {
    it('errors when no property has been searched', () => {
      const { result } = setup({ propertyId: null });
      act(() => result.current.handleSave());
      expect(toast.error).toHaveBeenCalledWith('messages.propertyNotFound');
      expect(applySection129AAction).not.toHaveBeenCalled();
    });

    it('errors when a property change is flagged but the change date/details are missing', () => {
      const { result } = setup({ changed: true, form: { ...emptyForm(), changeDate: '', changeDetails: '' } });
      act(() => result.current.handleSave());
      expect(toast.error).toHaveBeenCalledWith('messages.changeDetailsRequired');
      expect(applySection129AAction).not.toHaveBeenCalled();
    });

    it('applies directly with no date validation (dates are ward-auto-fetched, not officer-entered)', async () => {
      vi.mocked(applySection129AAction).mockResolvedValue({ success: true, data: buildApiResponse() });
      const { result } = setup();
      await act(async () => {
        result.current.handleSave();
        await Promise.resolve();
      });
      expect(applySection129AAction).toHaveBeenCalledWith(
        549439,
        expect.objectContaining({ areaChanged: false, useChanged: false, otherStructuralChange: false })
      );
    });

    it('updates form/result state and shows a success toast on a successful apply', async () => {
      const apiResponse = buildApiResponse({ assessmentYear: '2026' });
      vi.mocked(applySection129AAction).mockResolvedValue({ success: true, data: apiResponse });
      const { result } = setup();

      await act(async () => {
        result.current.handleSave();
        await Promise.resolve();
      });

      expect(setResult).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('messages.caseSaved');
      expect(router.refresh).toHaveBeenCalled();
      expect(setIsSaving).toHaveBeenCalledWith(true);
      expect(setIsSaving).toHaveBeenCalledWith(false);
    });

    it('shows an error toast and does not update state when the apply call fails', async () => {
      vi.mocked(applySection129AAction).mockResolvedValue({ success: false, data: null, error: 'boom' });
      const { result } = setup();

      await act(async () => {
        result.current.handleSave();
        await Promise.resolve();
      });

      expect(toast.error).toHaveBeenCalledWith('boom');
      expect(setResult).not.toHaveBeenCalled();
    });
  });

  describe('handleRecalculate', () => {
    it('errors when no property has been searched', async () => {
      const { result } = setup({ propertyId: null });
      await act(async () => {
        await result.current.handleRecalculate();
      });
      expect(toast.error).toHaveBeenCalledWith('messages.propertyNotFound');
      expect(recalculateSection129AAction).not.toHaveBeenCalled();
    });

    it('sends the current Property-Change-Check facts and the OC-Date basis checkbox with the recalculate call', async () => {
      vi.mocked(recalculateSection129AAction).mockResolvedValue({ success: true, data: buildApiResponse() });
      const { result } = setup({
        changed: true,
        form: {
          ...emptyForm(),
          areaChanged: 'yes',
          changeDate: '2026-05-01',
          changeDetails: 'Extra floor added',
          useOcDateBasis: true,
        },
      });
      await act(async () => {
        await result.current.handleRecalculate();
      });
      expect(recalculateSection129AAction).toHaveBeenCalledWith(549439, {
        areaChanged: true,
        useChanged: false,
        otherStructuralChange: false,
        otherStructuralChangeEffectiveDate: '2026-05-01',
        changeDetailsRemark: 'Extra floor added',
        useOcDateBasis: true,
      });
    });

    it('blocks recalculation client-side when a change is flagged without a date or details', async () => {
      const { result } = setup({ changed: true, form: { ...emptyForm(), areaChanged: 'yes', changeDate: '', changeDetails: '' } });
      await act(async () => {
        await result.current.handleRecalculate();
      });
      expect(toast.error).toHaveBeenCalledWith('messages.changeDetailsRequired');
      expect(recalculateSection129AAction).not.toHaveBeenCalled();
      expect(confirmMock).not.toHaveBeenCalled();
    });

    it('always asks for confirmation, naming the year the rule was first applied from, before recalculating', async () => {
      vi.mocked(recalculateSection129AAction).mockResolvedValue({ success: true, data: buildApiResponse() });
      const { result } = setup({
        result: {
          ...emptyResult('2026-27'),
          rows: [
            { srNo: 1, financialYear: '2020-21', stage: 'Old GP Rate (Year 1)', municipalPctLabel: '—', stageTax: 0, oldGpTax: 1240, applicableTax: 1240, totalDemand: 1240, difference: 723, ruleApplied: 'Which is More: Old GP Tax', status: 'Completed' },
          ],
        },
      });
      await act(async () => {
        await result.current.handleRecalculate();
      });
      expect(confirmMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'messages.recalculateConfirmTitle',
          description: 'messages.recalculateConfirmDescription',
          confirmText: 'messages.recalculateConfirmYes',
          cancelText: 'messages.recalculateConfirmNo',
        })
      );
      // auto-confirmed by the mock, so the recalculation itself still proceeds
      expect(recalculateSection129AAction).toHaveBeenCalled();
    });

    it('does not recalculate when the officer declines the confirmation', async () => {
      confirmMock.mockImplementation(() => {
        // User clicked "No" — onConfirm is never invoked.
      });
      const { result } = setup();
      await act(async () => {
        await result.current.handleRecalculate();
      });
      expect(confirmMock).toHaveBeenCalled();
      expect(recalculateSection129AAction).not.toHaveBeenCalled();
    });

    it('shows the "basis not calculated" info toast when the API skipped recalculation for that reason', async () => {
      vi.mocked(recalculateSection129AAction).mockResolvedValue({
        success: true,
        data: buildApiResponse({ recalculateBlockedReason: 'BasisNotCalculated' }),
      });
      const { result } = setup();
      await act(async () => {
        await result.current.handleRecalculate();
      });
      expect(toast.info).toHaveBeenCalledWith('messages.recalculateBasisNotCalculated');
    });

    it('shows the normal success toast when recalculation genuinely ran', async () => {
      vi.mocked(recalculateSection129AAction).mockResolvedValue({
        success: true,
        data: buildApiResponse({ recalculateBlockedReason: null }),
      });
      const { result } = setup();
      await act(async () => {
        await result.current.handleRecalculate();
      });
      expect(toast.success).toHaveBeenCalledWith('messages.recalculated');
      expect(router.refresh).toHaveBeenCalled();
    });

    it('shows an error toast and does not update state when recalculation fails', async () => {
      vi.mocked(recalculateSection129AAction).mockResolvedValue({ success: false, data: null, error: 'nope' });
      const { result } = setup();
      await act(async () => {
        await result.current.handleRecalculate();
      });
      expect(toast.error).toHaveBeenCalledWith('nope');
      expect(setResult).not.toHaveBeenCalled();
    });
  });
});
