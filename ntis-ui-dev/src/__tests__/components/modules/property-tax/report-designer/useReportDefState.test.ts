import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReportDefState } from '@/hooks/reports/designer/useReportDefState';

describe('useReportDefState Hook', () => {
  it('initializes with default blank report', () => {
    const { result } = renderHook(() => useReportDefState());
    expect(result.current.reportDef.reportName).toBe('New Report');
    expect(result.current.reportDef.paperSize).toBe('A4');
    expect(result.current.reportDef.sections.length).toBe(3);
    expect(result.current.reportDef.elements.length).toBe(0);
  });

  it('adds and updates elements with undo and redo history', () => {
    const { result } = renderHook(() => useReportDefState());

    act(() => {
      result.current.addElement({
        id: 'el_1',
        type: 'text',
        x: 20,
        y: 30,
        width: 100,
        height: 40,
        text: 'Hello Thane',
      });
    });

    expect(result.current.reportDef.elements.length).toBe(1);
    expect(result.current.reportDef.elements[0].text).toBe('Hello Thane');

    act(() => {
      result.current.updateElement('el_1', { text: 'Updated Text' });
    });
    expect(result.current.reportDef.elements[0].text).toBe('Updated Text');

    // Undo update
    act(() => {
      result.current.undo();
    });
    expect(result.current.reportDef.elements[0].text).toBe('Hello Thane');

    // Redo update
    act(() => {
      result.current.redo();
    });
    expect(result.current.reportDef.elements[0].text).toBe('Updated Text');
  });

  it('duplicates and deletes elements', () => {
    const { result } = renderHook(() => useReportDefState());

    act(() => {
      result.current.addElement({
        id: 'el_dup',
        type: 'heading',
        x: 10,
        y: 10,
        width: 120,
        height: 30,
        text: 'Heading',
      });
    });

    expect(result.current.reportDef.elements.length).toBe(1);

    act(() => {
      result.current.duplicateElements(['el_dup']);
    });
    expect(result.current.reportDef.elements.length).toBe(2);

    act(() => {
      result.current.deleteElements(['el_dup']);
    });
    expect(result.current.reportDef.elements.length).toBe(1);
  });

  it('updates paper size and orientation', () => {
    const { result } = renderHook(() => useReportDefState());

    act(() => {
      result.current.setPaperSize('A3');
    });
    expect(result.current.reportDef.paperSize).toBe('A3');

    act(() => {
      result.current.setOrientation('portrait');
    });
    expect(result.current.reportDef.orientation).toBe('portrait');
  });
});
