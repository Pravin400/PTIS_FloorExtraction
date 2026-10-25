import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBankSearch } from '@/hooks/configuration-settings/bank/useBankSearch';

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}));

function makeStartTransition() {
  return vi.fn((cb: () => void) => cb());
}

describe('useBankSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockSearchParams = new URLSearchParams();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should derive search from URL searchParams', () => {
      mockSearchParams = new URLSearchParams('search=hdfc');
      const { result } = renderHook(() =>
        useBankSearch({ locale: 'en', startTransition: makeStartTransition() })
      );

      expect(result.current.currentSearchTerm).toBe('hdfc');
    });

    it('should default search to empty string when no URL param', () => {
      const { result } = renderHook(() =>
        useBankSearch({ locale: 'en', startTransition: makeStartTransition() })
      );

      expect(result.current.currentSearchTerm).toBe('');
    });
  });

  describe('handleSearchChange', () => {
    it('should update the local search state', () => {
      const { result } = renderHook(() =>
        useBankSearch({ locale: 'en', startTransition: makeStartTransition() })
      );

      act(() => {
        result.current.handleSearchChange('icici');
      });

      expect(result.current.search).toBe('icici');
    });

    it('should sanitize special characters from input', () => {
      const { result } = renderHook(() =>
        useBankSearch({ locale: 'en', startTransition: makeStartTransition() })
      );

      act(() => {
        // TEXT_SANITIZE strips characters like < > & etc.
        result.current.handleSearchChange('hdfc<script>');
      });

      // The sanitized value should not contain angle brackets
      expect(result.current.search).not.toContain('<');
      expect(result.current.search).not.toContain('>');
    });
  });

  describe('debounce behaviour', () => {
    it('should NOT call router.push before the debounce timer fires', () => {
      const startTransition = makeStartTransition();
      const { result } = renderHook(() => useBankSearch({ locale: 'en', startTransition }));

      act(() => {
        result.current.handleSearchChange('sbi');
      });

      // Timer has not fired yet
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should call router.push after the debounce timer (500 ms)', async () => {
      const startTransition = makeStartTransition();
      const { result } = renderHook(() => useBankSearch({ locale: 'en', startTransition }));

      act(() => {
        result.current.handleSearchChange('sbi');
      });

      // runAllTimersAsync drains all pending timers AND flushes microtasks,
      // so waitFor's internal setInterval polling works correctly.
      await act(() => vi.runAllTimersAsync());

      expect(mockPush).toHaveBeenCalledOnce();
      expect(mockPush.mock.calls[0][0]).toContain('search=sbi');
    });

    it('should debounce rapid keystrokes and only push the final value', async () => {
      const startTransition = makeStartTransition();
      const { result } = renderHook(() => useBankSearch({ locale: 'en', startTransition }));

      act(() => {
        result.current.handleSearchChange('s');
      });
      act(() => {
        result.current.handleSearchChange('sb');
      });
      act(() => {
        result.current.handleSearchChange('sbi');
      });

      await act(() => vi.runAllTimersAsync());

      // Only one push — the last value after debounce settles
      expect(mockPush).toHaveBeenCalledOnce();
      expect(mockPush.mock.calls[0][0]).toContain('search=sbi');
    });
  });
});
