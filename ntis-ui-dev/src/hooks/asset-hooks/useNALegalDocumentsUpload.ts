/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from "react";

import { toast } from "sonner";
import { saveDocumentWithUploadAction, deleteUploadedDocAction } from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions/documents.actions";
import { AssetDocumentDefinitionDto, AssetDocumentDto } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/asset-document.service";
import { DocumentUploadState } from "@/types/asset/legal-compliance.types";

interface UseNALegalDocumentsUploadDeps {
  formData: any;
  definitions: AssetDocumentDefinitionDto[];
  uploadStates: Record<number, DocumentUploadState>;
  setUploadStates: React.Dispatch<React.SetStateAction<Record<number, DocumentUploadState>>>;
  setStagedFiles?: (updater: (prev: any) => any) => void;
  t: (key: string, args?: any) => string;
}

export function useNALegalDocumentsUpload({
  formData, definitions, uploadStates, setUploadStates, setStagedFiles, t,
}: UseNALegalDocumentsUploadDeps) {
  // const router = useRouter();

  const handleFileSelect = useCallback(async (definitionId: number, file: File) => {
    const assetId = formData.assetId || formData.id || 0;
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

    const allowedExts = (definition.allowedExtensions || "").toLowerCase().split(",").map(e => e.trim());
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
    if (allowedExts.length > 0 && allowedExts[0] !== "" && !allowedExts.includes(`.${fileExt}`) && !allowedExts.includes(fileExt)) {
      setUploadStates(prev => ({
        ...prev,
        [definitionId]: { ...prev[definitionId], status: "error", error: t("compliance.card.allowedExtensions", { extensions: definition.allowedExtensions }) || `File type not allowed. Allowed: ${definition.allowedExtensions}` }
      }));
      return;
    }

    const existingDoc = uploadStates[definitionId]?.uploadedDoc;

    // Mark as uploading
    setUploadStates(prev => ({
      ...prev,
      [definitionId]: { definitionId, status: "uploading", file, uploadedDoc: existingDoc, error: undefined }
    }));

    try {
      const formDataPayload = new FormData();
      formDataPayload.append("DocumentFile", file);
      formDataPayload.append("AssetId", assetId.toString());
      formDataPayload.append("DocumentDefinitionId", definitionId.toString());
      formDataPayload.append("Remarks", definition.documentName);
      const existingDoc = uploadStates[definitionId]?.uploadedDoc as any;
      const docId = existingDoc?.id || existingDoc?.documentId;
      if (docId) {
        formDataPayload.append("ExistingDocumentId", docId.toString());
      }

      const response = await saveDocumentWithUploadAction(formDataPayload);

      if (response.success && response.data) {
        toast.success(t("compliance.toasts.uploadSuccess") || "Document uploaded successfully.");
        setUploadStates(prev => {
          return { ...prev, [definitionId]: { definitionId, status: "uploaded", file: undefined, uploadedDoc: response.data as AssetDocumentDto, error: undefined } };
        });
      } else {
        toast.error(t("compliance.toasts.uploadFailed", { error: response.error }) || response.error || "Failed to upload document.");
        setUploadStates(prev => ({
          ...prev,
          [definitionId]: { ...prev[definitionId], status: "error", error: response.error || "Failed to upload document." }
        }));
      }
    } catch (err: any) {
      toast.error(t("compliance.toasts.uploadFailed", { error: err.message }) || "An error occurred during upload.");
      setUploadStates(prev => ({
        ...prev,
        [definitionId]: { ...prev[definitionId], status: "error", error: err.message || "An error occurred during upload." }
      }));
    }
  }, [formData.assetId, formData.id, definitions, t, uploadStates, setUploadStates]);

  const handleDelete = useCallback(async (definitionId: number) => {
    const existing = uploadStates[definitionId];
    const uploadedDoc = existing?.uploadedDoc as any;
    const docId = uploadedDoc?.id || uploadedDoc?.documentId || uploadedDoc?.documentBindingId || uploadedDoc?.coreDocumentId;

    if (docId) {
      setUploadStates(prev => ({
        ...prev,
        [definitionId]: { ...prev[definitionId], status: "uploading" }
      }));

      try {
        const response = await deleteUploadedDocAction(docId);
        if (uploadedDoc?.documentBindingId && uploadedDoc.documentBindingId !== docId) {
          await deleteUploadedDocAction(uploadedDoc.documentBindingId).catch(() => {});
        }
        if (uploadedDoc?.id && uploadedDoc.id !== docId) {
          await deleteUploadedDocAction(uploadedDoc.id).catch(() => {});
        }
        const isNotFound = response.statusCode === 404 || response.error?.toLowerCase().includes("not found");
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
      } catch (err: any) {
        toast.error(t("compliance.toasts.deleteFailed", { error: err.message }) || "An error occurred during deletion.");
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
