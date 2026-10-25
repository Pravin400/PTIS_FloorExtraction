import {
  BackendUserDepartment,
  BackendUserModuleAccess,
  BackendUserRoleAllocation,
} from './schema.types';
import { ModuleAccess, User } from './models.types';

export interface UserFormData {
  userName: string;
  userCode: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  mobileNo: string;
  alternateMobileNo: string;
  userRoleIds: number[];
  roleAccess: Record<string, number[]>;
  address: string;
  remark: string;
  departmentIds: string[];
  moduleAccess: ModuleAccess;
  isActive: boolean;
  status: User['status'];
  rawDepartments?: BackendUserDepartment[];
  rawModuleAccess?: BackendUserModuleAccess[];
  rawRoleAllocations?: BackendUserRoleAllocation[];
  createdBy?: number;
  createdDate?: string;
}

export interface RoleFormData {
  name: string;
  departmentId: number | string;
  departmentName?: string;
  isActive: boolean;
}

export interface DesignationFormData {
  code: string;
  name: string;
  localName: string;
  description: string;
  status: string;
  isActive: boolean;
}

export type UserStatusFilter = 'all' | 'active' | 'inactive' | 'highest' | 'lowest';
