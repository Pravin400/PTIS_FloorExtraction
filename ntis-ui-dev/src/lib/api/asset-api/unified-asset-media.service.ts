import { assetPhotosServerService } from "./asset-photos.service";
import { getDocumentsByAsset } from "@/lib/api/asset/asset-documentserver.service";
import type {
  UnifiedMediaItem,
  UnifiedDocumentItem,
  UnifiedAssetMediaResult,
} from "@/types/asset/media.types";

export type { UnifiedMediaItem, UnifiedDocumentItem, UnifiedAssetMediaResult };

/**
 * Strict boundary regex matching for asset UPIC numbers (e.g. "MPMS9-4").
 * Ensures "MPMS9-4" matches "MPMS9-4.jpg", "MPMS9-4-A.jpg", "MPMS9-4_plan.pdf",
 * but NEVER matches "MPMS9-40.jpg", "MPMS9-41.jpg", or "MPMS9-400.jpg".
 */
export function isStrictUpicMatch(filename: string, targetUpic: string): boolean {
  if (!filename || !targetUpic || targetUpic === '—') return false;
  const cleanUpic = targetUpic.trim();
  if (!cleanUpic) return false;

  // Escape special regex characters in the UPIC string
  const escapedUpic = cleanUpic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Strict boundary:
  // 1. Must be preceded by start-of-string or non-alphanumeric delimiter
  // 2. Followed by: extension (.jpg, .pdf), angle suffix (-A, -B), copy suffix ' (1)', plan suffix, or end-of-string
  // 3. Negative lookahead ensures it NEVER matches child sub-units (e.g. -1, -56, /1) or different asset numbers
  const pattern = new RegExp(
    `(?:^|[^a-zA-Z0-9])${escapedUpic}(?:\\.[a-zA-Z0-9]+|[-_][a-zA-Z]|\\s*\\([0-9]+\\)|[-_]plan|[-_]dpplan|[-_]photo|$)(?![0-9]|[-_/][0-9])`,
    'i'
  );
  return pattern.test(filename);
}

/**
 * Checks if a filename, title, or code represents a floor plan / blueprint rather than a facade photo.
 */
export function isPlanType(code: string = '', name: string = '', remarks: string = ''): boolean {
  const upperCode = code.toUpperCase();
  const lowerName = name.toLowerCase();
  const lowerRemarks = remarks.toLowerCase();

  return (
    upperCode.includes('PLAN') ||
    upperCode.includes('LAYOUT') ||
    upperCode.includes('DRAWING') ||
    upperCode.includes('BLUEPRINT') ||
    upperCode.includes('DP') ||
    upperCode.includes('MAP') ||
    upperCode.includes('CAD') ||
    lowerName.includes('plan') ||
    lowerName.includes('drawing') ||
    lowerName.includes('layout') ||
    lowerName.includes('dp') ||
    lowerName.includes('map') ||
    lowerName.includes('cad') ||
    lowerRemarks.includes('floor plan') ||
    lowerRemarks.includes('blueprint') ||
    lowerRemarks.includes('layout drawing') ||
    lowerRemarks.includes('photo plan') ||
    lowerRemarks.includes('dp plan') ||
    lowerRemarks.includes('dp') ||
    lowerRemarks.includes('map')
  );
}

// In-Memory Shared Cache for Unified Asset Media Calls
const unifiedMediaCache = new Map<string, { timestamp: number; data: UnifiedAssetMediaResult }>();
const CACHE_TTL_MS = 60000; // 1 minute cache TTL

/**
 * Single Unified Fetcher for all Asset Photos, Floor Plans, and Documents.
 * Serves as the single source of truth across Asset Register Table, Drawers, Modals, View Page, and GIS.
 */
export async function fetchUnifiedAssetMedia(
  assetId: number,
  upic?: string,
  bypassCache: boolean = false
): Promise<UnifiedAssetMediaResult> {
  const cleanUpic = (upic || '').trim();
  const cacheKey = `${assetId}_${cleanUpic}`;

  if (!bypassCache && unifiedMediaCache.has(cacheKey)) {
    const cached = unifiedMediaCache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  const result: UnifiedAssetMediaResult = {
    assetId,
    upic: cleanUpic,
    photos: [],
    plans: [],
    documents: [],
    counts: {
      photoCount: 0,
      planCount: 0,
      pdfCount: 0,
      docCount: 0,
      totalCount: 0,
    },
    primaryPhotoUrl: undefined,
    primaryPlanUrl: undefined,
  }; const seenUrls = new Set<string>();
  const seenFileNames = new Set<string>();

  let resolvedNumericId = assetId;
  if (resolvedNumericId <= 0 && cleanUpic) {
    try {
      const { apiClient } = await import("@/services/api.service");
      const lookupRes = await apiClient.get<{ items?: Array<{ id?: number | string; assetNo?: string; upicId?: string }> } | Array<{ id?: number | string; assetNo?: string; upicId?: string }>>(`/AssetMaster?Search=${encodeURIComponent(cleanUpic)}&PageSize=10`).catch(() => null);
      if (lookupRes && lookupRes.success && lookupRes.data) {
        const items = Array.isArray(lookupRes.data)
          ? lookupRes.data
          : (lookupRes.data && typeof lookupRes.data === 'object' && 'items' in lookupRes.data && Array.isArray((lookupRes.data as { items?: unknown[] }).items))
            ? (lookupRes.data as { items: Array<{ id?: number | string; assetNo?: string; upicId?: string }> }).items
            : [];
        const exactMatch = items.find((it) =>
          (it.assetNo && it.assetNo.trim().toUpperCase() === cleanUpic.toUpperCase()) ||
          (it.upicId && it.upicId.trim().toUpperCase() === cleanUpic.toUpperCase())
        );
        if (exactMatch && exactMatch.id) {
          resolvedNumericId = Number(exactMatch.id);
        } else if (items.length > 0 && items[0].id) {
          resolvedNumericId = Number(items[0].id);
        }
      }
    } catch (_e) { }
  }

  // 1. Fetch DB Photos & Plans
  if (resolvedNumericId > 0) {
    try {
      const groupedRes = await assetPhotosServerService.getGroupedAssetPhotos(resolvedNumericId).catch(() => null);
      const dataObj = groupedRes?.data as Record<string, unknown> | undefined;
      const rawPhotoTypes = (dataObj?.photoTypes || dataObj?.PhotoTypes || (Array.isArray(groupedRes?.data) ? groupedRes.data : [])) as Array<Record<string, unknown>>;
      if (groupedRes && groupedRes.success && rawPhotoTypes.length > 0) {
        rawPhotoTypes.forEach((t) => {
          const rawPhotos = ((t.photos || t.Photos || []) as Array<Record<string, unknown>>);
          rawPhotos.forEach((p) => {
            const guid = (p.documentGuid || p.DocumentGuid) as string | undefined;
            const fileName = (p.fileName || p.FileName) as string | undefined;
            const viewUrl = (p.viewUrl || p.ViewUrl || p.url || p.Url) as string | undefined;
            const url = guid
              ? `/api/documents/${guid}`
              : fileName
                ? `/api/documents/${fileName}`
                : viewUrl;

            if (!url || seenUrls.has(url)) return;
            seenUrls.add(url);
            if (fileName) seenFileNames.add(String(fileName).toLowerCase().trim());
            if (guid) seenFileNames.add(String(guid).toLowerCase().trim());

            const code = String(t.photoTypeCode || p.photoTypeCode || p.PhotoTypeCode || '');
            const name = String(t.photoTypeName || p.photoTypeName || p.PhotoTypeName || p.name || p.Name || 'Asset Photo');
            const remarks = String(p.remarks || p.Remarks || '');

            const bindingPurpose = String(p.bindingPurpose ?? p.BindingPurpose ?? t.bindingPurpose ?? t.BindingPurpose ?? name);
            const isPlan = isPlanType(code, name, remarks) || isPlanType('', bindingPurpose, '');
            const typeId = (p.photoTypeId ?? p.PhotoTypeId ?? t.photoTypeId ?? t.PhotoTypeId) as number | undefined;
            const typeName = String(bindingPurpose || t.photoTypeName || t.PhotoTypeName || p.photoTypeName || p.PhotoTypeName || name);
            const typeCode = String(t.photoTypeCode ?? t.PhotoTypeCode ?? p.photoTypeCode ?? p.PhotoTypeCode ?? code);

            const item: UnifiedMediaItem = {
              id: `db-photo-${p.id || p.propertyPhotoId || url}`,
              url,
              label: typeName,
              type: isPlan ? 'plan' : 'photo',
              source: 'db',
              photoTypeId: typeId,
              photoTypeName: typeName,
              photoTypeCode: typeCode,
              bindingPurpose: bindingPurpose,
              documentGuid: guid,
              fileName: fileName,
            };

            const isPdf = String(fileName || '').toLowerCase().endsWith('.pdf') || String(p.mimeType || '').toLowerCase().includes('pdf');
            if (isPdf) {
              const docTitle = bindingPurpose && bindingPurpose !== 'Uploaded Photo' && bindingPurpose !== 'Photo' && bindingPurpose !== 'Asset Photo'
                ? bindingPurpose
                : (name && name !== 'Uploaded Photo' && name !== 'Photo' && name !== 'Asset Photo' ? name : '7/12 Extract / Record of Rights');

              result.documents.push({
                id: `db-doc-${p.id || p.propertyPhotoId || url}`,
                url,
                name: docTitle,
                documentTypeName: docTitle,
                bindingPurpose: bindingPurpose,
                documentDefinitionName: docTitle,
                contentType: 'application/pdf',
                isPdf: true,
                source: 'db',
              });
              return;
            }

            if (isPlan) {
              result.plans.push(item);
            } else {
              result.photos.push(item);
            }
          });
        });
      }
    } catch (e) {
      console.error('Error fetching DB photos in fetchUnifiedAssetMedia:', e);
    }

    // 2. Fetch DB Documents
    try {
      const docRes = await getDocumentsByAsset(resolvedNumericId).catch(() => null);
      if (docRes && docRes.success && docRes.data) {
        const docData = docRes.data as Record<string, unknown> | Array<Record<string, unknown>>;
        const rawList: Array<Record<string, unknown>> = Array.isArray(docData)
          ? docData
          : (docData.items as Array<Record<string, unknown>>) || (docData.documents as Array<Record<string, unknown>>) || [];

        rawList.forEach((d) => {
          const rawFileName = String(d.fileName ?? d.FileName ?? d.originalFileName ?? '');
          const rawGuid = String(d.documentGuid ?? d.DocumentGuid ?? '');
          const rawDocType = String(d.bindingPurpose || d.BindingPurpose || d.documentDefinitionName || d.DocumentDefinitionName || d.documentName || d.DocumentName || d.documentTypeName || d.DocumentTypeName || d.documentType || 'Legal Document');
          const fileKey = (rawGuid || rawFileName).toLowerCase();

          if (!fileKey || seenUrls.has(fileKey)) return;
          seenUrls.add(fileKey);
          if (rawFileName) seenFileNames.add(rawFileName.toLowerCase().trim());
          if (rawGuid) seenFileNames.add(rawGuid.toLowerCase().trim());

          const isPdf = rawFileName.toLowerCase().endsWith('.pdf') || String(d.contentType || '').toLowerCase().includes('pdf');
          const customUrl = `/api/documents/${encodeURIComponent(rawGuid || rawFileName)}`;

          result.documents.push({
            id: `db-doc-${d.id || d.assetDocumentId || fileKey}`,
            url: customUrl,
            name: String(d.documentName || d.bindingPurpose || rawDocType),
            documentTypeName: rawDocType,
            bindingPurpose: (d.bindingPurpose || d.BindingPurpose) as string | undefined,
            documentDefinitionName: (d.documentDefinitionName || d.DocumentDefinitionName) as string | undefined,
            documentDefinitionId: (d.documentDefinitionId || d.DocumentDefinitionId) as number | undefined,
            documentName: (d.documentName || d.DocumentName) as string | undefined,
            contentType: (d.contentType as string) || (isPdf ? 'application/pdf' : 'application/octet-stream'),
            isPdf,
            fileSize: d.fileSize as number | undefined,
            uploadedDate: (d.uploadedDate || d.createdDate) as string | undefined,
            source: 'db',
          });
        });
      }
    } catch (e) {
      console.error('Error fetching DB documents in fetchUnifiedAssetMedia:', e);
    }
  }

  // Compute final counts and primary URLs
  result.counts.photoCount = result.photos.length;
  result.counts.planCount = result.plans.length;

  let pdfCount = 0;
  let docCount = 0;
  result.documents.forEach((doc) => {
    if (doc.isPdf) pdfCount++;
    else docCount++;
  });

  result.counts.photoCount = result.photos.length;
  result.counts.planCount = result.plans.length;
  result.counts.pdfCount = pdfCount;
  result.counts.docCount = docCount;
  result.counts.totalCount = result.photos.length + result.plans.length + result.documents.length;

  if (result.photos.length > 0) {
    result.primaryPhotoUrl = result.photos[0].url;
  } else {
    result.primaryPhotoUrl = undefined;
  }
  if (result.plans.length > 0) {
    result.primaryPlanUrl = result.plans[0].url;
  } else {
    result.primaryPlanUrl = undefined;
  }

  // Update Cache
  unifiedMediaCache.set(cacheKey, { timestamp: Date.now(), data: result });
  return result;
}

/**
 * Batch fetcher for table pages — retrieves unified media summaries for an array of assets in parallel.
 */
export async function fetchBatchUnifiedAssetMedia(
  assets: Array<{ id: number; upic?: string }>
): Promise<Record<string | number, UnifiedAssetMediaResult>> {
  if (!assets || assets.length === 0) return {};

  const map: Record<string | number, UnifiedAssetMediaResult> = {};
  const results = await Promise.allSettled(
    assets.map(async ({ id, upic }) => {
      const media = await fetchUnifiedAssetMedia(id, upic);
      return { id, upic, media };
    })
  );

  results.forEach((r) => {
    if (r.status === 'fulfilled' && r.value) {
      const { id, upic, media } = r.value;
      if (id > 0) map[id] = media;
      if (upic) map[upic] = media;
    }
  });

  return map;
}
