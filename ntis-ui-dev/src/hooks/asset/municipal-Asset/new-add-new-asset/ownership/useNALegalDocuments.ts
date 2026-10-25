import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useNAAssetForm } from "@/components/modules/assets/municipal-Asset/NewAddNewAsset/NAAssetFormContext";
import type { AssetDocumentDto, DocumentUploadState } from "@/types/asset/municipal-Asset/new-add-new-asset/ownership.types";
import { useNALegalDocumentsFetch } from "./useNALegalDocumentsFetch";
import { useNALegalDocumentsView } from "./useNALegalDocumentsView";
import { useNALegalDocumentsUpload } from "./useNALegalDocumentsUpload";
import {
  openBase64FileInNewTab,
  downloadBase64File,
} from "@/lib/utils/asset-utils/new-add-new-asset/ownershipUtils";
import {
  saveDocumentWithUploadAction,
  deleteUploadedDocAction,
  fetchAssetDocumentFileAction,
  fetchAssetDocumentFileByGuidAction,
} from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/ownership/action";

export function useNALegalDocuments(t: (key: string, args?: Record<string, unknown>) => string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { formData, registerSubmitHook, stagedFiles, setStagedFiles, setIsDataLoading } = useNAAssetForm();

  const categoryId = Number(formData.categoryId || searchParams.get("categoryId") || searchParams.get("category") || 1) || 1;
  const typeId = Number(formData.typeId || searchParams.get("typeId") || searchParams.get("assetType") || 2) || 2;
  const assetId = Number(formData.id || formData.assetId || searchParams.get("id") || searchParams.get("assetId") || 0) || 0;

  const {
    definitions,
    uploadStates,
    setUploadStates,
    otherDocuments,
    loading,
    error,
    triggerReload,
  } = useNALegalDocumentsFetch({ categoryId, typeId, assetId, stagedFiles, setIsDataLoading });

  const [viewingDocId, setViewingDocId] = useState<number | null>(null);
  const [isAdHocUploading, setIsAdHocUploading] = useState(false);

  const { handleView: handleViewBase } = useNALegalDocumentsView(t);
  const handleView = useCallback(
    (definitionId: number, state?: DocumentUploadState) => handleViewBase(definitionId, state, setViewingDocId),
    [handleViewBase]
  );

  const { handleFileSelect, handleDelete } = useNALegalDocumentsUpload({
    formData, definitions, uploadStates, setUploadStates, setStagedFiles, t,
  });

  const handleAdHocUpload = useCallback(async (file: File) => {
    if (assetId === 0) {
      toast.error(t("compliance.toasts.assetNotSaved") || "Asset must be saved first before uploading documents.");
      return;
    }
    setIsAdHocUploading(true);
    try {
      const formDataPayload = new FormData();
      formDataPayload.append("DocumentFile", file);
      formDataPayload.append("AssetId", assetId.toString());
      formDataPayload.append("Remarks", file.name);

      const response = await saveDocumentWithUploadAction(formDataPayload);
      if (response.success) {
        toast.success(t("compliance.toasts.uploadSuccess") || "Document uploaded successfully.");
        await triggerReload();
        router.refresh();
      } else {
        toast.error(response.error || "Failed to upload document.");
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "An error occurred during upload.";
      toast.error(errMsg);
    } finally {
      setIsAdHocUploading(false);
    }
  }, [assetId, t, triggerReload, router]);

  const handleAdHocDelete = useCallback(async (docId: number) => {
    try {
      const response = await deleteUploadedDocAction(docId);
      const respObj = response as unknown as Record<string, unknown>;
      const isNotFound = respObj?.statusCode === 404 || response.error?.toLowerCase().includes("not found");
      if (response.success || isNotFound) {
        toast.success(t("compliance.toasts.deleteSuccess") || "Document deleted successfully.");
        await triggerReload();
      } else {
        toast.error(response.error || "Failed to delete document.");
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "An error occurred during deletion.";
      toast.error(errMsg);
    }
  }, [t, triggerReload]);

  const handleDownload = useCallback(async (_definitionId: number, state?: DocumentUploadState) => {
    if (!state) return;
    if (state.file) {
      const fileUrl = URL.createObjectURL(state.file);
      const a = document.createElement("a");
      a.href = fileUrl;
      a.download = state.file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(fileUrl), 60_000);
      return;
    }
    const uploadedDoc = state.uploadedDoc;
    const rawDoc = uploadedDoc as unknown as Record<string, unknown> | undefined;
    const docGuid = uploadedDoc?.documentGuid || rawDoc?.DocumentGuid || rawDoc?.guid || rawDoc?.Guid;
    const docId = uploadedDoc?.id || rawDoc?.Id || rawDoc?.assetDocumentId || rawDoc?.AssetDocumentId || rawDoc?.documentId || rawDoc?.DocumentId || rawDoc?.documentBindingId || rawDoc?.DocumentBindingId;
    const fileName = (uploadedDoc?.fileName as string) || (rawDoc?.fileName as string) || (uploadedDoc?.documentName as string) || (rawDoc?.documentName as string) || "document";

    const isValidGuid = typeof docGuid === "string" && docGuid.trim().length > 5 && docGuid !== "00000000-0000-0000-0000-000000000000";

    if (isValidGuid || docId) {
      try {
        let result: { base64?: string; contentType?: string; error?: string | null } | undefined;
        if (isValidGuid) {
          result = await fetchAssetDocumentFileByGuidAction(docGuid, 'download');
        }
        if ((!result || result.error || !result.base64) && docId) {
          result = await fetchAssetDocumentFileAction(docId as number | string);
        }

        if (!result || result.error || !result.base64) throw new Error(result?.error || "Unable to download document.");
        downloadBase64File(result.base64, result.contentType || "application/octet-stream", fileName);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : t("compliance.toasts.downloadFailed") || "Failed to download document.";
        toast.error(errMsg);
      }
    }
  }, [t]);

  const handleAdHocDownload = useCallback(async (doc: AssetDocumentDto) => {
    const rawDoc = doc as unknown as Record<string, unknown> | undefined;
    const docGuid = doc.documentGuid || rawDoc?.DocumentGuid || rawDoc?.guid;
    const docId = doc.id || rawDoc?.Id || doc.documentId || doc.assetDocumentId || rawDoc?.documentBindingId;
    const fileName = doc.fileName || (rawDoc?.fileName as string) || doc.documentName || (rawDoc?.documentName as string) || "document";
    const isValidGuid = typeof docGuid === "string" && docGuid.trim().length > 5 && docGuid !== "00000000-0000-0000-0000-000000000000";

    if (isValidGuid || docId) {
      try {
        let result: { base64?: string; contentType?: string; error?: string | null } | undefined;
        if (isValidGuid) {
          result = await fetchAssetDocumentFileByGuidAction(docGuid, 'download');
        }
        if ((!result || result.error || !result.base64) && docId) {
          result = await fetchAssetDocumentFileAction(docId as number | string);
        }

        if (!result || result.error || !result.base64) throw new Error(result?.error || "Unable to download document.");
        downloadBase64File(result.base64, result.contentType || "application/octet-stream", fileName);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : t("compliance.toasts.downloadFailed") || "Failed to download document.";
        toast.error(errMsg);
      }
    }
  }, [t]);

  const handleAdHocView = useCallback(async (doc: AssetDocumentDto) => {
    const rawDoc = doc as unknown as Record<string, unknown> | undefined;
    const docGuid = doc.documentGuid || rawDoc?.DocumentGuid || rawDoc?.guid;
    const docId = doc.id || rawDoc?.Id || doc.documentId || doc.assetDocumentId || rawDoc?.documentBindingId;
    const isValidGuid = typeof docGuid === "string" && docGuid.trim().length > 5 && docGuid !== "00000000-0000-0000-0000-000000000000";

    if (isValidGuid || docId) {
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
      }
    }
  }, [t]);

  const handleStepSubmit = useCallback(async (): Promise<boolean> => {
    const assetIdVal = formData.assetId || formData.id || 0;
    if (!assetIdVal || assetIdVal === 0) {
      toast.error(t("compliance.toasts.assetNotSaved") || "Asset must be saved first before uploading documents.");
      return false;
    }

    try {
      const missingRequired = definitions.filter((def) => {
        if (!def.isRequired) return false;
        const localState = uploadStates[def.id];
        return !(
          localState &&
          (localState.status === "uploaded" ||
            localState.status === "uploading" ||
            localState.uploadedDoc !== undefined)
        );
      });

      if (missingRequired.length > 0) {
        toast.error(
          t("compliance.toasts.missingRequired", {
            missing: missingRequired.map((d) => d.documentName).join(", "),
          }) ||
            `Please upload all required compliance documents: ${missingRequired
              .map((d) => d.documentName)
              .join(", ")}`
        );
        return false;
      }
      return true;
    } catch {
      toast.error(
        t("compliance.toasts.validationFailed") ||
          "An unexpected error occurred during document validation."
      );
      return false;
    }
  }, [formData, uploadStates, definitions, t]);

  const handleStepSubmitRef = useRef(handleStepSubmit);
  useEffect(() => {
    handleStepSubmitRef.current = handleStepSubmit;
  }, [handleStepSubmit]);

  const stableSubmitHook = useCallback(async () => {
    return handleStepSubmitRef.current();
  }, []);

  useEffect(() => {
    if (registerSubmitHook) registerSubmitHook(stableSubmitHook);
    return () => {
      if (registerSubmitHook) registerSubmitHook(null);
    };
  }, [registerSubmitHook, stableSubmitHook]);

  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  return {
    definitions,
    uploadStates,
    otherDocuments,
    loading,
    error,
    fileInputRefs,
    viewingDocId,
    isAdHocUploading,
    handleView,
    handleDownload,
    handleFileSelect,
    handleDelete,
    handleAdHocUpload,
    handleAdHocDelete,
    handleAdHocView,
    handleAdHocDownload,
    formData,
  };
}
