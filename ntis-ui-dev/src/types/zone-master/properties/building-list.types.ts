/**
 * Types for Building List API
 * Used in PropertyPartitionForm for fetching main properties by ward
 */
/**
 * Individual building item from the Building-list API
 */
export interface BuildingListItem {
  propertyId: number;
  wardNo: string;
  propertyNo: string;
  catPropertyCategoryName: string;
  partitionNo: string | null;
}
/**
 * Response from the Building-list API
 * Returns an array of BuildingListItem
 */
export type BuildingListResponse = BuildingListItem[];
