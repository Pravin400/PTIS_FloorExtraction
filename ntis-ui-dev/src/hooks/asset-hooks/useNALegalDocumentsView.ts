/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from "react";
import { toast } from "sonner";
import { DocumentUploadState } from "@/types/asset/legal-compliance.types";

/** Opens a staged (local File) or already-uploaded document for viewing. */
export function useNALegalDocumentsView(t: (key: string, args?: any) => string) {
  const handleView = useCallback(async (definitionId: number, state?: DocumentUploadState, setViewingDocId?: (id: number | null) => void) => {
    if (!state) return;
    if (state.file) {
      try {
        window.open(URL.createObjectURL(state.file), "_blank");
      } catch (_err) {
        toast.error(t("compliance.toasts.previewFailed") || "Failed to open local file preview.");
      }
      return;
    }
    const uploadedDoc = state.uploadedDoc as any;
    const docGuid = uploadedDoc?.documentGuid;
    const docId = uploadedDoc?.id || uploadedDoc?.documentId;

    if (docGuid || docId) {
      setViewingDocId?.(definitionId);
      try {
        let result;

        if (docGuid) {
          const { fetchAssetDocumentFileByGuid } = await import("@/app/[locale]/assets/municipal-Asset/asset-detail/actions");
          result = await fetchAssetDocumentFileByGuid(docGuid, 'view');
        } else {
          const { fetchAssetDocumentFile } = await import("@/app/[locale]/assets/municipal-Asset/asset-detail/actions");
          result = await fetchAssetDocumentFile(docId);
        }

        if (result.error || !result.base64) throw new Error(result.error || "Unable to load document file.");
        const binaryStr = atob(result.base64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
        const blob = new Blob([bytes], { type: result.contentType });
        window.open(URL.createObjectURL(blob), "_blank");
      } catch (err: any) {
        toast.error(err.message || t("compliance.toasts.downloadFailed") || "Failed to download document for viewing.");
      } finally {
        setViewingDocId?.(null);
      }
    }
  }, [t]);

  return { handleView };
}
