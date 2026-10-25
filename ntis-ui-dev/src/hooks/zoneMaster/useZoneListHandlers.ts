import { useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ZoneItem } from "@/types/zoneMaster.types";
import { useConfirm } from "@/components/common";
import { toast } from "sonner";
import { deleteZoneAction, fetchWardsPagedAction } from "@/app/[locale]/property-tax/zone-master/actions";

interface UseZoneListHandlersProps {
  zones: ZoneItem[];
  zoneAlias?: string;
  wardsAlias?: string;
  t: (key: string, values?: Record<string, unknown>) => string;
}

export function useZoneListHandlers({ zones, zoneAlias, wardsAlias, t }: UseZoneListHandlersProps) {
  const { confirm } = useConfirm();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const handleDeleteClick = useCallback((
    zoneId: number,
    zoneNo: string,
    description: string
  ) => {
    confirm({
      variant: "delete",
      title: t("zoneList.deleteTitle", { zone: zoneAlias }),
      description: t("dialogs.deleteDescription", {
        name: description || zoneNo,
        zone: zoneAlias,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
      onConfirm: async () => {
        const zoneObj = zones.find((z) => z.id === zoneId);
        const zoneNoFinal = zoneObj?.zoneNo ?? zoneNo ?? "";
        const descriptionFinal = zoneObj?.description ?? description ?? "";
        const formattedName = zoneNoFinal && descriptionFinal
          ? `${zoneNoFinal} - ${descriptionFinal}`
          : zoneNoFinal || descriptionFinal;

        try {
          const result = await deleteZoneAction(zoneId);

          if (result.success) {
            toast.success(t("messages.deleteSuccess", { name: formattedName, zone: zoneAlias }));
            router.refresh();
            return;
          }

          // Case 1: Zone has wards
          const wardsRes = await fetchWardsPagedAction(1, 1, undefined, zoneId);
          if (wardsRes && wardsRes.totalCount > 0) {
            toast.error(t("messages.zoneHasWardsBriefError", {
              zoneNo: zoneNoFinal,
              description: descriptionFinal,
              zone: zoneAlias,
              wards: wardsAlias,
            }));
            return;
          }

          const errorMsg = result.error?.toLowerCase() || "";
          if (errorMsg.includes("rate") || errorMsg.includes("section") || errorMsg.includes("foreign key") || errorMsg.includes("in use")) {
            toast.error(t("messages.zoneInUseError", { zone: zoneAlias }));
            return;
          }

          toast.error(t("messages.zoneDeleteGenericError", { zone: zoneAlias }));
        } catch {
          toast.error(t("messages.zoneDeleteGenericError", { zone: zoneAlias }));
        }
      },
    });
  }, [confirm, zones, router, t, zoneAlias, wardsAlias]);

  const handlePageChange = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("zonePage", page.toString());
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const handlePageSizeChange = useCallback(
    (size: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("zonePageSize", size.toString());
      params.set("zonePage", "1");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const handleSearchChange = useCallback((value: string, currentSearch: string) => {
    if (value !== currentSearch) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("zonePage", "1");

      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }

      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    }
  }, [router, pathname, searchParams]);

  return {
    handleDeleteClick,
    handlePageChange,
    handlePageSizeChange,
    handleSearchChange,
  };
}
