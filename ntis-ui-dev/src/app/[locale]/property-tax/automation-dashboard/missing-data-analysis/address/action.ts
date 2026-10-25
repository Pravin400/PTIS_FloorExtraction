'use server';

import { automationGetMissingAddress } from "@/lib/api/automation-dashboard/missing-data-analysis/address/missing-address.service";
import { MissingAddressItem } from "@/types/automation-dashboard/missing-data-analysis/address/missing-address.type";
import { createLogger } from "@/lib/utils/server-logger";
import { ApiError } from "@/lib/utils/api";
import { getTranslations } from "next-intl/server";

const logger = createLogger("MissingAddressActions");

type ActionResult<T> = {
    success: boolean;
    data?: T | null;
    error?: string;
    statusCode?: number;
};

/**
 * Server action to fetch the missing address analysis data.
 * 
 * @param zoneNo Optional zone number to filter by.
 * @returns An object containing success status, data, and optional error message.
 */
export async function getMissingAddressAction(
    zoneNo?: string | null
): Promise<ActionResult<MissingAddressItem>> {
    try {
        logger.info("getMissingAddressAction: Fetching missing address data", { zoneNo });
        const data = await automationGetMissingAddress(zoneNo);
        return { success: true, data };
    } catch (error) {
        logger.error("Failed to fetch missing address data", { zoneNo }, error);
        if (error instanceof ApiError) {
            return { success: false, error: error.message, statusCode: error.statusCode };
        }
        const t = await getTranslations("automationDashboard");
        return { success: false, error: t("errors.fetchMissingAddress"), statusCode: 500 };
    }
}
