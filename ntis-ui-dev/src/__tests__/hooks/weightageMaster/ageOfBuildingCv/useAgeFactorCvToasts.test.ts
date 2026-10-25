import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useAgeFactorCvToasts } from '@/hooks/weightageMaster/ageFactorCv/useAgeFactorCvToasts';

describe('useAgeFactorCvToasts', () => {
  it('should add and remove toasts', () => {
    const { result } = renderHook(() => useAgeFactorCvToasts());

    expect(result.current.toasts).toHaveLength(0);

    act(() => {
      result.current.addToast('success', 'Test message');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      type: 'success',
      message: 'Test message',
    });

    const toastId = result.current.toasts[0].id;

    act(() => {
      result.current.removeToast(toastId);
    });

    expect(result.current.toasts).toHaveLength(0);
  });
});
