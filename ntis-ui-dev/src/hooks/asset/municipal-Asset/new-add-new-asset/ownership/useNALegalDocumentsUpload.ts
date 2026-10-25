import { useCallback } from "react";
import { toast } from "sonner";
import { deleteUploadedDocAction, saveDocumentWithUploadAction } from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/ownership/action";
import type { AssetDocumentDefinitionDto, AssetDocumentDto, DocumentUploadState } from "@/types/asset/municipal-Asset/new-add-new-asset/ownership.types";

import type { AssetFormData } from "@/types/asset/municipal-Asset/new-add-new-asset/asset-wizard.types";
import type { AssetDocumentListItem } from "@/types/asset/municipal-Asset/new-add-new-asset/detail-tabs.types";

interface UseNALegalDocumentsUploadDeps {
  formData: AssetFormData;
  definitions: AssetDocumentDefinitionDto[];
  uploadStates: Record<number, DocumentUploadState>;
  setUploadStates: React.Dispatch<React.SetStateAction<Record<number, DocumentUploadState>>>;
  setStagedFiles?: React.Dispatch<React.SetStateAction<Record<number, { file: File; definition: AssetDocumentListItem }>>>;
  t: (key: string, args?: Record<string, unknown>) => string;
}

export function useNALegalDocumentsUpload({
  formData, definitions, uploadStates, setUploadStates, setStagedFiles, t,
}: UseNALegalDocumentsUploadDeps) {

  const handleFileSelect = useCallback(async (definitionId: number, file: File) => {
    const assetId = (formData.assetId as number) || (formData.id as number) || 0;
    if (!assetId || assetId === 0) {
      toast.error(t("compliance.toasts.assetNotSaved") || "Asset must be saved first before uploading documents.");
      return;
    }

    const definition = definitions.find(d => d.id === definitionId);
    if (!definition) return;

    const maxSizeBytes = definition.maxFileSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setUploadStates(prev => ({
        ...prev,
        [definitionId]: { ...prev[definitionId], status: "error", error: t("compliance.card.sizeExceeds", { size: definition.maxFileSizeMB }) || `File size exceeds ${definition.maxFileSizeMB}MB limit` }
      }));
      return;
    }

    const allowedExts = (definition.allowedExtensions || "").toLowerCase().split(",").map((e: string) => e.trim());
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
    if (allowedExts.length > 0 && allowedExts[0] !== "" && !allowedExts.includes(`.${fileExt}`) && !allowedExts.includes(fileExt)) {
      setUploadStates(prev => ({
        ...prev,
        [definitionId]: { ...prev[definitionId], status: "error", error: t("compliance.card.allowedExtensions", { extensions: definition.allowedExtensions }) || `File type not allowed. Allowed: ${definition.allowedExtensions}` }
      }));
      return;
    }

    const existingDoc = uploadStates[definitionId]?.uploadedDoc;

    setUploadStates(prev => ({
      ...prev,
      [definitionId]: { definitionId, status: "uploading", file, uploadedDoc: existingDoc, error: undefined }
    }));

    try {
      const formDataPayload = new FormData();
      formDataPayload.append("DocumentFile", file);
      formDataPayload.append("ModuleId", "2");
      formDataPayload.append("AssetId", assetId.toString());
      formDataPayload.append("DocumentDefinitionId", definitionId.toString());
      formDataPayload.append("Remarks", definition.documentName);
      
      const existingDocObj = uploadStates[definitionId]?.uploadedDoc;
      const rawExistingDoc = existingDocObj as unknown as Record<string, unknown> | undefined;
      const docId = existingDocObj?.id || rawExistingDoc?.Id || existingDocObj?.documentId || existingDocObj?.documentBindingId || existingDocObj?.coreDocumentId || existingDocObj?.assetDocumentId;
      if (docId) {
        formDataPayload.append("ExistingDocumentId", docId.toString());
        formDataPayload.append("Id", docId.toString());
        formDataPayload.append("AssetDocumentId", docId.toString());
        formDataPayload.append("id", docId.toString());
      }
      const existingGuid = existingDocObj?.documentGuid || rawExistingDoc?.DocumentGuid;
      if (existingGuid) {
        formDataPayload.append("DocumentGuid", String(existingGuid));
        formDataPayload.append("documentGuid", String(existingGuid));
      }

      const response = await saveDocumentWithUploadAction(formDataPayload);

      if (response.success && response.data) {
        toast.success(t("compliance.toasts.uploadSuccess") || "Document uploaded successfully.");
        const uploadedItem = (Array.isArray(response.data) ? response.data[0] : response.data) as AssetDocumentDto;
        setUploadStates(prev => ({
          ...prev,
          [definitionId]: { definitionId, status: "uploaded", file: undefined, uploadedDoc: uploadedItem, error: undefined }
        }));
      } else {
        toast.error(t("compliance.toasts.uploadFailed", { error: response.error }) || response.error || "Failed to upload document.");
        setUploadStates(prev => ({
          ...prev,
          [definitionId]: { ...prev[definitionId], status: "error", error: response.error || "Failed to upload document." }
        }));
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "An error occurred during upload.";
      toast.error(t("compliance.toasts.uploadFailed", { error: errMsg }) || errMsg);
      setUploadStates(prev => ({
        ...prev,
        [definitionId]: { ...prev[definitionId], status: "error", error: errMsg }
      }));
    }
  }, [formData.assetId, formData.id, definitions, t, uploadStates, setUploadStates]);

  const handleDelete = useCallback(async (definitionId: number) => {
    const existing = uploadStates[definitionId];
    const uploadedDoc = existing?.uploadedDoc;
    const docGuid = uploadedDoc?.documentGuid || uploadedDoc?.DocumentGuid;
    const docId = uploadedDoc?.id || uploadedDoc?.documentId || uploadedDoc?.documentBindingId || uploadedDoc?.coreDocumentId || uploadedDoc?.assetDocumentId;

    const target = docGuid || docId;
    if (target) {
      setUploadStates(prev => ({
        ...prev,
        [definitionId]: { ...prev[definitionId], status: "uploading" }
      }));

      try {
        let response = await deleteUploadedDocAction(target);
        if (!response.success && docId && target === docGuid) {
          response = await deleteUploadedDocAction(docId);
        }
        const respObj = response as { statusCode?: number };
        const isNotFound = respObj?.statusCode === 404 || response.error?.toLowerCase().includes("not found");
        if (response.success || isNotFound) {
          toast.success(t("compliance.toasts.deleteSuccess") || "Document deleted successfully.");
        } else {
          toast.error(t("compliance.toasts.deleteFailed", { error: response.error }) || response.error || "Failed to delete document.");
          setUploadStates(prev => ({
            ...prev,
            [definitionId]: { ...existing }
          }));
          return;
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "An error occurred during deletion.";
        toast.error(t("compliance.toasts.deleteFailed", { error: errMsg }) || errMsg);
        setUploadStates(prev => ({
          ...prev,
          [definitionId]: { ...existing }
        }));
        return;
      }
    }

    setUploadStates(prev => ({
      ...prev,
      [definitionId]: { definitionId, status: "pending", file: undefined, uploadedDoc: undefined, error: undefined }
    }));

    if (setStagedFiles) {
      setStagedFiles(prev => {
        const next = { ...prev };
        delete next[definitionId];
        return next;
      });
    }
  }, [uploadStates, setStagedFiles, t, setUploadStates]);

  return { handleFileSelect, handleDelete };
}
