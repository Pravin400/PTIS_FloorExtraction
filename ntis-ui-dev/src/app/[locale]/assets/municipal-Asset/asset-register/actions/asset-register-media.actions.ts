import { assetPhotosServerService } from "@/lib/api/asset-api/asset-photos.service";
import { fetchUnifiedAssetMedia, fetchBatchUnifiedAssetMedia } from "@/lib/api/asset-api/unified-asset-media.service";
import type { ApiResponse } from "@/types/common.types";
import type { PropertyPhotoGalleryDto } from "@/types/photoplan.types";

export async function fetchGroupedAssetPhotosAction(assetId: number): Promise<ApiResponse<PropertyPhotoGalleryDto>> {
  try {
    return await assetPhotosServerService.getGroupedAssetPhotos(assetId);
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || "Failed to fetch grouped asset photos" };
  }
}

export async function isPlanPhotoType(code: string, name: string, remarks: string): Promise<boolean> {
  const upperCode = code.toUpperCase();
  const lowerName = name.toLowerCase();
  const lowerRemarks = remarks.toLowerCase();
  return (
    upperCode.includes('PLAN') ||
    upperCode.includes('LAYOUT') ||
    upperCode.includes('DRAWING') ||
    upperCode.includes('BLUEPRINT') ||
    lowerName.includes('plan') ||
    lowerName.includes('drawing') ||
    lowerName.includes('layout') ||
    lowerRemarks.includes('floor plan') ||
    lowerRemarks.includes('blueprint') ||
    lowerRemarks.includes('layout drawing') ||
    lowerRemarks.includes('photo plan')
  );
}

export async function fetchAssetPhotoGalleryAction(
  assetId: number,
  upic?: string
): Promise<Array<{ url: string; label: string; type: 'photo' | 'plan' }>> {
  try {
    const unified = await fetchUnifiedAssetMedia(assetId, upic);
    const items: Array<{ url: string; label: string; type: 'photo' | 'plan' }> = [
      ...unified.photos.map((p) => ({ url: p.url, label: p.label, type: 'photo' as const })),
      ...unified.plans.map((p) => ({ url: p.url, label: p.label, type: 'plan' as const })),
    ];
    return items;
  } catch (err) {
    console.error('Failed to fetch asset photo gallery:', err);
    return [];
  }
}

export async function findUploadsPhotosForUpic(upic: string): Promise<{
  photoUrl?: string;
  planUrl?: string;
  photoCount: number;
  planCount: number;
  matchedPhotos: string[];
  matchedPlans: string[];
  galleryItems: Array<{ url: string; label: string; type: 'photo' | 'plan' }>;
}> {
  if (!upic || upic === '—') return { photoCount: 0, planCount: 0, matchedPhotos: [], matchedPlans: [], galleryItems: [] };
  try {
    const res = await assetPhotosServerService.findFilesByUpic(upic.trim());
    const allMatches = res.success && res.data ? res.data : [];

    const toUrls = (subdirName: string, allowedExts: string[]): string[] =>
      allMatches
        .filter((m) => m.subdir === subdirName && allowedExts.some((ext) => (m.fileName || '').toLowerCase().endsWith(ext)))
        .map((m) => `/api/documents/${String(m.relativeUrl || '').replace(/\\/g, '/')}`);

    const matchedPhotos = toUrls('photo', ['.jpg', '.png', '.jpeg', '.webp']);
    const matchedPlans = toUrls('plan', ['.jpg', '.png', '.jpeg', '.webp', '.pdf']);
    const matchedDpPlans = toUrls('DPPLAN', ['.jpg', '.png', '.jpeg', '.webp', '.pdf']);
    const matchedDrone = toUrls('DRONEIMAGE', ['.jpg', '.png', '.jpeg', '.webp']);
    const matched712 = toUrls('MPMSAKOLA7_12', ['.jpg', '.png', '.jpeg', '.webp', '.pdf']);
    const matchedNuzul = toUrls('nuzulsheet', ['.jpg', '.png', '.jpeg', '.webp', '.pdf']);
    const matchedAgreement = toUrls('Agreement', ['.jpg', '.png', '.jpeg', '.webp', '.pdf']);
    const matchedDocuments = toUrls('documents', ['.jpg', '.png', '.jpeg', '.webp', '.pdf']);
    const matchedUploads = toUrls('Uploads', ['.jpg', '.jpeg', '.png']);

    const seenUrls = new Set<string>();
    const galleryItems: Array<{ url: string; label: string; type: 'photo' | 'plan' }> = [];

    const addUniqueCategory = (urls: string[], categoryLabel: string, type: 'photo' | 'plan') => {
      let count = 0;
      for (const u of urls) {
        if (!seenUrls.has(u)) {
          seenUrls.add(u);
          count++;
          galleryItems.push({
            url: u,
            label: count === 1 ? categoryLabel : `${categoryLabel} ${count}`,
            type,
          });
        }
      }
    };

    addUniqueCategory(matchedPhotos, 'Asset Photo', 'photo');
    addUniqueCategory(matchedUploads, 'Uploaded Photo', 'photo');
    addUniqueCategory(matchedPlans, 'Floor Plan', 'plan');
    addUniqueCategory(matchedDpPlans, 'DP Plan', 'plan');
    addUniqueCategory(matchedDrone, 'Drone Image', 'photo');
    addUniqueCategory(matched712, '7/12 Extract', 'plan');
    addUniqueCategory(matchedNuzul, 'Nuzul Sheet', 'plan');
    addUniqueCategory(matchedAgreement, 'Agreement', 'plan');
    addUniqueCategory(matchedDocuments, 'Document', 'plan');

    const photoPriorityList: string[] = [];
    const pushPhotoPriority = (urls: string[]) => {
      for (const u of urls) {
        if (!photoPriorityList.includes(u)) photoPriorityList.push(u);
      }
    };
    pushPhotoPriority(matchedPhotos);
    pushPhotoPriority(matchedUploads);

    const planPriorityList: string[] = [];
    const pushPlanPriority = (urls: string[]) => {
      for (const u of urls) {
        if (!planPriorityList.includes(u)) planPriorityList.push(u);
      }
    };
    pushPlanPriority(matchedPlans);

    const photoUrl = photoPriorityList.length > 0 ? photoPriorityList[0] : undefined;
    const realPhotoCount = matchedPhotos.length + matchedUploads.length;
    const photoCount = realPhotoCount > 0
      ? realPhotoCount
      : (photoPriorityList.length > 0 ? 1 : 0);

    const distinctPlanList = planPriorityList.filter((u) => u !== photoUrl);
    const planUrl = distinctPlanList.length > 0 ? distinctPlanList[0] : undefined;
    const planCount = matchedPlans.length > 0 ? matchedPlans.length : distinctPlanList.length;

    return {
      photoUrl,
      planUrl,
      photoCount,
      planCount,
      matchedPhotos: photoPriorityList,
      matchedPlans: distinctPlanList,
      galleryItems,
    };
  } catch (e) {
    console.error('Failed to scan folders for asset photos/plans:', e);
    return { photoCount: 0, planCount: 0, matchedPhotos: [], matchedPlans: [], galleryItems: [] };
  }
}

export async function fetchBatchAssetPhotosAction(
  assets: Array<{ id: number; upic?: string }>
): Promise<Record<number | string, { photoUrl?: string; planUrl?: string; photoCount: number; planCount: number }>> {
  if (!assets || assets.length === 0) return {};
  try {
    const batchMap = await fetchBatchUnifiedAssetMedia(assets);
    const photoMap: Record<string | number, { photoUrl?: string; planUrl?: string; photoCount: number; planCount: number }> = {};

    Object.entries(batchMap).forEach(([key, media]) => {
      const item = {
        photoUrl: media.primaryPhotoUrl,
        planUrl: media.primaryPlanUrl,
        photoCount: media.counts.photoCount,
        planCount: media.counts.planCount,
      };
      photoMap[key] = item;
      if (media.assetId > 0) photoMap[media.assetId] = item;
      if (media.upic) photoMap[media.upic] = item;
    });

    return photoMap;
  } catch (err) {
    console.error('Batch fetch asset photos error:', err);
    return {};
  }
}

export async function fetchAssetDocumentsAction(assetId: number, upic?: string) {
  try {
    const unified = await fetchUnifiedAssetMedia(assetId, upic);
    const documents: Array<Record<string, unknown>> = [];

    unified.photos.forEach((p, idx) => {
      const docGuid = p.documentGuid || p.url.replace('/api/documents/', '');
      const typeTitle = p.bindingPurpose || p.photoTypeName || 'Asset Photo';
      documents.push({
        id: `photo-${p.id || idx}`,
        documentGuid: docGuid,
        fileName: p.fileName || p.label || `Photo ${idx + 1}`,
        name: p.fileName || p.label || `Asset Photo ${idx + 1}`,
        photoTypeId: p.photoTypeId,
        photoTypeName: typeTitle,
        documentTypeName: typeTitle,
        bindingPurpose: p.bindingPurpose,
        contentType: 'image/jpeg',
        customUrl: p.url,
      });
    });

    unified.plans.forEach((p, idx) => {
      const docGuid = p.documentGuid || p.url.replace('/api/documents/', '');
      const typeTitle = p.bindingPurpose || p.photoTypeName || 'Asset Photo Plan';
      documents.push({
        id: `plan-${p.id || idx}`,
        documentGuid: docGuid,
        fileName: p.fileName || p.label || `Floor Plan ${idx + 1}`,
        name: p.fileName || p.label || `Floor Plan / Layout ${idx + 1}`,
        photoTypeId: p.photoTypeId,
        photoTypeName: typeTitle,
        documentTypeName: typeTitle,
        bindingPurpose: p.bindingPurpose,
        contentType: 'image/jpeg',
        customUrl: p.url,
      });
    });

    unified.documents.forEach((d) => {
      documents.push({
        id: d.id,
        documentGuid: d.url.replace('/api/documents/', ''),
        fileName: d.name,
        name: d.name,
        documentTypeName: d.documentTypeName,
        bindingPurpose: d.bindingPurpose,
        documentDefinitionName: d.documentDefinitionName,
        documentDefinitionId: d.documentDefinitionId,
        documentName: d.documentName,
        contentType: d.contentType,
        customUrl: d.url,
        fileSize: d.fileSize,
        uploadedDate: d.uploadedDate,
      });
    });

    return { success: true, documents, error: null };
  } catch (err: unknown) {
    console.error('Failed to fetch asset documents in server action:', err);
    return {
      success: false,
      documents: [],
      error: err instanceof Error ? err.message : 'Failed to fetch asset documents',
    };
  }
}

export async function fetchBatchAssetDocumentCountsAction(
  assets: Array<{ id: number; upic?: string }>
): Promise<Record<number | string, { pdfCount: number; docCount: number }>> {
  if (!assets || assets.length === 0) return {};
  try {
    const batchMap = await fetchBatchUnifiedAssetMedia(assets);
    const countMap: Record<string | number, { pdfCount: number; docCount: number }> = {};

    Object.entries(batchMap).forEach(([key, media]) => {
      const item = {
        pdfCount: media.counts.pdfCount,
        docCount: media.counts.docCount,
      };
      countMap[key] = item;
      if (media.assetId > 0) countMap[media.assetId] = item;
      if (media.upic) countMap[media.upic] = item;
    });

    return countMap;
  } catch (err) {
    console.error('Batch fetch asset document counts error:', err);
    return {};
  }
}
