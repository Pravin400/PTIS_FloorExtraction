import type React from 'react';
import { ActionResult } from '../common.types';

/* ================= CORE MASTER DATA ================= */


export const MASTER_IDS = {
  TYPE: 'asset-type-master',
  CATEGORY: 'asset-category-master',
  INVENTORY_CATEGORY: 'inventory-category-master',
  INVENTORY_MODEL: 'inventory-model-master',
  INVENTORY_NAME: 'inventory-name-master',
  INVENTORY_CONDITION: 'inventory-condition-master',
  OWNERSHIP_TYPE: 'ownership-type-master',
  OWNING_DEPARTMENT: 'owning-department-master',
  TAX: 'gst-master',
  PENALTY: 'penalty-rule-master',
  ROOM_TYPE: 'room-type-master',
  TYPE_OF_USE: 'type-of-use-master',
  SUB_TYPE_OF_USE: 'sub-type-of-use-master',
  ASSET_PHOTO_TYPE: 'asset-photo-type',
} as const;

export type MasterId = typeof MASTER_IDS[keyof typeof MASTER_IDS];

export const MASTER_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
} as const;

export type MasterDataStatus = 'Active' | 'Inactive';

export type MasterDataRecord = {
  id: string;
  backendId?: string | number;
  name: string;
  typeNameLocal?: string;
  description?: string;
  group?: string;
  status: MasterDataStatus;
  displayOrder?: number;
  depreciationRate?: number;
  conditionFactor?: number;
  departmentId?: number;
  departmentName?: string;
  assetCategoryId?: number;
  assetCategoryName?: string;
  categoryName?: string;
  inventoryItemNameId?: number;
  inventoryItemName?: string;
  isMovable?: boolean;
  hasFloorDetails?: boolean;
  hasInventory?: boolean;
  isInventoryMandatory?: boolean;
  hasLegalCompliance?: boolean;
  valuationType?: string;
  allowUnitRegistration?: boolean;
  allowRoomRegistration?: boolean;
  isSubUnit?: boolean;
  taxPercentage?: number;
  effectiveFromDate?: string;
  effectiveToDate?: string | null;
  calculationType?: string;
  penaltyValue?: number;
  gracePeriodDays?: number;
};

export type MasterDataGroup = {
  id: string;
  name: string;
  count: number;
  description?: string;
  status?: MasterDataStatus;
  backendId?: string | number;
  code?: string;
  isMovable?: boolean;
  hasFloorDetails?: boolean;
  hasInventory?: boolean;
  isInventoryMandatory?: boolean;
  hasLegalCompliance?: boolean;
  valuationType?: string;
  allowUnitRegistration?: boolean;
  allowRoomRegistration?: boolean;
};

export type MasterDataType<T = MasterDataRecord> = {
  id: string;
  name: string;
  groups: MasterDataGroup[];
  records: T[];
  totalCount?: number;
  totalPages?: number;
  pageNumber?: number;
  pageSize?: number;
};

/* ================= PROPS, ACTIONS & UI ================= */

export interface MasterDataActions {
  createAction: (record: MasterDataRecord, masterId?: string) => Promise<ActionResult<void>>;
  updateAction: (id: string, record: MasterDataRecord, masterId?: string) => Promise<ActionResult<void>>;
  deleteAction: (id: string, masterId?: string) => Promise<ActionResult<void>>;
  /** Optional separate actions for the group/category panel (e.g. asset category actions on the asset-type page) */
  groupActions?: {
    createAction: (record: MasterDataRecord) => Promise<ActionResult<void>>;
    updateAction: (id: string, record: MasterDataRecord) => Promise<ActionResult<void>>;
    deleteAction: (id: string) => Promise<ActionResult<void>>;
  };
}

export interface MasterDataFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: MasterDataRecord, onSuccess?: () => void) => Promise<void>;
  editData: MasterDataRecord | null;
  masterId: string;
  selectedGroup: string;
  groups?: MasterDataGroup[];
  isPending?: boolean;
  existingCodes?: string[];
  existingNames?: string[];
}

export interface MasterDataFormErrors {
  code?: string;
  name?: string;
  group?: string;
  description?: string;
  depreciationRate?: string;
  conditionFactor?: string;
  taxPercentage?: string;
  effectiveFromDate?: string;
  calculationType?: string;
  penaltyValue?: string;
  gracePeriodDays?: string;
  departmentId?: string;
  displayOrder?: string;
}

export interface MasterTypesProps {
  selected: string;
  onSelect: (id: string) => void;
  masterTypes: MasterDataType[];
}

export interface GroupFilterProps {
  groups: MasterDataGroup[];
  selected: string;
  onSelect: (id: string) => void;
  masterId: string;
  title?: string;
  buttonLabel?: string;
  onAdd?: () => void;
  onEdit?: (group: MasterDataGroup) => void;
  onDelete?: (group: MasterDataGroup) => void;
  pagination?: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

export interface MasterDataRootProps {
  initialMaster?: string;
  initialGroup?: string;
  initialMasters?: MasterDataType[];
  actions?: MasterDataActions;
  children?: React.ReactNode;
}

export interface MasterTableRecordProps {
  master: MasterDataType;
  selectedGroup: string;
  onDelete: (row: MasterDataRecord, masterId: string) => Promise<void>;
  onSave: (payload: MasterDataRecord, masterId: string, editData: MasterDataRecord | null, onSuccess?: () => void) => Promise<void>;
  isPending?: boolean;
}

export interface MasterDataCommonProps {
  master: MasterDataType;
  selectedMaster: string;
  selectedGroup: string;
  isPending: boolean;
  onSelectMaster: (id: string) => void;
  onSelectGroup: (id: string) => void;
  masterTypes: MasterDataType[];
  onDelete: (row: MasterDataRecord, masterId: string) => Promise<void>;
  onSave: (payload: MasterDataRecord, masterId: string, editData: MasterDataRecord | null, onSuccess?: () => void) => Promise<void>;
  onSaveGroup: (payload: MasterDataRecord, editData: MasterDataRecord | null, onSuccess?: () => void) => Promise<void>;
  onDeleteGroup: (group: MasterDataGroup) => Promise<void>;
  pagination: {
    page: number;
    pageSize: number;
    search: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    totalCount: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    onSearch: (term: string) => void;
    onSort: (field: string, order: 'asc' | 'desc') => void;
  };
}
