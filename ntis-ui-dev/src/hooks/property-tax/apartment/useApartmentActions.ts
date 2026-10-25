'use client';

import React from 'react';
import { AssessmentUnit, PtisPanelType } from '@/types/property-tax/apartment';

export function useApartmentActions(
  setSurveyUnits: React.Dispatch<React.SetStateAction<AssessmentUnit[]>>
) {
  const [hiddenPanels, setHiddenPanels] = React.useState<PtisPanelType[]>([]);
  const [hoveredUnitId, setHoveredUnitId] = React.useState<string | null>(null);
  const [expandedUnitIds, setExpandedUnitIds] = React.useState<string[]>([]);
  const [editingUnit, setEditingUnit] = React.useState<AssessmentUnit | null>(null);

  const toggleExpandRow = React.useCallback((id: string) => {
    setExpandedUnitIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const togglePanelVisibility = (panel: PtisPanelType) => {
    setHiddenPanels((prev) =>
      prev.includes(panel) ? prev.filter((p) => p !== panel) : [...prev, panel]
    );
  };

  const restoreAllPanels = () => setHiddenPanels([]);

  const handleUpdateUnit = (updated: AssessmentUnit) => {
    setSurveyUnits((prev) => (prev || []).map((u) => (u.id === updated.id ? updated : u)));
    setEditingUnit(null);
  };

  return {
    hiddenPanels,
    hoveredUnitId,
    expandedUnitIds,
    editingUnit,
    setHoveredUnitId,
    setEditingUnit,
    toggleExpandRow,
    togglePanelVisibility,
    restoreAllPanels,
    handleUpdateUnit,
  };
}
