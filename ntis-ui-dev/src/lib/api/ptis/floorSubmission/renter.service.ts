/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";
import { normalizeApiFloorData, normalizeRenterDetailItem, normalizeRenterMastItem } from "./floor-types-guard";
import { extractNestedRenterRows } from "./renter-helpers";
import { sanitizeRenterPayload } from "./payload-sanitization";
import { validateRenterFormData } from "./payload-validation";
import { createApiError } from "./error-helpers";
import { type SubmissionResponse } from '@/types/floor-details.types';

import { getFloorById } from "./floor-info.service";

const API_ENDPOINTS = {
    DATA_ENTRY: '/DataEntry',
    DATA_ENTRY_BY_ID: (id: string | number) => `/DataEntry/${encodeURIComponent(String(id))}`,
};

const TEMP_ID_THRESHOLD = 1_000_000_000_000;

/** Extract the starting calendar year from a financial-year token like "2026", "2026-27", "FY2026", etc. */
const extractFyStartYear = (fy: unknown): number | null => {
    if (fy === undefined || fy === null) return null;
    const match = String(fy).match(/(\d{4})/);
    return match ? Number(match[1]) : null;
};

/** Extract an ISO date prefix (YYYY-MM-DD) for stable comparison of date-like values. */
const toIsoDayKey = (val: unknown): string | null => {
    if (!val) return null;
    try {
        const d = new Date(val as string);
        if (isNaN(d.getTime())) return null;
        return d.toISOString().slice(0, 10);
    } catch {
        return null;
    }
};

const hasRealId = (item: any): boolean => {
    const id = Number(item?.id);
    return !isNaN(id) && id > 0 && id < TEMP_ID_THRESHOLD;
};

/**
 * Pair form items to db items by a strong key (FY start year or duration-from date).
 * Items with valid ids from the form are paired by id first; remaining form items
 * are then paired against remaining db items in sorted order. This guarantees:
 *   - every db row is matched to at most one form row
 *   - PUT (update) is preferred over POST (insert) whenever a candidate db row exists
 *   - leftover db rows are returned for deletion
 *   - leftover form rows are returned for insertion
 */
function pairFormToDb<T extends { id?: number | string | null } & Record<string, any>>(
    formItems: T[],
    dbItems: T[],
    getKey: (item: T) => number | string | null
): { toUpdate: T[]; toCreate: T[]; toDelete: T[] } {
    const dbById = new Map<number, T>();
    dbItems.forEach((d) => {
        const id = Number(d.id);
        if (!isNaN(id) && id > 0) dbById.set(id, d);
    });

    const matchedDbIds = new Set<number>();
    const toUpdate: T[] = [];
    const remainingForm: T[] = [];

    // 1. Pair form items that already carry a valid id.
    formItems.forEach((item) => {
        if (hasRealId(item) && dbById.has(Number(item.id))) {
            matchedDbIds.add(Number(item.id));
            toUpdate.push(item);
        } else {
            remainingForm.push(item);
        }
    });

    // 2. Pair remaining form items to remaining db items by key (sorted ascending).
    const remainingDb = dbItems.filter((d) => !matchedDbIds.has(Number(d.id)));
    const sortByKey = (a: T, b: T) => {
        const ka = getKey(a);
        const kb = getKey(b);
        if (ka === null && kb === null) return 0;
        if (ka === null) return 1;
        if (kb === null) return -1;
        return ka < kb ? -1 : ka > kb ? 1 : 0;
    };
    const formByKey = [...remainingForm].sort(sortByKey);
    const dbByKey = [...remainingDb].sort(sortByKey);

    const toCreate: T[] = [];
    const usedDbIds = new Set<number>();

    formByKey.forEach((formItem) => {
        // Prefer a db row with the exact same key, otherwise reuse the first untaken
        // db row to ensure we PUT (update) rather than POST (insert) whenever possible.
        const formKey = getKey(formItem);
        let dbMatch: T | undefined;
        if (formKey !== null) {
            dbMatch = dbByKey.find((d) => !usedDbIds.has(Number(d.id)) && getKey(d) === formKey);
        }
        if (!dbMatch) {
            dbMatch = dbByKey.find((d) => !usedDbIds.has(Number(d.id)));
        }
        if (dbMatch) {
            usedDbIds.add(Number(dbMatch.id));
            formItem.id = Number(dbMatch.id);
            toUpdate.push(formItem);
        } else {
            toCreate.push(formItem);
        }
    });

    const toDelete = dbItems.filter((d) => {
        const id = Number(d.id);
        return !matchedDbIds.has(id) && !usedDbIds.has(id);
    });

    return { toUpdate, toCreate, toDelete };
}

/**
 * Stamp existing database ids onto the payload's renter rows so the backend
 * treats them as updates (id > 0) instead of creating new rows.
 *
 * Stale db rows (rows that exist in the database but no longer correspond to
 * any form row) are merged BACK into the payload with `isActive: false` so the
 * backend soft-deletes them in the same PUT. We can't DELETE them through a
 * separate endpoint — `/RenterDetails/{id}` and `/RenterMast/{id}` return
 * 405 Method Not Allowed.
 */
export function alignRenterIdsWithDb(
    payload: any,
    dbDetails: any[],
    dbMasts: any[]
): { payload: any; toDeleteDetails: any[]; toDeleteMasts: any[] } {
    const formDetails = Array.isArray(payload?.renterDetails)
        ? payload.renterDetails.map((d: any) => ({ ...d }))
        : [];
    const formMasts = Array.isArray(payload?.renterMast)
        ? payload.renterMast.map((m: any) => ({ ...m }))
        : [];

    // For renterDetails, match by agreementId first (it's the natural key
    // most backends enforce as unique per propertyDetailsId), falling back to
    // the duration-from day key when agreementId is missing/blank.
    const detailsPlan = pairFormToDb<any>(
        formDetails,
        dbDetails,
        (item) => {
            const agId = item?.agreementId ? String(item.agreementId).trim() : '';
            if (agId) return `ag:${agId}`;
            return toIsoDayKey(item.durationFrom) || toIsoDayKey(item.customFromDate);
        }
    );

    const mastsPlan = pairFormToDb<any>(
        formMasts,
        dbMasts,
        (item) => extractFyStartYear(item.financialYear) ?? toIsoDayKey(item.durationFrom)
    );

    // Mark every leftover db row inactive — the backend will soft-delete them
    // when it processes the PUT body.
    const deactivatedDetails = detailsPlan.toDelete.map((d) => ({ ...d, isActive: false }));
    const deactivatedMasts = mastsPlan.toDelete.map((m) => ({ ...m, isActive: false }));

    const alignedDetails = [
        ...detailsPlan.toUpdate,
        ...detailsPlan.toCreate,
        ...deactivatedDetails,
    ];
    const alignedMasts = [
        ...mastsPlan.toUpdate,
        ...mastsPlan.toCreate,
        ...deactivatedMasts,
    ];

    return {
        payload: {
            ...payload,
            renterDetails: alignedDetails,
            renterMast: alignedMasts,
        },
        toDeleteDetails: detailsPlan.toDelete,
        toDeleteMasts: mastsPlan.toDelete,
    };
}

/**
 * Best-effort cleanup of database rows that no longer correspond to any form row.
 * Failures are swallowed so transient sub-resource issues never break the main save.
 */
export async function deleteStaleRenterRows(
    toDeleteDetails: any[],
    toDeleteMasts: any[]
): Promise<void> {
    const safeDelete = (url: string) =>
        Promise.resolve()
            .then(() => apiClient.delete(url))
            .catch(() => undefined);

    const deletePromises: Promise<unknown>[] = [
        ...toDeleteDetails.map((item: any) =>
            safeDelete(`/RenterDetails/${item.id}`)
        ),
        ...toDeleteMasts.map((item: any) =>
            safeDelete(`/RenterMast/${item.id}`)
        ),
    ];
    if (deletePromises.length > 0) {
        await Promise.all(deletePromises);
    }
}

/**
 * Fetch the existing renter sub-records for a propertyDetailsId so we can
 * align ids before sending the floor PUT.
 *
 * IMPORTANT: the backend does NOT expose standalone `/RenterDetails` or
 * `/RenterMast` GET endpoints (they return 405 Method Not Allowed). The only
 * way to read the existing renter rows is to GET the parent floor at
 * `/DataEntry/{propertyDetailsId}` — its response nests `renterDetails`,
 * `renterMast`, and `renters` arrays with their real database ids.
 */
export async function fetchExistingRenterRows(
    propertyDetailsId: number
): Promise<{ dbDetails: any[]; dbMasts: any[] }> {
    try {
        const floorRes = await apiClient.get<any>(
            `/DataEntry/${encodeURIComponent(String(propertyDetailsId))}`
        );
        if (!floorRes.success) {
            return { dbDetails: [], dbMasts: [] };
        }

        const root = (floorRes.data && (floorRes.data.items ?? floorRes.data)) as Record<string, any> | undefined;
        if (!root || typeof root !== 'object') {
            return { dbDetails: [], dbMasts: [] };
        }

        const { renterDetails, renterMast } = extractNestedRenterRows(floorRes.data, { activeOnly: false });
        const dbDetails = renterDetails.filter((item: any) => item && Number(item.id) > 0);
        const dbMasts = renterMast.filter((item: any) => item && Number(item.id) > 0);

        return { dbDetails, dbMasts };
    } catch {
        return { dbDetails: [], dbMasts: [] };
    }
}

/**
 * Submits/upserts renter details for a specific floor.
 *
 * Strategy (matches backend's actual contract — confirmed by the /DataEntry/{id}
 * response shape that round-trips nested `renterDetails`, `renterMast`, `renters`):
 *
 *   1. For updates, fetch the existing renter rows so we know the real db ids.
 *   2. Stamp those ids onto the form rows via `pairFormToDb` so each renter
 *      row in the PUT body either carries a real id (update) or no id (insert).
 *   3. Send a SINGLE PUT/POST to /DataEntry/{id} with the full nested body.
 *      The backend updates by id and inserts where missing — this is what
 *      stops the duplication on every update.
 *   4. Best-effort DELETE any stale db rows that no longer correspond to a
 *      form row (cleans up duplicates left behind by past bugs).
 */
export async function saveRenterDetails(floorId: string | number, payload: unknown): Promise<Record<string, unknown> | unknown> {
    try {
        validateRenterFormData(payload);

        let propertyDetailsId = Number(floorId);
        if (isNaN(propertyDetailsId) || propertyDetailsId <= 0) {
            propertyDetailsId = Number((payload as any).propertyDetailsId || (payload as any).id);
        }
        if (isNaN(propertyDetailsId) || propertyDetailsId <= 0) {
            propertyDetailsId = 0;
        }
        const isUpdate = propertyDetailsId > 0 && propertyDetailsId < TEMP_ID_THRESHOLD;

        let dbDetails: any[] = [];
        let dbMasts: any[] = [];
        let toDeleteDetails: any[] = [];
        let toDeleteMasts: any[] = [];
        let alignedPayload: any = payload;

        if (isUpdate) {
            const existing = await fetchExistingRenterRows(propertyDetailsId);
            dbDetails = existing.dbDetails;
            dbMasts = existing.dbMasts;

            const aligned = alignRenterIdsWithDb(payload, dbDetails, dbMasts);
            alignedPayload = aligned.payload;
            toDeleteDetails = aligned.toDeleteDetails;
            toDeleteMasts = aligned.toDeleteMasts;
        }

        const resolvedId = propertyDetailsId > 0 ? propertyDetailsId : undefined;
        const payloadWithIds = {
            ...alignedPayload,
            ...(resolvedId ? {
                id: resolvedId,
                propertyDetailsId: resolvedId,
            } : {}),
        };
        const sanitizedPayload = sanitizeRenterPayload(payloadWithIds);

        let response;
        if (isUpdate) {
            response = await apiClient.put<SubmissionResponse>(
                API_ENDPOINTS.DATA_ENTRY_BY_ID(propertyDetailsId),
                sanitizedPayload
            );
        } else {
            response = await apiClient.post<SubmissionResponse>(
                API_ENDPOINTS.DATA_ENTRY,
                sanitizedPayload
            );
        }

        if (!response.success) {
            const errorMsg = response.error || "";
            const isDuplicate = errorMsg.toLowerCase().includes("already exists") ||
                errorMsg.toLowerCase().includes("duplicate");

            if (!isDuplicate) {
                throw createApiError(response.statusCode, response.error, "Save renter floor attributes failed");
            }
        }

        // Resolve the real propertyDetailsId echoed by the server.
        const floorResponse = (response?.data?.items || response?.data) as Record<string, any>;
        let realPropertyDetailsId = Number(floorResponse?.propertyDetailsId || floorResponse?.id || propertyDetailsId);
        if (isNaN(realPropertyDetailsId) || realPropertyDetailsId <= 0) {
            realPropertyDetailsId = propertyDetailsId;
        }

        // Fallback: locate the floor by (floorId, subFloorId) when the response didn't carry an id.
        if (realPropertyDetailsId <= 0) {
            const ownerID = Number((payload as any).propertyId || (payload as any).ownerID || (sanitizedPayload as any).ownerID || 0);
            if (ownerID > 0) {
                try {
                    const floorsRes = await apiClient.get<any>(`/DataEntry?PropertyId=${ownerID}&PageSize=100`);
                    if (floorsRes.success) {
                        const items = floorsRes.data?.items || (Array.isArray(floorsRes.data) ? floorsRes.data : []);
                        const payloadFloorId = String((sanitizedPayload as any).floorID || (sanitizedPayload as any).floorId || (payload as any).floorId || '');
                        const payloadSubFloorId = String((sanitizedPayload as any).subFloorID || (sanitizedPayload as any).subFloorId || (payload as any).subFloorId || '');
                        const match = (items as any[]).find((f: any) =>
                            String(f.floorID || f.floorId || '') === payloadFloorId &&
                            String(f.subFloorID || f.subFloorId || '') === payloadSubFloorId
                        );
                        if (match) {
                            realPropertyDetailsId = Number(match.propertyDetailsId || match.id);
                        }
                    }
                } catch {
                    // Best-effort lookup only; continue with unresolved id.
                }
            }
        }

        // Clean up stale db rows that survived from prior buggy saves.
        if (isUpdate) {
            await deleteStaleRenterRows(toDeleteDetails, toDeleteMasts);
        }

        return await getFloorById(realPropertyDetailsId);
    } catch (error) {
        throw error;
    }
}

/**
 * Updates an existing renter record directly. Same single-PUT contract as
 * `saveRenterDetails` — the backend treats nested `renterDetails`/`renterMast`/
 * `renters` arrays with real ids as updates, and missing ids as inserts.
 */
export async function updateRenterDetails(renterId: string | number, payload: unknown): Promise<Record<string, unknown> | unknown> {
    try {
        const floorIdNum = Number(renterId);

        let dbDetails: any[] = [];
        let dbMasts: any[] = [];
        let toDeleteDetails: any[] = [];
        let toDeleteMasts: any[] = [];
        let alignedPayload: any = payload;

        if (floorIdNum > 0 && floorIdNum < TEMP_ID_THRESHOLD) {
            const existing = await fetchExistingRenterRows(floorIdNum);
            dbDetails = existing.dbDetails;
            dbMasts = existing.dbMasts;

            const aligned = alignRenterIdsWithDb(payload, dbDetails, dbMasts);
            alignedPayload = aligned.payload;
            toDeleteDetails = aligned.toDeleteDetails;
            toDeleteMasts = aligned.toDeleteMasts;
        }

        const resolvedId = floorIdNum > 0 ? floorIdNum : undefined;
        const payloadWithIds = {
            ...alignedPayload,
            ...(resolvedId ? {
                id: resolvedId,
                propertyDetailsId: resolvedId,
            } : {}),
        };
        const sanitizedPayload = sanitizeRenterPayload(payloadWithIds);

        const response = await apiClient.put<SubmissionResponse>(
            API_ENDPOINTS.DATA_ENTRY_BY_ID(renterId),
            sanitizedPayload
        );

        if (!response.success) {
            throw createApiError(response.statusCode, response.error, "Update renter details failed");
        }

        // Best-effort cleanup of stale duplicates from past saves.
        if (floorIdNum > 0) {
            await deleteStaleRenterRows(toDeleteDetails, toDeleteMasts);
        }

        const rawFloor = (response.data?.items || response.data) as Record<string, any>;
        if (!rawFloor) {
            return response.data;
        }

        const resolvedFloorIdNum = Number(rawFloor.propertyDetailsId || rawFloor.id || renterId);

        // If the PUT response didn't echo back the nested renter arrays (some
        // backend versions omit children), re-read the floor via
        // `GET /DataEntry/{id}` — that's the only endpoint that exposes them
        // on this backend (`/RenterDetails` / `/RenterMast` return 405).
        let renterDetailsFromGet: any[] = [];
        let renterMastFromGet: any[] = [];
        const echoedDetails = Array.isArray(rawFloor.renterDetails) ? rawFloor.renterDetails : [];
        const echoedMasts = Array.isArray(rawFloor.renters)
            ? rawFloor.renters
            : Array.isArray(rawFloor.renterMast) ? rawFloor.renterMast : [];
        if (echoedDetails.length === 0 || echoedMasts.length === 0) {
            try {
                const refetched = await fetchExistingRenterRows(resolvedFloorIdNum);
                renterDetailsFromGet = refetched.dbDetails;
                renterMastFromGet = refetched.dbMasts;
            } catch {
                // Refetch is best-effort; fall back to echoed PUT payload.
            }
        }

        const isActiveRow = (item: any) => item && item.isActive !== false && item.IsActive !== false;
        const finalDetails = echoedDetails.length > 0
            ? echoedDetails.map(normalizeRenterDetailItem).filter(isActiveRow)
            : renterDetailsFromGet.filter(isActiveRow);
        const finalMasts = echoedMasts.length > 0
            ? echoedMasts.map(normalizeRenterMastItem).filter(isActiveRow)
            : renterMastFromGet.filter(isActiveRow);

        // Explicitly override `renters` (not just `renterMast`) so the
        // refetched rows don't get masked by the original empty echoed
        // arrays still present on `rawFloor`.
        const mergedRawFloor = {
            ...rawFloor,
            renterDetails: finalDetails,
            renterMast: finalMasts,
            renters: finalMasts,
        };

        return normalizeApiFloorData(mergedRawFloor);
    } catch (error) {
        throw error;
    }
}

/**
 * Clears all renter data from a floor while preserving floor itself.
 *
 * The standalone `/RenterDetails/{id}` and `/RenterMast/{id}` DELETE endpoints
 * return 405 Method Not Allowed, so we soft-delete by sending the existing
 * children back in the floor PUT with `isActive: false`.
 */
export async function deleteRenterDetails(renterId: string | number): Promise<void> {
    try {
        if (!renterId) {
            throw new ApiError(400, "floor.errors.submissionIdRequired", "Renter ID validation failed");
        }

        const realRenterId = Number(renterId);

        const { dbDetails, dbMasts } = await fetchExistingRenterRows(realRenterId);

        const deactivatedDetails = dbDetails.map((d: any) => ({ ...d, isActive: false }));
        const deactivatedMasts = dbMasts.map((m: any) => ({ ...m, isActive: false }));

        const response = await apiClient.put<SubmissionResponse>(
            API_ENDPOINTS.DATA_ENTRY_BY_ID(realRenterId),
            {
                id: realRenterId,
                propertyDetailsId: realRenterId,
                renterYesNo: false,
                isRenter: false,
                updatedBy: 0,
                renterDetails: deactivatedDetails,
                renterMast: deactivatedMasts,
            }
        );

        if (!response.success) {
            throw createApiError(response.statusCode, response.error, "Delete renter details failed");
        }
    } catch (error) {
        throw error;
    }
}

/**
 * Direct DELETE endpoint call for RenterDetails by ID
 * Endpoint: DELETE /RenterDetails/{id}
 */
export async function deleteRenterDetailsRecord(id: string | number): Promise<SubmissionResponse> {
    try {
        const response = await apiClient.delete<SubmissionResponse>(`/RenterDetails/${encodeURIComponent(String(id))}`);
        return (response.data || response) as SubmissionResponse;
    } catch (error) {
        throw error;
    }
}

/**
 * Direct DELETE endpoint call for RenterMast by ID
 * Endpoint: DELETE /RenterMast/{id}
 */
export async function deleteRenterMastRecord(id: string | number): Promise<SubmissionResponse> {
    try {
        const response = await apiClient.delete<SubmissionResponse>(`/RenterMast/${encodeURIComponent(String(id))}`);
        return (response.data || response) as SubmissionResponse;
    } catch (error) {
        throw error;
    }
}

