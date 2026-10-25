import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  MediaPanelProvider,
  useMediaPanel,
} from '@/hooks/ptis/photoplan/useMediaPanelVisibility';

describe('useMediaPanelVisibility', () => {
  it('provides visibility state and toggle functions via context', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MediaPanelProvider initialVisible={true}>{children}</MediaPanelProvider>
    );

    const { result } = renderHook(() => useMediaPanel(), { wrapper });

    expect(result.current.isPanelVisible).toBe(true);

    act(() => {
      result.current.togglePanel();
    });

    expect(result.current.isPanelVisible).toBe(false);

    act(() => {
      result.current.setIsPanelVisible(true);
    });

    expect(result.current.isPanelVisible).toBe(true);
  });

  it('defaults to false when syncWithCookie is false and initialVisible is false', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MediaPanelProvider initialVisible={false} syncWithCookie={false}>
        {children}
      </MediaPanelProvider>
    );

    const { result } = renderHook(() => useMediaPanel(), { wrapper });

    expect(result.current.isPanelVisible).toBe(false);

    act(() => {
      result.current.togglePanel();
    });

    expect(result.current.isPanelVisible).toBe(true);

    act(() => {
      result.current.setIsPanelVisible((prev) => !prev);
    });

    expect(result.current.isPanelVisible).toBe(false);
  });

  it('throws an error when useMediaPanel is used outside of a MediaPanelProvider', () => {
    expect(() => renderHook(() => useMediaPanel())).toThrow(
      'useMediaPanel must be used within a MediaPanelProvider'
    );
  });

  it('reads initial visibility from cookie when available and syncWithCookie is true', async () => {
    const cookieUtil = await import('@/lib/utils/cookie');
    const spy = vi.spyOn(cookieUtil, 'getMediaPanelVisibleFromCookie').mockReturnValue(true);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MediaPanelProvider initialVisible={false}>{children}</MediaPanelProvider>
    );

    const { result } = renderHook(() => useMediaPanel(), { wrapper });
    expect(result.current.isPanelVisible).toBe(true);
    spy.mockRestore();
  });
});
