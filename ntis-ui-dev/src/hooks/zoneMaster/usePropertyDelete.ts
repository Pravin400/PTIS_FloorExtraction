import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useConfirm } from "@/components/common/ConfirmProvider";
import {
  deletePropertyAction,
  deleteBulkPropertiesAction,
} from "@/app/[locale]/property-tax/zone-master/actions";
import type { ZonePropertyItem } from "@/types/zone-master/properties/zoneProperty.types";

interface UsePropertyDeleteProps {
  /** Callback to clear selected rows after deletion */
  onClearSelection: () => void;
}

interface UsePropertyDeleteReturn {
  /** Whether a delete operation is in progress */
  isDeleting: boolean;
  /** Handler for deleting a single property */
  handleSingleDelete: (row: ZonePropertyItem) => void;
  /** Handler for deleting multiple properties in bulk */
  handleBulkDelete: (selectedIds: string[]) => void;
}

/**
 * Custom hook to handle property deletion operations (single and bulk).
 * Manages delete state, confirmation dialogs, and result toast notifications.
 * Follows common component patterns used across the application.
 */
export function usePropertyDelete({
  onClearSelection,
}: UsePropertyDeleteProps): UsePropertyDeleteReturn {
  const router = useRouter();
  const { confirm } = useConfirm();
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Handles deletion of a single property.
   */
  const handleSingleDelete = useCallback(
    (row: ZonePropertyItem) => {
      confirm({
        variant: "delete",
        title: "Delete Property",
        description: `Are you sure you want to delete property "${row.propertyNo}"? This action cannot be undone.`,
        meta: { id: row.id, name: row.propertyNo },
        onConfirm: async () => {
          setIsDeleting(true);
          try {
            const result = await deletePropertyAction(String(row.id));
            router.refresh();
            onClearSelection();
            
            if (result.success) {
              toast.success(result.message ?? "Property deleted successfully.");
            } else {
              toast.error(result.error ?? "Failed to delete property.");
            }
          } catch {
            toast.error("Failed to delete property.");
          } finally {
            setIsDeleting(false);
          }
        },
      });
    },
    [confirm, router, onClearSelection]
  );

  /**
   * Handles deletion of multiple properties in bulk.
   * IDs must be pre-sorted highest partition first by the caller so the backend's
   * partition-order constraint is satisfied.
   */
  const handleBulkDelete = useCallback(
    (selectedIds: string[]) => {
      const count = selectedIds.length;
      if (count === 0) return;

      confirm({
        variant: "delete",
        title: "Delete Selected Properties",
        description: `Are you sure you want to delete ${count} selected ${count === 1 ? "property" : "properties"}? This action cannot be undone.`,
        onConfirm: async () => {
          setIsDeleting(true);
          try {
            const result = await deleteBulkPropertiesAction(selectedIds);
            router.refresh();
            onClearSelection();

            if (result.success) {
              toast.success(result.message ?? `${count} properties deleted successfully.`);
            } else {
              toast.error(result.error ?? "Failed to delete selected properties.");
            }
          } catch {
            toast.error("Failed to delete selected properties.");
          } finally {
            setIsDeleting(false);
          }
        },
      });
    },
    [confirm, router, onClearSelection]
  );

  return {
    isDeleting,
    handleSingleDelete,
    handleBulkDelete,
  };
}
