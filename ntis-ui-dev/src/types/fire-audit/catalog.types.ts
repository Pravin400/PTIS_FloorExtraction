export interface FireAuditCatalogRow extends Record<string, unknown> {
  id: number;
  code: string;
  name: string;
  detail: string;
  isActive: boolean;
}

export type FireAuditCatalogId =
  | "occupancy"
  | "bands"
  | "checklistItems"
  | "matrix"
  | "applicationTypes"
  | "documentTypes"
  | "stations"
  | "feeHeads"
  | "feeRules"
  | "statuses";

export interface JurisdictionNodeItem {
  code: string;
  name: string;
}

export interface JurisdictionHierarchyData {
  nodes: JurisdictionNodeItem[];
  sectors: string[];
  wards: string[];
}

export interface AuditorFilterLookupData {
  applicationTypes: Array<{ code: string; name: string }>;
  occupancies: Array<{ code: string; name: string }>;
  nodes: JurisdictionNodeItem[];
  sectors: string[];
  wards: string[];
  riskCategories: Array<{ code: string; name: string }>;
}

