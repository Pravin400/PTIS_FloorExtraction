export interface ChargeHead extends Record<string, unknown> {
  id: number;
  chargeHeadCode: string;
  chargeHeadName: string;
  chargeHeadNameLocal?: string;
  chargeType: string;
  isRefundable: boolean;
  sequenceNo: number;
  description?: string;
  isRegularPay: boolean;
  isActive: boolean;
}

export interface CreateChargeHeadDto {
  chargeHeadCode: string;
  chargeHeadName: string;
  chargeHeadNameLocal?: string;
  chargeType: string;
  isRefundable: boolean;
  sequenceNo: number;
  description?: string;
  isRegularPay: boolean;
  isActive: boolean;
}

export interface UpdateChargeHeadDto extends CreateChargeHeadDto {
  id: number;
}

export interface ChargeHeadsQueryParameters {
  id?: number;
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filterLogic?: string;
}

export interface ChargeHeadsPagedResponse {
  items: ChargeHead[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ChargeHeadFormState {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  data?: ChargeHead;
}

export interface UseChargeHeadsProps {
  pagedData?: ChargeHeadsPagedResponse;
  initialData?: ChargeHead[];
  locale: string;
  drawer?: "add" | "edit" | null;
  initialEditingData?: ChargeHead | null;
  initialSortBy?: string;
  initialSortOrder?: "asc" | "desc";
  initialSearchTerm?: string;
  createAction?: (prevState: ChargeHeadFormState, input: CreateChargeHeadDto) => Promise<ChargeHeadFormState>;
  updateAction?: (id: number, prevState: ChargeHeadFormState, input: CreateChargeHeadDto) => Promise<ChargeHeadFormState>;
  deleteAction?: (id: number) => Promise<{ success: boolean; message?: string; statusCode?: number }>;
}

export type ChargeHeadsProps = UseChargeHeadsProps;

export interface ChargeHeadsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export interface AddChargeHeadPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export interface EditChargeHeadPageProps {
  params: Promise<{ id: string; locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}
