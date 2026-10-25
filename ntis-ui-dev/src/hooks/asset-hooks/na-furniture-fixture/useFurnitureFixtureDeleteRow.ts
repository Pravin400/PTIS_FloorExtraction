/* eslint-disable @typescript-eslint/no-explicit-any */
import { InventoryRow } from "@/types/asset/furniture-fixture.types";
import {
  deleteInventoryBatchAction,
  fetchInventoryDocumentsAction,
  deleteInventoryDocumentAction,
} from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/furniture-fixture/actions";
import { useConfirm } from "@/components/common";

interface DeleteRowDeps {
  rows: InventoryRow[];
  setRows: React.Dispatch<React.SetStateAction<InventoryRow[]>>;
  setIsSaving: (v: boolean) => void;
  setSaveError: (e: string) => void;
  editingId: number | null;
  resetEditForm: () => void;
  reloadDataFromServer: () => Promise<void>;
}

export function useFurnitureFixtureDeleteRow(deps: DeleteRowDeps) {
  const { rows, setRows, setIsSaving, setSaveError, editingId, resetEditForm, reloadDataFromServer } = deps;
  const { confirm } = useConfirm();

  const handleDeleteRow = async (id: number) => {
    const row = rows.find(r => r.id === id);
    confirm({
      variant: "delete", title: "Delete Inventory Row",
      description: row?.isRegistered ? "Permanently delete from database?" : "Are you sure?",
      confirmText: "Delete", cancelText: "Cancel",
      onConfirm: async () => {
        if (row?.batchId && row?.isRegistered) {
          setIsSaving(true);
          try {
            if (row.photoName || row.invoice?.invoiceFileName) {
              const docsRes = await fetchInventoryDocumentsAction(row.batchId).catch(() => null);
              if (docsRes?.success && docsRes.data) {
                for (const d of docsRes.data) {
                  const docId = d.inventoryDocumentId || d.InventoryDocumentId || d.documentId;
                  if (docId) await deleteInventoryDocumentAction(docId).catch(() => { });
                }
              }
            }
            const res = await deleteInventoryBatchAction(row.batchId);
            if (!res.success) { setSaveError(res.error || "Failed to delete"); setIsSaving(false); return; }
            await reloadDataFromServer();
          } catch (err: any) { setSaveError(err.message || "Failed"); }
          setIsSaving(false);
        } else {
          setRows((prev) => prev.filter((r) => r.id !== id));
        }
        if (editingId === id) resetEditForm();
      }
    });
  };

  return { handleDeleteRow };
}
