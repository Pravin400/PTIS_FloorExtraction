'use client';

import { useCallback } from 'react';
import {
  designerTableAnchorKey,
  designerTableCellCoverage,
  designerTableRectangleKeys,
  findClassicElement,
} from '@/lib/utils/reports/designer/classic-model';
import type { ReportDesignerState } from './useReportDesignerState';

export function useReportDesignerSelection(state: ReportDesignerState) {
  const {
    definition,
    setSelectedElementId,
    setSelectedSectionId,
    selectedCellKey,
    setSelectedCellKey,
    setSelectedCellKeys,
    selectedElement,
  } = state;

  const selectElement = useCallback(
    (elementId: string, sectionId: string) => {
      setSelectedElementId(elementId);
      setSelectedSectionId(sectionId);
      const elem = findClassicElement(definition, elementId);
      if (elem && (elem.designerType === 'table' || elem.type === 'table')) {
        setSelectedCellKey('0_0');
        setSelectedCellKeys(['0_0']);
      } else {
        setSelectedCellKey(null);
        setSelectedCellKeys([]);
      }
    },
    [
      definition,
      setSelectedCellKey,
      setSelectedCellKeys,
      setSelectedElementId,
      setSelectedSectionId,
    ]
  );

  const selectCell = useCallback(
    (cellKey: string, mode: 'replace' | 'range' | 'toggle' = 'replace') => {
      const table = selectedElement?.table;
      if (!table || !table.cells[cellKey]) return;
      const anchorKey = designerTableAnchorKey(table, cellKey);
      const coverage = designerTableCellCoverage(table, anchorKey);

      if (mode === 'range' && selectedCellKey) {
        setSelectedCellKeys(
          designerTableRectangleKeys(selectedCellKey, anchorKey).filter((key) =>
            Boolean(table.cells[key])
          )
        );
      } else if (mode === 'toggle') {
        setSelectedCellKeys((current) => {
          const next = new Set(current);
          const removing = coverage.every((key) => next.has(key));
          coverage.forEach((key) => (removing ? next.delete(key) : next.add(key)));
          return next.size > 0 ? [...next] : coverage;
        });
      } else {
        setSelectedCellKeys(coverage.length > 0 ? coverage : [anchorKey]);
      }
      setSelectedCellKey(anchorKey);
    },
    [selectedCellKey, selectedElement, setSelectedCellKey, setSelectedCellKeys]
  );

  const selectSection = useCallback(
    (sectionId: string) => {
      setSelectedSectionId(sectionId);
      setSelectedElementId(null);
      setSelectedCellKey(null);
      setSelectedCellKeys([]);
    },
    [setSelectedCellKey, setSelectedCellKeys, setSelectedElementId, setSelectedSectionId]
  );

  return { selectElement, selectCell, selectSection };
}
