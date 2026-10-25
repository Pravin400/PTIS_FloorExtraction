import { DiscountAttributeState } from "@/types/discount.types";

const TEXT_PATTERN = /^[^<>]*$/;
const REMARK_PATTERN = /^[^<>]*$/;

export const checkDiscountRequiredFields = (
    item: DiscountAttributeState,
    t: (key: string, params?: Record<string, string | number>) => string
): string | null => {
    const displayName = item.socialAttributeName || `Discount #${item.id}`;
    const dataTypeUpper = (item.dataType || "").toUpperCase();

    if (dataTypeUpper === "INT") {
        const strVal = item.intValue !== null && item.intValue !== undefined ? String(item.intValue).trim() : "";
        if (strVal === "") {
            return t("discount.socialValidation.required", { fieldName: displayName }) || `${displayName} is required.`;
        }
        if (/\s/.test(strVal)) {
            return t("common.validation.numberNoSpaces") || "Spaces are not allowed in numbers.";
        }
        if (!/^-?\d+$/.test(strVal)) {
            return t("discount.socialValidation.invalidInteger") || "Value must be a valid integer.";
        }
        const val = Number(strVal);
        const code = (item.socialAttributeCode || "").toUpperCase();
        const isYear = code === "WATER_CONN_YEAR";
        const isTree = code.includes("TREE") || code === "TREE_COUNT";
        const isSolar = code.includes("SOLAR");
        const digitsLimit = isYear ? 4 : isTree ? 6 : isSolar ? 4 : 3;

        if (strVal.length > digitsLimit) {
            return code === "WATER_CONN_YEAR"
                ? (t("discount.socialValidation.yearMaxDigits") || "Year cannot exceed 4 digits.")
                : (t("discount.socialValidation.maxDigits", { digits: digitsLimit }) || `Value cannot exceed ${digitsLimit} digits.`);
        }
        if (val <= 0) {
            return t("discount.socialValidation.countMin") || "Value must be at least 1.";
        }
        if (val > 2147483647) {
            return t("discount.socialValidation.maxVal", { max: 2147483647 }) || "Value cannot exceed 2147483647.";
        }
        if (item.socialAttributeCode === "GREEN_PROPERTY_STAR" && (val < 1 || val > 5)) {
            return t("discount.socialValidation.ratingRange") || "Rating must be between 1 and 5.";
        }
        if (item.socialAttributeCode === "TREE_COUNT" && val > 100000) {
            return t("discount.socialValidation.maxTree") || "Number of trees cannot exceed 100,000.";
        }
        if (item.socialAttributeCode === "BOREWELL_COUNT" && val > 50) {
            return t("discount.socialValidation.maxBorewell") || "Number of borewells cannot exceed 50.";
        }
    } else if (dataTypeUpper === "DECIMAL") {
        const strVal = item.decimalValue !== null && item.decimalValue !== undefined ? String(item.decimalValue).trim() : "";
        if (strVal === "") {
            return t("discount.socialValidation.required", { fieldName: displayName }) || `${displayName} is required.`;
        }
        if (/\s/.test(strVal)) {
            return t("common.validation.numberNoSpaces") || "Spaces are not allowed in numbers.";
        }
        if (!/^-?\d+(\.\d+)?$/.test(strVal)) {
            return t("discount.socialValidation.invalidDecimal") || "Value must be a valid decimal number.";
        }
        const parts = strVal.split(".");
        const hasMoreThanTwoDecimals = parts[1] && parts[1].length > 2;
        if (hasMoreThanTwoDecimals) {
            return t("discount.socialValidation.maxTwoDecimals") || "Maximum 2 decimal places allowed.";
        }
        const val = Number(strVal);
        if (val <= 0) {
            return t("discount.socialValidation.minVal", { min: 0.01 }) || "Value must be greater than zero.";
        }
        if (item.socialAttributeCode === "GREEN_PROPERTY_STAR" && (val < 1 || val > 5)) {
            return t("discount.socialValidation.ratingRange") || "Rating must be between 1 and 5.";
        }
        if (item.socialAttributeCode === "SOLAR_ELECTRIC_CAPACITY" && val > 100000) {
            return t("discount.socialValidation.maxCapacity") || "Capacity cannot exceed 100,000.";
        }
    } else if (dataTypeUpper === "VARCHAR") {
        const trimmedText = (item.textValue || "").trim();
        if (trimmedText === "") {
            return t("discount.socialValidation.required", { fieldName: displayName }) || `${displayName} is required.`;
        }
        if (trimmedText.length < 2) {
            return t("discount.socialValidation.minTextLength") || "Value must be at least 2 characters long.";
        }
        if (trimmedText.length > 100) {
            return t("discount.socialValidation.maxTextLength") || "Value cannot exceed 100 characters.";
        }
        if (!TEXT_PATTERN.test(item.textValue || "")) {
            return t("property.validation.invalidCharacters") || "Contains invalid characters.";
        }
    } else if (dataTypeUpper === "DATE") {
        const strVal = (item.dateValue || "").trim();
        if (strVal === "") {
            return t("common.validation.dateRequired") || "Date is required.";
        }
        const dateVal = new Date(strVal);
        if (isNaN(dateVal.getTime())) {
            return t("common.validation.invalidDate") || "Please enter a valid date.";
        }
        const now = new Date();
        now.setHours(23, 59, 59, 999);
        if (dateVal > now) {
            return t("building.errors.futureDate") || "Date cannot be in the future.";
        }
    }

    if (item.remark && item.remark.trim() !== "") {
        if (item.remark.length > 500) {
            return t("discount.socialValidation.maxVal", { max: 500 }) || "Remark cannot exceed 500 characters.";
        }
        if (!REMARK_PATTERN.test(item.remark || "")) {
            return t("property.validation.invalidCharacters") || "Remark contains invalid characters.";
        }
    }

    return null;
};
