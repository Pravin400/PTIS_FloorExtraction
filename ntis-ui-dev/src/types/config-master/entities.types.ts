/**
 * Config Master API Entities
 * Strictly aligned with .NET Backend API JSON responses
 */

export interface ConfigCategoryMaster {
  categoryId: number;
  categoryCode: string;
  categoryName: string;
  displayOrder: number;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

export interface ConfigKeyMaster {
  configKeyId: number;
  categoryId: number;
  configCode: string;
  configName: string;
  description: string;
  dataType: string;
  controlType: string;
  defaultValue: string;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

export interface ConfigValueMaster {
  configValueId: number;
  configKeyId: number;
  departmentId: number | null;
  moduleId: number | null;
  moduleName: string | null;
  value: string;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

export interface DepartmentMaster {
  departmentId: number;
  departmentCode: string;
  departmentName: string;
  departmentNameLocal: string | null;
  departmentIcon: string | null;
  departmentDescription: string | null;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

export interface ModuleMaster {
  moduleId: number;
  departmentId: number;
  moduleCode: string;
  moduleName: string;
  moduleNameLocal: string | null;
  moduleIcon: string | null;
  moduleLabel: string | null;
  moduleDescription: string | null;
  departmentName: string | null;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

/**
 * Normalized Department configuration response shape
 * Returned by getDepartmentConfigurationAction
 */
export interface DepartmentApiResponse {
  id: number;
  name: string;
  code: string;
  isEnabled: boolean;
  configValueId: number;
  value: string;
  submoduleCount: number;
  submodules: SubmoduleApiResponse[];
}

export interface SubmoduleApiResponse {
  id: number;
  title: string;
  code: string;
  desc: string;
  isEnabled: boolean;
  configValueId: number;
  value: string;
}
