'use client';

import { useCallback, useEffect } from 'react';
import { listDesignerReports, loadDesignerReport } from '@/lib/utils/reports/designer/designer-api';
import { type ReportDesignerCopy } from '@/types/report-designer-copy.types';
import type { ReportDesignerState } from './useReportDesignerState';

export function useReportDesignerLoading(
  state: ReportDesignerState,
  messages: ReportDesignerCopy['messages'],
  defaultReportId?: string
) {
  const {
    setReports,
    activeReportId,
    setActiveReportId,
    setDefinition,
    setSelectedElementId,
    setSelectedSectionId,
    setSelectedCellKey,
    setSelectedCellKeys,
    setActivity,
    setMessage,
    setIsDirty,
    reloadToken,
    setReloadToken,
    setPast,
    setFuture,
  } = state;

  useEffect(() => {
    const controller = new AbortController();
    listDesignerReports(controller.signal)
      .then((items) => {
        setReports(items);
        setActiveReportId((current) => current || items[0]?.reportCode || items[0]?.id || '');
        if (items.length === 0 && !defaultReportId) setActivity('idle');
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setActivity('error');
        setMessage(messages.reportsLoadFailed);
      });
    return () => controller.abort();
  }, [
    defaultReportId,
    messages.reportsLoadFailed,
    setActiveReportId,
    setActivity,
    setMessage,
    setReports,
  ]);

  useEffect(() => {
    if (!activeReportId) {
      return;
    }

    const controller = new AbortController();
    loadDesignerReport(activeReportId, controller.signal)
      .then((loaded) => {
        setDefinition(loaded);
        setSelectedElementId(null);
        setSelectedCellKey(null);
        setSelectedCellKeys([]);
        setSelectedSectionId(
          loaded.sections.find((section) => section.visible !== false)?.id ?? null
        );
        setIsDirty(false);
        setPast([]);
        setFuture([]);
        setActivity('idle');
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setDefinition(null);
        setActivity('error');
        setMessage(messages.designLoadFailed);
      });
    return () => controller.abort();
  }, [
    activeReportId,
    messages.designLoadFailed,
    reloadToken,
    setActivity,
    setDefinition,
    setFuture,
    setIsDirty,
    setMessage,
    setPast,
    setSelectedCellKey,
    setSelectedCellKeys,
    setSelectedElementId,
    setSelectedSectionId,
  ]);

  const reload = useCallback(() => {
    setActivity('loading');
    setMessage('');
    setReloadToken((value) => value + 1);
  }, [setActivity, setMessage, setReloadToken]);
  const selectReport = useCallback(
    (reportId: string) => {
      setActivity('loading');
      setMessage('');
      setDefinition(null);
      setActiveReportId(reportId);
      setSelectedElementId(null);
      setSelectedCellKey(null);
      setSelectedCellKeys([]);
      setSelectedSectionId(null);
    },
    [
      setActiveReportId,
      setActivity,
      setDefinition,
      setMessage,
      setSelectedCellKey,
      setSelectedCellKeys,
      setSelectedElementId,
      setSelectedSectionId,
    ]
  );

  return { selectReport, reload };
}
