export interface BillingPeriodMaster extends Record<string, unknown> {
  id: number;
  billingPeriodCode: string;
  financialYearId: number;
  financialYearCode?: string | null;
  financialYear?: string | null;
  billingFrequencyId: number;
  billingFrequencyCode?: string | null;
  billingFrequency?: string | null;
  sequenceNo?: number | null;
  periodFromDate: string;
  periodToDate: string;
  billGenerationDate?: string | null;
  dueDate?: string | null;
  graceDays: number;
  currentPenaltyStartDate?: string | null;
  currentPenaltyEndDate?: string | null;
  pendingPenaltyStartDate?: string | null;
  pendingPenaltyEndDate?: string | null;
  isActive: boolean;
  createdBy?: number | null;
  createdDate?: string | null;
  updatedBy?: number | null;
  updatedDate?: string | null;
}

export interface CreateBillingPeriodDto {
  billingPeriodCode: string;
  financialYearId: number;
  billingFrequencyId: number;
  sequenceNo?: number | null;
  periodFromDate: string;
  periodToDate: string;
  billGenerationDate?: string | null;
  dueDate?: string | null;
  graceDays: number;
  currentPenaltyStartDate?: string | null;
  currentPenaltyEndDate?: string | null;
  pendingPenaltyStartDate?: string | null;
  pendingPenaltyEndDate?: string | null;
  isActive: boolean;
  createdBy?: number;
}

export interface UpdateBillingPeriodDto {
  id: number;
  billingPeriodCode: string;
  financialYearId: number;
  billingFrequencyId: number;
  sequenceNo?: number | null;
  periodFromDate: string;
  periodToDate: string;
  billGenerationDate?: string | null;
  dueDate?: string | null;
  graceDays: number;
  currentPenaltyStartDate?: string | null;
  currentPenaltyEndDate?: string | null;
  pendingPenaltyStartDate?: string | null;
  pendingPenaltyEndDate?: string | null;
  isActive: boolean;
  updatedBy?: number;
}

export interface BillingPeriodQueryParameters {
  id?: number;
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filterLogic?: string;
}

export interface BillingPeriodPagedResponse {
  items: BillingPeriodMaster[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface BillingPeriodFormState {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  data?: BillingPeriodMaster;
}

export interface BillingPeriodValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
}

export interface BillingPeriodInput {
  id?: number;
  billingPeriodCode?: string;
  financialYearId: number | string;
  billingFrequencyId: number | string;
  sequenceNo?: number | string | null;
  periodFromDate: string;
  periodToDate: string;
  billGenerationDate?: string | null;
  dueDate?: string | null;
  graceDays?: number | string;
  currentPenaltyStartDate?: string | null;
  currentPenaltyEndDate?: string | null;
  pendingPenaltyStartDate?: string | null;
  pendingPenaltyEndDate?: string | null;
  isActive?: boolean | string;
  createdBy?: number | string;
  updatedBy?: number | string;
}

export type BillingPeriodTranslator = (key: string, values?: Record<string, string | number | Date>) => string;

export interface DropdownOption {
  value: string;
  label: string;
  data?: {
    startDate?: string | null;
    endDate?: string | null;
    [key: string]: unknown;
  };
}

export interface BillingPeriodFormProps {
  readonly open: boolean;
  readonly initialData?: BillingPeriodMaster | null;
  readonly financialYearOptions?: DropdownOption[];
  readonly billingFrequencyOptions?: DropdownOption[];
  readonly existingPeriods?: BillingPeriodMaster[];
  readonly isSubmitting?: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (data: CreateBillingPeriodDto) => void;
}

export interface UseBillingPeriodMasterProps {
  pagedData?: BillingPeriodPagedResponse;
  initialData?: BillingPeriodMaster[];
  financialYearOptions?: DropdownOption[];
  billingFrequencyOptions?: DropdownOption[];
  locale: string;
  drawer?: "add" | "edit" | null;
  initialEditingData?: BillingPeriodMaster | null;
  initialSortBy?: string;
  initialSortOrder?: "asc" | "desc";
  initialSearchTerm?: string;
  createAction?: (prevState: BillingPeriodFormState, input: BillingPeriodInput) => Promise<BillingPeriodFormState>;
  updateAction?: (id: number, prevState: BillingPeriodFormState, input: BillingPeriodInput) => Promise<BillingPeriodFormState>;
  deleteAction?: (id: number) => Promise<{ success: boolean; message?: string; statusCode?: number }>;
}

export type BillingPeriodMasterProps = UseBillingPeriodMasterProps;

export interface BillingPeriodMasterPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export interface AddBillingPeriodPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export interface EditBillingPeriodPageProps {
  params: Promise<{ id: string; locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}
