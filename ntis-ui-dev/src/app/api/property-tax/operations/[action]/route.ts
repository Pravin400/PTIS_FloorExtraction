import { NextRequest, NextResponse } from 'next/server';
import {
  getEligibleCount,
  executeOperation,
  getServerTime,
  getAuditList,
  getAuditDetail,
  getJobProperties,
  getJobStatus,
  getAllWardsForOperations,
  searchProperties,
  searchPropertiesByCategory,
  previewOperation,
  getImportTemplate,
  getMasterDataChangeSummary,
  fetchZoneOptionsService,
} from '@/lib/api/add-taxes/operations.service';
import { ApiError } from '@/lib/utils/api';
import { createLogger } from '@/lib/utils/server-logger';
import type { EligibleCountPayload, ExecuteOperationPayload, OperationPreviewPayload } from '@/types/addTaxes.types';

const logger = createLogger('AddTaxesOperationsRoute');

/**
 * Single consolidated Route Handler for every Add Taxes "operations" call that used to be its own
 * Server Action (eligible-count, execute, server-time, audit-list, audit-detail, job-properties,
 * job-status) — one dynamic `[action]` segment instead of one route.ts per endpoint, mirroring the
 * existing `src/app/api/ptis/[action]/route.ts` convention already used elsewhere in this app.
 *
 * Why a Route Handler at all, instead of calling the backend directly from the browser: the backend
 * requires a Bearer token derived from the session cookie via `cookies()` (next/headers), which only
 * exists in the Next.js server runtime, not in browser JS — and the dev-mode relaxed-TLS dispatcher
 * these calls go through is also server-only wiring. Some server-side file has to mediate the call;
 * a Route Handler is the minimal one that does NOT trigger Next.js's Server-Action-only behavior of
 * re-rendering the current page's Server Component tree (and, on this screen, its slow
 * initOperationsAction stats call) as a side effect of every call.
 */

function getStringParam(request: NextRequest, key: string): string {
  return request.nextUrl.searchParams.get(key) || '';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> }
): Promise<Response> {
  const { action } = await params;
  try {
    switch (action) {
      case 'server-time': {
        const result = await getServerTime();
        return NextResponse.json(result);
      }
      case 'audit-list': {
        const queryParams: Record<string, string> = {};
        request.nextUrl.searchParams.forEach((value, key) => {
          queryParams[key] = value;
        });
        const result = await getAuditList(queryParams);
        return NextResponse.json(result);
      }
      case 'audit-detail': {
        const jobId = getStringParam(request, 'jobId');
        const result = await getAuditDetail(jobId);
        return NextResponse.json(result);
      }
      case 'job-properties': {
        const jobId = getStringParam(request, 'jobId');
        const pageNumber = Number(getStringParam(request, 'pageNumber')) || 1;
        const pageSize = Number(getStringParam(request, 'pageSize')) || 10;
        const result = await getJobProperties(jobId, pageNumber, pageSize);
        return NextResponse.json(result);
      }
      case 'job-status': {
        const jobId = getStringParam(request, 'jobId');
        const result = await getJobStatus(jobId);
        return NextResponse.json({ success: true, data: result });
      }
      case 'ward-list': {
        const searchTerm = getStringParam(request, 'searchTerm') || undefined;
        const result = await getAllWardsForOperations(searchTerm);
        return NextResponse.json({ success: true, data: result.data, totalCount: result.totalCount });
      }
      case 'search-properties': {
        const zoneIdRaw = getStringParam(request, 'zoneId');
        const wardId = getStringParam(request, 'wardId');
        const zoneId = zoneIdRaw || null;
        const result = await searchProperties(zoneId, wardId);
        return NextResponse.json(result);
      }
      case 'search-properties-by-category': {
        const sp = request.nextUrl.searchParams;
        const searchCategory = Number(getStringParam(request, 'searchCategory')) || 2;
        const wardId = getStringParam(request, 'wardId') || undefined;
        const pageNumber = Number(getStringParam(request, 'pageNumber')) || 1;
        const pageSize = Number(getStringParam(request, 'pageSize')) || 100;
        const propertyFrom = sp.get('propertyFrom') || undefined;
        const propertyTo = sp.get('propertyTo') || undefined;
        const zoneId = sp.get('zoneId') || undefined;
        const searchTerm = sp.get('searchTerm') || sp.get('SearchTerm') || undefined;
        const result = await searchPropertiesByCategory(searchCategory, wardId, pageNumber, pageSize, propertyFrom, propertyTo, zoneId, searchTerm);
        return NextResponse.json(result);
      }
      case 'import-template': {
        const result = await getImportTemplate();
        return NextResponse.json(result);
      }
      case 'master-data-summary': {
        const financeYearId = getStringParam(request, 'financeYearId');
        const result = await getMasterDataChangeSummary(financeYearId);
        return NextResponse.json(result);
      }
      case 'zone-list': {
        const result = await fetchZoneOptionsService();
        return NextResponse.json(result);
      }
      default:
        return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 404 });
    }
  } catch (error) {
    let errorMsg = `Failed to fetch data for ${action}`;
    if (error instanceof ApiError) {
      logger.error(`[operations/${action} GET] API Error ${error.statusCode}:`, { responseText: error.responseText }, error);
      errorMsg = error.responseText || error.message || errorMsg;
    } else {
      logger.error(`[operations/${action} GET] Error:`, undefined, error);
      errorMsg = (error as Error).message || errorMsg;
    }
    return NextResponse.json({ success: false, error: errorMsg }, { status: error instanceof ApiError ? error.statusCode || 500 : 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> }
): Promise<Response> {
  const { action } = await params;
  try {
    switch (action) {
      case 'eligible-count': {
        const payload = (await request.json()) as EligibleCountPayload;
        const result = await getEligibleCount(payload);
        return NextResponse.json(result);
      }
      case 'execute': {
        const payload = (await request.json()) as ExecuteOperationPayload;
        const result = await executeOperation(payload);
        return NextResponse.json(result);
      }
      case 'preview': {
        const payload = (await request.json()) as OperationPreviewPayload;
        const result = await previewOperation(payload);
        return NextResponse.json(result);
      }
      default:
        return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 404 });
    }
  } catch (error) {
    let errorMsg = action === 'execute' ? 'Failed to execute operation'
      : action === 'preview' ? 'Failed to load preview data'
      : 'Failed to calculate eligible properties';
    if (error instanceof ApiError) {
      logger.error(`[operations/${action} POST] API Error ${error.statusCode}:`, { responseText: error.responseText }, error);
      errorMsg = error.responseText || error.message || errorMsg;
    } else {
      logger.error(`[operations/${action} POST] Error:`, undefined, error);
      errorMsg = (error as Error).message || errorMsg;
    }
    if (action === 'execute') {
      return NextResponse.json({ success: false, error: errorMsg });
    }
    if (action === 'preview') {
      return NextResponse.json({ success: false, records: [], totalSelected: 0, eligible: 0, skipped: 0, requiresApproval: 0, error: errorMsg });
    }
    return NextResponse.json({ success: false, eligible: 0, total: 0, skipped: 0, alreadyTaxed: 0, error: errorMsg });
  }
}
