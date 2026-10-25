'use server';

import { automationGetPropertySubGridDetails, getWards, getPropertyTypeMaster, getPropertyAssessmentStatus } from "@/lib/api/automation-dashboard/property-dashboard/property-subgrid-details.service";
import { PropertySubGridDetailsItems, WardItem, PropertyTypeMasterItem, PropertyAssessmentStatusItem } from "@/types/automation-dashboard/property-dashboard/property-subgrid-details.type";
import { automationGetWardWisePropertySubGridDetails } from "@/lib/api/automation-dashboard/ward-wise-property-dashboard/ward-wise-property-subgrid-details.service";
import { WardWisePropertySubGridDetailsItems } from "@/types/automation-dashboard/ward-wise-property-dashboard/ward-wise-property-subgrid-details.type";
import { createLogger } from "@/lib/utils/server-logger";
import { ApiError } from "@/lib/utils/api";
import { getTranslations } from "next-intl/server";

const logger = createLogger("PropertyDetailsActions");

type ActionResult<T> = {
    success: boolean;
    data?: T | null;
    error?: string;
    statusCode?: number;
};

/**
 * Server action to fetch the wards.
 * 
 * @param pageNumber The page number.
 * @param pageSize The page size.
 * @param zoneId Optional zone ID filter.
 * @returns An object containing success status, data, and optional error message.
 */
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
        logger.error("Failed to fetch wards", { zoneId }, error);
        if (error instanceof ApiError) {
            return { success: false, error: error.message, statusCode: error.statusCode };
        }
        const t = await getTranslations("automationDashboard");
        return { success: false, error: t("errors.fetchWards") || "Failed to fetch wards", statusCode: 500 };
    }
}

/**
 * Server action to fetch property type master details.
 * 
 * @param pageNumber The page number.
 * @param pageSize The page size.
 * @returns An object containing success status, data, and optional error message.
 */
export async function getPropertyTypeMasterAction(
    pageNumber: number = -1,
    pageSize: number = 10
): Promise<ActionResult<PropertyTypeMasterItem[]>> {
    try {
        logger.info("getPropertyTypeMasterAction: Fetching property type master details", { pageNumber, pageSize });
        const data = await getPropertyTypeMaster(pageNumber, pageSize);
        return { success: true, data };
    } catch (error) {
        logger.error("Failed to fetch property type master details", {}, error);
        if (error instanceof ApiError) {
            return { success: false, error: error.message, statusCode: error.statusCode };
        }
        const t = await getTranslations("automationDashboard");
        return { success: false, error: t("errors.fetchPropertyTypeMaster") || "Failed to fetch property type master details", statusCode: 500 };
    }
}

/**
 * Server action to fetch the property subgrid details.
 * 
 * @param zoneId The zone ID.
 * @param workflowStageId The workflow stage ID.
 * @param pageNumber The page number.
 * @param pageSize The page size.
 * @returns An object containing success status, data, and optional error message.
 */
export async function getGeoSequencingPropertyDetailsAction(
    zoneId: string | number,
    workflowStageId: string | number,
    pageNumber: number = 1,
    pageSize: number = 10,
    wardId?: string | number,
    propertyTypeCategoryId?: string | number,
    propertyTypeId?: string | number,
    assessmentTypeId?: string | number,
    Search?:string,
    PropertyNo?:string,
    sortBy?: string,
    sortOrder?: string,
    structure?: boolean,
    unit?: boolean,
    pendingStructure?: boolean,
    pendingUnit?: boolean,
    completedStructure?: boolean,
    completedUnit?: boolean
): Promise<ActionResult<PropertySubGridDetailsItems>> {
    try {
        logger.info("getGeoSequencingPropertyDetailsAction: Fetching property details", { zoneId, workflowStageId, pageNumber, pageSize });

        const data = await automationGetPropertySubGridDetails(
            zoneId,
            workflowStageId,
            pageNumber,
            pageSize,
            wardId,
            propertyTypeCategoryId,
            propertyTypeId,
            assessmentTypeId,
            Search,
            PropertyNo,
            sortBy,
            sortOrder,
            structure,
            unit,
            pendingStructure,
            pendingUnit,
            completedStructure,
            completedUnit
        );
        return { success: true, data };
    } catch (error) {
        logger.error("Failed to fetch property subgrid details", { zoneId, workflowStageId }, error);
        if (error instanceof ApiError) {
            return { success: false, error: error.message, statusCode: error.statusCode };
        }
        const t = await getTranslations("automationDashboard");
        return { success: false, error: t("errors.fetchGeoSequencingPropertyDetails") || "Failed to fetch property subgrid details", statusCode: 500 };
    }
}

/**
 * Server action to fetch the ward-wise property subgrid details.
 * 
 * @param zoneId The zone ID.
 * @param workflowStageId The workflow stage ID.
 * @param pageNumber The page number.
 * @param pageSize The page size.
 * @returns An object containing success status, data, and optional error message.
 */
export async function getWardWisePropertySubGridDetailsAction(
    zoneId: string | number,
    workflowStageId: string | number,
    pageNumber: number = 1,
    pageSize: number = 10,
    wardId?: string | number,
    propertyTypeCategoryId?: string | number,
    propertyTypeId?: string | number,
    assessmentTypeId?: string | number,
    Search?: string,
    PropertyNo?: string,
    sortBy?: string,
    sortOrder?: string,
    structure?: boolean,
    unit?: boolean,
    pendingStructure?: boolean,
    pendingUnit?: boolean,
    completedStructure?: boolean,
    completedUnit?: boolean
): Promise<ActionResult<WardWisePropertySubGridDetailsItems>> {
    try {
        logger.info("getWardWisePropertySubGridDetailsAction: Fetching property details", { zoneId, workflowStageId, pageNumber, pageSize });
        const data = await automationGetWardWisePropertySubGridDetails(
            zoneId,
            workflowStageId,
            pageNumber,
            pageSize,
            wardId,
            propertyTypeCategoryId,
            propertyTypeId,
            assessmentTypeId,
            Search,
            PropertyNo,
            sortBy,
            sortOrder,
            structure,
            unit,
            pendingStructure,
            pendingUnit,
            completedStructure,
            completedUnit
        );
        return { success: true, data };
    } catch (error) {
        logger.error("Failed to fetch ward-wise property subgrid details", { zoneId, workflowStageId }, error);
        if (error instanceof ApiError) {
            return { success: false, error: error.message, statusCode: error.statusCode };
        }
        const t = await getTranslations("automationDashboard");
        return { success: false, error: t("errors.fetchGeoSequencingPropertyDetails") || "Failed to fetch property subgrid details", statusCode: 500 };
    }
}

/**
 * Server action to fetch property assessment status details.
 * 
 * @param pageNumber The page number.
 * @param pageSize The page size.
 * @returns An object containing success status, data, and optional error message.
 */
export async function getPropertyAssessmentStatusAction(
    pageNumber: number = 1,
    pageSize: number = -1
): Promise<ActionResult<PropertyAssessmentStatusItem[]>> {
    try {
        logger.info("getPropertyAssessmentStatusAction: Fetching property assessment status details", { pageNumber, pageSize });
        const data = await getPropertyAssessmentStatus(pageNumber, pageSize);
        return { success: true, data };
    } catch (error) {
        logger.error("Failed to fetch property assessment status details", {}, error);
        if (error instanceof ApiError) {
            return { success: false, error: error.message, statusCode: error.statusCode };
        }
        const t = await getTranslations("automationDashboard");
        return { success: false, error: t("errors.fetchPropertyAssessmentStatus") || "Failed to fetch property assessment status details", statusCode: 500 };
    }
}
