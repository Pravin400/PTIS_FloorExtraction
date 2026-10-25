import { ApiResponse, PagedResponse } from "../common.types";
import { DepartmentMaster } from "../departmentMaster.types";

/**
 * Form model for creating and editing GIS KPI masters
 * Used in UI forms to capture user input
 */
export interface GisKpiMasterFormModel {
  id?: number; // Optional for create, required for update
  kpiCode: string;
  defaultTitle: string;
  defaultIcon: string;
  defaultColor: string;
  isActive: boolean;
}

/**
 * Server entity model for GIS Department KPI Mapping
 * Matches endpoint /GisDepartmentKpiMapping
 */
export interface GisDepartmentKpiMapping {
  id: number;
  departmentId: number;
  departmentName?: string | null;
  kpiMasterId: number;
  kpiCode?: string | null;
  defaultTitle?: string | null;
  customTitle?: string | null;
  customIcon?: string | null;
  customColor?: string | null;
  displayOrder?: number | null;
  isActive: boolean;
  createdDate?: string | null;
  updatedDate?: string | null;
  [key: string]: unknown;
}

export interface GisDepartmentKpiMappingPayload {
  id?: number;
  departmentId: number;
  kpiMasterId: number;
  customTitle?: string | null;
  customIcon?: string | null;
  customColor?: string | null;
  displayOrder: number;
  isActive: boolean;
}

/**
 * Server entity model for GIS KPI master
 * Represents the complete record from the backend database
 */
export interface GisKpiMaster {
  [key: string]: unknown;
  id: number;
  kpiCode: string;
  defaultTitle: string;
  defaultIcon: string;
  defaultColor: string;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
  mappedDepartments?: GisDepartmentKpiMapping[];
}

/**
 * API payload for creating a new GIS KPI master
 */
export interface GisKpiMasterCreatePayload {
  kpiCode: string;
  defaultTitle: string;
  defaultIcon: string;
  defaultColor: string;
  isActive: boolean;
}

/**
 * API payload for updating an existing GIS KPI master
 */
export interface GisKpiMasterUpdatePayload {
  id: number;
  kpiCode: string;
  defaultTitle: string;
  defaultIcon: string;
  defaultColor: string;
  isActive: boolean;
}

/**
 * Props for GIS KPI Master list component
 */
export interface GisKpiMasterProps
  extends Omit<PagedResponse<GisKpiMaster>, "items" | "hasPrevious" | "hasNext"> {
  data: GisKpiMaster[];
  departmentMappings?: GisDepartmentKpiMapping[];
  departments?: DepartmentMaster[];
  selectedDepartmentId?: string;
  sortBy?: string;
  sortOrder?: string;
}

/**
 * Paginated API response wrapper for GIS KPI master
 */
export type PaginatedGisKpiApiResponse = ApiResponse<PagedResponse<GisKpiMaster>>;
