import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";
import { normalizeApiFloorData } from "./floor-types-guard";
import { sanitizeFloorPayload, sanitizeFloorUpdatePayload } from "./payload-sanitization";
import { validateSubmissionId, validateCreateFormData, validateUpdateFormData } from "./payload-validation";
import { createApiError, getDeleteErrorStatusCode } from "./error-helpers";
import {
    type FloorSubmissionPayload,
    type SubmissionResponse
} from '@/types/floor-details.types';
import {
    alignRenterIdsWithDb,
    fetchExistingRenterRows,
} from "./renter.service";
import { invalidateFloorSubmissionsCache } from "./floor-info.service";

const TEMP_ID_THRESHOLD = 1_000_000_000_000;

/**
 * Returns true when the floor payload carries any renter rows we'd need to
 * sync (i.e. renter is enabled and at least one renterDetails / renterMast
 * row is present). Avoids hitting the renter endpoints for non-renter floors.
 */
function payloadHasRenterData(payload: FloorSubmissionPayload): boolean {
    const isRenter = Boolean(
        (payload as { isRenter?: unknown }).isRenter ??
        (payload as { renterYesNo?: unknown }).renterYesNo
    );
    if (!isRenter) return false;
    const details = (payload as { renterDetails?: unknown[] }).renterDetails;
    const masts = (payload as { renterMast?: unknown[] }).renterMast;
    return (Array.isArray(details) && details.length > 0) ||
        (Array.isArray(masts) && masts.length > 0);
}

/**
 * Submits a new floor to the backend. Returns the raw/mapped created data.
 */
export async function createFloorSubmission(payload: FloorSubmissionPayload): Promise<Record<string, unknown> | unknown> {
    try {
        await validateCreateFormData(payload);
        const sanitizedPayload = sanitizeFloorPayload(payload);
        const response = await apiClient.post<SubmissionResponse>("/DataEntry", sanitizedPayload);
        if (!response.success) {
            throw createApiError(response.statusCode, response.error, "Create floor submission failed");
        }
        invalidateFloorSubmissionsCache(payload.propertyId);
        return response.data ? normalizeApiFloorData(response.data as unknown as Record<string, unknown>) : response.data;
    } catch (error) {
        throw error;
    }
}

/**
 * Updates an existing floor submission.
 *
 * The /DataEntry/{id} endpoint accepts the full nested floor body (floor
 * attributes + renterDetails + renterMast + renters + roomWiseSubmissionDetails)
 * and runs its own smart-matching for child rows. We deliberately DO NOT
 * stamp child ids ourselves here — sending the rows id-less lets the backend
 * match by (financialYear / agreementDate / renterName / durationFrom) and
 * update existing rows in place rather than rejecting them as id conflicts.
 *
 * The renter screen ("Save Changes") stages its data into sessionStorage and
 * the actual DB write happens through THIS path on "Update Floor" — so this
 * single PUT is the source of truth for both floor and renter updates.
 */
export async function updateFloorSubmission(submissionId: number | string, payload: FloorSubmissionPayload): Promise<Record<string, unknown> | unknown> {
    try {
        await validateUpdateFormData(submissionId, payload);

        const submissionIdNum = Number(submissionId);
        const isRealId = submissionIdNum > 0 && submissionIdNum < TEMP_ID_THRESHOLD;
        const hasRenters = payloadHasRenterData(payload);

        let alignedPayload: FloorSubmissionPayload = payload;

        // For updates carrying renter rows, read the existing rows back from
        // the parent floor (`GET /DataEntry/{id}` — the only endpoint that
        // exposes them; the standalone `/RenterDetails` / `/RenterMast`
        // endpoints return 405) and stamp their ids onto the form rows.
        //
        // The backend has unique constraints `(propertyDetailsId, agreementId)`
        // on `renterDetails` and `(propertyDetailsId, financialYear)` on
        // `renterMast`, so id-less INSERTs of rows that already exist bounce
        // with a generic 500. Sending the rows WITH the existing id forces
        // an UPDATE instead. Rows that no longer exist in the form are also
        // merged back in with `isActive: false` so the same PUT soft-deletes
        // them (separate DELETE endpoints aren't available either).
        if (isRealId && hasRenters) {
            try {
                const { dbDetails, dbMasts } = await fetchExistingRenterRows(submissionIdNum);
                const aligned = alignRenterIdsWithDb(payload, dbDetails, dbMasts);
                alignedPayload = aligned.payload as FloorSubmissionPayload;
            } catch {
                // Proceed without id alignment when the renter prefetch fails.
            }
        }

        const sanitizedPayload = sanitizeFloorUpdatePayload(alignedPayload);

        const response = await apiClient.put<SubmissionResponse>(
            `/DataEntry/${encodeURIComponent(String(submissionId))}`,
            sanitizedPayload
        );

        if (!response.success) {
            throw createApiError(response.statusCode, response.error, "Update floor submission failed");
        }

        // Treat HTTP-2xx-but-body.success:false as a real failure.
        const responseBody = response.data as unknown as Record<string, unknown> | undefined;
        if (responseBody && responseBody.success === false) {
            const bodyMessage =
                (typeof responseBody.message === 'string' && responseBody.message) ||
                (typeof responseBody.error === 'string' && responseBody.error) ||
                'Update floor submission failed (backend returned success=false)';
            throw createApiError(response.statusCode, bodyMessage, "Update floor submission failed");
        }

        invalidateFloorSubmissionsCache(payload.propertyId);
        return response.data ? normalizeApiFloorData(response.data as unknown as Record<string, unknown>) : response.data;
    } catch (error) {
        throw error;
    }
}

/**
 * Deletes an existing floor submission.
 */
export async function deleteFloorSubmission(submissionId: number | string): Promise<void> {
    try {
        if (!validateSubmissionId(submissionId)) {
            throw new ApiError(400, "floor.errors.submissionIdRequired", "Floor submission ID validation failed");
        }
        const response = await apiClient.delete<unknown>(`/DataEntry/${encodeURIComponent(String(submissionId))}`);
        if (!response.success) {
            let statusCode = response.statusCode;
            if (!statusCode) {
                statusCode = getDeleteErrorStatusCode(response.error || "");
            }
            throw new ApiError(statusCode, response.error || "Failed to delete floor data", `Delete floor ${submissionId} failed`);
        }
        invalidateFloorSubmissionsCache();
    } catch (error) {
        throw error;
    }
}

/**
 * Deletes a room-wise submission.
 */
export async function deleteRoomSubmission(roomId: number | string): Promise<void> {
    try {
        const response = await apiClient.delete<unknown>(`/RoomWiseSubmission/${encodeURIComponent(String(roomId))}`);
        if (!response.success) {
            throw createApiError(response.statusCode, response.error, "Delete room data failed");
        }
    } catch (error) {
        throw error;
    }
}

/**
 * Deletes an offset-wise submission.
 */
export async function deleteOffsetSubmission(offsetId: number | string): Promise<void> {
    try {
        const response = await apiClient.delete<unknown>(`/RoomWiseMinus/${encodeURIComponent(String(offsetId))}`);
        if (!response.success) {
            throw createApiError(response.statusCode, response.error, "Delete offset data failed");
        }
    } catch (error) {
        throw error;
    }
}
