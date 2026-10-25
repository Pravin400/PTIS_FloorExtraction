import { PagedResponse } from "../common.types";

export interface BulkUpdateMaster {
  id?: number;
  masterId?: number;
  updateCode: string;
  updateName: string;
  updateNameMarathi: string;
  iconName?: string;
  targetTable?: string;
  referenceTableName?: string;
  isActive: boolean;
  displaySequence: number;
  apiRoute?: string;
  description?: string;
  isApprovalRequired?: boolean;
  fieldConfigs?: BulkUpdateFieldConfig[];
}

export interface BulkUpdateDefinitionPayload {
  updateName: string;
  tableId: number;
  tableFieldIds: number[];
  isApprovalRequired: boolean;
}

export interface BulkUpdateFieldConfig {
  id: number;
  bulkUpdateMasterId: number;
  fieldName: string;
  displayName: string;
  controlType: 'textbox' | 'textarea' | 'dropdown' | 'select' | 'searchselect' | 'checkbox' | 'number' | 'year' | 'date' | 'file' | (string & {});
  dataType: string;
  placeholder?: string | null;
  isRequired: boolean;
  maxLength?: number | null;
  validationRegex?: string | null;
  defaultValue?: string | null;
  sequenceNo: number;
  displayNameMarathi?: string | null;
  isActive: boolean;
  isReadonly?: boolean;
  bindApi?: string | null;
}

export interface PropertyPreviewRow {
  id: number;
  wardNo: string;
  propertyNo: string;
  partitionNo: string;
  [key: string]: string | number | boolean | null;
}

export interface PropertyFilterParams {
  zoneId?: string;
  wardId?: string;
  fromPropertyNo?: string;
  toPropertyNo?: string;
  wingId?: string;
  propertyTypeId?: string;
  updateCode?: string;
  page?: number;
  pageSize?: number;
}

export interface PropertyFilterByCategoryParams {
  UpdateCode: string | string[];
  SearchCategory: number;
  WardId: number;
  PropertyNo?: string;
  PartitionNo?: string;
  PropertyFrom?: string;
  PropertyTo?: string;
  PageNumber?: number;
  PageSize?: number;
  SearchTerm?: string;
}

export interface BulkUpdatePayload {
  updateCode: string;
  propertyIds: number[];
  updateData: Record<string, string | number | boolean>;
  remarks?: string;
}

export interface BulkUpdateResponse {
  success: boolean;
  message: string;
  items: {
    totalRequested: number;
    successCount: number;
    failedCount: number;
    errors: string[];
  };
  errors: string[] | null;
  correlationId: string | null;
}

export interface ExcelImportResponse {
  success: boolean;
  message: string;
  errors?: string[] | null;
  successCount?: number;
  failedCount?: number;
  items?: Record<string, unknown>[];
}

export interface ExcelValidationResponse {
  success: boolean;
  message: string;
  items?: {
    columns: string[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rows: any[];
    totalRows: number;
    flaggedRowCount: number;
  };
  errors?: string[] | null;
  correlationId?: string | null;
}

export type SelectOption = {
  label: string;
  value: string;
};

export interface WardOption {
  id: number;
  wardNo: string;
  wardName?: string;
}

export interface WingOption {
  id: number;
  wingName: string;
  wardId: number;
}

export interface PropertyFilterFormValues {
  zoneId: string;
  wardId: string;
  fromPropertyNo: string;
  toPropertyNo: string;
  wingId: string;
  propertyTypeId: string;
}

export interface ScopeOption {
  id: number;
  name: string;
  displayName: string;
  description: string;
  options: string[];
}

export interface CommonDetailsUpdatePageProps {
  menuItems: BulkUpdateMaster[];
  wardsData: PagedResponse<WardOption> | PagedResponse<{ id: number; wardNo: string }>;
  wingsData?: PagedResponse<{ id: number; wingNo: string; sequenceNo: number; isActive: boolean }>;
  initialFieldRegistries?: PagedResponse<BulkUpdateMaster> | BulkUpdateMaster[];
  initialExcelTemplateFields?: BulkUpdateMaster[];
  initialSchemas?: FieldRegistrySchema[];
  initialScopeOptions?: ScopeOption[];
  initialFieldConfigs?: BulkUpdateFieldConfig[];
  initialSourceTables?: FieldRegistryTable[];
  initialSourceTableFields?: SourceTableField[];
  initialField?: string;
  initialWardId?: string;
  initialWardNo?: string;
  initialFromProperty?: string;
  initialToProperty?: string;
  initialWing?: string;
  initialPage?: number;
  initialPageSize?: number;
  initialSearchTerm?: string;
  initialTab?: string;
  initialScopeId?: string;
  initialZoneId?: string;
  setFieldRegistryStatusAction?: (updateCode: string, isActive: boolean) => Promise<ActionResult<unknown>>;
  editUpdateCode?: string;
  initialEditData?: BulkUpdateMaster | null;
  initialUpdateHistory?: PagedResponse<UpdateHistoryItem> | null;
  initialAllUpdateHistory?: PagedResponse<UpdateHistoryItem> | UpdateHistoryItem[] | null;
  initialUpdateHistoryDetail?: PagedResponse<import("@/types/common-details-update/common-details-update.types").UpdateHistoryDetailItem> | null;
  actions?: Partial<CommonDetailsUpdateActions>;
}

export interface CommonDetailsUpdateActions {
  addBulkUpdateDefinitionAction?: (payload: BulkUpdateDefinitionPayload) => Promise<ActionResult<unknown>>;
  exportUpdateHistoryAction?: (params: UpdateHistoryFilterParams) => Promise<ActionResult<string>>;
  getUpdateHistoryDetailAction?: (activityId: string, pageNumber?: number, pageSize?: number, searchTerm?: string) => Promise<ActionResult<import("@/types/common.types").PagedResponse<UpdateHistoryDetailItem>>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: ((...args: any[]) => Promise<any>) | undefined;
}

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; statusCode?: number };

export interface FieldRegistrySchema {
  schemaName: string;
}

export interface FieldRegistryTable {
  id?: number;
  moduleLabel?: string | null;
  tableName: string;
  referenceTableName?: string;
}

export interface SourceTableField {
  id: number;
  tableFieldName: string;
  displayName?: string;
  displayNameMarathi?: string | null;
  controlType?: string;
  dataType?: string;
  maxLength?: number | null;
}

export interface FieldRegistryColumn {
  columnName: string;
  fieldName?: string;
  displayName?: string;
  displayNameMarathi?: string | null;
  controlType?: string;
  dataType?: string;
  placeholder?: string | null;
  isRequired?: boolean;
  maxLength?: number | null;
  validationRegex?: string | null;
  defaultValue?: string | null;
  bindApi?: string | null;
  isActive?: boolean;
}

export interface CreateFieldRegistryDto {
  updateCode: string;
  updateName: string;
  updateNameMarathi?: string | null;
  referenceTableName?: string | null;
  description?: string | null;
  displaySequence: number;
  apiRoute: string;
  isApprovalRequired: boolean;
  isActive: boolean;
  fieldConfigs: FieldRegistryFieldConfigDto[];
}

export interface UpdateFieldRegistryDto {
  updatedBy?: number;
  updateName: string;
  referenceTableName: string;
  isApprovalRequired: boolean;
  isActive: boolean;
  fieldConfigs: {
    id?: number;
    fieldName: string;
    displayName: string;
    controlType: string;
    dataType: string;
    placeholder?: string | null;
    isRequired: boolean;
    maxLength?: number | null;
    validationRegex?: string | null;
    defaultValue?: string | null;
    bindApi?: string | null;
    apiResponse?: string | null;
  }[];
}

export interface FieldRegistryFieldConfigDto {
  id?: number;
  fieldName: string;
  displayName: string;
  controlType: string;
  dataType: string;
  placeholder?: string | null;
  isRequired: boolean;
  maxLength?: number | null;
  validationRegex?: string | null;
  defaultValue?: string | null;
  bindApi?: string | null;
  apiResponse?: string | null;
  sequenceNo?: number;
}

export interface UpdateHistoryItem {
  id: number;
  activityId: string;
  activityType: string;
  activityStatus: string;
  createdDate: string;
  records: number;
  ipAddress: string;
  remarks: string | null;
  updateName: string;
  doneBy: string;
  startTime: string;
  endTime: string;
  duration: number;
  activityRemark: string | null;
  [key: string]: unknown;
}

export interface UpdateHistoryDetailItem {
  id: number;
  propertyId: number;
  updateName: string;
  wardNo: string;
  propertyNo: string;
  partitionNo: string;
  property: string;
  oldValue: string;
  newValue: string;
  updatedColumns: string;
  isActive: boolean;
  remarks: string | null;
  ipAddress: string;
  doneBy: string;
  createdDate: string;
  activityId: string;
  activityType: string;
  activityStatus: string;
  activityDoneBy: string;
  records: number;
  startTime: string;
  endTime: string;
  duration: number;
  activityRemark: string | null;
  [key: string]: unknown;
}

export interface UpdateHistoryFilterParams {
  Id?: number;
  ActivityId?: string;
  ActivityType?: string;
  ActivityStatus?: string;
  CreatedDateFrom?: string;
  CreatedDateTo?: string;
  DoneBy?: string;
  Remarks?: string;
  PageNumber?: number;
  PageSize?: number;
  SearchTerm?: string;
  SortBy?: string;
  SortOrder?: string;
  FilterLogic?: string;
}

