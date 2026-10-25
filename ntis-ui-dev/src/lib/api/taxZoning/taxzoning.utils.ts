import { taxZoningSchema } from "@/lib/validations/taxzoning.schema";
import { ApiError, normalizePagedResponse } from "@/lib/utils/api";
import { getTranslations } from "next-intl/server";
import { TaxZoningFormModel } from "@/types/taxzoning.types";

export { normalizePagedResponse };

/**
 * Maps tax zoning form data to API payload.
 * @param data TaxZoningFormModel
 * @returns Cleaned payload for API
 */
export function mapTaxZoningPayload(data: TaxZoningFormModel) {
  return {
    taxZoneId: data.taxZoneId,
    wardId: data.wardId,
    propertyNo: data.propertyNo?.trim() || "",
    fromProperty: data.fromProperty?.trim() || "",
    toProperty: data.toProperty?.trim() || "",
    propertyId: data.propertyId ?? 0,
    isActive: data.isActive ?? true,
    ownerID: data.ownerID ?? 0,
    updatedBy: data.updatedBy ?? 1,
  };
}

/**
 * Validates tax zoning data using Zod schema.
 * Throws ApiError with localized message if validation fails.
 * @param data Data to validate
 */
export async function validateTaxZoning(data: unknown): Promise<void> {
  const result = taxZoningSchema.safeParse(data);
  
  if (!result.success) {
    const t = await getTranslations("taxZoning");
    // Get the first error message key
    const firstError = result.error.issues[0];
    const messageKey = firstError.message; // e.g., "taxZoneRequired"
    
    throw new ApiError(
      400, 
      t(`messages.${messageKey}`), 
      "Validation"
    );
  }
}
