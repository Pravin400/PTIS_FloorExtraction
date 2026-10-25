import { apiClient } from "@/services/api.service";
import { ApiResponse } from "@/types/common.types";
import {
    PropertySocialInfoApiResponse,
    UpsertPropertySocialInfoDto,
    UpsertPropertySocialInfoApiResponse,
    CreatePropertySocialDetailDto,
    UpdatePropertySocialDetailDto,
    CreateBulkPropertySocialDetailDto,
    PropertySocialDetailsDto,   
    DeletePropertySocialDetailsByHierarchyParams,
    PropertySocialInfoBulkResponseDto,
    UpsertPropertySocialInfoBulkDto,
    PropertySocialDetailsFilterResponseDto,
    AppliedSocialAttributeDto,
    NonAppliedSocialAttributeDto
} from "@/types/property-social-details.types";
import { DiscountDocumentUploadResponseDto } from "@/types/discount.types";
import { uploadDocument, deleteDocument } from "./document.service";
import { DocumentUploadParams } from "@/types/document.types";
import { DEPARTMENT_ID, MODULE_ID, REFERENCE_TABLE, BINDING_PURPOSE, DOCUMENT_TYPE } from "../constants/document.constants";
import { normalizeUploadResponse } from "@/lib/utils/ptis/social-details/social-details-utils";

/**
 * Get social information for a given property
 */
export async function getPropertySocialInfo(propertyId: string): Promise<ApiResponse<PropertySocialInfoApiResponse>> {
    const response = await apiClient.get<PropertySocialInfoApiResponse>(`/PropertySocialDetails/property/${propertyId}/social-info`);
    return response;
}

/**
 * Upsert social details
 */
export async function upsertPropertySocialInfo(payload: UpsertPropertySocialInfoDto): Promise<ApiResponse<UpsertPropertySocialInfoApiResponse>> {
    const response = await apiClient.put<UpsertPropertySocialInfoApiResponse>("/PropertySocialDetails/upsert", payload);
    return response;
}

/**
 * Create a single social detail directly via POST for apartment, wing, or unit level
 * Endpoint: POST /PropertySocialDetails
 */
export async function createPropertySocialDetail(payload: CreatePropertySocialDetailDto): Promise<ApiResponse<PropertySocialDetailsDto>> {    
    const response = await apiClient.post<unknown>("/PropertySocialDetails", payload);    
    if (!response.success || !response.data) {
        return {
            success: response.success,
            statusCode: response.statusCode,
            error: response.error,
        };
    }
    const raw = response.data as Record<string, unknown>;
    const itemData = (raw.items || raw.Items || raw.data || raw.Data || raw) as Record<string, unknown>;
    return {
        success: true,
        statusCode: response.statusCode,
        message: (raw.message as string) || response.message,
        data: normalizePropertySocialDetailsDto(itemData)
    };
}

/**
 * Get a single social detail by its ID
 * Endpoint: GET /PropertySocialDetails/{id}
 */
export async function getPropertySocialDetailById(id: number): Promise<ApiResponse<PropertySocialDetailsDto>> {
    const response = await apiClient.get<unknown>(`/PropertySocialDetails/${id}`);
    if (!response.success || !response.data) {
        return {
            success: response.success,
            statusCode: response.statusCode,
            error: response.error,
        };
    }
    const raw = response.data as Record<string, unknown>;
    const itemData = (raw.items || raw.Items || raw.data || raw.Data || raw) as Record<string, unknown>;
    return {
        success: true,
        statusCode: response.statusCode,
        message: (raw.message as string) || response.message,
        data: normalizePropertySocialDetailsDto(itemData)
    };
}

/**
 * Update an existing single social detail via PUT
 * Endpoint: PUT /PropertySocialDetails/{id}
 */
export async function updatePropertySocialDetail(id: number, payload: UpdatePropertySocialDetailDto): Promise<ApiResponse<PropertySocialDetailsDto>> {    
    const response = await apiClient.put<unknown>(`/PropertySocialDetails/${id}`, payload);    
    if (!response.success) {
        return {
            success: false,
            statusCode: response.statusCode,
            error: response.error,
        };
    }
    const raw = (response.data || {}) as Record<string, unknown>;
    const itemData = (raw.items || raw.Items || raw.data || raw.Data || raw) as Record<string, unknown>;
    return {
        success: true,
        statusCode: response.statusCode,
        message: (raw.message as string) || response.message,
        data: itemData && typeof itemData === 'object' && Object.keys(itemData).length > 0 ? normalizePropertySocialDetailsDto(itemData) : undefined
    };
}

/**
 * Create bulk social details via POST for multiple unit property IDs
 * Endpoint: POST /PropertySocialDetails/Bulk/by-property-ids
 */
export async function createBulkPropertySocialDetail(payload: CreateBulkPropertySocialDetailDto): Promise<ApiResponse<PropertySocialDetailsDto[]>> {    
    const response = await apiClient.post<unknown>("/PropertySocialDetails/Bulk/by-property-ids", payload);    
    if (!response.success || !response.data) {
        return {
            success: response.success,
            statusCode: response.statusCode,
            error: response.error,
            data: []
        };
    }
    const raw = response.data as Record<string, unknown>;
    const itemsContainer = (raw.items || raw.Items || raw.data || raw.Data || raw) as Record<string, unknown>;
    let list: unknown[] = [];
    if (Array.isArray(itemsContainer)) {
        list = itemsContainer;
    } else if (itemsContainer && typeof itemsContainer === 'object') {
        if (Array.isArray(itemsContainer.successItems)) list = itemsContainer.successItems;
        else if (Array.isArray(itemsContainer.SuccessItems)) list = itemsContainer.SuccessItems;
        else if (Array.isArray(itemsContainer.items)) list = itemsContainer.items;
        else if (Array.isArray(itemsContainer.Items)) list = itemsContainer.Items;
    }
    return {
        success: true,
        statusCode: response.statusCode,
        message: (raw.message as string) || response.message,
        data: list.filter(isPropertySocialDetailsShape).map(normalizePropertySocialDetailsDto)
    };
}

/**
 * Type guard for PropertySocialDetails shape
 */
export function isPropertySocialDetailsShape(value: unknown): value is Record<string, unknown> {
    if (typeof value !== 'object' || value === null) return false;
    const obj = value as Record<string, unknown>;
    const id = Number(obj.id ?? obj.Id ?? obj.propertySocialDetailId ?? obj.PropertySocialDetailId ?? 0);
    const socialAttributeId = Number(
        obj.socialAttributeId ??
        obj.SocialAttributeId ??
        obj.socialAtrributeId ??
        obj.SocialAtrributeId ??
        obj.societyAttributeId ??
        obj.SocietyAttributeId ??
        obj.attributeId ??
        obj.AttributeId ??
        0
    );
    return (Number.isFinite(id) && id > 0) || (Number.isFinite(socialAttributeId) && socialAttributeId > 0);
}

/**
 * Normalizes property social details DTO from API response (supporting PascalCase and camelCase)
 */
export function normalizePropertySocialDetailsDto(raw: Record<string, unknown>): PropertySocialDetailsDto {
    const id = Number(raw.id ?? raw.Id ?? raw.propertySocialDetailId ?? raw.PropertySocialDetailId ?? 0);
    const rawPropId = raw.propertyId ?? raw.PropertyId;
    const propertyId = rawPropId != null && rawPropId !== '' ? Number(rawPropId) : 0;
    const socialAttributeId = Number(
        raw.socialAttributeId ??
        raw.SocialAttributeId ??
        raw.socialAtrributeId ??
        raw.SocialAtrributeId ??
        raw.societyAttributeId ??
        raw.SocietyAttributeId ??
        raw.attributeId ??
        raw.AttributeId ??
        0
    );

    const rawBit = raw.bitValue ?? raw.BitValue;
    const bitValue =
        typeof rawBit === 'boolean'
            ? rawBit
            : rawBit != null
                ? String(rawBit).trim().toLowerCase() === 'true' || String(rawBit).trim() === '1'
                : null;

    const rawInt = raw.intValue ?? raw.IntValue;
    const intValue = rawInt != null && rawInt !== '' ? Number(rawInt) : null;

    const rawDec = raw.decimalValue ?? raw.DecimalValue;
    const decimalValue = rawDec != null && rawDec !== '' ? Number(rawDec) : null;

    const rawText = raw.textValue ?? raw.TextValue;
    const textValue = rawText != null ? String(rawText) : null;

    const rawDate = raw.dateValue ?? raw.DateValue;
    const dateValue = rawDate != null ? String(rawDate) : null;

    const rawRemark = raw.remark ?? raw.Remark;
    const remark = rawRemark != null ? String(rawRemark) : null;

    const rawActive = raw.isActive ?? raw.IsActive;
    const isActive =
        typeof rawActive === 'boolean'
            ? rawActive
            : rawActive != null
                ? String(rawActive).trim().toLowerCase() === 'true' || String(rawActive).trim() === '1'
                : true;

    const rawWingId = raw.wingDetailId ?? raw.WingDetailId ?? raw.wingId ?? raw.WingId;
    const wingDetailId = rawWingId != null && rawWingId !== '' ? Number(rawWingId) : null;

    const rawSocId = raw.societyDetailId ?? raw.SocietyDetailId ?? raw.societyId ?? raw.SocietyId;
    const societyDetailId = rawSocId != null && rawSocId !== '' ? Number(rawSocId) : null;

    const rawEntityType = raw.entityType ?? raw.EntityType;
    const entityType = rawEntityType != null ? String(rawEntityType) : null;

    const rawInheritedFrom = raw.inheritedFrom ?? raw.InheritedFrom;
    const inheritedFrom = rawInheritedFrom != null ? String(rawInheritedFrom) : null;

    const rawInheritanceLevel = raw.inheritanceLevel ?? raw.InheritanceLevel;
    let inheritanceLevel: string | null = rawInheritanceLevel != null ? String(rawInheritanceLevel) : null;
    if (!inheritanceLevel) {
        if (inheritedFrom) {
            inheritanceLevel = inheritedFrom;
        } else if (entityType === 'S') {
            inheritanceLevel = 'Apartment';
        } else if (entityType === 'W') {
            inheritanceLevel = 'Wing';
        } else if (entityType === 'P') {
            inheritanceLevel = 'Self';
        }
    }

    const rawCode = raw.socialAttributeCode ?? raw.SocialAttributeCode;
    const socialAttributeCode = rawCode != null ? String(rawCode) : null;

    const rawName = raw.socialAttributeName ?? raw.SocialAttributeName;
    const socialAttributeName = rawName != null ? String(rawName) : null;

    const rawDocGuid = raw.documentGuid ?? raw.DocumentGuid ?? raw.photoGuid ?? raw.PhotoGuid ?? raw.guid ?? raw.Guid ?? raw.fileGuid;
    const documentGuid = rawDocGuid != null && rawDocGuid !== '' ? String(rawDocGuid) : null;

    const rawFileName = raw.fileName ?? raw.FileName ?? raw.originalFileName ?? raw.OriginalFileName;
    const fileName = rawFileName != null && rawFileName !== '' ? String(rawFileName) : null;

    const rawPhotoGuid = raw.photoGuid ?? raw.PhotoGuid ?? raw.documentGuid ?? raw.DocumentGuid ?? raw.guid ?? raw.Guid ?? raw.fileGuid;
    const photoGuid = rawPhotoGuid != null && rawPhotoGuid !== '' ? String(rawPhotoGuid) : null;

    const rawPhotoId = raw.photoBindingId ?? raw.PhotoBindingId ?? raw.documentBindingId ?? raw.DocumentBindingId;
    const photoBindingId = rawPhotoId != null && rawPhotoId !== '' ? Number(rawPhotoId) : null;

    const rawDocId = raw.documentBindingId ?? raw.DocumentBindingId ?? raw.photoBindingId ?? raw.PhotoBindingId;
    const documentBindingId = rawDocId != null && rawDocId !== '' ? Number(rawDocId) : null;

    const resolvedGuid = documentGuid || photoGuid;
    const documentUrl = resolvedGuid ? `/api/documents/${encodeURIComponent(resolvedGuid)}/view` : (raw.documentUrl ? String(raw.documentUrl) : null);

    const rawPercent = raw.percentage ?? raw.Percentage;
    const percentage = rawPercent != null && rawPercent !== '' ? Number(rawPercent) : null;

    const rawAmount = raw.amount ?? raw.Amount;
    const amount = rawAmount != null && rawAmount !== '' ? Number(rawAmount) : null;

    const rawWingName = raw.wingName ?? raw.WingName;
    const wingName = rawWingName != null ? String(rawWingName) : null;

    const rawUnitNo = raw.unitNo ?? raw.UnitNo ?? raw.flatNo ?? raw.FlatNo;
    const unitNo = rawUnitNo != null ? String(rawUnitNo) : null;

    const rawPartitionNo = raw.partitionNo ?? raw.PartitionNo;
    const partitionNo = rawPartitionNo != null ? String(rawPartitionNo) : null;

    const rawDisc = raw.isDiscountApplicable ?? raw.IsDiscountApplicable;
    const isDiscountApplicable =
        typeof rawDisc === 'boolean'
            ? rawDisc
            : rawDisc != null
                ? String(rawDisc).trim().toLowerCase() === 'true' || String(rawDisc).trim() === '1'
                : undefined;

    const rawCommon = raw.isCommonAreaAttribute ?? raw.IsCommonAreaAttribute;
    const isCommonAreaAttribute =
        typeof rawCommon === 'boolean'
            ? rawCommon
            : rawCommon != null
                ? String(rawCommon).trim().toLowerCase() === 'true' || String(rawCommon).trim() === '1'
                : undefined;

    return {
        id,
        propertyId,
        socialAttributeId,
        bitValue,
        intValue,
        decimalValue,
        textValue,
        dateValue,
        documentBindingId,
        remark,
        socialAttributeCode,
        socialAttributeName,
        isActive,
        isCommonAreaAttribute,
        documentGuid,
        fileName,
        documentUrl,
        photoGuid,
        photoBindingId,
        wingDetailId,
        societyDetailId,
        wingName,
        unitNo,
        partitionNo,
        entityType,
        inheritedFrom,
        inheritanceLevel,
        percentage,
        amount,
        isDiscountApplicable,
    };
}

/**
 * Get property social details by filters
 */
export async function getPropertySocialDetailsByFilters(
    socialAttributeId?: number,
    societyDetailId?: number,
    wingDetailId?: number,
    propertyId?: number,
    entityType?: string,
    allLevels?: boolean
): Promise<PropertySocialDetailsDto[] | null> {
    const params = new URLSearchParams();
    if (socialAttributeId) {
        params.append('socialAttributeId', socialAttributeId.toString());
    }
    if (societyDetailId) {
        params.append('societyDetailId', societyDetailId.toString());
    }
    if (wingDetailId) {
        params.append('wingDetailId', wingDetailId.toString());
    }
    if (propertyId) {
        params.append('propertyId', propertyId.toString());
    }
    if (entityType) {
        params.append('entityType', entityType);
    }
    if (allLevels !== undefined && allLevels !== null) {
        params.append('allLevels', allLevels.toString());
    }

    const url = `/PropertySocialDetails/by-filters?${params.toString()}`;
    const response = await apiClient.get<unknown>(url);

    if (!response.success || response.data === undefined || response.data === null) {
        return null;
    }

    const rawData = response.data;
    let list: unknown[] = [];
    if (Array.isArray(rawData)) {
        list = rawData;
    } else if (typeof rawData === 'object' && rawData !== null) {
        const obj = rawData as Record<string, unknown>;

        // Check all potential nested containers: obj, obj.items, obj.Items, obj.data, obj.Data
        const candidateContainers: Record<string, unknown>[] = [
            obj,
            typeof obj.items === 'object' && obj.items !== null && !Array.isArray(obj.items) ? (obj.items as Record<string, unknown>) : null,
            typeof obj.Items === 'object' && obj.Items !== null && !Array.isArray(obj.Items) ? (obj.Items as Record<string, unknown>) : null,
            typeof obj.data === 'object' && obj.data !== null && !Array.isArray(obj.data) ? (obj.data as Record<string, unknown>) : null,
            typeof obj.Data === 'object' && obj.Data !== null && !Array.isArray(obj.Data) ? (obj.Data as Record<string, unknown>) : null,
        ].filter((c): c is Record<string, unknown> => c !== null);

        for (const container of candidateContainers) {
            if (Array.isArray(container.appliedAttributes)) {
                list = container.appliedAttributes;
                break;
            }
            if (Array.isArray(container.AppliedAttributes)) {
                list = container.AppliedAttributes;
                break;
            }
        }

        if (list.length === 0) {
            if (Array.isArray(obj.items)) list = obj.items;
            else if (Array.isArray(obj.Items)) list = obj.Items;
            else if (Array.isArray(obj.data)) list = obj.data;
            else if (Array.isArray(obj.Data)) list = obj.Data;
            else if (Array.isArray(obj.result)) list = obj.result;
            else if (Array.isArray(obj.Result)) list = obj.Result;
            else if (Array.isArray(obj.propertySocialDetails)) list = obj.propertySocialDetails;
            else if (Array.isArray(obj.PropertySocialDetails)) list = obj.PropertySocialDetails;
        }
    }

    return list.filter(isPropertySocialDetailsShape).map(normalizePropertySocialDetailsDto);
}

/**
 * Get property social details filter response (applied + non-applied)
 * Endpoint: GET /PropertySocialDetails/by-filters
 */
export async function getPropertySocialDetailsFilterResponse(params: {
    socialAttributeId?: number;
    societyDetailId?: number;
    wingDetailId?: number;
    propertyId?: number;
}): Promise<ApiResponse<PropertySocialDetailsFilterResponseDto>> {
    const queryParams = new URLSearchParams();
    if (params.socialAttributeId) queryParams.append("socialAttributeId", params.socialAttributeId.toString());
    if (params.societyDetailId) queryParams.append("societyDetailId", params.societyDetailId.toString());
    if (params.wingDetailId) queryParams.append("wingDetailId", params.wingDetailId.toString());
    if (params.propertyId) queryParams.append("propertyId", params.propertyId.toString());

    const response = await apiClient.get<unknown>(`/PropertySocialDetails/by-filters?${queryParams.toString()}`);
    if (!response.success || !response.data) {
        return {
            success: response.success,
            statusCode: response.statusCode,
            error: response.error,
            data: { appliedAttributes: [], nonAppliedAttributes: [] }
        };
    }

    const raw = response.data as Record<string, unknown>;
    const container = (raw.items || raw.Items || raw.data || raw.Data || raw) as Record<string, unknown>;
    const appliedRaw = (container?.appliedAttributes || container?.AppliedAttributes || []) as unknown[];
    const nonAppliedRaw = (container?.nonAppliedAttributes || container?.NonAppliedAttributes || []) as unknown[];

    return {
        success: true,
        statusCode: response.statusCode,
        message: (raw.message as string) || response.message,
        data: {
            appliedAttributes: Array.isArray(appliedRaw) ? (appliedRaw as AppliedSocialAttributeDto[]) : [],
            nonAppliedAttributes: Array.isArray(nonAppliedRaw) ? (nonAppliedRaw as NonAppliedSocialAttributeDto[]) : []
        }
    };
}

/**
 * Upload a photo for a social detail attribute using the global document API
 */
export async function uploadSocialPhotoViaGlobalApi(
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
            moduleId: MODULE_ID.PropertySocialDetails,
            referenceTableName: REFERENCE_TABLE.PropertyDiscount,
            bindingPurpose: BINDING_PURPOSE.Photo,
            documentType: DOCUMENT_TYPE.Photo,
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
 * Replace an existing social detail photo using the global document API
 */
export async function replaceSocialPhotoViaGlobalApi(
    file: File,
    oldDocumentGuid: string,
    propertyId: number,
    socialAttributeId: number,
    propertySocialDetailId: number,
    referenceTableIdGuid?: string,
    remark?: string
): Promise<ApiResponse<DiscountDocumentUploadResponseDto>> {
    try {
        const uploadResult = await uploadSocialPhotoViaGlobalApi(
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

        if (oldDocumentGuid) {
            await deleteDocument(oldDocumentGuid);
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
 * Delete a social detail document using the global document API
 */
export async function deleteSocialPhotoViaGlobalApi(documentGuid: string): Promise<ApiResponse<void>> {
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

/**
 * Delete property social detail record by PropertyId and SocialAttributeId (marks record for deletion)
 */
export async function deletePropertySocialDetail(propertyId: string, socialAttributeId: number): Promise<ApiResponse<void>> {
    try {
        const params = new URLSearchParams({
            propertyId: String(propertyId),
            socialAttributeId: String(socialAttributeId)
        });
        const response = await apiClient.delete<void>(`/PropertySocialDetails?${params.toString()}`);
        return response;
    } catch (error: unknown) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

/**
 * Delete property social details by hierarchy (wing/apartment/society/unit wise)
 * Endpoint: /PropertySocialDetails/by-hierarchy
 */
export async function deletePropertySocialDetailsByHierarchy(
    params: DeletePropertySocialDetailsByHierarchyParams
): Promise<ApiResponse<void>> {
    try {
        const queryParams = new URLSearchParams();

        if (params.entityType) {
            queryParams.append("entityType", params.entityType);
        }
        if (params.societyAttributeId !== undefined && params.societyAttributeId !== null) {
            queryParams.append("societyAttributeId", params.societyAttributeId.toString());
        }
        if (params.socialAttributeId !== undefined && params.socialAttributeId !== null) {
            queryParams.append("socialAttributeId", params.socialAttributeId.toString());
        }
        if (params.societyDetailsId !== undefined && params.societyDetailsId !== null) {
            queryParams.append("societyDetailsId", params.societyDetailsId.toString());
        } else if (params.societyDetailId !== undefined && params.societyDetailId !== null) {
            queryParams.append("societyDetailsId", params.societyDetailId.toString());
        }
        if (params.wingDetailId !== undefined && params.wingDetailId !== null) {
            queryParams.append("wingDetailId", params.wingDetailId.toString());
        }
        if (params.documentBindingId !== undefined && params.documentBindingId !== null) {
            queryParams.append("documentBindingId", params.documentBindingId.toString());
        }
        if (params.propertyId !== undefined && params.propertyId !== null) {
            queryParams.append("propertyId", params.propertyId.toString());
        }
        if (params.propertyIds) {
            const idsStr = Array.isArray(params.propertyIds)
                ? params.propertyIds.filter((id) => id != null && !Number.isNaN(Number(id))).join(",")
                : String(params.propertyIds).trim();
            if (idsStr) {
                queryParams.append("propertyIds", idsStr);
            }
        } else if (params.propertyId !== undefined && params.propertyId !== null) {
            queryParams.append("propertyIds", params.propertyId.toString());
        }

        const queryString = queryParams.toString();
        const endpoint = `/PropertySocialDetails/by-apartment-wing-unit${queryString ? `?${queryString}` : ""}`;
        const response = await apiClient.delete<void>(endpoint);
        return response;

    } catch (error: unknown) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

/**
 * Get social information filtered by propertyId, societyDetailId, or wingDetailId
 * Endpoint: /PropertySocialDetails/social-info-filterby
 */
export async function getPropertySocialInfoFilterBy(params: {
    propertyId?: number | null;
    societyDetailId?: number | null;
    wingDetailId?: number | null;
}): Promise<ApiResponse<PropertySocialInfoApiResponse>> {
    const query = new URLSearchParams();
    if (params.propertyId != null && params.propertyId > 0) query.append("propertyId", params.propertyId.toString());
    if (params.societyDetailId != null && params.societyDetailId > 0) query.append("societyDetailId", params.societyDetailId.toString());
    if (params.wingDetailId != null && params.wingDetailId > 0) query.append("wingDetailId", params.wingDetailId.toString());

    const response = await apiClient.get<PropertySocialInfoBulkResponseDto>(`/PropertySocialDetails/social-info-filterby?${query.toString()}`);
    return {
        ...response,
        data: response.data ? {
            success: response.success,
            message: response.message || "Property social information retrieved successfully",
            items: {
                propertyId: response.data.propertyId || 0,
                socialAttributes: response.data.socialAttributes || []
            }
        } : undefined
    };
}

/**
 * Upsert social details filtered by propertyId, societyDetailId, or wingDetailId
 * Endpoint: /PropertySocialDetails/upsert-filterby
 */
export async function upsertPropertySocialInfoFilterBy(
    payload: UpsertPropertySocialInfoBulkDto
): Promise<ApiResponse<PropertySocialDetailsDto[]>> {
    const response = await apiClient.put<unknown>("/PropertySocialDetails/upsert-filterby", payload);
    if (!response.success || !response.data) {
        return {
            success: response.success,
            statusCode: response.statusCode,
            error: response.error,
            data: []
        };
    }
    const raw = response.data as Record<string, unknown> | PropertySocialDetailsDto[];
    const items: PropertySocialDetailsDto[] = Array.isArray(raw)
        ? (raw as PropertySocialDetailsDto[])
        : Array.isArray((raw as { items?: unknown[] }).items)
            ? ((raw as { items: PropertySocialDetailsDto[] }).items)
            : Array.isArray((raw as { data?: unknown[] }).data)
                ? ((raw as { data: PropertySocialDetailsDto[] }).data)
                : [];

    return {
        success: true,
        statusCode: response.statusCode,
        message: (raw as { message?: string }).message || response.message,
        data: items
    };
}

