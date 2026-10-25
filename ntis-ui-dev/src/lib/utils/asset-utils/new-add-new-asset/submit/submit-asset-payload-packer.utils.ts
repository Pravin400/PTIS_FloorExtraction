 
import type {
  AssetMasterRequest,
  ExtraBasicInfoFileItem,
} from "@/types/asset/municipal-Asset/new-add-new-asset/asset-wizard.types";
import type {
  BasicInfoFilesPayload,
  SubmitPhotoMetadataItem,
} from "@/types/asset/municipal-Asset/new-add-new-asset";

export type { SubmitPhotoMetadataItem };

export async function buildSubmitFormPayload(
  apiRequest: AssetMasterRequest,
  basicInfoFiles: BasicInfoFilesPayload,
  extraBasicInfoFiles: Record<string, ExtraBasicInfoFileItem[]>
): Promise<{ payload: FormData; formDataPayload: FormData }> {
  const formDataPayload = new FormData();
  Object.entries(apiRequest).forEach(([key, value]) => {
    if (value !== null && value !== undefined && key !== "fieldValues") {
      if (Array.isArray(value)) {
        value.forEach((v) => formDataPayload.append(key, String(v)));
      } else if (typeof value === "object" && !(value instanceof File)) {
        formDataPayload.append(key, JSON.stringify(value));
      } else {
        formDataPayload.append(key, String(value));
      }
    }
  });

  if (Array.isArray(apiRequest.fieldValues) && apiRequest.fieldValues.length > 0) {
    apiRequest.fieldValues.forEach((fv, i) => {
      if (fv.fieldDefinitionId) formDataPayload.append(`FieldValues[${i}].FieldDefinitionId`, String(fv.fieldDefinitionId));
      if (fv.fieldName) formDataPayload.append(`FieldValues[${i}].FieldName`, String(fv.fieldName));
      if (fv.fieldValue !== undefined && fv.fieldValue !== null) formDataPayload.append(`FieldValues[${i}].FieldValue`, String(fv.fieldValue));
      formDataPayload.append(`FieldValues[${i}].IsActive`, String(fv.isActive !== false));
    });
    formDataPayload.append("FieldValuesJson", JSON.stringify(apiRequest.fieldValues));
  }

  let displayOrder = 1;
  const photoMetadata: SubmitPhotoMetadataItem[] = [];
  if (basicInfoFiles?.frontPhoto) {
    formDataPayload.append("photoFiles", basicInfoFiles.frontPhoto, basicInfoFiles.frontPhoto.name || "frontPhoto.jpg");
    photoMetadata.push({ photoTypeId: 1, displayOrder: displayOrder++, remarks: "Front Photo" });
  }

  if (basicInfoFiles?.buildingPlan) {
    formDataPayload.append("photoFiles", basicInfoFiles.buildingPlan, basicInfoFiles.buildingPlan.name || "buildingPlan.pdf");
    photoMetadata.push({ photoTypeId: 2, displayOrder: displayOrder++, remarks: "Building Plan" });
  }

  const hasExtra = extraBasicInfoFiles && Object.keys(extraBasicInfoFiles).some((k) => extraBasicInfoFiles[k]?.length > 0);
  if (hasExtra) {
    for (const typeCode of Object.keys(extraBasicInfoFiles)) {
      for (const item of extraBasicInfoFiles[typeCode]) {
        if (item.file) {
          formDataPayload.append("photoFiles", item.file, item.file.name || item.name || `photo_${typeCode}.jpg`);
          photoMetadata.push({
            photoTypeId: item.photoTypeId ? Number(item.photoTypeId) : 3,
            displayOrder: item.displayOrder ? Number(item.displayOrder) : displayOrder++,
            remarks: item.remarks || `Additional Photo (${typeCode})`,
          });
        }
      }
    }
  }

  formDataPayload.append("photoMetadataJson", JSON.stringify(photoMetadata));
  return { payload: formDataPayload, formDataPayload };
}
