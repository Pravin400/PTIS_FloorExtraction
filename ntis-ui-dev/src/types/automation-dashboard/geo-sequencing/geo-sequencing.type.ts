export interface CountBreakdown {
  structureCount: number;
  unitCount: number;
}

export interface PropertyTypeBreakdown {
  residential: number;
  nonResidential: number;
  mixed: number;
  publicUtility: number;
  underConstruction: number;
}

export interface StatusCountBreakdown {
  statusId: number;
  structureCount: number;
  unitCount: number;
}

export interface AssessmentStatusBreakdown {
  assessed: StatusCountBreakdown;
  unassessed: StatusCountBreakdown;
  newlyAssessedFound: StatusCountBreakdown;
  assessmentInProcess: StatusCountBreakdown;
}

export interface GeoSequencingZone {
  zoneId: number;
  zoneName: string;
  zoneNo: string;
  registeredProperties: number;
  geoSequencedProperties: CountBreakdown;
  propertyTypeBreakdown: PropertyTypeBreakdown;
  assessmentStatusBreakdown: AssessmentStatusBreakdown;
}

export interface GeoSequencingItems {
  zones: GeoSequencingZone[];
  totalRow: GeoSequencingZone;
}

export interface GeoSequencingGridResponse {
  success: boolean;
  message: string;
  items: GeoSequencingItems[];
  errors: unknown | null;
  correlationId?: string | null;
}

export interface PropertyRecordComparison {
  area: string;
  use: string;
  rv: string;
  cValue: string;
  rTax: string;
  totalTax: string;
}

export interface PropertyDetailsComparison {
  newRecord: PropertyRecordComparison;
  oldRecord: PropertyRecordComparison;
}

export interface GeoSequencingProperty {
  [key: string]: unknown;
  propertyId: number;
  propertyNo: string;
  category: string;
  propertyDescription: string;
  ownerName: string;
  occupierName: string;
  mobileNo: string;
  address: string;
  flatOrShopName: string;
  assessmentStatus: string;
  propertyDetailsCount: number;
  documentGuid: string | null;
  propertyDetailsComparison: PropertyDetailsComparison;
}

export interface GeoSequencingWard {
  wardId: number;
  wardNo: string;
  registeredProperties: number;
  geoSequencedProperties: CountBreakdown;
  propertyTypeBreakdown: PropertyTypeBreakdown;
  assessmentStatusBreakdown: AssessmentStatusBreakdown;
}

export interface GeoSequencingWardWiseItems {
  zoneId: number;
  zoneName: string;
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  wardData: GeoSequencingWard[];
  totalRow: GeoSequencingWard;
}

export interface GeoSequencingWardWiseResponse {
  success: boolean;
  message: string;
  items: GeoSequencingWardWiseItems[];
  errors: unknown | null;
  correlationId?: string | null;
}
