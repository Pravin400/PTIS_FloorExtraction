import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { PaymentModeFormData, PaymentModeFormProps } from "@/types/paymentMode.types";
import { validatePaymentMode, PAYMENT_MODE_CODE_MAX as CODE_MAX, PAYMENT_MODE_NAME_MAX as NAME_MAX } from "@/lib/validations/payment-mode";
import { savePaymentModeMasterAction } from "@/app/[locale]/configuration-settings/payment-mode-master/actions";
import { formatPaymentModeCode } from "@/lib/utils/payment-mode";

/**
 * Custom hook for managing Payment Mode form state, validation, and submission.
 * Extracts business logic from the UI component for better testability and reuse.
 * 
 * @param props - PaymentModeFormProps including editingMode, open state, and callbacks.
 * @returns Form state, handlers, and validation results.
 */
export function usePaymentModeForm({
    editingMode,
    onClose,
    onSuccess,
    t
}: Omit<PaymentModeFormProps, "open"> & { t: (key: string) => string }) {
    const isEdit = Boolean(editingMode);

    const getInitialFormData = useCallback((): PaymentModeFormData => ({
        code: editingMode?.code ?? "",
        paymentModeName: editingMode?.paymentModeName ?? "",
        type: editingMode?.type ?? "Online",
        category: editingMode?.category ?? "Cash",
        description: editingMode?.description ?? "",
        chargeType: editingMode?.chargeType ?? "None",
        transactionCharge: editingMode?.transactionCharge ?? 0,
        isActive: editingMode?.isActive ?? true,
    }), [editingMode]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submittedOnce, setSubmittedOnce] = useState(false);
    const [isActive, setIsActive] = useState(editingMode?.isActive ?? true);

    const [formData, setFormData] = useState<PaymentModeFormData>(getInitialFormData);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const validate = useCallback((data: PaymentModeFormData) => {
        return validatePaymentMode(data, t);
    }, [t]);

    const showError = (field: keyof PaymentModeFormData) =>
        (submittedOnce || touched[field]) && !!errors[field];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        let newValue = value;

        if (name === "code") {
            newValue = formatPaymentModeCode(newValue);
            if (newValue.length > CODE_MAX) return;
        }

        if (name === "paymentModeName") {
            newValue = newValue.replace(/[^a-zA-Z\s\u0900-\u097F]/g, "");
            if (newValue.length > NAME_MAX) return;
        }

        setFormData((p) => ({ ...p, [name]: newValue }));
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name } = e.target;
        setTouched((p) => ({ ...p, [name]: true }));

        const fieldErrors = validate(formData);
        setErrors((p) => {
            const nextError = fieldErrors[name];
            if (nextError) {
                return { ...p, [name]: nextError };
            }
            const { [name]: _removed, ...remainingErrors } = p;
            return remainingErrors;
        });
    };

    const handleToggleStatus = () => {
        setIsActive((prev) => {
            const newValue = !prev;
            setFormData((p) => ({ ...p, isActive: newValue }));
            return newValue;
        });
    };

    const resetForm = useCallback(() => {
        setFormData(getInitialFormData());
        setErrors({});
        setTouched({});
        setSubmittedOnce(false);
        setIsSubmitting(false);
        setIsActive(editingMode?.isActive ?? true);
    }, [editingMode?.isActive, getInitialFormData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittedOnce(true);

        const v = validate(formData);
        setErrors(v);

        if (Object.keys(v).length) {
            toast.error(t('toast.validationError'));
            return;
        }

        setIsSubmitting(true);
        try {
            const formDataToSubmit = new FormData();
            if (isEdit && editingMode) {
                // Ensure we use 'id' as expected by the Server Action
                formDataToSubmit.append('id', String(editingMode.id));
            }
            formDataToSubmit.append('code', formData.code);
            formDataToSubmit.append('paymentModeName', formData.paymentModeName);
            formDataToSubmit.append('type', formData.type);
            formDataToSubmit.append('category', formData.category);
            formDataToSubmit.append('description', formData.description || '');
            formDataToSubmit.append('chargeType', formData.chargeType);
            formDataToSubmit.append('transactionCharge', String(formData.transactionCharge));
            formDataToSubmit.append('isActive', String(formData.isActive));

            const result = await savePaymentModeMasterAction(formDataToSubmit);

            if (result.success) {
                toast.success(t(result.messageKey || 'toast.createSuccess'));
                if (!isEdit) {
                    setFormData({
                        code: "",
                        paymentModeName: "",
                        type: "Online",
                        category: "Cash",
                        description: "",
                        chargeType: "None",
                        transactionCharge: 0,
                        isActive: true,
                    });
                    setErrors({});
                    setTouched({});
                    setSubmittedOnce(false);
                    setIsActive(true);
                }
                onSuccess();
                onClose();
            } else {
                toast.error(result.error || t('toast.saveFailed'));
            }
        } catch (_error) {
            toast.error(t('toast.unexpectedError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const setFieldValue = (name: keyof PaymentModeFormData, value: PaymentModeFormData[keyof PaymentModeFormData]) => {
        setFormData(prev => {
            const next = { ...prev, [name]: value };
            if (name === 'chargeType' && value === 'None') {
                next.transactionCharge = 0;
            }
            return next;
        });
    };

    return {
        formData,
        errors,
        isSubmitting,
        isActive,
        isEdit,
        handleChange,
        handleBlur,
        handleSubmit,
        handleToggleStatus,
        showError,
        setFieldValue,
        resetForm
    };
}
