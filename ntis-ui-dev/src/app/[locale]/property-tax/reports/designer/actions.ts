'use server';

import { cookies } from 'next/headers';
import type { ClassicReportDefinition } from '@/lib/utils/reports/designer/classic-adapter';
import type { DesignerReportSettings } from '@/types/report-designer.types';
import { reportResult, type ReportServiceResult } from '@/lib/api/property-tax/reports/report-service-result';
import {
  listDesignerReportsServer, loadDesignerReportServer, saveDesignerReportServer,
  loadDesignerSettingsServer, updateDesignerSettingsServer, loadDesignerColumnsServer,
  loadDesignerParametersServer, resetDesignerReportServer, checkDesignerReferenceServer,
  loadDesignerPreviewDataServer,
  deleteDesignerReportServer,
} from '@/lib/api/property-tax/reports/report-designer.service';
import { getDesignerImportOptionsServer } from '@/lib/api/property-tax/reports/report-import.service';

async function withSession(operation: () => Promise<ReportServiceResult>): Promise<ReportServiceResult> {
  if (!(await cookies()).get('auth_token')?.value) {
    return reportResult({ error: 'Sign in to use the report designer.' }, { status: 401 });
  }
  try {
    return await operation();
  } catch {
    return reportResult({ error: 'Report designer request could not be completed.' }, { status: 502 });
  }
}

export async function listDesignerReportsAction() {
  return withSession(() => listDesignerReportsServer());
}

export async function loadDesignerReportAction(reportId: string, templateId = '') {
  return withSession(() => loadDesignerReportServer(reportId, templateId));
}

export async function saveDesignerReportAction(reportId: string, definition: ClassicReportDefinition, publish: boolean) {
  return withSession(() => saveDesignerReportServer(reportId, definition, publish));
}

export async function loadDesignerSettingsAction(reportId: string) {
  return withSession(() => loadDesignerSettingsServer(reportId));
}

export async function updateDesignerSettingsAction(body: { templateId?: number; settings?: Partial<DesignerReportSettings> }) {
  return withSession(() => updateDesignerSettingsServer(body));
}

export async function loadDesignerColumnsAction(query: Record<string, string>) {
  return withSession(() => loadDesignerColumnsServer(query));
}

export async function loadDesignerParametersAction(reportId: string) {
  return withSession(() => loadDesignerParametersServer(reportId));
}

export async function resetDesignerReportAction(reportId: string) {
  return withSession(() => resetDesignerReportServer(reportId));
}

export async function checkDesignerReferenceAction(reportId: string) {
  return withSession(() => checkDesignerReferenceServer(reportId));
}

export async function loadDesignerPreviewDataAction(query: Record<string, string>) {
  return withSession(() => loadDesignerPreviewDataServer(query));
}

export async function getDesignerImportOptionsAction() {
  return withSession(() => getDesignerImportOptionsServer());
}

export async function deleteDesignerReportAction(templateId: number) {
  return withSession(() => deleteDesignerReportServer(templateId));
}
