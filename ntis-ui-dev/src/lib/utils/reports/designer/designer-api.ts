import type { ClassicReportDefinition } from './classic-adapter';
import {
  listDesignerReportsAction, loadDesignerReportAction, saveDesignerReportAction,
  loadDesignerSettingsAction, updateDesignerSettingsAction, loadDesignerColumnsAction,
  loadDesignerParametersAction, resetDesignerReportAction, checkDesignerReferenceAction,
  getDesignerImportOptionsAction, deleteDesignerReportAction,
} from '@/app/[locale]/property-tax/reports/designer/actions';
import type { ReportServiceResult } from '@/lib/api/property-tax/reports/report-service-result';
import type {
  DesignerReportSettings,
  DesignerReportSettingsOptions,
} from '@/types/report-designer.types';

export interface DesignerReportListItem {
  id: string;
  reportCode: string;
  name: string;
  category: string;
  dataProviderCode: string;
  tenantScoped: boolean;
  dataSourceCode?: string;
  paperSize?: string;
  orientation?: string;
  templateId: number | null;
  canDelete: boolean;
}

interface DesignerReportListResponse {
  reports?: DesignerReportListItem[];
  error?: string;
}

export interface SaveDesignerReportResponse {
  success: boolean;
  message?: string;
  layoutVersion?: number;
  versionId?: number;
  templateId?: number;
  reportDefinitionId?: number;
  status?: string;
  error?: string;
}

export interface DesignerReportSettingsResponse {
  settings: DesignerReportSettings | null;
  options: DesignerReportSettingsOptions;
}

interface SaveDesignerReportSettingsResponse {
  success: boolean;
  settings: DesignerReportSettings;
}

async function responseJson<T>(response: Response): Promise<T> {
  const value = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(value.error || `Report designer request failed (HTTP ${response.status}).`);
  }
  return value;
}

export async function listDesignerReports(signal?: AbortSignal): Promise<DesignerReportListItem[]> {
  const response = await reportDesignerApi.listReports({ signal });
  const value = await responseJson<DesignerReportListResponse>(response);
  return Array.isArray(value.reports) ? value.reports : [];
}

export async function loadDesignerReport(
  reportId: string,
  signal?: AbortSignal
): Promise<ClassicReportDefinition> {
  const response = await reportDesignerApi.loadDesign(reportId, '', { signal });
  return responseJson<ClassicReportDefinition>(response);
}

export async function saveDesignerReport(
  reportId: string,
  definition: ClassicReportDefinition,
  publish: boolean
): Promise<SaveDesignerReportResponse> {
  const response = await reportDesignerApi.saveDesign(reportId, definition, publish);
  return responseJson<SaveDesignerReportResponse>(response);
}

export async function loadDesignerReportSettings(
  reportId: string,
  signal?: AbortSignal
): Promise<DesignerReportSettingsResponse> {
  const response = await reportDesignerApi.loadSettings(reportId, { signal });
  return responseJson<DesignerReportSettingsResponse>(response);
}

export async function updateDesignerReportSettings(
  templateId: number,
  settings: DesignerReportSettings
): Promise<DesignerReportSettings> {
  const response = await reportDesignerApi.updateSettings({ templateId, settings });
  const value = await responseJson<SaveDesignerReportSettingsResponse>(response);
  return value.settings;
}

// The React designer uses these compiled Next.js server action references.
export function actionResponse(operation: () => Promise<ReportServiceResult>, signal?: AbortSignal): Promise<Response> {
  if (signal?.aborted) return Promise.reject(new DOMException('Request aborted', 'AbortError'));
  return new Promise((resolve, reject) => {
    const abort = () => reject(new DOMException('Request aborted', 'AbortError'));
    signal?.addEventListener('abort', abort, { once: true });
    Promise.resolve().then(operation).then((result) => {
      if (!signal?.aborted) resolve(Response.json(result.data, { status: result.status }));
    }).catch(reject).finally(() => signal?.removeEventListener('abort', abort));
  });
}

type ActionOptions = { signal?: AbortSignal };

export const reportDesignerApi = {
  listReports: (options?: ActionOptions) => actionResponse(() => listDesignerReportsAction(), options?.signal),
  loadDesign: (reportId: string, templateId = '', options?: ActionOptions) =>
    actionResponse(() => loadDesignerReportAction(reportId, templateId), options?.signal),
  saveDesign: (reportId: string, definition: ClassicReportDefinition, publish: boolean, options?: ActionOptions) =>
    actionResponse(() => saveDesignerReportAction(reportId, definition, publish), options?.signal),
  deleteReport: (templateId: number) => actionResponse(() => deleteDesignerReportAction(templateId)),
  loadSettings: (reportId: string, options?: ActionOptions) => actionResponse(() => loadDesignerSettingsAction(reportId), options?.signal),
  updateSettings: (body: { templateId?: number; settings?: Partial<DesignerReportSettings> }) =>
    actionResponse(() => updateDesignerSettingsAction(body)),
  loadColumns: (query: Record<string, string>, options?: ActionOptions) => actionResponse(() => loadDesignerColumnsAction(query), options?.signal),
  loadParameters: (reportId: string) => actionResponse(() => loadDesignerParametersAction(reportId)),
  resetDesign: (reportId: string) => actionResponse(() => resetDesignerReportAction(reportId)),
  checkReference: (reportId: string) => actionResponse(() => checkDesignerReferenceAction(reportId)),
  importOptions: (options?: ActionOptions) => actionResponse(() => getDesignerImportOptionsAction(), options?.signal),
};
