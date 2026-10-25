"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ConfirmContextType } from "@/components/common/ConfirmProvider";
import {deleteUseFactorCVMasterAction} from "@/app/[locale]/property-tax/weightage-master/sub-type-weightage/action";
type TranslationFunction = ReturnType<typeof import("next-intl").useTranslations>;
import { UseFactorCVMaster } from "@/types/useCategoryCvFactor.types";


interface UseWeightageMasterDeleteHandlerProps {
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
export function useWeightageMasterDeleteHandlerer({
  t,
  tCommon,
  confirm,
  startTransition,
  aliases,
}: UseWeightageMasterDeleteHandlerProps) {
  const router = useRouter();

  const handleDelete = useCallback(
    (row: UseFactorCVMaster) => {
      confirm({
        variant: "delete",
        title: `${t("deleteConfirmation.title", aliases)}: ${row.typeOfUseDescription} ${row.subTypeOfUseDescription}` || `Type Of Use: ${row.typeOfUseDescription} ${row.typeOfUseCode}`,
        description: `${t("deleteConfirmation.description")}`|| `Are you sure you want to delete this record?`,
        meta: {
          name: `${row.typeOfUseDescription} ${row.subTypeOfUseDescription}`,
        },
        onConfirm: async () => {
          const result = await deleteUseFactorCVMasterAction(row.id);
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
              errorMessage = t("apiErrors.validationError");
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
