import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWordTableEditor, createDefaultTableStructure } from '@/hooks/reports/designer/useWordTableEditor';

describe('useWordTableEditor Hook', () => {
  it('creates default table structure with given rows and cols', () => {
    const table = createDefaultTableStructure(3, 4, 400);
    expect(table.rows).toBe(3);
    expect(table.cols).toBe(4);
    expect(table.columnWidths.length).toBe(4);
    expect(table.rowHeights.length).toBe(3);
    expect(table.cells['0_0'].content).toBe('R1C1');
    expect(table.cells['2_3'].content).toBe('R3C4');
  });

  it('updates cell content and cell style', () => {
    const { result } = renderHook(() => useWordTableEditor());

    act(() => {
      result.current.createTable(2, 2);
    });

    expect(result.current.table?.rows).toBe(2);

    act(() => {
      result.current.updateCellContent('0_0', 'Tax Rate');
    });

    expect(result.current.table?.cells['0_0'].content).toBe('Tax Rate');

    act(() => {
      result.current.selectCell('0_0');
    });

    act(() => {
      result.current.applyStyleToSelectedCells({ backgroundColor: '#eff6ff', fontWeight: 'bold' });
    });

    expect(result.current.table?.cells['0_0'].style?.backgroundColor).toBe('#eff6ff');
    expect(result.current.table?.cells['0_0'].style?.fontWeight).toBe('bold');
  });

  it('handles matrix hover clamping', () => {
    const { result } = renderHook(() => useWordTableEditor());

    act(() => {
      result.current.onMatrixHover(15, 20);
    });
    expect(result.current.hoverMatrix.rows).toBe(8);
    expect(result.current.hoverMatrix.cols).toBe(10);
  });
});
