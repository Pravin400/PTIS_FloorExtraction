import 'server-only';
import { apiClient } from '@/services/api.service';
import type {
  ReportDefinition,
  ReportParameterDefinition,
  ZoneSummary,
  WardSummary,
  PropertySummary,
  LookupOption,
  ReportModule,
} from '@/types/report.types';
import type { PagedResponse } from '@/types/common.types';
import { ApiError } from '@/lib/utils/api';
import { getFinancialYearsPaged } from '@/lib/api/financial-year.service';

/**
 * Generic option source for a 'select' report parameter. `key` is the parameter's OptionsSource;
 * `parentValue` is the selected value of its CascadeFromKey parameter (for cascading dropdowns).
 * The backend dispatches to the matching IReportLookupProvider or falls back to FinancialYear, Zone, and Ward APIs.
 */
export async function getReportLookup(key: string, parentValue?: string): Promise<LookupOption[]> {
  const qs = parentValue ? `?parentValue=${encodeURIComponent(parentValue)}` : '';
  
  try {
    const result = await apiClient.get<LookupOption[]>(
      `/ReportLookup/${encodeURIComponent(key)}${qs}`
    );
    if (result.success && Array.isArray(result.data) && result.data.length > 0) {
      return result.data;
    }
  } catch {
    // Backend endpoint /ReportLookup/{key} not found or failed; fallback to entity APIs
  }

  const normalizedKey = key.toLowerCase();

  // 1. Financial Year Integration (/YearMaster)
  if (
    normalizedKey.includes('financial') ||
    normalizedKey.includes('year') ||
    normalizedKey === 'fy'
  ) {
    try {
      const res = await getFinancialYearsPaged(1, 200);
      const activeYears = (res.items || []).filter((y) => y.isActive !== false);
      return activeYears.map((y) => {
        const yearLabel =
          y.yearCode ||
          (y.year ? `${y.year}-${y.year + 1}` : y.description || `FY ${y.id}`);
        const val = normalizedKey.endsWith('id')
          ? String(y.id)
          : (y.yearCode || (y.year ? `${y.year}-${y.year + 1}` : String(y.id)));
        return {
          value: val,
          label: yearLabel,
        };
      });
    } catch {
      return [];
    }
  }

  // 2. Zone Integration (/Zone)
  if (normalizedKey.includes('zone')) {
    try {
      const zones = await getZones();
      return zones.map((z) => ({
        value: normalizedKey.includes('no') || normalizedKey.includes('code') ? z.zoneNo : String(z.id),
        label: z.description ? `${z.zoneNo} - ${z.description}` : (z.zoneNo || `Zone ${z.id}`),
      }));
    } catch {
      return [];
    }
  }

  // 3. Ward Integration (/Ward)
  if (normalizedKey.includes('ward')) {
    try {
      if (parentValue && !isNaN(Number(parentValue))) {
        const wards = await getWardsByZone(Number(parentValue));
        return wards.map((w) => ({
          value: normalizedKey.includes('no') || normalizedKey.includes('code') ? w.wardNo : String(w.id),
          label: w.description ? `${w.wardNo} - ${w.description}` : (w.wardNo || `Ward ${w.id}`),
        }));
      } else {
        const result = await apiClient.get<PagedResponse<WardSummary>>('/Ward?PageSize=-1');
        if (result.success && result.data && Array.isArray(result.data.items)) {
          return result.data.items.map((w) => ({
            value: normalizedKey.includes('no') || normalizedKey.includes('code') ? w.wardNo : String(w.id),
            label: w.description ? `${w.wardNo} - ${w.description}` : (w.wardNo || `Ward ${w.id}`),
          }));
        }
      }
    } catch {
      return [];
    }
  }

  return [];
}

function normalizeReportDefinition(raw: Record<string, unknown>): ReportDefinition {
  const reportCode = String(raw.reportCode ?? '');
  const reportName = String(raw.reportName ?? '');
  return {
    id: Number(raw.id ?? 0),
    reportCode,
    reportName,
    category: String(raw.category),
    description: String(raw.description),
    templateFile: String(raw.templateFile),
    dataProviderCode: String(raw.dataProviderCode),
    defaultHtmlTemplateVersionId:
      raw.defaultHtmlTemplateVersionId != null ? Number(raw.defaultHtmlTemplateVersionId) : null,
    isActive: Boolean(raw.isActive),
    sortOrder: Number(raw.sortOrder),
    moduleId: raw.moduleId != null ? Number(raw.moduleId) : null,
  };
}

export async function getReportDefinitions(): Promise<ReportDefinition[]> {
  const result = await apiClient.get<PagedResponse<Record<string, unknown>>>(
    '/Report?PageSize=-1&IsActive=true'
  );
  if (!result.success || !result.data) return [];
  return (result.data.items ?? []).map(normalizeReportDefinition);
}

export async function getReportModules(): Promise<ReportModule[]> {
  const result = await apiClient.get<PagedResponse<Record<string, unknown>>>('/ReportModules');
  if (!result.success || !result.data) return [];
  return (result.data.items ?? []).map((m) => ({
    id: Number(m.id),
    name: String(m.name),
    logoContentType: m.logoContentType != null ? String(m.logoContentType) : null,
    logoBase64: m.logoBase64 != null ? String(m.logoBase64) : null,
  }));
}

export async function getReportParameters(
  reportDefinitionId: number
): Promise<ReportParameterDefinition[]> {
  const result = await apiClient.get<PagedResponse<ReportParameterDefinition>>(
    `/ReportParameterDefinition?ReportDefinitionId=${encodeURIComponent(String(reportDefinitionId))}&IsActive=true&PageSize=-1`
  );
  if (!result.success || !result.data) {
    throw new ApiError(
      result.statusCode ?? 500,
      result.error ?? 'Failed to fetch report parameters',
      'getReportParameters'
    );
  }
  const items = result.data.items ?? [];
  return items.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export async function getZones(): Promise<ZoneSummary[]> {
  const result = await apiClient.get<PagedResponse<ZoneSummary>>('/Zone?PageSize=-1');
  if (!result.success || !result.data) return [];
  return result.data.items ?? [];
}

export async function getPropertiesByWard(wardId: number): Promise<PropertySummary[]> {
  const result = await apiClient.get<{ items: Record<string, unknown>[] }>(
    `/Property?WardId=${encodeURIComponent(String(wardId))}&PageSize=-1&PageNumber=1`
  );
  if (!result.success || !result.data) return [];
  return (result.data.items ?? [])
    .filter((p) => p.isActive !== false)
    .map((p) => ({
      propertyId: Number(p.propertyId ?? p.id ?? 0),
      propertyNo: String(p.propertyNo ?? ''),
      partitionNo: String(p.partitionNo ?? ''),
      ownerName: String(p.ownerName ?? p.ownerNameEnglish ?? ''),
      propertyTypeId: p.propertyTypeId != null ? Number(p.propertyTypeId) : undefined,
    }));
}

export async function getWardsByZone(zoneId: number): Promise<WardSummary[]> {
  const result = await apiClient.get<PagedResponse<WardSummary>>(
    `/Ward?ZoneId=${encodeURIComponent(String(zoneId))}&PageSize=-1`
  );
  if (!result.success || !result.data) return [];
  return result.data.items ?? [];
}
