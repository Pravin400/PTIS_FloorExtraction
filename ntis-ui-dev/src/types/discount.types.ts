export interface DiscountAttributeState extends Omit<DiscountAttributeDto, 'intValue' | 'decimalValue'> {
    enabled: boolean;
    isUploading?: boolean;
    isDeleting?: boolean;
    intValue?: number | string | null;
    decimalValue?: number | string | null;
    fileName?: string;
    pendingFile?: File;
    isInherited?: boolean;
    isOverridden?: boolean;
}

export type DiscountState = Record<number, DiscountAttributeState>;


export interface DiscountAttributeDto {
    id: number;
    socialAttributeCode: string;
    socialAttributeName: string;
    dataType: string;
    unit?: string | null;
    displayOrder?: number | null;
    isDiscountApplicable: boolean;
    propertySocialDetailId?: number | null;
    bitValue?: boolean | null;
    intValue?: number | null;
    decimalValue?: number | null;
    textValue?: string | null;
    dateValue?: string | null;
    documentBindingId?: number | null;
    documentGuid?: string | null;
    documentUrl?: string | null;
    photoBindingId?: number | null;
    photoGuid?: string | null;
    fileName?: string | null;
    remark?: string | null;
    isPhotoRequired?: boolean;
    isDocumentRequired?: boolean;
    isActive?: boolean;
    isCommonAreaAttribute?: boolean;
    propertyId?: number | null;
    entityType?: string | null;
    inheritedFrom?: string | null;
    inheritanceLevel?: 'Self' | 'Wing' | 'Apartment' | string | null;
    parentAttributeId?: number | null;
    isRequiredWhenParentTrue?: boolean;
    children?: DiscountAttributeDto[];
}

export interface PropertyDiscountInfoResponseDto {
    propertyId: number;
    discountAttributes: DiscountAttributeDto[];
}

export interface DiscountDocumentUploadResponseDto {
    propertySocialDetailId: number | null;
    propertyId: number;
    socialAttributeId: number;
    documentBindingId: number | null;
    documentGuid: string;
    documentUrl?: string | null;
    fileName: string;
    remark?: string | null;
}

export interface DiscountAttributeItemDto {
    propertySocialDetailId: number | null;
    socialAttributeId: number;
    dataType?: string | null;
    bitValue?: boolean | null;
    intValue?: number | null;
    decimalValue?: number | null;
    textValue?: string | null;
    dateValue?: string | null;
    documentBindingId?: number | null;
    documentGuid?: string | null;
    photoBindingId?: number | null;
    photoGuid?: string | null;
    fileName?: string | null;
    remark?: string | null;
    isActive?: boolean;
    entityType?: string | null;
    inheritedFrom?: string | null;
    inheritanceLevel?: 'Self' | 'Wing' | 'Apartment' | string | null;
}

export interface UpsertPropertyDiscountInfoDto {
    propertyId: number | null;
    societyDetailId?: number | null;
    wingDetailId?: number | null;
    entityType?: string | null;
    updatedBy: number;
    discountAttributes: DiscountAttributeItemDto[];
}
