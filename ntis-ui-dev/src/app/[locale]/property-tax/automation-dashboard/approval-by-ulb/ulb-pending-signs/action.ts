'use server';

import { getPendingSigns, updatePropertySign } from "@/lib/api/automation-dashboard/approval-by-ulb/approval-by-ulb-pending-signs.service";
import { PendingSignPagination, UpdatePropertySignPayload } from "@/types/automation-dashboard/approval-by-ulb/approval-by-ulb.type";
import { createLogger } from "@/lib/utils/server-logger";
import { ApiError } from "@/lib/utils/api";
import { getTranslations } from "next-intl/server";

const logger = createLogger("UlbPendingSignsActions");

type ActionResult<T> = {
    success: boolean;
    data?: T | null;
    error?: string;
    statusCode?: number;
};

export async function getPendingSignsAction(
    pageNumber: number = 1,
    pageSize: number = 10,
    userId?: number,
    searchTerm?: string,
    sortBy?: string,
    sortOrder?: string,
    filterLogic?: number
): Promise<ActionResult<PendingSignPagination>> {
    try {
        logger.info("getPendingSignsAction: Fetching pending signs", { pageNumber, pageSize, userId, searchTerm, sortBy, sortOrder, filterLogic });
        const data = await getPendingSigns(pageNumber, pageSize, userId, searchTerm, sortBy, sortOrder, filterLogic);
        return { success: true, data };
    } catch (error) {
        logger.error("Failed to fetch pending signs", { pageNumber, pageSize, userId }, error);
        if (error instanceof ApiError) {
            return { success: false, error: error.message, statusCode: error.statusCode };
        }
        const t = await getTranslations("automationDashboard");
        return { success: false, error: t("errors.fetchPendingSigns") || "Failed to fetch pending signs", statusCode: 500 };
    }
}

export async function updatePropertySignAction(
    payload: UpdatePropertySignPayload
): Promise<ActionResult<boolean>> {
    try {
        logger.info("updatePropertySignAction: Updating property sign", { payload });
        const data = await updatePropertySign(payload);
        return { success: true, data };
    } catch (error) {
        logger.error("Failed to update property sign", { payload }, error);
        if (error instanceof ApiError) {
            return { success: false, error: error.message, statusCode: error.statusCode };
        }
        const t = await getTranslations("automationDashboard");
        return { success: false, error: t("errors.updatePropertySign") || "Failed to update property sign", statusCode: 500 };
    }
}
