'use server';

import { cookies } from "next/headers";
import { getUserIdFromCookies } from "@/lib/utils/cookie";
import { 
    automationGetAssessmentGrid, 
    automationGetPendingAssessmentProps,
    FetchPendingAssessmentPropsParams,
    automationSendToApprove
} from "@/lib/api/automation-dashboard/assessment/assessmentgrid.service";
import { AssessmentGridItems, AssessmentGridType, PendingAssessmentItems, SendToApproveResponse } from "@/types/automation-dashboard/assessment/assessmentgrid.type";
import { 
    getZones, 
    getWards, 
    getPropertyTypeMaster, 
    getPropertyAssessmentStatus 
} from "@/lib/api/automation-dashboard/property-dashboard/property-subgrid-details.service";
import { 
    ZoneItem,
    WardItem,
    PropertyTypeMasterItem,
    PropertyAssessmentStatusItem
} from "@/types/automation-dashboard/property-dashboard/property-subgrid-details.type";
import { createLogger } from "@/lib/utils/server-logger";
import { ApiError } from "@/lib/utils/api";
import { getTranslations } from "next-intl/server";

const logger = createLogger("AssessmentActions");

type ActionResult<T> = {
    success: boolean;
    data?: T | null;
    error?: string;
    statusCode?: number;
};

/**
 * Server action to fetch the assessment grid data.
 * 
 * @param workflowStageId Optional ID to filter the grid data by workflow stage.
 * @param type Optional type to filter the grid data. Defaults to "Total".
 * @returns An object containing success status, data, and optional error message.
 */
export async function getAssessmentGridAction(
    workflowStageId?: string | number,
    type: AssessmentGridType = "Total",
    propertyTypeId?: string | number,
    propertyTypeCategoryId?: string | number
): Promise<ActionResult<AssessmentGridItems>> {
    try {
        logger.info("getAssessmentGridAction: Fetching assessment grid data", { workflowStageId, type, propertyTypeId, propertyTypeCategoryId });
        const data = await automationGetAssessmentGrid(workflowStageId, type, propertyTypeId, propertyTypeCategoryId);        
        return { success: true, data };
    } catch (error) {
        logger.error("Failed to fetch assessment grid data", { workflowStageId, type }, error);
        if (error instanceof ApiError) {
            return { success: false, error: error.message, statusCode: error.statusCode };
        }
        const t = await getTranslations("automationDashboard");
        return { success: false, error: t("errors.fetchAssessmentGrid") || "Failed to fetch assessment grid data", statusCode: 500 };
    }
}

/**
 * Server action to fetch pending assessment properties.
 * 
 * @param pageNumber Optional page number. Defaults to 1.
 * @param pageSize Optional page size. Defaults to 10.
 * @returns An object containing success status, data, and optional error message.
 */
export async function getPendingAssessmentPropsAction(
    params: FetchPendingAssessmentPropsParams = { pageNumber: 1, pageSize: 10 }
): Promise<ActionResult<PendingAssessmentItems>> {
    try {
        logger.info("getPendingAssessmentPropsAction: Fetching pending assessment properties", params as unknown as Record<string, string | number | boolean>);
        const data = await automationGetPendingAssessmentProps(params);
        return { success: true, data };
    } catch (error) {
        logger.error("Failed to fetch pending assessment properties", params as unknown as Record<string, string | number | boolean>, error);
        if (error instanceof ApiError) {
            return { success: false, error: error.message, statusCode: error.statusCode };
        }
        const t = await getTranslations("automationDashboard");        
         return { success: false, error: t("errors.fetchPendingAssessmentProps") || "Failed to fetch pending assessment properties", statusCode: 500 };
    }
}

/**
 * Server action to fetch zones.
 * 
 * @param pageNumber Optional page number. Defaults to 1.
 * @param pageSize Optional page size. Defaults to 10.
 * @returns An object containing success status, data, and optional error message.
 */
export async function getZonesAction(
    pageNumber: number = 1,
    pageSize: number = 10
): Promise<ActionResult<ZoneItem[]>> {
    try {
        logger.info("getZonesAction: Fetching zones", { pageNumber, pageSize });
        const data = await getZones(pageNumber, pageSize);
        return { success: true, data };
    } catch (error) {
        logger.error("Failed to fetch zones", { pageNumber, pageSize }, error);
        if (error instanceof ApiError) {
            return { success: false, error: error.message, statusCode: error.statusCode };
        }
        const t = await getTranslations("automationDashboard");
        return { success: false, error: t("errors.fetchZones") || "Failed to fetch zones", statusCode: 500 };
    }
}

export async function getWardsAction(
    pageNumber: number = -1,
    pageSize: number = 10,
    zoneId?: string | number
): Promise<ActionResult<WardItem[]>> {
    try {
        logger.info("getWardsAction: Fetching wards", { pageNumber, pageSize, zoneId });
        const data = await getWards(pageNumber, pageSize, zoneId);
        return { success: true, data };
    } catch (error) {
        logger.error("Failed to fetch wards", { pageNumber, pageSize, zoneId }, error);
        if (error instanceof ApiError) {
            return { success: false, error: error.message, statusCode: error.statusCode };
        }
        const t = await getTranslations("automationDashboard");
        return { success: false, error: t("errors.fetchWards") || "Failed to fetch wards", statusCode: 500 };
    }
}

export async function getPropertyTypeMasterAction(
    pageNumber: number = -1,
    pageSize: number = 10
): Promise<ActionResult<PropertyTypeMasterItem[]>> {
    try {
        logger.info("getPropertyTypeMasterAction: Fetching property types", { pageNumber, pageSize });
        const data = await getPropertyTypeMaster(pageNumber, pageSize);
        return { success: true, data };
    } catch (error) {
        logger.error("Failed to fetch property types", { pageNumber, pageSize }, error);
        if (error instanceof ApiError) {
            return { success: false, error: error.message, statusCode: error.statusCode };
        }
        const t = await getTranslations("automationDashboard");
        return { success: false, error: t("errors.fetchPropertyTypeMaster") || "Failed to fetch property types", statusCode: 500 };
    }
}

export async function getPropertyAssessmentStatusAction(
    pageNumber: number = 1,
    pageSize: number = -1
): Promise<ActionResult<PropertyAssessmentStatusItem[]>> {
    try {
        logger.info("getPropertyAssessmentStatusAction: Fetching assessment status", { pageNumber, pageSize });
        const data = await getPropertyAssessmentStatus(pageNumber, pageSize);
        return { success: true, data };
    } catch (error) {
        logger.error("Failed to fetch assessment status", { pageNumber, pageSize }, error);
        if (error instanceof ApiError) {
            return { success: false, error: error.message, statusCode: error.statusCode };
        }
        const t = await getTranslations("automationDashboard");
        return { success: false, error: t("errors.fetchPropertyAssessmentStatus") || "Failed to fetch assessment status", statusCode: 500 };
    }
}

export async function sendToApproveAction(
    propertyIds: number[]
): Promise<ActionResult<SendToApproveResponse>> {
    try {
        const cookieStore = await cookies();
        const userId = getUserIdFromCookies(cookieStore);              
        if (!userId) {
            return { success: false, error: "User not authenticated", statusCode: 401 };
        }       
        logger.info("sendToApproveAction: Sending for approval", { propertyIds, userId });       
        const data = await automationSendToApprove({ propertyIds, userId });
        return { success: true, data };
    } catch (error) {
        logger.error("Failed to send for approval", { propertyIds }, error);
        if (error instanceof ApiError) {
            return { success: false, error: error.message, statusCode: error.statusCode };
        }
        const t = await getTranslations("automationDashboard");
        return { success: false, error: t("errors.sendToApprove") || "Failed to send for approval", statusCode: 500 };
    }
}