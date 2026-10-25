"use client";

import { DownloadImagesQueryParams } from "@/types/PropertyMedia/PropertyMedia.types";
import { buildQueryString } from "@/lib/utils/PropertyMedia/propertyMediaHelper";
import {resolveFileName} from "@/lib/utils/PropertyMedia/propertyMediaExport.client";
import { ApiError } from "@/lib/utils/api";

/**
 * Client-side service function to download property media images ZIP archive.
 * Calls /api/property-media/download/images Next.js proxy route which securely forwards to PropertyMedia/download/images.
 *
 * @param params Download parameters (photoTypeId, category required; toPropertyNo, fromPropertyNo, wardIds, divisionId optional)
 * @param fallbackName Default filename if content-disposition header is absent
 */
export async function downloadPropertyMediaImages(
  params: DownloadImagesQueryParams,
  fallbackName = "PropertyMedia_Images.zip"
): Promise<void> {
  const wardIdsString = Array.isArray(params.wardIds)
    ? params.wardIds.filter(Boolean).join(",")
    : params.wardIds;

  const queryString = buildQueryString({
    PhotoTypeId: params.photoTypeId,
    Category: params.category,
    ToPropertyNo: params.toPropertyNo,
    FromPropertyNo: params.fromPropertyNo,
    WardIds: wardIdsString,
    DivisionId: params.divisionId,
  });

  const response = await fetch(`/api/property-media/download/images?${queryString}`);

  if (!response.ok) {
    let errorMessage = "Failed to download images zip archive";
    try {
      const errorJson = await response.json();
      errorMessage = errorJson.message || errorJson.Message || errorJson.error || errorMessage;
    } catch {
      const errorText = await response.text().catch(() => "");
      if (errorText) errorMessage = errorText;
    }
    throw new ApiError(response.status, errorMessage, "Download Images Failed");
  }

  const blob = await response.blob();
  const fileName = resolveFileName(response.headers.get("content-disposition"), fallbackName);

  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = fileName;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Give the browser 1 second to start streaming the blob before freeing memory
  setTimeout(() => {
    window.URL.revokeObjectURL(blobUrl);
  }, 1000);
}
