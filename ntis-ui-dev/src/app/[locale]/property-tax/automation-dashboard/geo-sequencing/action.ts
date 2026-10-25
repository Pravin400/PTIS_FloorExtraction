'use server';

import { automationGetGeoSequencingGrid, automationGetGeoSequencingWardWiseSummary } from "@/lib/api/automation-dashboard/geo-sequencing/geo-sequencing.service";
import { GeoSequencingItems, GeoSequencingWardWiseItems } from "@/types/automation-dashboard/geo-sequencing/geo-sequencing.type";
import { createLogger } from "@/lib/utils/server-logger";
import { ApiError } from "@/lib/utils/api";
import { getTranslations } from "next-intl/server";

const logger = createLogger("GeoSequencingActions");

type ActionResult<T> = {
    success: boolean;
    data?: T | null;
    error?: string;
    statusCode?: number;
};

/**
 * Server action to fetch the geo-sequencing grid data.
 * 
 * @param workflowStageId Optional ID to filter the grid data by workflow stage.
 * @returns An object containing success status, data, and optional error message.
 */
export async function getGeoSequencingGridAction(
    workflowStageId?: string | number,
    propertyTypeId?: string | null,
    propertyTypeCategoryId?: string | null
): Promise<ActionResult<GeoSequencingItems>> {
    try {
        logger.info("getGeoSequencingGridAction: Fetching geo-sequencing grid data", { workflowStageId, propertyTypeId, propertyTypeCategoryId });
        const data = await automationGetGeoSequencingGrid(workflowStageId, propertyTypeId, propertyTypeCategoryId);
        return { success: true, data };
    } catch (error) {
        logger.error("Failed to fetch geo-sequencing grid data", { workflowStageId }, error);
        if (error instanceof ApiError) {
            return { success: false, error: error.message, statusCode: error.statusCode };
        }
        const t = await getTranslations("automationDashboard");
        return { success: false, error: t("errors.fetchGeoSequencingGrid") || "Failed to fetch geo-sequencing grid data", statusCode: 500 };
    }
}

export async function getWardWiseSummaryAction(
    zoneId: string | number,
    workflowStageId?: string | number,
    pageNumber: number = 1,
    pageSize: number = 10,
    propertyTypeId?: string | null,
    propertyTypeCategoryId?: string | null
): Promise<ActionResult<GeoSequencingWardWiseItems>> {
    try {
        logger.info("getWardWiseSummaryAction: Fetching ward-wise summary", { zoneId, workflowStageId, pageNumber, pageSize, propertyTypeId, propertyTypeCategoryId });
        const data = await automationGetGeoSequencingWardWiseSummary(zoneId, workflowStageId, pageNumber, pageSize, propertyTypeId, propertyTypeCategoryId);
        return { success: true, data };
    } catch (error) {
        logger.error("Failed to fetch ward-wise summary", { zoneId, workflowStageId, pageNumber, pageSize }, error);
        if (error instanceof ApiError) {
            return { success: false, error: error.message, statusCode: error.statusCode };
        }
        const t = await getTranslations("automationDashboard");
        return { success: false, error: t("errors.fetchWardWiseSummary") || "Failed to fetch ward-wise summary", statusCode: 500 };
    }
}
