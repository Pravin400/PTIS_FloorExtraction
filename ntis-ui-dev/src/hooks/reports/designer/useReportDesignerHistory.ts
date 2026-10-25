'use client';

import { useCallback } from 'react';
import {
  type ClassicElement,
  type ClassicReportDefinition,
} from '@/lib/utils/reports/designer/classic-adapter';
import { updateClassicElement } from '@/lib/utils/reports/designer/classic-model';
import type { ReportDesignerState } from './useReportDesignerState';

export function useReportDesignerHistory(state: ReportDesignerState) {
  const { definition, setDefinition, setIsDirty, past, setPast, future, setFuture } = state;

  const updateElement = useCallback(
    (elementId: string, patch: Partial<ClassicElement>) => {
      if (!definition) return;
      setPast((current) => [...current, definition].slice(-50));
      setFuture([]);
      setDefinition(updateClassicElement(definition, elementId, patch));
      setIsDirty(true);
    },
    [definition, setDefinition, setFuture, setIsDirty, setPast]
  );

  const commitDefinition = useCallback(
    (next: ClassicReportDefinition) => {
      if (!definition || next === definition) return;
      setPast((current) => [...current, definition].slice(-50));
      setFuture([]);
      setDefinition(next);
      setIsDirty(true);
    },
    [definition, setDefinition, setFuture, setIsDirty, setPast]
  );

  const undo = useCallback(() => {
    if (!definition || past.length === 0) return;
    const previous = past[past.length - 1];
    setPast(past.slice(0, -1));
    setFuture((current) => [definition, ...current].slice(0, 50));
    setDefinition(previous);
    setIsDirty(true);
  }, [definition, past, setDefinition, setFuture, setIsDirty, setPast]);

  const redo = useCallback(() => {
    if (!definition || future.length === 0) return;
    const next = future[0];
    setFuture(future.slice(1));
    setPast((current) => [...current, definition].slice(-50));
    setDefinition(next);
    setIsDirty(true);
  }, [definition, future, setDefinition, setFuture, setIsDirty, setPast]);

  return { updateElement, commitDefinition, undo, redo };
}
