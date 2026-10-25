import { PagedResponse } from "./common.types";

/* =====================================================
   EXPORT PagedResponse for use in other modules
===================================================== */
export type { PagedResponse } from "./common.types";

/* =====================================================
   FLOOR - FORM MODEL
   Used in UI forms (create/update)
===================================================== */
export interface FloorFormModel {
  id?: number; // optional for create
  floorCode: string;
  descriptionEnglish: string;
  description: string;
  sequenceNo: number;
  fLatGenerationGroupId: number;
  fLatGenerationSeq: number;
  isActive: boolean;
  updatedBy?: number;
}

/* =====================================================
   FLOOR - ENTITY MODEL (DB RESPONSE)
===================================================== */
export interface Floor {
  [key: string]: unknown;

  id: number;
  floorCode: string;
  descriptionEnglish: string;
  description: string;
  sequenceNo: number;
  fLatGenerationGroupId: number;
  fLatGenerationSeq: number;

  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

/* =====================================================
   FLOOR - CREATE PAYLOAD (API)
===================================================== */
export interface FloorCreatePayload {
  floorCode: string;
  descriptionEnglish: string;
  description: string;
  sequenceNo: number;
  fLatGenerationGroupId: number;
  fLatGenerationSeq: number;
  isActive: boolean;
  createdBy?: number;
  createdDate?: string;
}

/* =====================================================
   FLOOR - LIST PROPS (UI TABLE)
===================================================== */
export interface FloorProps
  extends Omit<
    PagedResponse<Floor>,
    "items" | "hasPrevious" | "hasNext"
  > {
  data: Floor[];
  sortBy?: string;
  sortOrder?: string;
}

/* =====================================================
   SUBFLOOR - FORM MODEL
===================================================== */
export interface SubFloorFormModel {
  id?: number;
  subFloorCode: string;
  descriptionEnglish?: string;
  description: string;
  sequenceNo?: number | null | '';
  isActive: boolean;
  updatedBy?: number;
}

/* =====================================================
   SUBFLOOR - ENTITY MODEL
===================================================== */
export interface SubFloor {
  [key: string]: unknown;

  id: number;
  subFloorCode: string;
  descriptionEnglish?: string | null;
  description: string;
  sequenceNo: number | null;

  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

/* =====================================================
   SUBFLOOR - CREATE PAYLOAD
===================================================== */
export interface SubFloorCreatePayload {
  subFloorCode: string;
  descriptionEnglish?: string | null;
  description: string;
  sequenceNo?: number | null;
  isActive: boolean;
  createdBy?: number;
  createdDate?: string;
}

/* =====================================================
   SUBFLOOR - LIST PROPS
===================================================== */
export interface SubFloorProps
  extends Omit<
    PagedResponse<SubFloor>,
    "items" | "hasPrevious" | "hasNext"
  > {
  data: SubFloor[];
  sortBy?: string;
  sortOrder?: string;
}

/* =====================================================
   PAGINATED API RESPONSE (COMMON)
===================================================== */
export type FloorPagedResponse = PagedResponse<Floor>;
export type SubFloorPagedResponse = PagedResponse<SubFloor>;

/* =====================================================
   FLOOR MASTER - COMPONENT PROPS
===================================================== */
export interface FloorMasterProps {
  floorPaged: FloorPagedResponse;
  sortBy?: string;
  sortOrder?: string;
}

/* =====================================================
   SUBFLOOR MASTER - COMPONENT PROPS
===================================================== */
export interface SubFloorMasterProps {
  subFloorPaged: SubFloorPagedResponse;
}

/* =====================================================
   FLOOR RANGE - TEMPLATE MODEL
   Audit fields are derived server-side from the
   authenticated session, so they are optional here
   to avoid forcing UI callers to provide placeholder IDs.
===================================================== */
export interface FloorRangeTemplate {
  isActive: boolean;
  createdBy?: number;
  updatedBy?: number;
  floorCode: string;
  descriptionEnglish: string;
  description: string;
  sequenceNo: number;
  maxFloorNo: number;
  fLatGenerationGroupId: number;
  fLatGenerationSeq: number;
}

/* =====================================================
   FLOOR RANGE - API PAYLOAD
===================================================== */
export interface FloorRangePayload {
  rangeFrom: string;
  rangeTo: string;
  template: FloorRangeTemplate;
  startSequenceNo: number;
}

/* =====================================================
   FLOOR RANGE - FORM MODEL (UI)
===================================================== */
export interface FloorRangeFormModel {
  rangeFrom: number;
  rangeTo: number;
  isActive: boolean;
  autoGenerateSubFloor: boolean;
  fLatGenerationGroupId: number;
  fLatGenerationSeq: number;
}

/* =====================================================
   FLOOR RANGE - FIELDS PROPS (COMPONENT)
===================================================== */
export interface FloorRangeFieldsProps {
  formData: FloorRangeFormModel;
  errors: Partial<Record<keyof FloorRangeFormModel, string>>;
  showError: (field: keyof FloorRangeFormModel) => boolean;
  onChange: (field: keyof FloorRangeFormModel, value: string | number | boolean) => void;
  onBlur: (field: keyof FloorRangeFormModel) => void;
  groupOptions?: { label: string; value: string }[];
  onGroupChange?: (groupId: number) => void;
  labels?: Partial<{
    rangeStart: string;
    rangeStartPlaceholder: string;
    rangeEnd: string;
    rangeEndPlaceholder: string;
    flatGenerationGroup: string;
    flatGenerationGroupPlaceholder: string;
    flatGenerationSeq: string;
    flatGenerationSeqPlaceholder: string;
  }>;
}
/* =====================================================
   FLAT GENERATION GROUP OPTION
===================================================== */
export interface FlatGenerationGroupOption {
  id: number;
  name: string;
}
