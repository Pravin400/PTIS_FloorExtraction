import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useImageViewerZoom } from '@/hooks/ptis/photoplan/useImageViewerZoom';

describe('useImageViewerZoom', () => {
  const defaultProps = {
    src: '/test.jpg',
    rotation: 0,
  };

  it('initializes zoom level at scale 1, x 0, y 0', () => {
    const { result } = renderHook(() => useImageViewerZoom(defaultProps));

    expect(result.current.scale).toBe(1);
    expect(result.current.x).toBe(0);
    expect(result.current.y).toBe(0);
    expect(result.current.isDragging).toBe(false);
  });

  it('handles double click zoom toggle', () => {
    const { result } = renderHook(() => useImageViewerZoom(defaultProps));

    const mockEvent = {
      preventDefault: () => {},
      clientX: 100,
      clientY: 100,
    } as unknown as React.MouseEvent<HTMLDivElement>;

    act(() => {
      result.current.handleDoubleClick(mockEvent);
    });

    expect(result.current.scale).toBe(2);
  });
});
