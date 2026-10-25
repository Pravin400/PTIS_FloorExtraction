import { PropertyDetailsComparison } from "../geo-sequencing/geo-sequencing.type";

export interface QCChecklist {
  siteQc: boolean;
  applyTaxes: boolean;
  officeQc: boolean;
  dataUpdated: boolean;
  addTaxes: boolean;
  ocCcBill?: boolean;
}

export interface PropertySubGridProperty {
  [key: string]: unknown;
  propertyId: number;
  propertyNo: string;
  category: string;
  propertyDescription: string;
  propertyType: string;
  ownerName: string;
  occupierName: string;
  mobileNo: string;
  address: string;
  flatOrShopName: string;
  assessmentStatus: string;
  floorCount: number | string;
  wingName?: string | null;
  propertyDetailsCount: number;
  documentGuid: string | null;
  planDocumentGuid: string | null;
  additionalRevenue: number;
  qcChecklist: QCChecklist;
  propertyDetailsComparison: PropertyDetailsComparison;
}

export interface PropertySubGridDetailsItems {
  workflowStageId: number;
  workflowStageName: string;
  zoneId: number;
  zoneName: string;
  properties: PropertySubGridProperty[];
  totalCount: number;
}

export interface PropertySubGridDetailsResponse {
  success: boolean;
  message: string;
  items: PropertySubGridDetailsItems[] | null;
  errors: unknown | null;
  correlationId?: string | null;
}

export interface WardItem {
    id: number;
    wardNo: string;
    zoneId: number;
    description: string;
    sequenceNo: number | null;
    isActive: boolean;
    createdDate: string;
    updatedDate: string;
}

export interface WardResponseItems {
    items: WardItem[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
}

export interface WardResponse {
    success: boolean;
    message: string;
    items: WardResponseItems;
    errors: unknown | null;
}

export interface PropertyTypeMasterItem {
    id: number;
    propertyDescription: string;
    type: string;
    searchSequence: number;
    propertyTypeCategoryId: number | null;
    isActive: boolean;
    createdDate: string;
    updatedDate: string | null;
}

export interface PropertyTypeMasterResponseItems {
    items: PropertyTypeMasterItem[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
}

export interface PropertyAssessmentStatusItem {
    id: number;
    statusName: string;
    isActive: boolean;
    createdDate: string;
    updatedDate: string | null;
}

export interface PropertyAssessmentStatusResponseItems {
    items: PropertyAssessmentStatusItem[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
}
export interface ZoneItem {
    id: number;
    zoneNo: string;
    description: string;
    sequenceNo: number | null;
    isActive: boolean;
    createdDate: string;
    updatedDate: string | null;
}

export interface ZoneResponseItems {
    items: ZoneItem[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
}

export interface PropertyTrackingStageStatusItem {
    workflowStageId: number;
    stageName: string;
    displayOrder: number;
    isCompleted: number;
    officerName?: string;
    createdDate?: string;
    updatedDate?: string;
    id?: number;
    description?: string;
    userId?: number;
    isActive?: boolean;
}

export interface PropertyTrackingStageStatusResponse {
    success: boolean;
    message: string;
    items: PropertyTrackingStageStatusItem[];
    errors: unknown | null;
    correlationId?: string | null;
}
