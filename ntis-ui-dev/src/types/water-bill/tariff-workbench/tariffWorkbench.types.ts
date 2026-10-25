export interface TariffWorkbench extends Record<string, unknown> {
  id: number;
  tariffCode: string;
  tariffName: string;
  financialYearId?: number | null;
  yearId?: number | null;
  year?: string;
  yearCode?: string;
  connectionTypeId?: number | null;
  connectionTypeName?: string;
  connectionCategoryId?: number | null;
  connectionCategoryName?: string;
  tapSizeId?: number | null;
  tapSizeName?: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  versionNo?: number;
  status?: string;
  description: string | null;
  isActive: boolean;
  createdBy?: number | null;
  createdDate?: string | null;
  updatedBy?: number | null;
  updatedDate?: string | null;
}

export interface TariffChargeData extends Record<string, unknown> {
  id: number;
  tariffId: number;
  tariffName: string;
  chargeHeadId: number;
  chargeHeadName: string;
  geographyUnitId: number | null;
  geographyUnitName: string;
  amount: number;
  isDynamic: boolean;
  isMandatory: boolean;
  sequenceNo: number;
  isActive: boolean;
  actions?: unknown;
}

export interface TariffSlabData extends Record<string, unknown> {
  id: number;
  tariffId: number;
  tariffName: string;
  geographyUnitId: number | null;
  geographyUnitName: string;
  fromUnit: number;
  toUnit: number;
  unitRate: number;
  fixedCharge: number;
  minimumCharge: number;
  maximumCharge: number | null;
  perConnectionAmount: number | null;
  formulaCode: string;
  sortOrder?: number;
  isActive: boolean;
  actions?: unknown;
}

export interface CreateTariffWorkbenchDto {
  tariffCode: string;
  tariffName: string;
  financialYearId: number;
  connectionTypeId?: number | null;
  connectionCategoryId?: number | null;
  tapSizeId?: number | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
  versionNo?: number;
  status?: string;
  description?: string | null;
  isActive: boolean;
  createdBy?: number;
}

export interface UpdateTariffWorkbenchDto {
  id: number;
  tariffCode: string;
  tariffName: string;
  financialYearId: number;
  connectionTypeId?: number | null;
  connectionCategoryId?: number | null;
  tapSizeId?: number | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
  versionNo?: number;
  status?: string;
  description?: string | null;
  isActive: boolean;
  updatedBy?: number;
}

export interface TariffWorkbenchQueryParameters {
  id?: number;
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filterLogic?: string;
  tariffCode?: string;
}

export interface TariffWorkbenchPagedResponse {
  items: TariffWorkbench[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface TariffWorkbenchFormState {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  data?: TariffWorkbench;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
}

export interface TariffWorkbenchInput {
  id?: number;
  tariffCode: string;
  tariffName: string;
  financialYearId?: number | string;
  connectionTypeId?: number | string | null;
  connectionCategoryId?: number | string | null;
  tapSizeId?: number | string | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
  versionNo?: number | string;
  status?: string;
  description?: string | null;
  isActive?: boolean | string;
}

export type TariffWorkbenchTranslator = (key: string, values?: Record<string, string | number | Date>) => string;

export interface TariffFormProps {
  readonly open: boolean;
  readonly initialData?: TariffWorkbench | null;
  readonly isSubmitting?: boolean;
  readonly financialYearOptions?: { value: string; label: string }[];
  readonly connectionTypeOptions?: { value: string; label: string }[];
  readonly connectionCategoryOptions?: { value: string; label: string }[];
  readonly tapSizeOptions?: { value: string; label: string }[];
  readonly onClose: () => void;
  readonly onSubmit: (data: CreateTariffWorkbenchDto) => void;
}

export interface TariffWorkbenchProps {
  pagedData?: TariffWorkbenchPagedResponse;
  initialData?: TariffWorkbench[];
  locale: string;
  drawer?: "add" | "edit" | null;
  initialEditingData?: TariffWorkbench | null;
  initialSortBy?: string;
  initialSortOrder?: "asc" | "desc";
  initialSearchTerm?: string;
  financialYearOptions?: { value: string; label: string }[];
  connectionTypeOptions?: { value: string; label: string }[];
  connectionCategoryOptions?: { value: string; label: string }[];
  tapSizeOptions?: { value: string; label: string }[];
  createAction?: (prevState: TariffWorkbenchFormState, input: TariffWorkbenchInput) => Promise<TariffWorkbenchFormState>;
  updateAction?: (id: number, prevState: TariffWorkbenchFormState, input: TariffWorkbenchInput) => Promise<TariffWorkbenchFormState>;
  deleteAction?: (id: number) => Promise<{ success: boolean; message?: string; statusCode?: number }>;
}

export interface TariffWorkbenchPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export interface AddTariffPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export interface EditTariffPageProps {
  params: Promise<{ id: string; locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}
