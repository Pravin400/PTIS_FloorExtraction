import {
  BackendUserDepartment,
  BackendUserModuleAccess,
  BackendUserRoleAllocation,
} from './schema.types';

export interface ModuleAccess {
  [key: string]: string[];
}

export interface User {
  id: string;
  userId: number;
  userName: string;
  userCode?: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  mobileNo: string;
  alternateMobileNo?: string;
  address?: string;
  isActive: boolean;
  twoFactorEnabled: boolean;
  twoFactorRequired: boolean;
  departmentNames: string[];
  departmentIds: string[];
  moduleNames: string[];
  moduleIds: string[];
  moduleAccess?: ModuleAccess;
  roles: string[];
  userRoleIds: number[];
  roleAccess?: Record<string, number[]>;
  status: 'Active' | 'Inactive';
  remark?: string;
  employeeTypeID?: number;
  language?: string;
  rawDepartments?: BackendUserDepartment[];
  rawModuleAccess?: BackendUserModuleAccess[];
  rawRoleAllocations?: BackendUserRoleAllocation[];
  createdBy?: number;
  createdDate?: string;
  [key: string]: unknown;
}

export interface Role {
  id: string;
  userRoleId: number;
  name: string;
  departmentId?: number;
  departmentName?: string;
  isActive: boolean;
  status: 'Active' | 'Inactive';
  userCount?: number;
  [key: string]: unknown;
}

export interface Designation {
  id: string;
  code: string;
  name: string;
  localName: string;
  description: string;
  status: string;
  isActive: boolean;
  userCount: number;
  [key: string]: unknown;
}

export interface Department {
  id?: number;
  departmentMasterId: number;
  departmentName: string;
  departmentCode: string;
}

export interface MasterModule {
  id?: number;
  moduleMasterId: number;
  moduleName: string;
  moduleCode: string;
  departmentMasterId?: number;
  departmentId?: number;
  departmentID?: number;
  departmentMasterID?: number;
  isActive?: boolean;
}
