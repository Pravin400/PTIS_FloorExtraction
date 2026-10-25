import { useMemo, useState, useRef } from "react";
import { useNALegalDocuments } from "./useNALegalDocuments";
import { formatBytes, formatToDDMMYYYY } from "@/lib/utils/asset-utils/new-add-new-asset/ownershipUtils";

export { formatBytes, formatToDDMMYYYY };

export function useAssetDocumentsPanelState(t: (key: string, args?: Record<string, unknown>) => string) {
  const [uploadingDefId, setUploadingDefId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const adHocFileInputRef = useRef<HTMLInputElement>(null);

  const {
    definitions,
    uploadStates,
    otherDocuments,
    loading,
    error,
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
  } = useNALegalDocuments(t);

  const sortedDefinitions = useMemo(() => {
    const list = Array.isArray(definitions) ? definitions : [];
    return [...list].sort((a, b) => {
      if (a.isRequired && !b.isRequired) return -1;
      if (!a.isRequired && b.isRequired) return 1;
      return (a.displayOrder || 0) - (b.displayOrder || 0);
    });
  }, [definitions]);

  const PAGE_SIZE = 12;
  const [legalPage, setLegalPage] = useState(1);
  const [otherPage, setOtherPage] = useState(1);

  const totalLegalPages = Math.max(1, Math.ceil(sortedDefinitions.length / PAGE_SIZE));
  const effectiveLegalPage = Math.min(legalPage, totalLegalPages);

  const paginatedDefinitions = useMemo(() => {
    return sortedDefinitions.slice(
      (effectiveLegalPage - 1) * PAGE_SIZE,
      effectiveLegalPage * PAGE_SIZE
    );
  }, [sortedDefinitions, effectiveLegalPage]);

  const safeOtherDocuments = useMemo(() => {
    return Array.isArray(otherDocuments) ? otherDocuments : [];
  }, [otherDocuments]);

  const totalOtherPages = Math.max(1, Math.ceil(safeOtherDocuments.length / PAGE_SIZE));
  const effectiveOtherPage = Math.min(otherPage, totalOtherPages);

  const paginatedOtherDocuments = useMemo(() => {
    return safeOtherDocuments.slice(
      (effectiveOtherPage - 1) * PAGE_SIZE,
      effectiveOtherPage * PAGE_SIZE
    );
  }, [safeOtherDocuments, effectiveOtherPage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingDefId !== null) {
      handleFileSelect(uploadingDefId, file);
      setUploadingDefId(null);
    }
    e.target.value = "";
  };

  const handleAdHocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleAdHocUpload(file);
    }
    e.target.value = "";
  };

  return {
    setUploadingDefId,
    fileInputRef,
    adHocFileInputRef,
    uploadStates,
    otherDocuments: safeOtherDocuments,
    loading,
    error,
    viewingDocId,
    isAdHocUploading,
    handleView,
    handleDownload,
    handleDelete,
    handleAdHocDelete,
    handleAdHocView,
    handleAdHocDownload,
    legalPage: effectiveLegalPage,
    setLegalPage,
    otherPage: effectiveOtherPage,
    setOtherPage,
    totalLegalPages,
    totalOtherPages,
    paginatedDefinitions,
    paginatedOtherDocuments,
    handleFileChange,
    handleAdHocFileChange,
    formData,
    PAGE_SIZE,
  };
}
