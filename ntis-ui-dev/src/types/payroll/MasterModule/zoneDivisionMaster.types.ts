/**
 * Zone / Division Office Master TypeScript definitions (PTIS Standard)
 * Maps to database table: Payroll.ZoneDivisionMaster
 */

export const ZONE_DIVISION_STATUS_FILTERS = ['all', 'active', 'inactive'] as const;
export type ZoneDivisionStatusFilter = (typeof ZONE_DIVISION_STATUS_FILTERS)[number];

/** Raw Backend DTO representation (both PascalCase and camelCase) */
export interface ZoneDivisionMasterDto {
  id?: number | string;
  Id?: number | string;
  zoneDivisionId?: string | number;
  ZoneDivisionId?: string | number;
  ZoneDivisionID?: string | number;
  zoneDivisionCode?: string;
  ZoneDivisionCode?: string;
  zoneDivisionName?: string;
  ZoneDivisionName?: string;
  zoneDivisionNameRegional?: string;
  ZoneDivisionNameRegional?: string;
  address?: string;
  Address?: string;
  isActive?: boolean;
  IsActive?: boolean;
  markedForDeletion?: boolean;
  MarkedForDeletion?: boolean;
  markedForDeletionDate?: string | null;
  MarkedForDeletionDate?: string | null;
  createdDate?: string;
  CreatedDate?: string;
  updatedDate?: string | null;
  UpdatedDate?: string | null;
}

/** Normalized Frontend Domain Item */
export type ZoneDivisionMasterItem = {
  /** Primary database ID from backend (number if numeric, or undefined) */
  id?: number | string;
  /** Primary identifier string (e.g. "1" or "ZONE-001") */
  zoneDivisionId: string;
  /** Unique office code (e.g. DIV-EAST, HQ-1, ZONE-NORTH) */
  zoneDivisionCode: string;
  /** English display name */
  zoneDivisionName: string;
  /** Regional display name */
  zoneDivisionNameRegional?: string;
  /** Physical street / building address */
  address: string;
  /** Active status indicator for the master record */
  isActive: boolean;
  /** Soft delete indicator */
  markedForDeletion?: boolean;
  markedForDeletionDate?: string | null;
  /** Audit timestamps */
  createdDate?: string;
  updatedDate?: string | null;
};

/** Form data representation used inside the form drawer */
export interface ZoneDivisionFormData {
  zoneDivisionCode: string;
  zoneDivisionName: string;
  zoneDivisionNameRegional: string;
  address: string;
  isActive: boolean;
}

/** Clean payload sent to create / update server actions and API */
export type ZoneDivisionMasterPayload = {
  zoneDivisionCode: string;
  zoneDivisionName: string;
  zoneDivisionNameRegional?: string;
  address: string;
  isActive: boolean;
};

export interface ZoneDivisionMasterFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ZoneDivisionMasterPayload) => Promise<boolean | void>;
  initialItem?: ZoneDivisionMasterItem | null;
  existingItems?: ZoneDivisionMasterItem[];
  existingCodes?: string[];
}

export interface ZoneDivisionMasterTableProps {
  data: ZoneDivisionMasterItem[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onEdit: (item: ZoneDivisionMasterItem) => void;
  onDelete: (item: ZoneDivisionMasterItem) => void;
}

export interface ZoneDivisionMasterViewProps {
  initialItems: ZoneDivisionMasterItem[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UseZoneDivisionMasterFormOptions {
  isOpen: boolean;
  initialItem?: ZoneDivisionMasterItem | null;
  existingCodes?: Set<string>;
  existingItems?: ZoneDivisionMasterItem[];
  onSave: (data: ZoneDivisionMasterPayload) => Promise<boolean | void>;
  onClose: () => void;
}
