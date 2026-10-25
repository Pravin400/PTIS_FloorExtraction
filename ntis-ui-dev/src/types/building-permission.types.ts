import type { FloorResponse, ConstructionTypeResponse, TypeOfUseApiItem, SubFloorResponse, SubTypeOfUseResponse } from '@/types/floor-details.types';
import type { FloorData } from '@/types/room-details.types';

export type CertificateData = {
    enabled: boolean;
    number: string;
    date: string;
    documentGuid?: string;
    isUploading?: boolean;
    isDeleting?: boolean;
    certificateTypeId: number;
    propertyCertificateId?: number | null;
    fileName?: string;
    certificateTypeName?: string;
    certificateTypeCode?: string;
    displayOrder?: number;
    pendingFile?: File;
    hasExistingData?: boolean;
    customStatusBadge?: {
        label: string;
        variant: 'success' | 'info' | 'warning' | 'secondary' | 'purple';
    };
    sourceLevel?: 'Direct' | 'Apartment' | 'Wing' | 'Property' | 'Floor' | 'Partial' | 'None';
};

export type BuildingPermissionState = Record<number, CertificateData>;

export interface BuildingPermissionItems {
    propertyId: number;
    propertySocialId: number;
    buildingPermitNo: string | null;
    buildingPermitDate: string | null;
    buildingPermitDocumentGuid: string | null;
    commencementNo: string | null;
    commencementDate: string | null;
    commencementDocumentGuid: string | null;
    occupancyCertNo: string | null;
    occupancyCertDate: string | null;
    occupancyCertDocumentGuid: string | null;
    possessionCertNo: string | null;
    possessionCertDate: string | null;
    possessionCertDocumentGuid: string | null;
    index2No: string | null;
    index2Date: string | null;
    index2DocumentGuid: string | null;
    electricBillNo: string | null;
    electricBillDate: string | null;
    electricBillDocumentGuid: string | null;
    buildCompletionCertNo: string | null;
    buildCompletionDate: string | null;
    buildCompletionCertDocumentGuid: string | null;
}

export interface BuildingPermissionApiResponse {
    success: boolean;
    message: string;
    items: BuildingPermissionItems;
}

export type ApplicationLevel = 'Apartment' | 'Wing' | 'Unit' | 'Entire Property' | 'Floor';
export type CertificateStatus = 'Active' | 'Pending' | 'Expired';

export interface WingOption {
    wingDetailId: number;
    wingMasterId?: number;
    wingNo?: string;
    wingName: string;
    societyDetailId?: number;
}

export interface UnitSelectionItem {
    propertyDetailsId: number;
    propertyId?: number;
    unitNo: string;
    wingDetailId?: number;
    wingName: string;
    floorId?: number;
    floorName: string;
    useId?: number;
    useName: string;
    isSelected: boolean;
    constructionYear?: string | number;
}

export interface CertificateTypeMasterOption {
    certificateTypeId: number;
    certificateTypeCode: string;
    certificateTypeName: string;
    description?: string;
    displayOrder?: number;
    badgeCode: string;
    isNumericOnly?: boolean;
}

export enum CertificateScope {
    Property = 0,
    Floor = 1,
    Wing = 2,
    Unit = 3,
}

export interface PropertyCertificateWithStatusDto {
    certificateTypeId: number;
    certificateTypeName: string;
    certificateTypeCode?: string;
    displayOrder: number;
    hasCertificate: boolean;
    propertyCertificateId: number | null;
    isActive: boolean;
    certificateNo: string | null;
    issueDate: string | null;
    documentGuid: string | null;
    fileName: string | null;
    propertyDetailsId?: number | null;
    propertyId?: number | null;
    isProtected?: boolean;
    isRequired?: boolean;
    entityType?: string;
    societyDetailId?: number | null;
    wingDetailId?: number | null;
}

export interface FloorCertificateDto {
    propertyDetailsId: number;
    propertyId: number;
    floorDescription?: string | null;
    subFloorDescription?: string | null;
    constructionYear?: string | null;
    assessmentYear?: string | null;
    constructionTypeDescription?: string | null;
    typeOfUseDescription?: string | null;
    subTypeOfUseDescription?: string | null;
    carpetAreaSqFeet?: number | null;
    carpetAreaSqMeter?: number | null;
    builtupAreaSqFeet?: number | null;
    builtupAreaSqMeter?: number | null;
    isSelected: boolean;
    certificateApplicable: boolean;
    ccDate?: string | null;
    ocDate?: string | null;
    electricBillDate?: string | null;
    ccCertificateNo?: string | null;
    ocCertificateNo?: string | null;
    electricBillNo?: string | null;
}

export interface FloorCertificatesResponseDto {
    propertyId: number;
    selectedPropertyDetailsId?: number | null;
    selectedFloor?: FloorCertificateDto | null;
    otherFloors: FloorCertificateDto[];
    propertyWiseCertificates: PropertyCertificateWithStatusDto[];
}

export interface SaveCertificateRequestDto {
    propertyId: number;
    propertyDetailsId?: number | null;
    societyDetailId?: number | null;
    wingDetailId?: number | null;
    propertyDetailsIds?: number[];
    applicationLevel?: ApplicationLevel;
    certificateScope: CertificateScope;
    certificateTypeId: number;
    certificateNo?: string | null;
    certificateIssueDate?: string | null;
    isPrimaryDocument?: boolean;
    status?: CertificateStatus;
    remarks?: string | null;
    documentGuid?: string | null;
    existingDocumentGuid?: string | null;
    propertyCertificateId?: number | null;
    isFileModified?: boolean;
    hasExistingDocument?: boolean;
    fileName?: string | null;
}

export interface SaveCertificateResponseDto {
    propertyCertificateId: number;
    propertyId: number;
    propertyDetailsId?: number | null;
    certificateScope: CertificateScope;
    certificateTypeId: number;
    certificateNo?: string | null;
    certificateIssueDate?: string | null;
    documentGuid?: string | null;
    documentBindingId?: number | null;
    taxRecalculationTriggered: boolean;
}

export interface PropertyCertificateUploadResponseDto {
    propertyCertificateId: number;
    documentGuid: string;
    documentId: number;
    documentBindingId: number;
    propertyId: number;
    certificateTypeId: number;
    certificateNo: string | null;
    issueDate: string | null;
    fileName: string;
    fileSizeBytes: number;
    storagePath: string;
}

export interface PropertyCertificateItemDto {
    certificateTypeId: number;
    isEnabled: boolean;
    certificateNumber?: string | null;
    certificateDate?: string | null;
    propertyCertificateId?: number | null;
    propertyDetailsId?: number | null;
    societyDetailId?: number | null;
    wingDetailId?: number | null;
    propertyDetailsIds?: number[];
    applicationLevel?: ApplicationLevel;
    status?: CertificateStatus;
    remarks?: string | null;
    existingDocumentGuid?: string | null;
    hasNewDocument: boolean;
    markedForDeletion?: boolean | null;
}

export interface PropertyCertificateBulkSaveDto {
    propertyId: number;
    certificates: PropertyCertificateItemDto[];
}

export interface PropertyCertificateBulkSaveResponseDto {
    propertyId: number;
    totalProcessed: number;
    enabledCount: number;
    disabledCount: number;
    updatedCertificates: PropertyCertificateWithStatusDto[];
    errors: string[];
}

export interface BuildingFormProps {
    initialBuildingPermission: PropertyCertificateWithStatusDto[] | null;
    initialFloorBuildingPermission?: PropertyCertificateWithStatusDto[] | null;
    initialFloorCertificates?: FloorCertificatesResponseDto | null;
    initialActiveScope?: 'Property' | 'Floor';
    initialActiveFloorId?: number | null;
    initialSelectedTypeId?: number | null;
    propertyId: string;
    categoryId?: number | null;
    categoryName?: string;
    isSociety?: boolean;
    societyDetailId?: number | null;
    wingDetailId?: number | null;
    floorData?: FloorResponse[];
    constructionTypeData?: ConstructionTypeResponse[];
    useData?: TypeOfUseApiItem[];
    subFloorData?: SubFloorResponse[];
    subTypeData?: SubTypeOfUseResponse[];
    initialFloors?: FloorData[];
    initialWings?: WingOption[];
    initialUnits?: UnitSelectionItem[];
    initialCertificateTypes?: CertificateTypeMasterOption[];
    initialCertificateGrid?: unknown;
    propertyConstructionYear?: string | number | null;
}

export interface CreateCertificateRecordResponseDto {
    effectiveScope: string;
    propertyCertificateIds: number[];
    unitCount: number;
    taxRecalculationTriggered: boolean;
}

export interface DeleteCertificateRecordRequestDto {
    level: number; // 0 = Apartment, 1 = Wing, 2 = Unit
    societyDetailId: number;
    wingDetailId?: number | null;
    unitPropertyIds?: number[];
    certificateTypeId: number;
    documentGuid?: string | null;
}

export interface DeleteCertificateRecordResponseDto {
    effectiveScope: string;
    deletedPropertyCertificateIds: number[];
    deletedCount: number;
    taxRecalculationTriggered: boolean;
    recalculationSummary?: unknown;
}

