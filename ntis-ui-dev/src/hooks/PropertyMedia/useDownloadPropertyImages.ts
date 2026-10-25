"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/components/common";
import { DownloadImagesQueryParams } from "@/types/PropertyMedia/PropertyMedia.types";
import { downloadPropertyMediaImages } from "@/lib/api/property-media/propertyMedia.client";
import { mapPropertyMediaApiError } from "@/lib/utils/PropertyMedia/propertyMediaHelper";
import { useTranslations } from "next-intl";

interface UseDownloadPropertyImagesOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Custom React Hook to manage state and execution for downloading property media images ZIP archive.
 */
export function useDownloadPropertyImages(options?: UseDownloadPropertyImagesOptions) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const toast = useToast();
  const t = useTranslations("propertyMedia");
  const tCommon = useTranslations("common");

  const handleDownloadImages = useCallback(
    async (params: DownloadImagesQueryParams): Promise<boolean> => {
      if (isDownloading) return false;

      if (!params.photoTypeId || !params.category) {
        const validationMsg = t("uploadDownloadDrawer.validation.photoTypeAndCategoryRequired");
        toast.error(validationMsg);
        setDownloadError(validationMsg);
        return false;
      }

      setIsDownloading(true);
      setDownloadError(null);

      try {
        toast.info(t("uploadDownloadDrawer.success.downloadStarted"));
        await downloadPropertyMediaImages(params);
        toast.success(t("uploadDownloadDrawer.success.downloadCompleted"));
        options?.onSuccess?.();
        return true;
      } catch (err) {
        const error = err as Error & { statusCode?: number; responseText?: string; error?: string };
        const rawMessage = error.responseText || error.error || error.message;
        const msg = mapPropertyMediaApiError(
          { statusCode: error.statusCode, message: rawMessage },
          t,
          tCommon
        );
        setDownloadError(msg);
        toast.error(msg);
        options?.onError?.(error);
        return false;
      } finally {
        setIsDownloading(false);
      }
    },
    [isDownloading, t, tCommon, options, toast]
  );

  return {
    isDownloading,
    downloadError,
    handleDownloadImages,
  };
}
