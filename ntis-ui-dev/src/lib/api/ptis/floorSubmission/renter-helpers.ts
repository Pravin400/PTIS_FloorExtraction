/* eslint-disable @typescript-eslint/no-explicit-any */
import { normalizeRenterDetailItem, normalizeRenterMastItem } from "./floor-types-guard";

const isActiveRow = (item: any) => {
    if (!item) return false;
    const activeVal = item.isActive ?? item.IsActive;
    return activeVal !== false && activeVal !== 0 && activeVal !== '0';
};

/**
 * Extract `renterDetails` and `renters`/`renterMast` from the floor envelope and
 * normalize their casing. The backend stores them as nested arrays inside
 * `GET /DataEntry/{id}` — there is NO standalone `/RenterDetails` or
 * `/RenterMast` GET endpoint (both return 405 Method Not Allowed).
 *
 * Only active rows are returned so soft-deleted history doesn't leak back into
 * the UI.
 */
export function extractNestedRenterRows(
    rawFloor: any,
    options: { activeOnly?: boolean } = {}
): { renterDetails: any[]; renterMast: any[] } {
    const { activeOnly = true } = options;
    const root = (rawFloor && (rawFloor.items ?? rawFloor)) as Record<string, any> | undefined;
    if (!root || typeof root !== 'object') {
        return { renterDetails: [], renterMast: [] };
    }

    const rawDetails = Array.isArray(root.renterDetails) ? root.renterDetails : [];
    let renterDetails = rawDetails.map(normalizeRenterDetailItem);
    if (activeOnly) {
        renterDetails = renterDetails.filter(isActiveRow);
    }

    // The backend's GET projects `renterMast` as `renters` in the response;
    // fall through to `renterMast` defensively in case the shape changes.
    const rawMasts = Array.isArray(root.renters)
        ? root.renters
        : Array.isArray(root.renterMast) ? root.renterMast : [];
    let renterMast = rawMasts.map(normalizeRenterMastItem);
    if (activeOnly) {
        renterMast = renterMast.filter(isActiveRow);
    }

    return { renterDetails, renterMast };
}

/**
 * Merge extracted renter rows back onto a raw floor envelope so downstream
 * normalization sees a consistent shape (`renterMast` + `renters` alias).
 */
export function mergeRenterRowsIntoFloor(rawFloor: any): any {
    const { renterDetails, renterMast } = extractNestedRenterRows(rawFloor);
    return {
        ...rawFloor,
        renterDetails,
        renterMast,
        renters: renterMast,
    };
}
