/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useNAAssetForm } from "@/components/modules/assets/municipal-Asset/NewAddNewAsset/NAAssetFormContext";
import { AssetDocumentDefinitionDto, AssetDocumentDto } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/asset-document.service";
import { DocumentUploadState } from "@/types/asset/legal-compliance.types";
import { useNALegalDocumentsView } from "./useNALegalDocumentsView";
import { useNALegalDocumentsUpload } from "./useNALegalDocumentsUpload";
import { fetchDocumentDefinitionsAction, fetchUploadedDocumentsAction, deleteUploadedDocAction, saveDocumentWithUploadAction } from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions/documents.actions";
import { useRouter } from "next/navigation";

export function useNALegalDocuments(
  t: (key: string, args?: any) => string
) {
  const router = useRouter();
  const { formData, registerSubmitHook, stagedFiles, setStagedFiles, setIsDataLoading } = useNAAssetForm();
  
  const categoryId = Number(formData.categoryId) || 0;
  const typeId = Number(formData.typeId) || 0;
  const assetId = Number(formData.id || formData.assetId) || 0;

  const [definitions, setDefinitions] = useState<AssetDocumentDefinitionDto[]>([]);
  const [uploadStates, setUploadStates] = useState<Record<number, DocumentUploadState>>({});
  const [otherDocuments, setOtherDocuments] = useState<AssetDocumentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingDocId, setViewingDocId] = useState<number | null>(null);
  const [isAdHocUploading, setIsAdHocUploading] = useState(false);

  const { handleView: handleViewBase } = useNALegalDocumentsView(t);
  const handleView = useCallback(
    (defId: number, state?: DocumentUploadState) => handleViewBase(defId, state, setViewingDocId),
    [handleViewBase]
  );

  const { handleFileSelect, handleDelete } = useNALegalDocumentsUpload({
    formData, definitions, uploadStates, setUploadStates, setStagedFiles, t,
  });

  const triggerReload = useCallback(async () => {
    if (assetId <= 0) return;
    try {
      const docRes = await fetchUploadedDocumentsAction(assetId, true, true);
      if (docRes.success && docRes.data) {
        const docs: AssetDocumentDto[] = docRes.data;
        
        // Update otherDocuments (ad-hoc)
        const defIds = new Set(definitions.map(d => d.id));
        const adhocDocs = docs.filter(doc => !defIds.has(doc.documentDefinitionId ?? (doc as any).DocumentDefinitionId));
        setOtherDocuments(adhocDocs);

        // Update uploadStates (definition based)
        setUploadStates((prev) => {
          const states = { ...prev };
          definitions.forEach(def => {
            const matchedDoc = docs.find(doc => (doc.documentDefinitionId ?? (doc as any).DocumentDefinitionId) === def.id);
            if (matchedDoc) {
              states[def.id] = {
                definitionId: def.id,
                status: "uploaded",
                uploadedDoc: matchedDoc
              };
            } else if (!stagedFiles || !stagedFiles[def.id]) {
              states[def.id] = {
                definitionId: def.id,
                status: "pending"
              };
            }
          });
          return states;
        });
      }
    } catch (e) {
      console.error("Failed to reload documents:", e);
    }
  }, [assetId, definitions, stagedFiles]);

  // Load definitions and uploaded documents dynamically
  useEffect(() => {
    if (!categoryId || !typeId) {
      setTimeout(() => { setLoading(false); }, 0);
      return;
    }
    
    let isMounted = true;
    async function loadDocs() {
      setLoading(true);
      setError(null);
      try {
        const [defRes, docRes] = await Promise.all([
          fetchDocumentDefinitionsAction(categoryId, typeId),
          assetId > 0 ? fetchUploadedDocumentsAction(assetId, true, true) : Promise.resolve({ success: true, data: [] })
        ]);
        
        if (!isMounted) return;
        
        if (defRes.success) {
          const defs = defRes.data || [];
          setDefinitions(defs);
          
          const defIds = new Set(defs.map((d: any) => d.id));
          const docs: AssetDocumentDto[] = docRes.data || [];
          
          // Separate ad-hoc documents
          const adhocDocs = docs.filter(doc => !defIds.has(doc.documentDefinitionId ?? (doc as any).DocumentDefinitionId));
          setOtherDocuments(adhocDocs);
          
          setUploadStates((_prev) => {
            const states: Record<number, DocumentUploadState> = {};
            defs.forEach((def: any) => {
              if (stagedFiles && stagedFiles[def.id]) {
                states[def.id] = { definitionId: def.id, status: "uploaded", file: stagedFiles[def.id].file };
              } else {
                states[def.id] = { definitionId: def.id, status: "pending" };
              }
            });
            
            docs.forEach(doc => {
              const docDefId = Number(doc.documentDefinitionId ?? (doc as any).DocumentDefinitionId) || 0;
              if (docDefId && states[docDefId]) {
                states[docDefId] = {
                  definitionId: docDefId,
                  status: "uploaded",
                  uploadedDoc: doc
                };
              }
            });
            return states;
          });
        } else {
          setError(defRes.error || "Failed to fetch document definitions");
        }
      } catch (err: any) {
        setError(err.message || "An error occurred while loading documents");
      } finally {
        if (isMounted) {
          setLoading(false);
          if (setIsDataLoading) setIsDataLoading(false);
        }
      }
    }
    
    loadDocs();
    return () => {
      isMounted = false;
    };
  }, [categoryId, typeId, assetId, setIsDataLoading, stagedFiles]);

  // Ad-hoc upload function
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
    } catch (err: any) {
      toast.error(err.message || "An error occurred during upload.");
    } finally {
      setIsAdHocUploading(false);
    }
  }, [assetId, t, triggerReload, router]);

  // Ad-hoc delete function
  const handleAdHocDelete = useCallback(async (docId: number) => {
    try {
      const response = await deleteUploadedDocAction(docId);
      const isNotFound = response.statusCode === 404 || response.error?.toLowerCase().includes("not found");
      if (response.success || isNotFound) {
        toast.success(t("compliance.toasts.deleteSuccess") || "Document deleted successfully.");
        await triggerReload();
      } else {
        toast.error(response.error || "Failed to delete document.");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred during deletion.");
    }
  }, [t, triggerReload]);

  // Download function for definition-based documents
  const handleDownload = useCallback(async (_defId: number, state?: DocumentUploadState) => {
    if (!state) return;
    const uploadedDoc = state.uploadedDoc as any;
    const docGuid = uploadedDoc?.documentGuid;
    const docId = uploadedDoc?.id || uploadedDoc?.documentId;

    if (docGuid || docId) {
      try {
        let result;
        if (docGuid) {
          const { fetchAssetDocumentFileByGuid } = await import("@/app/[locale]/assets/municipal-Asset/asset-detail/actions");
          result = await fetchAssetDocumentFileByGuid(docGuid, 'download');
        } else {
          const { fetchAssetDocumentFile } = await import("@/app/[locale]/assets/municipal-Asset/asset-detail/actions");
          result = await fetchAssetDocumentFile(docId);
        }

        if (result.error || !result.base64) throw new Error(result.error || "Unable to download document.");
        const binaryStr = atob(result.base64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
        const blob = new Blob([bytes], { type: result.contentType });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = uploadedDoc?.fileName || "document";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err: any) {
        toast.error(err.message || t("compliance.toasts.downloadFailed") || "Failed to download document.");
      }
    }
  }, [t]);

  // Download function for ad-hoc documents
  const handleAdHocDownload = useCallback(async (doc: AssetDocumentDto) => {
    const docGuid = (doc as any).documentGuid;
    const docId = doc.id;
    if (docGuid || docId) {
      try {
        let result;
        if (docGuid) {
          const { fetchAssetDocumentFileByGuid } = await import("@/app/[locale]/assets/municipal-Asset/asset-detail/actions");
          result = await fetchAssetDocumentFileByGuid(docGuid, 'download');
        } else {
          const { fetchAssetDocumentFile } = await import("@/app/[locale]/assets/municipal-Asset/asset-detail/actions");
          result = await fetchAssetDocumentFile(docId);
        }

        if (result.error || !result.base64) throw new Error(result.error || "Unable to download document.");
        const binaryStr = atob(result.base64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
        const blob = new Blob([bytes], { type: result.contentType });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = doc.fileName || "document";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err: any) {
        toast.error(err.message || t("compliance.toasts.downloadFailed") || "Failed to download document.");
      }
    }
  }, [t]);

  // Ad-hoc view function
  const handleAdHocView = useCallback(async (doc: AssetDocumentDto) => {
    const docGuid = (doc as any).documentGuid;
    const docId = doc.id;
    if (docGuid || docId) {
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
      const missingRequired = definitions.filter(def => {
        if (!def.isRequired) return false;
        const localState = uploadStates[def.id];
        return !(localState && (localState.status === "uploaded" || localState.status === "uploading" || localState.uploadedDoc !== undefined));
      });

      if (missingRequired.length > 0) {
        toast.error(t("compliance.toasts.missingRequired", { missing: missingRequired.map(d => d.documentName).join(", ") }) || `Please upload all required compliance documents: ${missingRequired.map(d => d.documentName).join(", ")}`);
        return false;
      }
      return true;
    } catch (_err) {
      toast.error(t("compliance.toasts.validationFailed") || "An unexpected error occurred during document validation.");
      return false;
    }
  }, [formData, uploadStates, definitions, t]);

  useEffect(() => {
    if (registerSubmitHook) registerSubmitHook(handleStepSubmit);
    return () => { if (registerSubmitHook) registerSubmitHook(null); };
  }, [registerSubmitHook, handleStepSubmit]);

  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  return {
    definitions, uploadStates, otherDocuments, loading, error, fileInputRefs, viewingDocId, isAdHocUploading,
    handleView, handleDownload, handleFileSelect, handleDelete, handleAdHocUpload, handleAdHocDelete, handleAdHocView, handleAdHocDownload, formData
  };
}
