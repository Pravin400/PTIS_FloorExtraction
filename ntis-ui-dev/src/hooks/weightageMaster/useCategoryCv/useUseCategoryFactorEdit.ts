"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { UseFactorCVMaster, UseFactorCVMasterUpdate } from "@/types/useCategoryCvFactor.types";
import { updateUseFactorCVMasterAction } from "@/app/[locale]/property-tax/weightage-master/sub-type-weightage/action";

export function useUseCategoryFactorEdit(initialData: UseFactorCVMaster) {
    const router = useRouter();
    const tW = useTranslations("weightageMaster");
    const [isUpdating, setIsUpdating] = useState(false);
    const [prevInitialData, setPrevInitialData] = useState(initialData);
    const [formData, setFormData] = useState({
        factor: initialData.factor || 0,
        isActive: initialData.isActive !== undefined ? initialData.isActive : true,
        yearRangeCVId: initialData.yearRangeCVId ?? 0,
    });

    if (prevInitialData !== initialData) {
        setPrevInitialData(initialData);
        setFormData({
            factor: initialData.factor || 0,
            isActive: initialData.isActive !== undefined ? initialData.isActive : true,
            yearRangeCVId: initialData.yearRangeCVId ?? 0,
        });
    }

    const handleSubmit = async () => {
        if (formData.factor < 0.1) {
            toast.error(tW("common.messages.validFactorRequired") || "Please enter a valid factor value greater than 0");
            return false;
        }

        if (formData.factor > 100) {
            toast.error(tW("common.messages.factorPercentageExceedsMax"));
            return false;
        }

        if (!formData.yearRangeCVId || formData.yearRangeCVId <= 0) {
            toast.error("Please select an Assessment Year");
            return false;
        }

        setIsUpdating(true);
        try {
            const payload: UseFactorCVMasterUpdate = {
                isActive: formData.isActive,
                updatedBy: 1,
                typeOfUseId: initialData.typeOfUseId,
                subTypeOfUseId: initialData.subTypeOfUseId,
                factor: formData.factor,
                yearRangeCVId: formData.yearRangeCVId,
            };

            const result = await updateUseFactorCVMasterAction(initialData.id, payload);

            if (result?.success) {
                toast.success(tW("common.messages.recordUpdatedSuccess") || "Record updated successfully!");
                router.refresh();
                return true;
            }

            toast.error(result?.message || tW("common.messages.updateFailed") || "Update failed");
            return false;
        } catch (error) {
            console.error("Use category update failed", error);
            toast.error(tW("common.messages.updateFailed") || "Update failed");
            return false;
        } finally {
            setIsUpdating(false);
        }
    };

    return {
        formData,
        setFormData,
        isUpdating,
        handleSubmit,
    };
}
