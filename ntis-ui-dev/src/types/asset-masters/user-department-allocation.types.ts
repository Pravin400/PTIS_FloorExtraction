export interface UserDepartmentRoleItem {
  id: number;
  userId: number;
  departmentId: number;
  userRoleId?: number;
  departmentName?: string;
  departmentNameLocal?: string;
  userRoleName?: string;
  isActive: boolean;
}

export interface UserAccessAllocationItem {
  id: number;
  userId: number;
  owningDepartmentId?: number | null;
  owningDepartmentName?: string | null;
  designationId?: number | null;
  designationName?: string | null;
  zoneId?: number | null;
  zoneNo?: string | null;
  zoneDescription?: string | null;
  wardId?: number | null;
  wardNo?: string | null;
  wardDescription?: string | null;
  isActive: boolean;
}

export interface AllocatedMasterItem {
  id: number;
  code?: string | null;
  name?: string | null;
}

export interface UserAssetAccessAllocationSingle {
  id: number;
  userId: number;
  owningDepartmentIds?: string | null;
  designationIds?: string | null;
  zoneIds?: string | null;
  wardIds?: string | null;
  owningDepartments?: AllocatedMasterItem[];
  designations?: AllocatedMasterItem[];
  zones?: AllocatedMasterItem[];
  wards?: AllocatedMasterItem[];
  isActive?: boolean;
}

export interface AssetUserListItem {
  [key: string]: unknown;
  id: number;
  userName: string;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  userCode?: string | null;
  address?: string | null;
  mobileNo?: string | null;
  alternateMobileNo?: string | null;
  email?: string | null;
  employeeTypeID?: number | null;
  language?: string | null;
  remark?: string | null;
  mustChangePassword?: boolean;
  isActive: boolean;
  createdDate?: string | null;
  updatedDate?: string | null;
  departments: UserDepartmentRoleItem[];
  roleAllocations: UserDepartmentRoleItem[];
  owningDepartments?: UserOwningDepartmentAllocationItem[];
  zoneAllocations?: UserZoneAllocationItem[];
  stageAccess?: UserStageAccessAllocationItem[];
  accessAllocation?: UserAssetAccessAllocationSingle | null;
  accessAllocations: UserAccessAllocationItem[];
}

export interface OwningDepartmentOption {
  id: number;
  owningDepartmentName: string;
  description?: string;
  isActive: boolean;
}

export interface ZoneOption {
  id: number;
  zoneNo: string;
  description?: string;
  isActive: boolean;
}

export interface WardOption {
  id: number;
  wardNo: string;
  description?: string;
  zoneId?: number;
}

export interface SaveUserAllocationResult {
  ok: boolean;
  error?: string;
  message?: string;
  statusCode?: number;
}

export interface GrievanceWorkflowStageOption {
  id: number;
  stageCode: string;
  stageName: string;
  stageNameLocal?: string | null;
  description?: string | null;
  stageOrder?: number;
  status?: string | null;
  isActive: boolean;
}

export interface OwningDepartmentAllocationItemDto {
  owningDepartmentId: number;
  designationId?: number | null;
}

export interface ZoneAllocationItemDto {
  zoneId: number;
  wardIds?: number[];
}

export interface StageAccessAllocationItemDto {
  stageId: number;
}

export interface UserOwningDepartmentAllocationItem {
  id: number;
  userId: number;
  owningDepartmentId: number;
  owningDepartmentName?: string | null;
  designationId?: number | null;
  designationName?: string | null;
  isActive?: boolean;
}

export interface UserZoneAllocationItem {
  id: number;
  userId: number;
  zoneId: number;
  zoneNo?: string | null;
  zoneDescription?: string | null;
  wardId?: number | null;
  wardNo?: string | null;
  wardDescription?: string | null;
  allocatedWardCount?: number;
  isActive?: boolean;
}

export interface UserStageAccessAllocationItem {
  id: number;
  userId: number;
  stageId: number;
  stageCode?: string | null;
  stageName?: string | null;
  isActive?: boolean;
}

export interface AllocationPayloadItem {
  owningDepartmentId?: number | null;
  designationId?: number | null;
  zoneId?: number | null;
  wardId?: number | null;
}

export interface SaveAssetUserAllocationPayload {
  userId: number;
  owningDepartments?: OwningDepartmentAllocationItemDto[];
  zoneAllocations?: ZoneAllocationItemDto[];
  stageAccess?: StageAccessAllocationItemDto[];
}

export interface UpdateAssetUserAllocationPayload {
  owningDepartments?: OwningDepartmentAllocationItemDto[];
  zoneAllocations?: ZoneAllocationItemDto[];
  stageAccess?: StageAccessAllocationItemDto[];
}

export interface UserDepartmentAllocationMasterProps {
  data: AssetUserListItem[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: string;
  owningDepartments?: OwningDepartmentOption[];
  zones?: ZoneOption[];
  stages?: GrievanceWorkflowStageOption[];
}
