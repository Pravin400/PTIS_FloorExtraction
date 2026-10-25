import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTaxZoningActions } from '@/hooks/taxZoning/useTaxZoningActions';

const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: mockRefresh }),
}));

const mockCreateTaxZoningAction = vi.fn();
const mockUpdateTaxZoningAction = vi.fn();
vi.mock('@/app/[locale]/property-tax/taxzone-master/taxzoning/actions', () => ({
  createTaxZoningAction: (...args: unknown[]) => mockCreateTaxZoningAction(...args),
  updateTaxZoningAction: (...args: unknown[]) => mockUpdateTaxZoningAction(...args),
}));

const mockToast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }));
vi.mock('sonner', () => ({ toast: mockToast }));

const t = (key: string) => key;

describe('useTaxZoningActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return saving=false initially', () => {
    const { result } = renderHook(() => useTaxZoningActions(t));
    expect(result.current.saving).toBe(false);
  });

  describe('handleUpdate - single ward', () => {
    it('should call updateTaxZoningAction for single ward', async () => {
      mockUpdateTaxZoningAction.mockResolvedValue({ success: true, message: 'messages.updateSuccess' });
      const { result } = renderHook(() => useTaxZoningActions(t));
      const onSuccess = vi.fn();

      await act(async () => {
        await result.current.handleUpdate({
          zone: '1',
          ward: ['89'],
          previewData: [{ taxZoneNo: '1', wardNo: 'W1', propertyNo: '10' }, { taxZoneNo: '1', wardNo: 'W1', propertyNo: '15' }],
          records: [],
          wardsData: { items: [], pageNumber: 1, pageSize: 10, totalCount: 0, totalPages: 1, hasPrevious: false, hasNext: false },
          onSuccess,
        });
      });

      expect(mockUpdateTaxZoningAction).toHaveBeenCalledWith(expect.objectContaining({
        taxZoneId: 1,
        wardId: 89,
        fromProperty: '10',
        toProperty: '15',
      }));
      expect(mockToast.success).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
    });

    it('should show error on failed update', async () => {
      mockUpdateTaxZoningAction.mockResolvedValue({ success: false, message: 'messages.updateFailed' });
      const { result } = renderHook(() => useTaxZoningActions(t));

      await act(async () => {
        await result.current.handleUpdate({
          zone: '1', ward: ['89'],
          previewData: [{ taxZoneNo: '1', wardNo: 'W1', propertyNo: '10' }],
          records: [], wardsData: { items: [], pageNumber: 1, pageSize: 10, totalCount: 0, totalPages: 1, hasPrevious: false, hasNext: false },
          onSuccess: vi.fn(),
        });
      });

      expect(mockToast.error).toHaveBeenCalled();
    });
  });

  describe('handleUpdate - multiple wards', () => {
    it('should update all wards', async () => {
      mockUpdateTaxZoningAction.mockResolvedValue({ success: true, message: 'ok' });
      const { result } = renderHook(() => useTaxZoningActions(t));

      await act(async () => {
        await result.current.handleUpdate({
          zone: '1', ward: ['1', '2'],
          previewData: [], records: [],
          wardsData: { items: [], pageNumber: 1, pageSize: 10, totalCount: 0, totalPages: 1, hasPrevious: false, hasNext: false },
          onSuccess: vi.fn(),
        });
      });

      expect(mockUpdateTaxZoningAction).toHaveBeenCalledTimes(2);
      expect(mockToast.success).toHaveBeenCalled();
    });
  });

  describe('handleBulkUpdate', () => {
    it('should show error for empty changes', async () => {
      const { result } = renderHook(() => useTaxZoningActions(t));
      await act(async () => {
        await result.current.handleBulkUpdate([], vi.fn());
      });
      expect(mockToast.error).toHaveBeenCalledWith('messages.noChanges');
    });

    it('should call updateTaxZoningAction for Updated records', async () => {
      mockUpdateTaxZoningAction.mockResolvedValue({ success: true, message: 'ok' });
      const { result } = renderHook(() => useTaxZoningActions(t));
      const clearFn = vi.fn();

      await act(async () => {
        await result.current.handleBulkUpdate([
          { taxZoneId: 2, wardId: 89, wardNo: 'W1', fromProperty: '3', toProperty: '3', status: 'Updated' },
        ], clearFn);
      });

      expect(mockUpdateTaxZoningAction).toHaveBeenCalledTimes(1);
      expect(mockCreateTaxZoningAction).not.toHaveBeenCalled();
      expect(mockToast.success).toHaveBeenCalled();
      expect(clearFn).toHaveBeenCalled();
    });

    it('should call createTaxZoningAction for New records', async () => {
      mockCreateTaxZoningAction.mockResolvedValue({ success: true, message: 'ok' });
      const { result } = renderHook(() => useTaxZoningActions(t));

      await act(async () => {
        await result.current.handleBulkUpdate([
          { taxZoneId: 1, wardId: 89, wardNo: 'W1', fromProperty: '50', toProperty: '60', status: 'New' },
        ], vi.fn());
      });

      expect(mockCreateTaxZoningAction).toHaveBeenCalledTimes(1);
      expect(mockUpdateTaxZoningAction).not.toHaveBeenCalled();
    });

    it('should show warning when some records fail', async () => {
      mockUpdateTaxZoningAction
        .mockResolvedValueOnce({ success: true, message: 'ok' })
        .mockResolvedValueOnce({ success: false, message: 'failed' });
      const { result } = renderHook(() => useTaxZoningActions(t));

      await act(async () => {
        await result.current.handleBulkUpdate([
          { taxZoneId: 2, wardId: 89, wardNo: 'W1', fromProperty: '3', toProperty: '3', status: 'Updated' },
          { taxZoneId: 3, wardId: 89, wardNo: 'W1', fromProperty: '5', toProperty: '5', status: 'Updated' },
        ], vi.fn());
      });

      expect(mockToast.warning).toHaveBeenCalled();
    });
  });
});
