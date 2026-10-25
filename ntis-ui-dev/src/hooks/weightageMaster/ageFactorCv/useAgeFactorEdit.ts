"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AgeFactorCVMaster, AgeFactorCVMasterUpdate } from "@/types/ageFactorCv.types";
import { updateAgeFactorCVMasterAction } from "@/app/[locale]/property-tax/weightage-master/age-weightage/action";
import { checkAgeRangeOverlap } from "@/lib/utils/weightageMaster/ageFactorCv/ageFactorCvValidation";

export function useAgeFactorEdit(initialData: AgeFactorCVMaster, allAgeFactors: AgeFactorCVMaster[]) {
    const router = useRouter();
    const t = useTranslations("ageFactorMaster");
    const tW = useTranslations("weightageMaster");
    const [isUpdating, setIsUpdating] = useState(false);
    const [prevInitialData, setPrevInitialData] = useState(initialData);
    const [formData, setFormData] = useState<{
        factor: number;
        isActive: boolean;
        yearRangeCVId: number;
        ageFrom: string | number;
        ageTo: string | number;
    }>({
        factor: initialData.factor || 0,
        isActive: initialData.isActive !== undefined ? initialData.isActive : true,
        yearRangeCVId: initialData.yearRangeCVId ?? 0,
        ageFrom: initialData.ageFrom !== undefined && initialData.ageFrom !== null ? String(initialData.ageFrom) : "",
        ageTo: initialData.ageTo !== undefined && initialData.ageTo !== null ? String(initialData.ageTo) : "",
    });

    if (prevInitialData !== initialData) {
        setPrevInitialData(initialData);
        setFormData({
            factor: initialData.factor || 0,
            isActive: initialData.isActive !== undefined ? initialData.isActive : true,
            yearRangeCVId: initialData.yearRangeCVId ?? 0,
            ageFrom: initialData.ageFrom !== undefined && initialData.ageFrom !== null ? String(initialData.ageFrom) : "",
            ageTo: initialData.ageTo !== undefined && initialData.ageTo !== null ? String(initialData.ageTo) : "",
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

        const ageFromStr = String(formData.ageFrom).trim();
        const ageToStr = String(formData.ageTo).trim();

        if (ageFromStr === "" || ageToStr === "") {
            toast.error(t("messages.provideBothAges") || "Please provide both Age From and Age To values.");
            return false;
        }

        const numFrom = Number(ageFromStr);
        const numTo = Number(ageToStr);

        if (isNaN(numFrom) || isNaN(numTo)) {
            toast.error(t("messages.provideBothAges") || "Please provide valid numbers for Age From and Age To.");
            return false;
        }

        if (numFrom > numTo) {
            toast.error(t("messages.fromAgeGreaterError") || "Age From must be less than or equal to Age To.");
            return false;
        }

        const targetYearId = Number(formData.yearRangeCVId);
        const targetConstructionTypeId = Number(initialData.constructionTypeId);

        // Filter age factors for the SAME construction type and SAME assessment year, excluding the current record being edited
        const relevantFactors = (allAgeFactors || []).filter((af) => {
            if (!af) return false;
            // Exclude current record being edited by ID
            if (af.id === initialData.id) return false;

            const rowYearId = af.yearRangeCVId || af.yearRangeCVID || 0;
            const sameYear = Number(rowYearId) === targetYearId;
            const sameConstruction = Number(af.constructionTypeId) === targetConstructionTypeId;

            return sameYear && sameConstruction;
        });

        const comparisonRanges = relevantFactors.map((af) => `${af.ageFrom}-${af.ageTo}`);
        const { hasOverlap, overlappingRange } = checkAgeRangeOverlap(numFrom, numTo, comparisonRanges);

        if (hasOverlap) {
            toast.error(
                t("messages.ageRangeOverlap", {
                    newRange: `${numFrom}-${numTo}`,
                    existingRange: overlappingRange || "",
                }) ||
                `Age range ${numFrom}-${numTo} overlaps with existing range ${overlappingRange || ""}. Please choose a non-overlapping range.`
            );
            return false;
        }

        if (!formData.yearRangeCVId || formData.yearRangeCVId <= 0) {
            toast.error("Please select an Assessment Year");
            return false;
        }

        setIsUpdating(true);
        try {
            const payload: AgeFactorCVMasterUpdate = {
                isActive: formData.isActive,
                updatedBy: 1,
                constructionTypeId: initialData.constructionTypeId,
                factor: formData.factor,
                yearRangeCVId: formData.yearRangeCVId,
                ageFrom: numFrom,
                ageTo: numTo,
            };

            const result = await updateAgeFactorCVMasterAction(initialData.id, payload);

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
