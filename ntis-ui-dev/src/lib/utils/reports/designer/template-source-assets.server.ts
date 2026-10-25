import 'server-only';

import { apiClient } from '@/services/api.service';
import { latestDesignerTemplateVersion } from '@/lib/utils/reports/designer/template-version';
import type {
  DesignerSourceAsset,
  DesignerTemplate,
  DesignerTemplateDetail,
  DesignerTemplateSummary,
  DesignerTemplateVersion,
} from '@/types/report-designer.types';

const comparableCode = (value: string): string =>
  value.replace(/[^a-z0-9]/gi, '').toUpperCase();

export function selectedTemplateVersion(
  detail: DesignerTemplateDetail,
): DesignerTemplateVersion | undefined {
  return latestDesignerTemplateVersion(detail.versions);
}

export async function getDesignerTemplate(
  reportId: string,
): Promise<DesignerTemplateDetail | null> {
  const summaries = await apiClient.get<DesignerTemplateSummary[]>('/designer-report-templates');
  const summary = summaries.success && Array.isArray(summaries.data)
    ? summaries.data.find((item) =>
        String(item.id) === reportId
        || comparableCode(item.reportCode) === comparableCode(reportId))
    : undefined;
  if (!summary) return null;

  const detail = await apiClient.get<DesignerTemplateDetail>(
    `/designer-report-templates/${summary.id}`,
  );
  return detail.success && detail.data ? detail.data : null;
}

export function parseSelectedTemplate(detail: DesignerTemplateDetail): {
  template: DesignerTemplate;
  version: DesignerTemplateVersion;
} | null {
  const version = selectedTemplateVersion(detail);
  if (!version?.templateJson) return null;
  try {
    return {
      template: JSON.parse(version.templateJson) as DesignerTemplate,
      version,
    };
  } catch {
    return null;
  }
}

export async function getReferencePdfAsset(
  reportId: string,
): Promise<DesignerSourceAsset | null> {
  const detail = await getDesignerTemplate(reportId);
  if (!detail) return null;
  return parseSelectedTemplate(detail)?.template.sourceAssets?.referencePdf ?? null;
}

