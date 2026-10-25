/**
 * Grievance Category Component Props Types
 */
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import type {
  GrievanceCategory,
  FormTranslations,
  GrievanceCategoryFormModel,
} from './grievance-category.types';
import type { DepartmentMaster } from '../departmentMaster.types';

export interface GrievanceCategoryFormClientProps {
  editingCategory: GrievanceCategory | null;
  departments: DepartmentMaster[];
  locale: string;
  isEdit: boolean;
  translations: FormTranslations;
  serverAction: (
    formData: FormData
  ) => Promise<{ success: boolean; error?: string; fieldErrors?: Record<string, string> }>;
  returnPath?: string;
}

export interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color?: 'blue' | 'rose' | 'indigo' | 'amber';
  trend?: { value: number; isPositive: boolean };
}

export interface GrievanceCategoryListProps {
  categories: GrievanceCategory[];
  isLoading?: boolean;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  locale: string;
  totalCount: number;
  page: number;
  pageSize: number;
  departments: DepartmentMaster[];
  searchParams: {
    search: string;
    department: number | null | string;
    status: boolean | null | string;
  };
  headerTitle?: string;
  headerSubtitle?: string;
  emptyText?: string;
  headerExtra?: ReactNode;
}

export interface GrievanceCategoryFilterProps {
  locale: string;
  initialSearch: string;
  initialDepartment: number | null | string;
  initialStatus: boolean | null | string;
  departments: DepartmentMaster[];
  onSearchChange?: (value: string) => void;
  onDepartmentChange?: (id: number | null) => void;
  onStatusChange?: (status: boolean | null) => void;
}

export interface GrievanceCategoryPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export interface Column<T> {
  key: string;
  header: string;
  render?: (value: unknown, row: T) => ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface GrievanceCategoryActionsProps {
  categoryId: number;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  isDeleting?: boolean;
  isEditing?: boolean;
}

export interface GrievanceCategoryDrawerClientProps {
  children: ReactNode;
  isEdit?: boolean;
  returnPath?: string;
}

export interface GrievanceCategoryMasterViewProps {
  data: GrievanceCategory[];
  departments: DepartmentMaster[];
  isLoading?: boolean;
  locale: string;
  pageSize: number;
  page: number;
  totalCount: number;
  initialSearch: string;
  initialDepartment: number | null | string;
  initialStatus: boolean | null | string;
  stats: { total: number; avgSla: number; active: number; critical: number };
  children?: ReactNode;
  fetchError?: string;
  statusCode?: number;
}

export interface GrievanceCategoryDrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title: string;
}

export interface GrievanceCategoryFormFieldsProps {
  formData: {
    id?: number;
    categoryCode: string;
    categoryName: string;
    departmentId: number | null | undefined;
    priority: string;
    resolutionSla: string;
    escalationLevel: string;
    description: string;
    isActive: boolean;
  };
  fieldErrors: Record<string, string>;
  onFieldChange: (
    field: keyof GrievanceCategoryFormModel,
    value: GrievanceCategoryFormModel[keyof GrievanceCategoryFormModel]
  ) => void;
  departmentOptions: { label: string; value: string }[];
  priorityOptions: { label: string; value: string }[];
  escalationOptions: { label: string; value: string }[];
  t: { fields: Record<string, string>; errors: Record<string, string> };
  isEdit: boolean;
  isSubmitting: boolean;
  tCommonNote: (key: string) => string;
}

export interface GrievanceCategoryFormServerProps {
  editingCategory: GrievanceCategory | null;
  departments: DepartmentMaster[];
  locale: string;
  returnPath?: string;
}

export interface GrievanceCategoryFormActionsProps {
  onCancel: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isEdit: boolean;
  hasChanges: boolean;
  t: { buttons: Record<string, string> };
  canSave: boolean;
}
