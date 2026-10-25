/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PropertyPhotoTypeWithStatusDto, PropertyPhotoDto } from "@/types/photoplan.types";

export function buildInitialPhotoSlots(
  availableTypes: PropertyPhotoTypeWithStatusDto[],
  existingDbPhotos: PropertyPhotoDto[],
  initialFrontPhoto?: string | null,
  initialBuildingPlan?: string | null,
  basicInfoFiles?: any,
  extraFiles?: Record<string, File[]>
): PropertyPhotoTypeWithStatusDto[] {
  // If no available types provided, return empty or fallback
  if (!availableTypes || availableTypes.length === 0) return [];

  return availableTypes.map(type => {
    const existingCount = existingDbPhotos.filter(p => p.photoTypeId === type.photoTypeId).length;
    let localCount = 0;

    // Maintain backwards compatibility mapping for initialFrontPhoto and initialBuildingPlan
    const isFront = 
      type.photoTypeCode === "PROPERTY_PHOTO" || 
      type.photoTypeCode === "PROPERTY" ||
      type.photoTypeCode?.toUpperCase().startsWith("ASSET_PHOTO") ||
      type.photoTypeName?.toLowerCase().includes("asset photo") ||
      type.photoTypeName?.toLowerCase().includes("front");

    const isPlan = 
      type.photoTypeCode === "PHOTO_PLAN" || 
      type.photoTypeCode === "PLAN" ||
      type.photoTypeCode?.toUpperCase().includes("PLAN") ||
      type.photoTypeName?.toLowerCase().includes("plan");

    if (isFront) {
      localCount += (initialFrontPhoto && existingCount === 0 ? 1 : 0) + (basicInfoFiles?.frontPhoto ? 1 : 0);
    }
    if (isPlan) {
      localCount += (initialBuildingPlan && existingCount === 0 ? 1 : 0) + (basicInfoFiles?.buildingPlan ? 1 : 0);
    }

    const extraList = (extraFiles && type.photoTypeCode && extraFiles[type.photoTypeCode]) || 
                      (extraFiles && type.photoTypeId != null && extraFiles[String(type.photoTypeId)]) || [];
    localCount += extraList.length;

    return {
      ...type,
      hasPhoto: existingCount > 0 || localCount > 0,
      photoCount: existingCount + localCount,
      documentGuid: existingCount > 0 ? type.documentGuid : undefined,
      viewUrl: existingCount > 0 ? type.viewUrl : undefined,
      allowMultiple: (type as any).allowMultiple ?? true,
      propertyPhotoId: type.photoTypeId // fallback if needed
    };
  });
}

export function buildInitialPhotos(
  availableTypes: PropertyPhotoTypeWithStatusDto[],
  existingDbPhotos: PropertyPhotoDto[],
  assetId: number,
  initialFrontPhoto?: string | null,
  initialBuildingPlan?: string | null,
  basicInfoFiles?: any,
  extraFiles?: Record<string, File[]>,
  removedPhotoIds?: Set<number>
): PropertyPhotoDto[] {
  const filteredDbPhotos = removedPhotoIds && removedPhotoIds.size > 0
    ? existingDbPhotos.filter(p => !removedPhotoIds.has(p.propertyPhotoId) && !removedPhotoIds.has((p as any).photoId))
    : existingDbPhotos;
  const photos: PropertyPhotoDto[] = [...filteredDbPhotos];

  const frontType = availableTypes.find(t => 
    t.photoTypeCode === "PROPERTY_PHOTO" || 
    t.photoTypeCode === "PROPERTY" || 
    t.photoTypeCode?.toUpperCase().startsWith("ASSET_PHOTO") ||
    t.photoTypeName?.toLowerCase().includes("asset photo") ||
    t.photoTypeName?.toLowerCase().includes("front")
  );
  const planType = availableTypes.find(t => 
    t.photoTypeCode === "PHOTO_PLAN" || 
    t.photoTypeCode === "PLAN" || 
    t.photoTypeCode?.toUpperCase().includes("PLAN") ||
    t.photoTypeName?.toLowerCase().includes("plan")
  );

  let propertyPhotoOrder = photos.filter(p => p.photoTypeId === frontType?.photoTypeId).length + 1;
  let planPhotoOrder = photos.filter(p => p.photoTypeId === planType?.photoTypeId).length + 1;

  if (frontType && initialFrontPhoto && !photos.find(p => p.photoTypeId === frontType.photoTypeId)) {
    photos.push({
      propertyPhotoId: propertyPhotoOrder,
      propertyId: assetId,
      photoTypeId: frontType.photoTypeId,
      photoTypeCode: frontType.photoTypeCode,
      photoTypeName: frontType.photoTypeName,
      displayOrder: propertyPhotoOrder++,
      remarks: "Asset Image (Existing)",
      viewUrl: initialFrontPhoto,
      ...( { isVerified: true } as any )
    });
  }

  if (frontType && basicInfoFiles?.frontPhoto) {
    photos.push({
      propertyPhotoId: propertyPhotoOrder,
      propertyId: 0,
      photoTypeId: frontType.photoTypeId,
      photoTypeCode: frontType.photoTypeCode,
      photoTypeName: frontType.photoTypeName,
      displayOrder: propertyPhotoOrder++,
      remarks: "Asset Image",
      viewUrl: URL.createObjectURL(basicInfoFiles.frontPhoto),
      file: basicInfoFiles.frontPhoto,
    } as any);
  }

  if (planType && initialBuildingPlan && !photos.find(p => p.photoTypeId === planType.photoTypeId)) {
    photos.push({
      propertyPhotoId: planPhotoOrder + 100,
      propertyId: assetId,
      photoTypeId: planType.photoTypeId,
      photoTypeCode: planType.photoTypeCode,
      photoTypeName: planType.photoTypeName,
      displayOrder: planPhotoOrder++,
      remarks: planType.photoTypeName ? `${planType.photoTypeName} (Existing)` : "Asset Plan (Existing)",
      viewUrl: initialBuildingPlan,
      ...( { isVerified: true } as any )
    });
  }

  if (planType && basicInfoFiles?.buildingPlan) {
    photos.push({
      propertyPhotoId: planPhotoOrder + 100,
      propertyId: 0,
      photoTypeId: planType.photoTypeId,
      photoTypeCode: planType.photoTypeCode,
      photoTypeName: planType.photoTypeName,
      displayOrder: planPhotoOrder++,
      remarks: planType.photoTypeName || "Asset Plan",
      viewUrl: URL.createObjectURL(basicInfoFiles.buildingPlan),
      file: basicInfoFiles.buildingPlan,
    } as any);
  }

  if (extraFiles) {
    Object.keys(extraFiles).forEach((typeCode) => {
      const typeDef = availableTypes.find(t => t.photoTypeCode === typeCode || String(t.photoTypeId) === typeCode);
      if (typeDef) {
        let order = photos.filter(p => p.photoTypeId === typeDef.photoTypeId).length + 1;
        extraFiles[typeCode].forEach((file) => {
          photos.push({
            propertyPhotoId: Date.now() + order, // Use timestamp to ensure uniqueness
            propertyId: 0,
            photoTypeId: typeDef.photoTypeId,
            photoTypeCode: typeDef.photoTypeCode,
            photoTypeName: typeDef.photoTypeName,
            displayOrder: order++,
            remarks: typeDef.photoTypeName,
            viewUrl: URL.createObjectURL(file),
            file: file,
          } as any);
        });
      }
    });
  }

  return photos;
}
