"use server"

import { getOldTaxesDetails, saveOldTaxesDetails, getYearMaster } from "@/lib/api/property-old-details.service";
import { OldTaxesDetails, YearMaster } from "@/types/OldDetails/property-old-details.types";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { oldDetailsValidations } from "@/lib/utils/validation-schemas";
import { hasErrors } from "@/lib/utils/validation-helpers";
import { ActionResult } from "@/types/common.types";

/**
 * Server Action to fetch old taxes details for a property.
 * @param propertyId The ID of the property.
 */
export async function getOldTaxesDetailsAction(propertyId: number): Promise<ActionResult<OldTaxesDetails | null>> {
  try {
    const response = await getOldTaxesDetails(propertyId);
    return {
      success: true,
      data: response.items
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch old taxes details";
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Server Action to save old taxes details for a property.
 * @param propertyId The ID of the property.
 * @param data The taxation breakdown data to save.
 * @param locale The current locale for revalidation.
 */
export async function saveOldTaxesDetailsAction(
  propertyId: number,
  data: OldTaxesDetails,
  locale: string
): Promise<ActionResult<OldTaxesDetails | null>> {
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
    const validationErrors = oldDetailsValidations.validateOldTaxesDetails(data, t);
    if (hasErrors(validationErrors)) {
      return {
        success: false,
        error: t('oldDetails.taxationBreakdown.error.unexpectedError')
      };
    }

    // 3. Sanitize data
    const sanitizedData = oldDetailsValidations.sanitizeOldTaxesDetails(data);

    // 4. Save
    const response = await saveOldTaxesDetails(propertyId, sanitizedData);

    revalidatePath(`/${locale}/property-tax/ptis/QuickDataEntry/${propertyId}/OldDetails/taxation-breakdown`);
    return {
      success: true,
      data: response.items
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save old taxes details"
    };
  }
}

/**
 * Server Action to fetch Year Master data.
 * @param pageNumber The page number.
 * @param pageSize The page size (-1 for all).
 */
export async function getYearMasterAction(
  pageNumber: number = 1,
  pageSize: number = -1
): Promise<ActionResult<YearMaster[]>> {
  try {
    const response = await getYearMaster(pageNumber, pageSize);
    return {
      success: true,
      data: response.items || []
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch year master data"
    };
  }
}


