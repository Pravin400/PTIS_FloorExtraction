import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { WardItem } from "@/types/wardMaster.types";
import { useConfirm } from "@/components/common";
import { toast } from "sonner";
import { deleteWardAction } from "@/app/[locale]/property-tax/zone-master/actions";
import { getWardColumns } from "@/components/modules/property-tax/zone-master/wards/wardColumns";

interface UseWardListHandlersProps {
  selectedZoneId: number | null;
  searchTerm: string;
  onWardsChanged?: () => void;
  pageNumber: number;
  pageSize: number;
  wardAlias?: string;
  t: (key: string, values?: Record<string, unknown>) => string;
}

export function useWardListHandlers({
  selectedZoneId,
  searchTerm,
  onWardsChanged,
  pageNumber,
  pageSize,
  wardAlias,
  t,
}: UseWardListHandlersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [localSearch, setLocalSearch] = useState(searchTerm);
  const prevSearchTermRef = useRef(searchTerm);

  // Sync search from URL when it changes (non-cascading)
  useEffect(() => {
    if (prevSearchTermRef.current !== searchTerm) {
      prevSearchTermRef.current = searchTerm;
      setLocalSearch(searchTerm);
    }
  }, [searchTerm]);

  // Debounced search
  useEffect(() => {
    if (selectedZoneId === null || localSearch === searchTerm) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      params.set("wardPage", "1");

      if (localSearch) {
        params.set("wardQ", localSearch);
      } else {
        params.delete("wardQ");
      }

      router.push(`${pathname}?${params.toString()}`);
    }, 400);

    return () => clearTimeout(timer);
  }, [localSearch, searchTerm, selectedZoneId, router, pathname, searchParams]);

  const handleSearchChange = useCallback((value: string) => {
    setLocalSearch(value);
  }, []);

  const refreshData = useCallback(() => {
    if (onWardsChanged) onWardsChanged();
    router.refresh();
  }, [onWardsChanged, router]);

  const { confirm } = useConfirm();

  const handleDelete = useCallback((row: WardItem) => {
    const wardId = row.id;
    const wardNo = row.wardNo;

    if (!wardId) {
      toast.error(t("messages.invalidWard", { ward: wardAlias }));
      return;
    }

    confirm({
      variant: "delete",
      title: t("wardList.deleteTitle", { ward: wardAlias }),
      description: t("dialogs.deleteDescription", {
        name: wardNo,
        zone: wardAlias,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
      onConfirm: async () => {
        try {
          const result = await deleteWardAction(wardId);

          if (result.success) {
            toast.success(t("messages.wardDeleteSuccess", { ward: wardAlias }));
            refreshData();
          } else {
            const errorMsg = result.error?.toLowerCase() || "";

            // Check for "in use" or "referenced" errors
            if (
              errorMsg.includes("cannot be deleted") ||
              errorMsg.includes("referenced") ||
              errorMsg.includes("in use") ||
              errorMsg.includes("foreign key") ||
              errorMsg.includes("reference constraint") ||
              errorMsg.includes("dependent") ||
              errorMsg.includes("409")
            ) {
              toast.error(t("wardMessages.wardCannotBeDeleted", { wardNo, ward: wardAlias }));
            } else {
              toast.error(t("messages.wardDeleteError", { ward: wardAlias }));
            }
          }
        } catch {
          toast.error(t("messages.wardDeleteException", { ward: wardAlias }));
        }
      },
    });
  }, [t, confirm, refreshData, wardAlias]);

  const handleEdit = useCallback(
    (row: WardItem) => {
      const params = new URLSearchParams(searchParams.toString());
      if (selectedZoneId !== null) {
        params.set("zoneId", String(selectedZoneId));
      }
      params.set("editWard", String(row.id));
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, selectedZoneId, pathname, router]
  );

  const handlePageChange = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("wardPage", String(page));
    params.set("wardPageSize", String(pageSize));

    if (searchTerm) {
      params.set("wardQ", searchTerm);
    }

    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, pageSize, searchTerm, router, pathname]);

  const handlePageSizeChange = useCallback((newSize: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("wardPageSize", String(newSize));
    params.set("wardPage", "1");

    if (searchTerm) {
      params.set("wardQ", searchTerm);
    }

    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, searchTerm, router, pathname]);

  const columns = useMemo(
    () =>
      getWardColumns({
        t,
        pageNumber,
        pageSize,
        wardAlias,
      }),
    [t, pageNumber, pageSize, wardAlias]
  );

  return {
    localSearch,
    handleSearchChange,
    handleDelete,
    handleEdit,
    handlePageChange,
    handlePageSizeChange,
    columns,
  };
}
