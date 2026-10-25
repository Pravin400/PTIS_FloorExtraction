/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Strict date parsing that converts valid ISO or DD/MM/YYYY dates into an ISO string.
 * Returns undefined for missing, empty, or impossible dates. Never fabricates current timestamp.
 */
export function parseSafeIsoDate(val?: string | null): string | undefined {
  if (!val || typeof val !== 'string') return undefined;
  const trimmed = val.trim();
  if (!trimmed) return undefined;

  // Strict YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
    return undefined;
  }

  // Strict DD/MM/YYYY format
  const parts = trimmed.split('/');
  if (parts.length === 3 && parts[2].length === 4) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const d = new Date(Date.UTC(year, month, day));
    if (d.getUTCFullYear() === year && d.getUTCMonth() === month && d.getUTCDate() === day) {
      return d.toISOString();
    }
    return undefined;
  }

  const d = new Date(trimmed);
  return !isNaN(d.getTime()) ? d.toISOString() : undefined;
}

import type {
  ResolvedInventoryIds,
  InventoryQuantityValidationResult,
  InventoryUnitValueValidationResult,
  InventoryResolveIdsInput,
  InventoryBatchPayloadSource,
  BuildInventoryDocumentFilesResult,
} from '@/types/asset/municipal-Asset/new-add-new-asset';

export type {
  ResolvedInventoryIds,
  InventoryQuantityValidationResult,
  InventoryUnitValueValidationResult,
  InventoryResolveIdsInput,
  InventoryBatchPayloadSource,
  BuildInventoryDocumentFilesResult,
};

/** Validates that an inventory quantity is a finite positive integer within bounds. */
export function validateInventoryQuantity(quantity: unknown): InventoryQuantityValidationResult {
  if (quantity === null || quantity === undefined || quantity === '') {
    return { isValid: false, error: 'Quantity is required.' };
  }
  const num = Number(quantity);
  if (!Number.isFinite(num) || !Number.isInteger(num)) {
    return { isValid: false, error: 'Quantity must be a valid whole integer.' };
  }
  if (num <= 0) {
    return { isValid: false, error: 'Quantity must be greater than zero.' };
  }
  if (num > 10000) {
    return { isValid: false, error: 'Quantity cannot exceed 10,000 units per batch.' };
  }
  return { isValid: true, value: num };
}

/** Validates that an inventory unit value is a finite non-negative number. */
export function validateInventoryUnitValue(unitValue: unknown): InventoryUnitValueValidationResult {
  if (unitValue === null || unitValue === undefined || unitValue === '') {
    return { isValid: false, error: 'Unit value is required.' };
  }
  const num = Number(unitValue);
  if (!Number.isFinite(num) || isNaN(num)) {
    return { isValid: false, error: 'Unit value must be a valid number.' };
  }
  if (num < 0) {
    return { isValid: false, error: 'Unit value cannot be negative.' };
  }
  return { isValid: true, value: num };
}

/** Resolves numeric master-data IDs (category/item/model/condition/department)
 * with strict matching and hierarchical validation.
 * Verifies that Item belongs to Category and Model belongs to Item even when direct IDs are passed.
 * Never silently defaults to the first available condition or department. */
export function resolveInventoryIds(
  f: InventoryResolveIdsInput,
  categories: any[] = [],
  itemNames: any[] = [],
  itemModels: any[] = [],
  conditions: any[] = [],
  departments: any[] = []
): ResolvedInventoryIds {
  let hierarchyError: string | undefined;

  // 1. Resolve Category ID (priority to direct numeric ID)
  const targetCategory = String(f.category || '').toLowerCase().trim();
  const c =
    typeof f.itemCategoryId === 'number' && f.itemCategoryId > 0
      ? f.itemCategoryId
      : categories.find(cat =>
          String(cat.typeName || cat.typeCode || cat.name || '').toLowerCase().trim() === targetCategory ||
          String(cat.id) === targetCategory
        )?.id || 0;

  // 2. Resolve Item Name ID - validate relationship to Category if known (even for direct itemId)
  const targetItemName = String(f.itemName || '').toLowerCase().trim();
  let n = 0;
  if (typeof f.itemId === 'number' && f.itemId > 0) {
    const matchedItem = itemNames.find(item => Number(item.id) === f.itemId);
    if (matchedItem && c > 0 && (matchedItem.categoryId || matchedItem.itemCategoryId)) {
      const itemCatId = Number(matchedItem.categoryId || matchedItem.itemCategoryId);
      if (itemCatId !== c) {
        hierarchyError = `Selected Item (ID: ${f.itemId}) does not belong to the selected Category (ID: ${c}).`;
      } else {
        n = f.itemId;
      }
    } else {
      n = f.itemId;
    }
  } else {
    n = itemNames.find(item => {
      const nameMatch =
        String(item.subTypeName || item.itemName || item.subTypeCode || item.name || '').toLowerCase().trim() === targetItemName ||
        String(item.id) === targetItemName;
      if (!nameMatch) return false;
      if (c > 0 && (item.categoryId || item.itemCategoryId) && Number(item.categoryId || item.itemCategoryId) !== c) return false;
      return true;
    })?.id || 0;
  }

  // 3. Resolve Model ID - validate relationship to Item if known (even for direct inventoryItemModelId)
  const targetModelName = String(f.modelName || '').toLowerCase().trim();
  let m = 0;
  if (typeof f.inventoryItemModelId === 'number' && f.inventoryItemModelId > 0) {
    const matchedModel = itemModels.find(model => Number(model.id) === f.inventoryItemModelId);
    if (matchedModel && n > 0 && (matchedModel.itemId || matchedModel.subTypeId)) {
      const modelItemId = Number(matchedModel.itemId || matchedModel.subTypeId);
      if (modelItemId !== n) {
        hierarchyError = hierarchyError || `Selected Model (ID: ${f.inventoryItemModelId}) does not belong to the selected Item (ID: ${n}).`;
      } else {
        m = f.inventoryItemModelId;
      }
    } else {
      m = f.inventoryItemModelId;
    }
  } else if (targetModelName) {
    m = itemModels.find(model => {
      const modelMatch =
        String(model.modelName || model.name || '').toLowerCase().trim() === targetModelName ||
        String(model.id) === targetModelName;
      if (!modelMatch) return false;
      if (n > 0 && (model.itemId || model.subTypeId) && Number(model.itemId || model.subTypeId) !== n) return false;
      return true;
    })?.id || 0;
  }

  // 4. Resolve Condition - strict lookup without silent fallback
  const targetCondition = String(f.condition || '').toLowerCase().trim();
  const cond =
    typeof f.inventoryItemConditionId === 'number' && f.inventoryItemConditionId > 0
      ? conditions.find(cItem => Number(cItem.id) === f.inventoryItemConditionId)
      : conditions.find(condition =>
          String(condition.conditionName || condition.name || condition.typeName || '').toLowerCase().trim() === targetCondition ||
          String(condition.id) === targetCondition
        );

  // 5. Resolve Owning Department - strict lookup without silent fallback
  const targetDepartment = String(f.owningDepartment || '').toLowerCase().trim();
  const d =
    typeof f.owningDepartmentId === 'number' && f.owningDepartmentId > 0
      ? f.owningDepartmentId
      : departments.find(dept =>
          String(dept.value || '').toLowerCase().trim() === targetDepartment ||
          String(dept.label || '').toLowerCase().trim() === targetDepartment ||
          String(dept.name || '').toLowerCase().trim() === targetDepartment ||
          String(dept.departmentName || '').toLowerCase().trim() === targetDepartment ||
          String(dept.id || '') === targetDepartment
        )?.id || 0;

  return {
    c,
    n,
    m,
    cond,
    d: Number(d) || 0,
    isValid: !hierarchyError,
    error: hierarchyError
  };
}

/** Builds the {file, meta} pair list for a batch's photo + invoice files —
 * shared across add/update/save-all. */
export function buildInventoryDocumentFiles(
  photoFile: File | null | undefined,
  invoiceFile: File | null | undefined
): BuildInventoryDocumentFilesResult {
  const documentFiles: File[] = [];
  const documentMetadata: any[] = [];
  let displayOrder = 1;

  if (photoFile) {
    documentFiles.push(new File([photoFile], `photo_${photoFile.name}`, { type: photoFile.type }));
    documentMetadata.push({ documentTypeId: 1, displayOrder: displayOrder++, remarks: "Inventory Photo", isEnabled: true });
  }
  if (invoiceFile) {
    documentFiles.push(new File([invoiceFile], `invoice_${invoiceFile.name}`, { type: invoiceFile.type }));
    documentMetadata.push({ documentTypeId: 2, displayOrder: displayOrder++, remarks: "Inventory Invoice", isEnabled: true });
  }

  return { documentFiles, documentMetadata };
}

/** Builds the createBatch API payload shape with validated Quantity, Unit Value, and Condition Factor.
 * Rejects invalid quantity and unit values instead of silently falling back. */
export function buildInventoryBatchApiPayload(
  parentAssetId: number,
  ids: ResolvedInventoryIds | { c: number; n: number; m: number; cond?: unknown; d: number; error?: string; isValid?: boolean },
  source: InventoryBatchPayloadSource
): any {
  if (ids && ids.error) {
    throw new Error(`Inventory hierarchy validation failed: ${ids.error}`);
  }

  const qtyValidation = validateInventoryQuantity(source.quantity);
  if (!qtyValidation.isValid || qtyValidation.value === undefined) {
    throw new Error(qtyValidation.error || 'Invalid inventory quantity.');
  }
  const quantity = qtyValidation.value;

  const unitValValidation = validateInventoryUnitValue(source.unitValue);
  if (!unitValValidation.isValid || unitValValidation.value === undefined) {
    throw new Error(unitValValidation.error || 'Invalid unit value.');
  }
  const unitValue = unitValValidation.value;

  const cond = ids.cond as { id?: number | string; conditionFactor?: number } | undefined | null;
  const conditionId = cond?.id ? Number(cond.id) : 0;
  const conditionFactor = cond?.conditionFactor !== undefined && cond?.conditionFactor !== null
    ? Number(cond.conditionFactor)
    : 1;

  const units = Array.from({ length: quantity }, (_, i) => ({
    unitNumber: i + 1,
    serialNumber: "",
    assetTag: "",
    inventoryItemConditionId: conditionId,
    dynamicAttributes: source.unitDynamicAttributes?.[i] || {},
    conditionFactor,
  }));

  const payload: any = {
    parentAssetId,
    inventoryItemCategoryId: ids.c > 0 ? ids.c : undefined,
    inventoryItemNameId: ids.n > 0 ? ids.n : undefined,
    specifications: source.specifications?.trim() || "",
    purchaseDate: parseSafeIsoDate(source.purchaseDate),
    inventoryItemConditionId: conditionId,
    quantity,
    unitValue,
    invoiceNumber: source.invoiceNumber || "",
    invoiceDate: parseSafeIsoDate(source.invoiceDate),
    invoiceFileName: source.invoiceFileName || "",
    owningDepartmentId: ids.d > 0 ? ids.d : undefined,
    photoFileName: source.photoName || "",
    units
  };

  if (ids.m && ids.m > 0) {
    payload.inventoryItemModelId = ids.m;
  }

  return payload;
}

/** Turns an inventory batch api payload + staged document files into the
 * multipart FormData saveSingleInventoryBatchAction expects. */
export function buildInventoryBatchFormData(
  apiPayload: any,
  documentFiles: File[],
  documentMetadata: any[]
): FormData {
  const formDataPayload = new FormData();
  Object.keys(apiPayload).forEach(key => {
    if (key !== 'units' && key !== 'documentFiles' && key !== 'documentMetadata') {
      const val = apiPayload[key];
      if (val !== null && val !== undefined && val !== '') {
        if (key === 'inventoryItemModelId' && (Number(val) === 0 || !val)) {
          return;
        }
        formDataPayload.append(key, String(val));
      }
    }
  });

  if (apiPayload.units && Array.isArray(apiPayload.units)) {
    formDataPayload.append('unitsJson', JSON.stringify(apiPayload.units));
  }

  if (documentFiles.length > 0) {
    formDataPayload.append('documentMetadataJson', JSON.stringify(documentMetadata));
    formDataPayload.append('DocumentMetadataJson', JSON.stringify(documentMetadata));
    documentFiles.forEach(f => {
      formDataPayload.append('DocumentFiles', f);
    });
  }

  return formDataPayload;
}
