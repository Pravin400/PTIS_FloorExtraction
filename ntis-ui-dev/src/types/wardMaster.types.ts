export interface WardItem {
  id: number;
  wardNo: string;
  zoneId: number;
  description: string | null;
  sequenceNo: number | null;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

export interface WardListResponse {
  items: WardItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface WardMutationResponse<T = WardItem | null> {
  success: boolean;
  message: string | null;
  items: T | null;
  errors: string[] | string | null;
}

export interface CreateWardPayload {
  wardNo: string;
  zoneId: number;
  description: string;
  sequenceNo?: number;
  isActive: boolean;
  createdBy?: number;
}

export interface UpdateWardPayload {
  wardNo: string;
  zoneId: number;
  description: string;
  sequenceNo?: number;
  isActive: boolean;
  updatedBy: number;
}

/* wardNo options */
export interface WardNoOption {
  value: WardItem["wardNo"];
  label: WardItem["wardNo"];
}

/* Batch Ward Creation Types */
export interface BatchWardTemplate {
  isActive: boolean;
  createdBy: number;
  wardNo: string;
  zoneId: number;
  description: string;
  sequenceNo?: number;
}

export interface BatchWardCreatePayload {
  fromValue: string;
  toValue: string;
  rangePropertyName: string;
  template: BatchWardTemplate;
}

export interface BatchRangeWardCreatePayload {
  rangeFrom: string;
  rangeTo: string;
  prefix: string;
  suffix: string;
  template: BatchWardTemplate;
  startSequenceNo: number;
}

export interface BatchWardResultItem {
  id: number;
  wardNo: string;
  zoneId: number;
  description: string;
  sequenceNo: number | null;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

export interface BatchWardItems {
  successCount: number;
  failedCount: number;
  results: BatchWardResultItem[];
  errors: string[] | string | null;
  hasFailures: boolean;
  allSucceeded: boolean;
}

export interface BatchWardCreateResponse {
  success: boolean;
  message: string;
  items: BatchWardItems | null;
  errors: string[] | string | null;
}

/* Bulk Ward Update Types - PUT /Ward/Bulk */
export interface BulkWardUpdateItem {
  id: number;
  data: {
    isActive: boolean;
    updatedBy: number;
    wardNo: string;
    zoneId: number;
    description: string;
    sequenceNo: number | null;
  };
}

export interface BulkWardUpdateResultItem {
  id: number;
  wardNo: string;
  zoneId: number;
  description: string;
  sequenceNo: number | null;
  isActive: boolean;
  createdDate: string;
  updatedDate: string;
}

export interface BulkWardUpdateItems {
  successCount: number;
  failedCount: number;
  results: BulkWardUpdateResultItem[];
  errors: string[] | null;
  hasFailures: boolean;
  allSucceeded: boolean;
}

export interface BulkWardUpdateResponse {
  success: boolean;
  message: string;
  items: BulkWardUpdateItems | null;
  errors: string[] | null;
}