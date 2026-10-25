 
import type {
  AssetMasterRequest,
  ExtraBasicInfoFileItem,
} from "@/types/asset/municipal-Asset/new-add-new-asset/asset-wizard.types";
import type { AssetFieldDefinition } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/asset-field-definition.service";
import type { BuildingBasicInfoFormData } from "@/types/asset/municipal-Asset/new-add-new-asset/buildBasicInfo.types";
import {
  buildFieldValuesFromAttributes,
  getDynamicOrganizationId,
  getDynamicUserId,
} from "./submit-asset-dynamic-fields.utils";

import type {
  BasicInfoFilesPayload,
  AssetCreationResponseRecord,
  SubmitPhotoMetadataItem,
} from "@/types/asset/municipal-Asset/new-add-new-asset";

export type { BasicInfoFilesPayload, AssetCreationResponseRecord, SubmitPhotoMetadataItem };

export const parseNumericId = (val: number | string | null | undefined): number | null => {
  if (val === null || val === undefined || String(val).trim() === "" || String(val).trim() === "0") return null;
  const parsed = Number(val);
  return !isNaN(parsed) && parsed > 0 ? parsed : null;
};

export const getSafeForeignKeyId = (parsedId: number | null): number | null => {
  return parsedId !== null && parsedId > 0 ? parsedId : null;
};

export function extractAssetIdFromResponse(
  resData: AssetCreationResponseRecord | null | undefined,
  isUpdate: boolean,
  parsedId: number
): number | null {
  if (typeof resData === "number" && !isNaN(resData) && resData > 0) {
    return resData;
  }
  if (!resData) return isUpdate ? parsedId : null;
  const check = (o: AssetCreationResponseRecord | null | undefined): number | null => {
    if (!o) return null;
    if (typeof o === "number" && !isNaN(o) && o > 0) return o;
    const id = o.id ?? o.Id ?? o.assetId ?? o.AssetId ?? o.assetMasterId ?? o.AssetMasterId;
    return id && !isNaN(Number(id)) && Number(id) > 0 ? Number(id) : null;
  };
  const direct = check(resData);
  if (direct) return direct;
  const candidates = [
    resData.data,
    resData.Data,
    resData.items,
    resData.Items,
    resData.record,
    resData.Record,
    resData.result,
    resData.Result,
  ];
  for (const c of candidates) {
    if (Array.isArray(c) && c.length > 0) {
      const found = check(c[0]);
      if (found) return found;
    } else if (c && typeof c === "object") {
      const found = check(c as AssetCreationResponseRecord);
      if (found) return found;
    } else if (typeof c === "number" && !isNaN(c) && c > 0) {
      return c;
    }
  }
  return isUpdate ? parsedId : null;
}

export function parseSubmitInput(
  input: BuildingBasicInfoFormData | FormData,
  initialBasicInfoFiles?: BasicInfoFilesPayload,
  initialExtraFiles?: Record<string, ExtraBasicInfoFileItem[]>
): {
  formData: BuildingBasicInfoFormData;
  basicInfoFiles: BasicInfoFilesPayload;
  extraBasicInfoFiles: Record<string, ExtraBasicInfoFileItem[]>;
} {
  let formData: BuildingBasicInfoFormData;
  const basicInfoFiles: BasicInfoFilesPayload = initialBasicInfoFiles || {};
  const extraBasicInfoFiles: Record<string, ExtraBasicInfoFileItem[]> = initialExtraFiles || {};

  if (input instanceof FormData) {
    formData = JSON.parse(input.get("formData") as string) as BuildingBasicInfoFormData;
    if (!formData.attributes && (formData as unknown as Record<string, unknown>).fieldValuesJson) {
      try {
        formData.attributes = JSON.parse((formData as unknown as Record<string, unknown>).fieldValuesJson as string);
      } catch {}
    }
    if (!formData.id && input.has("id")) formData.id = Number(input.get("id"));
    if (!formData.assetId && input.has("assetId")) formData.assetId = Number(input.get("assetId"));
    if (!formData.id && formData.assetId) formData.id = formData.assetId;
    if (!formData.assetId && formData.id) formData.assetId = formData.id;
    if (input.has("frontPhoto")) basicInfoFiles.frontPhoto = input.get("frontPhoto") as File;
    if (input.has("buildingPlan")) basicInfoFiles.buildingPlan = input.get("buildingPlan") as File;

    const extraFilesCodes = input.getAll("extraFiles_typeCode");
    if (extraFilesCodes.length > 0) {
      const files = input.getAll("extraFiles") as File[];
      const remarks = input.getAll("extraFiles_remarks");
      const orders = input.getAll("extraFiles_order");
      const typeIds = input.getAll("extraFiles_typeId");

      for (let i = 0; i < extraFilesCodes.length; i++) {
        const typeCode = String(extraFilesCodes[i]);
        if (!extraBasicInfoFiles[typeCode]) extraBasicInfoFiles[typeCode] = [];
        const fileObj: ExtraBasicInfoFileItem = {
          file: files[i],
          name: files[i]?.name,
          remarks: remarks[i] !== "null" ? String(remarks[i]) : "",
          displayOrder: orders[i] ? Number(orders[i]) : undefined,
          photoTypeId: typeIds[i] ? Number(typeIds[i]) : undefined,
        };
        extraBasicInfoFiles[typeCode].push(fileObj);
      }
    }
  } else {
    formData = input;
  }

  return { formData, basicInfoFiles, extraBasicInfoFiles };
}

export function resolveCategoryAndType(formData: BuildingBasicInfoFormData): { categoryId: number; typeId: number } {
  const categoryId = Number(formData.categoryId || 0);
  const typeId = Number(formData.typeId || 0);
  return {
    categoryId: !isNaN(categoryId) && categoryId > 0 ? categoryId : 0,
    typeId: !isNaN(typeId) && typeId > 0 ? typeId : 0,
  };
}

export function buildBasicInfoPayload(
  formData: BuildingBasicInfoFormData,
  fieldDefs: AssetFieldDefinition[],
  categoryId: number,
  typeId: number,
  assetNo: string,
  sessionContext?: { sessionOrgId?: number | null; sessionUserId?: number | null }
): AssetMasterRequest {
  const resolvedId = parseNumericId(formData.id || formData.assetId);
  const len = Number(formData.length || formData.totalLength || formData.attributes?.length) || null;
  const wid = Number(formData.width || formData.averageWidth || formData.attributes?.width) || null;
  const rawArea = Number(formData.landArea || formData.attributes?.landArea);
  const unitAttr = typeof formData.attributes?.Unit === "string" ? formData.attributes.Unit : "sq.m";
  const isSqFt = unitAttr.toLowerCase().includes("ft");

  return {
    id: resolvedId,
    assetId: resolvedId,
    assetNo,
    organizationId: getDynamicOrganizationId(formData, sessionContext?.sessionOrgId),
    departmentId: getSafeForeignKeyId(parseNumericId(formData.department || formData.departmentId)),
    assetName: formData.assetName?.trim() || "Draft Asset",
    assetRegionalName: formData.assetNameRegional || formData.assetRegionalName || null,
    assetCategoryId: categoryId,
    assetTypeId: typeId,
    parentAssetId: parseNumericId(formData.parentBuildingId || formData.parentAssetId),
    hierarchyLevel: 0,
    hierarchyPath: "",
    address: formData.fullAddress || "",
    RegionalAddress: formData.fullAddressRegional || null,
    wardId: getSafeForeignKeyId(parseNumericId(formData.wardId || formData.ward)),
    zoneId: getSafeForeignKeyId(parseNumericId(formData.zoneId || formData.zone)),
    subZoneId: parseNumericId(formData.subZoneId || formData.subzone),
    moujaId: parseNumericId(formData.moujaId || formData.mouja),
    latitude: formData.latitude ? Number(formData.latitude) : null,
    longitude: formData.longitude ? Number(formData.longitude) : null,
    csn: formData.surveyNumber || formData.csn || null,
    lengthMtr: len,
    lengthFt: len ? len * 3.28084 : null,
    widthMtr: wid,
    widthFt: wid ? wid * 3.28084 : null,
    landAreaSqMeter: !isNaN(rawArea) && rawArea > 0 ? (isSqFt ? rawArea * 0.092903 : rawArea) : null,
    landAreaSqFeet: !isNaN(rawArea) && rawArea > 0 ? (isSqFt ? rawArea : rawArea * 10.764) : null,
    totalLength: len,
    averageWidth: wid,
    landRate: formData.landRate ? Number(formData.landRate) : null,
    ownershipType: formData.ownershipType || null,
    occupancyStatus: formData.occupancyStatus || (typeof formData.attributes?.occupancyStatus === "string" ? formData.attributes.occupancyStatus : null),
    assetConditionId: parseNumericId(formData.assetCondition || formData.assetConditionId || formData.condition),
    encroachmentStatus: (formData.encroachmentStatus && formData.encroachmentStatus !== "-- Select --") 
      ? formData.encroachmentStatus 
      : (typeof formData.attributes?.encroachmentStatus === "string" && formData.attributes.encroachmentStatus !== "-- Select --" 
          ? formData.attributes.encroachmentStatus 
          : null),
    createdBy: getDynamicUserId(formData, sessionContext?.sessionUserId),
    inChargeName: formData.inChargeName || null,
    inChargeRegionalName: formData.inChargeNameRegional || formData.inChargeRegionalName || null,
    inChargeDesignationId: parseNumericId(formData.inChargeDesignation),
    inChargeMobile: formData.inChargeMobile || null,
    inChargeEmail: formData.inChargeEmail || null,
    locality: formData.locality || null,
    pinCode: formData.pinCode || null,
    partitionNo: formData.partitionNo || null,
    upicId: formData.upicId || null,
    propertyNo: formData.propertyNumber || null,
    constructionYear: formData.constructionYear ? parseInt(formData.constructionYear, 10) : null,
    plotNo: formData.plotNumber || (typeof formData.attributes?.plotNumber === "string" ? formData.attributes.plotNumber : null) || (typeof formData.attributes?.plotNo === "string" ? formData.attributes.plotNo : null),
    assetWardNo: formData.assetWardNo || (typeof formData.attributes?.assetWardNo === "string" ? formData.attributes.assetWardNo : undefined),
    mpmsNo: formData.mpmsNo || (typeof formData.attributes?.mpmsNo === "string" ? formData.attributes.mpmsNo : null) || (typeof formData.attributes?.mpms === "string" ? formData.attributes.mpms : null),
    pTaxId: formData.pTaxId || null,
    isActive: true,
    fieldValues: buildFieldValuesFromAttributes(formData, fieldDefs),
  };
}

export function buildAssetMasterRequest(
  formData: BuildingBasicInfoFormData
): AssetMasterRequest {
  const { categoryId, typeId } = resolveCategoryAndType(formData);
  const assetNo = formData.assetCode || formData.assetNo || "";

  const req = buildBasicInfoPayload(formData, [], categoryId, typeId, assetNo);
  if (formData.attributes) {
    req.fieldValuesJson = JSON.stringify(formData.attributes);
  }
  return req;
}

export { buildSubmitFormPayload } from "./submit-asset-payload-packer.utils";

export * from "./submit-asset-dynamic-fields.utils";
