'use server';

import {
    automationGetDataEntryGrid,
    automationGetDataEntryWardWiseSummary
} from "@/lib/api/automation-dashboard/data-entry-quality-check/data-entry-quality-check.service";
import {
    DataEntryGridItems,
    DataEntryWardWiseSummaryItems
} from "@/types/automation-dashboard/data-entry-quality-check/data-entry-quality-check.type";
import { createLogger } from "@/lib/utils/server-logger";
import { ApiError } from "@/lib/utils/api";
import { getTranslations } from "next-intl/server";

const logger = createLogger("QualityCheckActions");

type ActionResult<T> = {
    success: boolean;
    data?: T | null;
    error?: string;
    statusCode?: number;
};

/**
 * Server action to fetch the data entry grid data.
 * 
 * @param workflowStageId Optional ID to filter the grid data by workflow stage.
 * @returns An object containing success status, data, and optional error message.
 */
export async function getDataEntryGridAction(
    workflowStageId?: string | number,
    propertyTypeId?: string | null,
    propertyTypeCategoryId?: string | null
): Promise<ActionResult<DataEntryGridItems>> {
    try {
        logger.info("getDataEntryGridAction: Fetching data entry grid data", { workflowStageId, propertyTypeId, propertyTypeCategoryId });
        const data = await automationGetDataEntryGrid(workflowStageId, propertyTypeId, propertyTypeCategoryId);
        return { success: true, data };
    } catch (error) {
        logger.error("Failed to fetch data entry grid data", { workflowStageId }, error);
        if (error instanceof ApiError) {
            return { success: false, error: error.message, statusCode: error.statusCode };
        }
        const t = await getTranslations("automationDashboard");
        return { success: false, error: t("errors.fetchDataEntryGrid") || "Failed to fetch data entry grid data", statusCode: 500 };
    }
}

/**
 * Server action to fetch the data entry ward-wise summary data.
 * 
 * @param zoneId The zone ID to fetch data for.
 * @param workflowStageId Optional ID to filter by workflow stage.
 * @returns An object containing success status, data, and optional error message.
 */
export async function getDataEntryWardWiseSummaryAction(
    zoneId: string | number,
    workflowStageId?: string | number,
    pageNumber: number = 1,
    pageSize: number = 10,
    propertyTypeId?: string | null,
    propertyTypeCategoryId?: string | null
): Promise<ActionResult<DataEntryWardWiseSummaryItems>> {
    try {
        logger.info("getDataEntryWardWiseSummaryAction: Fetching ward-wise summary", { zoneId, workflowStageId, pageNumber, pageSize, propertyTypeId, propertyTypeCategoryId });
        const data = await automationGetDataEntryWardWiseSummary(zoneId, workflowStageId, pageNumber, pageSize, propertyTypeId, propertyTypeCategoryId);
        return { success: true, data };
    } catch (error) {
        logger.error("Failed to fetch data entry ward-wise summary data", { zoneId, workflowStageId, pageNumber, pageSize }, error);
        if (error instanceof ApiError) {
            return { success: false, error: error.message, statusCode: error.statusCode };
        }
        const t = await getTranslations("automationDashboard");
        return { success: false, error: t("errors.fetchDataEntryWardWise") || "Failed to fetch data entry ward-wise summary data", statusCode: 500 };
    }
}
