import { WardItem } from "@/types/wardMaster.types";
import { ZonePropertyItem } from "@/types/zone-master/properties/zoneProperty.types";
import { PropertyType } from "@/types/property-type.types";
import { PropertyCategory } from "@/types/property-category.types";
import { TaxZone } from "@/types/taxzoning.types";
import { WingItem } from "@/types/zone-master/properties/wing.types";
import { Floor } from "@/types/floor.types";
import { SocietyDetailItem } from "@/types/zone-master/properties/societyDetails.types";

export interface ZoneItem {
  id: number;
  zoneNo: string;
  description: string | null;
  descriptionEnglish?: string | null;
  sequenceNo: number | null;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
  wardCount?: number;
}

export interface ZoneListResponse {
  items: ZoneItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface ZoneMutationResponse<T = ZoneItem | null> {
  success: boolean;
  message: string | null;
  items: T | null;
  errors: string[] | string | null;
}

export interface CreateZonePayload {
  zoneNo: string;
  description: string;
  descriptionEnglish?: string | null;
  sequenceNo?: number;
  isActive: boolean;
  createdBy: number;
}

export interface UpdateZonePayload {
  zoneNo: string;
  description: string;
  descriptionEnglish?: string | null;
  sequenceNo?: number;
  isActive: boolean;
  updatedBy: number;
}

/* ------------------------------------------------------------------ */
/* ZONE MASTER CONTENT TYPES (merged from zoneMasterContent.types.ts) */
/* ------------------------------------------------------------------ */

/**
 * Pagination data for zones
 */
export interface ZonePaginationData {
  zones: ZoneItem[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  searchTerm?: string;
}

/**
 * Pagination data for wards
 */
export interface WardPaginationData {
  wards: WardItem[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  searchTerm?: string;
}

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  totalZones: number;
  totalWards: number;
}

/**
 * SSR data for LinkWard drawer
 */
export interface SSRData {
  allWards?: WardItem[];
  allZones?: ZoneItem[];
  selectedWards?: WardItem[];
  viewAllWards?: WardItem[];
  viewAllWardsTotalCount?: number;
  viewAllWardsTotalPages?: number;
}

/**
 * Edit mode initial data
 */
export interface EditData {
  initialEditZoneData?: ZoneItem | null;
  initialEditWardData?: WardItem | null;
}

/**
 * Current selection state
 */
export interface SelectionState {
  selectedZoneId: number | null;
  selectedZone?: ZoneItem | null;
}

/**
 * Pagination data for properties (used in Properties tab)
 */
export interface PropertyPaginationData {
  properties: ZonePropertyItem[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  searchTerm?: string;
  selectedWardId: number | null;
  selectedWard?: WardItem | null;
  allWardsForDropdown?: WardItem[]; // All wards in zone for dropdown (no pagination)
}

/**
 * Lookup maps for property display
 */
export interface PropertyLookupMaps {
  categoryMap: Record<number, string>;
  propertyTypeMap: Record<number, string>;
}

/**
 * Active tab state for right panel
 */
export type RightPanelTab = "wards" | "properties";

/**
 * SSR data for Create Property drawer
 */
export interface CreatePropertyData {
  isOpen: boolean;
  propertyTypes: PropertyType[];
  propertyCategories: PropertyCategory[];
  taxZones: TaxZone[];
  /** Next available property number for auto-population (SSR fetched) */
  nextPropertyNumber: string;
}

/**
 * SSR data for Create Partition drawer
 */
export interface CreatePartitionData {
  isOpen: boolean;
  properties: ZonePropertyItem[];
  wings: WingItem[];
  floors: Floor[];
  societyDetails: SocietyDetailItem[];
  /** Next partition number for auto-population (SSR fetched) */
  nextPartitionNumber: number | null;
}

/**
 * SSR data for Delete Property drawer
 */
export interface DeletePropertyData {
  isOpen: boolean;
  properties: ZonePropertyItem[];
}

export interface DirectPropertyDeleteRow {
  propertyId: string;
  wardNo: string;
  propertyNo: string;
  partitionNo: string;
  categoryName: string;
}
