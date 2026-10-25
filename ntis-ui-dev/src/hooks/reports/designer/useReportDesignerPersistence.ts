'use client';

import { useCallback } from 'react';
import { type ClassicReportDefinition } from '@/lib/utils/reports/designer/classic-adapter';
import {
  saveDesignerReport,
  updateDesignerReportSettings,
  type DesignerReportListItem,
} from '@/lib/utils/reports/designer/designer-api';
import { applyDesignerReportSettings } from '@/lib/utils/reports/designer/report-settings';
import { type DesignerReportSettings } from '@/types/report-designer.types';
import { type ReportDesignerCopy } from '@/types/report-designer-copy.types';
import type { ReportDesignerState } from './useReportDesignerState';

export function useReportDesignerPersistence(
  state: ReportDesignerState,
  messages: ReportDesignerCopy['messages']
) {
  const {
    setReports,
    activeReportId,
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
  } = state;

  const save = useCallback(
    async (publish: boolean) => {
      if (!definition || !activeReportId) return false;
      setActivity(publish ? 'publishing' : 'saving');
      setMessage('');
      try {
        const result = await saveDesignerReport(activeReportId, definition, publish);
        setDefinition((current) =>
          current
            ? {
                ...current,
                layoutVersion: result.layoutVersion ?? current.layoutVersion,
                ntis: {
                  ...(current.ntis ?? { dataSourceCode: 'UNASSIGNED' }),
                  ...(result.templateId ? { templateId: result.templateId } : {}),
                  ...(result.versionId ? { versionId: result.versionId } : {}),
                  ...(result.status ? { status: result.status } : {}),
                },
              }
            : current
        );
        setIsDirty(false);
        setActivity('idle');
        setMessage(publish ? messages.reportPublished : messages.draftSaved);
        return true;
      } catch {
        setActivity('error');
        setMessage(messages.saveFailed);
        return false;
      }
    },
    [
      activeReportId,
      definition,
      messages.draftSaved,
      messages.reportPublished,
      messages.saveFailed,
      setActivity,
      setDefinition,
      setIsDirty,
      setMessage,
    ]
  );

  const saveReportSettings = useCallback(
    async (settings: DesignerReportSettings) => {
      if (!definition || !activeReportId) return false;
      setActivity('saving');
      setMessage('');

      try {
        const existingTemplateId = definition.ntis?.templateId || settings.templateId || 0;
        let nextDefinition = applyDesignerReportSettings(definition, settings);
        let persistedSettings = settings;
        let result: Awaited<ReturnType<typeof saveDesignerReport>>;

        if (existingTemplateId) {
          persistedSettings = await updateDesignerReportSettings(existingTemplateId, {
            ...settings,
            templateId: existingTemplateId,
          });
          nextDefinition = applyDesignerReportSettings(nextDefinition, persistedSettings);
          result = await saveDesignerReport(activeReportId, nextDefinition, false);
        } else {
          result = await saveDesignerReport(activeReportId, nextDefinition, false);
          persistedSettings = {
            ...settings,
            templateId: result.templateId ?? settings.templateId,
            reportDefinitionId: result.reportDefinitionId ?? settings.reportDefinitionId,
          };
          nextDefinition = applyDesignerReportSettings(nextDefinition, persistedSettings);
        }

        nextDefinition = {
          ...nextDefinition,
          layoutVersion: result.layoutVersion ?? nextDefinition.layoutVersion,
          ntis: {
            ...(nextDefinition.ntis ?? { dataSourceCode: 'UNASSIGNED' }),
            ...(result.templateId ? { templateId: result.templateId } : {}),
            ...(result.reportDefinitionId ? { reportDefinitionId: result.reportDefinitionId } : {}),
            ...(result.versionId ? { versionId: result.versionId } : {}),
            ...(result.status ? { status: result.status } : {}),
          },
        };

        setDefinition(nextDefinition);
        setReports((current) =>
          current.map((report) =>
            (report.reportCode || report.id) === activeReportId
              ? {
                  ...report,
                  name: persistedSettings.reportName,
                  dataProviderCode: persistedSettings.dataProviderCode,
                  tenantScoped: persistedSettings.tenantScope === 'CurrentTenant',
                  templateId: result.templateId ?? report.templateId,
                }
              : report
          )
        );
        setIsDirty(false);
        setPast([]);
        setFuture([]);
        setActivity('idle');
        setMessage(messages.settingsSaved);
        return true;
      } catch {
        setActivity('error');
        setMessage(messages.settingsSaveFailed);
        return false;
      }
    },
    [
      activeReportId,
      definition,
      messages.settingsSaveFailed,
      messages.settingsSaved,
      setActivity,
      setDefinition,
      setFuture,
      setIsDirty,
      setMessage,
      setPast,
      setReports,
    ]
  );

  const importReport = useCallback(
    async (importedDefinition: ClassicReportDefinition) => {
      const reportId = importedDefinition.reportCode || importedDefinition.reportId;
      if (!reportId) return false;
      setActivity('saving');
      setMessage('');
      try {
        const result = await saveDesignerReport(reportId, importedDefinition, false);
        const persistedDefinition: ClassicReportDefinition = {
          ...importedDefinition,
          layoutVersion: result.layoutVersion ?? importedDefinition.layoutVersion,
          ntis: {
            ...(importedDefinition.ntis ?? { dataSourceCode: 'UNASSIGNED' }),
            ...(result.templateId ? { templateId: result.templateId } : {}),
            ...(result.reportDefinitionId ? { reportDefinitionId: result.reportDefinitionId } : {}),
            ...(result.versionId ? { versionId: result.versionId } : {}),
            ...(result.status ? { status: result.status } : {}),
          },
        };
        const item: DesignerReportListItem = {
          id: reportId,
          reportCode: reportId,
          name: persistedDefinition.reportName,
          category: persistedDefinition.ntis?.moduleName || 'Property Tax',
          dataProviderCode:
            persistedDefinition.ntis?.dataProviderCode || 'UnassignedReportDataProvider',
          tenantScoped: persistedDefinition.ntis?.tenantScope !== 'Global',
          paperSize: persistedDefinition.paperSize,
          orientation: persistedDefinition.orientation,
          templateId: result.templateId ?? persistedDefinition.ntis?.templateId ?? null,
          canDelete: true,
        };
        setReports((current) => {
          const index = current.findIndex(
            (report) => (report.reportCode || report.id) === reportId
          );
          if (index < 0) return [item, ...current];
          const next = [...current];
          next[index] = item;
          return next;
        });
        setActiveReportId(reportId);
        setDefinition(persistedDefinition);
        setSelectedElementId(null);
        setSelectedCellKey(null);
        setSelectedCellKeys([]);
        setSelectedSectionId(
          persistedDefinition.sections.find((section) => section.visible !== false)?.id ?? null
        );
        setPast([]);
        setFuture([]);
        setIsDirty(false);
        setActivity('idle');
        setMessage(messages.importSaved);
        return true;
      } catch {
        setActivity('error');
        setMessage(messages.importSaveFailed);
        return false;
      }
    },
    [
      messages.importSaveFailed,
      messages.importSaved,
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

  return { save, saveReportSettings, importReport };
}
