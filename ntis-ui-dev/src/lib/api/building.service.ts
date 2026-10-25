import { apiClient } from "@/services/api.service";
import { ApiResponse } from "@/types/common.types";
import { 
    PropertyCertificateWithStatusDto, 
    PropertyCertificateUploadResponseDto, 
    PropertyCertificateBulkSaveDto, 
    PropertyCertificateBulkSaveResponseDto,
    FloorCertificatesResponseDto,
    SaveCertificateResponseDto,
    SaveCertificateRequestDto
} from "@/types/building-permission.types";

interface BackendApiResponseWrapper<T> {
    success: boolean;
    message?: string;
    items: T;
    errors?: string[];
}

function normalizePropertyCertificateWithStatus(raw: unknown): PropertyCertificateWithStatusDto | null {
    if (!raw || typeof raw !== 'object') return null;
    const item = raw as Record<string, unknown>;
    const certificateTypeId = Number(item.certificateTypeId ?? item.CertificateTypeId ?? item.id ?? item.Id ?? 0);
    if (!certificateTypeId) return null;

    const propertyCertificateId = (item.propertyCertificateId ?? item.PropertyCertificateId ?? item.id ?? item.Id) != null
        ? Number(item.propertyCertificateId ?? item.PropertyCertificateId ?? item.id ?? item.Id)
        : null;
    const certificateNo = (item.certificateNo ?? item.CertificateNo ?? item.certificateNumber ?? item.CertificateNumber ?? item.number ?? item.Number) as string | null | undefined;
    const issueDate = (item.issueDate ?? item.IssueDate ?? item.certificateIssueDate ?? item.CertificateIssueDate ?? item.certificateDate ?? item.CertificateDate ?? item.date ?? item.Date) as string | null | undefined;
    const documentGuid = (item.documentGuid ?? item.DocumentGuid ?? item.guid ?? item.Guid ?? item.documentPath ?? item.DocumentPath ?? item.documentBindingId ?? item.DocumentBindingId) as string | null | undefined;
    const fileName = (item.fileName ?? item.FileName ?? item.documentName ?? item.DocumentName ?? item.name ?? item.Name) as string | null | undefined;
    const propertyDetailsId = (item.propertyDetailsId ?? item.PropertyDetailsId) != null
        ? Number(item.propertyDetailsId ?? item.PropertyDetailsId)
        : null;
    const propertyId = (item.propertyId ?? item.PropertyId) != null
        ? Number(item.propertyId ?? item.PropertyId)
        : null;
    const societyDetailId = (item.societyDetailId ?? item.SocietyDetailId) != null
        ? Number(item.societyDetailId ?? item.SocietyDetailId)
        : null;
    const wingDetailId = (item.wingDetailId ?? item.WingDetailId) != null
        ? Number(item.wingDetailId ?? item.WingDetailId)
        : null;

    const isActiveVal = item.isActive ?? item.IsActive;
    const hasCertVal = item.hasCertificate ?? item.HasCertificate;
    const hasAttachedData = Boolean(hasCertVal || (propertyCertificateId && propertyCertificateId > 0) || (certificateNo && String(certificateNo).trim() !== '') || (issueDate && String(issueDate).trim() !== '') || (documentGuid && String(documentGuid).trim() !== ''));

    return {
        certificateTypeId,
        certificateTypeName: String(item.certificateTypeName ?? item.CertificateTypeName ?? ''),
        certificateTypeCode: item.certificateTypeCode ? String(item.certificateTypeCode) : (item.CertificateTypeCode ? String(item.CertificateTypeCode) : undefined),
        displayOrder: Number(item.displayOrder ?? item.DisplayOrder ?? 0),
        hasCertificate: hasCertVal !== undefined ? Boolean(hasCertVal) : hasAttachedData,
        propertyCertificateId,
        isActive: isActiveVal !== undefined ? Boolean(isActiveVal) : hasAttachedData,
        certificateNo: certificateNo ? String(certificateNo).trim() : null,
        issueDate: issueDate ? String(issueDate).trim() : null,
        documentGuid: documentGuid ? String(documentGuid).trim() : null,
        fileName: fileName ? String(fileName).trim() : null,
        propertyDetailsId,
        propertyId,
        isProtected: item.isProtected !== undefined ? Boolean(item.isProtected) : (item.IsProtected !== undefined ? Boolean(item.IsProtected) : undefined),
        isRequired: item.isRequired !== undefined ? Boolean(item.isRequired) : (item.IsRequired !== undefined ? Boolean(item.IsRequired) : undefined),
        entityType: item.entityType ? String(item.entityType) : (item.EntityType ? String(item.EntityType) : (propertyId ? 'P' : undefined)),
        societyDetailId,
        wingDetailId,
    };
}

/* ---------------- BUILDING PERMISSIONS / PROPERTY CERTIFICATES ---------------- */

// 1. GET - Load all certificate types with their current status for a property
export async function getCertificateTypesWithStatus(
    propertyId: string,
    propertyDetailsId?: number | null
): Promise<ApiResponse<PropertyCertificateWithStatusDto[]>> {
    const url = propertyDetailsId !== undefined && propertyDetailsId !== null
        ? `/property-certificates/types-with-status/${propertyId}?propertyDetailsId=${propertyDetailsId}`
        : `/property-certificates/types-with-status/${propertyId}`;
    const response = await apiClient.get<BackendApiResponseWrapper<PropertyCertificateWithStatusDto[]>>(url);
    
    if (response.success && response.data) {
        const raw = response.data as unknown as Record<string, unknown>;
        const rawItems = (raw.items ?? raw.Items ?? raw.data ?? raw) as unknown[];
        const items = Array.isArray(rawItems)
            ? rawItems.map(normalizePropertyCertificateWithStatus).filter((item): item is PropertyCertificateWithStatusDto => item !== null)
            : [];
        return {
            success: (raw.success as boolean) ?? response.data.success ?? true,
            statusCode: response.statusCode,
            data: items,
            message: (raw.message as string) || response.message
        };
    }
    
    return {
        success: false,
        statusCode: response.statusCode,
        error: response.error,
        message: response.message
    };
}

// 1b. GET - Load certificate types with their current status for society/wing
export async function getSocietyWingTypesWithStatus(
    societyDetailId?: number | null,
    wingDetailId?: number | null
): Promise<ApiResponse<PropertyCertificateWithStatusDto[]>> {
    let url = `/property-certificates/society-wing-types-with-status`;
    const params = new URLSearchParams();
    if (societyDetailId) params.append("societyDetailId", societyDetailId.toString());
    if (wingDetailId) params.append("wingDetailId", wingDetailId.toString());
    
    if (params.toString()) {
        url += `?${params.toString()}`;
    }
    
    const response = await apiClient.get<BackendApiResponseWrapper<PropertyCertificateWithStatusDto[]>>(url);
    
    if (response.success && response.data) {
        const raw = response.data as unknown as Record<string, unknown>;
        const rawItems = (raw.items ?? raw.Items ?? raw.data ?? raw) as unknown[];
        const items = Array.isArray(rawItems)
            ? rawItems.map(normalizePropertyCertificateWithStatus).filter((item): item is PropertyCertificateWithStatusDto => item !== null)
            : [];
        return {
            success: (raw.success as boolean) ?? response.data.success ?? true,
            statusCode: response.statusCode,
            data: items,
            message: (raw.message as string) || response.message
        };
    }
    
    return {
        success: false,
        statusCode: response.statusCode,
        error: response.error,
        message: response.message
    };
}

// 1c. GET - Load property certificates by property ID (/property-certificates/by-property/{propertyId})
export async function getPropertyCertificatesByProperty(
    propertyId: string | number
): Promise<ApiResponse<PropertyCertificateWithStatusDto[]>> {
    try {
        const url = `/property-certificates/by-property/${propertyId}`;
        const response = await apiClient.get<BackendApiResponseWrapper<PropertyCertificateWithStatusDto[]>>(url);
        if (response.success && response.data) {
            const raw = response.data as unknown as Record<string, unknown>;
            const rawItems = (raw.items ?? raw.Items ?? raw.data ?? raw) as unknown[];
            const items = Array.isArray(rawItems)
                ? rawItems.map(normalizePropertyCertificateWithStatus).filter((item): item is PropertyCertificateWithStatusDto => item !== null)
                : [];
            return {
                success: (raw.success as boolean) ?? response.data.success ?? true,
                statusCode: response.statusCode,
                data: items,
                message: (raw.message as string) || response.message
            };
        }
        return {
            success: false,
            statusCode: response.statusCode,
            error: response.error,
            message: response.message
        };
    } catch (error: unknown) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

const certificateTypeMasterCache = { data: null as ApiResponse<unknown[]> | null, expiresAt: 0 };
const CERT_MASTER_TTL_MS = 10 * 60 * 1000; // 10 minutes

// 2. GET - Load Certificate Type Master list dynamically
export async function getCertificateTypeMaster(): Promise<ApiResponse<unknown[]>> {
    if (certificateTypeMasterCache.data && certificateTypeMasterCache.expiresAt > Date.now()) {
        return certificateTypeMasterCache.data;
    }

    try {
        const response = await apiClient.get<BackendApiResponseWrapper<unknown[]>>('/property-certificates/type-master');
        if (response.success && response.data) {
            const raw = response.data as unknown as Record<string, unknown>;
            const items = (raw.items ?? raw.Items ?? raw.data ?? raw) as unknown[];
            const result: ApiResponse<unknown[]> = {
                success: (raw.success as boolean) ?? response.data.success ?? true,
                statusCode: response.statusCode,
                data: items,
                message: (raw.message as string) || response.message
            };
            certificateTypeMasterCache.data = result;
            certificateTypeMasterCache.expiresAt = Date.now() + CERT_MASTER_TTL_MS;
            return result;
        }
        return {
            success: false,
            statusCode: response.statusCode,
            error: response.error,
            message: response.message
        };
    } catch (error: unknown) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

// 2b. GET - Load Wings dynamically by propertyId
export async function getWingsByProperty(
    propertyId: string,
    societyId?: number | string | null
): Promise<ApiResponse<unknown[]>> {
    try {
        const propIdNum = Number(propertyId);
        const socIdNum = societyId ? Number(societyId) : null;
        if (socIdNum && socIdNum > 0) {
            try {
                const { getWingDetailsMastBySocietyDetailsMastId } = await import("./wingDetailsMast.services");
                const wingDetailsRes = await getWingDetailsMastBySocietyDetailsMastId(socIdNum);
                const mastItems = Array.isArray(wingDetailsRes?.wingDetailsMast)
                    ? wingDetailsRes.wingDetailsMast
                    : Array.isArray((wingDetailsRes as unknown as Record<string, unknown>)?.items)
                    ? (wingDetailsRes as unknown as Record<string, unknown>).items as Array<{ id: number; wingMasterId?: number; wingName: string; isActive?: boolean }>
                    : [];
                
                const seen = new Set<string>();
                const distinctWings: Array<{ wingDetailId: number; wingMasterId?: number; wingName: string; wingNo?: string }> = [];
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
                        });
                    }
                }
                if (distinctWings.length > 0) {
                    return {
                        success: true,
                        statusCode: 200,
                        data: distinctWings,
                    };
                }
            } catch {
                // Try societyDetails lookup by propertyId
            }
        }

        if (propIdNum > 0) {
            try {
                const { getSocietyDetailsByProperty } = await import("./societyDetails.services");
                const socRes = await getSocietyDetailsByProperty(propIdNum);
                const socItems = Array.isArray(socRes?.items) ? socRes.items : [];
                for (const soc of socItems) {
                    if (soc?.id && soc.id !== socIdNum) {
                        const { getWingDetailsMastBySocietyDetailsMastId } = await import("./wingDetailsMast.services");
                        const wingDetailsRes = await getWingDetailsMastBySocietyDetailsMastId(soc.id);
                        const mastItems = Array.isArray(wingDetailsRes?.wingDetailsMast)
                            ? wingDetailsRes.wingDetailsMast
                            : Array.isArray((wingDetailsRes as unknown as Record<string, unknown>)?.items)
                            ? (wingDetailsRes as unknown as Record<string, unknown>).items as Array<{ id: number; wingMasterId?: number; wingName: string; isActive?: boolean }>
                            : [];
                        
                        const seen = new Set<string>();
                        const distinctWings: Array<{ wingDetailId: number; wingMasterId?: number; wingName: string; wingNo?: string }> = [];
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
                                });
                            }
                        }
                        if (distinctWings.length > 0) {
                            return {
                                success: true,
                                statusCode: 200,
                                data: distinctWings,
                            };
                        }
                    }
                }
            } catch {
                // Fall back to /property-certificates/wings
            }
        }

        let url = `/property-certificates/wings/${encodeURIComponent(propertyId)}`;
        if (societyId && String(societyId).trim() !== '') {
            url += `?societyId=${encodeURIComponent(String(societyId))}`;
        }
        const response = await apiClient.get<BackendApiResponseWrapper<unknown[]>>(url);
        if (response.success && response.data) {
            const rawData = response.data as unknown as Record<string, unknown>;
            const items = Array.isArray(rawData.items)
                ? rawData.items
                : Array.isArray(rawData.data)
                ? rawData.data
                : Array.isArray(response.data)
                ? (response.data as unknown[])
                : [];
            
            const seenNames = new Set<string>();
            const distinctWings: Array<{ wingDetailId: number; wingMasterId?: number; wingName: string; wingNo?: string }> = [];
            for (const item of items) {
                const w = item as Record<string, unknown>;
                if (!w) continue;
                const wName = String(w.wingName || w.WingName || '').trim();
                const wDetailId = Number(w.wingDetailId ?? w.WingDetailId ?? w.id ?? w.Id ?? 0);
                const wMasterId = w.wingMasterId != null ? Number(w.wingMasterId) : undefined;
                const key = wName.toLowerCase();
                if (!seenNames.has(key) && wName) {
                    seenNames.add(key);
                    distinctWings.push({
                        wingDetailId: wDetailId,
                        wingMasterId: wMasterId,
                        wingName: wName,
                        wingNo: String(w.wingNo || w.WingNo || wName),
                    });
                }
            }

            return {
                success: true,
                statusCode: response.statusCode,
                data: distinctWings,
                message: rawData.message ? String(rawData.message) : response.message
            };
        }
        return {
            success: false,
            statusCode: response.statusCode,
            error: response.error,
            message: response.message
        };
    } catch (error: unknown) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

// 2c. GET - Load Units dynamically by propertyId
export async function getUnitsByProperty(
    propertyId: string,
    wingDetailId?: number | null,
    pageNumber: number = 1,
    pageSize: number = 10
): Promise<ApiResponse<unknown[]> & { totalCount?: number }> {
    try {
        let url = `/property-certificates/units/${propertyId}?pageNumber=${pageNumber}&pageSize=${pageSize}`;
        if (wingDetailId) {
            url += `&wingDetailId=${wingDetailId}`;
        }
        const response = await apiClient.get<BackendApiResponseWrapper<unknown[]> & { totalCount?: number }>(url);
        if (response.success && response.data) {
            const rawData = response.data as unknown as Record<string, unknown>;
            return {
                success: true,
                statusCode: response.statusCode,
                data: response.data.items,
                totalCount: typeof rawData.totalCount === 'number' ? rawData.totalCount : undefined,
                message: response.data.message || response.message
            };
        }
        return {
            success: false,
            statusCode: response.statusCode,
            error: response.error,
            message: response.message
        };
    } catch (error: unknown) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

import { uploadDocument, deleteDocument } from "./document.service";
import { DEPARTMENT_ID, MODULE_ID, REFERENCE_TABLE, BINDING_PURPOSE, DOCUMENT_TYPE } from "../constants/document.constants";

// 3. POST - Upload/Replace document for an existing certificate using global API
export async function replaceCertificateDocument(
    propertyCertificateId: number,
    file: File,
    propertyId: number,
    certificateTypeId: number
): Promise<ApiResponse<PropertyCertificateUploadResponseDto>> {
    try {
        const uploadResponse = await uploadDocument(file, {
            departmentId: DEPARTMENT_ID.PTIS,
            moduleId: MODULE_ID.PropertyCertificate,
            referenceTableName: REFERENCE_TABLE.PropertyCertificate, // "PropertyCertificates"
            referenceTableId: propertyCertificateId,
            bindingPurpose: BINDING_PURPOSE.MainDocument,
            documentType: DOCUMENT_TYPE.Certificate,
            isPrimaryDocument: true
        });

        return {
            success: true,
            data: {
                propertyCertificateId: propertyCertificateId,
                documentGuid: uploadResponse.documentGuid,
                documentId: uploadResponse.documentId,
                documentBindingId: uploadResponse.documentBindingId ?? 0,
                propertyId: propertyId,
                certificateTypeId: certificateTypeId,
                certificateNo: null,
                issueDate: null,
                fileName: file.name,
                fileSizeBytes: file.size,
                storagePath: uploadResponse.storagePath ?? ""
            }
        };
    } catch (error: unknown) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

// 4. DELETE - Delete a certificate document using global API
export async function deleteCertificateDocument(
    documentGuid: string
): Promise<ApiResponse<void>> {
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

// 4. POST - Save all certificate changes
export async function bulkSaveCertificates(
    data: PropertyCertificateBulkSaveDto
): Promise<ApiResponse<PropertyCertificateBulkSaveResponseDto>> {
    const response = await apiClient.post<BackendApiResponseWrapper<PropertyCertificateBulkSaveResponseDto>>(
        `/property-certificates/bulk-save`,
        data
    );
    
    if (response.success && response.data) {
        let errorVal: string | undefined = undefined;
        if (!response.data.success) {
            errorVal = response.data.errors && response.data.errors.length > 0
                ? response.data.errors.join("; ")
                : (response.data.message || response.message || "Failed to save certificates");
        }

        const msg = response.data.message || response.message || errorVal;
        return {
            success: response.data.success,
            statusCode: response.statusCode || (response.data.success ? 200 : 500),
            data: response.data.items,
            message: msg,
            error: errorVal
        };
    }
    
    const errText = response.error || response.message || "An error occurred while saving the certificate";
    return {
        success: false,
        statusCode: response.statusCode || 500,
        error: errText,
        message: errText
    };
}

// 5. GET - Floor-wise certificate display for the Building Permission tab
export async function getFloorCertificates(
    propertyId: string,
    selectedPropertyDetailsId?: number | null
): Promise<ApiResponse<FloorCertificatesResponseDto>> {
    const url = selectedPropertyDetailsId !== undefined && selectedPropertyDetailsId !== null
        ? `/property-certificates/floor-certificates?propertyId=${propertyId}&selectedPropertyDetailsId=${selectedPropertyDetailsId}`
        : `/property-certificates/floor-certificates?propertyId=${propertyId}`;
    
    const response = await apiClient.get<BackendApiResponseWrapper<FloorCertificatesResponseDto>>(url);
    
    if (response.success && response.data) {
        return {
            success: response.data.success,
            statusCode: response.statusCode,
            data: response.data.items,
            message: response.data.message || response.message
        };
    }
    
    return {
        success: false,
        statusCode: response.statusCode,
        error: response.error,
        message: response.message
    };
}

// 6. POST - Save a single certificate (JSON payload)
export async function saveCertificate(
    data: SaveCertificateRequestDto
): Promise<ApiResponse<SaveCertificateResponseDto>> {
    try {
        const response = await apiClient.post<BackendApiResponseWrapper<SaveCertificateResponseDto>>(
            `/property-certificates/save-certificate`,
            data
        );
        
        if (response.success && response.data) {
            return {
                success: response.data.success,
                statusCode: response.statusCode,
                data: response.data.items,
                message: response.data.message || response.message
            };
        }
        
        return {
            success: false,
            statusCode: response.statusCode,
            error: response.error,
            message: response.message
        };
    } catch (error: unknown) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

// 7. DELETE - Delete a property certificate by propertyId, certificateTypeId, and optional propertyDetailsId
export async function deletePropertyCertificate(
    propertyId: number,
    certificateTypeId: number,
    propertyDetailsId?: number | null
): Promise<ApiResponse<void>> {
    try {
        let url = `/property-certificates?propertyId=${propertyId}&certificateTypeId=${certificateTypeId}`;
        if (propertyDetailsId !== undefined && propertyDetailsId !== null) {
            url += `&propertyDetailsId=${propertyDetailsId}`;
        }
        const response = await apiClient.delete<BackendApiResponseWrapper<void>>(url);
        
        // DELETE endpoints often return 204 No Content (response.data is undefined)
        if (response.success) {
            return {
                success: response.data ? response.data.success : true,
                statusCode: response.statusCode,
                message: response.data?.message || response.message
            };
        }
        
        return {
            success: false,
            statusCode: response.statusCode,
            error: response.error,
            message: response.message
        };
    } catch (error: unknown) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

// 7b. DELETE - Soft delete PropertyCertificate, DocumentBinding, and Document using DocumentId
export async function deletePropertyCertificateByDocumentId(
    documentId: number
): Promise<ApiResponse<void>> {
    try {
        const response = await apiClient.delete<BackendApiResponseWrapper<void>>(
            `/property-certificates/by-document/${documentId}`
        );
        if (response.success) {
            return {
                success: response.data ? response.data.success : true,
                statusCode: response.statusCode,
                message: response.data?.message || response.message || "Certificate deleted successfully"
            };
        }
        return {
            success: false,
            statusCode: response.statusCode,
            error: response.error || response.message || "Failed to delete certificate",
            message: response.message
        };
    } catch (error: unknown) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

// 7c. DELETE - Delete a property certificate directly by PropertyCertificateId (/property-certificates/{id})
export async function deletePropertyCertificateById(
    propertyCertificateId: number
): Promise<ApiResponse<void>> {
    try {
        const response = await apiClient.delete<BackendApiResponseWrapper<void>>(
            `/property-certificates/${propertyCertificateId}`
        );
        if (response.success) {
            return {
                success: response.data ? response.data.success : true,
                statusCode: response.statusCode,
                message: response.data?.message || response.message || "Certificate deleted successfully"
            };
        }
        return {
            success: false,
            statusCode: response.statusCode,
            error: response.error || response.message || "Failed to delete certificate",
            message: response.message
        };
    } catch (error: unknown) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}


// 8. POST - Add Certificate Record (/api/ApartmentQC/certificate-record)
export interface ApartmentQcCertificateRecordPayload {
    entityScope?: 'Society' | 'Wing' | 'Property';
    level: number;
    societyDetailId?: number | null;
    societyId?: number | null;
    wingDetailId?: number | null;
    propertyDetailsId?: number | null;
    propertyDetailsIds?: number[];
    unitPropertyIds?: number[];
    certificateTypeId: number;
    certificateNo: string;
    issueDate?: string;
    certificateIssueDate?: string;
    status?: string;
    documentGuid?: string | null;
    existingDocumentGuid?: string | null;
    propertyCertificateId?: number | null;
    isFileModified?: boolean;
    hasDocument?: boolean;
    fileName?: string | null;
}

import type { 
    CreateCertificateRecordResponseDto,
    DeleteCertificateRecordRequestDto,
    DeleteCertificateRecordResponseDto,
} from "@/types/building-permission.types";

export type DeleteApartmentQcCertificateRecordPayload = DeleteCertificateRecordRequestDto;

export async function postApartmentQcCertificateRecord(
    payload: ApartmentQcCertificateRecordPayload
): Promise<ApiResponse<CreateCertificateRecordResponseDto>> {
    try {
        const response = await apiClient.post<BackendApiResponseWrapper<CreateCertificateRecordResponseDto>>(
            '/ApartmentQC/certificate-record',
            payload
        );
        if (response.success && response.data) {
            const rawBody = response.data as unknown as Record<string, unknown>;
            const rawItems = (rawBody.items ?? rawBody.Items ?? rawBody.data ?? rawBody) as CreateCertificateRecordResponseDto;
            return {
                success: (rawBody.success as boolean) ?? true,
                statusCode: response.statusCode,
                data: rawItems,
                message: (rawBody.message as string) || response.message
            };
        }
        return {
            success: false,
            statusCode: response.statusCode,
            error: response.error || response.message || 'Failed to post certificate record',
            message: response.message
        };
    } catch (error: unknown) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

// 9. POST/DELETE - Delete Certificate Record (/api/ApartmentQC/delete-certificate-record)
export async function deleteApartmentQcCertificateRecord(
    payload: DeleteApartmentQcCertificateRecordPayload
): Promise<ApiResponse<DeleteCertificateRecordResponseDto>> {
    try {
        const response = await apiClient.post<BackendApiResponseWrapper<DeleteCertificateRecordResponseDto>>(
            '/ApartmentQC/delete-certificate-record',
            payload
        );
        if (response.success && response.data) {
            const rawBody = response.data as unknown as Record<string, unknown>;
            const rawItems = (rawBody.items ?? rawBody.Items ?? rawBody.data ?? rawBody) as DeleteCertificateRecordResponseDto;
            return {
                success: (rawBody.success as boolean) ?? true,
                statusCode: response.statusCode,
                data: rawItems,
                message: (rawBody.message as string) || response.message
            };
        }
        return {
            success: false,
            statusCode: response.statusCode,
            error: response.error || response.message || 'Failed to delete certificate record',
            message: response.message
        };
    } catch (error: unknown) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}