import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTaxZoningRangeActions } from '@/hooks/taxZoningRange/useTaxZoningRangeActions';
import type { TaxZoningRangeFormModel, CreateTaxZoningRangePayload } from '@/types/taxZoningRange.types';

const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: mockRefresh }),
}));

const mockCreateTaxZoningRangeAction = vi.fn();
const mockUpdateTaxZoningRangeAction = vi.fn();
const mockBulkUpsertTaxZoningRangesAction = vi.fn();
vi.mock('@/app/[locale]/property-tax/taxzoningmaster/actions', () => ({
  createTaxZoningRangeAction: (...args: unknown[]) => mockCreateTaxZoningRangeAction(...args),
  updateTaxZoningRangeAction: (...args: unknown[]) => mockUpdateTaxZoningRangeAction(...args),
  bulkUpsertTaxZoningRangesAction: (...args: unknown[]) => mockBulkUpsertTaxZoningRangesAction(...args),
}));

const mockToast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }));
vi.mock('sonner', () => ({ toast: mockToast }));

const mockLoggerError = vi.hoisted(() => vi.fn());
vi.mock('@/lib/utils/logger', () => ({ logger: { error: mockLoggerError, warn: vi.fn(), info: vi.fn(), debug: vi.fn() } }));

const t = (key: string) => key;

const baseForm: TaxZoningRangeFormModel = {
  wardIds: [89],
  taxZoneId: 1,
  assignEntireWard: false,
  fromPropertyNo: '10',
  toPropertyNo: '20',
  zoneDescription: 'Some description',
};

describe('useTaxZoningRangeActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return saving=false initially', () => {
    const { result } = renderHook(() => useTaxZoningRangeActions(t));
    expect(result.current.saving).toBe(false);
  });

  describe('handleSave - create', () => {
    it('should call createTaxZoningRangeAction when form.id is absent', async () => {
      mockCreateTaxZoningRangeAction.mockResolvedValue({ success: true, data: [], message: 'messages.createSuccess' });
      const { result } = renderHook(() => useTaxZoningRangeActions(t));
      const onSuccess = vi.fn();

      let returned: boolean | undefined;
      await act(async () => {
        returned = await result.current.handleSave(baseForm, onSuccess);
      });

      expect(mockCreateTaxZoningRangeAction).toHaveBeenCalledWith({
        wardIds: [89],
        taxZoneId: 1,
        assignEntireWard: false,
        fromPropertyNo: '10',
        toPropertyNo: '20',
        zoneDescription: 'Some description',
      });
      expect(mockUpdateTaxZoningRangeAction).not.toHaveBeenCalled();
      expect(mockToast.success).toHaveBeenCalledWith('messages.createSuccess');
      expect(mockRefresh).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
      expect(returned).toBe(true);
    });

    it('should set assignEntireWard=true and clear property range fields for multi-ward', async () => {
      mockCreateTaxZoningRangeAction.mockResolvedValue({ success: true, data: [], message: 'ok' });
      const { result } = renderHook(() => useTaxZoningRangeActions(t));
      const multiWardForm: TaxZoningRangeFormModel = { ...baseForm, wardIds: [1, 2] };

      await act(async () => {
        await result.current.handleSave(multiWardForm, vi.fn());
      });

      expect(mockCreateTaxZoningRangeAction).toHaveBeenCalledWith({
        wardIds: [1, 2],
        taxZoneId: 1,
        assignEntireWard: true,
        fromPropertyNo: undefined,
        toPropertyNo: undefined,
        zoneDescription: 'Some description',
      });
    });
  });

  describe('handleSave - update', () => {
    it('should call updateTaxZoningRangeAction when form.id is present', async () => {
      mockUpdateTaxZoningRangeAction.mockResolvedValue({ success: true, data: {}, message: 'messages.updateSuccess' });
      const { result } = renderHook(() => useTaxZoningRangeActions(t));
      const onSuccess = vi.fn();
      const formWithId: TaxZoningRangeFormModel = { ...baseForm, id: 7 };

      await act(async () => {
        await result.current.handleSave(formWithId, onSuccess);
      });

      expect(mockUpdateTaxZoningRangeAction).toHaveBeenCalledWith(7, {
        wardId: 89,
        taxZoneId: 1,
        assignEntireWard: false,
        fromPropertyNo: '10',
        toPropertyNo: '20',
        zoneDescription: 'Some description',
      });
      expect(mockCreateTaxZoningRangeAction).not.toHaveBeenCalled();
      expect(mockToast.success).toHaveBeenCalledWith('messages.updateSuccess');
      expect(mockRefresh).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
    });

    it('should show toast.error and not call onSuccess on failure', async () => {
      mockUpdateTaxZoningRangeAction.mockResolvedValue({ success: false, error: 'messages.updateFailed' });
      const { result } = renderHook(() => useTaxZoningRangeActions(t));
      const onSuccess = vi.fn();
      const formWithId: TaxZoningRangeFormModel = { ...baseForm, id: 7 };

      let returned: boolean | undefined;
      await act(async () => {
        returned = await result.current.handleSave(formWithId, onSuccess);
      });

      expect(mockToast.error).toHaveBeenCalledWith('messages.updateFailed');
      expect(onSuccess).not.toHaveBeenCalled();
      expect(mockRefresh).not.toHaveBeenCalled();
      expect(returned).toBe(false);
    });

    it('should catch thrown errors, log them, and show a generic toast.error', async () => {
      const thrown = new Error('network down');
      mockUpdateTaxZoningRangeAction.mockRejectedValue(thrown);
      const { result } = renderHook(() => useTaxZoningRangeActions(t));
      const formWithId: TaxZoningRangeFormModel = { ...baseForm, id: 7 };

      let returned: boolean | undefined;
      await act(async () => {
        returned = await result.current.handleSave(formWithId, vi.fn());
      });

      expect(mockLoggerError).toHaveBeenCalledWith('Tax zoning range save failed', { error: thrown });
      expect(mockToast.error).toHaveBeenCalledWith('messages.somethingWrong');
      expect(returned).toBe(false);
    });
  });

  describe('handleBulkApply', () => {
    it('should show toast.error and return false for empty rows without calling the action', async () => {
      const { result } = renderHook(() => useTaxZoningRangeActions(t));

      let returned: boolean | undefined;
      await act(async () => {
        returned = await result.current.handleBulkApply([], vi.fn());
      });

      expect(mockToast.error).toHaveBeenCalledWith('messages.noChanges');
      expect(mockBulkUpsertTaxZoningRangesAction).not.toHaveBeenCalled();
      expect(returned).toBe(false);
    });

    const rows: CreateTaxZoningRangePayload[] = [
      { wardIds: [1], taxZoneId: 1, zoneDescription: 'desc one two three four' },
    ];

    it('should show toast.success when successCount>0 and failedCount===0', async () => {
      mockBulkUpsertTaxZoningRangesAction.mockResolvedValue({
        success: true,
        data: { successCount: 2, failedCount: 0, results: [], hasFailures: false, allSucceeded: true },
      });
      const { result } = renderHook(() => useTaxZoningRangeActions(t));
      const onSuccess = vi.fn();

      let returned: boolean | undefined;
      await act(async () => {
        returned = await result.current.handleBulkApply(rows, onSuccess);
      });

      expect(mockToast.success).toHaveBeenCalledWith('2 messages.recordsUpdatedSuccessfully');
      expect(mockRefresh).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
      expect(returned).toBe(true);
    });

    it('should show toast.warning when successCount>0 and failedCount>0', async () => {
      mockBulkUpsertTaxZoningRangesAction.mockResolvedValue({
        success: true,
        data: { successCount: 2, failedCount: 1, results: [], hasFailures: true, allSucceeded: false },
      });
      const { result } = renderHook(() => useTaxZoningRangeActions(t));

      let returned: boolean | undefined;
      await act(async () => {
        returned = await result.current.handleBulkApply(rows, vi.fn());
      });

      expect(mockToast.warning).toHaveBeenCalledWith(
        '2 messages.recordsUpdatedSuccessfully, 1 messages.recordsFailed'
      );
      expect(returned).toBe(true);
    });

    it('should show toast.error "noRecordsProcessed" and return false when successCount===0', async () => {
      mockBulkUpsertTaxZoningRangesAction.mockResolvedValue({
        success: true,
        data: { successCount: 0, failedCount: 3, results: [], hasFailures: true, allSucceeded: false },
      });
      const { result } = renderHook(() => useTaxZoningRangeActions(t));
      const onSuccess = vi.fn();

      let returned: boolean | undefined;
      await act(async () => {
        returned = await result.current.handleBulkApply(rows, onSuccess);
      });

      expect(mockToast.error).toHaveBeenCalledWith('messages.noRecordsProcessed');
      expect(onSuccess).not.toHaveBeenCalled();
      expect(mockRefresh).not.toHaveBeenCalled();
      expect(returned).toBe(false);
    });

    it('should show toast.error with the server error when the action fails', async () => {
      mockBulkUpsertTaxZoningRangesAction.mockResolvedValue({ success: false, error: 'boom' });
      const { result } = renderHook(() => useTaxZoningRangeActions(t));

      let returned: boolean | undefined;
      await act(async () => {
        returned = await result.current.handleBulkApply(rows, vi.fn());
      });

      expect(mockToast.error).toHaveBeenCalledWith('boom');
      expect(returned).toBe(false);
    });

    it('should catch thrown errors, log them, and show toast.error "criticalError"', async () => {
      const thrown = new Error('boom');
      mockBulkUpsertTaxZoningRangesAction.mockRejectedValue(thrown);
      const { result } = renderHook(() => useTaxZoningRangeActions(t));

      let returned: boolean | undefined;
      await act(async () => {
        returned = await result.current.handleBulkApply(rows, vi.fn());
      });

      expect(mockLoggerError).toHaveBeenCalledWith('Tax zoning range bulk apply failed', { error: thrown });
      expect(mockToast.error).toHaveBeenCalledWith('messages.criticalError');
      expect(returned).toBe(false);
    });
  });
});
