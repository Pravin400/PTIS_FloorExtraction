import { PropertyDetailsComparison } from "../geo-sequencing/geo-sequencing.type";

export interface WardWisePropertySubGridProperty {
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
  documentGuid: string | null;
  planDocumentGuid: string | null;
  additionalRevenue: number;
  wingName: string | null;
  propertyDetailsComparison: PropertyDetailsComparison;
}

export interface WardWisePropertySubGridDetailsItems {
  workflowStageId: number;
  workflowStageName: string;
  zoneId: number;
  zoneName: string;
  wardId: number | null;
  wardNo: string | null;
  properties: WardWisePropertySubGridProperty[];
  totalCount: number;
}

export interface WardWisePropertySubGridDetailsResponse {
  success: boolean;
  message: string;
  items: WardWisePropertySubGridDetailsItems[] | null;
  errors: unknown | null;
  correlationId?: string | null;
}
