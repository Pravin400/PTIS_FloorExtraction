'use client';

import { useCallback } from 'react';
import { type ClassicElement, type ClassicSection } from '@/lib/utils/reports/designer/classic-adapter';
import {
  appendClassicElement,
  appendClassicSection,
  bindClassicField,
  createClassicElement,
  createClassicSection,
  duplicateClassicElement,
  removeClassicElement,
  removeClassicSection,
  updateClassicSection,
  updateClassicElementStyles,
  updateClassicPageSetup,
  type CreatableDesignerBandType,
  type PageSetupOptions,
} from '@/lib/utils/reports/designer/classic-model';
import { type DesignerElementType } from '@/types/report-designer.types';
import type { ReportDesignerState } from './useReportDesignerState';
import type { useReportDesignerHistory } from './useReportDesignerHistory';

export function useReportDesignerEditing(
  state: ReportDesignerState,
  history: ReturnType<typeof useReportDesignerHistory>
) {
  const {
    definition,
    selectedElementId,
    setSelectedElementId,
    selectedSectionId,
    setSelectedSectionId,
    selectedCellKey,
    setSelectedCellKey,
    setSelectedCellKeys,
    selectedElement,
  } = state;
  const { commitDefinition, updateElement } = history;

  const updateSelectedElement = useCallback(
    (patch: Partial<ClassicElement>) => {
      if (!selectedElementId) return;
      updateElement(selectedElementId, patch);
    },
    [selectedElementId, updateElement]
  );

  const updateSelectedElementStyles = useCallback(
    (patch: Record<string, string | number>) => {
      if (!definition || !selectedElementId) return;
      commitDefinition(updateClassicElementStyles(definition, selectedElementId, patch));
    },
    [commitDefinition, definition, selectedElementId]
  );

  const updateSelectedSection = useCallback(
    (patch: Partial<ClassicSection>) => {
      if (!definition || !selectedSectionId) return;
      commitDefinition(updateClassicSection(definition, selectedSectionId, patch));
    },
    [commitDefinition, definition, selectedSectionId]
  );

  const addElement = useCallback(
    (type: DesignerElementType) => {
      if (!definition) return;
      const sectionId =
        selectedSectionId ?? definition.sections.find((section) => section.visible !== false)?.id;
      if (!sectionId) return;
      const element = createClassicElement(type, sectionId);
      commitDefinition(appendClassicElement(definition, element));
      setSelectedElementId(element.id);
      setSelectedSectionId(sectionId);
      if (type === 'table') {
        setSelectedCellKey('0_0');
        setSelectedCellKeys(['0_0']);
      } else {
        setSelectedCellKey(null);
        setSelectedCellKeys([]);
      }
    },
    [
      commitDefinition,
      definition,
      selectedSectionId,
      setSelectedCellKey,
      setSelectedCellKeys,
      setSelectedElementId,
      setSelectedSectionId,
    ]
  );

  const addSection = useCallback(
    (bandType: CreatableDesignerBandType, name: string) => {
      if (!definition) return;
      const section = createClassicSection(bandType, name);
      commitDefinition(appendClassicSection(definition, section));
      setSelectedSectionId(section.id);
      setSelectedElementId(null);
      setSelectedCellKey(null);
      setSelectedCellKeys([]);
    },
    [
      commitDefinition,
      definition,
      setSelectedCellKey,
      setSelectedCellKeys,
      setSelectedElementId,
      setSelectedSectionId,
    ]
  );

  const deleteSection = useCallback(
    (sectionId: string) => {
      if (!definition || definition.sections.length <= 1) return;
      const deletedIndex = definition.sections.findIndex((section) => section.id === sectionId);
      if (deletedIndex < 0) return;
      const next = removeClassicSection(definition, sectionId);
      commitDefinition(next);
      if (selectedSectionId === sectionId) {
        const fallbackIndex = Math.min(deletedIndex, next.sections.length - 1);
        setSelectedSectionId(next.sections[fallbackIndex]?.id ?? null);
        setSelectedElementId(null);
        setSelectedCellKey(null);
        setSelectedCellKeys([]);
      } else if (selectedElement?.sectionId === sectionId) {
        setSelectedElementId(null);
        setSelectedCellKey(null);
        setSelectedCellKeys([]);
      }
    },
    [
      commitDefinition,
      definition,
      selectedElement,
      selectedSectionId,
      setSelectedCellKey,
      setSelectedCellKeys,
      setSelectedElementId,
      setSelectedSectionId,
    ]
  );

  const bindField = useCallback(
    (fieldName: string) => {
      if (!definition) return;
      const sectionId =
        selectedSectionId ?? definition.sections.find((section) => section.visible !== false)?.id;
      if (!sectionId) return;
      const bound = bindClassicField(
        definition,
        fieldName,
        sectionId,
        selectedElementId,
        selectedCellKey
      );
      if (!bound.element) return;
      commitDefinition(bound.definition);
      setSelectedElementId(bound.element.id);
      setSelectedSectionId(bound.element.sectionId);
    },
    [
      commitDefinition,
      definition,
      selectedCellKey,
      selectedElementId,
      selectedSectionId,
      setSelectedElementId,
      setSelectedSectionId,
    ]
  );

  const deleteSelectedElement = useCallback(() => {
    if (!definition || !selectedElementId) return;
    commitDefinition(removeClassicElement(definition, selectedElementId));
    setSelectedElementId(null);
    setSelectedCellKey(null);
    setSelectedCellKeys([]);
  }, [
    commitDefinition,
    definition,
    selectedElementId,
    setSelectedCellKey,
    setSelectedCellKeys,
    setSelectedElementId,
  ]);

  const duplicateSelectedElement = useCallback(() => {
    if (!definition || !selectedElementId) return;
    const duplicated = duplicateClassicElement(definition, selectedElementId);
    if (!duplicated.element) return;
    commitDefinition(duplicated.definition);
    setSelectedElementId(duplicated.element.id);
    setSelectedSectionId(duplicated.element.sectionId);
    if (duplicated.element.designerType === 'table' || duplicated.element.type === 'table') {
      setSelectedCellKey('0_0');
      setSelectedCellKeys(['0_0']);
    } else {
      setSelectedCellKey(null);
      setSelectedCellKeys([]);
    }
  }, [
    commitDefinition,
    definition,
    selectedElementId,
    setSelectedCellKey,
    setSelectedCellKeys,
    setSelectedElementId,
    setSelectedSectionId,
  ]);

  const updatePageSetup = useCallback(
    (options: PageSetupOptions) => {
      if (!definition) return;
      commitDefinition(updateClassicPageSetup(definition, options));
    },
    [commitDefinition, definition]
  );

  return {
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
  };
}
