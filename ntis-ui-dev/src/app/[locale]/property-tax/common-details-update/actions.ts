"use server";

import { revalidatePath } from "next/cache";

import {
  getBulkUpdateMenuServer,
  getBulkUpdateFieldConfigServer,
  getPropertiesForFilterServer,
  getPreviewListByCategoryServer,
  getWardsPagedServer,
  getWingsForWardServer,
  getPropertiesByCategoryServer,
  executeBulkUpdateServer,
  getAllWingsServer,
  getFieldRegistrySchemasServer,
  getFieldRegistryTablesServer,
  getFieldRegistryColumnsServer,
  addFieldRegistryServer,
  getScopeOptionsServer,
  getScopeCategoryOptionsServer,
  importExcelServer,
  validateExcelServer,
  exportExcelServer,
  getFieldRegistriesServer,
  setFieldRegistryStatusServer,
  updateFieldRegistryServer,
  getSourceTablesServer,
  getSourceTableFieldsServer,
  addBulkUpdateDefinitionServer,
  exportUpdateHistoryServer,
  getUpdateHistoryServer,
  getUpdateHistoryDetailServer,
} from "@/lib/api/common-details-update/common-details-update.service";
import type { WingItem, ScopeOption } from "@/lib/api/common-details-update/common-details-update.service";
import { getWards } from "@/lib/api/ward.services";
import { getZones } from "@/lib/api/zone.services";
import { getTranslations } from "next-intl/server";
import { ApiError } from "@/lib/utils/api";
import { PagedResponse } from "@/types/common.types";
import {
  ActionResult,
  BulkUpdateFieldConfig,
  BulkUpdateMaster,
  BulkUpdatePayload,
  BulkUpdateResponse,
  PropertyFilterParams,
  PropertyFilterByCategoryParams,
  PropertyPreviewRow,
  WardOption,
  WingOption,
  CreateFieldRegistryDto,
  UpdateFieldRegistryDto,
  FieldRegistrySchema,
  FieldRegistryTable,
  FieldRegistryColumn,
  ExcelImportResponse,
  ExcelValidationResponse,
  BulkUpdateDefinitionPayload,
  UpdateHistoryFilterParams,
  UpdateHistoryItem,
  UpdateHistoryDetailItem,
} from "@/types/common-details-update/common-details-update.types";
import { createLogger } from "@/lib/utils/server-logger";

const logger = createLogger("CommonDetailsUpdateActions");

export async function getMenuItemsAction(): Promise<BulkUpdateMaster[]> {
  try {
    return await getBulkUpdateMenuServer();
  } catch (error) {
    logger.error("Failed to fetch menu items", {}, error);
    if (error instanceof ApiError) throw error;
    const t = await getTranslations("commonDetailsUpdate");
    throw new ApiError(500, t("messages.fetchMenuFailed"), "getMenuItemsAction");
  }
}

export async function getDynamicOptionsAction(
  apiPath: string,
  queryParams?: { SearchTerm?: string; PageSize?: number; PageNumber?: number; [key: string]: unknown }
): Promise<ActionResult<unknown>> {
  try {
    const { apiClient } = await import("@/services/api.service");
    let sanitizedPath = apiPath.replace(/^\/?api\//i, '/');

    if (queryParams) {
      const searchParams = new URLSearchParams();
      if (queryParams.SearchTerm !== undefined && queryParams.SearchTerm !== null && queryParams.SearchTerm !== "") {
        searchParams.append("SearchTerm", String(queryParams.SearchTerm));
      }
      if (queryParams.PageSize !== undefined && queryParams.PageSize !== null) {
        searchParams.append("PageSize", String(queryParams.PageSize));
      }
      if (queryParams.PageNumber !== undefined && queryParams.PageNumber !== null) {
        searchParams.append("PageNumber", String(queryParams.PageNumber));
      }
      const qStr = searchParams.toString();
      if (qStr) {
        sanitizedPath += (sanitizedPath.includes("?") ? "&" : "?") + qStr;
      }
    }

    const response = await apiClient.get<unknown>(sanitizedPath);

    if (!response.success) {
      return { success: false, error: response.error || (await getTranslations('commonDetailsUpdate'))('messages.fetchFailed'), statusCode: response.statusCode };
    }

    return { success: true, data: response.data };
  } catch (error) {
    logger.error(`Failed to fetch dynamic options for ${apiPath}`, {}, error);
    if (error instanceof ApiError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    return { success: false, error: (await getTranslations('commonDetailsUpdate'))('messages.fetchFailed'), statusCode: 500 };
  }
}

export async function getFieldConfigsAction(
  updateCode: string
): Promise<ActionResult<BulkUpdateFieldConfig[]>> {
  try {
    const data = await getBulkUpdateFieldConfigServer(updateCode);
    return { success: true, data };
  } catch (error) {
    logger.error("Failed to fetch field configs", { updateCode }, error);
    if (error instanceof ApiError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    const t = await getTranslations("commonDetailsUpdate");
    return { success: false, error: t("messages.fetchFieldConfigFailed"), statusCode: 500 };
  }
}

export async function getFilteredPropertiesAction(
  params: PropertyFilterParams
): Promise<ActionResult<PagedResponse<PropertyPreviewRow>>> {
  try {
    const data = await getPropertiesForFilterServer(params);
    logger.info("getFilteredPropertiesAction: Success", { itemCount: data?.items?.length || 0 });
    return { success: true, data };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    const t = await getTranslations("commonDetailsUpdate");
    return { success: false, error: t("messages.fetchPropertiesFailed"), statusCode: 500 };
  }
}

export async function getPreviewListByCategoryAction(
  params: PropertyFilterByCategoryParams
): Promise<ActionResult<PagedResponse<PropertyPreviewRow>>> {
  try {
    logger.info("getPreviewListByCategoryAction: Called with params", { params });
    const data = await getPreviewListByCategoryServer(params);
    logger.info("getPreviewListByCategoryAction: Success", { itemCount: data?.items?.length || 0 });
    return { success: true, data };
  } catch (error) {
    logger.error("getPreviewListByCategoryAction: Failed", { params }, error);
    if (error instanceof ApiError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    const t = await getTranslations("commonDetailsUpdate");
    return { success: false, error: t("messages.fetchPropertiesFailed"), statusCode: 500 };
  }
}



export async function fetchWardsAction(
  pageNumber: number,
  pageSize: number
): Promise<PagedResponse<WardOption>> {
  try {
    return await getWardsPagedServer(pageNumber, pageSize);
  } catch (error) {
    logger.error("Failed to fetch wards", { pageNumber, pageSize }, error);
    if (error instanceof ApiError) throw error;
    const t = await getTranslations("commonDetailsUpdate");
    throw new ApiError(500, t("messages.fetchWardsFailed"), "fetchWardsAction");
  }
}

export async function getWingsAction(
  wardId: number
): Promise<ActionResult<WingOption[]>> {
  try {
    const data = await getWingsForWardServer(wardId);
    return { success: true, data };
  } catch (error) {
    logger.error("Failed to fetch wings", { wardId }, error);
    return { success: true, data: [] };
  }
}

export async function executeBulkUpdateAction(
  params: { apiRoute?: string, payload: BulkUpdatePayload | BulkUpdatePayload[] }
): Promise<ActionResult<BulkUpdateResponse>> {
  const { apiRoute, payload } = params;
  try {
    const result = await executeBulkUpdateServer(apiRoute ?? "/CommonDetails/update", payload);
    return { success: true, data: result };
  } catch (error) {
    logger.error("Bulk update execution failed", { apiRoute }, error);
    if (error instanceof ApiError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    const t = await getTranslations("commonDetailsUpdate");
    return { success: false, error: t("messages.updateFailed"), statusCode: 500 };
  }
}

/**
 * Fetches all wards using the ward service.
 * Used for populating Ward Number dropdown.
 */
export async function getAllWardsAction(zoneId?: number): Promise<ActionResult<PagedResponse<{ id: number; wardNo: string }>>> {
  try {
    const data = await getWards(1, -1, undefined, zoneId); // PageSize=-1 to get all wards
    return {
      success: true,
      data: {
        items: data.items.map(ward => ({ id: ward.id, wardNo: ward.wardNo })),
        totalCount: data.totalCount,
        pageNumber: data.pageNumber,
        pageSize: data.pageSize,
        totalPages: data.totalPages,
        hasPrevious: data.hasPrevious,
        hasNext: data.hasNext
      }
    };
  } catch (error) {
    logger.error("Failed to fetch wards", { error: error as Error });
    if (error instanceof ApiError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    const t = await getTranslations("commonDetailsUpdate");
    return { success: false, error: t("messages.fetchWardsFailed"), statusCode: 500 };
  }
}

export async function getAllZonesAction(): Promise<ActionResult<PagedResponse<{ id: number; zoneNo: string; description: string | null }>>> {
  try {
    const data = await getZones(1, -1); // PageSize=-1 to get all zones
    return {
      success: true,
      data: {
        items: data.items.map(zone => ({ id: zone.id, zoneNo: zone.zoneNo, description: zone.description || null })),
        totalCount: data.totalCount,
        pageNumber: data.pageNumber,
        pageSize: data.pageSize,
        totalPages: data.totalPages,
        hasPrevious: data.hasPrevious,
        hasNext: data.hasNext
      }
    };
  } catch (error) {
    logger.error("Failed to fetch zones", { error: error as Error });
    if (error instanceof ApiError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    return { success: false, error: (await getTranslations('commonDetailsUpdate'))('messages.fetchFailed'), statusCode: 500 };
  }
}

/**
 * Fetches properties by ward ID for From/To Property dropdowns.
 * Uses GET /Property?WardId={wardId}
 */
export async function getPropertiesByWardAction(
  wardId: number,
  updateCode: string
): Promise<ActionResult<PagedResponse<PropertyPreviewRow>>> {
  try {
    const data = await getPropertiesForFilterServer({
      wardId: String(wardId),
      updateCode,
      page: 1,
      pageSize: 1000
    });
    return { success: true, data };
  } catch (error) {
    logger.error("Failed to fetch properties by ward", { wardId }, error);
    if (error instanceof ApiError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    const t = await getTranslations("commonDetailsUpdate");
    return { success: false, error: t("messages.fetchPropertiesFailed"), statusCode: 500 };
  }
}

export async function getPropertiesByCategoryAction(
  searchCategory: number,
  zoneId: number | undefined,
  wardId: number,
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  propertyFrom?: string
): Promise<ActionResult<PagedResponse<{ propertyId: number; propertyNo: string; partitionNo: string }>>> {
  try {
    const data = await getPropertiesByCategoryServer(
      searchCategory,
      zoneId,
      wardId,
      pageNumber,
      pageSize,
      searchTerm,
      propertyFrom
    );
    const mappedItems = (data.items || []).map(item => ({
      propertyId: item.propertyId,
      propertyNo: item.propertyNo,
      partitionNo: item.partitionNo || "",
    }));
    return {
      success: true,
      data: {
        ...data,
        items: mappedItems
      }
    };
  } catch (error) {
    logger.error("Failed to fetch properties by category", { searchCategory, zoneId, wardId, pageNumber, pageSize, searchTerm, propertyFrom }, error);
    if (error instanceof ApiError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    const t = await getTranslations("commonDetailsUpdate");
    return { success: false, error: t("messages.fetchPropertiesFailed"), statusCode: 500 };
  }
}


/**
 * Fetches all wings for the Wing dropdown.
 * Uses GET /Wing?PageSize=-1
 */
export async function getAllWingsAction(): Promise<ActionResult<PagedResponse<WingItem>>> {
  try {
    const data = await getAllWingsServer();
    return { success: true, data };
  } catch (error) {
    logger.error("Failed to fetch all wings", {}, error);
    if (error instanceof ApiError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    const t = await getTranslations("commonDetailsUpdate");
    return { success: false, error: t("messages.fetchWingsFailed"), statusCode: 500 };
  }
}

export async function getFieldRegistrySchemasAction(): Promise<ActionResult<FieldRegistrySchema[]>> {
  try {
    const data = await getFieldRegistrySchemasServer();
    return { success: true, data };
  } catch (error) {
    logger.error("Failed to fetch field registry schemas", {}, error);
    if (error instanceof ApiError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    return { success: false, error: (await getTranslations('commonDetailsUpdate'))('messages.fetchFailed'), statusCode: 500 };
  }
}

export async function getFieldRegistryTablesAction(
  schemaName: string
): Promise<ActionResult<FieldRegistryTable[]>> {
  try {
    const data = await getFieldRegistryTablesServer(schemaName);
    return { success: true, data };
  } catch (error) {
    logger.error("Failed to fetch field registry tables", { schemaName }, error);
    if (error instanceof ApiError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    return { success: false, error: (await getTranslations('commonDetailsUpdate'))('messages.fetchFailed'), statusCode: 500 };
  }
}

export async function getFieldRegistryColumnsAction(
  schemaName: string,
  tableName: string
): Promise<ActionResult<FieldRegistryColumn[]>> {
  try {
    const data = await getFieldRegistryColumnsServer(schemaName, tableName);
    return { success: true, data };
  } catch (error) {
    logger.error("Failed to fetch field registry columns", { schemaName, tableName }, error);
    if (error instanceof ApiError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    return { success: false, error: (await getTranslations('commonDetailsUpdate'))('messages.fetchFailed'), statusCode: 500 };
  }
}

export async function addFieldRegistryAction(
  payload: CreateFieldRegistryDto
): Promise<ActionResult<unknown>> {
  try {
    const result = await addFieldRegistryServer(payload);
    revalidatePath("/[locale]/property-tax/common-details-update", "page");
    return result;
  } catch (error) {
    logger.error("Failed to add field to registry", { payload }, error);
    if (error instanceof ApiError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    return { success: false, error: (await getTranslations('commonDetailsUpdate'))('messages.actionFailed'), statusCode: 500 };
  }
}

export async function getFieldRegistriesAction(
  pageNumber?: number,
  pageSize?: number,
  updateCode?: string,
  searchTerm?: string
): Promise<ActionResult<PagedResponse<BulkUpdateMaster>>> {
  try {
    const data = await getFieldRegistriesServer(pageNumber, pageSize, updateCode, searchTerm);
    if (Array.isArray(data)) {
      return {
        success: true,
        data: {
          items: data,
          totalCount: data.length,
          pageNumber: 1,
          pageSize: data.length || 10,
          totalPages: 1,
          hasPrevious: false,
          hasNext: false
        }
      };
    }
    return { success: true, data };
  } catch (error) {
    logger.error("Failed to fetch field registries", {}, error);
    if (error instanceof ApiError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    return { success: false, error: (await getTranslations('commonDetailsUpdate'))('messages.fetchFailed'), statusCode: 500 };
  }
}

export async function setFieldRegistryStatusAction(
  updateCode: string,
  isActive: boolean
): Promise<ActionResult<{ success: boolean; message: string }>> {
  try {
    const result = await setFieldRegistryStatusServer(updateCode, isActive);
    revalidatePath("/[locale]/property-tax/common-details-update", "page");
    return result;
  } catch (error) {
    logger.error("Failed to set field registry status", { updateCode, isActive }, error);
    if (error instanceof ApiError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    return { success: false, error: (await getTranslations('commonDetailsUpdate'))('messages.actionFailed'), statusCode: 500 };
  }
}

export async function getScopeOptionsAction(): Promise<ActionResult<ScopeOption[]>> {
  try {
    const data = await getScopeOptionsServer();
    return { success: true, data };
  } catch (error) {
    logger.error("Failed to fetch scope options", {}, error);
    if (error instanceof ApiError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    return { success: false, error: (await getTranslations('commonDetailsUpdate'))('messages.fetchFailed'), statusCode: 500 };
  }
}

export async function getScopeCategoryOptionsAction(
  categoryId: number
): Promise<ActionResult<ScopeOption>> {
  try {
    const data = await getScopeCategoryOptionsServer(categoryId);
    if (data) {
      return { success: true, data };
    }
    return { success: false, error: (await getTranslations('commonDetailsUpdate'))('messages.notFound'), statusCode: 404 };
  } catch (error) {
    logger.error("Failed to fetch scope category options", { categoryId }, error);
    if (error instanceof ApiError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    return { success: false, error: (await getTranslations('commonDetailsUpdate'))('messages.fetchFailed'), statusCode: 500 };
  }
}

function formatExcelError(rawMessage: string, t: (key: string) => string): string {
  const rawMsg = (rawMessage || "").toLowerCase();

  if (
    rawMsg.includes("empty") ||
    rawMsg.includes("no data") ||
    rawMsg.includes("no rows") ||
    rawMsg.includes("nodatarows")
  ) {
    return t("messages.noDataRows");
  }

  if (
    rawMsg.includes("file format") ||
    rawMsg.includes("invalid file") ||
    rawMsg.includes("wrong file") ||
    rawMsg.includes("extension") ||
    rawMsg.includes("format") ||
    rawMsg.includes("invalid file type")
  ) {
    return t("messages.wrongFileType");
  }

  if (
    rawMsg.includes("missing required column") ||
    rawMsg.includes("wrong update group") ||
    rawMsg.includes("column") ||
    rawMsg.includes("wardno") ||
    rawMsg.includes("propertyno") ||
    rawMsg.includes("partitionno") ||
    rawMsg.includes("match") ||
    rawMsg.includes("not found") ||
    rawMsg.includes("updatable value") ||
    rawMsg.includes("update type") ||
    rawMsg.includes("unrecognized table")
  ) {
    return t("messages.wrongUpdateGroup");
  }

  return t("messages.wrongUpdateGroup");
}

export async function importExcelAction(
  formData: FormData
): Promise<ActionResult<ExcelImportResponse>> {
  try {
    const result = await importExcelServer(formData);
    revalidatePath("/[locale]/property-tax/common-details-update", "page");
    return { success: true, data: result };
  } catch (error) {
    logger.error("Excel import execution failed", {}, error);
    revalidatePath("/[locale]/property-tax/common-details-update", "page");
    const t = await getTranslations("commonDetailsUpdate");
    if (error instanceof ApiError) {
      const errorMessage = formatExcelError(error.message, t);
      return { success: false, error: errorMessage, statusCode: error.statusCode };
    }
    return { success: false, error: t("excelUpload.validations.bulkUpdateFailedMsg"), statusCode: 500 };
  }
}

export async function validateExcelAction(
  formData: FormData
): Promise<ActionResult<ExcelValidationResponse>> {
  try {
    const result = await validateExcelServer(formData);
    return { success: true, data: result };
  } catch (error) {
    logger.error("Excel validate execution failed", {}, error);
    const t = await getTranslations("commonDetailsUpdate");
    if (error instanceof ApiError) {
      const errorMessage = formatExcelError(error.message, t);
      return { success: false, error: errorMessage, statusCode: error.statusCode };
    }
    return { success: false, error: t("excelUpload.validations.validationFailedMsg"), statusCode: 500 };
  }
}

export async function exportExcelAction(
  params: {
    updateCode: string;
    wardId?: string;
    fromPropertyNo?: string;
    toPropertyNo?: string;
    propertyNo?: string;
  }
): Promise<ActionResult<string>> {
  try {
    const base64 = await exportExcelServer(params);
    return { success: true, data: base64 };
  } catch (error) {
    logger.error("Excel export execution failed", { wardId: params.wardId, updateCode: params.updateCode }, error);
    if (error instanceof ApiError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    const t = await getTranslations("commonDetailsUpdate");
    return { success: false, error: t("messages.somethingWrong"), statusCode: 500 };
  }
}

export async function updateFieldRegistryAction(
  updateCode: string,
  payload: UpdateFieldRegistryDto | (CreateFieldRegistryDto & { isActive?: boolean })
): Promise<ActionResult<unknown>> {
  try {
    const result = await updateFieldRegistryServer(updateCode, payload);
    revalidatePath("/[locale]/property-tax/common-details-update", "page");
    return result;
  } catch (error) {
    logger.error("Failed to update field registry", { updateCode, payload }, error);
    if (error instanceof ApiError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    return { success: false, error: (await getTranslations('commonDetailsUpdate'))('messages.actionFailed'), statusCode: 500 };
  }
}

export async function getSourceTablesAction(): Promise<ActionResult<{ id: number; tableName: string }[]>> {
  try {
    const data = await getSourceTablesServer();
    return { success: true, data };
  } catch (error) {
    logger.error("Failed to fetch source tables", {}, error);
    if (error instanceof ApiError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    return { success: false, error: (await getTranslations('commonDetailsUpdate'))('messages.fetchFailed'), statusCode: 500 };
  }
}

export async function getSourceTableFieldsAction(sourceTableId: number): Promise<ActionResult<{ id: number; tableFieldName: string }[]>> {
  try {
    const data = await getSourceTableFieldsServer(sourceTableId);
    return { success: true, data };
  } catch (error) {
    logger.error("Failed to fetch source table fields", { sourceTableId }, error);
    if (error instanceof ApiError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    return { success: false, error: (await getTranslations('commonDetailsUpdate'))('messages.fetchFailed'), statusCode: 500 };
  }
}

export async function addBulkUpdateDefinitionAction(
  payload: BulkUpdateDefinitionPayload
): Promise<ActionResult<unknown>> {
  try {
    const result = await addBulkUpdateDefinitionServer(payload);
    if (result.success) {
      revalidatePath("/[locale]/property-tax/common-details-update", "page");
      return result;
    }

    const rawError = result.error || (result as Record<string, unknown>).message as string || "";
    let errorMessage = rawError;

    if (/already exists/i.test(rawError) || /definition with code/i.test(rawError)) {
      const t = await getTranslations("commonDetailsUpdate");
      errorMessage = t("messages.groupAlreadyExists");
    } else {
      errorMessage = rawError.replace(/^addBulkUpdateDefinitionServer:\s*/, '').replace(/^:\s*/, '');
    }

    return { success: false, error: errorMessage, statusCode: result.statusCode || 400 };
  } catch (error) {
    logger.error("Failed to add bulk update definition", { updateName: payload.updateName }, error);
    if (error instanceof ApiError) {
      let errorMessage = error.responseText || error.message;
      if (/already exists/i.test(errorMessage) || /definition with code/i.test(errorMessage)) {
        const t = await getTranslations("commonDetailsUpdate");
        errorMessage = t("messages.groupAlreadyExists");
      } else {
        errorMessage = errorMessage.replace(/^addBulkUpdateDefinitionServer:\s*/, '').replace(/^:\s*/, '');
      }

      return { success: false, error: errorMessage, statusCode: error.statusCode };
    }
    const t = await getTranslations("commonDetailsUpdate");
    return { success: false, error: t("messages.somethingWrong"), statusCode: 500 };
  }
}

export async function getUpdateHistoryAction(
  params: UpdateHistoryFilterParams
): Promise<ActionResult<PagedResponse<UpdateHistoryItem>>> {
  try {
    const data = await getUpdateHistoryServer(params);
    return { success: true, data };
  } catch (error) {
    logger.error("Failed to fetch update history", { params }, error);
    if (error instanceof ApiError) return { success: false, error: error.message, statusCode: error.statusCode };
    const t = await getTranslations("commonDetailsUpdate");
    return { success: false, error: t("messages.somethingWrong"), statusCode: 500 };
  }
}

export async function getUpdateHistoryDetailAction(
  activityId: string,
  pageNumber?: number,
  pageSize?: number,
  searchTerm?: string
): Promise<ActionResult<PagedResponse<UpdateHistoryDetailItem>>> {
  try {
    const data = await getUpdateHistoryDetailServer(activityId, pageNumber, pageSize, searchTerm);
    return { success: true, data };
  } catch (error) {
    logger.error("Failed to fetch update history details", { activityId, pageNumber, pageSize, searchTerm }, error);
    if (error instanceof ApiError) return { success: false, error: error.message, statusCode: error.statusCode };
    const t = await getTranslations("commonDetailsUpdate");
    return { success: false, error: t("messages.somethingWrong"), statusCode: 500 };
  }
}

export async function exportUpdateHistoryAction(
  params: UpdateHistoryFilterParams
): Promise<ActionResult<string>> {
  try {
    const data = await exportUpdateHistoryServer(params);
    return { success: true, data };
  } catch (error) {
    logger.error("Failed to export update history", { params }, error);
    if (error instanceof ApiError) return { success: false, error: `API Error: ${error.message} (Status: ${error.statusCode})`, statusCode: error.statusCode };
    return { success: false, error: `Server Error: ${error instanceof Error ? error.message : String(error)}`, statusCode: 500 };
  }
}

export async function getExcelTemplateFieldsAction(): Promise<ActionResult<BulkUpdateMaster[]>> {
  try {
    const data = await getBulkUpdateMenuServer();
    return { success: true, data };
  } catch (error) {
    logger.error("Failed to fetch excel template fields", {}, error);
    if (error instanceof ApiError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    const t = await getTranslations("commonDetailsUpdate");
    return { success: false, error: t("messages.fetchMenuFailed"), statusCode: 500 };
  }
}