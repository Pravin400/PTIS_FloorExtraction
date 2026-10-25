import { useCallback } from "react";
import { toast } from "sonner";
import type { DocumentUploadState } from "@/types/asset/municipal-Asset/new-add-new-asset/ownership.types";
import { openBase64FileInNewTab } from "@/lib/utils/asset-utils/new-add-new-asset/ownershipUtils";
import {
  fetchAssetDocumentFileAction,
  fetchAssetDocumentFileByGuidAction,
} from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/ownership/action";

export function useNALegalDocumentsView(t: (key: string, args?: Record<string, unknown>) => string) {
  const handleView = useCallback(async (definitionId: number, state?: DocumentUploadState, setViewingDocId?: (id: number | null) => void) => {
    if (!state) return;
    if (state.file) {
      try {
        const fileUrl = URL.createObjectURL(state.file);
        const opened = window.open(fileUrl, "_blank", "noopener,noreferrer");
        if (!opened) {
          const link = document.createElement("a");
          link.href = fileUrl;
          link.target = "_blank";
          link.rel = "noopener,noreferrer";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        setTimeout(() => URL.revokeObjectURL(fileUrl), 60_000);
      } catch {
        toast.error(t("compliance.toasts.previewFailed") || "Failed to open local file preview.");
      }
      return;
    }
    const uploadedDoc = state.uploadedDoc;
    const rawDoc = uploadedDoc as unknown as Record<string, unknown> | undefined;
    const docGuid = uploadedDoc?.documentGuid || rawDoc?.DocumentGuid || rawDoc?.guid || rawDoc?.Guid;
    const docId = uploadedDoc?.id || rawDoc?.Id || rawDoc?.assetDocumentId || rawDoc?.AssetDocumentId || rawDoc?.documentId || rawDoc?.DocumentId || rawDoc?.documentBindingId || rawDoc?.DocumentBindingId;

    const isValidGuid = typeof docGuid === "string" && docGuid.trim().length > 5 && docGuid !== "00000000-0000-0000-0000-000000000000";

    if (isValidGuid || docId) {
      setViewingDocId?.(definitionId);
      try {
        let result: { base64?: string; contentType?: string; error?: string | null } | undefined;
        if (isValidGuid) {
          result = await fetchAssetDocumentFileByGuidAction(docGuid, 'view');
        }
        if ((!result || result.error || !result.base64) && docId) {
          result = await fetchAssetDocumentFileAction(docId as number | string);
        }

        if (!result || result.error || !result.base64) throw new Error(result?.error || "Unable to load document file.");
        openBase64FileInNewTab(result.base64, result.contentType || "application/pdf");
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : t("compliance.toasts.downloadFailed") || "Failed to download document for viewing.";
        toast.error(errMsg);
      } finally {
        setViewingDocId?.(null);
      }
    }
  }, [t]);

  return { handleView };
}
