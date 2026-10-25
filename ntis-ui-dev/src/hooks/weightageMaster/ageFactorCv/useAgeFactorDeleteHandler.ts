"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ConfirmContextType } from "@/components/common/ConfirmProvider";
import { deleteAgeFactorCVMasterAction } from "@/app/[locale]/property-tax/weightage-master/age-weightage/action";
type TranslationFunction = ReturnType<typeof import("next-intl").useTranslations>;
import { AgeFactorCVMaster } from "@/types/ageFactorCv.types";

interface AgeFactorCVWeightageMasterDeleteHandlerProps {
    t: TranslationFunction;
    tCommon: TranslationFunction;
    confirm: ConfirmContextType['confirm'];
    startTransition: React.TransitionStartFunction;
    aliases?: Record<string, string>;
}

/**
 * Hook for WeightageMaster table action handlers
 * 
 * Handles:
 * - Delete confirmation and API call
 * 
 * @param props - Handler configuration
 * @returns Action handlers for table rows
 */
export function useAgeFactorCVWeightageMasterDeleteHandler({
    t,
    tCommon,
    confirm,
    startTransition,
    aliases,
}: AgeFactorCVWeightageMasterDeleteHandlerProps){
    const router = useRouter();

    const handleDelete = useCallback(
        (row: AgeFactorCVMaster) => {
            confirm({
                variant: "delete",
                title: `${t("deleteConfirmation.title", aliases)}: ${row.constructionDescription}` || `Type Of Construction: ${row.constructionDescription}`,
                description: `${t("deleteConfirmation.description", aliases)}` || `Are you sure you want to delete this record?`,
                meta: {
                    name: String(row.constructionDescription),
                },
                onConfirm: async () => {
                    const result = await deleteAgeFactorCVMasterAction(row.id);
                    if (result.success) {
                        toast.success(
                            t("deleteConfirmation.successMessage")
                        );
                        startTransition(() => {
                            router.refresh();
                        });
                    } else {
                        // Show appropriate error message based on status code
                        let errorMessage = tCommon("errors.deleteError");

                        if (result.statusCode === 409) {
                            // Record linked with another record or in use
                            errorMessage = t("apiErrors.referredInAutoWardEntry", aliases);
                        } else if (result.statusCode === 400) {
                            // Bad request / validation error
                            errorMessage = t("apiErrors.validationError", aliases);
                        } else if (result.statusCode === 404) {
                            errorMessage = t("apiErrors.notFound", aliases);
                        } else if (result.message) {
                            errorMessage = result.message;
                        }
                        toast.error(errorMessage);
                    }
                },
            });
        },
        [confirm, router, t, tCommon, startTransition, aliases]
    );

    return {
        handleDelete,
    };
}
