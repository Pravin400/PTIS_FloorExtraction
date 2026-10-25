 
/**
 * Validates that the payload is an object containing at least an id (assetId).
 */
export function isSubAssetShape(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  const assetId = Number(obj.assetId ?? obj.id);
  return Number.isFinite(assetId) && assetId > 0;
}

/**
 * Validates that an array item from the collection history endpoint is valid.
 */
export function isHistoryItemShape(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const obj = value as Record<string, unknown>;
  return ['receiptNo', 'transactionDate', 'paymentDate', 'financialYear', 'month'].some(
    (key) => key in obj
  );
}
