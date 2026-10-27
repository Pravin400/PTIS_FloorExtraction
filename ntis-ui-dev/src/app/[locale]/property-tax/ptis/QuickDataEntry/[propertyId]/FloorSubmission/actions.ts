'use server';
import { revalidatePath } from 'next/cache';
import {
    createFloorSubmission,
    updateFloorSubmission,
    deleteFloorSubmission,
    getFloorById,
    getQuickDataEntry,
    getPropertyByDetails,
    getFloorSubmissionsByOwner,
    getFloorData,
    getTypeOfUseData,
    getConstructionTypeData,
    getSubTypeOfUseData,
    getSubFloorData,
    getRoomTypeData,
    deleteRoomSubmission,
    deleteOffsetSubmission,
    saveRenterDetails,
    updateRenterDetails,
    deleteRenterDetails,
    deleteRenterDetailsRecord,
    deleteRenterMastRecord,
    applyDataEntrySameAs,
    type ApplyDataEntrySameAsPayload,
    type ApplyDataEntrySameAsResponse,
} from '@/lib/api/ptis/floorSubmission';

import { getPropertyBasicDetails } from '@/lib/api/ptis/propertybasicdetails/property-basic-details.service';
import { PropertyBasicDetailsApiItem } from '@/types/property-basic-details.types';

import { validateFloorSubmissionPayload, validateRenterFormData } from '@/lib/validations/validateFloorSubmission';
import { type ActionResult } from '@/types/common.types';
import {
    FloorSubmissionPayload,
    type SelectableProperty,
    type DataEntrySameAsResponse,
    type DataEntrySameAsItem
} from '@/types/floor-details.types';
import { apiClient } from '@/services/api.service';

export type { SelectableProperty } from '@/types/floor-details.types';

export type QuickDataEntryPayload = Record<string, unknown>;

export async function clearDataEntrySameAsCache(): Promise<void> {
    // No-op: in-memory cache removed to ensure data freshness and serverless compatibility
}

export async function fetchDataEntrySameAsAction(wardId: number, propertyNo?: string, _categoryName?: string): Promise<SelectableProperty[]> {
    try {
        const params = new URLSearchParams();
        params.set('WardId', String(wardId));
        if (propertyNo) {
            params.set('PropertyNo', propertyNo);
        }
        const response = await apiClient.get<DataEntrySameAsResponse>(`/DataEntrySameAs/units?${params.toString()}`, { cache: 'no-store' });
        
        const raw = (response?.data ?? response) as unknown;
        const rawObj = raw as Record<string, unknown>;
        const items: DataEntrySameAsItem[] = Array.isArray(raw)
            ? (raw as DataEntrySameAsItem[])
            : Array.isArray(rawObj?.items)
            ? (rawObj.items as DataEntrySameAsItem[])
            : Array.isArray((response as unknown as Record<string, unknown>)?.items)
            ? ((response as unknown as Record<string, unknown>).items as DataEntrySameAsItem[])
            : [];

        if (!items || !items.length) {
            return [];
        }
        const results = items.map((item) => {
            const extended = item as typeof item & {
                propertyCategoryName?: string | null;
                categoryName?: string | null;
                totalCarpetAreaSqFeet?: number | null;
                totalCarpetAreaSqMeter?: number | null;
                carpetAreaSqFeet?: number | null;
                carpetAreaSqMeter?: number | null;
                totalBuiltupAreaSqFeet?: number | null;
                totalBuiltupAreaSqMeter?: number | null;
                builtupAreaSqFeet?: number | null;
                builtupAreaSqMeter?: number | null;
                parkingCarpetAreaSqFeet?: number | null;
                parkingCarpetAreaSqMeter?: number | null;
                parkingBuiltupAreaSqFeet?: number | null;
                parkingBuiltupAreaSqMeter?: number | null;
            };
            const typeLabel = (item.typeLabel || item.typeName || undefined) as string | undefined;
            const catName = item.propertyCategoryName || item.categoryName || extended.propertyCategoryName || extended.categoryName || undefined;

            return {
                id: `${item.propertyId}-${item.propertyFloorId ?? ''}-${item.propertyDetailsId ?? ''}-${item.wingName || ''}-${item.flatOrShopNo || ''}`,
                propertyId: item.propertyId,
                propertyFloorId: item.propertyFloorId ?? null,
                propertyDetailsId: item.propertyDetailsId ?? null,
                wardId: item.wardId,
                wardNo: item.wardNo || '-',
                propertyNo: item.propertyNo || '-',
                partitionNo: item.partitionNo || '-',
                categoryName: catName ? String(catName) : '-',
                type: item.type ?? '-',
                typeLabel,
                wing: item.wingName || '-',
                flatNo: item.flatOrShopNo || '-',
                carpetAreaSqFeet: extended.totalCarpetAreaSqFeet ?? extended.carpetAreaSqFeet ?? null,
                carpetAreaSqMeter: extended.totalCarpetAreaSqMeter ?? extended.carpetAreaSqMeter ?? null,
                builtupAreaSqFeet: extended.totalBuiltupAreaSqFeet ?? extended.builtupAreaSqFeet ?? null,
                builtupAreaSqMeter: extended.totalBuiltupAreaSqMeter ?? extended.builtupAreaSqMeter ?? null,
                parkingCarpetAreaSqFeet: extended.parkingCarpetAreaSqFeet ?? null,
                parkingCarpetAreaSqMeter: extended.parkingCarpetAreaSqMeter ?? null,
                parkingBuiltupAreaSqFeet: extended.parkingBuiltupAreaSqFeet ?? null,
                parkingBuiltupAreaSqMeter: extended.parkingBuiltupAreaSqMeter ?? null,
            };
        });
        return results;
    } catch (_error) {
        return [];
    }
}

import { cache } from 'react';

/**
 * Fetch property basic details including category information
 */
export const getPropertyBasicDetailsAction = cache(async (propertyId: number | string): Promise<PropertyBasicDetailsApiItem | null> => {
    try {
        const pid = Number(propertyId);
        if (isNaN(pid) || pid <= 0) {
            return null;
        }
        return await getPropertyBasicDetails(pid);
    } catch (_error) {
        return null;
    }
});

/*
 * Individual fetchers for SSR lookups
 */
export async function getFloorDataAction() {
    try {
        return await getFloorData();
    } catch (_error) {
        return { success: false, error: "quickDataEntry.floorSubmission.errors.fetchFloorData" };
    }
}

export async function getConstructionTypeDataAction() {
    try {
        return await getConstructionTypeData();
    } catch (_error) {
        return { success: false, error: "quickDataEntry.floorSubmission.errors.fetchConstructionTypes" };
    }
}

export async function getTypeOfUseDataAction(propertyTypeId?: string | number) {
    try {
        return await getTypeOfUseData(propertyTypeId);
    } catch (_error) {
        return { success: false, error: "quickDataEntry.floorSubmission.errors.fetchUsageTypes" };
    }
}

export async function getOpenPlotCategoryDataAction(propertyTypeId?: string | number) {
    try {
        return await getTypeOfUseData(propertyTypeId);
    } catch (_error) {
        return { success: false, error: "quickDataEntry.floorSubmission.errors.fetchUsageTypes" };
    }
}

export async function getSubTypeOfUseDataAction(typeOfUseId?: string) {
    try {
        return await getSubTypeOfUseData(typeOfUseId);
    } catch (_error) {
        return { success: false, error: "quickDataEntry.floorSubmission.errors.fetchSubUsageTypes" };
    }
}

export async function getSubFloorDataAction() {
    try {
        return await getSubFloorData();
    } catch (_error) {
        return { success: false, error: "quickDataEntry.floorSubmission.errors.fetchSubFloorData" };
    }
}

export async function getRoomTypeDataAction() {
    try {
        return await getRoomTypeData();
    } catch (_error) {
        return { success: false, error: "quickDataEntry.floorSubmission.errors.fetchRoomTypes" };
    }
}

/**
 * Helper to resolve the actual path for revalidation
 */
function getRevalidatePath(locale: string, propertyId?: string | number) {
    const basePath = `/${locale}/property-tax/ptis/QuickDataEntry`;

    if (propertyId !== undefined && propertyId !== null && propertyId !== '') {
        return `${basePath}/${encodeURIComponent(String(propertyId))}/FloorSubmission`;
    }

    return basePath;
}

/**
 * Validates and submits a floor submission payload without redirect.
 */
export const submitFloorSubmissionNoRedirectAction = async (payload: FloorSubmissionPayload, locale: string = "en", propertyId?: string | number): Promise<ActionResult<unknown>> => {
    const validation = validateFloorSubmissionPayload(payload);
    if (!validation.success) return validation;
    try {
        const data = await createFloorSubmission(payload);
        revalidatePath(getRevalidatePath(locale, propertyId || (payload.propertyId as string | number)), "page");
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "quickDataEntry.floorSubmission.errors.submitFailed" };
    }
};

/**
 * Validates and updates a floor submission payload without redirect.
 */
export const updateFloorSubmissionNoRedirectAction = async (submissionId: number | string, payload: FloorSubmissionPayload, locale: string = "en", propertyId?: string | number): Promise<ActionResult<unknown>> => {
    const validation = validateFloorSubmissionPayload(payload);
    if (!validation.success) return validation;
    try {
        const data = await updateFloorSubmission(submissionId, payload);
        revalidatePath(getRevalidatePath(locale, propertyId || (payload.propertyId as string | number)), "page");
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "quickDataEntry.floorSubmission.errors.updateFailed" };
    }
};

/**
 * Deletes a floor submission without redirecting.
 */
export const deleteFloorSubmissionNoRedirectAction = async (submissionId: number | string, locale: string = "en", propertyId?: string | number): Promise<ActionResult<void>> => {
    try {
        await deleteFloorSubmission(submissionId);
        revalidatePath(getRevalidatePath(locale, propertyId), "page");
        return { success: true, data: undefined };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "quickDataEntry.floorSubmission.errors.deleteFailed" };
    }
};

/**
 * Deletes a RenterDetails record by ID.
 * Endpoint: DELETE /api/RenterDetails/{id}
 */
export const deleteRenterDetailsAction = async (id: number | string, locale: string = "en", propertyId?: string | number): Promise<ActionResult<unknown>> => {
    try {
        const data = await deleteRenterDetailsRecord(id);
        if (locale) {
            revalidatePath(getRevalidatePath(locale, propertyId), "page");
        }
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "quickDataEntry.floorSubmission.errors.deleteRenterDetailsFailed" };
    }
};

/**
 * Deletes a RenterMast record by ID.
 * Endpoint: DELETE /api/RenterMast/{id}
 */
export const deleteRenterMastAction = async (id: number | string, locale: string = "en", propertyId?: string | number): Promise<ActionResult<unknown>> => {
    try {
        const data = await deleteRenterMastRecord(id);
        if (locale) {
            revalidatePath(getRevalidatePath(locale, propertyId), "page");
        }
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "quickDataEntry.floorSubmission.errors.deleteRenterMastFailed" };
    }
};

export const getFloorByIdAction = async (floorId: number | string) => {
    try {
        const data = await getFloorById(floorId);
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'quickDataEntry.floorSubmission.errors.fetchFloorById' };
    }
};

export const getQuickDataEntryAction = async (wardNo: string, propNo: string, partNo: string) => {
    try {
        const data = await getQuickDataEntry(wardNo, propNo, partNo);
        return data
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'quickDataEntry.floorSubmission.errors.fetchQuickDataEntry' };
    }
};

export const getPropertyByDetailsAction = async (wardNo: string, propNo: string, partNo: string) => {
    try {
        const data = await getPropertyByDetails(wardNo, propNo, partNo);
        return data
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'quickDataEntry.floorSubmission.errors.fetchPropertyDetails' };
    }
};

export const getFloorSubmissionsByOwnerAction = async (ownerId: number | string) => {
    try {
        const data = await getFloorSubmissionsByOwner(ownerId);
        return data
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'quickDataEntry.floorSubmission.errors.fetchFloorSubmissions' };
    }
};

/**
 * Deletes a room submission without redirecting.
 */
export const deleteRoomSubmissionNoRedirectAction = async (roomId: number | string): Promise<ActionResult<void>> => {
    try {
        await deleteRoomSubmission(roomId);
        return { success: true, data: undefined };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Failed to delete room" };
    }
};

/**
 * Deletes an offset submission without redirecting.
 */
export const deleteOffsetSubmissionNoRedirectAction = async (offsetId: number | string): Promise<ActionResult<void>> => {
    try {
        await deleteOffsetSubmission(offsetId);
        return { success: true, data: undefined };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Failed to delete offset" };
    }
};

// ----------------------------------------------------------------------
// RENTER ACTIONS
// ----------------------------------------------------------------------

export const saveFloorRenterDetailsAction = async (floorId: string | number, payload: unknown, locale: string = "en", propertyId?: string | number): Promise<ActionResult<unknown>> => {
    const validation = validateRenterFormData(payload);
    if (!validation.success) return validation;
    try {
        const data = await saveRenterDetails(floorId, payload);
        const basePath = getRevalidatePath(locale, propertyId);
        revalidatePath(basePath, "page");
        revalidatePath(`${basePath}/Renter`, "page");
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Failed to save renter details" };
    }
};

export const updateFloorRenterDetailsAction = async (renterId: string | number, payload: unknown, locale: string = "en", propertyId?: string | number): Promise<ActionResult<unknown>> => {
    try {
        const data = await updateRenterDetails(renterId, payload);
        const basePath = getRevalidatePath(locale, propertyId);
        revalidatePath(basePath, "page");
        revalidatePath(`${basePath}/Renter`, "page");
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Failed to update renter details" };
    }
};

export const deleteFloorRenterDetailsAction = async (renterId: string | number, locale: string = "en", propertyId?: string | number): Promise<ActionResult<void>> => {
    try {
        await deleteRenterDetails(renterId);
        const basePath = getRevalidatePath(locale, propertyId);
        revalidatePath(basePath, "page");
        revalidatePath(`${basePath}/Renter`, "page");
        return { success: true, data: undefined };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Failed to delete renter details" };
    }
};

export async function applyDataEntrySameAsAction(payload: ApplyDataEntrySameAsPayload, locale: string = "en"): Promise<ActionResult<ApplyDataEntrySameAsResponse['items']>> {
    try {
        const floorSubmissions = await getFloorSubmissionsByOwner(payload.sourcePropertyId);
        const hasFloorSubmission = Array.isArray(floorSubmissions) && floorSubmissions.length > 0;
        if (!hasFloorSubmission) {
            return {
                success: false,
                error: locale === 'mr'
                    ? "टाइप वाईज, प्रॉपर्टी वाईज किंवा पार्किंग डेटा लागू करण्यापूर्वी फ्लोअर सबमिशन आवश्यक आहे."
                    : locale === 'hi'
                    ? "टाइप वाइज, प्रॉपर्टी वाइज या पार्किंग डेटा लागू करने से पहले फ्लोर सबमिशन आवश्यक है।"
                    : "Floor submission is required before applying Type Wise, Property Wise, or Parking data."
            };
        }
        const data = await applyDataEntrySameAs(payload);
        await clearDataEntrySameAsCache();
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
}
// ----------------------------------------------------------------------
// PLOT AREA ACTIONS
// ----------------------------------------------------------------------

// ----------------------------------------------------------------------
// AI FLOOR-PLAN EXTRACTION ACTIONS
// ----------------------------------------------------------------------

export interface ExtractedRoomDto {
    room_number: number;
    room_name: string;
    room_type?: string | null;
    shape: string;
    length?: number | null;
    width?: number | null;
    detected_dimensions?: string | null;
    measurement_unit: string;
    area?: number | null;
    area_source: string;
    confidence: number;
    needs_review: boolean;
}

export interface ExtractionResponseDto {
    success: boolean;
    rooms_detected: number;
    measurement_unit: string;
    rooms: ExtractedRoomDto[];
    warnings?: string[];
    message?: string;
    error?: string;
}

export async function extractRoomsFromFloorPlanAction(params: {
    propertyId: number | string;
    wardNo?: string;
    propertyNo?: string;
    partitionNo?: string;
    floorNumber?: string;
    measurementUnit?: string;
    customBase64?: string;
    customSvg?: string;
}): Promise<ActionResult<ExtractionResponseDto>> {
    try {
        const extractionServiceUrl = process.env.FLOOR_PLAN_EXTRACTION_URL || 'http://localhost:8000';

        // 1. If custom SVG or Base64 is provided directly
        if (params.customSvg || params.customBase64) {
            const res = await fetch(`${extractionServiceUrl}/api/extract-rooms-json`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    svg_content: params.customSvg,
                    image_base64: params.customBase64,
                    measurement_unit: params.measurementUnit
                }),
                cache: 'no-store'
            });
            if (!res.ok) {
                const errText = await res.text();
                return { success: false, error: `Extraction service error (${res.status}): ${errText}` };
            }
            const data: ExtractionResponseDto = await res.json();
            return { success: true, data };
        }

        // 2. Otherwise retrieve the saved plan for this property
        const propId = Number(params.propertyId);
        let planDocumentGuid: string | null = null;
        let planFileName: string | null = null;

        if (propId) {
            try {
                const { photoPlanService, invalidatePhotoPlanCache } = await import('@/lib/api/ptis/photoplan/photoplan.service');
                // Always invalidate cache so latest uploaded/changed plan is immediately retrieved
                invalidatePhotoPlanCache(propId);
                const photosRes = await photoPlanService.getPhotosByProperty(propId);

                if (photosRes.success && Array.isArray(photosRes.data)) {
                    // Filter for all plan photos
                    const planPhotos = photosRes.data.filter((p) =>
                        p.photoTypeId === 5 ||
                        p.photoTypeCode === 'PROPERTY_PLAN' ||
                        p.photoTypeCode === 'PHOTO_PLAN' ||
                        p.photoTypeCode === 'PLAN' ||
                        p.photoTypeName?.toLowerCase().includes('plan')
                    );

                    // Sort descending by propertyPhotoId so the most recent plan is used
                    planPhotos.sort((a, b) => (b.propertyPhotoId || 0) - (a.propertyPhotoId || 0));

                    const planPhoto = planPhotos[0];
                    if (planPhoto && planPhoto.documentGuid) {
                        planDocumentGuid = String(planPhoto.documentGuid);
                        planFileName = planPhoto.fileName || 'plan.svg';
                    }
                }
            } catch (propErr) {
                console.warn('Could not query photo plan service for property:', propErr);
            }
        }

        // If found in PTIS Document storage, fetch it
        if (planDocumentGuid) {
            const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || 'https://localhost:7293';
            try {
                const docRes = await fetch(`${backendBaseUrl}/api/documents/${planDocumentGuid}/view`, {
                    cache: 'no-store',
                    headers: { 'Accept': '*/*' },
                });
                if (docRes.ok) {
                    const contentType = docRes.headers.get('content-type') || '';
                    if (contentType.includes('svg') || (planFileName && planFileName.endsWith('.svg'))) {
                        const svgText = await docRes.text();
                        const extractRes = await fetch(`${extractionServiceUrl}/api/extract-rooms-json`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ svg_content: svgText, measurement_unit: params.measurementUnit })
                        });
                        if (extractRes.ok) {
                            const data: ExtractionResponseDto = await extractRes.json();
                            return { success: true, data };
                        }
                    } else {
                        const buffer = await docRes.arrayBuffer();
                        const base64 = Buffer.from(buffer).toString('base64');
                        const extractRes = await fetch(`${extractionServiceUrl}/api/extract-rooms-json`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ image_base64: base64, measurement_unit: params.measurementUnit })
                        });
                        if (extractRes.ok) {
                            const data: ExtractionResponseDto = await extractRes.json();
                            return { success: true, data };
                        } else {
                            const errBody = await extractRes.text();
                            return { success: false, error: `Extraction error on uploaded photo: ${errBody}` };
                        }
                    }
                }
            } catch (docErr) {
                console.warn('Could not fetch from document storage directly:', docErr);
                return { success: false, error: 'Could not fetch uploaded plan photo from document storage.' };
            }
        }

        // 3. Fallback: Fetch directly from CAD drawing tool only if wardNo and propertyNo are provided
        if (!params.wardNo || !params.propertyNo) {
            return { success: false, error: "No floor plan drawing or photo found for this property. Please upload a plan photo first." };
        }

        const councilName = process.env.NEXT_PUBLIC_COUNCIL_NAME || 'THANE_survey';
        let planName = '';
        const cleanPart = params.partitionNo?.trim() || '';
        if (cleanPart && cleanPart !== '-' && cleanPart !== '0') {
            const letterMatch = cleanPart.match(/^([A-Za-z]+)(\d+)?$/);
            if (letterMatch) {
                planName = `${params.wardNo}-${letterMatch[1]}-${params.propertyNo}-${letterMatch[2] || '1'}`;
            } else {
                planName = `${params.wardNo}-${cleanPart}-${params.propertyNo}`;
            }
        } else {
            planName = `${params.wardNo}-${params.propertyNo}`;
        }

        // Only search candidates for THIS specific property and partition
        const planCandidates = Array.from(new Set([
            planName,
            cleanPart ? `${params.wardNo}-${params.propertyNo}-${cleanPart}` : null,
            cleanPart ? `${params.wardNo}-${cleanPart}-${params.propertyNo}` : null
        ].filter((p): p is string => Boolean(p))));

        const authRes = await fetch('https://apiptisplanapp.tabamc.in/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'tejas.d',
                password: '123456',
                councilName: 'THANE_survey',
            }),
        });

        if (authRes.ok) {
            const authData = await authRes.json();
            const token = authData.token || authData.access_token || authData.data?.token;
            if (token) {
                interface CadWallItem {
                    start?: { x: number; y: number };
                    end?: { x: number; y: number };
                }
                interface CadAnnotationItem {
                    position?: { x: number; y: number };
                    text?: string;
                    wrapWidth?: number | string;
                }
                interface CadPlanData {
                    walls?: CadWallItem[];
                    annotations?: CadAnnotationItem[];
                }

                let planData: CadPlanData | null = null;
                for (const candidate of planCandidates) {
                    try {
                        const planRes = await fetch(`https://apiptisplanapp.tabamc.in/api/plans/${encodeURIComponent(councilName)}/${encodeURIComponent(candidate)}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (planRes.ok) {
                            const json = await planRes.json();
                            if ((json.walls && json.walls.length > 0) || (json.annotations && json.annotations.length > 0)) {
                                planData = json;
                                break;
                            }
                        }
                    } catch (cadErr) {
                        console.warn(`Error trying CAD candidate ${candidate}:`, cadErr);
                    }
                }

                if (planData) {
                    const walls: CadWallItem[] = Array.isArray(planData.walls) ? planData.walls : [];
                    const annotations: CadAnnotationItem[] = Array.isArray(planData.annotations) ? planData.annotations : [];

                    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                    walls.forEach((w) => {
                        if (w.start) { minX = Math.min(minX, Number(w.start.x)); minY = Math.min(minY, Number(w.start.y)); maxX = Math.max(maxX, Number(w.start.x)); maxY = Math.max(maxY, Number(w.start.y)); }
                        if (w.end) { minX = Math.min(minX, Number(w.end.x)); minY = Math.min(minY, Number(w.end.y)); maxX = Math.max(maxX, Number(w.end.x)); maxY = Math.max(maxY, Number(w.end.y)); }
                    });
                    annotations.forEach((a) => {
                        if (a.position) {
                            const px = Number(a.position.x); const py = Number(a.position.y);
                            minX = Math.min(minX, px); minY = Math.min(minY, py); maxX = Math.max(maxX, px + (Number(a.wrapWidth) || 120)); maxY = Math.max(maxY, py + 50);
                        }
                    });
                    if (!isFinite(minX)) { minX = 0; minY = 0; maxX = 600; maxY = 600; }
                    const p = 40;
                    const vbX = Math.floor(minX - p), vbY = Math.floor(minY - p);
                    const vbW = Math.max(300, Math.ceil(maxX - minX + p * 2)), vbH = Math.max(300, Math.ceil(maxY - minY + p * 2));
                    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX} ${vbY} ${vbW} ${vbH}">\n`;
                    walls.forEach((w) => {
                        if (w.start && w.end) svg += `<line x1="${w.start.x}" y1="${w.start.y}" x2="${w.end.x}" y2="${w.end.y}" stroke="#008000" stroke-width="4"/>\n`;
                    });
                    annotations.forEach((a) => {
                        if (a.position && a.text) {
                            const lines = String(a.text).split('\n');
                            svg += `<text x="${a.position.x}" y="${a.position.y}">\n`;
                            lines.forEach((l, idx) => { svg += `<tspan x="${a.position.x}" dy="${idx === 0 ? 0 : 20}">${l}</tspan>\n`; });
                            svg += `</text>\n`;
                        }
                    });
                    svg += `</svg>`;

                    const extractRes = await fetch(`${extractionServiceUrl}/api/extract-rooms-json`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ svg_content: svg, measurement_unit: params.measurementUnit })
                    });
                    if (extractRes.ok) {
                        const data: ExtractionResponseDto = await extractRes.json();
                        return { success: true, data };
                    }
                }
            }
        }

        return { success: false, error: "No floor plan drawing or photo found for this property. Please draw or upload a plan first." };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Failed to extract rooms from floor plan" };
    }
}


