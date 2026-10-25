export type AccessLevel = 'no-access' | 'view' | 'edit' | 'delete' | 'full';

export interface PaginationData {
  totalCount: number;
  activeCount?: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  pageNumber: number;
  pageSize: number;
}

export interface ScreenMasterData {
  screenMasterId?: number; // Standardized primary identifier
  screenGroupId: number;
  screenGroupName?: string;
  moduleId: number | null;
  moduleName?: string | null;
  screenCode: string;
  screenName: string;
  screenNameLocal: string;
  screenIcon: string;
  routePath: string;
  isMenu: boolean;
  isAuthenticationRequired: boolean;
  isActive: boolean;
  displayOrder: number;
  description?: string;
  departmentMasterId?: number | null;
  createdDate?: string | null;
  updatedDate?: string | null;
  createdBy?: number | null;
  updatedBy?: number | null;
}

export type ScreenMasterDataWithExtras = ScreenMasterData & {
  [key: string]: unknown;
};

export interface DepartmentMasterData {
  departmentId?: number;
  departmentMasterId?: number;
  departmentName: string;
  departmentCode?: string;
}

export interface ModuleMasterData {
  moduleId?: number;
  moduleMasterId?: number;
  moduleName: string;
  departmentId?: number;
  departmentMasterId?: number;
  isActive?: boolean;
}

export interface ScreenGroupMasterData {
  screenGroupId: number;
  screenGroupName: string;
  screenGroupLocalName?: string;
  screenGroupCode: string;
  screenGroupIcon: string;
  displayOrder: number;
  isActive: boolean;
  description?: string;
  createdDate?: string | null;
  updatedDate?: string | null;
  createdBy?: number | null;
  updatedBy?: number | null;
}

export type ScreenGroupMasterDataWithExtras = ScreenGroupMasterData & {
  [key: string]: unknown;
};

export interface RoleScreenAccess {
  roleId: number;
  roleName: string;
  screenAccess: Record<string, AccessLevel>;
}

export interface RoleMasterData {
  roleMasterId: number;
  roleCode: string;
  roleName: string;
  isActive: boolean;
  departmentId?: number;
}

export interface ScreenAccessPermissionData {
  id?: number;
  roleId: number;
  screenId: number;
  accessLevel: AccessLevel;
  createdBy?: number;
  updatedBy?: number;
}

export type ScreenMasterFieldErrors = Partial<Record<keyof ScreenMasterData, string>>;
export type ScreenGroupMasterFieldErrors = Partial<Record<keyof ScreenGroupMasterData, string>>;
