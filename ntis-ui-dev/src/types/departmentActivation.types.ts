/**
 * Department Activation Types
 */

export interface Department {
  departmentId: number;
  departmentCode: string;
  departmentName: string;
  departmentNameLocal: string | null;
  departmentIcon: string | null;
  departmentDescription: string;
  isActive: boolean;
  createdDate?: string | null;
  updatedDate?: string | null;
  createdBy?: number | null;
  updatedBy?: number | null;
}

export interface DepartmentUpdateRequest {
  departmentId: number;
  departmentCode: string;
  departmentName: string;
  departmentNameLocal: string | null;
  departmentIcon: string | null;
  departmentDescription: string;
  isActive: boolean;
}

export interface Module {
  moduleId: number;
  departmentId: number;
  moduleCode: string;
  moduleName: string;
  moduleNameLocal: string | null;
  moduleIcon: string | null;
  moduleLabel: string | null;
  moduleDescription: string;
  isActive: boolean;
  departmentName: string;
  createdDate?: string | null;
  updatedDate?: string | null;
  createdBy?: number | null;
  updatedBy?: number | null;
}

export interface ModuleUpdateRequest {
  moduleId: number;
  departmentId: number;
  moduleCode: string;
  moduleName: string;
  moduleNameLocal: string | null;
  moduleIcon: string | null;
  moduleLabel: string | null;
  moduleDescription: string;
  isActive: boolean;
}

export interface DepartmentListResponse {
  items: Record<string, unknown>[];
}

export interface ModuleListResponse {
  items: Record<string, unknown>[];
}

export interface DepartmentActivationProps {
  initialDepartments: Department[];
  initialModules: Module[];
  initialSearchTerm?: string;
}

export interface DepartmentCardProps {
  department: Department;
  onToggle: (id: number, currentDepartment: Department) => void;
  onConfigure: (dept: Department) => void;
  configureButtonText: string;
}

export interface SubmoduleConfigDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  department: Department | null;
  modules: Module[];
}
