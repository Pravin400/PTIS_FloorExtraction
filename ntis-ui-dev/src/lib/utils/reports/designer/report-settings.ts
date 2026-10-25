import type { ClassicReportDefinition } from './classic-adapter';
import type {
  DesignerReportParameter,
  DesignerReportSettings,
  DesignerReportSettingsOptions,
} from '@/types/report-designer.types';

function copyParameters(
  parameters: DesignerReportParameter[] | undefined
): DesignerReportParameter[] {
  return (parameters ?? []).map((parameter, index) => ({
    ...parameter,
    key: parameter.key ?? '',
    label: parameter.label ?? '',
    type: parameter.type || 'text',
    isRequired: Boolean(parameter.isRequired),
    sortOrder: Number.isFinite(Number(parameter.sortOrder)) ? Number(parameter.sortOrder) : index,
    cascadeFromKey: parameter.cascadeFromKey || null,
    isActive: parameter.isActive !== false,
  }));
}

export function buildDesignerReportSettings(
  definition: ClassicReportDefinition,
  options: DesignerReportSettingsOptions,
  savedSettings?: DesignerReportSettings | null
): DesignerReportSettings {
  if (savedSettings) {
    return {
      ...savedSettings,
      currentTenantId: savedSettings.currentTenantId || options.currentTenantId,
      parameters: copyParameters(savedSettings.parameters),
    };
  }

  const ntis = definition.ntis;
  return {
    templateId: ntis?.templateId ?? 0,
    reportDefinitionId: ntis?.reportDefinitionId ?? 0,
    reportCode: definition.reportCode || definition.reportId,
    reportName: definition.reportName || definition.reportCode || definition.reportId,
    moduleId: ntis?.moduleId ?? null,
    moduleName: ntis?.moduleName || '',
    tenantId: ntis?.tenantId ?? null,
    tenantScope: ntis?.tenantScope || 'CurrentTenant',
    currentTenantId: ntis?.currentTenantId || options.currentTenantId,
    isActive: ntis?.isActive !== false,
    dataSourceCode: ntis?.dataSourceCode || 'UNASSIGNED',
    dataProviderCode: ntis?.dataProviderCode || 'UnassignedReportDataProvider',
    parameters: copyParameters(ntis?.parameters),
  };
}

export function applyDesignerReportSettings(
  definition: ClassicReportDefinition,
  settings: DesignerReportSettings
): ClassicReportDefinition {
  return {
    ...definition,
    reportName: settings.reportName || definition.reportName,
    ntis: {
      ...(definition.ntis ?? { dataSourceCode: 'UNASSIGNED' }),
      ...(settings.templateId ? { templateId: settings.templateId } : {}),
      ...(settings.reportDefinitionId ? { reportDefinitionId: settings.reportDefinitionId } : {}),
      moduleId: settings.moduleId ?? null,
      moduleName: settings.moduleName || '',
      tenantId: settings.tenantScope === 'Global' ? null : settings.tenantId,
      tenantScope: settings.tenantScope || 'CurrentTenant',
      currentTenantId: settings.currentTenantId,
      isActive: settings.isActive !== false,
      dataSourceCode: settings.dataSourceCode || 'UNASSIGNED',
      dataProviderCode: settings.dataProviderCode || 'UnassignedReportDataProvider',
      parameters: copyParameters(settings.parameters),
    },
  };
}
