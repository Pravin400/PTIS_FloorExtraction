"use server";

import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/config";
import {
  createGisKpi,
  deleteGisKpi,
  getGisKpiPaged,
  getGisKpiById,
  updateGisKpi,
  getGisDepartmentKpiMappings,
  getGisDepartmentKpiMappingById,
  createGisDepartmentKpiMapping,
  updateGisDepartmentKpiMapping,
  deleteGisDepartmentKpiMapping,
} from "@/lib/api/gis-master/gis-kpi-crud.service";
import { getAllDepartmentMasters } from "@/lib/api/configuration-settings/department-master/departmentMaster.service";
import { ApiError } from "@/lib/utils/api";
import {
  GisKpiMaster,
  GisKpiMasterFormModel,
  GisDepartmentKpiMapping,
  GisDepartmentKpiMappingPayload,
} from "@/types/gis-master/gis-kpi-master.types";
import { DepartmentMaster } from "@/types/departmentMaster.types";
import { PagedResponse } from "@/types/common.types";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { getLocale } from "next-intl/server";
import { logger } from "@/lib/utils/logger";

const BASE_PAGE_PATH = "/configuration-settings/gis-master/gis-kpi-master";

export async function fetchGisKpiPagedServerAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<GisKpiMaster>> {
  try {
    const MAX_PAGE_SIZE = 100;
    const MAX_PAGE_NUMBER = 10000;
    if (
      !Number.isFinite(pageNumber) ||
      !Number.isFinite(pageSize) ||
      pageNumber <= 0 ||
      (pageSize <= 0 && pageSize !== -1) ||
      (pageSize > MAX_PAGE_SIZE && pageSize !== -1) ||
      pageNumber > MAX_PAGE_NUMBER
    ) {
      throw new ApiError(400, "Invalid pagination parameters", "Validation failed");
    }

    const allowedSortColumns = ["kpiCode", "defaultTitle"];
    const validSortBy = sortBy && allowedSortColumns.includes(sortBy) ? sortBy : undefined;
    const validSortOrder =
      sortOrder && ["asc", "desc"].includes(sortOrder.toLowerCase())
        ? sortOrder.toLowerCase()
        : undefined;

    return await getGisKpiPaged(pageNumber, pageSize, searchTerm, validSortBy, validSortOrder);
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      logger.error(
        `[fetchGisKpiPagedServerAction] API Error ${error.statusCode}: ${error.responseText}`,
        { error }
      );
    } else if (error instanceof Error) {
      logger.error(`[fetchGisKpiPagedServerAction] Error: ${error.message}`, { error });
    } else {
      logger.error("[fetchGisKpiPagedServerAction] Unknown error", {
        error: new Error(String(error)),
      });
    }
    throw error;
  }
}

export async function createGisKpiAction(
  data: GisKpiMasterFormModel
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    await createGisKpi(data);

    for (const locale of locales) {
      revalidatePath(`/${locale}${BASE_PAGE_PATH}`, "page");
    }
    return { success: true };
  } catch (error: unknown) {
    if (isRedirectError(error)) throw error;
    if (error instanceof ApiError && error.statusCode === 401) {
      const locale = await getLocale();
      redirect(`/${locale}/login`);
    }
    if (error instanceof ApiError) {
      return {
        success: false,
        message: error.responseText,
        statusCode: error.statusCode,
      };
    }
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "Failed to create GIS KPI master" };
  }
}

export async function updateGisKpiAction(
  data: GisKpiMasterFormModel
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    await updateGisKpi(data);

    for (const locale of locales) {
      revalidatePath(`/${locale}${BASE_PAGE_PATH}`, "page");
    }
    return { success: true };
  } catch (error: unknown) {
    if (isRedirectError(error)) throw error;
    if (error instanceof ApiError && error.statusCode === 401) {
      const locale = await getLocale();
      redirect(`/${locale}/login`);
    }
    if (error instanceof ApiError) {
      return {
        success: false,
        message: error.responseText,
        statusCode: error.statusCode,
      };
    }
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "Failed to update GIS KPI master" };
  }
}

export async function deleteGisKpiAction(
  formData: FormData
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  const rawid = formData.get("id");
  const id = typeof rawid === "string" ? parseInt(rawid, 10) : 0;

  if (!id || id <= 0) {
    return {
      success: false,
      message: "Valid GIS KPI ID is required",
      statusCode: 400,
    };
  }

  try {
    await deleteGisKpi(id);

    for (const locale of locales) {
      revalidatePath(`/${locale}${BASE_PAGE_PATH}`, "page");
    }
    return {
      success: true,
      message: "GIS KPI deleted successfully",
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof ApiError && error.statusCode === 401) {
      const locale = await getLocale();
      redirect(`/${locale}/login`);
    }
    if (error instanceof ApiError) {
      return {
        success: false,
        message: error.responseText,
        statusCode: error.statusCode,
      };
    }

    return {
      success: false,
      message: "Failed to delete GIS KPI master",
    };
  }
}

export async function getGisKpiByIdAction(id: number): Promise<GisKpiMaster> {
  try {
    if (!id || id <= 0) {
      throw new ApiError(400, "Valid GIS KPI ID is required", "Validation failed");
    }
    const result = await getGisKpiById(id);
    if (!result) {
      throw new ApiError(404, "GIS KPI not found", "Not Found");
    }
    return result;
  } catch (error) {
    if (error instanceof ApiError) {
      logger.error(
        `[getGisKpiByIdAction] API Error ${error.statusCode}: ${error.responseText}`,
        { error }
      );
    } else {
      logger.error("[getGisKpiByIdAction] Error", {
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
    throw error;
  }
}

export async function fetchGisDepartmentKpiMappingsAction(
  departmentId?: number | string
): Promise<GisDepartmentKpiMapping[]> {
  try {
    return await getGisDepartmentKpiMappings(departmentId);
  } catch (error) {
    logger.error("[fetchGisDepartmentKpiMappingsAction] Error", {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return [];
  }
}

export async function getGisDepartmentKpiMappingByIdAction(
  id: number
): Promise<GisDepartmentKpiMapping | null> {
  try {
    return await getGisDepartmentKpiMappingById(id);
  } catch (error) {
    logger.error("[getGisDepartmentKpiMappingByIdAction] Error", {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    const all = await getGisDepartmentKpiMappings();
    return all.find((m) => Number(m.id) === Number(id)) ?? null;
  }
}

export async function createGisDepartmentKpiMappingAction(
  data: GisDepartmentKpiMappingPayload
): Promise<{ success: boolean; data?: GisDepartmentKpiMapping; message?: string; statusCode?: number }> {
  try {
    const created = await createGisDepartmentKpiMapping(data);

    for (const locale of locales) {
      revalidatePath(`/${locale}${BASE_PAGE_PATH}`, "page");
    }
    return { success: true, data: created, message: "Record inserted successfully" };
  } catch (error: unknown) {
    if (isRedirectError(error)) throw error;
    if (error instanceof ApiError && error.statusCode === 401) {
      const locale = await getLocale();
      redirect(`/${locale}/login`);
    }
    if (error instanceof ApiError) {
      return {
        success: false,
        message: error.responseText,
        statusCode: error.statusCode,
      };
    }
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "Failed to create department mapping" };
  }
}

export async function updateGisDepartmentKpiMappingAction(
  data: GisDepartmentKpiMappingPayload
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    await updateGisDepartmentKpiMapping(data);

    for (const locale of locales) {
      revalidatePath(`/${locale}${BASE_PAGE_PATH}`, "page");
    }
    return { success: true, message: "Record updated successfully" };
  } catch (error: unknown) {
    if (isRedirectError(error)) throw error;
    if (error instanceof ApiError && error.statusCode === 401) {
      const locale = await getLocale();
      redirect(`/${locale}/login`);
    }
    if (error instanceof ApiError) {
      return {
        success: false,
        message: error.responseText,
        statusCode: error.statusCode,
      };
    }
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "Failed to update department mapping" };
  }
}

export async function deleteGisDepartmentKpiMappingAction(
  id: number
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    await deleteGisDepartmentKpiMapping(id);

    for (const locale of locales) {
      revalidatePath(`/${locale}${BASE_PAGE_PATH}`, "page");
    }
    return { success: true, message: "Mapping deleted successfully" };
  } catch (error: unknown) {
    if (isRedirectError(error)) throw error;
    if (error instanceof ApiError && error.statusCode === 401) {
      const locale = await getLocale();
      redirect(`/${locale}/login`);
    }
    if (error instanceof ApiError) {
      return {
        success: false,
        message: error.responseText,
        statusCode: error.statusCode,
      };
    }
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "Failed to delete mapping" };
  }
}

export async function fetchAvailableDepartmentsAction(): Promise<DepartmentMaster[]> {
  try {
    const res = await getAllDepartmentMasters();
    if (res.success && Array.isArray(res.data)) {
      return res.data.filter((d) => d.isActive !== false);
    }
    return [];
  } catch (error) {
    logger.error("[fetchAvailableDepartmentsAction] Error", {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return [];
  }
}

