'use client';

import { useState, useCallback } from 'react';
import { createDefaultTableStructure } from '@/lib/utils/reports/designer/editor-defaults';
import type { TableStructure, TableCellStyle } from '@/types/report-editor-state.types';
export { createDefaultTableStructure } from '@/lib/utils/reports/designer/editor-defaults';
export type { TableStructure, TableCell, TableCellStyle } from '@/types/report-editor-state.types';

export function useWordTableEditor(initialTable?: TableStructure) {
  const [table, setTable] = useState<TableStructure | null>(initialTable || null);
  const [hoverMatrix, setHoverMatrix] = useState<{ rows: number; cols: number }>({ rows: 1, cols: 1 });
  const [selectedCellKeys, setSelectedCellKeys] = useState<string[]>([]);

  const onMatrixHover = useCallback((rows: number, cols: number) => {
    setHoverMatrix({ rows: Math.min(8, Math.max(1, rows)), cols: Math.min(10, Math.max(1, cols)) });
  }, []);

  const createTable = useCallback((rows: number, cols: number, width?: number) => {
    const newTable = createDefaultTableStructure(rows, cols, width);
    setTable(newTable);
    return newTable;
  }, []);

  const selectCell = useCallback((key: string, multiSelect = false) => {
    setSelectedCellKeys(prev => {
      if (multiSelect) {
        return prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
      }
      return [key];
    });
  }, []);

  const updateCellContent = useCallback((key: string, content: string) => {
    setTable(prev => {
      if (!prev) return null;
      return {
        ...prev,
        cells: {
          ...prev.cells,
          [key]: {
            ...prev.cells[key],
            content,
          },
        },
      };
    });
  }, []);

  const updateCellStyle = useCallback((key: string, styleUpdates: Partial<TableCellStyle>) => {
    setTable(prev => {
      if (!prev) return null;
      return {
        ...prev,
        cells: {
          ...prev.cells,
          [key]: {
            ...prev.cells[key],
            style: {
              ...prev.cells[key]?.style,
              ...styleUpdates,
            },
          },
        },
      };
    });
  }, []);

  const applyStyleToSelectedCells = useCallback((styleUpdates: Partial<TableCellStyle>, targetKeys?: string[]) => {
    setTable(prev => {
      if (!prev) return null;
      const keysToUpdate = targetKeys || selectedCellKeys;
      const updatedCells = { ...prev.cells };
      keysToUpdate.forEach(k => {
        if (updatedCells[k]) {
          updatedCells[k] = {
            ...updatedCells[k],
            style: {
              ...updatedCells[k]?.style,
              ...styleUpdates,
            },
          };
        }
      });
      return { ...prev, cells: updatedCells };
    });
  }, [selectedCellKeys]);

  return {
    table,
    setTable,
    hoverMatrix,
    onMatrixHover,
    createTable,
    selectedCellKeys,
    selectCell,
    updateCellContent,
    updateCellStyle,
    applyStyleToSelectedCells,
  };
}
