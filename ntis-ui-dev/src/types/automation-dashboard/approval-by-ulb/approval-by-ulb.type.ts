export interface Classification {
    typeId: number;
    type: string;
    structure: number;
    unit: number;
    pendingStructure: number;
    pendingUnit: number;
    oldDemand: number;
    currentDemand: number;
    retroDemand: number;
    totalDemand: number;
    additionalRevenueGenerated: number;
}

export interface ZoneDataRow {
    zoneId: number | null;
    zoneName: string;
    zoneNo: string;
    wardId: number | null;
    wardName: string | null;
    totalStructure: number;
    totalUnit: number;
    classifications: Classification[];
    isTotal?: boolean;
    totalDemand?: number;
    [key: string]: unknown;
}

export interface ApprovalByUlbItems {
    zoneData: ZoneDataRow[];
    totalRow: ZoneDataRow | null;
    grandTotalRow: ZoneDataRow | null;
    pageNumber?: number;
    pageSize?: number;
    totalCount?: number;
}

export interface ApprovalByUlbResponse {
    success: boolean;
    message: string;
    items: ApprovalByUlbItems[] | null;
    errors: unknown | null;
    correlationId: string | null;
}

export interface AuthoritySignature {
    signAuthorityId: number;
    authorityName: string;
    authorityCode: string;
    sequenceOrder: number;
    isSigned: number;
}

export interface BuildingWiseItem {
    buildingNo: string;
    noticeNo: string;
    units: number;
    totalDemand: number;
    authoritySignatures: AuthoritySignature[];
}

export interface BuildingWisePagination {
    items: BuildingWiseItem[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
}

export interface BuildingWiseResponse {
    success: boolean;
    message: string;
    items: BuildingWisePagination[] | null;
    errors: unknown | null;
    correlationId: string | null;
}

export interface PropertyWiseRecord {
    area: string;
    use: string;
    year: string;
    rv: string;
    tax: string;
}

export interface PropertyWiseItem {
    propertyId: string,
    wardNo: string;
    newPropertyNo: string;
    oldPropertyNo: string;
    description: string;
    ownerName: string;
    occupierName: string;
    address: string;
    societyName: string;
    builderName: string;
    wingNo: string;
    flatNo: string;
    oldRecord: PropertyWiseRecord;
    newRecord: PropertyWiseRecord;
    propertyType: string;
    totalDemand: number;
    clerkSign: number;
    taxInspectorSign: number;
    assistantCommissionerSign: number;
    deputyCommissionerSign: number;
    additionalCommissionerSign: number;
    authoritySignatures: AuthoritySignature[];
    documents?: unknown;
    actions?: unknown;
    [key: string]: unknown;
}
    
export interface PropertyWisePagination {
    items: PropertyWiseItem[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
}

export interface PropertyWiseResponse {
    success: boolean;
    message: string;
    items: PropertyWisePagination[] | null;
    errors: unknown | null;
    correlationId: string | null;
}

export interface PendingExportItem {
    zone: string;
    buildingNo: string;
    srNoticeNo: string;
    pendingSignAt: string;
    pendingOfficerName: string;
}

export interface PendingExportResponse {
    success: boolean;
    message: string;
    items: PendingExportItem[];
    errors: unknown | null;
    correlationId: string | null;
}

export interface PendingSignItem {
    propertyId: number;
    signAuthorityId: number;
    structureName: string;
    srNoticeNo: string;
    noOfUnits: number;
    demand: number;
    signStatus: string;
    authorityCode: string;
}

export interface PendingSignPagination {
    items: PendingSignItem[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
}

export interface PendingSignResponse {
    success: boolean;
    message: string;
    items: PendingSignPagination[] | null;
    errors: unknown | null;
    correlationId: string | null;
}

export interface UpdatePropertySignPayload {
    userId: number;
    signAuthorityId: number;
    propertyId: number;
    authorityCode: string;
    signStatus: string;
}
