import {
    automationgetMainCards,
    automationGetWorkflowCards
} from "@/lib/api/automation-dashboard/automation-maincard.service";
import {
    MainCardsData,
    WorkflowCardData
} from "@/types/automation-dashboard/automation-maincard/automation-maincart.type";
import { createLogger } from "@/lib/utils/server-logger";
import { ApiError } from "@/lib/utils/api";
import { getTranslations } from "next-intl/server";

const logger = createLogger("AutomationMaincardActions");

type ActionResult<T> = {
    success: boolean;
    data?: T | null;
    error?: string;
    statusCode?: number;
};

/**
 * Server action to fetch the main cards data for the automation dashboard.
 * 
 * @param workflowStageId Optional ID to filter the main cards data by workflow stage.
 * @returns An object containing success status, data, and optional error message.
 */
export async function getAutomationMainCardsAction(): Promise<ActionResult<MainCardsData>> {
    try {
        logger.info("getAutomationMainCardsAction: Fetching automation main cards");
        const data = await automationgetMainCards();
        return { success: true, data };
    } catch (error) {
        logger.error("Failed to fetch automation main cards", {}, error);
        if (error instanceof ApiError) {
            return { success: false, error: error.message, statusCode: error.statusCode };
        }
        const t = await getTranslations("automationDashboard");
        return { success: false, error: t("errors.fetchMainCards") || "Failed to fetch automation main cards", statusCode: 500 };
    }
}

/**
 * Server action to fetch the workflow cards data for the automation dashboard.
 * 
 * @param workflowStageId Optional ID to filter the workflow cards data by workflow stage.
 * @returns An object containing success status, data (array of workflow cards), and optional error message.
 */
export async function getAutomationWorkflowCardsAction(): Promise<ActionResult<WorkflowCardData[]>> {
    try {
        logger.info("getAutomationWorkflowCardsAction: Fetching automation workflow cards");
        const data = await automationGetWorkflowCards();
        return { success: true, data };
    } catch (error) {
        logger.error("Failed to fetch automation workflow cards", {}, error);
        if (error instanceof ApiError) {
            return { success: false, error: error.message, statusCode: error.statusCode };
        }
        const t = await getTranslations("automationDashboard");
        return { success: false, error: t("errors.fetchWorkflowCards") || "Failed to fetch automation workflow cards", statusCode: 500 };
    }
}