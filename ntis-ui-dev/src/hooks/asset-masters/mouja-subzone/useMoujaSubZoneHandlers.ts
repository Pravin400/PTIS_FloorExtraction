import { useCallback, TransitionStartFunction } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { Mouja, SubZoneDetails } from "@/types/asset-masters/mouja-subzone.types";
import { deleteMoujaAction, deleteSubZoneAction } from "@/app/[locale]/assets/configuration/master-data/mouja-subzone/action";
import { getErrorMessage } from "./validation";


interface UseMoujaSubZoneHandlersProps {
  pushUrl: (params: Record<string, string | number | undefined>) => void;
  startTransition: TransitionStartFunction;
  setSubZoneSearch: (val: string) => void;
  moujaSortBy?: string;
  moujaSortOrder?: string;
  subZoneSortBy?: string;
  subZoneSortOrder?: string;
  selectedMoujaId?: string;
}

export function useMoujaSubZoneHandlers({
  pushUrl,
  startTransition,
  setSubZoneSearch,
  moujaSortBy,
  moujaSortOrder,
  subZoneSortBy,
  subZoneSortOrder,
  selectedMoujaId,
}: UseMoujaSubZoneHandlersProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("moujaSubzone");
  const tCommon = useTranslations("common");
  const { confirm } = useConfirm();



  const handleMoujaSort = useCallback((col: string) => {
    startTransition(() => pushUrl({
      moujaSortBy: col,
      moujaSortOrder: moujaSortBy === col && moujaSortOrder === "asc" ? "desc" : "asc",
      moujaPn: 1
    }));
  }, [moujaSortBy, moujaSortOrder, pushUrl, startTransition]);

  const handleSubZoneSort = useCallback((col: string) => {
    startTransition(() => pushUrl({
      subZoneSortBy: col,
      subZoneSortOrder: subZoneSortBy === col && subZoneSortOrder === "asc" ? "desc" : "asc",
      subZonePn: 1
    }));
  }, [subZoneSortBy, subZoneSortOrder, pushUrl, startTransition]);

  const handleMoujaRowClick = (row: Mouja) => {
    startTransition(() => {
      pushUrl({ moujaId: String(row.id), subZonePn: 1, subZoneSearch: "" });
      setSubZoneSearch("");
    });
  };

  const handleAddMouja = () => {
    startTransition(() => {
      router.push(`/${locale}/assets/configuration/master-data/mouja-subzone/mouja/add${sp.toString() ? `?${sp.toString()}` : ""}`);
    });
  };

  const handleEditMouja = (row: Mouja) => {
    startTransition(() => {
      router.push(`/${locale}/assets/configuration/master-data/mouja-subzone/mouja/edit/${row.id}${sp.toString() ? `?${sp.toString()}` : ""}`);
    });
  };

  const handleDeleteMouja = (row: Mouja) => {
    confirm({
      variant: "delete",
      title: `${t("list.table.moujaNo")}: ${row.moujaNo}`,
      description: `${t("delete.confirmDescription")}`,
      meta: { name: row.moujaName },
      onConfirm: async () => {
        const fd = new FormData();
        fd.append("id", String(row.id));
        const result = await deleteMoujaAction(fd);
        if (result.success) {
          toast.success(t("success.moujaDeleted"));
          if (String(row.id) === selectedMoujaId) {
            setSubZoneSearch("");
            pushUrl({ moujaId: "", subZoneSearch: "", subZonePn: 1 });
          } else if (selectedMoujaId) {
            pushUrl({ moujaId: selectedMoujaId, subZoneSearch: "", subZonePn: 1 });
          }
        } else {
          toast.error(getErrorMessage(result.message, result.statusCode, t, tCommon, t("list.moujaTitle")));
        }
      },
    });
  };

  const handleAddSubZone = () => {
    startTransition(() => {
      const params = new URLSearchParams(sp.toString());
      if (selectedMoujaId) params.set("moujaId", String(selectedMoujaId));
      router.push(`/${locale}/assets/configuration/master-data/mouja-subzone/sub-zone/add${params.toString() ? `?${params.toString()}` : ""}`);
    });
  };

  const handleEditSubZone = (row: SubZoneDetails) => {
    startTransition(() => {
      router.push(`/${locale}/assets/configuration/master-data/mouja-subzone/sub-zone/edit/${row.id}${sp.toString() ? `?${sp.toString()}` : ""}`);
    });
  };

  const handleDeleteSubZone = (row: SubZoneDetails) => {
    confirm({
      variant: "delete",
      title: `${t("list.table.subZoneNo")}: ${row.subZoneNo}`,
      description: `${t("delete.confirmDescription")}`,
      meta: { name: row.subZoneName },
      onConfirm: async () => {
        const fd = new FormData();
        fd.append("id", String(row.id));
        const result = await deleteSubZoneAction(fd);
        if (result.success) {
          toast.success(t("success.subZoneDeleted"));
          pushUrl({ moujaId: selectedMoujaId ?? "", subZoneSearch: "", subZonePn: 1 });
        } else {
          toast.error(getErrorMessage(result.message, result.statusCode, t, tCommon, t("list.subZoneTitle")));
        }
      },
    });
  };

  return {
    handleMoujaSort,
    handleSubZoneSort,
    handleMoujaRowClick,
    handleAddMouja,
    handleEditMouja,
    handleDeleteMouja,
    handleAddSubZone,
    handleEditSubZone,
    handleDeleteSubZone,
  };
}






