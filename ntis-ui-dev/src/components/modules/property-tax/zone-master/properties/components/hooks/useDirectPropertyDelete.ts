import { useCallback, useRef, useState,useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useConfirm } from "@/components/common";
import {
  deletePropertyAction,
  deleteBulkPropertiesAction,
} from "@/app/[locale]/property-tax/zone-master/actions";
import type { DirectPropertyDeleteRow } from "@/types/zoneMaster.types";

interface UseDirectPropertyDeleteProps {
  tableData: DirectPropertyDeleteRow[];
  hasSubRows: boolean;
  onSubRowDeleted?: () => void;
  onDeleted: () => void;
  t: (key: string, params?: Record<string, string | number | Date>) => string;
}

export function useDirectPropertyDelete({
  tableData,
  hasSubRows,
  onSubRowDeleted,
  onDeleted,
  t,
}: UseDirectPropertyDeleteProps) {
  const router = useRouter();
  const { confirm } = useConfirm();
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const selectedRowsRef = useRef(selectedRows);
  useEffect(() => {
  selectedRowsRef.current = selectedRows;
}, [selectedRows]);

  const allSelected =
    tableData.length > 0 && selectedRows.size === tableData.length;
  const someSelected =
    selectedRows.size > 0 && selectedRows.size < tableData.length;

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(tableData.map((r) => r.propertyId)));
    }
  }, [allSelected, tableData]);

  const toggleRow = useCallback((id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleBulkDelete = useCallback(() => {
    const currentIds = Array.from(selectedRowsRef.current);
    const count = currentIds.length;
    if (count === 0) return;

    const callback = hasSubRows ? (onSubRowDeleted ?? (() => {})) : onDeleted;

    confirm({
      variant: "delete",
      title: t("createProperty.deleteSelectedPropertiesTitle"),
      description: t("createProperty.deleteSelectedPropertiesDesc", { count }),
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          const result = await deleteBulkPropertiesAction(currentIds);

          if (result.success) {
            toast.success(result.message ?? t("createProperty.propertyDeleteSuccess"));
            setSelectedRows(new Set());
            callback();
            router.refresh();
          } else {
            toast.error(result.error ?? t("createProperty.failedToDeleteProperty"));
          }
        } catch {
          toast.error(t("createProperty.failedToDeleteProperty"));
        } finally {
          setIsDeleting(false);
        }
      },
    });
  }, [confirm, router, t, hasSubRows, onSubRowDeleted, onDeleted]);

  const createDeleteHandler = useCallback(
    (rowPropertyId: string, rowPropertyNo: string, callback: () => void) =>
      () => {
        confirm({
          variant: "delete",
          title: t("createProperty.deletePropertyConfirm"),
          description: t("createProperty.deleteSinglePropertyDesc"),
          meta: { name: rowPropertyNo },
          onConfirm: async () => {
            setIsDeleting(true);
            try {
              const result = await deletePropertyAction(rowPropertyId);

              if (result.success) {
                toast.success(t("createProperty.propertyDeleteSuccess"));
                callback();
                router.refresh();
              } else {
                toast.error(result.error ?? t("createProperty.failedToDeleteProperty"));
              }
            } catch {
              toast.error(t("createProperty.failedToDeleteProperty"));
            } finally {
              setIsDeleting(false);
            }
          },
        });
      },
    [confirm, router, t]
  );

  return {
    isDeleting,
    selectedRows,
    allSelected,
    someSelected,
    toggleSelectAll,
    toggleRow,
    handleBulkDelete,
    createDeleteHandler,
  };
}
