/* eslint-disable @typescript-eslint/no-explicit-any */
import { AssetMasterRequest } from "@/types/asset-types/basic-info/asset-wizard.types";
import { fetchAssetPhotoTypesAction } from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions/asset-photos.actions";

async function resolveFrontAndPlanTypeIds(typesRes: any) {
  let frontTypeId = 1; // Fallback
  let planTypeId = 2; // Fallback

  if (typesRes.success && typesRes.data) {
    const types = typesRes.data;
    const frontType = types.find((t: any) => {
      const code = t.photoTypeCode || t.PhotoTypeCode || "";
      const name = t.photoTypeName || t.PhotoTypeName || "";
      return code === "PROPERTY_PHOTO" || code === "PROPERTY" || name.toLowerCase().includes("front");
    });
    if (frontType) frontTypeId = Number(frontType.id || frontType.Id || frontType.photoTypeId || frontType.PhotoTypeId) || 1;

    const planType = types.find((t: any) => {
      const code = t.photoTypeCode || t.PhotoTypeCode || "";
      const name = t.photoTypeName || t.PhotoTypeName || "";
      return code === "PHOTO_PLAN" || code === "PLAN" || name.toLowerCase().includes("plan");
    });
    if (planType) planTypeId = Number(planType.id || planType.Id || planType.photoTypeId || planType.PhotoTypeId) || 2;
  }

  return { frontTypeId, planTypeId };
}

/**
 * Assembles the final persistence payload: appends the AssetMasterRequest
 * fields (other than fieldValues) plus any basic-info photo files (front
 * photo / building plan / extra files) into a single multipart FormData,
 * resolving photo-type IDs along the way.
 */
export async function buildSubmitFormPayload(
  apiRequest: AssetMasterRequest,
  basicInfoFiles: any,
  extraBasicInfoFiles: any
): Promise<{ payload: any; formDataPayload: FormData | null }> {
  let payload: any = apiRequest;
  let formDataPayload: FormData | null = null;
  const photoUploads: any[] = [];

  const useFormData = true; // Both POST and PUT endpoints strictly consume multipart/form-data

  formDataPayload = new FormData();
  // Append standard fields from apiRequest
  Object.entries(apiRequest).forEach(([key, value]) => {
    if (value !== null && value !== undefined && key !== 'fieldValues') {
      if (Array.isArray(value)) {
        value.forEach(v => formDataPayload?.append(key, String(v)));
      } else if (typeof value === 'object' && !(value instanceof File)) {
        formDataPayload?.append(key, JSON.stringify(value));
      } else {
        formDataPayload?.append(key, String(value));
      }
    }
  });

  let displayOrder = 1;

  const typesRes = await fetchAssetPhotoTypesAction(
    (apiRequest as any).id || 0,
    apiRequest.assetTypeId || 2,
    apiRequest.assetCategoryId || 1
  );
  const { frontTypeId, planTypeId } = await resolveFrontAndPlanTypeIds(typesRes);

  const photoMetadata: any[] = [];
  if (basicInfoFiles?.frontPhoto) {
    if (useFormData && formDataPayload) {
      formDataPayload.append("PhotoFiles", basicInfoFiles.frontPhoto, basicInfoFiles.frontPhoto.name || 'frontPhoto.jpg');
    }
    const meta = {
      photoTypeId: frontTypeId > 0 ? frontTypeId : 1,
      displayOrder: displayOrder++,
      remarks: "Front Photo"
    };
    photoMetadata.push(meta);
    photoUploads.push({ file: basicInfoFiles.frontPhoto, meta });
  }

  if (basicInfoFiles?.buildingPlan) {
    if (useFormData && formDataPayload) {
      formDataPayload.append("PhotoFiles", basicInfoFiles.buildingPlan, basicInfoFiles.buildingPlan.name || 'buildingPlan.pdf');
    }
    const meta = {
      photoTypeId: planTypeId > 0 ? planTypeId : 2,
      displayOrder: displayOrder++,
      remarks: "Building Plan"
    };
    photoMetadata.push(meta);
    photoUploads.push({ file: basicInfoFiles.buildingPlan, meta });
  }

  const hasExtraFiles = extraBasicInfoFiles && Object.keys(extraBasicInfoFiles).some(k => extraBasicInfoFiles[k]?.length > 0);
  if (hasExtraFiles) {
    for (const typeCode of Object.keys(extraBasicInfoFiles)) {
      const isPlan = typeCode.toUpperCase().includes('PLAN');
      let extraTypeId = isPlan ? planTypeId : frontTypeId;
      if (typesRes.success && typesRes.data) {
        const exactType = typesRes.data.find((t: any) => {
          const code = (t.photoTypeCode || t.PhotoTypeCode || "").toUpperCase();
          const tId = (t.id || t.Id || t.photoTypeId || t.PhotoTypeId || "").toString();
          if (code === typeCode.toUpperCase() || tId === typeCode) return true;
          if (isPlan && (code.includes('PLAN') || code.includes('DRAWING') || code.includes('BLUEPRINT'))) return true;
          if (!isPlan && (code.includes('ASSET') || code.includes('PROPERTY') || code.includes('FRONT') || code.includes('PHOTO'))) return true;
          return false;
        });
        if (exactType) extraTypeId = Number(exactType.id || exactType.Id || exactType.photoTypeId || exactType.PhotoTypeId) || (isPlan ? planTypeId : frontTypeId);
      }
      for (const file of extraBasicInfoFiles[typeCode]) {
        if (useFormData && formDataPayload) {
          formDataPayload.append("PhotoFiles", file, file.name || `photo_${typeCode}.jpg`);
        }

        const exactFileTypeId = (file as any).photoTypeId ? Number((file as any).photoTypeId) : extraTypeId;
        const exactDisplayOrder = (file as any).displayOrder ? Number((file as any).displayOrder) : displayOrder++;
        const exactRemarks = (file as any).remarks ? String((file as any).remarks) : `Additional Photo (${typeCode})`;

        const meta = {
          photoTypeId: exactFileTypeId > 0 ? exactFileTypeId : (isPlan ? planTypeId : frontTypeId),
          displayOrder: exactDisplayOrder,
          remarks: exactRemarks
        };
        photoMetadata.push(meta);
        photoUploads.push({ file, meta });
      }
    }
  }

  if (useFormData && formDataPayload) {
    const metaJson = JSON.stringify(photoMetadata);
    formDataPayload.append("PhotoMetadataJson", metaJson);
    payload = formDataPayload;
  } else {
    payload = apiRequest; // Send JSON for update when there are no files
  }

  return { payload, formDataPayload };
}
