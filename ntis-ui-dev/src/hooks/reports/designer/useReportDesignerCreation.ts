'use client';

import { useCallback } from 'react';
import { createBlankClassicReportDefinition } from '@/lib/utils/reports/designer/classic-adapter';
import { updateClassicPageSetup } from '@/lib/utils/reports/designer/classic-model';
import { type DesignerReportListItem } from '@/lib/utils/reports/designer/designer-api';
import { openReportPreview } from '@/lib/utils/reports/designer/preview-report';
import type { ReportDesignerState } from './useReportDesignerState';

export function useReportDesignerCreation(state: ReportDesignerState) {
  const {
    setReports,
    setActiveReportId,
    definition,
    setDefinition,
    setSelectedElementId,
    setSelectedSectionId,
    setSelectedCellKey,
    setSelectedCellKeys,
    setActivity,
    setMessage,
    setIsDirty,
    setPast,
    setFuture,
    setShowGrid,
  } = state;

  const createReport = useCallback(
    (name: string, code: string, paperSize?: string, orientation?: 'portrait' | 'landscape') => {
      const base = createBlankClassicReportDefinition(code, name);
      const configured = updateClassicPageSetup(base, {
        paperSize: paperSize || 'A4',
        orientation: orientation || 'portrait',
      });
      setReports((current) => {
        const existingIndex = current.findIndex((r) => (r.reportCode || r.id) === code);
        const newItem: DesignerReportListItem = {
          id: code,
          reportCode: code,
          name,
          category: 'Property Tax',
          dataProviderCode: 'UnassignedReportDataProvider',
          tenantScoped: true,
          paperSize: paperSize || 'A4',
          orientation: orientation || 'portrait',
          templateId: null,
          canDelete: true,
        };
        if (existingIndex >= 0) {
          const next = [...current];
          next[existingIndex] = newItem;
          return next;
        }
        return [newItem, ...current];
      });
      setActiveReportId(code);
      setDefinition(configured);
      setSelectedElementId(null);
      setSelectedCellKey(null);
      setSelectedCellKeys([]);
      setSelectedSectionId(
        configured.sections.find((section) => section.visible !== false)?.id ?? null
      );
      setIsDirty(true);
      setPast([]);
      setFuture([]);
      setActivity('idle');
      setMessage('');
    },
    [
      setActiveReportId,
      setActivity,
      setDefinition,
      setFuture,
      setIsDirty,
      setMessage,
      setPast,
      setReports,
      setSelectedCellKey,
      setSelectedCellKeys,
      setSelectedElementId,
      setSelectedSectionId,
    ]
  );

  const toggleGrid = useCallback(() => {
    setShowGrid((current) => !current);
  }, [setShowGrid]);

  const preview = useCallback(() => {
    if (!definition) return;
    openReportPreview(definition);
  }, [definition]);

  return { createReport, toggleGrid, preview };
}
