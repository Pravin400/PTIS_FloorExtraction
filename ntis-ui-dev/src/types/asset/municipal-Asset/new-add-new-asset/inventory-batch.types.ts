export interface InventoryUnitResponse {
  assetId: number;
  assetNo: string;
  assetName: string;
  unitNumber: number;
  serialNumber?: string;
  assetTag?: string;
  condition?: string;
  unitPurchaseValue?: number;
  unitCapitalValue?: number;
  depreciationRate?: number;
  conditionFactor?: number;
  cvFormula?: string;
  dynamicAttributes?: Record<string, string>;
}

export interface InventoryBatchDetail {
  batchId: number;
  parentAssetId: number;
  inventoryType: string;
  itemName: string;
  modelBrand?: string;
  specifications?: string;
  purchaseDate: string;
  condition?: string;
  quantity: number;
  unitValue: number;
  totalBatchValue: number;
  totalBatchCV: number;
  invoiceNumber?: string;
  invoiceDate?: string;
  invoiceFileName?: string;
  owningDepartment?: string;
  photoFileName?: string;
  isRegistered: boolean;
  registeredDate?: string;
  createdDate: string;
  units: InventoryUnitResponse[];
}

export interface InventoryBatchListResponse {
  parentAssetId: number;
  parentAssetName: string;
  totalBatches: number;
  totalUnits: number;
  totalPurchaseValue: number;
  totalCapitalValue: number;
  batches: InventoryBatchDetail[];
}

export interface InventoryConditionDetail {
  id?: number | string;
  conditionName?: string;
  conditionFactor?: number;
  [key: string]: unknown;
}

export interface ResolvedInventoryIds {
  c: number;
  n: number;
  m: number;
  cond?: InventoryConditionDetail | null;
  d: number;
  isValid: boolean;
  error?: string;
}

export interface InventoryQuantityValidationResult {
  isValid: boolean;
  error?: string;
  value?: number;
}

export interface InventoryUnitValueValidationResult {
  isValid: boolean;
  error?: string;
  value?: number;
}

export interface InventoryResolveIdsInput {
  category?: string;
  itemName?: string;
  modelName?: string;
  condition?: string;
  owningDepartment?: string;
  itemCategoryId?: number;
  itemId?: number;
  inventoryItemModelId?: number;
  inventoryItemConditionId?: number;
  owningDepartmentId?: number;
}

export interface InventoryBatchPayloadSource {
  specifications?: string;
  purchaseDate?: string;
  quantity: number | string;
  unitValue: number | string;
  invoiceNumber?: string;
  invoiceDate?: string;
  invoiceFileName?: string;
  photoName?: string;
  unitDynamicAttributes?: Record<number, Record<string, unknown>>;
}

export interface BuildInventoryDocumentFilesResult {
  documentFiles: File[];
  documentMetadata: Array<{
    documentTypeId: number;
    displayOrder: number;
    remarks: string;
    isEnabled: boolean;
  }>;
}
