"use client";

import { useState } from "react";
import { NatureFactorCVMaster, NatureFactorCVMasterUpdate } from "@/types/natureofbuilding-cv-weightageMaster.types";
import { updateNatureFactorCVMasterAction } from "@/app/[locale]/property-tax/weightage-master/nature-weightage/actions";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export function useNatureFactorEdit(initialData: NatureFactorCVMaster, _locale?: string) {
    const [isUpdating, setIsUpdating] = useState(false);
    const router = useRouter();
    const tW = useTranslations("weightageMaster");

    const [formData, setFormData] = useState({
        factor: initialData.factor || 0,
        isActive: initialData.isActive !== undefined ? initialData.isActive : true,
        yearRangeCVId: initialData.yearRangeCVId || null,
    });

    const handleSubmit = async () => {
        if (formData.factor < 0.1) {
            toast.error(tW("common.messages.validFactorRequired") || "Please enter a valid factor value greater than 0");
            return false;
        }

        if (formData.factor > 100) {
            toast.error(tW("common.messages.factorPercentageExceedsMax"));
            return false;
        }

        if (!formData.yearRangeCVId) {
            toast.error("Please select an Assessment Year");
            return false;
        }

        setIsUpdating(true);
        try {
            const payload: NatureFactorCVMasterUpdate = {
                isActive: formData.isActive,
                updatedBy: 1, // Usually from auth context
                constructionTypeId: initialData.constructionTypeId,
                factor: formData.factor,
                yearRangeCVId: formData.yearRangeCVId,
            };

            const result = await updateNatureFactorCVMasterAction(initialData.id, payload);
            
            if (result?.success) {
                toast.success(tW("common.messages.recordUpdatedSuccess") || "Record updated successfully!");
                router.refresh();
                return true;
            } else {
                toast.error(result?.message || tW("common.messages.updateFailed") || "Update failed");
                return false;
            }
        } catch (error) {
            console.error("Update failed", error);
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
        handleSubmit
    };
}
