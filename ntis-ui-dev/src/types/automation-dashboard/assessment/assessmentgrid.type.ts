export type AssessmentGridType = "Total" | "Assessed" | "Unassessed" | "Rented";

export interface AssessmentClassification {
  type: string;
  structure: number;
  unit: number;
  oldDemand: number;
  currentDemand: number;
  retroDemand: number;
  totalDemand: number;
  additionalRevenueGenerated: number;
}

export interface AssessmentZoneData {
  zoneId: number | null;
  zoneName: string;
  zoneNo: string;
  totalStructure: number;
  totalUnit: number;
  classifications: AssessmentClassification[];
}

export interface AssessmentGridItems {
  zoneData: AssessmentZoneData[];
  totalRow: AssessmentZoneData;
  grandTotalRow: AssessmentZoneData;
}

export interface AssessmentGridResponse {
  success: boolean;
  message: string;
  items: AssessmentGridItems[] | null;
  errors: unknown | null;
  correlationId: string | null;
}

export interface AssessmentRow {
  [key: string]: unknown;
  id: string;
  zoneId?: number | null;
  sr?: number | string;
  zoneName?: string;
  zoneNo?: string;
  totalStructure?: number | string;
  totalUnit?: number | string;
  type: string;
  structure: number | string;
  unit: number | string;
  oldDemand: number | string;
  currentDemand: number | string;
  retroDemand: number | string;
  totalDemand: number | string;
  addRevenue: number | string;
  rowSpan?: number;
}

export interface PendingAssessmentRecordDetails {
  area: string;
  use: string;
  rv: string;
  cTax: string;
  rTax: string;
  totalTax: string;
}

export interface PendingAssessmentPropertyDetailsComparison {
  newRecord: PendingAssessmentRecordDetails;
  oldRecord: PendingAssessmentRecordDetails;
}

export interface PendingAssessmentQcChecklist {
  siteQc: boolean;
  applyTaxes: boolean;
  officeQc: boolean;
  dataUpdated: boolean;
  addTaxes: boolean;
  ocCcBill: boolean;
}

export interface PendingAssessmentProperty {
  propertyId: number;
  propertyNo: string;
  wardNo?: string;
  wardId?: number;
  category: string;
  propertyDescription: string;
  propertyType: string;
  ownerName: string;
  occupierName: string;
  mobileNo: string;
  address: string;
  flatOrShopName: string;
  assessmentStatus: string;
  floorCount: number;
  documentGuid: string | null;
  planDocumentGuid: string | null;
  additionalRevenue: number;
  qcChecklist: PendingAssessmentQcChecklist;
  propertyDetailsComparison: PendingAssessmentPropertyDetailsComparison;
}

export interface PendingAssessmentItems {
  workflowStageId: number;
  workflowStageName: string;
  zoneId: number;
  zoneName: string;
  properties: PendingAssessmentProperty[];
  totalCount: number;
}

export interface PendingAssessmentResponse {
  success: boolean;
  message: string;
  items: PendingAssessmentItems[] | null;
  errors: unknown | null;
  correlationId: string | null;
}

export interface SendToApproveData {
  [key: string]: unknown;
  id: string;
  propertyNo: { new: string; old: string };
  wardNo: string;
  category: string;
  categoryMarathi: string;
  desc: { floors?: string; units?: number };
  owner: string;
  occupier: string;
  shopName?: string;
  mobile: string;
  address: string;
  oldRecord: { area: number | string; use: string; rv: number | string; cTax: number | string; rTax: number | string; totalTax: number | string };
  newRecord: { area: number | string; use: string; rv: number | string; cTax: number | string; rTax: number | string; totalTax: number | string };
  additionalRevenue: number;
  propertyType: string;
  documentGuid: string | null;
  planDocumentGuid: string | null;
  qcChecklist: {
    siteQC: boolean;
    applyTaxes: boolean;
    officeQC: boolean;
    dataUpdated: boolean;
    addTaxes: boolean;
    qcCcBill: boolean;
  };
}

export interface SendToApproveResponse {
  success: boolean;
  message: string;
  items: unknown | null;
  errors: unknown | null;
  correlationId: string | null;
}

export interface SendToApprovePayload {
  propertyIds: number[];
  userId: number;
}