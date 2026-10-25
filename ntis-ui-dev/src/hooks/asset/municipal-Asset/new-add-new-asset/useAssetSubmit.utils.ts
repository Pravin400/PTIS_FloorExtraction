import { buildAssetMasterRequest } from "@/lib/utils/asset-utils/new-add-new-asset/submit/submit-asset-form-builder.utils";
import type { BuildingBasicInfoFormData } from "@/types/asset/municipal-Asset/new-add-new-asset/buildBasicInfo.types";
import type { ExtraBasicInfoFileItem } from "@/types/asset/municipal-Asset/new-add-new-asset/asset-wizard.types";

import type { DeepComparableObject, JsonPrimitive } from "@/types/asset/municipal-Asset/new-add-new-asset";

export type { DeepComparableObject, JsonPrimitive };

export function isDeepEqual(
  obj1: DeepComparableObject | null | undefined,
  obj2: DeepComparableObject | null | undefined
): boolean {
  if (obj1 === obj2) return true;
  if (!obj1 || !obj2 || typeof obj1 !== "object" || typeof obj2 !== "object") {
    return false;
  }
  const keys1 = Object.keys(obj1).filter((k) => obj1[k] !== undefined);
  const keys2 = Object.keys(obj2).filter((k) => obj2[k] !== undefined);
  if (keys1.length !== keys2.length) return false;
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    const val1 = obj1[key];
    const val2 = obj2[key];
    if (val1 !== val2) {
      if (typeof val1 === "object" && typeof val2 === "object" && val1 !== null && val2 !== null) {
        if (!isDeepEqual(val1 as DeepComparableObject, val2 as DeepComparableObject)) {
          return false;
        }
      } else {
        return false;
      }
    }
  }
  return true;
}

export function withLocale(pathname: string, targetPath: string) {
  const segments = pathname.split("/").filter(Boolean);
  const locale = segments[0] || "en";
  
  // if current path is an edit route, rewrite targetPath to match
  const editRouteMatch = pathname.match(/\/edit-Asset\/(\d+)/);
  let finalTargetPath = targetPath;
  if (editRouteMatch) {
    const assetId = editRouteMatch[1];
    finalTargetPath = targetPath.replace('/add-New-Asset', `/edit-Asset/${assetId}`);
  }
  
  return `/${locale}${finalTargetPath}`;
}

/** Builds the multipart FormData envelope submitAssetForm expects: the typed
 * AssetMasterRequest JSON blob plus basic-info files (front photo / building
 * plan / extra files) — shared by both the final-submit and save-and-next paths.
 *
 * Uses buildAssetMasterRequest() to map formData → backend DTO, ensuring only
 * server-expected fields are transmitted and client-only fields are omitted. */
export function buildAssetSubmitFormData(
  formData: BuildingBasicInfoFormData,
  basicInfoFiles: { frontPhoto?: File; buildingPlan?: File } | null | undefined,
  extraBasicInfoFiles: Record<string, (File | ExtraBasicInfoFileItem)[]> | null | undefined
): FormData {
  const clientFormData = new FormData();
  // Map to the typed backend DTO — omits client-only fields (hydrated, floors, etc.)
  const dto = buildAssetMasterRequest(formData);
  const resolvedId = Number(formData.id || formData.assetId);
  if (!isNaN(resolvedId) && resolvedId > 0) {
    dto.id = resolvedId;
    dto.assetId = resolvedId;
    clientFormData.append("id", String(resolvedId));
    clientFormData.append("assetId", String(resolvedId));
  }
  // ── Preserve all source-key names that buildBasicInfoPayload reads on the SERVER ──
  //
  // The flow is:
  //   CLIENT: buildAssetMasterRequest(formData) → renames keys → JSON.stringify(dto) → FormData
  //   SERVER: JSON.parse(formData) → BuildingBasicInfoFormData → buildBasicInfoPayload(formData)
  //
  // buildBasicInfoPayload reads the ORIGINAL form field names (e.g. formData.propertyNumber),
  // but the DTO only has the renamed backend names (e.g. propertyNo). Every renamed field
  // must be re-injected here so the server can rebuild the payload correctly.

  const resolvedCategoryId = Number(formData.categoryId || 0);
  const resolvedTypeId = Number(formData.typeId || 0);

  const dtoWithIds = {
    ...dto,

    // ── Category / Type (resolveCategoryAndType reads these) ──────────────────
    categoryId: resolvedCategoryId > 0 ? resolvedCategoryId : undefined,
    typeId:     resolvedTypeId     > 0 ? resolvedTypeId     : undefined,

    // ── Identification ────────────────────────────────────────────────────────
    propertyNumber: formData.propertyNumber,   // → propertyNo
    surveyNumber:   formData.surveyNumber,     // → csn
    plotNumber:     formData.plotNumber,       // → plotNo
    partitionNo:    formData.partitionNo,
    upicId:         formData.upicId,
    mpmsNo:         formData.mpmsNo,
    pTaxId:         formData.pTaxId,

    // ── Area ──────────────────────────────────────────────────────────────────
    landArea: formData.landArea,               // → landAreaSqMeter / landAreaSqFeet
    length:   formData.length,                 // → lengthMtr
    width:    formData.width,                  // → widthMtr

    // ── Address ───────────────────────────────────────────────────────────────
    fullAddress:         formData.fullAddress,         // → address
    fullAddressRegional: formData.fullAddressRegional, // → RegionalAddress
    pinCode:             formData.pinCode,
    locality:            formData.locality,

    // ── Asset Condition ───────────────────────────────────────────────────────
    condition:        formData.condition,
    assetConditionId: formData.assetConditionId,
    assetCondition:   formData.assetCondition,

    // ── Parent Asset ─────────────────────────────────────────────────────────
    parentBuildingId: formData.parentBuildingId,
    parentAssetId:    formData.parentAssetId,

    // ── Dynamic EAV Attributes (Additional Details) ─────────────────────────
    attributes: formData.attributes,

    // ── Administrative Location ──────────────────────────────────────────────
    zone:        formData.zone,
    zoneId:      formData.zoneId || formData.zone,
    ward:        formData.ward,
    wardId:      formData.wardId || formData.ward,
    mouja:       formData.mouja,
    moujaId:     formData.moujaId || formData.mouja,
    subzone:     formData.subzone,
    subZoneId:   formData.subZoneId || formData.subzone,

    // ── Department / In-Charge ────────────────────────────────────────────────
    department:           formData.department,
    departmentId:         formData.departmentId || formData.department,
    inChargeName:         formData.inChargeName,
    inChargeNameRegional: formData.inChargeNameRegional || formData.inChargeRegionalName,
    inChargeRegionalName: formData.inChargeRegionalName || formData.inChargeNameRegional,
    inChargeDesignation:  formData.inChargeDesignation,
    inChargeDesignationId: formData.inChargeDesignation,
    inChargeMobile:       formData.inChargeMobile,
    inChargeEmail:        formData.inChargeEmail,

    // ── Status / Legal ────────────────────────────────────────────────────────
    ownershipType:      formData.ownershipType,
    encroachmentStatus: formData.encroachmentStatus,
    occupancyStatus:    formData.occupancyStatus,
    status:             formData.status,
  };

  clientFormData.append("formData", JSON.stringify(dtoWithIds));

  if (basicInfoFiles?.frontPhoto) {
    clientFormData.append("frontPhoto", basicInfoFiles.frontPhoto);
  }
  if (basicInfoFiles?.buildingPlan) {
    clientFormData.append("buildingPlan", basicInfoFiles.buildingPlan);
  }

  if (extraBasicInfoFiles) {
    for (const typeCode of Object.keys(extraBasicInfoFiles)) {
      const files = extraBasicInfoFiles[typeCode];
      if (Array.isArray(files)) {
        for (let i = 0; i < files.length; i++) {
          const item = files[i];
          const isFile = item instanceof File;
          const fileObj = isFile ? item : (item as ExtraBasicInfoFileItem).file;
          const remarks = isFile ? "" : (item as ExtraBasicInfoFileItem).remarks || "";
          const displayOrder = isFile ? "" : String((item as ExtraBasicInfoFileItem).displayOrder || "");
          const photoTypeId = isFile ? "" : String((item as ExtraBasicInfoFileItem).photoTypeId || "");

          if (fileObj) {
            clientFormData.append("extraFiles", fileObj);
          }
          clientFormData.append("extraFiles_typeCode", typeCode);
          clientFormData.append("extraFiles_remarks", remarks);
          clientFormData.append("extraFiles_order", displayOrder);
          clientFormData.append("extraFiles_typeId", photoTypeId);
        }
      }
    }
  }

  return clientFormData;
}
