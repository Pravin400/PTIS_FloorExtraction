"use server";

import {
    getFloors,
    getSubFloors,
    getConstructionTypes,
    getTypeOfUses,
    getSubTypeOfUses,    
    saveOldFloorDetails,
    updateOldFloorDetails,
    deleteOldFloorDetails,
    getOldFloorDetailsForFloorInformation
} from "@/lib/api/old-details-floor-information.service";
import { ActionResult } from "@/types/common.types";
import {
    ConstructionType,
    Floor,
    SubFloor,
    SubTypeOfUse,
    TypeOfUse,
    OldFloorDetail,
    OldFloorDetailsResponse,
    SaveOldFloorDetailPayload
} from "@/types/OldDetails/property-old-details.types";
import { revalidatePath } from "next/cache";

import { getTranslations } from "next-intl/server";
import { oldDetailsValidations } from "@/lib/utils/validation-schemas";
import { hasErrors } from "@/lib/utils/validation-helpers";

//  Common error message helper for actions
function getActionErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
        return error.message;
    }
    return 'Something went wrong. Please try again.';
}

export async function getFloorsAction(
    pageNumber: number,
    pageSize: number,
    searchTerm?: string
): Promise<ActionResult<Floor[]>> {
    try {
        const response = await getFloors(pageNumber, pageSize, searchTerm);
        return {
            success: true,
            data: response.items || []
        };
    } catch (error) {
        return {
            success: false,
            error: getActionErrorMessage(error)
        };
    }
}

export async function getSubFloorsAction(
     pageNumber: number,
    pageSize: number,
    searchTerm?: string
): Promise<ActionResult<SubFloor[]>> {
    try {
        const response = await getSubFloors(pageNumber, pageSize, searchTerm);
        return {
            success: true,
            data: response.items || []
        };
    } catch (error) {
        return {
            success: false,
            error: getActionErrorMessage(error)
        };
    }
}

//  Fetches all Construction Types.
export async function getConstructionTypesAction(
    pageNumber: number,
    pageSize: number,
    searchTerm?: string
): Promise<ActionResult<ConstructionType[]>> {
    try {
        const response = await getConstructionTypes(pageNumber, pageSize, searchTerm);
        return {
            success: true,
            data: response.items || []
        };
    } catch (error) {
        return {
            success: false,
            error: getActionErrorMessage(error)
        };
    }
}

// Fetches all Type of Uses.
export async function getTypeOfUsesAction(
    pageNumber: number,
    pageSize: number,
    searchTerm?: string
): Promise<ActionResult<TypeOfUse[]>> {
    try {
        const response = await getTypeOfUses(pageNumber, pageSize, searchTerm);
        return {
            success: true,
            data: response.items || []
        };
    } catch (error) {
        return {
            success: false,
            error: getActionErrorMessage(error)
        };
    }
}

/**
 * Fetches Sub Type of Use list based on the selected Type of Use ID.
 * @param typeOfUseId The ID of the selected Type of Use
 */
export async function getSubTypeOfUsesAction(
    typeOfUseId: number,
    pageNumber: number,
    pageSize: number,
    searchTerm?: string): Promise<ActionResult<SubTypeOfUse[]>> {
    try {
        const response = await getSubTypeOfUses(typeOfUseId,pageNumber, pageSize, searchTerm);
        return {
            success: true,
            data: response.items || []
        };
    } catch (error) {
        return {
            success: false,
            error: getActionErrorMessage(error)
        };
    }
}

/**
 * Fetches existing Old Floor Details for a property with pagination.
 * @param propertyId The ID of the property
 * @param pageNumber Current page number (default: 1)
 * @param pageSize Number of items per page (default: 10)
 */
export async function getOldFloorDetailsAction(
    propertyId: number,
    pageNumber: number = 1,
    pageSize: number = 10,
    searchTerm?: string,
    sortBy?: string,
    sortOrder?: string
): Promise<ActionResult<{
    items: OldFloorDetail[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
}>> {
    try {
        const response = await getOldFloorDetailsForFloorInformation(propertyId, pageNumber, pageSize, searchTerm, sortBy, sortOrder);
        
        if (!response.items) {
            return {
                success: true,
                data: {
                    items: [],
                    totalCount: 0,
                    pageNumber,
                    pageSize,
                    totalPages: 0,
                    hasPrevious: false,
                    hasNext: false,
                }
            };
        }
        
        return {
            success: true,
            data: response.items
        };
    } catch (error) {
        return {
            success: false,
            error: getActionErrorMessage(error)
        };
    }
}

/**
 * Saves (Create or Update) Old Floor Details.
 * @param propertyId The ID of the property
 * @param data The floor detail data
 * @param locale The current locale for revalidation
 */
export async function saveOldFloorDetailsAction(
    propertyId: number, 
    data: SaveOldFloorDetailPayload, 
    locale: string
): Promise<ActionResult<OldFloorDetailsResponse>> {
    const t = await getTranslations({ locale, namespace: 'quickDataEntry' });

    try {
        // 1. Validate propertyId
        if (!propertyId || propertyId <= 0) {
            return {
                success: false,
                error: t('property.validation.propertyIdRequired')
            };
        }

        // 2. Validate payload
        const validationErrors = oldDetailsValidations.validateOldFloorDetails(data, t);
        if (hasErrors(validationErrors)) {
            return {
                success: false,
                error: t('oldDetails.common.validationError')
            };
        }

        // 3. Sanitize data
        const sanitizedData = oldDetailsValidations.sanitizeOldFloorDetails(data);

        // 4. Save
        const response = await saveOldFloorDetails(propertyId, sanitizedData);
        
        revalidatePath(`/${locale}/property-tax/ptis/QuickDataEntry/${propertyId}/OldDetails/floor-information`);
        return {
            success: true,
            data: response
        };
    } catch (error) {
        return {
            success: false,
            error: getActionErrorMessage(error)
        };
    }
}

/**
 * Updates existing Old Floor Details.
 * @param propertyId The ID of the property
 * @param floorDetailId The ID of the floor detail to update
 * @param data The updated floor detail data
 * @param locale The current locale for revalidation
 */
export async function updateOldFloorDetailsAction(
    propertyId: number,
    floorDetailId: number,
    data: SaveOldFloorDetailPayload,
    locale: string
): Promise<ActionResult<OldFloorDetailsResponse>> {
    const t = await getTranslations({ locale, namespace: 'quickDataEntry' });

    try {
        // 1. Validate IDs
        if (!propertyId || propertyId <= 0 || !floorDetailId || floorDetailId <= 0) {
            return {
                success: false,
                error: t('property.validation.invalidIds')
            };
        }

        // 2. Validate payload
        const validationErrors = oldDetailsValidations.validateOldFloorDetails(data, t);
        if (hasErrors(validationErrors)) {
            return {
                success: false,
                error: t('oldDetails.common.validationError')
            };
        }

        // 3. Sanitize data
        const sanitizedData = oldDetailsValidations.sanitizeOldFloorDetails(data);

        // 4. Update
        const response = await updateOldFloorDetails(propertyId, floorDetailId, sanitizedData);
        
        revalidatePath(`/${locale}/property-tax/ptis/QuickDataEntry/${propertyId}/OldDetails/floor-information`);
        return {
            success: true,
            data: response
        };
    } catch (error) {
        return {
            success: false,
            error: getActionErrorMessage(error)
        };
    }
}

/**
 * Deletes existing Old Floor Details.
 * @param propertyId The ID of the property
 * @param floorDetailId The ID of the floor detail to delete
 * @param locale The current locale for revalidation
 */
export async function deleteOldFloorDetailsAction(
    propertyId: number,
    floorDetailId: number,
    locale: string
): Promise<ActionResult<void>> {
    try {
        await deleteOldFloorDetails(propertyId, floorDetailId);
        
        // ✅ Revalidate the floor information path to remove the deleted record from UI
        revalidatePath(`/${locale}/property-tax/ptis/QuickDataEntry/${propertyId}/OldDetails/floor-information`);
        return {
            success: true,
            data: undefined
        };
    } catch (error) {
        return {
            success: false,
            error: getActionErrorMessage(error)
        };
    }
}
