import { formatNumericDate } from '@/lib/utils/format';

import { InventoryItem, DetailedInventoryItem } from '@/types/asset/municipal-Asset/asset-detail.types';

/**
 * Maps raw API inventory data to the Inventory Summary models used by the UI.
 */
export const mapInventoryToUI = (inventoryPayload: unknown): { inventoryItems: InventoryItem[]; detailedInventoryItems: DetailedInventoryItem[] } => {
  let payload = inventoryPayload as Record<string, unknown> | null;

  // Unwrap nested data if present
  if (payload && payload.data && (payload.data as Record<string, unknown>).batches) {
    payload = payload.data as Record<string, unknown>;
  } else if (payload && payload.data && Array.isArray((payload.data as Record<string, unknown>).categoryCounts)) {
    payload = payload.data as Record<string, unknown>;
  }

  if (!payload) {
    return {
      inventoryItems: [],
      detailedInventoryItems: [],
    };
  }

  let totalItems = 0;
  let detailedInventoryItems: DetailedInventoryItem[] = [];
  let categoryCounts: Record<string, number> = {};

  // 1) If the backend provided 'batches', map them (Old detailed API format)
  if (Array.isArray(payload.batches)) {
    detailedInventoryItems = payload.batches.map((batchRaw: unknown, index: number) => {
      const batch = batchRaw as Record<string, unknown>;
      const names = batch.names as Record<string, unknown> | undefined;

      const categoryStr =
        typeof names?.inventoryType === 'string'
          ? names.inventoryType
          : typeof batch.inventoryType === 'string'
            ? batch.inventoryType
            : typeof batch.category === 'string'
              ? batch.category
              : '-';

      // Handle counts
      const typeForCount = categoryStr !== '-' ? categoryStr : 'Other';
      const quantityForCount = typeof batch.quantity === 'number' ? batch.quantity : 1;
      categoryCounts[typeForCount] = (categoryCounts[typeForCount] || 0) + quantityForCount;
      totalItems += quantityForCount;

      const purchaseDateRaw =
        typeof batch.purchaseDate === 'number'
          ? new Date(batch.purchaseDate).toISOString()
          : typeof batch.purchaseDate === 'string'
            ? batch.purchaseDate
            : undefined;

      const documents = Array.isArray(batch.documents) ? batch.documents : [];
      const photoDoc = documents.find(
        (d: Record<string, unknown>) =>
          d.documentTypeCode === 'INVENTORY_IMAGE' ||
          d.documentTypeCode === 'INVENTORY_PHOTO' ||
          (typeof d.documentTypeName === 'string' &&
            (d.documentTypeName.toLowerCase().includes('photo') ||
              d.documentTypeName.toLowerCase().includes('image')))
      );
      const invoiceDoc = documents.find(
        (d: Record<string, unknown>) =>
          d.documentTypeCode === 'INVENTORY_INVOICE' ||
          (typeof d.documentTypeName === 'string' &&
            d.documentTypeName.toLowerCase().includes('invoice'))
      );

      const photoGuid =
        typeof batch.photoDocumentGuid === 'string' && batch.photoDocumentGuid
          ? batch.photoDocumentGuid
          : photoDoc?.documentGuid;
      const invoiceGuid =
        typeof batch.invoiceDocumentGuid === 'string' && batch.invoiceDocumentGuid
          ? batch.invoiceDocumentGuid
          : invoiceDoc?.documentGuid;

      return {
        srNo: index + 1,
        category: categoryStr,
        assetName:
          typeof names?.itemName === 'string'
            ? names.itemName
            : typeof batch.itemName === 'string'
              ? batch.itemName
              : '-',
        makeModel:
          typeof names?.modelBrand === 'string'
            ? names.modelBrand
            : typeof batch.modelBrand === 'string'
              ? batch.modelBrand
              : '-',
        specifications: typeof batch.specifications === 'string' ? batch.specifications : '-',
        purchaseDate: formatNumericDate(purchaseDateRaw),
        owningDepartment:
          typeof names?.owningDepartment === 'string'
            ? names.owningDepartment
            : typeof batch.owningDepartment === 'string'
              ? batch.owningDepartment
              : '-',
        condition:
          typeof names?.condition === 'string'
            ? names.condition
            : typeof batch.condition === 'string'
              ? batch.condition
              : '-',
        quantity: typeof batch.quantity === 'number' ? batch.quantity : 0,
        unitValue: typeof batch.unitValue === 'number' ? batch.unitValue : 0,
        total: typeof batch.totalBatchValue === 'number' ? batch.totalBatchValue : 0,
        cv: typeof batch.totalBatchCV === 'number' ? batch.totalBatchCV : 0,
        photoDocumentGuid: typeof photoGuid === 'string' ? photoGuid : undefined,
        invoiceDocumentGuid: typeof invoiceGuid === 'string' ? invoiceGuid : undefined,
        documents: documents,
      } as DetailedInventoryItem;
    });
  } 
  
  // 2) If the backend provided `categoryCounts` array directly (New summary API format)
  if (Array.isArray(payload.categoryCounts) && payload.categoryCounts.length > 0) {
    totalItems = typeof payload.totalItems === 'number' ? payload.totalItems : 0;
    
    // Overwrite any counts accumulated from `batches` to prevent double-counting
    categoryCounts = {};
    
    payload.categoryCounts.forEach((cat: { categoryName?: string; count?: number }) => {
      const catName = cat.categoryName || 'Unknown';
      const catCount = cat.count || 0;
      categoryCounts[catName] = (categoryCounts[catName] || 0) + catCount;
    });
  }

  const inventoryItems: InventoryItem[] = [];
  
  // Always include the "Total Inventory" summary card first
  inventoryItems.push({
    id: '1',
    label: 'Total Inventory',
    count: totalItems,
    icon: 'Package',
    color: 'text-slate-900',
    bgColor: 'bg-slate-100',
  });

  // Generate a card dynamically for every category present in the categoryCounts
  let idCounter = 2;
  for (const [catName, count] of Object.entries(categoryCounts)) {
    inventoryItems.push({
      id: String(idCounter++),
      label: catName,
      count: count,
      icon: 'Tag',
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
    });
  }

  return {
    inventoryItems,
    detailedInventoryItems,
  };
};
