"use server";

import { getRoomTypeOptions, getRoomTypeData } from "@/lib/api/ptis/floorSubmission/floor-lookup.service";
import { ActionResult } from "@/types/common.types";
import { RoomTypeResponse } from "@/types/room-details.types";

function getActionErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
        return error.message;
    }
    return 'Something went wrong while fetching room types.';
}

/**
 * Server action to fetch room type options for dropdowns
 */
export async function getRoomTypeOptionsAction(): Promise<ActionResult<string[]>> {
    try {
        const options = await getRoomTypeOptions();
        return { success: true, data: options };
    } catch (error) {
        return { success: false, error: getActionErrorMessage(error) };
    }
}

/**
 * Server action to fetch full room type objects for dropdowns with mapping support
 */
export async function getRoomTypesAction(): Promise<ActionResult<RoomTypeResponse[]>> {
    try {
        const data = await getRoomTypeData();
        return { success: true, data };
    } catch (error) {
        return { success: false, error: getActionErrorMessage(error) };
    }
}
