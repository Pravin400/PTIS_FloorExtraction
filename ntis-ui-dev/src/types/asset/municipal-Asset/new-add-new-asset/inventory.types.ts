export interface InventoryItemCategory {
  id: number;
  typeCode: string;
  typeName: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  depreciationRate: number;
  createdDate?: string;
  updatedDate?: string | null;
  assetCategoryId?: number | null;
  AssetCategoryId?: number | null;
}

export interface InventoryItemCondition {
  id: number;
  inventoryItemCategoryId: number;
  conditionName: string;
  description?: string;
  conditionFactor: number;
  displayOrder: number;
  isActive: boolean;
  createdDate?: string;
  updatedDate?: string | null;
}

export interface InventoryItemName {
  id: number;
  inventoryItemCategoryId: number;
  subTypeCode: string;
  subTypeName: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  createdDate?: string;
  updatedDate?: string | null;
}

export interface InventoryItemModel {
  id: number;
  inventoryItemNameId: number;
  modelName: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  createdDate?: string;
  updatedDate?: string | null;
}
