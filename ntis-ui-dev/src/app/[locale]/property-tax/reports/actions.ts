'use server';

import { getReportDefinitions, getReportParameters, getZones, getWardsByZone, getPropertiesByWard } from '@/lib/api/property-tax/reports/report.service';
import { getFinancialYearsPaged } from '@/lib/api/financial-year.service';
import { getPropertyTypes } from '@/lib/api/property-type-crud.service';
import { apiClient } from '@/services/api.service';
import { resolvePropertyId, resolveProperties, type PropertySummaryItem } from '@/lib/api/property-tax/reports/property-lookup.service';
import type {
  CreateReportRequestResult,
  PropertySummary,
  ReportDefinition,
  ReportJob,
  ReportJobType,
  ReportParameterDefinition,
  WardSummary,
  ZoneSummary,
} from '@/types/report.types';
import type { FinancialYear } from '@/types/financialYear.types';
import type { PropertyType } from '@/types/property-type.types';
import { cookies } from 'next/headers';
import { fetchReportJobsServer, getDesignerReportStatusServer, createDesignerReportJobServer } from '@/lib/api/property-tax/reports/report-jobs.service';

export async function getPropertyTypesAction(): Promise<PropertyType[]> {
  try {
    return await getPropertyTypes();
  } catch {
    return [];
  }
}

export async function getAssessmentTypesAction(): Promise<Array<{ id: number; name: string }>> {
  try {
    const res = await apiClient.get<import('@/types/common.types').PagedResponse<Record<string, unknown>>>('/PropertyAssessmentStatus?PageSize=-1&IsActive=true');
    if (res.success && res.data?.items && Array.isArray(res.data.items) && res.data.items.length > 0) {
      return res.data.items.map((item) => ({
        id: Number(item.id ?? 0),
        name: String(item.statusName ?? item.assessmentType ?? item.name ?? item.description ?? item.id),
      }));
    }
  } catch {
    // Fallback
  }

  try {
    const res2 = await apiClient.get<import('@/types/common.types').PagedResponse<Record<string, unknown>>>('/AssessmentTypeMaster?PageSize=-1&IsActive=true');
    if (res2.success && res2.data?.items && Array.isArray(res2.data.items) && res2.data.items.length > 0) {
      return res2.data.items.map((item) => ({
        id: Number(item.id ?? 0),
        name: String(item.assessmentType ?? item.name ?? item.statusName ?? item.description ?? item.id),
      }));
    }
  } catch {
    // Fallback
  }

  return [
    { id: 1, name: 'General Assessment (सर्वसाधारण आकारणी)' },
    { id: 2, name: 'Re-Assessment (पुनराकारणी)' },
    { id: 3, name: 'New Assessment (नवीन आकारणी)' },
    { id: 4, name: 'Revision Assessment (सुधारित आकारणी)' },
  ];
}


export async function getReportDefinitionsAction(): Promise<ReportDefinition[]> {
  try {
    return await getReportDefinitions();
  } catch {
    return [];
  }
}

export interface GetReportParametersResult {
  data: ReportParameterDefinition[];
  error: string | null;
}

export async function getReportParametersAction(
  reportDefinitionId: number,
): Promise<GetReportParametersResult> {
  try {
    const data = await getReportParameters(reportDefinitionId);
    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { data: [], error: message };
  }
}

export async function getZonesAction(): Promise<ZoneSummary[]> {
  try {
    return await getZones();
  } catch {
    return [];
  }
}

export async function getWardsByZoneAction(zoneId: number): Promise<WardSummary[]> {
  try {
    return await getWardsByZone(zoneId);
  } catch {
    return [];
  }
}

export async function getPropertiesByWardAction(wardId: number): Promise<PropertySummary[]> {
  try {
    return await getPropertiesByWard(wardId);
  } catch {
    return [];
  }
}


/** Fetch all active financial years for the report parameters panel. */
export async function getFinancialYearsAction(): Promise<FinancialYear[]> {
  try {
    const result = await getFinancialYearsPaged(1, 200);
    return result.items.filter((y) => y.isActive);
  } catch {
    return [];
  }
}

/**
 * Resolve a property number string → numeric propertyId.
 * Calls /Property/search with the property number as both From and To,
 * filtered by wardId when provided.
 * Returns the first matching propertyId, or null if not found.
 */
export async function resolvePropertyIdAction(
  propertyNo: string,
  wardId?: number,
): Promise<number | null> {
  return resolvePropertyId(propertyNo, wardId);
}

export type { PropertySummaryItem } from '@/lib/api/property-tax/reports/property-lookup.service';

/** Find all properties matching a property number (including partitions). */
export async function resolvePropertiesAction(
  propertyNo: string,
  wardId?: number,
): Promise<PropertySummaryItem[]> {
  return resolveProperties(propertyNo, wardId);
}

export async function fetchReportJobs(take = 25): Promise<ReportJob[]> {
  return fetchReportJobsServer(take);
}

export async function getDesignerReportStatusAction(jobId: string) {
  return getDesignerReportStatusServer(jobId);
}

export async function createReportRequestAction(
  reportCode: string,
  parameters: Record<string, string>,
  jobType?: ReportJobType,
): Promise<CreateReportRequestResult> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    const enrichedParameters: Record<string, string> = {
      ...parameters,
      ...(userId ? { userId: userId } : {}),
    };

    // Remove empty parameters so SSRS treats them as NULL and bypasses strict filters
    Object.keys(enrichedParameters).forEach(key => {
      if (enrichedParameters[key] === '') {
        delete enrichedParameters[key];
      }
    });



    const result = await createDesignerReportJobServer({
        reportCode,
        parameters: enrichedParameters,
        outputMode: 'merged',
        jobType: jobType ?? inferHtmlJobType(enrichedParameters),
    });

    if (!result.success || !result.data?.jobId) {
      return { success: false, error: result.error || 'Failed to queue HTML report' };
    }

    return {
      success: true,
      data: {
        reportRequestId: result.data.jobId,
        status: result.data.status,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

function inferHtmlJobType(parameters: Record<string, string>): ReportJobType {
  const explicitIds = parameters.propertyId?.trim() || parameters.ownerId?.trim() || '';
  const ids = explicitIds
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  if (ids.length > 1) return 'Bulk';
  if (ids.length === 1) return 'Single';
  if (parameters.fromPropertyNo?.trim() || parameters.toPropertyNo?.trim()) return 'Bulk';
  if (parameters.zoneId?.trim() || parameters.wardId?.trim()) return 'Bulk';
  return 'Single';
}


