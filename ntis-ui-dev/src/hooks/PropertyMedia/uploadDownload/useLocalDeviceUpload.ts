"use client";

import React, { useState, useCallback } from "react";
import { useToast } from "@/components/common";
import { uploadBrowseMatchMediaAction } from "@/app/[locale]/property-tax/property-media/action";
import {
  MAX_LOCAL_DEVICE_UPLOAD_FILES,
  MAX_LOCAL_DEVICE_UPLOAD_SIZE_BYTES,
} from "@/lib/constants/propertyMedia.constants";

interface UseLocalDeviceUploadProps {
  category: string;
  subCategory: string;
  selectedFiles: File[];
  onClearFiles: () => void;
  updateQueries: (updates: Record<string, string | number | boolean | null | undefined>) => void;
  setTouched: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  t: (key: string, values?: Record<string, string | number>) => string;
  mapApiError: (result: { statusCode?: number; message?: string }) => string;
}

export function useLocalDeviceUpload({
  category,
  subCategory,
  selectedFiles,
  onClearFiles: _onClearFiles,
  updateQueries,
  setTouched,
  setErrors,
  t,
  mapApiError,
}: UseLocalDeviceUploadProps) {
  const [isUploadingLocal, setIsUploadingLocal] = useState(false);
  const toast = useToast();

  const handleLocalUpload = useCallback(async () => {
    let hasError = false;

    if (!category) {
      setTouched((prev) => ({ ...prev, "upload.category": true }));
      setErrors((prev) => ({
        ...prev,
        "upload.category": t("uploadDownloadDrawer.validation.categoryRequired"),
      }));
      toast.error(t("uploadDownloadDrawer.validation.categoryRequired"));
      hasError = true;
    }

    if (!subCategory) {
      setTouched((prev) => ({ ...prev, "upload.subCategory": true }));
      setErrors((prev) => ({
        ...prev,
        "upload.subCategory": t("uploadDownloadDrawer.validation.subCategoryRequired"),
      }));
      if (!hasError) {
        toast.error(t("uploadDownloadDrawer.validation.subCategoryRequired"));
      }
      hasError = true;
    }

    if (hasError) return;

    if (!selectedFiles || selectedFiles.length === 0) {
      toast.error(t("uploadDownloadDrawer.noFilesSelectedError"));
      return;
    }

    if (selectedFiles.length > MAX_LOCAL_DEVICE_UPLOAD_FILES) {
      toast.error(t("uploadDownloadDrawer.validation.maxFilesExceeded"));
      return;
    }

    const totalSize = selectedFiles.reduce((acc, file) => acc + (file.size || 0), 0);
    if (totalSize > MAX_LOCAL_DEVICE_UPLOAD_SIZE_BYTES) {
      toast.error(t("uploadDownloadDrawer.validation.maxFileSizeExceeded"));
      return;
    }

    setIsUploadingLocal(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("photoTypeId", String(Number(subCategory)));
      selectedFiles.forEach((file) => {
        uploadFormData.append("files", file);
      });

      const result = await uploadBrowseMatchMediaAction(uploadFormData);
      if (result.success && result.data) {
        toast.success(
          t("uploadDownloadDrawer.filesMatchedSummary", {
            matched: result.data.totalMatched ?? 0,
            total: result.data.totalCount ?? selectedFiles.length,
          })
        );
        const previewId = result.data.previewId?.trim();
        if (previewId) {
          updateQueries({ previewId, sourceTab: "device", page: 1 });
        }
      } else {
        toast.error(
          result.error
            ? mapApiError({ message: result.error })
            : t("uploadDownloadDrawer.apiErrors.operationFailed")
        );
      }
    } catch (err) {
      toast.error(mapApiError({ message: (err as Error).message }));
    } finally {
      setIsUploadingLocal(false);
    }
  }, [
    category,
    subCategory,
    selectedFiles,
    t,
    mapApiError,
    updateQueries,
    setTouched,
    setErrors,
    toast,
  ]);

  return {
    isUploadingLocal,
    handleLocalUpload,
  };
}
