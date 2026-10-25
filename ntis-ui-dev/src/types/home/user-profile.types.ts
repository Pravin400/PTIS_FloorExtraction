/**
 * User Profile Types
 * Types for the /api/users/{id} endpoint response
 */

/**
 * Base entity with common audit fields
 */
export interface BaseEntity {
  id: number;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

/**
 * User department association
 */
export interface UserDepartment extends BaseEntity {
  userId: number;
  departmentId: number;
  departmentName: string;
  departmentNameLocal: string;
}

/**
 * User module access association
 */
export interface UserModuleAccess extends BaseEntity {
  userId: number;
  departmentId: number;
  moduleId: number;
  departmentName: string;
  moduleName: string;
  moduleNameLocal: string;
}

/**
 * User role allocation association
 */
export interface UserRoleAllocation extends BaseEntity {
  userId: number;
  departmentId: number;
  userRoleId: number;
  departmentName: string;
  userRoleName: string;
}

/**
 * Full user profile response from /api/users/{id}
 */
export interface UserProfile extends BaseEntity {
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
  employeeTypeID: number;
  departments: UserDepartment[];
  moduleAccess: UserModuleAccess[];
  roleAllocations: UserRoleAllocation[];
}

/**
 * Computed display values for the user profile
 */
export interface UserProfileDisplayValues {
  fullName: string;
  email: string;
  roles: string[];
  departments: string[];
  modules: string[];
  userId: string;
  userCode: string;
  mobileNo: string;
  address: string;
  language: string;
  primaryRole: string;
  primaryDepartment: string;
  hasSettingsAccess?: boolean;
}

/**
 * Props for components that display user profile data
 */
export interface UserProfileProps {
  userId: number;
  isOpen?: boolean;
  onClose?: () => void;
}
