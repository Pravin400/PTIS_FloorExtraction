import React from 'react';
import { User, Role, Designation, Department, MasterModule } from './models.types';
import { UserFormData, RoleFormData, DesignationFormData } from './form.types';

export interface UserManagementProps {
  initialUsers?: User[];
  initialTotalCount?: number;
}

export interface RoleDesignationMasterProps {
  initialRoles?: Role[];
  initialDesignations?: Designation[];
  departments?: Department[];
}

export interface UserConfigurationProps {
  translations?: {
    title?: string;
    subtitle?: string;
    usersTab?: string;
    rolesTab?: string;
  };
  initialData: {
    users: User[];
    totalCount: number;
    roles: Role[];
    departments: Department[];
    designations: Designation[];
  };
  fetchError?: string;
  statusCode?: number;
}

export interface UserConfigurationClientProps {
  userManagement: React.ReactNode;
  roleDesignationMaster: React.ReactNode;
  translations?: {
    title?: string;
    subtitle?: string;
    usersTab?: string;
    rolesTab?: string;
  };
  fetchError?: string;
  statusCode?: number;
}

export interface DesignationFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingDesignation: Designation | null;
  formData: DesignationFormData;
  setFormData: React.Dispatch<React.SetStateAction<DesignationFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
  errors?: Record<string, string>;
}

export interface DesignationTableProps {
  designations: Designation[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onEdit: (designation: Designation) => void;
  onDelete: (designation: Designation) => void;
  deletingId?: string | number | null;
}

export interface RoleDesignationStatsProps {
  rolesCount: number;
  totalRoleUsers: number;
  designationsCount: number;
  totalDesignationUsers: number;
  activeTab: string;
  onAddRole: () => void;
  onAddDesignation: () => void;
}

export interface RoleFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingRole: Role | null;
  formData: RoleFormData;
  setFormData: React.Dispatch<React.SetStateAction<RoleFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  departments?: Department[];
  isSubmitting?: boolean;
  errors?: Record<string, string>;
}

export interface RoleTableProps {
  roles: Role[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
  deletingId?: string | number | null;
}

export interface UserFiltersProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onAddClick: () => void;
}

export interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingUser: User | null;
  formData: UserFormData;
  setFormData: (data: UserFormData) => void;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  roles: Role[];
  departments: Department[];
  modules: MasterModule[];
  isSubmitting: boolean;
  handleNext: (e?: React.MouseEvent) => void;
  handlePrevious: (e?: React.MouseEvent) => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  currentIndex: number;
  toggleDepartment: (id: string) => void;
  toggleModule: (deptId: string, modId: string) => void;
  toggleRole: (deptId: string, roleId: number) => void;
  selectAllModules: (deptId: string, modules: MasterModule[]) => void;
  deselectAllModules: (deptId: string) => void;
  errors?: Record<string, string>;
}

export interface UserStatsProps {
  users: User[];
  cardFilter: string;
  onCardClick: (filter: 'all' | 'active' | 'inactive' | 'highest' | 'lowest') => void;
}

export interface UserTableProps {
  users: User[];
  totalCount: number;
  totalPages: number;
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  pageNumber: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  deletingId?: string | null;
}

export interface BasicInfoStepProps {
  formData: UserFormData;
  setFormData: (data: UserFormData) => void;
  editingUser: User | null;
  t: (key: string, params?: Record<string, string | number>) => string;
  errors?: Record<string, string>;
}

export interface DepartmentStepProps {
  departments: Department[];
  formData: UserFormData;
  toggleDepartment: (id: string) => void;
}

export interface ModuleAccessStepProps {
  formData: UserFormData;
  setFormData: (data: UserFormData) => void;
  departments: Department[];
  modules: MasterModule[];
  roles: Role[];
  setCurrentTab: (tab: string) => void;
  toggleModule: (deptId: string, modId: string) => void;
  selectAllModules: (deptId: string, modules: MasterModule[]) => void;
  deselectAllModules: (deptId: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}
