export type UseStatus = "Active" | "Inactive";

export type UseGroupIconKey =
  | "grid"
  | "home"
  | "building"
  | "factory"
  | "school"
  | "leaf"
  | "map"
  | "plots"
  | "parking"
  | "other";

// Translation function type for next-intl
export type TranslatorFunction = (key: string, values?: Record<string, string | number>) => string;

// Matches API response exactly: /TypeOfUseGroup
export interface UseGroup {
  typeOfUseGroupId: number;
  typeOfUseGroupCode: string;
  groupName: string;
  groupIcon: string;
  isActive: boolean;
  isOpenPlot?: boolean;
  createdDate?: string;
  updatedDate?: string | null;
  countOfTypes?: number;
  // UI-only computed field
  status?: UseStatus;
}

// Matches API response exactly: /TypeOfUse  
export interface UseType {
  typeOfUseId: number;
  typeOfUseCode: string;
  description: string;
  type: string;
  typeOfUseGroupId: number;
  searchSequence: number;
  typeOfUseCategoryId?: number | null;
  isActive: boolean;
  createdDate?: string;
  updatedDate?: string | null;
  // UI-only computed field
  status?: UseStatus;
  [key: string]: unknown; // Index signature for MasterTable compatibility
}

// Matches API response exactly: /SubTypeOfUse
export interface UseSubType {
  subTypeOfUseId: number;
  description: string;
  typeOfUseId: number;
  searchSequence: number;
  typeOfUseCategoryId?: number | null;
  isActive: boolean;
  createdDate?: string;
  updatedDate?: string | null;
  // UI-only computed field
  status?: UseStatus;
}

// Matches API response exactly: /TypeOfUseCategory
export interface TypeOfUseCategory {
  id: number;
  typeOfUseCategoryCode: string;
  typeOfUseCategoryName: string;
  isActive: boolean;
  createdDate?: string;
  updatedDate?: string | null;
  status?: UseStatus;
  [key: string]: unknown; // Index signature for Table compatibility
}

// UI-only type for Type of Use modal display items
export interface TypeOfUseItem {
  id: string;
  description: string;
}

export interface TypeOfUseMasterData {
  groups: UseGroup[];
  types: UseType[];
  subTypes: UseSubType[];
}

// Form component props interfaces
export interface UseGroupFormProps {
  id: string | null;
  initialData?: UseGroup | null;
  allGroups?: UseGroup[];
}

export interface UseCategoryFormProps {
  id: string | number | null;
  initialData?: TypeOfUseCategory | null;
  allCategories?: TypeOfUseCategory[];
}

export interface UseTypeFormProps {
  id: string | null;
  initialData?: UseType | null;
  allGroups?: UseGroup[];
  allTypes?: UseType[];
  allCategories?: TypeOfUseCategory[];
}

export interface UseSubTypeFormProps {
  id: string | null;
  initialData?: UseSubType | null;
  typeInfo?: UseType | null;
  allSubTypes?: UseSubType[];
  allCategories?: TypeOfUseCategory[];
}

// TypeOfUseMaster page component props with grouped structure
export interface TypesPaginationProps {
  paginatedTypes: UseType[];
  totalCount: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  searchFromServer?: string;
}

export interface SubTypesPaginationProps {
  subTypes: UseSubType[];
  totalCount: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
}

export interface TypeOfUseMasterPageProps {
  initialData: TypeOfUseMasterData;
  typesPagination: TypesPaginationProps;
  subTypesPagination: SubTypesPaginationProps;
  selectedTypeId: string;
}



