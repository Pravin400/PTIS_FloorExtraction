/* eslint-disable @typescript-eslint/no-explicit-any */
import 'server-only';
import { logger } from '@/lib/utils/logger';
import { CreateChildAssetRequest } from '@/types/asset/floor-details.types';

/**
 * Stages the child asset's staged photos (matching the basic-info step's
 * staging convention) into the FormData as PhotoFiles + a PhotoMetadataJson
 * sidecar, resolving each staged photo-type-code to its numeric photoTypeId.
 * Also handles the legacy single photoFile/planFile fallback fields.
 */
export async function stageChildAssetPhotos(formDataPayload: FormData, data: CreateChildAssetRequest): Promise<void> {
  const stagedFiles = data.stagedFiles || {};
  const photoMetadata: any[] = [];
  try {
    const { fetchAssetPhotoTypesAction } = await import("@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions/asset-photos.actions");
    const typesRes = await fetchAssetPhotoTypesAction(0, 2, 1);

    for (const typeCode of Object.keys(stagedFiles)) {
      let displayOrder = 1;
      const isPlan = typeCode.toUpperCase().includes('PLAN');
      let extraTypeId = isPlan ? 2 : 1; // Sensible default: 1 for photo, 2 for plan
      if (typesRes.success && typesRes.data) {
        const exactType = typesRes.data.find((t: any) => {
          const code = (t.photoTypeCode || t.PhotoTypeCode || "").toUpperCase();
          const tId = (t.id || t.Id || t.photoTypeId || t.PhotoTypeId || "").toString();
          if (code === typeCode.toUpperCase() || tId === typeCode) return true;
          if (isPlan && (code.includes('PLAN') || code.includes('DRAWING') || code.includes('BLUEPRINT'))) return true;
          if (!isPlan && (code.includes('ASSET') || code.includes('PROPERTY') || code.includes('FRONT') || code.includes('PHOTO'))) return true;
          return false;
        });
        if (exactType) {
          extraTypeId = Number(exactType.id || exactType.Id || exactType.photoTypeId || exactType.PhotoTypeId) || (isPlan ? 2 : 1);
        }
      }

      const files = stagedFiles[typeCode];
      if (Array.isArray(files)) {
        for (const file of files) {
          if (!file) continue;
          formDataPayload.append("PhotoFiles", file, file.name || `photo_${typeCode}.jpg`);

          const exactFileTypeId = (file as any).photoTypeId ? Number((file as any).photoTypeId) : extraTypeId;
          const exactDisplayOrder = (file as any).displayOrder ? Number((file as any).displayOrder) : displayOrder++;
          const exactRemarks = (file as any).remarks ? String((file as any).remarks) : `Subunit Photo (${typeCode})`;

          photoMetadata.push({
            photoTypeId: exactFileTypeId > 0 ? exactFileTypeId : 3,
            displayOrder: exactDisplayOrder,
            remarks: exactRemarks
          });
        }
      }
    }
  } catch (e) {
    logger.warn("Failed to stage subunit files/metadata in createChildAssetAction", { error: e instanceof Error ? e : new Error(String(e)) });
  }

  // Fallback support for single photoFile/planFile properties if passed instead of stagedFiles
  let fallbackDisplayOrder = 1;
  const singlePhoto = (data as any).photoFile;
  const singlePlan = (data as any).planFile;
  if (singlePhoto && !formDataPayload.has("PhotoFiles")) {
    formDataPayload.append("PhotoFiles", singlePhoto, singlePhoto.name || 'subunitPhoto.jpg');
    photoMetadata.push({ photoTypeId: 1, displayOrder: fallbackDisplayOrder++, remarks: "Subunit Photo" });
  }
  if (singlePlan && !formDataPayload.has("PhotoFiles")) {
    formDataPayload.append("PhotoFiles", singlePlan, singlePlan.name || 'subunitPlan.pdf');
    photoMetadata.push({ photoTypeId: 2, displayOrder: fallbackDisplayOrder++, remarks: "Subunit Photo Plan" });
  }

  if (photoMetadata.length > 0) {
    formDataPayload.append("PhotoMetadataJson", JSON.stringify(photoMetadata));
  }
}
