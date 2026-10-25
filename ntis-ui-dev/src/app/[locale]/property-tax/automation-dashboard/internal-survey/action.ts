'use server';

import { 
    automationGetInternalSurveyGrid,
    automationGetInternalSurveyWardWiseSummary 
} from "@/lib/api/automation-dashboard/internal-surveygrid/Internal-surveygrid.service";
import { 
    InternalSurveyGridItems,
    InternalSurveyWardWiseItems
} from "@/types/automation-dashboard/internal-surveygrid/internal-surveygrid.type";
import { createLogger } from "@/lib/utils/server-logger";
import { ApiError } from "@/lib/utils/api";
import { getTranslations } from "next-intl/server";

const logger = createLogger("InternalSurveyActions");

type ActionResult<T> = {
    success: boolean;
    data?: T | null;
    error?: string;
    statusCode?: number;
};

/**
 * Server action to fetch the internal survey grid data.
 * 
 * @param workflowStageId Optional ID to filter the grid data by workflow stage.
 * @returns An object containing success status, data, and optional error message.
 */
export async function getInternalSurveyGridAction(
    workflowStageId?: string | number,
    propertyTypeId?: string | null,
    propertyTypeCategoryId?: string | null
): Promise<ActionResult<InternalSurveyGridItems>> {
    try {
        logger.info("getInternalSurveyGridAction: Fetching internal survey grid data", { workflowStageId, propertyTypeId, propertyTypeCategoryId });
        const data = await automationGetInternalSurveyGrid(workflowStageId, propertyTypeId, propertyTypeCategoryId);
        return { success: true, data };
    } catch (error) {
        logger.error("Failed to fetch internal survey grid data", { workflowStageId }, error);
        if (error instanceof ApiError) {
            return { success: false, error: error.message, statusCode: error.statusCode };
        }
        const t = await getTranslations("automationDashboard");
        return { success: false, error: t("errors.fetchInternalSurveyGrid") || "Failed to fetch internal survey grid data", statusCode: 500 };
    }
}

/**
 * Server action to fetch the internal survey ward-wise summary data.
 * 
 * @param zoneId The ID of the zone to fetch the summary for.
 * @param workflowStageId Optional ID to filter the data by workflow stage.
 * @returns An object containing success status, data, and optional error message.
 */
export async function getInternalSurveyWardWiseSummaryAction(
    zoneId: string | number,
    workflowStageId?: string | number,
    pageNumber: number = 1,
    pageSize: number = 10,
    propertyTypeId?: string | null,
    propertyTypeCategoryId?: string | null
): Promise<ActionResult<InternalSurveyWardWiseItems>> {
    try {
        logger.info("getInternalSurveyWardWiseSummaryAction: Fetching ward-wise summary", { zoneId, workflowStageId, pageNumber, pageSize, propertyTypeId, propertyTypeCategoryId });
        const data = await automationGetInternalSurveyWardWiseSummary(zoneId, workflowStageId, pageNumber, pageSize, propertyTypeId, propertyTypeCategoryId);
        return { success: true, data };
    } catch (error) {
        logger.error("Failed to fetch internal survey ward-wise summary data", { zoneId, workflowStageId, pageNumber, pageSize }, error);
        if (error instanceof ApiError) {
            return { success: false, error: error.message, statusCode: error.statusCode };
        }
        const t = await getTranslations("automationDashboard");       
        return { success: false, error: t("errors.fetchInternalSurveyWardWiseSummary") || "Failed to fetch internal survey ward-wise summary data", statusCode: 500 };
    }
}
