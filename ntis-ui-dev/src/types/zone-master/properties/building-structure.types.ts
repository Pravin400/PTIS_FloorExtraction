/**
 * Types for Building Structure generation
 * Used in Zone Master for property partition wing creation
 */

/**
 * Single unit (flat/shop) in a building structure
 * Matches API response from generate-buildingstructure
 */
export interface BuildingStructureItem {
  wardId: number;
  propertyNo: string;
  wingId: number;
  rowNo: number;
  floorNo: number;
  floorCode: string;
  propertyFloorId: number;
  unitNo: number;
  flatNo: string;
  partitionNo: string;
  generationType: string;
}

/**
 * Payload for generating building structure preview
 */
export interface GenerateBuildingStructurePayload {
  wardId: number;
  propertyNo: string;
  wingId: number;
  fromFloor: string;
  toFloor: string;
  noOfFlatOnOneFloor: number;
  flatStart: number;
  incrementedBy: number;
  prifix?: string; // API uses this spelling
  generationType: string;
}

/**
 * Response from building structure generation API
 * GET /api/Property/generate-buildingstructure
 */
export interface BuildingStructureResponse {
  items: BuildingStructureItem[] | null;
  errors: string[] | string | null;
  correlationId?: string | null;
}
