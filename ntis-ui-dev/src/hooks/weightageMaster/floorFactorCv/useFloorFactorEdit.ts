"use client";

import { useState } from "react";
import { FloorFactorCVMaster, FloorFactorCVMasterUpdateAction } from "@/types/floor-cv-weightageMaster.types";
import { updateFloorFactorCVMasterAction } from "@/app/[locale]/property-tax/weightage-master/action";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function useFloorFactorEdit(initialData: FloorFactorCVMaster) {
    const [formData, setFormData] = useState({
        factorWithLift: initialData.factorWithLift,
        factorWithoutLift: initialData.factorWithoutLift,
        isActive: initialData.isActive,
        yearRangeCVId: initialData.yearRangeCVId || initialData.yearRangeCVID || 0,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const tW = useTranslations("weightageMaster");

    const handleSubmit = async () => {
        if (formData.factorWithLift < 0.1 || formData.factorWithoutLift < 0.1) {
            toast.error(tW("common.messages.validFactorRequired") || "Please enter a valid factor value greater than 0");
            return false;
        }

        if (formData.factorWithLift > 100 || formData.factorWithoutLift > 100) {
            toast.error(tW("common.messages.factorPercentageExceedsMax"));
            return false;
        }

        if (!formData.yearRangeCVId) {
            toast.error(tW("common.messages.requiredFields") || "Please fill all required fields");
            return false;
        }

        setIsSubmitting(true);
        try {
            const payload: FloorFactorCVMasterUpdateAction = {
                isActive: formData.isActive,
                floorId: initialData.floorId,
                factorWithLift: formData.factorWithLift,
                factorWithoutLift: formData.factorWithoutLift,
                yearRangeCVId: formData.yearRangeCVId,
            };

            const result = await updateFloorFactorCVMasterAction(initialData.id, payload);

            if (result.success) {
                toast.success(tW("common.messages.recordUpdatedSuccess") || "Record updated successfully");
                return true;
            } else {
                toast.error(result.message || "Failed to update record");
                return false;
            }
        } catch (_error) {
            toast.error("An unexpected error occurred");
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        formData,
        setFormData,
        isSubmitting,
        handleSubmit
    };
}
