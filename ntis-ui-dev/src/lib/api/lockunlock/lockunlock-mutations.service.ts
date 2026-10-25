import { apiClient } from "@/services/api.service";
import { getTranslations } from "next-intl/server";
import { ApiError } from "@/lib/utils/api";
import { BulkLockUnlockPayload } from "@/types/lockunlock.types";

/**
 * Submits bulk lock or unlock request for property IDs and screen IDs.
 * POST /api/LockUnlock/bulk
 */
export async function bulkLockUnlockProperties(
  payload: BulkLockUnlockPayload
): Promise<{ success: boolean; message?: string }> {
  const originalTimeout = (apiClient as unknown as { timeout?: number }).timeout;
  (apiClient as unknown as { timeout?: number }).timeout = 300000; // 5 minutes for bulk operations

  let response;
  try {
    response = await apiClient.post<{ success: boolean; message?: string }>(
      "/LockUnlock/bulk",
      payload
    );
  } finally {
    (apiClient as unknown as { timeout?: number }).timeout = originalTimeout;
  }

  if (!response.success || !response.data) {
    const t = await getTranslations("lockUnlock");
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || t("messages.bulkFailed"),
      "Bulk lock/unlock failed"
    );
  }

  return response.data;
}

export interface BulkLockUnlockByCategoryPayload {
  scope: {
    searchCategory: number;
    zoneId?: number;
    wardId?: number;
    propertyNo?: string;
    partitionNo?: string;
    propertyFrom?: string;
    propertyTo?: string;
  };
  screenIds: number[];
  action: string;
}

/**
 * Submits bulk lock or unlock request by category scope
 * POST /api/LockUnlock/bulk-by-category
 */
export async function bulkLockUnlockByCategory(
  payload: BulkLockUnlockByCategoryPayload
): Promise<{ success: boolean; message?: string }> {
  const originalTimeout = (apiClient as unknown as { timeout?: number }).timeout;
  (apiClient as unknown as { timeout?: number }).timeout = 600000; // 10 minutes for large category bulk operations

  let response;
  try {
    response = await apiClient.post<{ success: boolean; message?: string }>(
      "/LockUnlock/bulk-by-category",
      payload
    );
  } finally {
    (apiClient as unknown as { timeout?: number }).timeout = originalTimeout;
  }

  if (!response.success || !response.data) {
    const t = await getTranslations("lockUnlock");
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || t("messages.bulkFailed"),
      "Bulk lock/unlock by category failed"
    );
  }

  return response.data;
}