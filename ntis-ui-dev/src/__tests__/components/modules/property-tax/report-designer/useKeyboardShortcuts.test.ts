import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '@/hooks/reports/designer/useKeyboardShortcuts';

describe('useKeyboardShortcuts Hook', () => {
  it('triggers onUndo for Ctrl+Z', () => {
    const onUndo = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onUndo }));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it('triggers onRedo for Ctrl+Y and Ctrl+Shift+Z', () => {
    const onRedo = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onRedo }));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'y', ctrlKey: true }));
    expect(onRedo).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true }));
    expect(onRedo).toHaveBeenCalledTimes(2);
  });

  it('triggers onSave for Ctrl+S', () => {
    const onSave = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onSave }));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true }));
    expect(onSave).toHaveBeenCalledWith(false);
  });

  it('triggers onDelete for Delete key', () => {
    const onDelete = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onDelete }));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('triggers onNudge for arrow keys and shift modifier', () => {
    const onNudge = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onNudge }));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(onNudge).toHaveBeenCalledWith(1, 0);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', shiftKey: true }));
    expect(onNudge).toHaveBeenCalledWith(0, 10);
  });
});
