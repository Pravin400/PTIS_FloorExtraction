/**
 * Formats the payment mode code by converting to uppercase and removing non-alphanumeric characters.
 * 
 * @param code - Raw code input.
 * @returns Formatted code.
 */
export const formatPaymentModeCode = (code: string): string => {
    return code.toUpperCase().replace(/[^A-Za-z0-9]/g, "");
};
