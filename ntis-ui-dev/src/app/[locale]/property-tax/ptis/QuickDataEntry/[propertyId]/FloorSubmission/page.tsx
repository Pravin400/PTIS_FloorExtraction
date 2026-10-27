import { setRequestLocale } from 'next-intl/server';
import FloorSubmission from '@/components/modules/property-tax/ptis/QuickDataEntry/floorSubmission/FloorSubmission';
import { FloorSubmissionErrorBoundary } from '@/components/modules/property-tax/ptis/QuickDataEntry/floorSubmission/error/FloorSubmissionErrorBoundary';
import { FloorResponse, ConstructionTypeResponse, TypeOfUseApiItem, SubFloorResponse, SubTypeOfUseResponse } from '@/types/floor-details.types';
import { FloorData, RoomTypeResponse } from '@/types/room-details.types';
import { PropertyBasicDetailsApiItem } from '@/types/property-basic-details.types';
import { normalizeObjectResponse, normalizeArrayResponse, normalizeWrappedResponse, } from '@/lib/utils/action-response-helpers';
import { getFloorDataAction, getConstructionTypeDataAction, getTypeOfUseDataAction,
    getOpenPlotCategoryDataAction, getSubFloorDataAction, getSubTypeOfUseDataAction, getRoomTypeDataAction, getQuickDataEntryAction, getPropertyByDetailsAction, getFloorByIdAction, getFloorSubmissionsByOwnerAction, getPropertyBasicDetailsAction, } from './actions';
import { getPropertyBasicDetails } from '@/lib/api/ptis/propertybasicdetails/property-basic-details.service';

// Force dynamic rendering — this page relies on per-request search params.
export const dynamic = 'force-dynamic';

// ─── Type Definitions ────────────────────────────────────────────────────────

interface PageProps {
    params: Promise<{ locale: string; propertyId: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Safely extract a single string value from a search-param entry. */
function asString(value: string | string[] | undefined): string {
    return typeof value === 'string' ? value : '';
}

/** Extract a numeric property ID from a raw API response object. */
function extractPropertyId(
    obj: Record<string, unknown>
): string | number | undefined {
    return (
        (obj.ownerID as string | number | undefined) ??
        (obj.ownerId as string | number | undefined) ??
        (obj.propertyId as string | number | undefined) ??
        (obj.id as string | number | undefined)
    );
}

/** Extract property ID from floor data (checks multiple possible field names) */
function getFloorPropertyId(floor: unknown): string | null {
    if (!floor || typeof floor !== 'object') {
        return null;
    }
    const floorObj = floor as Record<string, unknown>;

    // Check all possible property ID field names from API responses
    const propertyId =
        floorObj.ownerID ??          // Primary field from FloorAPIResponse
        floorObj.ownerId ??          // Alternate field from FloorAPIResponse  
        floorObj.propertyId ??       // Standard propertyId field
        floorObj.propertyID ??       // Alternate casing
        floorObj.ownerPropertyId;    // Legacy field name

    return propertyId !== undefined && propertyId !== null
        ? String(propertyId)
        : null;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function FloorSubmissionPage({
    params,
    searchParams,
}: PageProps): Promise<React.JSX.Element> {
    const { locale, propertyId } = await params;
    setRequestLocale(locale);

    const sp = await searchParams;

    // ── URL params ──────────────────────────────────────────────────────────
    const wardNo = asString(sp.wardNo);
    const wardId = sp.wardId ? Number(asString(sp.wardId)) : undefined;
    const propertyNo = asString(sp.propertyNo);
    const partitionNo = asString(sp.partitionNo);
    const propertyIdSp = asString(sp.propertyId);   // from URL (may be pre-set)
    const floorId = asString(sp.floorId);
    const typeOfUseId = asString(sp.typeOfUseId);

    const hasPropertyKeys = !!(wardNo && propertyNo && partitionNo);
    const knownPropertyId = propertyId || propertyIdSp || undefined;

    // ── Phase 1: Fetch Property Details & Basic Details to resolve propertyTypeId ─────
    const [quickDataRaw, propertyBasicDetailsRaw] = await Promise.all([
        hasPropertyKeys ? getQuickDataEntryAction(wardNo, propertyNo, partitionNo) : Promise.resolve(null),
        knownPropertyId ? getPropertyBasicDetailsAction(knownPropertyId) : Promise.resolve(null),
    ]);

    const metadataErrors: string[] = [];

    let quickData = normalizeObjectResponse(quickDataRaw, (m) => metadataErrors.push(m));
    if (!quickData && hasPropertyKeys) {
        try {
            const propertyRaw = await getPropertyByDetailsAction(wardNo, propertyNo, partitionNo);
            quickData = normalizeObjectResponse(propertyRaw, (m) => metadataErrors.push(m));
        } catch (_e) {
            // Ignore error to avoid blocking the page
        }
    }
    const propertyBasicDetails = propertyBasicDetailsRaw as PropertyBasicDetailsApiItem | null;

    const quickDataPropertyID = quickData ? extractPropertyId(quickData) : undefined;
    const initialPropertyID: string | number | undefined =
        quickDataPropertyID ?? knownPropertyId;

    let initialPropertyData: Record<string, unknown> | null = quickData;

    // If we only have propertyId and wardNo/propertyNo/partitionNo weren't provided,
    // we fetch the basic details by propertyId on-demand to resolve propertyTypeId
    if (!initialPropertyData && initialPropertyID && initialPropertyID !== 'new') {
        try {
            const basicDetails = propertyBasicDetails || (await getPropertyBasicDetails(Number(initialPropertyID)));
            if (basicDetails) {
                initialPropertyData = basicDetails as unknown as Record<string, unknown>;
            }
        } catch (_e) {
            // Ignore error to avoid blocking the page
        }
    }

    const resolvedPropertyTypeId = (
        initialPropertyData?.propertyTypeId ??
        initialPropertyData?.propertyTypeID ??
        propertyBasicDetails?.propertyTypeId
    ) as number | string | undefined;

    // ── Phase 2: Fetch Dropdowns & Floor List in parallel ─────────────────────
    const shouldLoadAll = !!floorId;
    const shouldLoadSubType = shouldLoadAll || asString(sp.loadSubType) === 'true';
    const effectiveUseIdForPrefetch = shouldLoadSubType ? typeOfUseId : undefined;
    const targetOwnerId = initialPropertyID ?? knownPropertyId;

    const [
        floorDataResult,
        constructionTypeDataResult,
        useDataResult,
        subFloorDataResult,
        subTypeDataResult,
        roomTypeDataResult,
        floorDetailRaw,
        initialFloorsRaw,
        openPlotCategoryResult,
    ] = await Promise.all([
        getFloorDataAction(),
        getConstructionTypeDataAction(),
        getTypeOfUseDataAction(resolvedPropertyTypeId),
        getSubFloorDataAction(),
        shouldLoadSubType ? getSubTypeOfUseDataAction(effectiveUseIdForPrefetch) : Promise.resolve([]),
        getRoomTypeDataAction(),
        (floorId && floorId !== 'new') ? getFloorByIdAction(floorId) : Promise.resolve(null),
        (targetOwnerId && targetOwnerId !== 'new') ? getFloorSubmissionsByOwnerAction(targetOwnerId) : Promise.resolve([]),
        getOpenPlotCategoryDataAction(),
    ]);

    /** 
     * Validates API result and returns data or empty array.
     * Pushes error keys to metadataErrors instead of throwing to prevent page crash.
     */
    function checkResult<T>(res: unknown, _name: string): T[] {
        if (res && typeof res === 'object' && 'success' in res && !res.success) {
            const errorKey = (res as { error?: string }).error;

            // If error is a translation key, collect it
            if (errorKey) {
                const normalizedKey = errorKey.startsWith('quickDataEntry.')
                    ? errorKey.replace('quickDataEntry.', '')
                    : errorKey;
                metadataErrors.push(normalizedKey);
            } else {
                const fallbackErrorKey = 'quickDataEntry.floorSubmission.errors.fetchFailed';
                const normalizedFallbackErrorKey = fallbackErrorKey.replace('quickDataEntry.', '');
                metadataErrors.push(normalizedFallbackErrorKey);
            }
            return [];
        }
        return Array.isArray(res) ? res as T[] : [];
    }

    const floorData = checkResult<FloorResponse>(floorDataResult, 'Floor data');
    const constructionTypeData = checkResult<ConstructionTypeResponse>(constructionTypeDataResult, 'Construction types');
    const useData = checkResult<TypeOfUseApiItem>(useDataResult, 'Usage types');
    const subFloorData = checkResult<SubFloorResponse>(subFloorDataResult, 'Sub-floor data');
    let subTypeData = checkResult<SubTypeOfUseResponse>(subTypeDataResult, 'Sub-usage types');
    const roomTypeData = checkResult<RoomTypeResponse>(roomTypeDataResult, 'Room types');
    const openPlotCategoryData = checkResult<TypeOfUseApiItem>(openPlotCategoryResult, 'Open plot categories');

    // ── Resolve property data & ID ──────────────────────────────────────────
    if (propertyBasicDetails && initialPropertyData) {
        initialPropertyData = {
            ...initialPropertyData,
            categoryId: propertyBasicDetails.categoryId,
            categoryName: propertyBasicDetails.categoryName,
            propertyTypeId: propertyBasicDetails.propertyTypeId,
            propertyDescription: propertyBasicDetails.propertyDescription,
            wingNo: propertyBasicDetails.wingNo,
            wingId: propertyBasicDetails.wingId,
            wingName: propertyBasicDetails.wingName,
        };
    } else if (propertyBasicDetails) {
        initialPropertyData = {
            categoryId: propertyBasicDetails.categoryId,
            categoryName: propertyBasicDetails.categoryName,
            propertyTypeId: propertyBasicDetails.propertyTypeId,
            propertyDescription: propertyBasicDetails.propertyDescription,
            wingNo: propertyBasicDetails.wingNo,
            wingId: propertyBasicDetails.wingId,
            wingName: propertyBasicDetails.wingName,
        };
    }

    // ── Floor List (already fetched in Phase 2 if propertyId was known) ─────
    let finalFloorsRaw = initialFloorsRaw;
    const targetPropertyID = initialPropertyID ?? knownPropertyId;
    if (targetPropertyID && (!finalFloorsRaw || (Array.isArray(finalFloorsRaw) && finalFloorsRaw.length === 0))) {
        finalFloorsRaw = await getFloorSubmissionsByOwnerAction(targetPropertyID);
    }

    const initialFloors: unknown[] = normalizeArrayResponse(finalFloorsRaw, (m) => metadataErrors.push(m));

    // ── Security & Details Resolution ───────────────────────────────────────
    let initialFloorDetails = normalizeWrappedResponse(floorDetailRaw, (m) => metadataErrors.push(m));
    const expectedPropertyId = initialPropertyID !== undefined && initialPropertyID !== null ? String(initialPropertyID) : null;

    if (floorId && floorId !== 'new' && expectedPropertyId) {
        let isBelonging = false;

        // Check 1: Via the floors list (if available)
        if (Array.isArray(initialFloors) && initialFloors.length > 0) {
            isBelonging = initialFloors.some((f) => String((f as FloorData).id) === String(floorId));
        }

        // Check 2: Via direct floor property ID (Defense-in-depth)
        if (!isBelonging && initialFloorDetails) {
            const fetchedFloorPropertyId = getFloorPropertyId(initialFloorDetails);
            isBelonging = fetchedFloorPropertyId === expectedPropertyId;
        }

        if (!isBelonging) {
            metadataErrors.push('floor.errors.invalidFloorIdForProperty');
            initialFloorDetails = null;
        }
    }

    // ── Sub-type lookup (refetch if floor details provide different useId) ──
    let effectiveUseId = (typeOfUseId && typeOfUseId !== 'undefined' && typeOfUseId !== 'null') ? typeOfUseId : undefined;

    // Ensure subtype list matches the floor's actual usage if editing
    // BUT prefer the URL typeOfUseId if the user has changed the 'Use' dropdown
    if (initialFloorDetails && typeof initialFloorDetails === 'object') {
        const rawFloor = initialFloorDetails as Record<string, unknown>;
        const floorUseId = rawFloor.typeOfUseId ?? rawFloor.TypeOfUseId ?? rawFloor.useId;
        if (floorUseId) {
            const floorUseIdStr = String(floorUseId);

            // Only fallback to the floor's original Use ID if the URL didn't specify one
            // (e.g., initial load of the edit form without user interaction)
            if (!typeOfUseId || typeOfUseId === 'undefined' || typeOfUseId === 'null') {
                if (floorUseIdStr !== effectiveUseIdForPrefetch) {
                    effectiveUseId = floorUseIdStr;
                    const refetchedSubTypeResult = await getSubTypeOfUseDataAction(effectiveUseId);
                    subTypeData = checkResult<SubTypeOfUseResponse>(refetchedSubTypeResult, 'Sub-usage types');
                } else {
                    effectiveUseId = floorUseIdStr;
                }
            }
        }
    }

    // Resolve Plot Area data
    const initialPlotArea = null;

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <FloorSubmissionErrorBoundary>
            <FloorSubmission
                key={initialPropertyID ? String(initialPropertyID) : 'new'}
                floorOptions={floorData}
                constructionTypeOptions={constructionTypeData}
                useOptions={useData}
                subFloorOptions={subFloorData}
                roomTypeData={roomTypeData}
                subTypeOptions={[]}
                floorData={floorData}
                constructionTypeData={constructionTypeData}
                useData={useData}
                openPlotCategoryData={openPlotCategoryData}
                subFloorData={subFloorData}
                subTypeData={subTypeData}
                wardNo={wardNo}
                wardId={wardId && !isNaN(wardId) ? wardId : undefined}
                propertyNo={propertyNo}
                partitionNo={partitionNo}
                initialPropertyData={initialPropertyData}
                initialPropertyID={initialPropertyID}
                initialFloors={initialFloors}
                initialFloorDetails={initialFloorDetails}
                initialPlotArea={initialPlotArea}
                propertyTypeId={resolvedPropertyTypeId}
                locale={locale}
                apiErrors={metadataErrors}
            />
        </FloorSubmissionErrorBoundary>
    );
}
