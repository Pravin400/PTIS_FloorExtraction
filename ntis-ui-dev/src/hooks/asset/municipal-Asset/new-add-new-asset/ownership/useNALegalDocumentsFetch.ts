import { useState, useEffect, useCallback } from "react";
import type { AssetDocumentDefinitionDto, AssetDocumentDto, DocumentUploadState } from "@/types/asset/municipal-Asset/new-add-new-asset/ownership.types";
import { extractArrayItems } from "@/lib/utils/asset-utils/new-add-new-asset/ownershipUtils";
import {
  fetchDocumentDefinitionsAction,
  fetchUploadedDocumentsAction
} from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/ownership/action";

interface UseNALegalDocumentsFetchProps {
  categoryId: number;
  typeId: number;
  assetId: number;
  stagedFiles?: Record<number, { file: File }>;
  setIsDataLoading?: (loading: boolean) => void;
}

export function useNALegalDocumentsFetch({
  categoryId,
  typeId,
  assetId,
  stagedFiles,
  setIsDataLoading,
}: UseNALegalDocumentsFetchProps) {
  const [definitions, setDefinitions] = useState<AssetDocumentDefinitionDto[]>([]);
  const [uploadStates, setUploadStates] = useState<Record<number, DocumentUploadState>>({});
  const [otherDocuments, setOtherDocuments] = useState<AssetDocumentDto[]>([]);
  const [loading, setLoading] = useState(Boolean(categoryId && typeId));
  const [error, setError] = useState<string | null>(null);

  const triggerReload = useCallback(async () => {
    if (assetId <= 0) return;
    try {
      const docRes = await fetchUploadedDocumentsAction(assetId, true, true);
      if (docRes.success && docRes.data) {
        const docs = extractArrayItems<AssetDocumentDto>(docRes.data);
        const defIds = new Set(definitions.map((d) => d.id));
        const adhocDocs = docs.filter(
          (doc) => !defIds.has(doc.documentDefinitionId ?? doc.DocumentDefinitionId ?? 0)
        );
        setOtherDocuments(adhocDocs);

        setUploadStates((prev) => {
          const states = { ...prev };
          definitions.forEach((def) => {
            const matchedDoc = docs.find(
              (doc) => (doc.documentDefinitionId ?? doc.DocumentDefinitionId) === def.id
            );
            if (matchedDoc) {
              states[def.id] = { definitionId: def.id, status: "uploaded", uploadedDoc: matchedDoc };
            } else if (!stagedFiles || !stagedFiles[def.id]) {
              states[def.id] = { definitionId: def.id, status: "pending" };
            }
          });
          return states;
        });
      }
    } catch (e) {
      console.error("Failed to reload documents:", e);
    }
  }, [assetId, definitions, stagedFiles]);

  useEffect(() => {
    let isMounted = true;
    async function loadDocs() {
      if (!categoryId || !typeId) {
        if (isMounted) setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const [defRes, docRes] = await Promise.all([
          fetchDocumentDefinitionsAction(categoryId, typeId),
          assetId > 0 ? fetchUploadedDocumentsAction(assetId, true, true) : Promise.resolve({ success: true, data: [] }),
        ]);

        if (!isMounted) return;

        if (defRes.success) {
          const defs = extractArrayItems<AssetDocumentDefinitionDto>(defRes.data);
          setDefinitions(defs);

          const defIds = new Set(defs.map((d) => d.id));
          const docs = extractArrayItems<AssetDocumentDto>(docRes.data);
          const adhocDocs = docs.filter(
            (doc) => !defIds.has(doc.documentDefinitionId ?? doc.DocumentDefinitionId ?? 0)
          );
          setOtherDocuments(adhocDocs);

          setUploadStates(() => {
            const states: Record<number, DocumentUploadState> = {};
            defs.forEach((def) => {
              if (stagedFiles && stagedFiles[def.id]) {
                states[def.id] = { definitionId: def.id, status: "uploaded", file: stagedFiles[def.id].file };
              } else {
                states[def.id] = { definitionId: def.id, status: "pending" };
              }
            });

            docs.forEach((doc) => {
              const defId = doc.documentDefinitionId ?? doc.DocumentDefinitionId;
              if (defId && states[defId]) {
                states[defId] = { definitionId: defId, status: "uploaded", uploadedDoc: doc };
              }
            });
            return states;
          });
        } else {
          setError(defRes.error || "Failed to fetch document definitions");
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "An error occurred while loading documents");
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
  }, [categoryId, typeId, assetId, stagedFiles, setIsDataLoading]);

  return {
    definitions,
    setDefinitions,
    uploadStates,
    setUploadStates,
    otherDocuments,
    setOtherDocuments,
    loading,
    error,
    triggerReload,
  };
}
