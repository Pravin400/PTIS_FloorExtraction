import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCanvasInteractions } from '@/hooks/reports/designer/useCanvasInteractions';

describe('useCanvasInteractions Hook', () => {
  const elements = [
    { id: 'el_1', type: 'text', x: 20, y: 30, width: 100, height: 40 },
    { id: 'el_2', type: 'text', x: 150, y: 30, width: 80, height: 40 },
  ];

  it('handles element dragging and moves with grid snapping', () => {
    const onUpdate = vi.fn();
    const onSelect = vi.fn();

    const { result } = renderHook(() =>
      useCanvasInteractions(elements, onUpdate, onSelect)
    );

    act(() => {
      result.current.startDrag(elements[0], 20, 30);
    });

    expect(onSelect).toHaveBeenCalledWith('el_1');

    act(() => {
      result.current.handlePointerMove(32, 44);
    });

    expect(onUpdate).toHaveBeenCalledWith('el_1', { x: 30, y: 45 });

    act(() => {
      result.current.endDrag();
    });

    expect(result.current.isInteracting).toBe(false);
  });

  it('handles element resizing with handles (e.g. se)', () => {
    const onUpdate = vi.fn();
    const onSelect = vi.fn();

    const { result } = renderHook(() =>
      useCanvasInteractions(elements, onUpdate, onSelect)
    );

    act(() => {
      result.current.startDrag(elements[0], 120, 70, 'se');
    });

    act(() => {
      result.current.handlePointerMove(145, 95);
    });

    expect(onUpdate).toHaveBeenCalledWith(
      'el_1',
      expect.objectContaining({ width: 125, height: 65 })
    );
  });

  it('handles marquee selection', () => {
    const onSelectMultiple = vi.fn();

    const { result } = renderHook(() =>
      useCanvasInteractions(elements, vi.fn(), vi.fn(), onSelectMultiple)
    );

    act(() => {
      result.current.startMarquee(0, 0);
    });
    expect(result.current.marquee?.active).toBe(true);

    act(() => {
      result.current.handlePointerMove(130, 80);
    });

    act(() => {
      result.current.endDrag();
    });

    expect(onSelectMultiple).toHaveBeenCalledWith(['el_1']);
  });
});
