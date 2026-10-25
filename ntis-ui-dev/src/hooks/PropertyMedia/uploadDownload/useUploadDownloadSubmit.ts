"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useConfirm, useToast } from "@/components/common";
import {
  UploadDownloadFormModel,
  ExecuteLocalImportPayload,
} from "@/types/PropertyMedia/PropertyMedia.types";
import {
  executeLocalImportAction,
  executeLocalBulkUploadAction,
} from "@/app/[locale]/property-tax/property-media/action";
import { downloadPropertyMediaImages } from "@/lib/api/property-media/propertyMedia.client";
import { pollMediaJobStatus } from "@/lib/utils/PropertyMedia/jobStatusPolling";

interface UseUploadDownloadSubmitProps {
  formData: UploadDownloadFormModel;
  activeTab: "upload" | "download";
  uploadSourceTab: "server" | "device";
  previewId?: string | null;
  validate: (data: UploadDownloadFormModel) => Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setSubmittedOnce: React.Dispatch<React.SetStateAction<boolean>>;
  onSuccess?: () => void;
  closeAndRoute: () => void;
  t: (key: string, values?: Record<string, string | number>) => string;
  mapApiError: (result: { statusCode?: number; message?: string }) => string;
}

export function useUploadDownloadSubmit({
  formData,
  activeTab,
  uploadSourceTab,
  previewId,
  validate,
  setErrors,
  setSubmittedOnce,
  onSuccess,
  closeAndRoute,
  t,
  mapApiError,
}: UseUploadDownloadSubmitProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { confirm } = useConfirm();
  const toast = useToast();
  const activePolls = useRef(new Set<() => void>());
  const isMounted = useRef(false);
  const isSubmitInProgress = useRef(false);

  useEffect(() => {
    const polls = activePolls.current;
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      polls.forEach((cancel) => cancel());
      polls.clear();
    };
  }, []);

  const startPolling = useCallback(
    (options: { jobId: number; recordsCount?: number; jobCode?: string }) => {
      let cancel: () => void = () => undefined;
      cancel = pollMediaJobStatus({
        ...options,
        toast,
        t,
        onSettled: () => {
          activePolls.current.delete(cancel);
        },
      });
      activePolls.current.add(cancel);
    },
    [toast, t]
  );

  const handleSubmit = useCallback(
    async (e?: React.FormEvent): Promise<void> => {
      if (e) e.preventDefault();
      setSubmittedOnce(true);

      const validationErrors = validate(formData);
      setErrors(validationErrors);

      if (Object.keys(validationErrors).length > 0) return;
      if (isSubmitInProgress.current) return;

      if (activeTab === "upload") {
        if (uploadSourceTab === "device" && !previewId) {
          toast.error(t("uploadDownloadDrawer.noFilesSelectedError"));
          return;
        }

        confirm({
          variant: "update",
          title: t("uploadDownloadDrawer.confirmUploadTitle"),
          description: t("uploadDownloadDrawer.confirmUploadDescription"),
          confirmText: t("uploadDownloadDrawer.uploadButton"),
          onConfirm: async () => {
            if (isSubmitInProgress.current) return;
            isSubmitInProgress.current = true;
            setIsSubmitting(true);
            try {
              if (uploadSourceTab === "server") {
                const payload: ExecuteLocalImportPayload = {
                  photoTypeId: Number(formData.upload.subCategory),
                };

                const result = await executeLocalImportAction(payload);
                if (result.success) {
                  if (!isMounted.current) return;
                  toast.info(t("uploadDownloadDrawer.success.uploadInProgress"));
                  if (result.data?.jobId) {
                    startPolling({
                      jobId: result.data.jobId,
                      recordsCount: result.data.recordsSelected,
                      jobCode: result.data.jobCode,
                    });
                  }
                  onSuccess?.();
                } else {
                  if (!isMounted.current) return;
                  toast.error(result.error || t("uploadDownloadDrawer.apiErrors.operationFailed"));
                }
              } else {
                const result = await executeLocalBulkUploadAction({
                  previewId: String(previewId),
                });

                if (result.success) {
                  if (!isMounted.current) return;
                  toast.info(t("uploadDownloadDrawer.success.uploadInProgress"));
                  if (result.data?.jobId) {
                    startPolling({
                      jobId: result.data.jobId,
                      recordsCount: result.data.recordsSelected,
                      jobCode: result.data.jobCode,
                    });
                  }
                  onSuccess?.();
                } else {
                  if (!isMounted.current) return;
                  toast.error(result.error || t("uploadDownloadDrawer.apiErrors.operationFailed"));
                }
              }
            } catch (error) {
              if (isMounted.current) {
                toast.error(mapApiError({ message: (error as Error).message }));
              }
            } finally {
              isSubmitInProgress.current = false;
              if (isMounted.current) setIsSubmitting(false);
            }
          },
        });
      } else {
        const downloadData = formData.download;
        isSubmitInProgress.current = true;
        setIsSubmitting(true);
        toast.info(t("uploadDownloadDrawer.success.downloadStarted"));

        try {
          await downloadPropertyMediaImages({
            category: downloadData.category,
            photoTypeId: downloadData.subCategory,
            divisionId: downloadData.zone || undefined,
            wardIds: downloadData.ward?.length ? downloadData.ward : undefined,
            fromPropertyNo: downloadData.propertyFrom || undefined,
            toPropertyNo: downloadData.propertyTo || undefined,
          });
          if (!isMounted.current) return;
          toast.success(t("uploadDownloadDrawer.success.downloadCompleted"));
          onSuccess?.();
          closeAndRoute();
        } catch (error) {
          if (!isMounted.current) return;
          const err = error as Error & { statusCode?: number; responseText?: string; error?: string };
          const rawMessage = err.responseText || err.error || err.message;
          toast.error(mapApiError({ statusCode: err.statusCode, message: rawMessage }));
        } finally {
          isSubmitInProgress.current = false;
          if (isMounted.current) setIsSubmitting(false);
        }
      }
    },
    [
      formData,
      activeTab,
      uploadSourceTab,
      previewId,
      validate,
      setErrors,
      setSubmittedOnce,
      onSuccess,
      closeAndRoute,
      confirm,
      startPolling,
      isMounted,
      t,
      mapApiError,
      toast,
    ]
  );

  return {
    isSubmitting,
    handleSubmit,
  };
}
