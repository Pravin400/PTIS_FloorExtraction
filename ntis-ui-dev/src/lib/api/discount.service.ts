import { apiClient } from "@/services/api.service";
import { handleApiResponse } from "@/lib/utils/api";
import { getTranslations } from "next-intl/server";
import { ApiResponse } from "@/types/common.types";
import {
    PropertyDiscountInfoResponseDto,
    DiscountDocumentUploadResponseDto,
    UpsertPropertyDiscountInfoDto
} from "@/types/discount.types";
import { uploadDocument, deleteDocument } from "./document.service";
import { DocumentUploadParams } from "@/types/document.types";
import { DEPARTMENT_ID, MODULE_ID, REFERENCE_TABLE, BINDING_PURPOSE, DOCUMENT_TYPE } from "../constants/document.constants";
import { WingOption, UnitSelectionItem } from "@/types/building-permission.types";
import { normalizeUploadResponse } from "@/lib/utils/ptis/social-details/social-details-utils";

interface BackendApiResponseWrapper<T> {
    success: boolean;
    message?: string;
    items: T;
    errors?: string[];
}

/**
 * Get discount details for a given property
 */
export async function getDiscountDetails(propertyId: string): Promise<ApiResponse<PropertyDiscountInfoResponseDto>> {
    const response = await apiClient.get<BackendApiResponseWrapper<PropertyDiscountInfoResponseDto>>(`/Property/${propertyId}/discount-details`);
    if (response.success && response.data) {
        return {
            success: response.data.success,
            statusCode: response.statusCode,
            data: response.data.items,
            message: response.data.message
        };
    }
    return {
        success: false,
        statusCode: response.statusCode,
        error: response.error
    };
}

/**
 * Update discount details for a given property
 */
export async function updateDiscountDetails(propertyId: string, data: UpsertPropertyDiscountInfoDto): Promise<ApiResponse<PropertyDiscountInfoResponseDto>> {
    const response = await apiClient.put<BackendApiResponseWrapper<PropertyDiscountInfoResponseDto>>(`/Property/${propertyId}/discount-details`, data);

    if (response.success && response.data) {
        return {
            success: response.data.success,
            statusCode: response.statusCode,
            data: response.data.items,
            message: response.data.message,
            error: response.data.success ? undefined : response.data.message
        };
    }
    return {
        success: false,
        statusCode: response.statusCode,
        error: response.error
    };
}

/**
 * Upload a discount-related document using the global documents API
 */
export async function uploadDiscountDocViaGlobalApi(
    file: File, 
    propertyId: number, 
    socialAttributeId: number, 
    propertySocialDetailId: number,
    referenceTableIdGuid?: string,
    remark?: string
): Promise<ApiResponse<DiscountDocumentUploadResponseDto>> {
    try {
        const uploadParams: DocumentUploadParams = {
            departmentId: DEPARTMENT_ID.PTIS,
            moduleId: MODULE_ID.PropertyDiscount,
            referenceTableName: REFERENCE_TABLE.PropertyDiscount,
            bindingPurpose: BINDING_PURPOSE.ProofDocument,
            documentType: DOCUMENT_TYPE.Proof,
            isPrimaryDocument: true
        };

        if (propertySocialDetailId > 0) {
            uploadParams.referenceTableId = propertySocialDetailId;
        } else if (referenceTableIdGuid) {
            uploadParams.referenceTableIdGuid = referenceTableIdGuid;
        }

        const uploadResponse = await uploadDocument(file, uploadParams);
        const { documentBindingId, documentGuid, fileName } = normalizeUploadResponse(uploadResponse, file);

        return {
            success: true,
            data: {
                propertySocialDetailId: propertySocialDetailId > 0 ? propertySocialDetailId : null,
                propertyId: propertyId,
                socialAttributeId: socialAttributeId,
                documentBindingId,
                documentGuid,
                documentUrl: documentGuid ? `/api/documents/${encodeURIComponent(documentGuid)}/view` : undefined,
                fileName,
                remark: remark || null
            }
        };
    } catch (error: unknown) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

/**
 * Replace a discount-related document using the global documents API
 */
export async function replaceDiscountDocViaGlobalApi(
    file: File, 
    _oldDocumentGuid: string,
    propertyId: number, 
    socialAttributeId: number, 
    propertySocialDetailId: number,
    referenceTableIdGuid?: string,
    remark?: string
): Promise<ApiResponse<DiscountDocumentUploadResponseDto>> {
    try {
        const uploadResult = await uploadDiscountDocViaGlobalApi(
            file,
            propertyId,
            socialAttributeId,
            propertySocialDetailId,
            referenceTableIdGuid,
            remark
        );

        if (!uploadResult.success || !uploadResult.data) {
            return uploadResult;
        }

        return uploadResult;
    } catch (error: unknown) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

/**
 * Delete a discount detail document using the global documents API
 */
export async function deleteDiscountDoc(documentGuid: string): Promise<ApiResponse<void>> {
    try {
        const result = await deleteDocument(documentGuid);
        return result;
    } catch (error: unknown) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

import { getWingDetailsMastBySocietyDetailsMastId } from "./wingDetailsMast.services";
import { WingDetailsMastItem } from "@/types/zone-master/properties/wingDetailsMast.types";
import { logger } from "@/lib/utils/logger";

/**
 * Get wings for a given property
 */
export async function getDiscountWings(propertyId: string, societyId?: number | string | null): Promise<WingOption[]> {
    const propIdNum = Number(propertyId);
    const effectiveSocId = societyId && Number(societyId) > 0 ? Number(societyId) : undefined;

    if (effectiveSocId) {
        try {
            const wingDetailsRes = await getWingDetailsMastBySocietyDetailsMastId(effectiveSocId);
            const mastItems = Array.isArray(wingDetailsRes?.wingDetailsMast)
                ? wingDetailsRes.wingDetailsMast
                : Array.isArray((wingDetailsRes as unknown as Record<string, unknown>)?.items)
                ? (wingDetailsRes as unknown as Record<string, unknown>).items as WingDetailsMastItem[]
                : [];
            
            const seen = new Set<string>();
            const distinctWings: WingOption[] = [];
            for (const item of mastItems) {
                if (!item || item.isActive === false) continue;
                const name = (item.wingName || '').trim();
                const key = `${item.id}-${name.toLowerCase()}`;
                if (!seen.has(key) && name) {
                    seen.add(key);
                    distinctWings.push({
                        wingDetailId: item.id,
                        wingMasterId: item.wingMasterId,
                        wingName: name,
                        wingNo: name,
                        societyDetailId: item.societyDetailsMastId || effectiveSocId,
                    });
                }
            }
            if (distinctWings.length > 0) {
                return distinctWings;
            }
        } catch (err) {
            logger.debug('Failed to fetch from WingDetailsMast, trying property society details', { effectiveSocId, error: err instanceof Error ? err : new Error(String(err)) });
        }
    }

    if (propIdNum > 0) {
        try {
            const { getSocietyDetailsByProperty } = await import("./societyDetails.services");
            const socRes = await getSocietyDetailsByProperty(propIdNum);
            const socItems = Array.isArray(socRes?.items) ? socRes.items : [];
            for (const soc of socItems) {
                if (soc?.id && soc.id !== effectiveSocId) {
                    const wingDetailsRes = await getWingDetailsMastBySocietyDetailsMastId(soc.id);
                    const mastItems = Array.isArray(wingDetailsRes?.wingDetailsMast)
                        ? wingDetailsRes.wingDetailsMast
                        : Array.isArray((wingDetailsRes as unknown as Record<string, unknown>)?.items)
                        ? (wingDetailsRes as unknown as Record<string, unknown>).items as WingDetailsMastItem[]
                        : [];
                    
                    const seen = new Set<string>();
                    const distinctWings: WingOption[] = [];
                    for (const item of mastItems) {
                        if (!item || item.isActive === false) continue;
                        const name = (item.wingName || '').trim();
                        const key = `${item.id}-${name.toLowerCase()}`;
                        if (!seen.has(key) && name) {
                            seen.add(key);
                            distinctWings.push({
                                wingDetailId: item.id,
                                wingMasterId: item.wingMasterId,
                                wingName: name,
                                wingNo: name,
                                societyDetailId: item.societyDetailsMastId || soc.id,
                            });
                        }
                    }
                    if (distinctWings.length > 0) {
                        return distinctWings;
                    }
                }
            }
        } catch (err) {
            logger.warn('Failed to fetch SocietyDetails by propertyId for wings', { propIdNum, error: err instanceof Error ? err : new Error(String(err)) });
        }
    }

    let url = `/property-certificates/wings/${encodeURIComponent(propertyId)}`;
    if (societyId && String(societyId).trim() !== '') {
        url += `?societyId=${encodeURIComponent(String(societyId))}`;
    }
    const response = await apiClient.get<BackendApiResponseWrapper<WingOption[]>>(url);
    const t = await getTranslations("quickDataEntry");
    const responseData = handleApiResponse(response, t("building.errors.notFound") || "Failed to fetch wings");
    const rawList = Array.isArray(responseData.items) ? responseData.items : (Array.isArray(responseData) ? responseData as WingOption[] : []);

    const seenNames = new Set<string>();
    const distinctWings: WingOption[] = [];
    for (const w of rawList) {
        if (!w) continue;
        const name = (w.wingName || '').trim();
        const key = name.toLowerCase();
        if (name && !seenNames.has(key)) {
            seenNames.add(key);
            distinctWings.push({
                wingDetailId: w.wingDetailId,
                wingMasterId: w.wingMasterId,
                wingName: name,
                wingNo: w.wingNo || name,
                societyDetailId: w.societyDetailId || (effectiveSocId ? effectiveSocId : undefined),
            });
        }
    }
    return distinctWings;
}

/**
 * Get units for a given property and wing
 */
export async function getDiscountUnits(
    propertyId: string,
    wingDetailId?: number | null,
    pageNumber: number = 1,
    pageSize: number = 10
): Promise<{ items: UnitSelectionItem[]; totalCount?: number }> {
    const params = new URLSearchParams();
    params.append("pageNumber", pageNumber.toString());
    params.append("pageSize", pageSize.toString());
    if (wingDetailId) {
        params.append("wingDetailId", wingDetailId.toString());
    }

    const url = `/property-certificates/units/${propertyId}?${params.toString()}`;
    const response = await apiClient.get<BackendApiResponseWrapper<UnitSelectionItem[]> & { totalCount?: number }>(url);
    const t = await getTranslations("quickDataEntry");

    const responseData = handleApiResponse(response, t("building.errors.notFound") || "Failed to fetch units");
    
    const rawResponseData = response.data as unknown as Record<string, unknown>;
    const items = Array.isArray(responseData.items) ? responseData.items : (Array.isArray(responseData) ? responseData as UnitSelectionItem[] : []);
    const totalCount = typeof rawResponseData?.totalCount === 'number' ? rawResponseData.totalCount : undefined;

    return { items, totalCount };
}
