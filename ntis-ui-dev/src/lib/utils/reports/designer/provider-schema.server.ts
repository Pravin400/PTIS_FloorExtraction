import 'server-only';
import { apiClient } from '@/services/api.service';
import type {
  DesignerDataSource,
  DesignerDataSourceField,
  DesignerFieldCatalogEntry,
  DesignerReportSettingsOptions,
} from '@/types/report-designer.types';
import {
  canonicalProviderCode,
  flattenDesignerFields,
  matchDesignerDataSource,
  matchRegisteredProviderCode,
} from '@/lib/utils/reports/designer/provider-schema';

export interface ResolvedProviderSchema {
  matched: boolean;
  dataProviderCode: string;
  dataSourceCode: string;
  fields: DesignerFieldCatalogEntry[];
}

async function readSchema(providerCode: string): Promise<DesignerDataSourceField[]> {
  if (!providerCode) return [];
  try {
    const result = await apiClient.get<DesignerDataSourceField[]>(
      `/designer-report-templates/schema/${encodeURIComponent(providerCode)}`,
    );
    return result.success && Array.isArray(result.data) ? result.data : [];
  } catch {
    return [];
  }
}

async function readDataSources(): Promise<DesignerDataSource[]> {
  try {
    const result = await apiClient.get<DesignerDataSource[]>(
      '/designer-report-templates/data-sources',
    );
    return result.success && Array.isArray(result.data) ? result.data : [];
  } catch {
    return [];
  }
}

async function readRegisteredProviderCodes(): Promise<string[]> {
  try {
    const result = await apiClient.get<DesignerReportSettingsOptions>(
      '/designer-report-templates/settings/options',
    );
    return result.success && Array.isArray(result.data?.dataProviderCodes)
      ? result.data.dataProviderCodes
      : [];
  } catch {
    return [];
  }
}

export async function resolveProviderSchema(
  requestedProviderCode: string,
  requestedDataSourceCode = '',
): Promise<ResolvedProviderSchema> {
  const requested = requestedProviderCode.trim();
  if (!requested || requested === 'UnassignedReportDataProvider') {
    return {
      matched: false,
      dataProviderCode: requested,
      dataSourceCode: requestedDataSourceCode.trim(),
      fields: [],
    };
  }

  const [directFields, sources, registeredProviderCodes] = await Promise.all([
    readSchema(requested),
    readDataSources(),
    readRegisteredProviderCodes(),
  ]);
  const source = matchDesignerDataSource(sources, requested)
    ?? matchDesignerDataSource(sources, requestedDataSourceCode);
  const registeredProviderCode = matchRegisteredProviderCode(registeredProviderCodes, requested);
  const dataProviderCode = source
    ? canonicalProviderCode(source, requested)
    : registeredProviderCode || requested;
  const dataSourceCode = source?.code || requestedDataSourceCode.trim() || requested;
  let rawFields = directFields;

  if (rawFields.length === 0 && source?.fields?.length) rawFields = source.fields;
  if (rawFields.length === 0 && source && dataProviderCode !== requested) {
    rawFields = await readSchema(dataProviderCode);
  }

  return {
    matched: Boolean(source || registeredProviderCode || directFields.length > 0),
    dataProviderCode,
    dataSourceCode,
    fields: flattenDesignerFields(rawFields),
  };
}
