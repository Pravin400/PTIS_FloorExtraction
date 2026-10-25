import { getDocumentFileRaw, getDocumentsByAsset, getPhotosAndPlansByAsset } from "@/lib/api/asset/asset-documentserver.service";
import { getDocument } from "@/lib/api/document.service";
import { assetPhotosServerService } from "@/lib/api/asset-api/asset-photos.service";
import type { AssetDocumentListItem } from "@/types/municipal-asset/detail-tabs.types";
import {
  normalizeAssetDocument,
  unwrapAssetDocumentList,
} from "./asset-detail-normalizers";

export async function fetchAssetDocumentsByAsset(assetId: number | string): Promise<{
  documents: AssetDocumentListItem[];
  error: string | null;
}> {
  const response = await getDocumentsByAsset(assetId);
  if (!response.success) {
    return {
      documents: [],
      error: response.error || "Failed to load asset documents.",
    };
  }

  return {
    documents: unwrapAssetDocumentList(response.data).map(normalizeAssetDocument).filter(Boolean) as AssetDocumentListItem[],
    error: null,
  };
}

export async function fetchAssetPhotosAndPlansByAsset(assetId: number | string): Promise<{
  documents: AssetDocumentListItem[];
  error: string | null;
}> {
  const response = await getPhotosAndPlansByAsset(assetId);
  if (!response.success) {
    return {
      documents: [],
      error: response.error || "Failed to load asset photos and plans.",
    };
  }

  return {
    documents: unwrapAssetDocumentList(response.data).map(normalizeAssetDocument).filter(Boolean) as AssetDocumentListItem[],
    error: null,
  };
}

export async function fetchAssetDocumentFile(assetDocumentId: number | string): Promise<{
  base64: string;
  contentType: string;
  contentDisposition: string | null;
  error: string | null;
}> {
  try {
    const isGuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(String(assetDocumentId));
    if (isGuid) {
      return fetchAssetDocumentFileByGuid(String(assetDocumentId));
    }
    const backendResponse = await getDocumentFileRaw(assetDocumentId);

    if (!backendResponse.ok) {
      return {
        base64: "",
        contentType: "",
        contentDisposition: null,
        error: backendResponse.statusText || "Failed to load document file.",
      };
    }

    const arrayBuffer = await backendResponse.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return {
      base64,
      contentType: backendResponse.headers.get("content-type") || "application/octet-stream",
      contentDisposition: backendResponse.headers.get("content-disposition"),
      error: null,
    };
  } catch (err) {
    return {
      base64: "",
      contentType: "",
      contentDisposition: null,
      error: err instanceof Error ? err.message : "Failed to load document file.",
    };
  }
}

export async function fetchAssetDocumentFileByGuid(documentGuid: string, action: 'view' | 'download' = 'view'): Promise<{
  base64: string;
  contentType: string;
  contentDisposition: string | null;
  error: string | null;
}> {
  try {
    const result = await getDocument(documentGuid, action);
    const base64 = Buffer.from(result.buffer).toString("base64");

    return {
      base64,
      contentType: result.contentType || "application/octet-stream",
      contentDisposition: result.contentDisposition || null,
      error: null,
    };
  } catch (err) {
    return {
      base64: "",
      contentType: "",
      contentDisposition: null,
      error: err instanceof Error ? err.message : "Failed to load document file by GUID.",
    };
  }
}

export async function fetchGroupedAssetPhotos(assetId: number | string) {
  try {
    const res = await assetPhotosServerService.getGroupedAssetPhotos(Number(assetId));
    if (res.success && res.data) {
      return { success: true, data: res.data };
    }
    return { success: false, error: res.error || "Failed to load grouped asset photos." };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
