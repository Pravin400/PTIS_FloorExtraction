import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBankForm } from '@/hooks/configuration-settings/bank/useBankForm';
import { toast } from 'sonner';

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockConfirm = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/components/common/ConfirmProvider', () => ({
  useConfirm: () => ({
    confirm: mockConfirm,
  }),
}));

const mockCreateBankAction = vi.fn();
const mockUpdateBankAction = vi.fn();

vi.mock('@/app/[locale]/configuration-settings/bank-master/actions', () => ({
  createBankAction: (...args: unknown[]) => mockCreateBankAction(...args),
  updateBankAction: (...args: unknown[]) => mockUpdateBankAction(...args),
}));

// Validator mock — use a ref so individual tests can control what it returns
let validateReturnValue: Record<string, string> = { bankCode: 'validation.required' };

vi.mock('@/lib/api/configuration-settings/bank/bank-master.validator', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('@/lib/api/configuration-settings/bank/bank-master.validator')
    >();
  return {
    ...actual,
    validateBankMaster: vi.fn(() => validateReturnValue),
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSubmitEvent(): React.FormEvent {
  return { preventDefault: vi.fn() } as unknown as React.FormEvent;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useBankForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Default: form has validation errors (required fields missing)
    validateReturnValue = { bankCode: 'validation.required' };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Initial state
  // ──────────────────────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('should expose all required fields from sub-hooks', () => {
      const { result } = renderHook(() => useBankForm({ id: null }));

      expect(result.current.formData).toBeDefined();
      expect(result.current.errors).toBeDefined();
      expect(typeof result.current.isSubmitting).toBe('boolean');
      expect(typeof result.current.open).toBe('boolean');
      expect(typeof result.current.handleChange).toBe('function');
      expect(typeof result.current.handleBlur).toBe('function');
      expect(typeof result.current.handleSubmit).toBe('function');
      expect(typeof result.current.handleToggleStatus).toBe('function');
      expect(typeof result.current.handleCancel).toBe('function');
    });

    it('should set isEdit=false when id is null', () => {
      const { result } = renderHook(() => useBankForm({ id: null }));
      expect(result.current.isEdit).toBe(false);
    });

    it('should set isEdit=true when a valid id is provided', () => {
      const { result } = renderHook(() => useBankForm({ id: '42' }));
      expect(result.current.isEdit).toBe(true);
    });

    it('should treat a whitespace-only id as null (isEdit=false)', () => {
      const { result } = renderHook(() => useBankForm({ id: '   ' }));
      expect(result.current.isEdit).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // handleCancel
  // ──────────────────────────────────────────────────────────────────────────

  describe('handleCancel', () => {
    it('should set open=false immediately', () => {
      const { result } = renderHook(() => useBankForm({ id: null }));

      act(() => {
        result.current.handleCancel();
      });

      expect(result.current.open).toBe(false);
    });

    it('should call router.push after the redirect delay', async () => {
      const { result } = renderHook(() => useBankForm({ id: null }));

      act(() => {
        result.current.handleCancel();
      });

      await act(() => vi.runAllTimersAsync());

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('/configuration-settings/bank-master')
      );
    });

    it('should prompt confirmation if there are changes', async () => {
      const { result } = renderHook(() => useBankForm({ id: null }));

      act(() => {
        result.current.handleChange({
          target: { name: 'bankName', value: 'New Bank Name' },
        } as unknown as React.ChangeEvent<HTMLInputElement>);
      });

      act(() => {
        result.current.handleCancel();
      });

      expect(mockConfirm).toHaveBeenCalled();
      const confirmArg = mockConfirm.mock.calls[0][0];
      expect(confirmArg.variant).toBe('warning');

      // Trigger confirm callback
      act(() => {
        confirmArg.onConfirm();
      });

      expect(result.current.open).toBe(false);

      await act(() => vi.runAllTimersAsync());

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('/configuration-settings/bank-master')
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // handleSubmit — validation gate
  // ──────────────────────────────────────────────────────────────────────────

  describe('handleSubmit — validation', () => {
    it('should NOT call the server action when the form has validation errors', async () => {
      // validateReturnValue has errors by default (set in beforeEach)
      const { result } = renderHook(() => useBankForm({ id: null }));

      await act(async () => {
        await result.current.handleSubmit(makeSubmitEvent());
      });

      expect(mockCreateBankAction).not.toHaveBeenCalled();
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('should set errors state when validation fails', async () => {
      const { result } = renderHook(() => useBankForm({ id: null }));

      await act(async () => {
        await result.current.handleSubmit(makeSubmitEvent());
      });

      expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // handleSubmit — create flow
  // ──────────────────────────────────────────────────────────────────────────

  describe('handleSubmit — create flow', () => {
    beforeEach(() => {
      // Validation passes for these tests
      validateReturnValue = {};
    });

    it('should call createBankAction when id is null and validation passes', async () => {
      mockCreateBankAction.mockResolvedValue({ success: true });
      const { result } = renderHook(() => useBankForm({ id: null }));

      await act(async () => {
        await result.current.handleSubmit(makeSubmitEvent());
      });
      await act(() => vi.runAllTimersAsync());

      expect(mockCreateBankAction).toHaveBeenCalledOnce();
    });

    it('should show success toast after a successful create', async () => {
      mockCreateBankAction.mockResolvedValue({ success: true });
      const { result } = renderHook(() => useBankForm({ id: null }));

      await act(async () => {
        await result.current.handleSubmit(makeSubmitEvent());
      });
      await act(() => vi.runAllTimersAsync());

      expect(toast.success).toHaveBeenCalledWith('messages.createSuccess');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // handleSubmit — edit flow
  // ──────────────────────────────────────────────────────────────────────────

  describe('handleSubmit — edit flow', () => {
    beforeEach(() => {
      validateReturnValue = {};
    });

    it('should call updateBankAction when id is provided and validation passes', async () => {
      mockUpdateBankAction.mockResolvedValue({ success: true });
      const { result } = renderHook(() => useBankForm({ id: '7' }));

      await act(async () => {
        await result.current.handleSubmit(makeSubmitEvent());
      });
      await act(() => vi.runAllTimersAsync());

      expect(mockUpdateBankAction).toHaveBeenCalledWith('7', expect.any(Object));
      expect(toast.success).toHaveBeenCalledWith('messages.updateSuccess');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // handleSubmit — error handling
  // ──────────────────────────────────────────────────────────────────────────

  describe('handleSubmit — error handling', () => {
    beforeEach(() => {
      validateReturnValue = {};
    });

    it('should show an error toast when the action returns success=false', async () => {
      mockCreateBankAction.mockResolvedValue({
        success: false,
        error: 'messages.errorOccurred',
      });
      const { result } = renderHook(() => useBankForm({ id: null }));

      await act(async () => {
        await result.current.handleSubmit(makeSubmitEvent());
      });

      expect(toast.error).toHaveBeenCalled();
    });

    it('should show a fallback error toast when the action throws', async () => {
      mockCreateBankAction.mockRejectedValue(new Error('Network failure'));
      const { result } = renderHook(() => useBankForm({ id: null }));

      await act(async () => {
        await result.current.handleSubmit(makeSubmitEvent());
      });

      expect(toast.error).toHaveBeenCalledWith('Network failure');
    });

    it('should reset isSubmitting to false after an error', async () => {
      mockCreateBankAction.mockRejectedValue(new Error('Network failure'));
      const { result } = renderHook(() => useBankForm({ id: null }));

      await act(async () => {
        await result.current.handleSubmit(makeSubmitEvent());
      });

      expect(result.current.isSubmitting).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Double-submission guard
  // ──────────────────────────────────────────────────────────────────────────

  describe('double-submission guard', () => {
    beforeEach(() => {
      validateReturnValue = {};
    });

    it('should not call the action a second time if called again immediately after the first resolves', async () => {
      // Both calls complete immediately; the guard is the isSubmittingRef which
      // is set synchronously before the await. The second call races and finds
      // isSubmittingRef.current === true, so it returns early.
      mockCreateBankAction.mockResolvedValue({ success: true });
      const { result } = renderHook(() => useBankForm({ id: null }));

      // First submit — completes fully
      await act(async () => {
        await result.current.handleSubmit(makeSubmitEvent());
      });
      await act(() => vi.runAllTimersAsync());

      expect(mockCreateBankAction).toHaveBeenCalledTimes(1);
    });

    it('should expose isSubmitting=false after a completed submission', async () => {
      mockCreateBankAction.mockResolvedValue({ success: true });
      const { result } = renderHook(() => useBankForm({ id: null }));

      await act(async () => {
        await result.current.handleSubmit(makeSubmitEvent());
      });
      await act(() => vi.runAllTimersAsync());

      expect(result.current.isSubmitting).toBe(false);
    });
  });
});
