import { DiscountState, DiscountAttributeState } from "@/types/discount.types";
import { hasValidDocumentGuid } from "@/lib/validation/building/validation-rules";

export interface IncompleteDiscount {
    id: number;
    name: string;
    code: string;
}

export interface DiscountFieldErrors {
    value?: string;
    document?: string;
    remark?: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: Record<number, string>;
    fieldErrors: Record<number, DiscountFieldErrors>;
    incompleteDiscounts: IncompleteDiscount[];
}

const TEXT_PATTERN = /^[^<>]*$/;
const REMARK_PATTERN = /^[^<>]*$/;

/**
 * Validates the discount form state.
 * For every enabled discount attribute:
 * - Checks for document attachment (documentGuid or documentBindingId).
 * - Checks for required values depending on its dataType (INT, DECIMAL, VARCHAR, DATE).
 * - Implements basic length, whitespace, and special character checks.
 */
export const validateDiscountForm = (
    state: DiscountState,
    t: (key: string, params?: Record<string, string | number>) => string
): ValidationResult => {
    const errors: Record<number, string> = {};
    const fieldErrors: Record<number, DiscountFieldErrors> = {};
    const incompleteDiscounts: IncompleteDiscount[] = [];
    let isValid = true;

    Object.values(state).forEach((item: DiscountAttributeState) => {
        // If an item is inherited and not overridden, it is not part of this level's submission
        if (item.isInherited && !item.isOverridden) return;

        const isBitType = item.dataType?.toUpperCase() === "BIT";
        const isActive = isBitType ? item.bitValue === true : Boolean(item.enabled);

        // Safely check for pending data using `!= null && !== ""` so `undefined` does not pass
        const hasPendingNumeric =
            (item.intValue != null && item.intValue !== "" && String(item.intValue).trim() !== "" && Number(item.intValue) !== 0) ||
            (item.decimalValue != null && item.decimalValue !== "" && String(item.decimalValue).trim() !== "" && Number(item.decimalValue) !== 0);
        const hasPendingText =
            item.textValue != null && item.textValue !== "" && typeof item.textValue === "string" && item.textValue.trim() !== "";
        const hasPendingDate =
            item.dateValue != null && item.dateValue !== "" && typeof item.dateValue === "string" && item.dateValue.trim() !== "";
        const hasPendingFile = Boolean(item.pendingFile);

        const hasPendingData = hasPendingNumeric || hasPendingText || hasPendingDate || hasPendingFile;

        // Check parent status if this is a child attribute
        if (item.parentAttributeId) {
            const parent = state[item.parentAttributeId];
            const isParentBit = (parent?.dataType || "").toUpperCase() === "BIT";
            const isParentActive = parent ? (isParentBit ? parent.bitValue === true : Boolean(parent.enabled)) : false;

            // If parent is disabled, child should never block validation
            if (!isParentActive) return;

            // If parent is active, child is required if isRequiredWhenParentTrue is true or if child has entered data/enabled
            const isRequired = item.isRequiredWhenParentTrue === true;
            if (!isRequired && !isActive && !hasPendingData) return;
        } else {
            // Root attribute: skip validation if not active and has no pending data entered, or if it is an unchecked BIT attribute
            if (!isActive && !hasPendingData) return;
            if (isBitType && item.bitValue !== true) return;
        }

        const missingFields: string[] = [];
        const currentFieldErrors: DiscountFieldErrors = {};
        const displayName = item.socialAttributeName || t("discount.discountNumbered", { id: item.id }) || `Discount #${item.id}`;

        // 1. Validate based on data type
        const dataTypeUpper = (item.dataType || "").toUpperCase();

        if (dataTypeUpper === "INT") {
            const strVal = item.intValue !== null && item.intValue !== undefined ? String(item.intValue).trim() : "";
            if (strVal === "") {
                missingFields.push(t("discount.socialValidation.required", { fieldName: displayName }) || `${displayName} is required.`);
            } else {
                if (/\s/.test(strVal)) {
                    missingFields.push(t("common.validation.numberNoSpaces") || "Spaces are not allowed in numbers.");
                } else if (!/^-?\d+$/.test(strVal)) {
                    missingFields.push(t("discount.socialValidation.invalidInteger") || "Value must be a valid integer.");
                } else {
                    const val = Number(strVal);
                    const code = (item.socialAttributeCode || "").toUpperCase();
                    const isYear = code === "WATER_CONN_YEAR";
                    const isTree = code.includes("TREE") || code === "TREE_COUNT";
                    const isSolar = code.includes("SOLAR");
                    const digitsLimit = isYear ? 4 : isTree ? 6 : isSolar ? 4 : 3;

                    if (strVal.length > digitsLimit) {
                        missingFields.push(
                            code === "WATER_CONN_YEAR"
                                ? (t("discount.socialValidation.yearMaxDigits") || "Year cannot exceed 4 digits.")
                                : (t("discount.socialValidation.maxDigits", { digits: digitsLimit }) || `Value cannot exceed ${digitsLimit} digits.`)
                        );
                    } else if (val <= 0) {
                        missingFields.push(t("discount.socialValidation.countMin") || "Value must be at least 1.");
                    } else if (val > 2147483647) {
                        missingFields.push(t("discount.socialValidation.maxVal", { max: 2147483647 }) || "Value cannot exceed 2147483647.");
                    }

                    // Attribute-specific rules
                    if (item.socialAttributeCode === "GREEN_PROPERTY_STAR" && (val < 1 || val > 5)) {
                        missingFields.push(t("discount.socialValidation.ratingRange") || "Rating must be between 1 and 5.");
                    }
                    if (item.socialAttributeCode === "TREE_COUNT" && val > 100000) {
                        missingFields.push(t("discount.socialValidation.maxTree") || "Number of trees cannot exceed 100,000.");
                    }
                    if (item.socialAttributeCode === "BOREWELL_COUNT" && val > 50) {
                        missingFields.push(t("discount.socialValidation.maxBorewell") || "Number of borewells cannot exceed 50.");
                    }
                }
            }
        } else if (dataTypeUpper === "DECIMAL") {
            const strVal = item.decimalValue !== null && item.decimalValue !== undefined ? String(item.decimalValue).trim() : "";
            if (strVal === "") {
                missingFields.push(t("discount.socialValidation.required", { fieldName: displayName }) || `${displayName} is required.`);
            } else {
                const parts = strVal.split(".");
                const hasMoreThanTwoDecimals = parts[1] && parts[1].length > 2;

                if (/\s/.test(strVal)) {
                    missingFields.push(t("common.validation.numberNoSpaces") || "Spaces are not allowed in numbers.");
                } else if (!/^-?\d+(\.\d+)?$/.test(strVal)) {
                    missingFields.push(t("discount.socialValidation.invalidDecimal") || "Value must be a valid decimal number.");
                } else if (hasMoreThanTwoDecimals) {
                    missingFields.push(t("discount.socialValidation.maxTwoDecimals") || "Maximum 2 decimal places allowed.");
                } else {
                    const val = Number(strVal);
                    if (val <= 0) {
                        missingFields.push(t("discount.socialValidation.minVal", { min: 0.01 }) || "Value must be greater than zero.");
                    }

                    // Attribute-specific rules
                    if (item.socialAttributeCode === "GREEN_PROPERTY_STAR" && (val < 1 || val > 5)) {
                        missingFields.push(t("discount.socialValidation.ratingRange") || "Rating must be between 1 and 5.");
                    }
                    if (item.socialAttributeCode === "SOLAR_ELECTRIC_CAPACITY" && val > 100000) {
                        missingFields.push(t("discount.socialValidation.maxCapacity") || "Capacity cannot exceed 100,000.");
                    }
                }
            }
        } else if (dataTypeUpper === "VARCHAR") {
            const trimmedText = (item.textValue || "").trim();
            if (trimmedText === "") {
                missingFields.push(t("discount.socialValidation.required", { fieldName: displayName }) || `${displayName} is required.`);
            } else {
                if (trimmedText.length < 2) {
                    missingFields.push(t("discount.socialValidation.minTextLength") || "Value must be at least 2 characters long.");
                } else if (trimmedText.length > 100) {
                    missingFields.push(t("discount.socialValidation.maxTextLength") || "Value cannot exceed 100 characters.");
                }

                if (!TEXT_PATTERN.test(item.textValue || "")) {
                    missingFields.push(t("property.validation.invalidCharacters") || "Contains invalid characters.");
                }
            }
        } else if (dataTypeUpper === "DATE") {
            const strVal = (item.dateValue || "").trim();
            if (strVal === "") {
                missingFields.push(t("common.validation.dateRequired") || "Date is required.");
            } else {
                const dateVal = new Date(strVal);
                if (isNaN(dateVal.getTime())) {
                    missingFields.push(t("common.validation.invalidDate") || "Please enter a valid date.");
                } else {
                    const now = new Date();
                    now.setHours(23, 59, 59, 999);
                    if (dateVal > now) {
                        missingFields.push(t("building.errors.futureDate") || "Date cannot be in the future.");
                    }
                }
            }
        }

        if (missingFields.length > 0 && !currentFieldErrors.value) {
            currentFieldErrors.value = missingFields[0];
        }

        // 2. Validate document attachment (require valid guid, pendingFile, or fileName with bindingId)
        const isDocReq = item.isDocumentRequired === true;
        const hasBinding = Boolean(
            (item.documentBindingId != null && Number(item.documentBindingId) > 0) ||
            (item.photoBindingId != null && Number(item.photoBindingId) > 0)
        );
        const hasValidDocument = Boolean(
            (item.pendingFile && !item.isUploading) ||
            hasValidDocumentGuid(item.documentGuid) ||
            hasValidDocumentGuid(item.photoGuid) ||
            hasBinding ||
            Boolean(item.documentUrl && item.documentUrl.trim() !== "")
        );
        if (isDocReq && !hasValidDocument) {
            const docError = t("common.validation.documentRequired") || "Document is required.";
            missingFields.push(docError);
            currentFieldErrors.document = docError;
        }

        if (item.remark && item.remark.trim() !== "") {
            if (item.remark.length > 500) {
                const remarkError = t("discount.socialValidation.maxVal", { max: 500 }) || "Remark cannot exceed 500 characters.";
                missingFields.push(remarkError);
                currentFieldErrors.remark = remarkError;
            }
            if (!REMARK_PATTERN.test(item.remark || "")) {
                const remarkCharError = t("property.validation.invalidCharacters") || "Remark contains invalid characters.";
                missingFields.push(remarkCharError);
                if (!currentFieldErrors.remark) {
                    currentFieldErrors.remark = remarkCharError;
                }
            }
        }

        if (missingFields.length > 0) {
            errors[item.id] = missingFields[0];
            fieldErrors[item.id] = currentFieldErrors;
            incompleteDiscounts.push({
                id: item.id,
                name: displayName,
                code: item.socialAttributeCode || "",
            });
            isValid = false;
        }
    });

    return { isValid, errors, fieldErrors, incompleteDiscounts };
};
