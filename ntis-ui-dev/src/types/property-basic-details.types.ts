// PROPERTY API TYPES    
 import type { ElementType, ReactNode } from "react";

// Represents an owner type item from OwnerType API. Endpoint: GET /api/OwnerType
export interface OwnerTypeApiItem {
    id: number;
    ownerType: string;
    isActive: boolean;
    createdDate: string;
    updatedDate: string | null;
}

// Paginated response wrapper for the OwnerType API.
export interface OwnerTypeApiResponse {
    items: OwnerTypeApiItem[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
}

export interface PropertyTypeApiItem {
    id: number;
    propertyDescription: string;
    type: string;
    propertyTypeGroup: string;
    searchKey: string;
    searchSequence: number;
    propertyTypeCategoryId: number | null;
    isActive: boolean;
    createdDate: string;
    updatedDate: string | null;
}

// Paginated response wrapper for the PropertyType API.
export interface PropertyTypeApiResponse {
    items: PropertyTypeApiItem[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
}

// Represents a property category item from PropertyCategory API. Endpoint: GET /api/PropertyCategory
export interface PropertyCategoryApiItem {
    id: number;
    propertyCategoryName: string;
    isActive: boolean;
    createdDate: string;
    updatedDate: string | null;
}

//  Paginated response wrapper for the PropertyCategory API.
export interface PropertyCategoryApiResponse {
    items: PropertyCategoryApiItem[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
}

/**
 * Represents the basic details of a property as returned by the API.
 */
export interface PropertyBasicDetailsApiItem {
    propertyId: number;
    wardId: number;
    wardNo: string;
    zoneId: number;
    division: string;
    propertyNo: string;
    partitionNo: string;
    flatOrShopNo: string;
    plotNo: string;
    surveyNo: string;
    taxZoneId: number;
    taxZoneNo: string;
    categoryId: number;
    categoryName: string;
    propertyTypeId: number;
    propertyDescription: string;
    upicId: string | null;
    subZoneNo: string;
    moujaId: number | null;
    moujaName: string | null;
    wingNo: string | null;
    noOfResidentialToilets: number | null;
    noOfCommercialToilets: number | null;
    totalCarpetAreaSqMeter: number;
    totalBuiltupAreaSqMeter: number;
    totalCarpetAreaSqFeet: number;
    totalBuiltupAreaSqFeet: number;
    plotArea?: number | null;
    plotAreaSqFeet: number | null;
    plotAreaSqMeter: number | null;
    plotAreaFtLength: number;
    plotAreaFtWidth: number;
    plotAreaMtrLength: number;
    plotAreaMtrWidth: number;
    wingId: number | null;
    wingName: string | null;
    rateSectionDescription?: string | null;
    latitude?: string | null;
    longitude?: string | null;
    constructionYear?: string | null;
    oldCarpetAreaSqFeet?: number | null;
    oldCarpetAreaSqMeter?: number | null;
    oldBuiltupAreaSqFeet?: number | null;
    oldBuiltupAreaSqMeter?: number | null;
}

export interface TypeOfUseApiItem {
    typeOfUseId: number;
    typeOfUseCode: string;
    description: string;
    type: string;
    typeOfUseGroupId: number;
    searchKey: string | null;
    searchSequence: number | null;
    isActive: boolean;
    createdDate: string;
    updatedDate: string | null;
    typeOfUseCategoryId?: number | null;
    [key: string]: unknown;
}

// Represents the DTO for updating property basic details. Matches UpdatePropertyBasicDetailsDto in C#
/**
 * Data Transfer Object for updating property basic details.
 * Matches the backend UpdatePropertyBasicDetailsDto schema.
 */
export interface UpdatePropertyBasicDetailsDto {
    wardId: number;
    taxZoneId: number;
    categoryId: number | null;
    propertyTypeId: number | null;
    partitionNo: string | null;
    flatOrShopNo: string | null;
    plotNo: string | null;
    surveyNo: string | null;
    upicId: string | null;
    subZoneNo: string | null;
    moujaId: number | null;
    moujaName: string | null;
    noOfResidentialToilets: number | null;
    noOfCommercialToilets: number | null;
    totalBuiltupAreaSqFeet: number | null;
    totalCarpetAreaSqFeet: number | null;
    totalBuiltupAreaSqMeter: number | null;
    totalCarpetAreaSqMeter: number | null;
    plotArea: number | null;
    plotAreaFtLength: number | null;
    plotAreaFtWidth: number | null;
    plotAreaMtrLength: number | null;
    plotAreaMtrWidth: number | null;
    rateSectionDescription?: string | null;
}

//  Response wrapper for Property Basic Details API.
export interface PropertyBasicDetailsResponse {
    success: boolean;
    message: string;
    items: PropertyBasicDetailsApiItem;
    errors: unknown | null;
}

export interface WingItem {
    id: number;
    wingNo: string;
    sequenceNo: number;
    isActive: boolean;
    createdDate: string;
    updatedDate: string | null;
}

export interface WingResponse {
    items: WingItem[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
}

export interface MoujaItem {
    id: number;
    moujaNo: string;
    moujaName: string;
    isActive: boolean;
    createdDate: string;
    updatedDate: string | null;
}

export interface MoujaResponse {
    items: MoujaItem[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
}

export interface TaxDetailsApiResponse {
    success: boolean;
    message: string;
    items: {
        propertyId: number;
        taxAmounts: TaxAmounts;
    };
    errors: string[] | null;
}

export interface PropertyFormViewProps {
    MoujaMaster: MoujaItem[];
    propertyCategories: PropertyCategoryApiItem[];
    propertyDescriptions: PropertyTypeApiItem[];
    propertyData: PropertyBasicDetailsApiItem | null;
    locale: string;
    taxZones: TaxZoneItem[];
}

export interface Tab {
    label: string;
    href: string;
    icon: ElementType;
}

export interface DrawerShellProps {
    children: ReactNode;
    locale: string;
}


//  Represents a collection of tax amounts by tax name.
export type TaxAmounts = Record<string, number | undefined>;

export interface TaxZoneItem {
    id: number;
    taxZoneNo: string;
    taxZoneType: string;
    remark: string;
    isActive: boolean;
    createdDate: string;
    updatedDate: string | null;
}

export interface TaxZoneResponse {
    items: TaxZoneItem[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
}