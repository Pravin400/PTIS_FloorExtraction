'use client';

import type { ReportDesignerCopy } from '@/types/report-designer-copy.types';
import { useReportDesignerState } from './designer/useReportDesignerState';
import { useReportDesignerLoading } from './designer/useReportDesignerLoading';
import { useReportDesignerSelection } from './designer/useReportDesignerSelection';
import { useReportDesignerHistory } from './designer/useReportDesignerHistory';
import { useReportDesignerEditing } from './designer/useReportDesignerEditing';
import { useReportDesignerPersistence } from './designer/useReportDesignerPersistence';
import { useReportDesignerCreation } from './designer/useReportDesignerCreation';

export function useReportDesigner(
  messages: ReportDesignerCopy['messages'],
  defaultReportId?: string
) {
  const state = useReportDesignerState(defaultReportId);
  const {
    reports,
    activeReportId,
    definition,
    selectedElement,
    selectedSection,
    selectedElementId,
    selectedSectionId,
    selectedCellKey,
    selectedCellKeys,
    activity,
    message,
    isDirty,
    past,
    future,
    showGrid,
  } = state;
  const { selectReport, reload } = useReportDesignerLoading(state, messages, defaultReportId);
  const { selectElement, selectCell, selectSection } = useReportDesignerSelection(state);
  const history = useReportDesignerHistory(state);
  const { updateElement, undo, redo } = history;
  const {
    updateSelectedElement,
    updateSelectedElementStyles,
    updateSelectedSection,
    addElement,
    addSection,
    deleteSection,
    bindField,
    deleteSelectedElement,
    duplicateSelectedElement,
    updatePageSetup,
  } = useReportDesignerEditing(state, history);
  const { save, saveReportSettings, importReport } = useReportDesignerPersistence(state, messages);
  const { createReport, toggleGrid, preview } = useReportDesignerCreation(state);

  return {
    reports,
    activeReportId,
    definition,
    selectedElement,
    selectedSection,
    selectedElementId,
    selectedSectionId,
    selectedCellKey,
    selectedCellKeys,
    activity,
    message,
    isDirty,
    selectReport,
    selectElement,
    selectCell,
    selectSection,
    updateSelectedElement,
    updateSelectedElementStyles,
    updateSelectedSection,
    updateElement,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    undo,
    redo,
    addElement,
    addSection,
    deleteSection,
    bindField,
    deleteSelectedElement,
    duplicateSelectedElement,
    reload,
    save,
    showGrid,
    toggleGrid,
    updatePageSetup,
    createReport,
    importReport,
    saveReportSettings,
    preview,
  };
}
