"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { locales } from "@/i18n/config";
import { ApiError } from "@/lib/utils/api";
import {
  getLockUnlockScreens,
  getLockUnlockProperties,
  getLockUnlockPropertiesByCategory,
  getLockUnlockPropertiesByExcel,
  bulkLockUnlockProperties,
  bulkLockUnlockByCategory
} from "@/lib/api/lockunlock/lockunlock.service";
import { getLockUnlockModules } from "@/lib/api/lockunlock/lockunlock-queries.service";
import {
  LockedScreen,
  LockUnlockPropertiesQueryParams,
  LockUnlockPropertiesResponse,
  BulkLockUnlockPayload,
  LockUnlockPropertyItem,
  ModuleItem,
} from "@/types/lockunlock.types";

/**
 * Server Action to fetch all lock/unlock modules.
 */
export async function getLockUnlockModulesAction(pageNumber?: number, pageSize?: number): Promise<ModuleItem[]> {
  try {
    return await getLockUnlockModules(pageNumber, pageSize);
  } catch (error: unknown) {
    throw error;
  }
}

/**
 * Server Action to fetch all lockable screen configurations.
 */
export async function getLockUnlockScreensAction(moduleIds?: string): Promise<LockedScreen[]> {
  try {
    return await getLockUnlockScreens(moduleIds);
  } catch (error: unknown) {
    throw error;
  }
}

/**
 * Server Action to fetch properties by criteria (Ward, range, search, pagination).
 */
export async function fetchLockUnlockPropertiesPagedAction(
  params: LockUnlockPropertiesQueryParams
): Promise<LockUnlockPropertiesResponse> {
  try {
    return await getLockUnlockProperties(params);
  } catch (error: unknown) {
    throw error;
  }
}

/**
 * Server Action to fetch properties by category (SearchCategory, Ward, range, search, pagination).
 */
export async function fetchLockUnlockPropertiesByCategoryAction(
  params: LockUnlockPropertiesQueryParams
): Promise<LockUnlockPropertiesResponse> {
  try {
    return await getLockUnlockPropertiesByCategory(params);
  } catch (error: unknown) {
    throw error;
  }
}

/**
 * Server Action to submit a bulk lock/unlock request.
 * Supports select-all mode by resolving all matching property IDs server-side
 * when selectAll is true, then passing the resolved IDs to the legacy API.
 */
export async function bulkLockUnlockPropertiesAction(
  payload: BulkLockUnlockPayload
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const resolvedPayload: {
      propertyIds: number[];
      screenIds: number[];
      action: "lock" | "unlock";
    } = { propertyIds: [], screenIds: payload.screenIds, action: payload.action };
    const t = await getTranslations("lockUnlock");

    if (payload.selectAll && payload.filters) {
      const queryParams: LockUnlockPropertiesQueryParams = {
        SearchCategory: 4,
        WardId: payload.filters.wardId,
        PropertyFrom: payload.filters.fromProperty,
        PropertyTo: payload.filters.toProperty,
        PartitionNo: payload.filters.partitionNo,
        Search: payload.filters.search,
        PageNumber: 1,
        PageSize: -1,
      };

      const allProperties = await getLockUnlockPropertiesByCategory(queryParams);

      if (!allProperties || !allProperties.items || allProperties.items.length === 0) {
        return {
          success: false,
          error: t("messages.noPropertiesFoundFilters"),
        };
      }

      const allPropertyIds = allProperties.items.map((p: LockUnlockPropertyItem) => p.propertyId);
      const excludedIds = payload.excludedPropertyIds ?? [];

      resolvedPayload.propertyIds = allPropertyIds.filter(
        (id: number) => !excludedIds.includes(id)
      );

      if (resolvedPayload.propertyIds.length === 0) {
        return {
          success: false,
          error: t("messages.noPropertiesSelectedExclusions"),
        };
      }
    } else {
      resolvedPayload.propertyIds = payload.propertyIds ?? [];
    }

    if (resolvedPayload.propertyIds.length === 0) {
      return {
        success: false,
        error: t("messages.atLeastOnePropertyRequired"),
      };
    }

    const result = await bulkLockUnlockProperties(resolvedPayload);

    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/lockunlock`, "page");
    }

    if (result.success === false) {
      return {
        success: false,
        error: result.message || t("messages.bulkFailed"),
      };
    }

    return {
      success: true,
      message: result.message || t("messages.bulkSuccessmsg"),
    };
  } catch (error: unknown) {
    const t = await getTranslations("lockUnlock");
    if (error instanceof ApiError) {
      return { success: false, error: error.responseText };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: t("messages.unexpectedErrorBulk") };
  }
}

/**
 * Server Action to submit a bulk lock/unlock request by category scope.
 */
export async function bulkLockUnlockByCategoryAction(
  payload: {
    scope: {
      searchCategory: number;
      zoneId?: number;
      wardId?: number;
      propertyNo?: string;
      propertyFrom?: string;
      propertyTo?: string;
      partitionNo?: string;
    };
    screenIds: number[];
    action: "lock" | "unlock";
    excludedPropertyIds?: number[];
  }
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const t = await getTranslations("lockUnlock");
    const excludedIds = payload.excludedPropertyIds ?? [];

    if (excludedIds.length === 0) {
      const result = await bulkLockUnlockByCategory({
        scope: payload.scope,
        screenIds: payload.screenIds,
        action: payload.action,
      });

      for (const locale of locales) {
        revalidatePath(`/${locale}/property-tax/lockunlock`, "page");
      }
      return { success: true, message: result.message };
    }

    const queryParams: LockUnlockPropertiesQueryParams = {
      SearchCategory: payload.scope.searchCategory,
      PageNumber: 1,
      PageSize: -1,
    };
    if (payload.scope.searchCategory === 1) {
      queryParams.ZoneId = payload.scope.zoneId;
    } else if (payload.scope.searchCategory === 2) {
      queryParams.WardId = payload.scope.wardId;
    } else if (payload.scope.searchCategory === 3) {
      queryParams.WardId = payload.scope.wardId;
      queryParams.PropertyNo = payload.scope.propertyNo;
    } else if (payload.scope.searchCategory === 4) {
      queryParams.WardId = payload.scope.wardId;
      queryParams.PropertyFrom = payload.scope.propertyFrom;
      queryParams.PropertyTo = payload.scope.propertyTo;
    }
    
    if (payload.scope.partitionNo) {
      queryParams.PartitionNo = payload.scope.partitionNo;
    }

    const allProperties = await getLockUnlockPropertiesByCategory(queryParams);

    if (!allProperties || !allProperties.items || allProperties.items.length === 0) {
      return { success: false, error: t("messages.noPropertiesFoundFilters") };
    }

    const allPropertyIds = allProperties.items.map((p: LockUnlockPropertyItem) => p.propertyId);
    const finalPropertyIds = allPropertyIds.filter((id: number) => !excludedIds.includes(id));

    if (finalPropertyIds.length === 0) {
      return { success: false, error: t("messages.noPropertiesSelectedExclusions") };
    }

    const result = await bulkLockUnlockProperties({
      propertyIds: finalPropertyIds,
      screenIds: payload.screenIds,
      action: payload.action,
    });

    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/lockunlock`, "page");
    }

    if (result.success === false) {
      return { success: false, error: result.message || t("messages.bulkFailed") };
    }

    return { success: true, message: result.message || t("messages.bulkSuccessmsg") };
  } catch (error: unknown) {
    const t = await getTranslations("lockUnlock");
    if (error instanceof ApiError) {
      return { success: false, error: error.responseText };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: t("messages.unexpectedErrorBulk") };
  }
}

// Server-side in-memory cache for uploaded Excel files to avoid re-uploading file bytes
interface CachedExcelSession {
  fileBlob: Blob;
  fileName: string;
  createdAt: number;
}

const excelSessionStore = new Map<string, CachedExcelSession>();
const EXCEL_SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour

function cleanExpiredExcelSessions() {
  const now = Date.now();
  for (const [id, session] of excelSessionStore.entries()) {
    if (now - session.createdAt > EXCEL_SESSION_TTL_MS) {
      excelSessionStore.delete(id);
    }
  }
}

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Server Action to fetch properties by Excel upload file or stored fileSessionId.
 * When File is provided, it stores the file session and returns fileSessionId.
 * When fileSessionId is provided, it reuses the cached file without re-uploading.
 */
export async function fetchLockUnlockPropertiesByExcelAction(
  formData: FormData
): Promise<LockUnlockPropertiesResponse> {
  try {
    cleanExpiredExcelSessions();
    const file = formData.get("File") as File | null;
    const fileSessionIdParam = formData.get("FileSessionId") as string | null;

    let targetFormData = formData;
    let currentSessionId = fileSessionIdParam || "";

    if (file && file.size > 0) {
      currentSessionId = generateSessionId();
      const arrayBuffer = await file.arrayBuffer();
      excelSessionStore.set(currentSessionId, {
        fileBlob: new Blob([arrayBuffer], { type: file.type || "application/octet-stream" }),
        fileName: file.name,
        createdAt: Date.now(),
      });
    } else if (fileSessionIdParam && excelSessionStore.has(fileSessionIdParam)) {
      const cached = excelSessionStore.get(fileSessionIdParam)!;
      targetFormData = new FormData();
      targetFormData.append("File", cached.fileBlob, cached.fileName);

      const pageNumber = formData.get("PageNumber");
      const pageSize = formData.get("PageSize");
      const searchTerm = formData.get("SearchTerm");

      if (pageNumber) targetFormData.append("PageNumber", pageNumber.toString());
      if (pageSize) targetFormData.append("PageSize", pageSize.toString());
      if (searchTerm) targetFormData.append("SearchTerm", searchTerm.toString());
    }

    const response = await getLockUnlockPropertiesByExcel(targetFormData);
    if (currentSessionId) {
      response.fileSessionId = currentSessionId;
    }
    return response;
  } catch (error: unknown) {
    throw error;
  }
}

/**
 * Server Action to perform bulk lock/unlock on an uploaded Excel session directly on the server.
 * Avoids sending all resolved property IDs back and forth over the client network.
 */
export async function bulkLockUnlockByExcelSessionAction(payload: {
  fileSessionId: string;
  screenIds: number[];
  action: "lock" | "unlock";
  searchTerm?: string;
  excludedPropertyIds?: number[];
}): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const t = await getTranslations("lockUnlock");
    const cached = excelSessionStore.get(payload.fileSessionId);

    if (!cached) {
      return {
        success: false,
        error: t("selectPropertyCard.excelUploadRequired"),
      };
    }

    const allFormData = new FormData();
    allFormData.append("File", cached.fileBlob, cached.fileName);
    allFormData.append("PageNumber", "1");
    allFormData.append("PageSize", "-1");
    if (payload.searchTerm) {
      allFormData.append("SearchTerm", payload.searchTerm);
    }

    const allRes = await getLockUnlockPropertiesByExcel(allFormData);
    const allItems = allRes.items || [];
    const excludedIds = payload.excludedPropertyIds || [];
    const targetPropertyIds = allItems
      .map((p) => p.propertyId)
      .filter((id) => !excludedIds.includes(id));

    if (targetPropertyIds.length === 0) {
      return {
        success: false,
        error: t("messages.selectPropertyRequired"),
      };
    }

    const result = await bulkLockUnlockProperties({
      propertyIds: targetPropertyIds.map(Number),
      screenIds: payload.screenIds.map(Number),
      action: payload.action,
    });

    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/lockunlock`, "page");
    }

    if (result.success === false) {
      return {
        success: false,
        error: result.message || t("messages.bulkFailed"),
      };
    }

    return {
      success: true,
      message: result.message || t("messages.bulkSuccessmsg"),
    };
  } catch (error: unknown) {
    const t = await getTranslations("lockUnlock");
    if (error instanceof ApiError) {
      return { success: false, error: error.responseText };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: t("messages.unexpectedErrorBulk") };
  }
}