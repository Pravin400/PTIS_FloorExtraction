export interface SocialAttributeHierarchyDto {
    id: number;
    socialAttributeCode: string;
    socialAttributeName: string;
    dataType: string;
    unit?: string | null;
    displayOrder?: number | null;
    parentAttributeId?: number | null;
    isRequiredWhenParentTrue: boolean;
    isDiscountApplicable: boolean;
    propertySocialDetailId?: number | null;
    bitValue?: boolean | null;
    intValue?: number | null;
    decimalValue?: number | null;
    textValue?: string | null;
    dateValue?: string | null;
    documentBindingId?: number | null;
    remark?: string | null;
    photoTypeId?: number | null;
    isPhotoRequired?: boolean;
    isDocumentRequired?: boolean;
    isActive?: boolean;
    isCommonAreaAttribute?: boolean;
    documentGuid?: string | null;
    fileName?: string | null;
    documentUrl?: string | null;
    photoBindingId?: number | null;
    photoGuid?: string | null;
    entityType?: string | null;
    inheritedFrom?: string | null;
    inheritanceLevel?: 'Self' | 'Wing' | 'Apartment' | string | null;
    children: SocialAttributeHierarchyDto[];
}

export interface PropertySocialInfoResponseDto {
    propertyId: number;
    societyDetailId?: number | null;
    wingDetailId?: number | null;
    socialAttributes: SocialAttributeHierarchyDto[];
}

export interface PropertySocialDetailsDto {
    id: number;
    propertyId: number;
    socialAttributeId: number;
    bitValue?: boolean | null;
    intValue?: number | null;
    decimalValue?: number | null;
    textValue?: string | null;
    dateValue?: string | null;
    documentBindingId?: number | null;
    remark?: string | null;
    socialAttributeCode?: string | null;
    socialAttributeName?: string | null;
    isActive?: boolean;
    documentGuid?: string | null;
    fileName?: string | null;
    documentUrl?: string | null;
    photoGuid?: string | null;
    photoBindingId?: number | null;
    isPhotoRequired?: boolean;
    isDocumentRequired?: boolean;
    isCommonAreaAttribute?: boolean;
    wingDetailId?: number | null;
    societyDetailId?: number | null;
    wingName?: string | null;
    unitNo?: string | null;
    partitionNo?: string | null;
    entityType?: string | null;
    inheritedFrom?: string | null;
    inheritanceLevel?: 'Self' | 'Wing' | 'Apartment' | string | null;
    percentage?: number | null;
    amount?: number | null;
    isDiscountApplicable?: boolean;
}

export interface PropertySocialInfoItemDto {
    id?: number; // This corresponds to the PropertySocialDetailId in C# if existing
    socialAttributeId: number;
    bitValue?: boolean | null;
    intValue?: number | null;
    decimalValue?: number | null;
    textValue?: string | null;
    dateValue?: string | null;
    documentBindingId?: number | null;
    fileName?: string | null;
    remark?: string | null;
    isActive?: boolean;
    documentGuid?: string | null;
    photoGuid?: string | null;
    photoBindingId?: number | null;
    isPhotoRequired?: boolean;
    isDocumentRequired?: boolean;
    entityType?: string | null;
    inheritedFrom?: string | null;
    inheritanceLevel?: 'Self' | 'Wing' | 'Apartment' | string | null;
    percentage?: number | null;
    amount?: number | null;
}

export interface CreatePropertySocialDetailDto {
    isActive?: boolean;
    createdBy: number;
    propertyId: number | null;
    socialAttributeId: number;
    wingDetailId: number | null;
    societyDetailId: number | null;
    entityType?: string | null;
    bitValue?: boolean | null;
    intValue?: number | null;
    decimalValue?: number | null;
    textValue?: string | null;
    dateValue?: string | null;
    documentBindingId?: number | null;
    photoBindingId?: number | null;
    remark?: string | null;
}

export interface UpdatePropertySocialDetailDto {
    id: number;
    isActive?: boolean;
    updatedBy: number;
    propertyId: number | null;
    socialAttributeId: number;
    wingDetailId: number | null;
    societyDetailId: number | null;
    entityType?: string | null;
    bitValue?: boolean | null;
    intValue?: number | null;
    decimalValue?: number | null;
    textValue?: string | null;
    dateValue?: string | null;
    documentBindingId?: number | null;
    photoBindingId?: number | null;
    remark?: string | null;
}

export interface CreateBulkPropertySocialDetailDto {
    isActive?: boolean;
    createdBy: number;
    propertyIds: string;
    socialAttributeId: number;
    wingDetailId: number | null;
    societyDetailId: number | null;
    entityType?: string | null;
    bitValue?: boolean | null;
    intValue?: number | null;
    decimalValue?: number | null;
    textValue?: string | null;
    dateValue?: string | null;
    documentBindingId?: number | null;
    photoBindingId?: number | null;
    remark?: string | null;
}

export interface PropertySocialInfoApiResponse {
    success: boolean;
    message: string;
    items?: PropertySocialInfoResponseDto;
}

export interface UpsertPropertySocialInfoApiResponse {
    success: boolean;
    message: string;
    items?: PropertySocialDetailsDto[];
}

export interface UpsertPropertySocialInfoDto {
    propertyId: number | null;
    societyDetailId?: number | null;
    wingDetailId?: number | null;
    entityType?: string | null;
    propertyIds?: string | null;
    updatedBy: number;
    socialAttributes: PropertySocialInfoItemDto[];
    socialAttributeIdsToRemove: number[];
}

export interface DeletePropertySocialDetailsByHierarchyParams {
    entityType?: 'S' | 'W' | 'P' | string;
    societyAttributeId?: number;
    socialAttributeId?: number;
    societyDetailsId?: number;
    societyDetailId?: number;
    wingDetailId?: number;
    documentBindingId?: number;
    propertyId?: number | null;
    propertyIds?: number[] | string;
}

export interface AppliedSocialAttributeDto {
    socialAttributeId: number;
    propertySocialDetailId: number;
    societyDetailId?: number | null;
    wingDetailId?: number | null;
    propertyId?: number | null;
    bitValue?: boolean | null;
    intValue?: number | null;
    decimalValue?: number | null;
    textValue?: string | null;
    dateValue?: string | null;
    documentBindingId?: number | null;
    documentGuid?: string | null;
    photoBindingId?: number | null;
    photoGuid?: string | null;
    remark?: string | null;
    socialAttributeCode?: string;
    socialAttributeName?: string;
    dataType?: string;
    unit?: string | null;
    displayOrder?: number | null;
    parentAttributeId?: number | null;
    isRequiredWhenParentTrue?: boolean;
    isDiscountApplicable?: boolean;
    photoTypeId?: number | null;
    attributeCategory?: string | null;
    isPhotoRequired?: boolean;
    isDocumentRequired?: boolean;
    isActive?: boolean;
}

export interface NonAppliedSocialAttributeDto {
    id: number;
    socialAttributeId: number;
    socialAttributeCode: string;
    socialAttributeName: string;
    dataType: string;
    unit?: string | null;
    displayOrder?: number | null;
    parentAttributeId?: number | null;
    isRequiredWhenParentTrue?: boolean;
    isDiscountApplicable?: boolean;
    photoTypeId?: number | null;
    attributeCategory?: string | null;
    isPhotoRequired?: boolean;
    isDocumentRequired?: boolean;
    isActive?: boolean;
}

export interface PropertySocialDetailsFilterResponseDto {
    appliedAttributes: AppliedSocialAttributeDto[];
    nonAppliedAttributes: NonAppliedSocialAttributeDto[];
}

export interface SocialPropertyDocumentsDto {
    documentId: number;
    documentGuid: string;
    fileName?: string | null;
    documentTypeId?: number | null;
    documentUrl?: string | null;
    bindingPurpose?: string | null;
}

export interface PropertySocialInfoBulkResponseDto {
    propertyId?: number | null;
    societyDetailId?: number | null;
    wingDetailId?: number | null;
    noOfResidentialToilets?: number | null;
    noOfCommercialToilets?: number | null;
    socialAttributes: SocialAttributeHierarchyDto[];
}

export interface UpsertPropertySocialInfoBulkItemDto {
    id?: number | null;
    socialAttributeId: number;
    bitValue?: boolean | null;
    intValue?: number | null;
    decimalValue?: number | null;
    textValue?: string | null;
    dateValue?: string | null;
    documentBindingId?: number | null;
    remark?: string | null;
}

export interface UpsertPropertySocialInfoBulkDto {
    propertyId?: number | null;
    societyDetailId?: number | null;
    wingDetailId?: number | null;
    updatedBy: number;
    entityType: 'S' | 'W' | 'P' | string;
    socialAttributes: UpsertPropertySocialInfoBulkItemDto[];
    socialAttributeIdsToRemove?: number[];
    propertySocialDetailIdsToRemove?: number[];
}

