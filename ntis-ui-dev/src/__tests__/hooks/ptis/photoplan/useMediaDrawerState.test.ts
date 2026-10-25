import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMediaDrawerState } from '@/hooks/ptis/photoplan/useMediaDrawerState';

describe('useMediaDrawerState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with drawer closed by default', () => {
    const { result } = renderHook(() => useMediaDrawerState());

    expect(result.current.isDrawerOpen).toBe(false);
    expect(result.current.drawerInitialCategoryIndex).toBe(0);
    expect(result.current.drawerType).toBeNull();
  });

  it('opens drawer on-demand when openDrawer is called', () => {
    const { result } = renderHook(() => useMediaDrawerState());

    act(() => {
      result.current.openDrawer(2, 0, undefined, 'front-photo');
    });

    expect(result.current.isDrawerOpen).toBe(true);
    expect(result.current.drawerInitialCategoryIndex).toBe(2);
    expect(result.current.drawerType).toBe('front-photo');
  });

  it('closes drawer and resets state when closeDrawer is called', () => {
    const { result } = renderHook(() => useMediaDrawerState());

    act(() => {
      result.current.openDrawer(1, 0, undefined, 'plan');
    });
    expect(result.current.isDrawerOpen).toBe(true);

    act(() => {
      result.current.closeDrawer();
    });

    expect(result.current.isDrawerOpen).toBe(false);
    expect(result.current.drawerType).toBeNull();
    expect(result.current.drawerInitialCategoryIndex).toBe(0);
  });
});
