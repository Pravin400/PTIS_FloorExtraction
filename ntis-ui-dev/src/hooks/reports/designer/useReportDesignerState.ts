'use client';

import { useMemo, useState } from 'react';
import { type ClassicReportDefinition } from '@/lib/utils/reports/designer/classic-adapter';
import { findClassicElement } from '@/lib/utils/reports/designer/classic-model';
import { type DesignerReportListItem } from '@/lib/utils/reports/designer/designer-api';

type DesignerActivity = 'idle' | 'loading' | 'saving' | 'publishing' | 'error';

export function useReportDesignerState(defaultReportId?: string) {
  const [reports, setReports] = useState<DesignerReportListItem[]>([]);
  const [activeReportId, setActiveReportId] = useState(defaultReportId ?? '');
  const [definition, setDefinition] = useState<ClassicReportDefinition | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedCellKey, setSelectedCellKey] = useState<string | null>(null);
  const [selectedCellKeys, setSelectedCellKeys] = useState<string[]>([]);
  const [activity, setActivity] = useState<DesignerActivity>('loading');
  const [message, setMessage] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [past, setPast] = useState<ClassicReportDefinition[]>([]);
  const [future, setFuture] = useState<ClassicReportDefinition[]>([]);
  const [showGrid, setShowGrid] = useState(true);

  const selectedElement = useMemo(
    () => findClassicElement(definition, selectedElementId),
    [definition, selectedElementId]
  );

  const selectedSection = useMemo(
    () => definition?.sections.find((section) => section.id === selectedSectionId) ?? null,
    [definition, selectedSectionId]
  );

  return {
    reports,
    setReports,
    activeReportId,
    setActiveReportId,
    definition,
    setDefinition,
    selectedElementId,
    setSelectedElementId,
    selectedSectionId,
    setSelectedSectionId,
    selectedCellKey,
    setSelectedCellKey,
    selectedCellKeys,
    setSelectedCellKeys,
    activity,
    setActivity,
    message,
    setMessage,
    isDirty,
    setIsDirty,
    reloadToken,
    setReloadToken,
    past,
    setPast,
    future,
    setFuture,
    showGrid,
    setShowGrid,
    selectedElement,
    selectedSection,
  };
}

export type ReportDesignerState = ReturnType<typeof useReportDesignerState>;
