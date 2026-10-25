"use server";

import { createTaxZoning, getAllTaxZoningServer, getTaxZonePagedServer, getTaxZoningByWardServer, getTaxZoningPagedServer, getTaxZoningPropertyNoServer, getWardPagedServer, updateTaxZoning } from "@/lib/api/taxZoning/taxzoning.service";
import { getTranslations } from "next-intl/server";
import { ApiError } from "@/lib/utils/api";
import { PagedResponse } from "@/types/common.types";
import { ActionResult, TaxZone, TaxZoningFormModel, TaxZoning, TaxZoningPropertyNo, Ward } from "@/types/taxzoning.types";
import { createLogger } from "@/lib/utils/server-logger";

const logger = createLogger('TaxZoningActions');


export async function fetchTaxZonePagedAction(
  pageNumber: number,
  pageSize: number
): Promise<PagedResponse<TaxZone>> {
  try {
    return await getTaxZonePagedServer(pageNumber, pageSize);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    const t = await getTranslations("taxZoning");
    throw new ApiError(
      500,
      t("messages.fetchTaxZonesFailed"),
      "fetchTaxZonePagedAction: Unknown error"
    );
  }
}
export async function fetchWardPagedAction(
  pageNumber: number,
  pageSize: number
): Promise<PagedResponse<Ward>> {
  try {
    return await getWardPagedServer(pageNumber, pageSize);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    const t = await getTranslations("taxZoning");
    const message = error instanceof Error ? error.message : t("messages.fetchWardsFailed");
    const details = error instanceof Error && error.stack ? error.stack : String(error);
    throw new ApiError(
      500,
      message,
      `fetchWardPagedAction: ${details}`
    );
  }
}



export async function getTaxZoningPagedAction(
  pageNumber: number,
  pageSize: number,
  taxZoneId?: number,
  wardId?: number,
  groupBy?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<ActionResult<PagedResponse<TaxZoning>>> {
  try {
    const data = await getTaxZoningPagedServer(pageNumber, pageSize, taxZoneId, wardId, groupBy, sortBy, sortOrder);

    return {
      success: true,
      data,
    };
  } catch (error) {
    logger.error('Failed to get tax zoning paged', { pageNumber, pageSize, taxZoneId, wardId, groupBy }, error);
    if (error instanceof ApiError) {
      return {
        success: false,
        error: error.message,
        statusCode: error.statusCode,
      };
    }

    const t = await getTranslations("taxZoning");
    return {
      success: false,
      error: t("messages.fetchZoningDataFailed"),
      statusCode: 500,
    };
  }
}
export async function getTaxZoningPropertyNoPagedAction(
  pageNumber: number,
  pageSize: number,
  taxZoneId?: number,
  wardId?: number
): Promise<ActionResult<PagedResponse<TaxZoningPropertyNo>>> {
  try {
    const data = await getTaxZoningPropertyNoServer(pageNumber, pageSize, taxZoneId, wardId);

    return {
      success: true,
      data,
    };
  } catch (error) {
    logger.error('Failed to get tax zoning property numbers', { pageNumber, pageSize, taxZoneId, wardId }, error);
    if (error instanceof ApiError) {
      return {
        success: false,
        error: error.message,
        statusCode: error.statusCode,
      };
    }

    const t = await getTranslations("taxZoning");
    return {
      success: false,
      error: t("messages.fetchPropertyNoFailed"),
      statusCode: 500,
    };
  }
}

export async function getTaxZoningByWardAction(
  wardNo: string,
  pageSize: number,
  pageNumber: number
): Promise<ActionResult<PagedResponse<TaxZoning>>> {
  try {
    const data = await getTaxZoningByWardServer(
      wardNo,
      pageSize,
      pageNumber
    );

    return {
      success: true,
      data,
    };
  } catch (error) {
    logger.error('Failed to get tax zoning by ward', { wardNo, pageSize, pageNumber }, error);
    if (error instanceof ApiError) {
      return {
        success: false,
        error: error.message,
        statusCode: error.statusCode,
      };
    }

    const t = await getTranslations("taxZoning");
    return {
      success: false,
      error: t("messages.fetchByWardFailed"),
    };
  }
}

export async function getAllTaxZoningAction(
  pageNumber: number,
  pageSize: number,
  taxZoneId?: number,
  wardId?: number
): Promise<ActionResult<PagedResponse<TaxZoning>>> {
  try {
    const data = await getAllTaxZoningServer(pageNumber, pageSize, taxZoneId, wardId);

    return {
      success: true,
      data,
    };
  } catch (error) {
    logger.error('Failed to get all tax zoning', { pageNumber, pageSize, taxZoneId, wardId }, error);
    if (error instanceof ApiError) {
      return {
        success: false,
        error: error.message,
        statusCode: error.statusCode,
      };
    }

    const t = await getTranslations("taxZoning");
    return {
      success: false,
      error: t("messages.fetchAllFailed"),
    };
  }
}

export async function createTaxZoningAction(
  data: TaxZoningFormModel
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    await createTaxZoning(data);

    return {
      success: true,
      message: "messages.createSuccess",
    };
  } catch (error: unknown) {
    logger.error("Create Tax Zoning Error", { data }, error);
    const t = await getTranslations("taxZoning");
    return {
      success: false,
      message:
        error instanceof Error ? error.message : t("messages.createFailed"),
    };
  }
}

export async function updateTaxZoningAction(
  data: TaxZoningFormModel
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    await updateTaxZoning(data);

    return {
      success: true,
      message: "messages.updateSuccess",
    };
  } catch (error: unknown) {
    logger.error("Update Tax Zoning Error", { data }, error);
    const t = await getTranslations("taxZoning");
    return {
      success: false,
      message:
        error instanceof Error ? error.message : t("messages.updateFailed"),
    };
  }
}