export interface BillingFrequencyMaster extends Record<string, unknown> {
  id: number;
  billingFrequencyCode: string;
  billingFrequency: string;
  periodsPerYear: number;
  description?: string | null;
  sequenceNo?: number | null;
  isActive: boolean;
  createdBy?: number | null;
  createdDate?: string | null;
  updatedBy?: number | null;
  updatedDate?: string | null;
}

export interface CreateBillingFrequencyMasterDto {
  billingFrequencyCode: string;
  billingFrequency: string;
  periodsPerYear: number;
  description?: string;
  sequenceNo?: number;
  isActive: boolean;
  createdBy?: number;
}

export interface UpdateBillingFrequencyMasterDto {
  id: number;
  billingFrequencyCode: string;
  billingFrequency: string;
  periodsPerYear: number;
  description?: string;
  sequenceNo?: number;
  isActive: boolean;
  updatedBy?: number;
}

export interface BillingFrequencyMasterQueryParameters {
  id?: number;
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filterLogic?: string;
}

export interface BillingFrequencyMasterPagedResponse {
  items: BillingFrequencyMaster[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface BillingFrequencyMasterStats {
  records: number;
  active: number;
  relationships: number;
  designPattern: string;
}

export interface BillingFrequencyFormState {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  data?: BillingFrequencyMaster;
}

export interface BillingFrequencyValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
}

export interface BillingFrequencyInput {
  id?: number;
  billingFrequencyCode?: string;
  billingFrequency: string;
  periodsPerYear: number | string;
  description?: string;
  sequenceNo?: number | string;
  isActive?: boolean | string;
  createdBy?: number | string;
  updatedBy?: number | string;
}

export type BillingFrequencyTranslator = (key: string, values?: Record<string, string | number | Date>) => string;

export interface BillingFrequencyFormProps {
  readonly open: boolean;
  readonly initialData?: BillingFrequencyMaster | null;
  readonly isSubmitting?: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (data: CreateBillingFrequencyMasterDto) => Promise<BillingFrequencyFormState | void> | void;
}

export interface UseBillingFrequencyMasterProps {
  pagedData?: BillingFrequencyMasterPagedResponse;
  initialData?: BillingFrequencyMaster[];
  locale: string;
  drawer?: "add" | "edit" | null;
  initialEditingData?: BillingFrequencyMaster | null;
  initialSortBy?: string;
  initialSortOrder?: "asc" | "desc";
  initialSearchTerm?: string;
  createAction?: (prevState: BillingFrequencyFormState, input: BillingFrequencyInput) => Promise<BillingFrequencyFormState>;
  updateAction?: (id: number, prevState: BillingFrequencyFormState, input: BillingFrequencyInput) => Promise<BillingFrequencyFormState>;
  deleteAction?: (id: number) => Promise<{ success: boolean; message?: string; statusCode?: number }>;
}

export type BillingFrequencyMasterProps = UseBillingFrequencyMasterProps;

export interface BillingFrequencyMasterPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export interface AddBillingFrequencyPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export interface EditBillingFrequencyPageProps {
  params: Promise<{ id: string; locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}
