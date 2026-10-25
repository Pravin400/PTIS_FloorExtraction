export interface InventoryUnitResponse {
  assetId: number;
  assetNo: string;
  assetName: string;
  unitNumber: number;
  serialNumber?: string | null;
  assetTag?: string | null;
  condition?: string | null;
  unitPurchaseValue?: number | null;
  unitCapitalValue?: number | null;
  depreciationRate?: number | null;
  conditionFactor?: number | null;
  ageInYears?: number | null;
  cvFormula?: string | null;
  dynamicAttributes?: Record<string, string | number | boolean | null> | null;
}

export interface InventoryBatchDetail {
  batchId: number;
  parentAssetId: number;
  inventoryType: string;
  itemName: string;
  modelBrand?: string | null;
  specifications?: string | null;
  purchaseDate?: string | null;
  condition?: string | null;
  quantity: number;
  unitValue: number;
  totalBatchValue: number;
  totalBatchCV: number;
  invoiceNumber?: string | null;
  invoiceDate?: string | null;
  invoiceFileName?: string | null;
  owningDepartment?: string | null;
  photoFileName?: string | null;
  names?: {
    inventoryType?: string | null;
    label?: string | null;
    itemName?: string | null;
    modelBrand?: string | null;
    condition?: string | null;
    owningDepartment?: string | null;
  } | null;
  isRegistered?: boolean;
  registeredDate?: string | null;
  createdDate?: string | null;
  units: InventoryUnitResponse[];
  documents?: unknown[];
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

