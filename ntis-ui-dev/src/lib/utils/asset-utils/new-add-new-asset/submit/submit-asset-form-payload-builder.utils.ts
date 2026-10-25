/* eslint-disable @typescript-eslint/no-explicit-any */
import { AssetMasterRequest } from "@/types/asset-types/basic-info/asset-wizard.types";
import { fetchAssetConditionMasterAction } from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/lookups/action";
import { departmentMapping, wardMapping, zoneMapping } from "./submit-asset-form-mappings";
import { parseNumericId, getSafeForeignKeyId } from "./submit-asset-form-id-helpers.utils";
import { buildFieldValuesFromAttributes } from "./submit-asset-form-field-values.utils";

/**
 * Resolves form field value: prioritizes active user input in UI form controls over hydrated DB IDs.
 * If activeVal is defined: non-empty string/value is used; explicit empty string/null returns null.
 * If activeVal is undefined: falls back to fallbackVal.
 */
function resolveFormField(activeVal: any, fallbackVal: any): any {
  if (activeVal !== undefined) {
    if (activeVal === "" || activeVal === null) return null;
    return activeVal;
  }
  if (fallbackVal !== undefined && fallbackVal !== "" && fallbackVal !== null) {
    return fallbackVal;
  }
  return null;
}

/**
 * Builds the AssetMasterRequest (basic-info fields + EAV fieldValues) payload
 * that gets persisted via assetMasterService. `assetConditionId` is left null
 * here — it is resolved separately via `resolveAssetCondition` and applied by
 * the caller, matching the original two-pass resolution order.
 */
export function buildBasicInfoPayload(
  formData: any,
  fieldDefs: any[] = [],
  categoryId: number = 0,
  typeId: number = 0,
  assetNo: string = '',
  sessionIds?: { sessionOrgId?: number | null; sessionUserId?: number | null }
): AssetMasterRequest & { id?: number; assetId?: number } {
  const resolvedDept = resolveFormField(formData.department, formData.departmentId);
  const resolvedZone = resolveFormField(formData.zone, formData.zoneId);
  const resolvedWard = resolveFormField(formData.ward, formData.wardId);
  const resolvedSubZone = resolveFormField((formData as any).subzone, formData.subZoneId);
  const resolvedMouja = resolveFormField((formData as any).mouja, (formData as any).moujaId);

  const rawLength = resolveFormField(
    formData.length,
    formData.totalLength ?? formData.attributes?.length ?? formData.attributes?.totalLength
  );
  const parsedLength = rawLength !== null && !isNaN(Number(rawLength)) ? Number(rawLength) : null;

  const rawWidth = resolveFormField(
    formData.width,
    formData.averageWidth ?? formData.attributes?.width ?? formData.attributes?.averageWidth
  );
  const parsedWidth = rawWidth !== null && !isNaN(Number(rawWidth)) ? Number(rawWidth) : null;

  const apiRequest: AssetMasterRequest & { id?: number; assetId?: number } = {
    id: formData.id ? Number(formData.id) : undefined,
    assetId: formData.assetId ? Number(formData.assetId) : (formData.id ? Number(formData.id) : undefined),
    assetNo: assetNo,
    organizationId: sessionIds?.sessionOrgId ?? 1,
    departmentId: getSafeForeignKeyId(parseNumericId(resolvedDept, departmentMapping), true),
    assetName: formData.assetName || "",
    assetRegionalName: formData.assetNameRegional || (formData as any).assetRegionalName || null,
    assetCategoryId: categoryId,
    assetTypeId: typeId,
    parentAssetId: parseNumericId(formData.parentBuildingId || (formData as any).parentAssetId),
    hierarchyLevel: 0,
    hierarchyPath: "",
    address: formData.fullAddress || formData.address || "",
    RegionalAddress: formData.fullAddressRegional || formData.regionalAddress || (formData as any).RegionalAddress || null,
    wardId: getSafeForeignKeyId(parseNumericId(resolvedWard, wardMapping), true),
    zoneId: getSafeForeignKeyId(parseNumericId(resolvedZone, zoneMapping), true),
    subZoneId: (() => {
      const val = parseNumericId(resolvedSubZone);
      return val !== null && val > 0 ? val : null;
    })(),
    moujaId: (() => {
      const val = parseNumericId(resolvedMouja);
      if (val !== null && val > 0) {
        return val;
      }
      return null;
    })(),
    latitude: formData.latitude ? Number(formData.latitude) : null,
    longitude: formData.longitude ? Number(formData.longitude) : null,
    csn: resolveFormField(formData.surveyNumber, (formData as any).csn ?? (formData as any).CSN),
    lengthMtr: parsedLength,
    lengthFt: parsedLength !== null && parsedLength > 0 ? parsedLength * 3.28084 : null,
    widthMtr: parsedWidth,
    widthFt: parsedWidth !== null && parsedWidth > 0 ? parsedWidth * 3.28084 : null,
    landAreaSqMeter: (() => {
      const rawArea = Number(formData.landArea || formData.attributes?.landArea || formData.attributes?.LandArea);
      if (isNaN(rawArea) || rawArea <= 0) return null;
      const unit = (formData.attributes?.Unit || formData.attributes?.unit || "sq.m").toLowerCase();
      if (unit.includes("sq.ft") || unit.includes("ft")) {
        return rawArea * 0.092903;
      }
      return rawArea;
    })(),
    landAreaSqFeet: (() => {
      const rawArea = Number(formData.landArea || formData.attributes?.landArea || formData.attributes?.LandArea);
      if (isNaN(rawArea) || rawArea <= 0) return null;
      const unit = (formData.attributes?.Unit || formData.attributes?.unit || "sq.m").toLowerCase();
      if (unit.includes("sq.ft") || unit.includes("ft")) {
        return rawArea;
      }
      return rawArea * 10.764;
    })(),
    totalLength: parsedLength,
    averageWidth: parsedWidth,
    landRate: formData.landRate ? Number(formData.landRate) : null,
    ownershipType: formData.ownershipType || "municipal",
    occupancyStatus: formData.occupancyStatus || formData.attributes?.occupancyStatus || null,
    assetConditionId: null, // Temporary, will be set below
    encroachmentStatus: (formData.encroachmentStatus || formData.attributes?.encroachmentStatus || null) as string | null,
    inChargeName: formData.inChargeName || null,
    inChargeRegionalName: (formData as any).inChargeNameRegional || (formData as any).inChargeRegionalName || null,
    inChargeDesignationId: (() => {
      const desigRaw = resolveFormField(formData.inChargeDesignation, (formData as any).inChargeDesignationId);
      return desigRaw && !isNaN(Number(desigRaw)) ? Number(desigRaw) : null;
    })(),
    inChargeMobile: resolveFormField(formData.inChargeMobile, (formData as any).inchargeContact ?? (formData as any).inChargeContact),
    inChargeEmail: formData.inChargeEmail || null,
    locality: formData.locality || null,
    pinCode: resolveFormField(formData.pinCode, (formData as any).PinCode),
    partitionNo: resolveFormField(formData.partitionNo, (formData as any).partitionNumber),
    upicId: resolveFormField(formData.upicId, (formData as any).UpicId),
    propertyNo: resolveFormField(formData.propertyNumber, (formData as any).propertyNo),
    constructionYear: formData.constructionYear ? parseInt(formData.constructionYear, 10) : null,
    plotNo: resolveFormField(formData.plotNumber, (formData as any).plotNo ?? formData.attributes?.plotNumber ?? formData.attributes?.plotNo),
    assetWardNo: (formData.assetWardNo || formData.attributes?.assetWardNo || null) as string | null,
    mpmsNo: resolveFormField(formData.mpmsNo, (formData as any).mpmsId ?? (formData as any).mpms ?? formData.attributes?.mpmsNo ?? formData.attributes?.mpms),
    isActive: true,
    createdBy: sessionIds?.sessionUserId ?? 1,

    // Related dynamic attribute values (EAV Pattern mapping to AMS.AssetFieldValue)
    fieldValues: buildFieldValuesFromAttributes(formData, fieldDefs),
  };

  return apiRequest;
}

/**
 * Resolves the final assetConditionId, looking it up by name via the asset
 * condition master when only a condition name (not a numeric ID) was submitted.
 */
export async function resolveAssetCondition(formData: any): Promise<number | null> {
  const condVal = resolveFormField(formData.condition, (formData as any).assetConditionId ?? (formData as any).conditionId);
  let finalConditionId = (condVal && !isNaN(Number(condVal))) ? Number(condVal) : null;
  let finalConditionName = (condVal && isNaN(Number(condVal))) ? String(condVal) : null;

  if (!finalConditionId && finalConditionName) {
    try {
      const condRes = await fetchAssetConditionMasterAction(undefined, Number(formData.categoryId || 1));
      if (condRes.success && condRes.data) {
        const condMatch = condRes.data.find((c: any) => c.conditionName?.toLowerCase() === finalConditionName?.toLowerCase());
        if (condMatch) {
          finalConditionId = condMatch.id;
          finalConditionName = condMatch.conditionName ?? null;
        }
      }
    } catch (_e) { }
  }

  return finalConditionId;
}
