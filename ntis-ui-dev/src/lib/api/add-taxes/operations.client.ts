/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Client-safe callers for this screen's operations endpoints — plain fetch() against one
 * consolidated Route Handler (src/app/api/property-tax/operations/[action]/route.ts, a single
 * dynamic-segment file dispatching on `action`, mirroring src/app/api/ptis/[action]/route.ts's
 * existing convention), NOT Server Actions. A Server Action call causes Next.js to re-render the
 * invoking page's Server Component tree (page.tsx) as part of producing its response, which here
 * meant every "Calculate Eligible"/"Execute" click, every Audit tab fetch, and every poll tick
 * incidentally re-ran page.tsx's own ~20-30s initOperationsAction stats call. A Route Handler is an
 * ordinary HTTP endpoint and isn't subject to that.
 */
import { logger } from '@/lib/utils/logger';
import type {
  EligibleCountPayload,
  EligibleCountResponse,
  ExecuteOperationPayload,
  ExecuteOperationResponse,
  JobPropertyPaginatedResponse,
  SearchPropertiesResponse,
  OperationPreviewPayload,
  OperationPreviewResponse,
  ImportTemplateResponse,
  MasterDataChangeSummary,
} from '@/types/addTaxes.types';
import type { WardItem } from '@/types/wardMaster.types';

type EligibleCountClientResult = (EligibleCountResponse & { error?: string }) | { eligible: 0; total: 0; skipped: 0; alreadyTaxed: 0; error: string };
type ExecuteOperationClientResult = (ExecuteOperationResponse & { error?: string }) | { success: false; error: string };

export async function fetchEligibleCountClient(payload: EligibleCountPayload): Promise<EligibleCountClientResult> {
  try {
    const res = await fetch('/api/property-tax/operations/eligible-count', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    logger.error('[fetchEligibleCountClient] Error:', { error: error as Error });
    return { eligible: 0, total: 0, skipped: 0, alreadyTaxed: 0, error: (error as Error).message || 'Failed to calculate eligible properties' };
  }
}

export async function executeOperationClient(payload: ExecuteOperationPayload): Promise<ExecuteOperationClientResult> {
  try {
    const res = await fetch('/api/property-tax/operations/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    logger.error('[executeOperationClient] Error:', { error: error as Error });
    return { success: false, error: (error as Error).message || 'Failed to execute operation' };
  }
}

/**
 * server-time/audit-list/audit-detail/job-properties/job-status — same rationale as above. These
 * are specifically polled on intervals (10s active-job check, 2s execution-progress panel) and
 * fetched repeatedly by the Audit & Monitor tab, so the page-rerender tax from a Server Action
 * compounds badly here.
 */
export async function fetchServerTimeClient(): Promise<string | null> {
  try {
    const res = await fetch('/api/property-tax/operations/server-time');
    return await res.json();
  } catch (error) {
    logger.error('[fetchServerTimeClient] Error:', { error: error as Error });
    return null;
  }
}

export async function fetchAuditListClient(queryParams: Record<string, string | number | undefined>): Promise<any | null> {
  try {
    const params = new URLSearchParams();
    for (const key in queryParams) {
      if (queryParams[key] !== undefined && queryParams[key] !== null) {
        params.append(key, String(queryParams[key]));
      }
    }
    const res = await fetch(`/api/property-tax/operations/audit-list?${params.toString()}`);
    return await res.json();
  } catch (error) {
    logger.error('[fetchAuditListClient] Error:', { error: error as Error });
    return null;
  }
}

export async function fetchAuditDetailClient(jobId: string): Promise<any> {
  try {
    const res = await fetch(`/api/property-tax/operations/audit-detail?jobId=${encodeURIComponent(jobId)}`);
    return await res.json();
  } catch (error) {
    logger.error('[fetchAuditDetailClient] Error:', { error: error as Error });
    return null;
  }
}

export async function fetchJobPropertiesClient(jobId: string, pageNumber: number = 1, pageSize: number = 10): Promise<JobPropertyPaginatedResponse | null> {
  try {
    const res = await fetch(`/api/property-tax/operations/job-properties?jobId=${encodeURIComponent(jobId)}&pageNumber=${pageNumber}&pageSize=${pageSize}`);
    return await res.json();
  } catch (error) {
    logger.error('[fetchJobPropertiesClient] Error:', { error: error as Error });
    return null;
  }
}

export async function fetchJobStatusClient(jobId: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch(`/api/property-tax/operations/job-status?jobId=${encodeURIComponent(jobId)}`);
    return await res.json();
  } catch (error) {
    logger.error('[fetchJobStatusClient] Error:', { error: error as Error });
    return { success: false, error: (error as Error).message || 'Failed to fetch job status' };
  }
}

/**
 * ward-list/search-properties/search-properties-by-category/preview/import-template/
 * master-data-summary — same rationale as above. Ward/Building dropdowns and the Preview modal are
 * genuinely on-demand client interactions; master-data-summary is polled independently (see
 * useAddTaxesState.ts) since its freshness doesn't correlate with any job start/finish event.
 */
export async function fetchWardsClient(searchTerm?: string): Promise<{ success: boolean; data?: WardItem[]; totalCount?: number; error?: string }> {
  try {
    const qs = searchTerm ? `?searchTerm=${encodeURIComponent(searchTerm)}` : '';
    const res = await fetch(`/api/property-tax/operations/ward-list${qs}`);
    return await res.json();
  } catch (error) {
    logger.error('[fetchWardsClient] Error:', { error: error as Error });
    return { success: false, error: (error as Error).message || 'Failed to fetch wards' };
  }
}

export async function searchPropertiesClient(zoneId: string | number | null, wardId: string | number): Promise<SearchPropertiesResponse | null> {
  try {
    const params = new URLSearchParams();
    if (zoneId !== null && zoneId !== undefined && zoneId !== '') params.set('zoneId', String(zoneId));
    params.set('wardId', String(wardId));
    const res = await fetch(`/api/property-tax/operations/search-properties?${params.toString()}`);
    return await res.json();
  } catch (error) {
    logger.error('[searchPropertiesClient] Error:', { error: error as Error });
    return null;
  }
}

export async function searchPropertiesByCategoryClient(
  searchCategory: number = 2,
  wardId?: string | number,
  pageNumber: number = 1,
  pageSize: number = 100,
  propertyFrom?: string,
  propertyTo?: string,
  zoneId?: string | number,
  searchTerm?: string
): Promise<any> {
  try {
    const params = new URLSearchParams();
    params.set('searchCategory', String(searchCategory));
    if (wardId !== undefined && wardId !== null && wardId !== '') params.set('wardId', String(wardId));
    if (zoneId !== undefined && zoneId !== null && zoneId !== '') params.set('zoneId', String(zoneId));
    if (propertyFrom) params.set('propertyFrom', propertyFrom);
    if (propertyTo) params.set('propertyTo', propertyTo);
    if (searchTerm) params.set('searchTerm', searchTerm.trim());
    params.set('pageNumber', String(pageNumber));
    params.set('pageSize', String(pageSize));
    const res = await fetch(`/api/property-tax/operations/search-properties-by-category?${params.toString()}`);
    return await res.json();
  } catch (error) {
    logger.error('[searchPropertiesByCategoryClient] Error:', { error: error as Error });
    return null;
  }
}

export async function previewOperationClient(payload: OperationPreviewPayload): Promise<(OperationPreviewResponse & { error?: string }) | { error: string }> {
  try {
    const res = await fetch('/api/property-tax/operations/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    logger.error('[previewOperationClient] Error:', { error: error as Error });
    return { error: (error as Error).message || 'Failed to load preview data' };
  }
}

export async function getImportTemplateClient(): Promise<ImportTemplateResponse | null> {
  try {
    const res = await fetch('/api/property-tax/operations/import-template');
    return await res.json();
  } catch (error) {
    logger.error('[getImportTemplateClient] Error:', { error: error as Error });
    return null;
  }
}

export async function getMasterDataChangeSummaryClient(financeYearId: string | number): Promise<MasterDataChangeSummary | null> {
  try {
    const res = await fetch(`/api/property-tax/operations/master-data-summary?financeYearId=${encodeURIComponent(String(financeYearId))}`);
    return await res.json();
  } catch (error) {
    logger.error('[getMasterDataChangeSummaryClient] Error:', { error: error as Error });
    return null;
  }
}

/** Already-mapped {value,label}[] zone options — used by ExcelImportTab, which (unlike the Manual
 * Selection tab) doesn't receive page.tsx's server-prefetched zones as a prop. */
export async function fetchZoneOptionsClient(): Promise<{ value: string; label: string }[]> {
  try {
    const res = await fetch('/api/property-tax/operations/zone-list');
    return await res.json();
  } catch (error) {
    logger.error('[fetchZoneOptionsClient] Error:', { error: error as Error });
    return [];
  }
}
