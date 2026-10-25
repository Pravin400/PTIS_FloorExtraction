import { DepartmentApiResponse } from './entities.types';

export * from './ui-constants';

/**
 * UI-friendly config item representation
 * Merged from ConfigKeyMaster and ConfigValueMaster for display
 */
export interface ConfigItem {
  id: string;
  configKeyId: number;
  configValueId: number;
  categoryId?: number;
  name: string;
  configCode: string;
  description: string;
  value: string | number | boolean;
  defaultValue: string | number | boolean;
  isEnabled: boolean;
  category: string;
  categoryName?: string;
  type: 'boolean' | 'number' | 'select' | 'text';
  controlType: string;
  dataType: string;
  options?: string[];
  stats: {
    deptOverrides: number;
    userOverrides: number;
    totalDepts: number;
    totalUsers: number;
  };
  hasTag: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
  ulbId?: number;
  moduleId?: number | null;
  departmentId?: number;
  createdDate?: string | null;
  updatedDate?: string | null;
}

/**
 * UI Category with extensive metadata
 */
export interface ConfigCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  count: number;
  total: number;
  isActive: boolean;
  displayOrder: number;
  color: 'rose' | 'emerald' | 'blue' | 'violet' | 'purple' | 'cyan';
  icon: string;
}

export interface ConfigurationCardsProps {
  categories: ConfigCategory[];
  activeCategoryId: string;
  onSelectCategory: (id: string) => void;
}

export interface ConfigurationListProps {
  items: ConfigItem[];
  categories: ConfigCategory[];
  activeCategory: ConfigCategory;
  onToggle: (id: string, currentStatus: boolean) => void;
  onCategoryStatus: (isActive: boolean) => void;
  onRefresh: () => void;
  onDeleteCategory?: (categoryId: string) => void;
  configKeyId?: number;
  initialDepartmentData?: DepartmentApiResponse[];
  searchTerm?: string;
}

export interface AddConfigKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId?: number;
  categories?: ConfigCategory[];
  onSuccess?: () => void;
  initialData?: ConfigItem | null;
}

export interface AddConfigValueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  categories: ConfigCategory[];
  configItems: ConfigItem[];
}

export interface DepartmentConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  configName: string;
  configKeyId: number;
  description?: string;
  dataType?: string;
  controlType?: string;
  defaultValue?: string | number | boolean;
  options?: string[];
  initialData?: DepartmentApiResponse[];
}
