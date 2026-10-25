'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  editorReducer,
  initialEditor,
  readDefinition,
  updateGeometry,
} from '@/lib/utils/reports/designer/editor-model';
import {
  listDesignerReports,
  loadDesignerReport,
  reportDesignerApi,
  saveDesignerReport,
  type DesignerReportListItem,
} from '@/lib/utils/reports/designer/designer-api';
import type {
  ClassicElement,
  ClassicReportDefinition,
} from '@/lib/utils/reports/designer/classic-adapter';
import type { DesignerFieldCatalogEntry } from '@/types/report-designer.types';

export function useReportEditor(defaultReportId?: string, initialDefinition?: ClassicReportDefinition | null) {
  const serverDefinition = useMemo(
    () => initialDefinition ? readDefinition(initialDefinition) : undefined,
    [initialDefinition],
  );
  const [state, dispatch] = useReducer(editorReducer, serverDefinition, initialEditor);
  const [reports, setReports] = useState<DesignerReportListItem[]>([]);
  const [fields, setFields] = useState<DesignerFieldCatalogEntry[]>(serverDefinition?.fieldCatalog || []);
  const [busy, setBusy] = useState(!serverDefinition);
  const [message, setMessage] = useState('');
  const stateRef = useRef(state);
  useLayoutEffect(() => {
    stateRef.current = state;
  }, [state]);
  const mounted = useRef(false);
  const loadController = useRef<AbortController | null>(null);
  const saving = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      loadController.current?.abort();
    };
  }, []);

  const change = useCallback(
    (
      update: (definition: ClassicReportDefinition) => ClassicReportDefinition,
      checkpoint = true
    ) => {
      dispatch({ type: 'change', definition: update(stateRef.current.definition), checkpoint });
    },
    []
  );
  const updateElements = useCallback(
    (
      ids: string[],
      updates: Partial<ClassicElement> | ((element: ClassicElement) => Partial<ClassicElement>),
      checkpoint = true
    ) => {
      change(
        (def) => ({
          ...def,
          elements: def.elements.map((e) =>
            ids.includes(e.id)
              ? updateGeometry(e, typeof updates === 'function' ? updates(e) : updates)
              : e
          ),
        }),
        checkpoint
      );
    },
    [change]
  );

  const loadFields = useCallback(async (
    definition: ClassicReportDefinition,
    id: string,
    signal: AbortSignal,
  ) => {
    const response = await reportDesignerApi.loadColumns({
      reportId: definition.reportCode || id,
      templateId: String(definition.ntis?.templateId || ''),
      dataProvider: definition.ntis?.dataProviderCode || '',
      dataSource: definition.ntis?.dataSourceCode || '',
    }, { signal });
    if (signal.aborted || !mounted.current) return;
    if (!response.ok)
      throw new Error('Report loaded, but the data-field schema could not be loaded.');
    const data = (await response.json()) as { columns?: DesignerFieldCatalogEntry[] };
    if (!signal.aborted && mounted.current)
      setFields(data.columns || definition.fieldCatalog || []);
  }, []);

  const load = useCallback(async (id: string) => {
    loadController.current?.abort();
    const controller = new AbortController();
    loadController.current = controller;
    setBusy(true);
    setMessage('');
    try {
      const definition = readDefinition(await loadDesignerReport(id, controller.signal));
      if (controller.signal.aborted || !mounted.current) return;
      dispatch({ type: 'load', definition });
      setFields(definition.fieldCatalog || []);
      await loadFields(definition, id, controller.signal);
    } catch (error) {
      if (!controller.signal.aborted && mounted.current)
        setMessage(error instanceof Error ? error.message : 'Report could not be loaded.');
    } finally {
      if (!controller.signal.aborted && mounted.current) setBusy(false);
    }
  }, [loadFields]);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    const items = await listDesignerReports(signal);
    if (mounted.current && !signal?.aborted) setReports(items);
    return items;
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    if (serverDefinition) {
      loadController.current = controller;
    }
    refresh(controller.signal)
      .then(async (items) => {
        if (controller.signal.aborted) return;
        if (serverDefinition) {
          await loadFields(serverDefinition, serverDefinition.reportCode, controller.signal);
          return;
        }
        const requested =
          defaultReportId || new URLSearchParams(window.location.search).get('reportId');
        const report = items.find(
          (r) =>
            r.id === requested || r.reportCode === requested || String(r.templateId) === requested
        );
        if (requested && !report) {
          setMessage('The requested report was not found.');
          setBusy(false);
          return;
        }
        if (report || (!requested && items[0])) await load((report || items[0]).id);
        else setBusy(false);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setMessage(error.message);
          setBusy(false);
        }
      });
    return () => {
      controller.abort();
      loadController.current?.abort();
    };
  }, [defaultReportId, load, loadFields, refresh, serverDefinition]);

  const save = useCallback(async (publish = false) => {
    if (busy || saving.current || !mounted.current) return false;
    saving.current = true;
    setBusy(true);
    setMessage('');
    const definition = stateRef.current.definition;
    try {
      const result = await saveDesignerReport(
        definition.reportId || definition.reportCode,
        definition,
        publish
      );
      if (!result.success) throw new Error(result.error || result.message || 'Save failed.');
      if (mounted.current) {
        dispatch({ type: 'saved', definition, metadata: { layoutVersion: result.layoutVersion ?? definition.layoutVersion, ntis: { ...definition.ntis!, templateId: result.templateId ?? definition.ntis?.templateId, reportDefinitionId: result.reportDefinitionId ?? definition.ntis?.reportDefinitionId, versionId: result.versionId ?? definition.ntis?.versionId, status: result.status || (publish ? 'Published' : 'Draft') } } });
        setMessage(publish ? 'Report published.' : 'Draft saved.');
      }
      return true;
    } catch (error) {
      if (mounted.current) setMessage(error instanceof Error ? error.message : 'Save failed.');
      return false;
    } finally {
      saving.current = false;
      if (mounted.current) setBusy(false);
    }
  }, [busy]);

  return {
    state,
    dispatch,
    change,
    updateElements,
    reports,
    fields,
    busy,
    message,
    setMessage,
    load,
    refresh,
    save,
  };
}
