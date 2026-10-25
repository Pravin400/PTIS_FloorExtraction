export interface BackendUserDepartment {
  id?: number;
  userId?: number;
  departmentId: number;
  departmentName?: string;
  isActive: boolean;
  createdBy?: number;
  createdDate?: string;
}

export interface BackendUserModuleAccess {
  id?: number;
  userId?: number;
  departmentId: number;
  moduleId: number;
  moduleName?: string;
  isActive: boolean;
  createdBy?: number;
  createdDate?: string;
}

export interface BackendUserRoleAllocation {
  id?: number;
  userId?: number;
  departmentId: number;
  userRoleId: number;
  userRoleName?: string;
  isActive: boolean;
  createdBy?: number;
  createdDate?: string;
}

export interface BackendUser {
  id: number;
  userName: string;
  firstName: string;
  middleName: string;
  lastName: string;
  userCode: string;
  address: string;
  mobileNo: string;
  alternateMobileNo: string;
  email: string;
  mustChangePassword: boolean;
  language: string;
  remark: string;
  isActive: boolean;
  twoFactorEnabled: boolean;
  twoFactorRequired: boolean;
  departments: BackendUserDepartment[];
  moduleAccess: BackendUserModuleAccess[];
  roleAllocations: BackendUserRoleAllocation[];
  createdBy?: number;
  updatedBy?: number;
  employeeTypeID?: number;
  createdDate?: string;
}

export interface BackendUserRole {
  id: number;
  userRoleName: string;
  departmentId?: number;
  departmentName?: string;
  isActive: boolean;
}

export interface BackendDesignation {
  id: number;
  designationCode: string;
  designationName: string;
  designationLocal: string;
  designationDescription: string;
  isActive: boolean;
}

export interface UserResponse {
  items: BackendUser[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface UserRoleResponse {
  items: BackendUserRole[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface DesignationResponse {
  items: BackendDesignation[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}
