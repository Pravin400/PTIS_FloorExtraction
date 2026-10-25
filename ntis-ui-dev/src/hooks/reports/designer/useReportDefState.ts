'use client';

import { useState, useCallback, useRef } from 'react';
import { calculatePageDimensions } from '@/lib/utils/reports/designer/report-math';
import { createBlankReportDefinition } from '@/lib/utils/reports/designer/editor-defaults';
import type { ReportDefinition, ReportElement } from '@/types/report-editor-state.types';
export { createBlankReportDefinition } from '@/lib/utils/reports/designer/editor-defaults';
export type { ReportDefinition, ReportElement, ReportElementStyles, ReportSection } from '@/types/report-editor-state.types';

export function useReportDefState(initialDef?: ReportDefinition) {
  const [reportDef, setReportDef] = useState<ReportDefinition>(
    () => initialDef || createBlankReportDefinition()
  );
  const [activeSectionId, setActiveSectionId] = useState<string>('details');
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // History Stack
  const historyRef = useRef<ReportDefinition[]>([reportDef]);
  const historyIndexRef = useRef<number>(0);

  const pushHistory = useCallback((newDef: ReportDefinition) => {
    const nextHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    nextHistory.push(JSON.parse(JSON.stringify(newDef)));
    if (nextHistory.length > 50) nextHistory.shift();
    historyRef.current = nextHistory;
    historyIndexRef.current = nextHistory.length - 1;
    setIsDirty(true);
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const prevDef = JSON.parse(JSON.stringify(historyRef.current[historyIndexRef.current]));
      setReportDef(prevDef);
      setSelectedElementIds([]);
    }
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const nextDef = JSON.parse(JSON.stringify(historyRef.current[historyIndexRef.current]));
      setReportDef(nextDef);
      setSelectedElementIds([]);
    }
  }, []);

  const setPaperSize = useCallback((size: string) => {
    setReportDef(prev => {
      const dims = calculatePageDimensions(size, prev.orientation || 'landscape');
      const updated: ReportDefinition = {
        ...prev,
        paperSize: size,
        widthMm: dims.widthMm,
        heightMm: dims.heightMm,
        pageWidth: dims.pageWidthPx,
        pageHeight: dims.pageHeightPx,
      };
      pushHistory(updated);
      return updated;
    });
  }, [pushHistory]);

  const setOrientation = useCallback((orientation: 'portrait' | 'landscape') => {
    setReportDef(prev => {
      const dims = calculatePageDimensions(prev.paperSize || 'A4', orientation);
      const updated: ReportDefinition = {
        ...prev,
        orientation,
        widthMm: dims.widthMm,
        heightMm: dims.heightMm,
        pageWidth: dims.pageWidthPx,
        pageHeight: dims.pageHeightPx,
      };
      pushHistory(updated);
      return updated;
    });
  }, [pushHistory]);

  const selectElement = useCallback((id: string, multiSelect = false) => {
    setSelectedElementIds(prev => {
      if (multiSelect) {
        return prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      }
      return [id];
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedElementIds([]);
  }, []);

  const addElement = useCallback((el: ReportElement) => {
    setReportDef(prev => {
      const updated: ReportDefinition = {
        ...prev,
        elements: [...prev.elements, el],
      };
      pushHistory(updated);
      return updated;
    });
    setSelectedElementIds([el.id]);
  }, [pushHistory]);

  const updateElement = useCallback((id: string, updates: Partial<ReportElement>) => {
    setReportDef(prev => {
      const updated: ReportDefinition = {
        ...prev,
        elements: prev.elements.map(el => (el.id === id ? { ...el, ...updates } : el)),
      };
      pushHistory(updated);
      return updated;
    });
  }, [pushHistory]);

  const deleteElements = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    setReportDef(prev => {
      const updated: ReportDefinition = {
        ...prev,
        elements: prev.elements.filter(el => !ids.includes(el.id)),
      };
      pushHistory(updated);
      return updated;
    });
    setSelectedElementIds([]);
  }, [pushHistory]);

  const duplicateElements = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    setReportDef(prev => {
      const duplicates: ReportElement[] = [];
      prev.elements.forEach(el => {
        if (ids.includes(el.id)) {
          duplicates.push({
            ...JSON.parse(JSON.stringify(el)),
            id: `el_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            x: el.x + 10,
            y: el.y + 10,
          });
        }
      });
      const updated: ReportDefinition = {
        ...prev,
        elements: [...prev.elements, ...duplicates],
      };
      pushHistory(updated);
      setSelectedElementIds(duplicates.map(d => d.id));
      return updated;
    });
  }, [pushHistory]);

  return {
    reportDef,
    setReportDef,
    activeSectionId,
    setActiveSectionId,
    selectedElementIds,
    setSelectedElementIds,
    selectElement,
    clearSelection,
    isDirty,
    undo,
    redo,
    setPaperSize,
    setOrientation,
    addElement,
    updateElement,
    deleteElements,
    duplicateElements,
    pushHistory,
  };
}
