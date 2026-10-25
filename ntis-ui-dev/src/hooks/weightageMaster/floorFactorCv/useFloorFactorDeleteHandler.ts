"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ConfirmContextType } from "@/components/common/ConfirmProvider";
import { deleteFloorFactorCVMasterActionById } from "@/app/[locale]/property-tax/weightage-master/action";
type TranslationFunction = ReturnType<typeof import("next-intl").useTranslations>;
import { FloorFactorCVMaster } from "@/types/floor-cv-weightageMaster.types";

interface FloorFactorCVWeightageMasterDeleteHandlerProps {
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
export function useFloorFactorCVWeightageMasterDeleteHandler({
    t,
    tCommon,
    confirm,
    startTransition,
    aliases,
}: FloorFactorCVWeightageMasterDeleteHandlerProps){
    const router = useRouter();

    const handleDelete = useCallback(
        (row: FloorFactorCVMaster) => {
            confirm({
                variant: "delete",
                title: `${t("deleteConfirmation.title", aliases)}: ${row.floorDescription}` || `Type Of Floor`,
                description: `${t("deleteConfirmation.description", aliases)}` || `Are you sure you want to delete this record?`,
                meta: {
                    name: String(row.floorDescription),
                },
                onConfirm: async () => {
                    const result = await deleteFloorFactorCVMasterActionById(row.id);
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
                            errorMessage = t("apiErrors.referredInAutoWardEntry");
                        } else if (result.statusCode === 400) {
                            // Bad request / validation error
                            errorMessage = t("apiErrors.validationError");
                        } else if (result.statusCode === 404) {
                            errorMessage = t("apiErrors.notFound");
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
