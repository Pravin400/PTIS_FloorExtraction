import { validateForm, propertyValidations } from '@/lib/utils/validation';
import { translateDevanagariDigits } from '../input-sanitization';

/**
 * Validates the property basic details form data.
 * 
 * @param formData - The form data to validate
 * @param categoryId - The selected category ID
 * @param t - Translation function
 * @returns Object containing validation errors
 */
export const validatePropertyForm = (
    formData: FormData,
    categoryId: number | null,
    t: (key: string, values?: Record<string, string | number | Date>) => string
) => {
    const rawResToilets = formData.get("noOfResidentialToilets");
    const rawCommToilets = formData.get("noOfCommercialToilets");

    const validationData = {
        categoryId,
        taxZoneId: formData.get("taxZoneId"),
        noOfResidentialToilets: typeof rawResToilets === "string" ? translateDevanagariDigits(rawResToilets) : rawResToilets,
        noOfCommercialToilets: typeof rawCommToilets === "string" ? translateDevanagariDigits(rawCommToilets) : rawCommToilets,
    };

    return validateForm(validationData, {
        categoryId: propertyValidations.required("category", t),
        taxZoneId: propertyValidations.required("taxZoneNo", t),
        noOfResidentialToilets: propertyValidations.number("residentialToilets", t),
        noOfCommercialToilets: propertyValidations.number("commercialToilets", t),
    });
};
