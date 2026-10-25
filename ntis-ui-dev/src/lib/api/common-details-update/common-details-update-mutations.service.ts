import { apiClient } from "@/services/api.service";
import { getTranslations } from "next-intl/server";
import { ApiError } from "@/lib/utils/api";
import { BulkUpdatePayload, BulkUpdateResponse, CreateFieldRegistryDto, ActionResult, ExcelImportResponse, ExcelValidationResponse, BulkUpdateDefinitionPayload, UpdateFieldRegistryDto } from "@/types/common-details-update/common-details-update.types";
import { createLogger } from "@/lib/utils/server-logger";
import { cookies } from "next/headers";
import { getAppConfig } from "@/config/app.config";

const logger = createLogger("BulkUpdateMutations");

export async function addBulkUpdateDefinitionServer(
  payload: BulkUpdateDefinitionPayload
): Promise<ActionResult<unknown>> {
  try {
    logger.info("addBulkUpdateDefinitionServer: Registering new bulk update definition", { 
      updateName: payload.updateName,
      tableId: payload.tableId,
      fieldsCount: payload.tableFieldIds.length
    });

    const response = await apiClient.post<unknown>("/CommonDetails/bulk-update-definitions", payload);

    if (response.success) {
      return { success: true, data: response.data };
    }

    const t = await getTranslations("commonDetailsUpdate");
    throw new ApiError(
      response.statusCode || 500, response.error || t("messages.somethingWrong"), "");
  } catch (error) {
    logger.error("addBulkUpdateDefinitionServer: Failed", { error });
    if (error instanceof ApiError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    const t = await getTranslations("commonDetailsUpdate");
    return { success: false, error: t("messages.somethingWrong"), statusCode: 500 };
  }
}

export async function executeBulkUpdateServer(
  apiRoute: string,
  payload: BulkUpdatePayload | BulkUpdatePayload[]
): Promise<BulkUpdateResponse> {
  // Use provided apiRoute or default to /CommonDetails/update
  let endpoint = apiRoute || "/CommonDetails/update";
  
  // Remove /api prefix if present since baseUrl already includes it
  endpoint = endpoint.replace(/^\/api\//, '/');
  
  logger.info("executeBulkUpdateServer: Starting bulk update", { 
    updateCode: Array.isArray(payload) ? "batch" : payload.updateCode, 
    propertyCount: Array.isArray(payload) ? payload.length : payload.propertyIds?.length,
    endpoint,
    originalApiRoute: apiRoute
  });

  const response = await apiClient.put<BulkUpdateResponse>(endpoint, payload);

  if (!response.success) {
    const t = await getTranslations("commonDetailsUpdate");
    logger.error("executeBulkUpdateServer: Failed", { 
      statusCode: response.statusCode, 
      error: response.error 
    });
    throw new ApiError(
      response.statusCode || 500, response.error || t("messages.updateFailed"), "");
  }

  // Handle wrapped response format
  const data = response.data as unknown as Record<string, unknown>;
  if (data && data.success === true) {
    logger.info("executeBulkUpdateServer: Success", { 
      message: data.message,
      items: data.items 
    });
    return {
      success: true,
      message: String(data.message || ""),
      items: data.items as BulkUpdateResponse["items"],
      errors: data.errors as string[] | null,
      correlationId: data.correlationId as string | null,
    };
  }

  const t = await getTranslations("commonDetailsUpdate");
  let errorMessage = t("messages.updateFailed");

  if (data) {
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      errorMessage = data.errors.join("\n");
    } else if (typeof data.message === "string" && data.message.trim()) {
      errorMessage = data.message;
    }
  }

  throw new ApiError(
    400,
    errorMessage
  , "");
}

export async function addFieldRegistryServer(
  payload: CreateFieldRegistryDto
): Promise<ActionResult<unknown>> {
  try {
    logger.info("addFieldRegistryServer: Registering new field", { 
      updateCode: payload.updateCode,
      updateName: payload.updateName,
      referenceTableName: payload.referenceTableName
    });

    const response = await apiClient.post<unknown>("/FieldRegistry/AddFieldRegistry", payload);

    if (response.success) {
      return { success: true, data: response.data };
    }

    const t = await getTranslations("commonDetailsUpdate");
    throw new ApiError(
      response.statusCode || 500, response.error || t("messages.somethingWrong"), "");
  } catch (error) {
    logger.error("addFieldRegistryServer: Failed", { error });
    if (error instanceof ApiError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    const t = await getTranslations("commonDetailsUpdate");
    return { success: false, error: t("messages.somethingWrong"), statusCode: 500 };
  }
}

export async function importExcelServer(
  formData: FormData
): Promise<ExcelImportResponse> {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth_token")?.value;

  if (!authToken) {
    const t = await getTranslations("commonDetailsUpdate");
    throw new ApiError(401, t("messages.unauthorized") || "Unauthorized", "");
  }

  const config = getAppConfig();
  const backendUrl = `${config.api.baseUrl.replace(/\/$/, "")}/CommonDetails/import-excel`;

  logger.info("importExcelServer: Proxying upload request", { backendUrl });

  const response = await fetch(backendUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${authToken}`,
    },
    body: formData,
  });

  const responseText = await response.text();
  if (!response.ok) {
    let errorMsg = `Upload failed with status ${response.status}`;
    try {
      const errData = JSON.parse(responseText);
      errorMsg = errData.error || errData.message || errorMsg;
    } catch {}
    throw new ApiError(response.status, errorMsg, "");
  }

  try {
    const data = JSON.parse(responseText);
    return {
      success: data.success ?? true,
      message: data.message || "",
      items: data.items || data.data || data.result || (data.rows ? { columns: data.columns, rows: data.rows, totalRows: data.totalRows, flaggedRowCount: data.flaggedRowCount } : undefined),
      errors: data.errors || null,
      successCount: data.successCount,
      failedCount: data.failedCount,
    };
  } catch {
    return {
      success: true,
      message: responseText,
      errors: null,
    };
  }
}

export async function validateExcelServer(
  formData: FormData
): Promise<ExcelValidationResponse> {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth_token")?.value;

  if (!authToken) {
    const t = await getTranslations("commonDetailsUpdate");
    throw new ApiError(401, t("messages.unauthorized") || "Unauthorized", "");
  }

  const config = getAppConfig();
  const backendUrl = `${config.api.baseUrl.replace(/\/$/, "")}/CommonDetails/import-excel-validate`;

  logger.info("validateExcelServer: Proxying validate request", { backendUrl });

  const response = await fetch(backendUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${authToken}`,
    },
    body: formData,
  });

  const responseText = await response.text();
  if (!response.ok) {
    let errorMsg = `Validate failed with status ${response.status}`;
    try {
      const errData = JSON.parse(responseText);
      errorMsg = errData.error || errData.message || errorMsg;
    } catch {}
    throw new ApiError(response.status, errorMsg, "");
  }

  try {
    const data = JSON.parse(responseText);
    return {
      success: data.success ?? true,
      message: data.message || "",
      items: data.items || data.data || data.result || (data.rows ? { columns: data.columns, rows: data.rows, totalRows: data.totalRows, flaggedRowCount: data.flaggedRowCount } : undefined),
      errors: data.errors || null,
      correlationId: data.correlationId || null,
    };
  } catch {
    return {
      success: true,
      message: responseText,
      errors: null,
    };
  }
}

export async function setFieldRegistryStatusServer(
  updateCode: string,
  isActive: boolean
): Promise<ActionResult<{ success: boolean; message: string }>> {
  try {
    logger.info("setFieldRegistryStatusServer: Setting status via PATCH", { updateCode, isActive });

    const response = await apiClient.patch<{ success?: boolean; message?: string }>(
      `/FieldRegistry/SetFieldRegistryStatus/${encodeURIComponent(updateCode)}?isActive=${isActive}`,
      {}
    );

    if (response.success) {
      const data = response.data as Record<string, unknown>;
      return {
        success: true,
        data: {
          success: Boolean(data?.success ?? true),
          message: String(data?.message || "Status updated successfully")
        }
      };
    }

    const postResponse = await apiClient.post<{ success?: boolean; message?: string }>(
      `/FieldRegistry/SetFieldRegistryStatus/${encodeURIComponent(updateCode)}?isActive=${isActive}`,
      {}
    );

    if (postResponse.success) {
      const data = postResponse.data as Record<string, unknown>;
      return {
        success: true,
        data: {
          success: Boolean(data?.success ?? true),
          message: String(data?.message || "Status updated successfully")
        }
      };
    }

    return {
      success: false,
      error: postResponse.error || response.error || "Failed to update field registry status",
      statusCode: postResponse.statusCode || response.statusCode || 500
    };
  } catch (error) {
    logger.error("setFieldRegistryStatusServer: Error", { updateCode, isActive, error });
    if (error instanceof ApiError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    return { success: false, error: "Failed to update field registry status", statusCode: 500 };
  }
}

export async function updateFieldRegistryServer(
  updateCode: string,
  payload: UpdateFieldRegistryDto | (CreateFieldRegistryDto & { isActive?: boolean })
): Promise<ActionResult<unknown>> {
  try {
    logger.info("updateFieldRegistryServer: Updating field registry", { 
      updateCode,
      updateName: payload.updateName,
      referenceTableName: payload.referenceTableName
    });

    const response = await apiClient.put<unknown>(
      `/FieldRegistry/UpdateFieldRegistry/${encodeURIComponent(updateCode)}`,
      payload
    );

    if (response.success) {
      return { success: true, data: response.data };
    }

    const t = await getTranslations("commonDetailsUpdate");
    throw new ApiError(
      response.statusCode || 500, response.error || t("messages.somethingWrong"),
      "updateFieldRegistryServer"
    );
  } catch (error) {
    logger.error("updateFieldRegistryServer: Failed", { error });
    if (error instanceof ApiError) {
      return { success: false, error: error.message, statusCode: error.statusCode };
    }
    const t = await getTranslations("commonDetailsUpdate");
    return { success: false, error: t("messages.somethingWrong"), statusCode: 500 };
  }
}


