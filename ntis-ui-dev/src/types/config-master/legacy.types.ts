import { LucideIcon } from 'lucide-react';

export interface SubmoduleConfig {
  submoduleId: string;
  submoduleName: string;
  passwordExpiryDays: number;
  sessionTimeoutMinutes: number;
  enableTwoFactorAuth: boolean;
}

export interface DepartmentConfig {
  departmentId: string;
  departmentName: string;
  passwordExpiryDays: number;
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  enableTwoFactorAuth: boolean;
  requirePasswordChange: boolean;
  passwordComplexity: 'low' | 'medium' | 'high';
  submodules: Record<string, SubmoduleConfig>;
}

export interface SubmoduleBillingConfig {
  submoduleId: string;
  submoduleName: string;
  enableAutoBillGeneration: boolean;
  billGenerationDay: number;
  billGenerationFrequency: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly' | 'custom';
  customDates: string[];
  dueAfterDays: number;
}

export interface BillingConfig {
  departmentId: string;
  departmentName: string;
  enableAutoBillGeneration: boolean;
  billGenerationDay: number;
  billGenerationFrequency: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly' | 'custom';
  customDates: string[];
  dueAfterDays: number;
  enableLateFeePenalty: boolean;
  lateFeePercentage: number;
  enableReminders: boolean;
  reminderDaysBefore: number;
  submodules: Record<string, SubmoduleBillingConfig>;
}

export interface GlobalConfig {
  defaultPasswordExpiryDays: number;
  defaultSessionTimeoutMinutes: number;
  defaultMaxLoginAttempts: number;
  enableAuditLog: boolean;
  enableGlobalTwoFactorAuth: boolean;
  defaultPasswordComplexity: 'low' | 'medium' | 'high';
}

export interface ULB {
  id: string;
  code: string;
  name: string;
  type: string;
  category: string;
  state: string;
  district: string;
  address: string;
  pincode: string;
  contactPerson: string;
  designation: string;
  phone: string;
  email: string;
  website: string;
  population: number;
  area: number;
  established: string;
  departmentsActive: number;
  isActive: boolean;
  status: string;
}

export interface ModuleAccess {
  [key: string]: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  designation: string;
  hierarchyLevel: string;
  office: string;
  departments: string[];
  moduleAccess: ModuleAccess;
  isActive: boolean;
  status: 'Active' | 'Inactive' | 'Suspended';
  lastLogin: string;
  createdDate: string;
}

export interface ConfigMasterProps {
  initialDepartments?: DepartmentConfig[];
  initialGlobalConfig?: GlobalConfig;
}

export interface DepartmentMasterProps {
  initialDepartments?: DepartmentConfig[];
}

export interface ULBMasterProps {
  initialULBs?: ULB[];
}

export interface UserManagementProps {
  initialUsers?: User[];
}

export interface FormState {
  categoryId: string;
  configCode: string;
  configName: string;
  description: string;
  dataType: string;
  controlType: string;
  defaultValue: string;
  isActive: boolean;
}

export interface Submodule {
  id: number;
  title: string;
  code: string;
  desc: string;
  isEnabled: boolean;
  configValueId: number;
  value: string;
}

export interface Department {
  id: number;
  name: string;
  submoduleCount: number;
  isEnabled: boolean;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  configValueId: number;
  value: string;
  code: string;
  submodules: Submodule[];
}
