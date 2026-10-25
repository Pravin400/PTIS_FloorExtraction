import type { PaymentModeFormData } from "@/types/paymentMode.types";

export const PAYMENT_MODE_CODE_REGEX = /^[A-Za-z0-9]+$/;
export const PAYMENT_MODE_CODE_MAX = 10;
export const PAYMENT_MODE_NAME_MAX = 30;
export const PAYMENT_MODE_DESCRIPTION_MAX = 200;

export const validatePaymentMode = (
    data: PaymentModeFormData,
    t: (key: string) => string
): Record<string, string> => {
    const e: Record<string, string> = {};

    // Code validation
    if (!data.code.trim()) {
        e.code = t('form.validation.codeRequired');
    } else if (data.code.length > PAYMENT_MODE_CODE_MAX) {
        e.code = t('form.validation.codeMaxLength');
    } else if (!PAYMENT_MODE_CODE_REGEX.test(data.code)) {
        e.code = t('form.validation.codeInvalidResult');
    }

    // Name validation
    if (!data.paymentModeName.trim()) {
        e.paymentModeName = t('form.validation.nameRequired');
    } else if (data.paymentModeName.length > PAYMENT_MODE_NAME_MAX) {
        e.paymentModeName = t('form.validation.nameMaxLength');
    }

    // Description validation
    if (data.description && data.description.length > PAYMENT_MODE_DESCRIPTION_MAX) {
        e.description = t('form.validation.descriptionMaxLength');
    }

    // Transaction Charge validation
    const charge = typeof data.transactionCharge === 'number' ? data.transactionCharge : parseFloat(String(data.transactionCharge));
    if (data.chargeType === 'Fixed') {
        if (isNaN(charge) || charge < 0) {
            e.transactionCharge = t('form.validation.chargeNegative');
        }
    } else if (data.chargeType === 'Percentage') {
        if (isNaN(charge) || charge < 0 || charge > 100) {
            e.transactionCharge = t('form.validation.chargePercentageRange');
        }
    } else if (data.chargeType === 'None') {
        if (!isNaN(charge) && charge !== 0) {
            e.transactionCharge = t('form.validation.chargeNoneInvalid');
        }
    }

    return e;
};