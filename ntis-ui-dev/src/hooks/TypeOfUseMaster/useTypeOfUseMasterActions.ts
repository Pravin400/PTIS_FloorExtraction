import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useConfirm } from "@/components/common/ConfirmProvider";
import {
  deleteUseGroup,
  deleteUseType,
  deleteSubType,
  checkTypeHasSubTypes,
  checkGroupHasTypes,
} from "@/app/[locale]/property-tax/typeofusemaster/actions";
import type { UseGroup, UseType, UseSubType } from "@/types/typeOfUse.types";
import { ApiError } from "@/lib/utils/api";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

type TranslatorFunction = (key: string, values?: Record<string, string | number>) => string;

/**
 * Configuration for delete operation
 */
interface DeleteConfig {
  variant: "delete" | "warning";
  title: string;
  description?: string;
  meta: { name: string };
  confirmText?: string;
  deleteAction: () => Promise<{ success: boolean; message?: string; statusCode?: number }>;
  successMessage: string;
  errorMessage: string;
  referencedMessage?: string;
  ignoreNextRedirect?: boolean;
}

export function useTypeOfUseMasterActions(t: TranslatorFunction) {
  const router = useRouter();
  const { confirm } = useConfirm();

  const useLabel = useAliasLabel("Use", t("aliasFallback.use"));
  const typeOfUseLabel = useAliasLabel("Type_Of_Use", t("aliasFallback.typeOfUse"));
  const subTypeOfUseLabel = useAliasLabel("Sub_Type_Of_Use", t("aliasFallback.subTypeOfUse"));

  /**
   * Generic delete handler that encapsulates the common delete flow
   * Handles confirmation, execution, success/error toasts, and router refresh
   */
  const executeDelete = async (config: DeleteConfig) => {
    confirm({
      variant: config.variant,
      title: config.title,
      description: config.description,
      meta: config.meta,
      confirmText: config.confirmText,
      onConfirm: async () => {
        try {
          const result = await config.deleteAction();
          
          if (!result.success) {
            const finalError = result.statusCode === 409 && config.referencedMessage
              ? config.referencedMessage
              : (result.message || config.errorMessage);
            toast.error(finalError);
            return;
          }
          
          toast.success(config.successMessage);
          if (!config.ignoreNextRedirect) {
            router.refresh();
          }
        } catch (error) {
          // Handle unexpected runtime errors that aren't caught by the action itself
          if (error instanceof ApiError) {
            const finalError = error.statusCode === 409 && config.referencedMessage
              ? config.referencedMessage
              : (error.responseText || config.errorMessage);
            toast.error(finalError);
          } else if (error instanceof Error) {
            toast.error(error.message || config.errorMessage);
          } else {
            toast.error(config.errorMessage);
          }
        }
      },
    });
  };

  const handleDeleteGroup = async (g: UseGroup) => {
    const groupId = g.typeOfUseGroupId;

    if (!groupId) {
      toast.error(t('messages.invalidGroupRecord'));
      return;
    }

    // Check if group has types
    try {
      const { hasTypes } = await checkGroupHasTypes(groupId);
      
      if (hasTypes) {
        toast.error(t('messages.groupHasTypes'));
        return;
      }
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.responseText || t('messages.checkDependenciesFailed'));
      } else if (error instanceof Error) {
        toast.error(error.message || t('messages.checkDependenciesFailed'));
      } else {
        toast.error(t('messages.checkDependenciesFailed'));
      }
      return;
    }

    // If no types, proceed with delete
    executeDelete({
      variant: "delete",
      title: t("messages.deleteConfirmation"),
      meta: { name: g.groupName },
      deleteAction: () => deleteUseGroup(groupId),
      successMessage: t('messages.groupDeletedSuccess', { name: g.groupName, use: useLabel }),
      errorMessage: t('messages.groupDeleteFailed', { use: useLabel }),
      referencedMessage: t('messages.deleteGroupReferenced', { use: useLabel, typeOfUse: typeOfUseLabel }),
    });
  };

  const handleDeleteType = async (useType: UseType) => {
    const typeId = useType.typeOfUseId;

    if (!typeId) {
      toast.error(t('messages.invalidTypeRecord'));
      return;
    }

    // Check if type has sub-types
    try {
      const { hasSubTypes } = await checkTypeHasSubTypes(typeId);
      
      if (hasSubTypes) {
        toast.error(t('messages.typeHasSubTypes', { subTypeOfUse: subTypeOfUseLabel }));
        return;
      }
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.responseText || t('messages.checkDependenciesFailed'));
      } else if (error instanceof Error) {
        toast.error(error.message || t('messages.checkDependenciesFailed'));
      } else {
        toast.error(t('messages.checkDependenciesFailed'));
      }
      return;
    }

    // If no sub-types, proceed with delete
    executeDelete({
      variant: "delete",
      title: t("messages.deleteConfirmation"),
      meta: { name: useType.description },
      deleteAction: () => deleteUseType(typeId),
      successMessage: t('messages.typeDeletedSuccess', { name: useType.description, typeOfUse: typeOfUseLabel }),
      errorMessage: t('messages.typeDeleteFailed', { typeOfUse: typeOfUseLabel }),
      referencedMessage: t('messages.deleteTypeReferenced', { typeOfUse: typeOfUseLabel, subTypeOfUse: subTypeOfUseLabel }),
    });
  };

  const handleDeleteSubType = (s: UseSubType) => {
    executeDelete({
      variant: "delete",
      title: t("messages.deleteConfirmation"),
      meta: { name: s.description },
      deleteAction: () => deleteSubType(String(s.subTypeOfUseId)),
      successMessage: t('messages.subTypeDeletedSuccess', { name: s.description, subTypeOfUse: subTypeOfUseLabel }),
      errorMessage: t('messages.subTypeDeleteFailed', { subTypeOfUse: subTypeOfUseLabel }),
      referencedMessage: t('messages.deleteSubTypeReferenced', { subTypeOfUse: subTypeOfUseLabel }),
      ignoreNextRedirect: true,
    });
  };

  return {
    handleDeleteGroup,
    handleDeleteType,
    handleDeleteSubType,
  };
}
