/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { toast } from "sonner";
import { useNAAssetForm } from "@/components/modules/assets/municipal-Asset/NewAddNewAsset/NAAssetFormContext";
import { AssetDocumentDefinitionDto, AssetDocumentDto } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/asset-document.service";
import { DocumentUploadState } from "@/types/asset/legal-compliance.types";
import {
  fetchDocumentDefinitionsAction,
  fetchUploadedDocumentsAction,
  saveDocumentWithUploadAction,
  deleteUploadedDocAction,
} from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions/documents.actions";

export function formatBytes(bytes: number, decimals = 2) {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function useSubUnitDocuments(formData: any, t: any) {
  const { formData: globalFormData } = useNAAssetForm();

  const subUnitAssetId = Number(
    formData?.assetId ??
    formData?.AssetId ??
    formData?.dbId ??
    formData?.id ??
    (formData as any)?.subUnitsDetailsId ??
    (formData as any)?.SubUnitsDetailsId ??
    0
  );

  const categoryId = Number(
    formData?.categoryId ??
    formData?.assetCategoryId ??
    globalFormData?.categoryId ??
    globalFormData?.category ??
    1
  );

  const typeId = Number(
    formData?.typeId ??
    formData?.assetTypeId ??
    globalFormData?.typeId ??
    globalFormData?.assetType ??
    2
  );

  const [definitions, setDefinitions] = useState<AssetDocumentDefinitionDto[]>([]);
  const [uploadStates, setUploadStates] = useState<Record<number, DocumentUploadState>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingDocId, setViewingDocId] = useState<number | null>(null);
  const [uploadingDefId, setUploadingDefId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const reloadDocuments = useCallback(async () => {
    if (subUnitAssetId <= 0) return;
    try {
      const docRes = await fetchUploadedDocumentsAction(subUnitAssetId, true, true);
      if (docRes.success && docRes.data) {
        const docs: AssetDocumentDto[] = docRes.data;
        setUploadStates((prev) => {
          const states = { ...prev };
          definitions.forEach((def) => {
            const matchedDoc = docs.find((doc) => doc.documentDefinitionId === def.id);
            if (matchedDoc) {
              states[def.id] = {
                definitionId: def.id,
                status: "uploaded",
                uploadedDoc: matchedDoc,
              };
            } else {
              states[def.id] = {
                definitionId: def.id,
                status: "pending",
              };
            }
          });
          return states;
        });
      }
    } catch (e) {
      console.error("Failed to reload unit documents:", e);
    }
  }, [subUnitAssetId, definitions]);

  // Load document definitions & uploaded unit documents dynamically
  useEffect(() => {
    let isMounted = true;
    async function loadUnitDocs() {
      setLoading(true);
      setError(null);
      try {
        const [defRes, docRes] = await Promise.all([
          fetchDocumentDefinitionsAction(categoryId, typeId),
          subUnitAssetId > 0
            ? fetchUploadedDocumentsAction(subUnitAssetId, true, true)
            : Promise.resolve({ success: true, data: [] }),
        ]);

        if (!isMounted) return;

        if (defRes.success) {
          const defs: AssetDocumentDefinitionDto[] = defRes.data || [];
          setDefinitions(defs);

          const docs: AssetDocumentDto[] = docRes.data || [];
          const states: Record<number, DocumentUploadState> = {};

          defs.forEach((def) => {
            const matchedDoc = docs.find((doc) => (doc.documentDefinitionId ?? (doc as any).DocumentDefinitionId) === def.id);
            if (matchedDoc) {
              states[def.id] = {
                definitionId: def.id,
                status: "uploaded",
                uploadedDoc: matchedDoc,
              };
            } else {
              states[def.id] = {
                definitionId: def.id,
                status: "pending",
              };
            }
          });

          setUploadStates(states);
        } else {
          setError(defRes.error || "Failed to fetch document definitions");
        }
      } catch (err: any) {
        setError(err.message || "An error occurred while loading documents");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadUnitDocs();
    return () => {
      isMounted = false;
    };
  }, [categoryId, typeId, subUnitAssetId]);

  // Upload/replace document against subUnitAssetId
  const handleFileSelect = useCallback(
    async (definitionId: number, file: File) => {
      if (!subUnitAssetId || subUnitAssetId <= 0) {
        toast.error(
          t?.has?.("compliance.toasts.assetNotSaved")
            ? t("compliance.toasts.assetNotSaved")
            : "Unit must be saved first before uploading documents."
        );
        return;
      }

      const definition = definitions.find((d) => d.id === definitionId);
      if (!definition) return;

      const maxSizeBytes = (definition.maxFileSizeMB || 10) * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        setUploadStates((prev) => ({
          ...prev,
          [definitionId]: {
            ...prev[definitionId],
            status: "error",
            error: `File size exceeds ${definition.maxFileSizeMB}MB limit`,
          },
        }));
        toast.error(`File size exceeds ${definition.maxFileSizeMB}MB limit`);
        return;
      }

      const allowedExts = (definition.allowedExtensions || "")
        .toLowerCase()
        .split(",")
        .map((e) => e.trim());
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
      if (
        allowedExts.length > 0 &&
        allowedExts[0] !== "" &&
        !allowedExts.includes(`.${fileExt}`) &&
        !allowedExts.includes(fileExt)
      ) {
        setUploadStates((prev) => ({
          ...prev,
          [definitionId]: {
            ...prev[definitionId],
            status: "error",
            error: `File type not allowed. Allowed: ${definition.allowedExtensions}`,
          },
        }));
        toast.error(`File type not allowed. Allowed: ${definition.allowedExtensions}`);
        return;
      }

      const existingDoc = uploadStates[definitionId]?.uploadedDoc;

      // Mark as uploading
      setUploadStates((prev) => ({
        ...prev,
        [definitionId]: {
          definitionId,
          status: "uploading",
          file,
          uploadedDoc: existingDoc,
          error: undefined,
        },
      }));

      try {
        const formDataPayload = new FormData();
        formDataPayload.append("DocumentFile", file);
        formDataPayload.append("AssetId", subUnitAssetId.toString());
        formDataPayload.append("DocumentDefinitionId", definitionId.toString());
        formDataPayload.append("Remarks", definition.documentName);

        const docId = (existingDoc as any)?.id || (existingDoc as any)?.documentId;
        if (docId) {
          formDataPayload.append("ExistingDocumentId", docId.toString());
        }

        const response = await saveDocumentWithUploadAction(formDataPayload);

        if (response.success && response.data) {
          toast.success(
            t?.has?.("compliance.toasts.uploadSuccess")
              ? t("compliance.toasts.uploadSuccess")
              : "Document uploaded successfully."
          );
          setUploadStates((prev) => ({
            ...prev,
            [definitionId]: {
              definitionId,
              status: "uploaded",
              file: undefined,
              uploadedDoc: response.data as AssetDocumentDto,
              error: undefined,
            },
          }));
          await reloadDocuments();
        } else {
          toast.error(response.error || "Failed to upload document.");
          setUploadStates((prev) => ({
            ...prev,
            [definitionId]: {
              ...prev[definitionId],
              status: "error",
              error: response.error || "Failed to upload document.",
            },
          }));
        }
      } catch (err: any) {
        toast.error(err.message || "An error occurred during upload.");
        setUploadStates((prev) => ({
          ...prev,
          [definitionId]: {
            ...prev[definitionId],
            status: "error",
            error: err.message || "An error occurred during upload.",
          },
        }));
      }
    },
    [subUnitAssetId, definitions, uploadStates, reloadDocuments, t]
  );

  // Delete document
  const handleDelete = useCallback(
    async (definitionId: number) => {
      const existing = uploadStates[definitionId];
      const uploadedDoc = existing?.uploadedDoc as any;
      const docId =
        uploadedDoc?.id ||
        uploadedDoc?.documentId ||
        uploadedDoc?.documentBindingId ||
        uploadedDoc?.coreDocumentId;

      if (docId) {
        setUploadStates((prev) => ({
          ...prev,
          [definitionId]: { ...prev[definitionId], status: "uploading" },
        }));

        try {
          const response = await deleteUploadedDocAction(docId);
          const isNotFound =
            response.statusCode === 404 ||
            response.error?.toLowerCase().includes("not found");
          if (response.success || isNotFound) {
            toast.success(
              t?.has?.("compliance.toasts.deleteSuccess")
                ? t("compliance.toasts.deleteSuccess")
                : "Document deleted successfully."
            );
          } else {
            toast.error(response.error || "Failed to delete document.");
            setUploadStates((prev) => ({
              ...prev,
              [definitionId]: { ...existing },
            }));
            return;
          }
        } catch (err: any) {
          toast.error(err.message || "An error occurred during deletion.");
          setUploadStates((prev) => ({
            ...prev,
            [definitionId]: { ...existing },
          }));
          return;
        }
      }

      setUploadStates((prev) => ({
        ...prev,
        [definitionId]: {
          definitionId,
          status: "pending",
          file: undefined,
          uploadedDoc: undefined,
          error: undefined,
        },
      }));
    },
    [uploadStates, t]
  );

  // View document
  const handleView = useCallback(
    async (definitionId: number, state?: DocumentUploadState) => {
      if (!state) return;
      const uploadedDoc = state.uploadedDoc as any;
      const docGuid = uploadedDoc?.documentGuid;
      const docId = uploadedDoc?.id || uploadedDoc?.documentId;

      if (docGuid || docId) {
        setViewingDocId(definitionId);
        try {
          let result: any;
          if (docGuid) {
            const { fetchAssetDocumentFileByGuid } = await import(
              "@/app/[locale]/assets/municipal-Asset/asset-detail/actions"
            );
            result = await fetchAssetDocumentFileByGuid(docGuid, "view");
          } else {
            const { fetchAssetDocumentFile } = await import(
              "@/app/[locale]/assets/municipal-Asset/asset-detail/actions"
            );
            result = await fetchAssetDocumentFile(docId);
          }

          if (result.error || !result.base64) {
            throw new Error(result.error || "Unable to load document file.");
          }

          const binaryStr = atob(result.base64);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: result.contentType });
          window.open(URL.createObjectURL(blob), "_blank");
        } catch (err: any) {
          toast.error(err.message || "Failed to load document for viewing.");
        } finally {
          setViewingDocId(null);
        }
      }
    },
    []
  );

  // Download document
  const handleDownload = useCallback(
    async (_definitionId: number, state?: DocumentUploadState) => {
      if (!state) return;
      const uploadedDoc = state.uploadedDoc as any;
      const docGuid = uploadedDoc?.documentGuid;
      const docId = uploadedDoc?.id || uploadedDoc?.documentId;

      if (docGuid || docId) {
        try {
          let result: any;
          if (docGuid) {
            const { fetchAssetDocumentFileByGuid } = await import(
              "@/app/[locale]/assets/municipal-Asset/asset-detail/actions"
            );
            result = await fetchAssetDocumentFileByGuid(docGuid, "download");
          } else {
            const { fetchAssetDocumentFile } = await import(
              "@/app/[locale]/assets/municipal-Asset/asset-detail/actions"
            );
            result = await fetchAssetDocumentFile(docId);
          }

          if (result.error || !result.base64) {
            throw new Error(result.error || "Unable to download document.");
          }

          const binaryStr = atob(result.base64);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: result.contentType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = uploadedDoc?.fileName || "unit_document";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch (err: any) {
          toast.error(err.message || "Failed to download document.");
        }
      }
    },
    []
  );

  // Pagination & Sorting
  const sortedDefinitions = useMemo(() => {
    return [...definitions].sort((a, b) => {
      if (a.isRequired && !b.isRequired) return -1;
      if (!a.isRequired && b.isRequired) return 1;
      return a.displayOrder - b.displayOrder;
    });
  }, [definitions]);

  const PAGE_SIZE = 4;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(sortedDefinitions.length / PAGE_SIZE) || 1;

  const paginatedDefinitions = useMemo(() => {
    return sortedDefinitions.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE
    );
  }, [sortedDefinitions, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [sortedDefinitions.length, totalPages, currentPage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingDefId) {
      handleFileSelect(uploadingDefId, file);
      setUploadingDefId(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return {
    definitions,
    sortedDefinitions,
    uploadStates,
    loading,
    error,
    viewingDocId,
    uploadingDefId,
    setUploadingDefId,
    fileInputRef,
    handleFileChange,
    handleView,
    handleDownload,
    handleDelete,
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedDefinitions,
    PAGE_SIZE,
    subUnitAssetId,
  };
}
