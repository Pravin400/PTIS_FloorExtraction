/**
 * Common type definitions shared across multiple modules
 */

export interface LookupData {
    // Core fields
    id?: number;
    code?: string;
    description: string;

    // Floor-specific fields
    floorId?: number;
    floorCode?: string;
    sequenceNo?: number;
    maxFloorNo?: number;

    // SubFloor-specific fields
    subFloorId?: number;
    subFloorCode?: string;
    subFloorPercentage?: number;

    // Construction-specific fields
    constructionTypeId?: number;
    constructionCode?: string;

    // Type of Use specific fields
    typeOfUseId?: number;
    typeOfUseCode?: string;
    type?: string;
    typeOfUseGroupId?: number;

    // SubType of Use specific fields
    subTypeOfUseId?: number;

    // Common optional fields
    searchKey?: string | null;
    searchSequence?: number | null;
    isActive?: boolean;
    createdDate?: string;
    updatedDate?: string | null;

    // Allow additional fields
    [key: string]: unknown;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface ShapeParameters {
    length?: string | number;
    width?: string | number;
    radius?: string | number;
    base?: string | number;
    height?: string | number;
    side?: string | number;
    base1?: string | number;
    base2?: string | number;
    shape?: string;
    [key: string]: unknown;
}
export interface RoomFormData {
    roomNo: string;
    length: string;
    width: string;
    roomCount: string;
    offsetMinus: string;
    outer: string;
    remark: string;
    utilities: string;
    shape: string;
    id?: number | string;
    shapeParams?: ShapeParameters;
    roomTypeId?: string;
}