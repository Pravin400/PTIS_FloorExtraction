import 'server-only';
import { cookies } from 'next/headers';
import { apiClient } from '@/services/api.service';
import { reportResult } from '@/lib/api/property-tax/reports/report-service-result';
import { classicToNativeTemplate, createBlankClassicReportDefinition, nativeTemplateToClassic, type ClassicReportDefinition } from '@/lib/utils/reports/designer/classic-adapter';
import { resolveProviderSchema } from '@/lib/utils/reports/designer/provider-schema.server';
import { getReferencePdfAsset } from '@/lib/utils/reports/designer/template-source-assets.server';
import { latestDesignerTemplateVersion } from '@/lib/utils/reports/designer/template-version';
import type { DesignerTemplate, DesignerTemplateDetail, DesignerTemplateSummary, DesignerReportSettings, DesignerReportSettingsOptions, DesignerReportParameter } from '@/types/report-designer.types';

export async function deleteDesignerReportServer(templateId: number) {
  if (!Number.isSafeInteger(templateId) || templateId <= 0) {
    return reportResult({ error: 'Invalid report template id.' }, { status: 400 });
  }
  const result = await apiClient.delete<void>(`/designer-report-templates/${templateId}`);
  if (!result.success) {
    return reportResult({ error: result.error || 'Report could not be deleted.' }, { status: result.statusCode || 502 });
  }
  return reportResult({ success: true });
}

export async function listDesignerReportsServer() {
  const result = await apiClient.get<DesignerTemplateSummary[]>('/designer-report-templates');
  if (!result.success || !Array.isArray(result.data)) {
    return reportResult(
      { error: result.error || 'Report catalogue could not be loaded.', reports: [] },
      { status: result.statusCode && result.statusCode >= 400 ? result.statusCode : 502 },
    );
  }
  return reportResult({
    reports: result.data.filter((template) => template.isActive).map((template) => ({
      id: template.reportCode,
      reportCode: template.reportCode,
      name: template.reportName.trim(),
      category: template.moduleCode,
      dataProviderCode: template.dataProviderCode,
      dataSourceCode: template.dataSourceCode,
      tenantScoped: template.tenantId !== null,
      templateId: template.id,
      canDelete: template.canDelete === true,
    })),
  });
}

function comparableCode(value: string): string {
  return value.replace(/[^a-z0-9]/gi, '').toUpperCase();
}

async function getTenantTemplate(reportId: string): Promise<DesignerTemplateDetail | null> {
  const summaries = await apiClient.get<DesignerTemplateSummary[]>('/designer-report-templates');
  if (!summaries.success || !Array.isArray(summaries.data)) {
    throw new Error(summaries.error || 'Report catalogue could not be loaded.');
  }
  const targetCode = comparableCode(reportId);
  const summary = summaries.data.find((item) =>
    String(item.id) === reportId || comparableCode(item.reportCode) === targetCode
  );

  if (!summary) return null;

  const detail = await apiClient.get<DesignerTemplateDetail>(
    `/designer-report-templates/${summary.id}/current`
  );
  if (!detail.success) throw new Error(detail.error || 'Report template could not be loaded.');
  return detail.data || null;
}

function selectedVersion(detail: DesignerTemplateDetail) {
  return latestDesignerTemplateVersion(detail.versions || []);
}

export async function loadDesignerReportServer(reportId: string, templateId = '') {
  if (!reportId)
    return reportResult({ error: 'A report ID is required.' }, { status: 400 });

  const hasTenantSession = Boolean((await cookies()).get('auth_token')?.value);
  if (!hasTenantSession)
    return reportResult({ error: 'Sign in to load the report layout.' }, { status: 401 });

  try {
    if (hasTenantSession) {
      const detail = await getTenantTemplate(templateId || reportId);
      if (detail) {
        const version = selectedVersion(detail);
        if (version?.templateJson) {
          const template = JSON.parse(version.templateJson) as DesignerTemplate;
          const classic = nativeTemplateToClassic(template, {
            reportId: detail.reportCode,
            reportName: detail.reportName,
            layoutVersion: version.versionNo,
            templateId: detail.id,
            reportDefinitionId: detail.reportDefinitionId,
            versionId: version.id,
            versionNo: version.versionNo,
            status: version.status,
            dataSourceCode: detail.dataSourceCode,
            moduleId: detail.moduleId,
            moduleName: detail.moduleCode,
            tenantId: detail.tenantId,
            tenantScope: detail.tenantId == null ? 'Global' : 'CurrentTenant',
            isActive: detail.isActive,
            dataProviderCode: detail.dataProviderCode,
            parameters: detail.parameters,
          });

          return reportResult(classic);
        }
      }
    }

    return reportResult({ error: 'Saved report layout was not found.' }, { status: 404 });
  } catch (error) {
    console.error('Error loading report design:', error);
    return reportResult({ error: 'Saved report layout could not be loaded.' }, { status: 502 });
  }
}

export async function saveDesignerReportServer(reportId: string, body: ClassicReportDefinition, publishAfterSave: boolean) {
  const hasTenantSession = Boolean((await cookies()).get('auth_token')?.value);
  if (!hasTenantSession)
    return reportResult({ error: 'Sign in to save the report layout.' }, { status: 401 });

  try {
    const reportCode = body.reportCode || reportId;
    if (!reportCode)
      return reportResult({ error: 'A report ID is required.' }, { status: 400 });
    const reportName = body.reportName?.trim() || 'Untitled Report';
    const templateJson = JSON.stringify(classicToNativeTemplate(body));
    let detail = body.ntis?.templateId
      ? await getTenantTemplate(String(body.ntis.templateId))
      : null;
    if (!detail) {
      detail = await getTenantTemplate(reportCode) || await getTenantTemplate(reportId);
    }
    const templateId = detail?.id ?? body.ntis?.templateId;

    if (templateId) {
      const saved = await apiClient.post<{
        versionId: number;
        versionNo: number;
        status: string;
      }>(`/designer-report-templates/${templateId}/drafts`, { templateJson });
      if (!saved.success || !saved.data)
        return reportResult(
          { error: saved.error || 'Tenant draft could not be saved.' },
          { status: saved.statusCode || 502 }
        );

      if (publishAfterSave) {
        const published = await apiClient.post<undefined>(
          `/designer-report-templates/${templateId}/versions/${saved.data.versionId}/publish`
        );
        if (!published.success)
          return reportResult(
            { error: published.error || 'Tenant draft was saved but could not be published.' },
            { status: published.statusCode || 502 }
          );
      }

      return reportResult({
        success: true,
        message: publishAfterSave
          ? `${reportName} saved and published successfully`
          : `${reportName} draft saved successfully`,
        layoutVersion: saved.data.versionNo,
        versionId: saved.data.versionId,
        templateId,
        status: publishAfterSave ? 'Published' : saved.data.status,
        updatedAt: new Date().toISOString(),
      });
    }

    const created = await apiClient.post<DesignerTemplateDetail>('/designer-report-templates', {
      reportCode,
      reportName,
      moduleCode: body.ntis?.moduleName || '',
      moduleId: body.ntis?.moduleId ?? null,
      tenantScope: body.ntis?.tenantScope || 'CurrentTenant',
      tenantId: body.ntis?.tenantId ?? null,
      isActive: body.ntis?.isActive ?? true,
      dataProviderCode: body.ntis?.dataProviderCode || 'UnassignedReportDataProvider',
      parameters: body.ntis?.parameters || [],
      dataSourceCode: body.ntis?.dataSourceCode || 'UNASSIGNED',
      templateJson,
    });
    if (!created.success || !created.data)
      return reportResult(
        { error: created.error || 'Tenant template could not be created.' },
        { status: created.statusCode || 502 }
      );

    const version = selectedVersion(created.data);
    if (publishAfterSave && version) {
      const published = await apiClient.post<undefined>(
        `/designer-report-templates/${created.data.id}/versions/${version.id}/publish`
      );
      if (!published.success)
        return reportResult(
          { error: published.error || 'Tenant template was created but could not be published.' },
          { status: published.statusCode || 502 }
        );
    }

    return reportResult({
      success: true,
      message: publishAfterSave
        ? `${reportName} created and published successfully`
        : `${reportName} created successfully`,
      layoutVersion: version?.versionNo ?? 1,
      versionId: version?.id,
      templateId: created.data.id,
      reportDefinitionId: created.data.reportDefinitionId,
      status: publishAfterSave ? 'Published' : (version?.status ?? 'Draft'),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error saving tenant report design:', error);
    return reportResult({ error: 'Failed to save the report layout.' }, { status: 500 });
  }
}

async function resolveTemplate(reportId: string): Promise<DesignerTemplateSummary | undefined> {
  const result = await apiClient.get<DesignerTemplateSummary[]>('/designer-report-templates');
  if (!result.success || !Array.isArray(result.data)) return undefined;
  return result.data.find((item) =>
    String(item.id) === reportId || comparableCode(item.reportCode) === comparableCode(reportId));
}

export async function loadDesignerSettingsServer(reportId: string) {
  const optionsResult = await apiClient.get<DesignerReportSettingsOptions>(
    '/designer-report-templates/settings/options',
  );
  if (!optionsResult.success || !optionsResult.data) {
    return reportResult(
      { error: optionsResult.error || 'Report settings options could not be loaded.' },
      { status: optionsResult.statusCode || 502 },
    );
  }

  const summary = reportId ? await resolveTemplate(reportId) : undefined;
  if (!summary) return reportResult({ settings: null, options: optionsResult.data });

  const settingsResult = await apiClient.get<DesignerReportSettings>(
    `/designer-report-templates/${summary.id}/settings`,
  );
  if (!settingsResult.success || !settingsResult.data) {
    return reportResult(
      { error: settingsResult.error || 'Report settings could not be loaded.' },
      { status: settingsResult.statusCode || 502 },
    );
  }
  return reportResult({ settings: settingsResult.data, options: optionsResult.data });
}

export async function updateDesignerSettingsServer(body: { templateId?: number; settings?: Partial<DesignerReportSettings> }) {
  if (!body.templateId || !body.settings) {
    return reportResult({ error: 'A saved template and report settings are required.' }, { status: 400 });
  }

  const settings = body.settings;
  const result = await apiClient.put<DesignerReportSettings>(
    `/designer-report-templates/${body.templateId}/settings`,
    {
      reportName: settings.reportName,
      moduleId: settings.moduleId ?? null,
      tenantScope: settings.tenantScope ?? 'CurrentTenant',
      tenantId: settings.tenantId ?? null,
      isActive: settings.isActive ?? true,
      dataSourceCode: settings.dataSourceCode || 'UNASSIGNED',
      dataProviderCode: settings.dataProviderCode || 'UnassignedReportDataProvider',
      parameters: settings.parameters || [],
    },
  );
  if (!result.success || !result.data) {
    return reportResult(
      { error: result.error || 'Report settings could not be saved.' },
      { status: result.statusCode || 502 },
    );
  }
  return reportResult({ success: true, settings: result.data });
}

export async function loadDesignerColumnsServer(query: Record<string, string>) {
  const searchParams = new URLSearchParams(query);
  const reportId = searchParams.get('reportId') || '';
  const templateId = searchParams.get('templateId') || (/^\d+$/.test(reportId) ? reportId : '');
  const dataProviderParam = searchParams.get('dataProvider') || '';
  const dataSourceParam = searchParams.get('dataSource') || '';

  // 1. Resolve target provider code or query token
  let targetProvider = dataProviderParam || dataSourceParam;

  if (!targetProvider && templateId) {
    try {
      const settingsResult = await apiClient.get<DesignerReportSettings>(
        `/designer-report-templates/${encodeURIComponent(templateId)}/settings`
      );
      if (settingsResult.success && settingsResult.data?.dataProviderCode) {
        targetProvider = settingsResult.data.dataProviderCode;
      }
    } catch {}
  }

  // 2. Query backend dynamic schema endpoint
  try {
    const resolved = await resolveProviderSchema(
      targetProvider || reportId,
      dataSourceParam,
    );
    const columns = resolved.fields;
    if (columns.length > 0) {
      return reportResult({
        columns,
        dataProviderCode: resolved.dataProviderCode,
        dataSourceCode: resolved.dataSourceCode,
        matched: true,
      });
    }
  } catch (err) {
    console.warn('Failed to resolve dynamic report schema:', err);
  }

  return reportResult({
    columns: [],
    dataProviderCode: targetProvider,
    dataSourceCode: dataSourceParam || targetProvider,
    matched: false,
  });
}

export async function loadDesignerParametersServer(reportId: string) {
  if (!reportId)
    return reportResult({ error: 'A report ID is required.' }, { status: 400 });

  const result = await apiClient.get<DesignerReportParameter[]>(
    `/designer-report-templates/parameters/${encodeURIComponent(reportId)}`,
  );
  if (!result.success || !Array.isArray(result.data)) {
    return reportResult(
      { error: result.error || 'Report parameters could not be loaded.', parameters: [] },
      { status: result.statusCode || 502 },
    );
  }

  return reportResult({
    parameters: result.data
      .filter((parameter) => parameter.isActive !== false)
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((parameter) => ({
        id: parameter.id,
        name: parameter.key,
        label: parameter.label,
        dataType: parameter.type,
        isRequired: parameter.isRequired,
        cascadeFromKey: parameter.cascadeFromKey ?? null,
      })),
  });
}

export async function resetDesignerReportServer(reportId: string) {
  if (!reportId)
    return reportResult({ error: 'A report ID is required.' }, { status: 400 });

  return reportResult({
    success: true,
    message: 'Report canvas reset to a blank A4 layout. Save to persist it for this tenant.',
    data: createBlankClassicReportDefinition(reportId),
  });
}

export async function checkDesignerReferenceServer(reportId: string) {
  if (!reportId) {
    return reportResult({ error: 'A report ID is required.', exists: false }, { status: 400 });
  }

  try {
    const asset = await getReferencePdfAsset(reportId);
    return reportResult({
      success: true,
      reportId,
      exists: Boolean(asset),
      size: asset?.sizeBytes ?? 0,
      fileName: asset?.fileName ?? null,
      url: asset ? `/api/reference-pdf?reportId=${encodeURIComponent(reportId)}` : null,
    });
  } catch (error) {
    console.error('Reference PDF status lookup failed:', error);
    return reportResult({ exists: false, error: 'Reference PDF status could not be loaded.' }, { status: 500 });
  }
}

export async function loadDesignerPreviewDataServer(query: Record<string, string>) {
  const searchParams = new URLSearchParams(query);
  const dataProviderParam = searchParams.get('dataProvider') || searchParams.get('provider') || '';
  const reportCode = searchParams.get('reportCode') || searchParams.get('reportId') || '';
  const propertyNo = searchParams.get('propertyNo') || '';
  const wardId = searchParams.get('wardId') || '';
  const propertyId = searchParams.get('propertyId') || '';

  const target = dataProviderParam || reportCode;
  if (!target) {
    return reportResult(
      {
        success: false,
        data: [],
        error: 'Data provider or report code is required.',
      },
      { status: 400 }
    );
  }

  // Build query string
  const qsParams = new URLSearchParams();
  if (propertyNo) qsParams.set('propertyNo', propertyNo);
  if (wardId) qsParams.set('wardId', wardId);
  if (propertyId) qsParams.set('propertyId', propertyId);
  const qs = qsParams.toString() ? `?${qsParams.toString()}` : '';

  try {
    const result = await apiClient.get<Record<string, unknown>[]>(
      `/designer-report-templates/preview-data/${encodeURIComponent(target)}${qs}`
    );

    if (result && result.success && Array.isArray(result.data)) {
      return reportResult({
        success: true,
        data: result.data,
        count: result.data.length,
        error: result.data.length === 0 ? 'डेटाबेसमध्ये या मालमत्तेसाठी डेटा सापडला नाही (No records found in database)' : null
      });
    }

    return reportResult({
      success: false,
      data: [],
      error: result?.error || 'डेटाबेसमधून डेटा लोड करता आला नाही (Failed to load database records)'
    }, { status: result?.statusCode || 500 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database connection error';
    return reportResult({
      success: false,
      data: [],
      error: msg
    }, { status: 500 });
  }
}
