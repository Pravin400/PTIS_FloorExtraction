"use server";
//  Action to fetch property old details

import { getPropertyOldDetails, updatePropertyOldDetails } from "@/lib/api/property-old-details.service";
import { PropertyOldDetailsApiItem } from "@/types/OldDetails/property-old-details.types";
import { revalidatePath } from "next/cache";
import { ActionResult } from "@/types/common.types";
import { getTranslations } from "next-intl/server";
import { oldDetailsValidations } from "@/lib/utils/validation-schemas";
import { hasErrors } from "@/lib/utils/validation-helpers";

export async function getPropertyOldDetailsAction(propertyId: number): Promise<ActionResult<PropertyOldDetailsApiItem | null>> {
  try {
    const data = await getPropertyOldDetails(propertyId);
    return {
      success: true,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch property old details'
    };
  }
}

export async function updatePropertyOldDetailsAction(
  propertyId: number, 
  data: Partial<PropertyOldDetailsApiItem>, 
  locale: string
): Promise<ActionResult<PropertyOldDetailsApiItem | null>> {
  const t = await getTranslations({ locale, namespace: 'quickDataEntry' });

  try {
    // 1. Validate propertyId
    if (!propertyId || propertyId <= 0) {
      return {
        success: false,
        error: t('property.validation.propertyIdRequired')
      };
    }

    // 2. Validate data payload
    const validationErrors = oldDetailsValidations.validateOldPropertyDetails(data, t);
    if (hasErrors(validationErrors)) {
      return {
        success: false,
        error: t('oldDetails.common.validationError')
      };
    }

    // 3. Sanitize data
    const sanitizedData = oldDetailsValidations.sanitizeOldPropertyDetails(data);

    // 4. Update via service
    const result = await updatePropertyOldDetails(propertyId, sanitizedData);
    revalidatePath(`/${locale}/property-tax/ptis/QuickDataEntry/${propertyId}/OldDetails/old-taxation`);
    
    return {
      success: true,
      data: result.items
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update property old details'
    };
  }
}