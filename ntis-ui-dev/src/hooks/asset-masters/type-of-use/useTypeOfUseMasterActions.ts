import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TypeOfUseGroup, AssetTypeOfUse, AssetSubTypeOfUse } from "@/types/asset-masters/type-of-use.types";
import {
  deleteTypeOfUseGroupAction,
  deleteAssetTypeOfUseAction,
  deleteAssetSubTypeOfUseAction,
} from "@/app/[locale]/assets/configuration/master-data/type-of-use/action";
import { getErrorMessage } from "./error-mapping";

interface UseTypeOfUseMasterActionsProps {
  locale: string;
  sp: { toString: () => string };
  selectedGroupId: number | null;
  selectedTypeOfUseId: number | null;
  pushUrl: (params: Record<string, string | number | null>) => void;
  confirm: (options: {
    variant: "delete";
    title: string;
    description: string;
    meta: { name: string };
    onConfirm: () => Promise<void>;
  }) => void;
  t: (key: string, values?: Record<string, string>) => string;
  tCommon: (key: string) => string;
}

export function useTypeOfUseMasterActions({
  locale,
  sp,
  selectedGroupId,
  selectedTypeOfUseId,
  pushUrl,
  confirm,
  t,
  tCommon,
}: UseTypeOfUseMasterActionsProps) {
  const router = useRouter();

  const handleAddGroup = useCallback(() => {
    const params = sp.toString() ? `?${sp.toString()}` : "";
    router.push(`/${locale}/assets/configuration/master-data/type-of-use/group/add${params}`);
  }, [router, locale, sp]);

  const handleEditGroup = useCallback((group: TypeOfUseGroup) => {
    const params = sp.toString() ? `?${sp.toString()}` : "";
    router.push(`/${locale}/assets/configuration/master-data/type-of-use/group/edit/${group.id}${params}`);
  }, [router, locale, sp]);

  const handleDeleteGroup = useCallback((group: TypeOfUseGroup) => {
    confirm({
      variant: "delete",
      title: `${t("group.fields.groupId", { default: "Group Code" })}: ${group.typeOfUseGroupCode}`,
      description: t("group.deleteConfirmDescription", { default: "Are you sure you want to delete this group?" }),
      meta: { name: group.groupName },
      onConfirm: async () => {
        const fd = new FormData();
        fd.append("id", String(group.id));
        const result = await deleteTypeOfUseGroupAction(fd);
        if (result.success) {
          toast.success(t("messages.groupDeleted", { default: "Group deleted successfully" }));
          pushUrl({
            selectedGroupId: group.id === selectedGroupId ? null : selectedGroupId,
            selectedTypeOfUseId: group.id === selectedGroupId ? null : selectedTypeOfUseId,
            typePn: 1,
            subTypePn: 1,
          });
        } else {
          toast.error(getErrorMessage(result.message, result.statusCode, t, tCommon, t("group.title")));
        }
      },
    });
  }, [confirm, selectedGroupId, selectedTypeOfUseId, pushUrl, t, tCommon]);

  const handleAddType = useCallback(() => {
    const params = sp.toString() ? `?${sp.toString()}` : "";
    router.push(`/${locale}/assets/configuration/master-data/type-of-use/type/add${params}`);
  }, [router, locale, sp]);

  const handleEditType = useCallback((typeOfUse: AssetTypeOfUse) => {
    const params = sp.toString() ? `?${sp.toString()}` : "";
    router.push(`/${locale}/assets/configuration/master-data/type-of-use/type/edit/${typeOfUse.id}${params}`);
  }, [router, locale, sp]);

  const handleDeleteType = useCallback((typeOfUse: AssetTypeOfUse) => {
    confirm({
      variant: "delete",
      title: `${t("type.fields.code.label", { default: "Code" })}: ${typeOfUse.typeOfUseCode}`,
      description: t("type.deleteConfirmDescription", { default: "Are you sure you want to delete this type of use?" }),
      meta: { name: typeOfUse.description ?? "" },
      onConfirm: async () => {
        const fd = new FormData();
        fd.append("id", String(typeOfUse.id));
        const result = await deleteAssetTypeOfUseAction(fd);
        if (result.success) {
          toast.success(t("messages.typeDeleted", { default: "Type of Use deleted successfully" }));
          pushUrl({
            selectedTypeOfUseId: typeOfUse.id === selectedTypeOfUseId ? null : selectedTypeOfUseId,
            subTypePn: 1,
            subTypeSearch: "",
          });
        } else {
          toast.error(getErrorMessage(result.message, result.statusCode, t, tCommon, t("type.title")));
        }
      },
    });
  }, [confirm, selectedTypeOfUseId, pushUrl, t, tCommon]);

  const handleAddSubtype = useCallback(() => {
    const params = sp.toString() ? `?${sp.toString()}` : "";
    router.push(`/${locale}/assets/configuration/master-data/type-of-use/subtype/add${params}`);
  }, [router, locale, sp]);

  const handleEditSubtype = useCallback((subType: AssetSubTypeOfUse) => {
    const params = sp.toString() ? `?${sp.toString()}` : "";
    router.push(`/${locale}/assets/configuration/master-data/type-of-use/subtype/edit/${subType.id}${params}`);
  }, [router, locale, sp]);

  const handleDeleteSubtype = useCallback((subType: AssetSubTypeOfUse) => {
    confirm({
      variant: "delete",
      title: `${t("messages.subTypeNameLabel", { default: "Sub-Type Name" })}: ${subType.description ?? ""}`,
      description: t("subtype.deleteConfirmDescription", { default: "Are you sure you want to delete this sub-type of use?" }),
      meta: { name: subType.description ?? "" },
      onConfirm: async () => {
        const fd = new FormData();
        fd.append("id", String(subType.id));
        const result = await deleteAssetSubTypeOfUseAction(fd);
        if (result.success) {
          toast.success(t("messages.subTypeDeleted", { default: "Sub-Type of Use deleted successfully" }));
          pushUrl({
            selectedGroupId,
            selectedTypeOfUseId,
            subTypePn: 1,
            subTypeSearch: "",
          });
        } else {
          toast.error(getErrorMessage(result.message, result.statusCode, t, tCommon, t("subtype.title")));
        }
      },
    });
  }, [confirm, selectedGroupId, selectedTypeOfUseId, pushUrl, t, tCommon]);

  return {
    handleAddGroup,
    handleEditGroup,
    handleDeleteGroup,
    handleAddType,
    handleEditType,
    handleDeleteType,
    handleAddSubtype,
    handleEditSubtype,
    handleDeleteSubtype,
  };
}
