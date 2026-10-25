"use server";

import { ApiError } from '@/lib/utils/api';
import { initOperations, getScopeOptions } from '@/lib/api/add-taxes/operations.service';
import { InitOperationsResponse, ScopeOptionsResponse } from '@/types/addTaxes.types';
import { createLogger } from '@/lib/utils/server-logger';

import { fetchZonesAction } from "../zone-master/actions";
import { getPropertyTypesPaged } from '@/lib/api/property-type-crud.service';

const logger = createLogger('AddTaxesActions');

// getServerTimeAction/getAuditListAction/getAuditDetailAction/getJobPropertiesAction/
// getJobStatusAction/fetchAllWardsAction/searchPropertiesAction/searchPropertiesByCategoryAction/
// previewOperationAction/getImportTemplateAction/getMasterDataChangeSummaryAction/
// exportMasterDataChangesCsvAction/exportPropertiesAction were removed from here — they're now
// plain Route Handlers (src/app/api/property-tax/operations/[action]/route.ts, dispatching on the
// `action` segment) called via fetch() from operations.client.ts (or, for the two CSV exports, the
// pre-existing dedicated export route.ts files next to this one), since a Server Action call here
// re-renders page.tsx's slow initOperationsAction stats call as a side effect of every single call —
// and several of these are polled on short intervals (10s active-job check, 2s execution-progress
// panel) or fetched repeatedly (Audit & Monitor tab, Ward/Building dropdowns), which compounds it.

export async function initOperationsAction(financeYearId?: string | number): Promise<InitOperationsResponse | null> {
    try {
        const result = await initOperations(financeYearId);
        return result;
    } catch (error) {
        if (error instanceof ApiError) {
            logger.error(`[initOperationsAction] API Error ${error.statusCode}:`, { responseText: error.responseText }, error);
        } else {
            logger.error("[initOperationsAction] Error:", undefined, error);
        }
        return null;
    }
}

export async function getScopeOptionsAction(): Promise<ScopeOptionsResponse | null> {
    try {
        const result = await getScopeOptions();
        return result;
    } catch (error) {
        if (error instanceof ApiError) {
            logger.error(`[getScopeOptionsAction] API Error ${error.statusCode}:`, { responseText: error.responseText }, error);
        } else {
            logger.error("[getScopeOptionsAction] Error:", undefined, error);
        }
        return null;
    }
}

export async function fetchAllZonesAction() {
    return await fetchZonesAction(1, -1);
}

interface ZoneResponseItem {
    id: string | number;
    description?: string;
    zoneNo?: string;
}

interface PropertyTypeResponseItem {
    id: string | number;
    propertyDescription?: string;
}

/** Zone options already mapped to {value,label} — server-prefetched in page.tsx since Zone/Property
 *  Type/Assessment Status don't depend on any other selection, unlike Ward/Building. */
export async function fetchZoneOptionsAction(): Promise<{ value: string; label: string }[]> {
    const res = await fetchAllZonesAction();
    const items = (res as { items?: ZoneResponseItem[] } | null)?.items;
    return items
        ? items.map((z) => ({
            value: String(z.id),
            label: z.description && z.zoneNo ? `${z.zoneNo} — ${z.description}` : (z.description || z.zoneNo || ''),
        }))
        : [];
}

/** Property Type options already mapped to {value,label} — server-prefetched, see fetchZoneOptionsAction. */
export async function fetchPropertyTypeOptionsAction(): Promise<{ value: string; label: string }[]> {
    const res = await fetchAllPropertyTypesAction();
    const items = (res as { items?: PropertyTypeResponseItem[] } | null)?.items;
    return items
        ? items.map((pt) => ({ value: String(pt.id), label: pt.propertyDescription || '' }))
        : [];
}

export async function fetchAllPropertyTypesAction() {
    try {
        return await getPropertyTypesPaged(1, -1);
    } catch (error) {
        if (error instanceof ApiError) {
            logger.error(`[fetchAllPropertyTypesAction] API Error ${error.statusCode}:`, { responseText: error.responseText }, error);
        } else {
            logger.error("[fetchAllPropertyTypesAction] Error:", undefined, error);
        }
        return null;
    }
}

// getEligibleCountAction/executeOperationAction/searchPropertiesAction/
// searchPropertiesByCategoryAction/previewOperationAction/getImportTemplateAction were removed
// from here — they're now plain Route Handlers
// (src/app/api/property-tax/operations/{eligible-count,execute,search-properties,
// search-properties-by-category,preview,import-template}, the [action]/route.ts dispatcher) called
// directly via fetch() from useScopeSelection.ts/useExcelImportActions.ts/useExcelImport.ts (see
// operations.client.ts), since a Server Action call here would cause Next.js to re-render page.tsx
// (and its initOperationsAction stats call) as a side effect of every call.

export async function fetchAssessmentStatusesAction() {
    try {
        const { getPropertyAssessmentStatuses } = await import('@/lib/api/property-assessment-status.service');
        const result = await getPropertyAssessmentStatuses();
        return { data: result };
    } catch (error) {
        if (error instanceof ApiError) {
            logger.error(`[fetchAssessmentStatusesAction] API Error ${error.statusCode}:`, { responseText: error.responseText }, error);
        } else {
            logger.error("[fetchAssessmentStatusesAction] Error:", undefined, error);
        }
        return { data: [], error: (error as Error).message };
    }
}

/** Assessment Status options already mapped to {value,label} — server-prefetched, see fetchZoneOptionsAction. */
export async function fetchAssessmentStatusOptionsAction(): Promise<{ value: string; label: string }[]> {
    const res = await fetchAssessmentStatusesAction();
    const data = (res as { data?: { id: string | number; statusName: string }[] } | null)?.data;
    return data ? data.map((item) => ({ value: String(item.id), label: item.statusName })) : [];
}

// exportPropertiesAction was dead code (zero callers — handleExportProperties in
// AddTaxesConsole.tsx already used the dedicated export-excel/route.ts via plain fetch).
// getMasterDataChangeSummaryAction/exportMasterDataChangesCsvAction were removed — the summary is
// now `master-data-summary` on the [action]/route.ts dispatcher (polled independently, see
// useAddTaxesState.ts), and the CSV export already had its own dedicated
// master-data-changes-export/route.ts that AddTaxesConsole.tsx now calls directly.
