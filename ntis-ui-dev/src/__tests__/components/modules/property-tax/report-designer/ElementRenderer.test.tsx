import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ElementRenderer } from '@/components/modules/property-tax/report-designer/canvas/ElementRenderer';

describe('ElementRenderer Component', () => {
  const sampleElement = {
    id: 'elem_header',
    type: 'heading',
    x: 50,
    y: 100,
    width: 200,
    height: 35,
    text: 'ठाणे महानगरपालिका',
    styles: {
      color: '#1e3a8a',
      fontSize: 16,
      fontWeight: 700,
      textAlign: 'center' as const,
    },
  };

  it('renders element with correct position, typography, and content', () => {
    const { container, getByText } = render(
      <ElementRenderer element={sampleElement} isSelected={false} onPointerDown={vi.fn()} />
    );

    expect(getByText('ठाणे महानगरपालिका')).toBeTruthy();
    const el = container.querySelector('[data-element-id="elem_header"]') as HTMLElement;
    expect(el.style.left).toBe('50px');
    expect(el.style.top).toBe('100px');
    expect(el.style.width).toBe('200px');
    expect(el.style.height).toBe('35px');
    expect(el.style.color).toBe('rgb(30, 58, 138)');
  });

  it('renders 8 resize handles when selected', () => {
    const { container } = render(
      <ElementRenderer element={sampleElement} isSelected={true} onPointerDown={vi.fn()} />
    );

    const handles = container.querySelectorAll('[data-handle]');
    expect(handles.length).toBe(8);
  });

  it('handles pointer down on element and on resize handle', () => {
    const onPointerDown = vi.fn();
    const { container } = render(
      <ElementRenderer element={sampleElement} isSelected={true} onPointerDown={onPointerDown} />
    );

    const mainBox = container.querySelector('[data-element-id="elem_header"]') as HTMLElement;
    fireEvent.pointerDown(mainBox);
    expect(onPointerDown).toHaveBeenCalledWith(expect.anything(), sampleElement);

    const seHandle = container.querySelector('[data-handle="se"]') as HTMLElement;
    fireEvent.pointerDown(seHandle);
    expect(onPointerDown).toHaveBeenCalledWith(expect.anything(), sampleElement, 'se');
  });
});
