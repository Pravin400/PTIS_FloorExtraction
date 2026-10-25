import { ApiResponse, PagedResponse } from "../common.types";

/**
 * Form model for creating and editing geography units
 * Used in UI forms to capture user input
 */
export interface GeographyUnitFormModel {
  id?: number; // Optional for create, required for update
  geographyTypeId: number | "";
  parentGeographyUnitId: number | null;
  geographyUnitCode: string;
  geographyUnitName: string;
  searchSequence: number;
  isActive: boolean;
  createdBy?: number;
  updatedBy?: number;
}

/**
 * Server response model for geography unit data
 * Represents the complete geography unit record from the database
 */
export interface GeographyUnit {
  [key: string]: unknown;
  id: number;
  geographyTypeId: number;
  geographyTypeCode: string;
  geographyType: string;
  parentGeographyUnitId: number | null;
  parentGeographyUnitName: string | null;
  geographyUnitCode: string;
  geographyUnitName: string;
  searchSequence: number;
  markedForDeletion: boolean;
  markedForDeletionDate: string | null;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

/**
 * A node in the geography unit hierarchy tree, returned by
 * GET /GeographyUnit/hierarchy-tree
 */
export interface GeographyUnitHierarchyNode {
  id: number;
  geographyUnitCode: string;
  geographyUnitName: string;
  geographyTypeId: number;
  geographyTypeCode: string;
  geographyType: string;
  levelNo: number;
  parentGeographyUnitId: number | null;
  children: GeographyUnitHierarchyNode[];
}

/**
 * Lightweight candidate returned by GET /GeographyUnit/parent-candidates?geographyTypeId=
 * Used to populate the Parent Unit dropdown, filtered by the selected Geography Type.
 */
export interface ParentGeographyUnitCandidate {
  id: number;
  geographyUnitCode: string;
  geographyUnitName: string;
}

/**
 * Props for Geography Unit list component
 * Note: the API does not support server-side sorting.
 */
export interface GeographyUnitProps extends Omit<PagedResponse<GeographyUnit>, 'items' | 'hasPrevious' | 'hasNext'> {
  data: GeographyUnit[];
}

export type PaginatedApiResponse<T> = ApiResponse<PagedResponse<T>>;
