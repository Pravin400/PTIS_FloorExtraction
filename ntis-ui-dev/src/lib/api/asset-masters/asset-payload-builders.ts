import type { MasterDataRecord } from '@/types/asset-masters/master-data.types';

// Inventory Category
export function buildCategoryPayload(record: MasterDataRecord, userId: number = 0) {
  const rec = record as unknown as Record<string, unknown>;
  const assetCategoryId = Number(record.group) || Number(rec.assetCategoryId) || 0;
  return {
    isActive: record.status === 'Active',
    assetCategoryId,
    typeCode: record.id,
    typeName: record.name,
    description: record.description?.trim() || '',
    displayOrder: record.displayOrder ?? 1,
    depreciationRate: record.depreciationRate ?? 0.1,
    createdBy: userId,
    updatedBy: userId,
  };
}

export const buildCategoryCreatePayload = buildCategoryPayload;
export const buildCategoryUpdatePayload = buildCategoryPayload;

// Inventory Condition
export function buildConditionPayload(record: MasterDataRecord, userId: number = 0) {
  const rec = record as unknown as Record<string, unknown>;
  const inventoryItemCategoryId = Number(record.group) || Number(rec.inventoryItemCategoryId) || 0;
  return {
    isActive: record.status === 'Active',
    inventoryItemCategoryId,
    conditionName: record.name,
    conditionFactor: record.conditionFactor ?? 1.0,
    description: record.description?.trim() || '',
    displayOrder: record.displayOrder ?? 1,
    createdBy: userId,
    updatedBy: userId,
  };
}

export const buildConditionCreatePayload = buildConditionPayload;
export const buildConditionUpdatePayload = buildConditionPayload;

// Inventory Item Name
export function buildItemNamePayload(record: MasterDataRecord, userId: number = 0) {
  const rec = record as unknown as Record<string, unknown>;
  const inventoryItemCategoryId = Number(record.group) || Number(rec.inventoryItemCategoryId) || 0;
  return {
    isActive: record.status === 'Active',
    inventoryItemCategoryId,
    subTypeCode: record.id,
    subTypeName: record.name,
    description: record.description?.trim() || '',
    displayOrder: record.displayOrder ?? 1,
    createdBy: userId,
    updatedBy: userId,
  };
}

export const buildItemNameCreatePayload = buildItemNamePayload;
export const buildItemNameUpdatePayload = buildItemNamePayload;

// Inventory Model
export function buildModelPayload(record: MasterDataRecord, userId: number = 0) {
  const rec = record as unknown as Record<string, unknown>;
  const inventoryItemNameId = Number(record.group) || Number(rec.inventoryItemNameId) || 0;
  return {
    isActive: record.status === 'Active',
    inventoryItemNameId,
    modelName: record.name,
    description: record.description?.trim() || '',
    displayOrder: record.displayOrder ?? 1,
    createdBy: userId,
    updatedBy: userId,
  };
}

export const buildModelCreatePayload = buildModelPayload;
export const buildModelUpdatePayload = buildModelPayload;
// Asset Type
export const buildAssetTypeCreatePayload = (record: MasterDataRecord, userId: number = 0) => ({
  typeCode: (record.id || '').trim(),
  typeName: record.name.trim(),
  assetCategoryId: Number(record.group) || 0,
  description: (record.description || '').trim(),
  isActive: record.status === 'Active',
  allowUnitRegistration: record.allowUnitRegistration ?? false,
  allowRoomRegistration: record.allowRoomRegistration ?? false,
  createdBy: userId,
  codeFormat: "1"
});

export const buildAssetTypeUpdatePayload = (record: MasterDataRecord, id: number, userId: number = 0) => ({
  id: id,
  typeCode: (record.id || '').trim(),
  typeName: record.name.trim(),
  assetCategoryId: Number(record.group) || 0,
  description: (record.description || '').trim(),
  isActive: record.status === 'Active',
  allowUnitRegistration: record.allowUnitRegistration ?? false,
  allowRoomRegistration: record.allowRoomRegistration ?? false,
  updatedBy: userId,
  codeFormat: "1"
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const buildAssetTypeCreatePayloadFromModel = (data: any, userId: number = 0) => ({
  typeCode: data.typeCode.trim(),
  typeName: data.typeName.trim(),
  assetCategoryId: data.categoryId,
  description: (data.description ?? '').trim(),
  isActive: data.isActive,
  allowUnitRegistration: data.allowUnitRegistration ?? false,
  allowRoomRegistration: data.allowRoomRegistration ?? false,
  createdBy: userId,
  codeFormat: "1"
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const buildAssetTypeUpdatePayloadFromModel = (data: any, userId: number = 0) => ({
  id: data.id ?? 0,
  typeCode: data.typeCode.trim(),
  typeName: data.typeName.trim(),
  assetCategoryId: data.categoryId,
  description: (data.description ?? '').trim(),
  isActive: data.isActive,
  allowUnitRegistration: data.allowUnitRegistration ?? false,
  allowRoomRegistration: data.allowRoomRegistration ?? false,
  updatedBy: userId,
  codeFormat: "1"
});

// Asset Category
export const buildAssetCategoryCreatePayload = (record: MasterDataRecord, userId: number = 0) => ({
  categoryCode: (record.id || '').trim(),
  categoryName: record.name.trim(),
  description: (record.description || '').trim(),
  isActive: record.status === 'Active',
  isMovable: record.isMovable ?? false,
  hasFloorDetails: record.hasFloorDetails ?? false,
  hasInventory: record.hasInventory ?? false,
  isInventoryMandatory: record.isInventoryMandatory ?? false,
  hasLegalCompliance: record.hasLegalCompliance ?? false,
  valuationType: (record.valuationType || '').trim(),
  createdBy: userId,
  codeFormat: "1"
});

export const buildAssetCategoryUpdatePayload = (record: MasterDataRecord, id: number, userId: number = 0) => ({
  id: id,
  categoryCode: (record.id || '').trim(),
  categoryName: record.name.trim(),
  description: (record.description || '').trim(),
  isActive: record.status === 'Active',
  isMovable: record.isMovable ?? false,
  hasFloorDetails: record.hasFloorDetails ?? false,
  hasInventory: record.hasInventory ?? false,
  isInventoryMandatory: record.isInventoryMandatory ?? false,
  hasLegalCompliance: record.hasLegalCompliance ?? false,
  valuationType: (record.valuationType || '').trim(),
  updatedBy: userId,
  codeFormat: "1"
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const buildAssetCategoryCreatePayloadFromModel = (data: any, userId: number = 0) => ({
  categoryCode: data.categoryCode.trim(),
  categoryName: data.categoryName.trim(),
  description: (data.description ?? '').trim(),
  isActive: data.isActive,
  isMovable: data.isMovable,
  hasFloorDetails: data.hasFloorDetails,
  hasInventory: data.hasInventory,
  isInventoryMandatory: data.isInventoryMandatory,
  hasLegalCompliance: data.hasLegalCompliance,
  valuationType: (data.valuationType || '').trim(),
  createdBy: userId,
  codeFormat: "1"
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const buildAssetCategoryUpdatePayloadFromModel = (data: any, userId: number = 0) => ({
  id: data.id ?? 0,
  categoryCode: data.categoryCode.trim(),
  categoryName: data.categoryName.trim(),
  description: (data.description ?? '').trim(),
  isActive: data.isActive,
  isMovable: data.isMovable,
  hasFloorDetails: data.hasFloorDetails,
  hasInventory: data.hasInventory,
  isInventoryMandatory: data.isInventoryMandatory,
  hasLegalCompliance: data.hasLegalCompliance,
  valuationType: (data.valuationType || '').trim(),
  updatedBy: userId,
  codeFormat: "1"
});


export const buildOwnershipTypeCreatePayload = (record: MasterDataRecord, userId: number = 0) => ({
  ownershipTypeName: record.name,
  description: record.description,
  isActive: record.status === 'Active',
  createdBy: userId,
});

export const buildOwnershipTypeUpdatePayload = (record: MasterDataRecord, id: number, userId: number = 0) => ({
  id,
  ownershipTypeName: record.name,
  description: record.description,
  isActive: record.status === 'Active',
  updatedBy: userId,
});

// Owning Department

export const buildOwningDepartmentCreatePayload = (record: MasterDataRecord, userId: number = 0) => ({
  owningDepartmentName: record.name,
  departmentId: record.departmentId,
  departmentName: record.departmentName,
  description: record.description,
  isActive: record.status === 'Active',
  createdBy: userId,
});

export const buildOwningDepartmentUpdatePayload = (record: MasterDataRecord, id: number, userId: number = 0) => ({
  id,
  owningDepartmentName: record.name,
  departmentId: record.departmentId,
  departmentName: record.departmentName,
  description: record.description,
  isActive: record.status === 'Active',
  updatedBy: userId,
});

// GST Master
export const buildGstCreatePayload = (record: MasterDataRecord, userId: number = 0) => ({
  taxCode: (record.id || '').trim(),
  taxName: record.name.trim(),
  taxPercentage: record.taxPercentage ?? 0,
  effectiveFromDate: record.effectiveFromDate || new Date().toISOString().split('T')[0],
  effectiveToDate: record.effectiveToDate || null,
  isActive: record.status === 'Active',
  createdBy: userId,
});

export const buildGstUpdatePayload = (record: MasterDataRecord, id: number, userId: number = 0) => ({
  id: id,
  taxCode: (record.id || '').trim(),
  taxName: record.name.trim(),
  taxPercentage: record.taxPercentage ?? 0,
  effectiveFromDate: record.effectiveFromDate || new Date().toISOString().split('T')[0],
  effectiveToDate: record.effectiveToDate || null,
  isActive: record.status === 'Active',
  updatedBy: userId,
});

// Penalty Rule Master
export const buildPenaltyCreatePayload = (record: MasterDataRecord, userId: number = 0) => ({
  penaltyCode: (record.id || '').trim(),
  penaltyName: record.name.trim(),
  calculationType: record.calculationType || 'FlatAmount',
  penaltyValue: record.penaltyValue ?? 0,
  gracePeriodDays: record.gracePeriodDays ?? 0,
  isActive: record.status === 'Active',
  createdBy: userId,
});

export const buildPenaltyUpdatePayload = (record: MasterDataRecord, id: number, userId: number = 0) => ({
  id: id,
  penaltyCode: (record.id || '').trim(),
  penaltyName: record.name.trim(),
  calculationType: record.calculationType || 'FlatAmount',
  penaltyValue: record.penaltyValue ?? 0,
  gracePeriodDays: record.gracePeriodDays ?? 0,
  isActive: record.status === 'Active',
  updatedBy: userId,
});

// Room Type Master
export const buildRoomTypeCreatePayload = (record: MasterDataRecord, userId: number = 0) => ({
  roomTypeCode: (record.id || '').trim(),
  roomTypeName: record.name.trim(),
  description: (record.description || '').trim(),
  assetTypeId: Number(record.group) || 0,
  isActive: record.status === 'Active',
  createdBy: userId,
});

export const buildRoomTypeUpdatePayload = (record: MasterDataRecord, id: number, userId: number = 0) => ({
  id: id,
  roomTypeCode: (record.id || '').trim(),
  roomTypeName: record.name.trim(),
  description: (record.description || '').trim(),
  assetTypeId: Number(record.group) || 0,
  isActive: record.status === 'Active',
  updatedBy: userId,
});

// Type Of Use Master
export const buildTypeOfUseCreatePayload = (record: MasterDataRecord, userId = 0) => ({
  assetTypeId: Number(record.group) || 0,
  typeOfUseGroupId: record.departmentId || 0,
  typeOfUseCode: (record.id || '').trim(),
  description: (record.description || '').trim(),
  isActive: record.status === 'Active',
  createdBy: userId,
});

export const buildTypeOfUseUpdatePayload = (record: MasterDataRecord, id: number, userId = 0) => ({
  id: id,
  assetTypeId: Number(record.group) || 0,
  typeOfUseGroupId: record.departmentId || 0,
  typeOfUseCode: (record.id || '').trim(),
  description: (record.description || '').trim(),
  isActive: record.status === 'Active',
  updatedBy: userId,
});

// Sub Type Of Use Master
export const buildSubTypeOfUseCreatePayload = (record: MasterDataRecord, userId = 0) => ({
  typeOfUseId: record.departmentId || 0,
  description: (record.description || '').trim(),
  searchSequence: record.displayOrder || 0,
  isActive: record.status === 'Active',
  createdBy: userId,
});

export const buildSubTypeOfUseUpdatePayload = (record: MasterDataRecord, id: number, userId = 0) => ({
  id: id,
  typeOfUseId: record.departmentId || 0,
  description: (record.description || '').trim(),
  searchSequence: record.displayOrder || 0,
  isActive: record.status === 'Active',
  updatedBy: userId,
});

// Asset Photo Type Master
export const buildAssetPhotoTypeCreatePayload = (record: MasterDataRecord, userId: number = 0) => ({
  photoTypeCode: (record.id || '').trim(),
  photoTypeName: record.name.trim(),
  description: (record.description || '').trim(),
  isActive: record.status === 'Active',
  createdBy: userId,
});

export const buildAssetPhotoTypeUpdatePayload = (record: MasterDataRecord, id: number, userId: number = 0) => ({
  id,
  photoTypeCode: (record.id || '').trim(),
  photoTypeName: record.name.trim(),
  description: (record.description || '').trim(),
  isActive: record.status === 'Active',
  updatedBy: userId,
});



