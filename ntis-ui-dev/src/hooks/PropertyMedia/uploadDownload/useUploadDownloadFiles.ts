"use client";

import { useState, useRef, useCallback, useMemo } from "react";

interface UseUploadDownloadFilesProps {
  t: (key: string, values?: Record<string, string | number>) => string;
}

export function useUploadDownloadFiles({ t }: UseUploadDownloadFilesProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
    }
  }, []);

  const handleClearFiles = useCallback(() => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const fileDisplayValue = useMemo(() => {
    if (!selectedFiles || selectedFiles.length === 0) return "";
    if (selectedFiles.length === 1) return selectedFiles[0].name;
    return t("uploadDownloadDrawer.filesSelected", { count: selectedFiles.length });
  }, [selectedFiles, t]);

  const prepareFilesPayload = useCallback(() => {
    return selectedFiles;
  }, [selectedFiles]);

  return {
    fileInputRef,
    selectedFiles,
    setSelectedFiles,
    fileDisplayValue,
    handleBrowseClick,
    handleFileInputChange,
    handleClearFiles,
    prepareFilesPayload,
  };
}
