'use client';

import { useEffect, useMemo, useState } from 'react';
import { reportDesignerApi } from '@/lib/utils/reports/designer/designer-api';
import type { ClassicReportDefinition } from '@/lib/utils/reports/designer/classic-adapter';
import {
  dataSourceForProvider,
  detectPdfPaper,
  detectReportImportMetadata,
  REPORT_IMPORT_ID_PATTERN,
  REPORT_IMPORT_MAX_BYTES,
  REPORT_IMPORT_MAX_SUBREPORTS,
} from '@/lib/utils/reports/import/client/import-client-model';
import { extractPdfLayout } from '@/lib/utils/reports/import/client/pdf-layout-client';
import type { PdfImportLayout } from '@/lib/utils/reports/import/build-imported-report';
import type { ReportDesignerCopy } from '@/types/report-designer-copy.types';
import type {
  DesignerDataSource,
  DesignerReportSettingsOptions,
} from '@/types/report-designer.types';

const EMPTY_OPTIONS: DesignerReportSettingsOptions = {
  currentTenantId: 0,
  modules: [],
  dataProviderCodes: [],
};

export interface ReportImportForm {
  reportId: string;
  reportName: string;
  moduleId: number | null;
  dataProviderCode: string;
  dataSourceCode: string;
  paperSize: string;
  orientation: 'portrait' | 'landscape';
}

export interface ReportImportResult {
  definition: ClassicReportDefinition;
  analysis: Record<string, unknown>;
}

interface ReportImportOptionsResponse {
  options: DesignerReportSettingsOptions;
  dataSources: DesignerDataSource[];
  error?: string;
}

interface ReportImportResponse {
  success?: boolean;
  definition?: ClassicReportDefinition;
  analysis?: Record<string, unknown>;
  error?: string;
}

const EMPTY_FORM: ReportImportForm = {
  reportId: '',
  reportName: '',
  moduleId: null,
  dataProviderCode: '',
  dataSourceCode: '',
  paperSize: 'A4',
  orientation: 'portrait',
};

function validFile(file: File, extension: string): boolean {
  return file.name.toLocaleLowerCase().endsWith(extension) && file.size <= REPORT_IMPORT_MAX_BYTES;
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

export function useReportImport(copy: ReportDesignerCopy['reportImport']) {
  const [options, setOptions] = useState(EMPTY_OPTIONS);
  const [dataSources, setDataSources] = useState<DesignerDataSource[]>([]);
  const [form, setForm] = useState<ReportImportForm>(EMPTY_FORM);
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [sourceType, setSourceType] = useState<'rpt' | 'pdf' | null>(null);
  const [referencePdf, setReferencePdf] = useState<File | null>(null);
  const [subreports, setSubreports] = useState<File[]>([]);
  const [pdfLayout, setPdfLayout] = useState<PdfImportLayout | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    reportDesignerApi.importOptions({ signal: controller.signal })
      .then(async (response) => {
        const value = (await response.json()) as ReportImportOptionsResponse;
        if (!response.ok) throw new Error(value.error || copy.optionsLoadFailed);
        if (controller.signal.aborted) return;
        setOptions(value.options ?? EMPTY_OPTIONS);
        setDataSources(Array.isArray(value.dataSources) ? value.dataSources : []);
        setError('');
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setError(reason instanceof Error ? reason.message : copy.optionsLoadFailed);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingOptions(false);
      });
    return () => controller.abort();
  }, [copy.optionsLoadFailed]);

  const providers = useMemo(() => {
    const result = new Set(options.dataProviderCodes.filter(Boolean));
    dataSources.forEach((source) => {
      if (source.executionReportCode) result.add(source.executionReportCode);
    });
    result.delete('UnassignedReportDataProvider');
    return [...result].sort();
  }, [dataSources, options.dataProviderCodes]);

  const updateForm = (patch: Partial<ReportImportForm>) => {
    setForm((current) => ({ ...current, ...patch }));
    setError('');
  };

  const selectMainFile = async (file: File | null) => {
    if (!file) return;
    const extension = file.name.toLocaleLowerCase().split('.').pop();
    if ((extension !== 'rpt' && extension !== 'pdf') || file.size > REPORT_IMPORT_MAX_BYTES) {
      setError(copy.invalidMainFile);
      return;
    }

    const detected = detectReportImportMetadata(file.name, options, dataSources);
    setMainFile(file);
    setSourceType(extension);
    setForm(detected);
    setError('');
    setProgress(extension === 'rpt' ? copy.rptDetected : copy.pdfAnalyzing);

    if (extension === 'rpt') {
      setPdfLayout(null);
      setAnalyzing(false);
      return;
    }

    setReferencePdf(null);
    setSubreports([]);
    setAnalyzing(true);
    try {
      const layout = await extractPdfLayout(file, setProgress);
      const detectedPaper = detectPdfPaper(layout.widthMm, layout.heightMm);
      setPdfLayout(layout);
      setForm((current) => ({ ...current, ...detectedPaper }));
      setProgress(
        layout.extractionMode === 'ocr'
          ? copy.ocrCompleted
          : layout.extractionMode === 'image'
            ? copy.imageFallback
            : copy.pdfAnalyzed
      );
    } catch (reason) {
      setPdfLayout(null);
      setError(reason instanceof Error ? reason.message : copy.pdfAnalysisFailed);
    } finally {
      setAnalyzing(false);
    }
  };

  const selectReferencePdf = (file: File | null) => {
    if (!file) return;
    if (!validFile(file, '.pdf')) {
      setError(copy.invalidPdfFile);
      return;
    }
    setReferencePdf(file);
    setError('');
  };

  const addSubreportFiles = (files: File[]) => {
    const invalid = files.some((file) => !validFile(file, '.rpt'));
    if (invalid) {
      setError(copy.invalidSubreportFile);
      return;
    }
    setSubreports((current) => {
      const unique = [...current];
      files.forEach((file) => {
        if (!unique.some((item) => item.name === file.name && item.size === file.size)) {
          unique.push(file);
        }
      });
      return unique.slice(0, REPORT_IMPORT_MAX_SUBREPORTS);
    });
    setError('');
  };

  const removeSubreport = (index: number) => {
    setSubreports((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const changeProvider = (dataProviderCode: string) => {
    updateForm({
      dataProviderCode,
      dataSourceCode: dataSourceForProvider(dataProviderCode, dataSources),
    });
  };

  const submitImport = async (): Promise<ReportImportResult | null> => {
    if (!mainFile || !sourceType) {
      setError(copy.mainFileRequired);
      return null;
    }
    if (!REPORT_IMPORT_ID_PATTERN.test(form.reportId.trim())) {
      setError(copy.reportIdInvalid);
      return null;
    }
    if (!form.reportName.trim()) {
      setError(copy.reportNameRequired);
      return null;
    }
    if (options.modules.length > 0 && form.moduleId == null) {
      setError(copy.moduleRequired);
      return null;
    }
    if (!form.dataProviderCode.trim()) {
      setError(copy.providerRequired);
      return null;
    }
    if (sourceType === 'pdf' && !pdfLayout) {
      setError(copy.pdfNotReady);
      return null;
    }

    const selectedModule = options.modules.find((item) => item.id === form.moduleId);
    const body = new FormData();
    body.append('reportId', form.reportId.trim());
    body.append('reportName', form.reportName.trim());
    body.append('moduleId', form.moduleId == null ? '' : String(form.moduleId));
    body.append('moduleName', selectedModule?.name || '');
    body.append('dataProviderCode', form.dataProviderCode.trim());
    body.append('dataSourceCode', form.dataSourceCode.trim());
    body.append('paperSize', form.paperSize);
    body.append('orientation', form.orientation);
    body.append('currentTenantId', String(options.currentTenantId || ''));
    if (sourceType === 'rpt') {
      body.append('rptFile', mainFile, mainFile.name);
      if (referencePdf) body.append('pdfFile', referencePdf, referencePdf.name);
      subreports.forEach((file) => body.append('subreports', file, file.name));
    } else {
      body.append('pdfFile', mainFile, mainFile.name);
      body.append('pdfLayout', JSON.stringify(pdfLayout));
    }

    setImporting(true);
    setError('');
    setProgress(copy.importingLayout);
    try {
      const response = await fetchWithTimeout(
        '/api/import-report',
        { method: 'POST', body },
        90_000
      );
      const value = (await response.json()) as ReportImportResponse;
      if (!response.ok || !value.success || !value.definition) {
        throw new Error(value.error || copy.importFailed);
      }
      setProgress(copy.importReady);
      return { definition: value.definition, analysis: value.analysis ?? {} };
    } catch (reason) {
      const message =
        reason instanceof DOMException && reason.name === 'AbortError'
          ? copy.importTimeout
          : reason instanceof Error
            ? reason.message
            : copy.importFailed;
      setError(message);
      return null;
    } finally {
      setImporting(false);
    }
  };

  return {
    options,
    dataSources,
    providers,
    form,
    mainFile,
    sourceType,
    referencePdf,
    subreports,
    pdfLayout,
    loadingOptions,
    analyzing,
    importing,
    progress,
    error,
    updateForm,
    selectMainFile,
    selectReferencePdf,
    addSubreportFiles,
    removeSubreport,
    changeProvider,
    submitImport,
  };
}
