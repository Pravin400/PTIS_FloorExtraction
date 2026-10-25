 
import { assetFieldValueService } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/asset-field-value.service";
import { assetMasterService } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/asset-master.service";
import { basicInfoLookupService } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/basic-info-lookup.service";
import { getBuildingFieldDefinitionsQuery } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/basic-info.service";
import { AssetMasterRequest } from "@/types/asset/municipal-Asset/new-add-new-asset/asset-wizard.types";
import { logger } from "@/lib/utils/logger";

/**
 * Fetches the EAV field definitions used to resolve dynamic attribute IDs via Server Action.
 */
import type { ProcessedField } from "@/lib/utils/asset-utils/new-add-new-asset/FieldRendererUtils";
import type { BuildingBasicInfoFormData } from "@/types/asset/municipal-Asset/new-add-new-asset/buildBasicInfo.types";
import type { RawConditionMasterItem } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/asset-condition.service";

/**
 * Fetches the EAV field definitions used to resolve dynamic attribute IDs via Server Action.
 */
export async function fetchFieldDefsForSubmit(categoryId: number, typeId: number): Promise<ProcessedField[]> {
  try {
    const defRes = await getBuildingFieldDefinitionsQuery(categoryId, typeId);
    if (defRes?.success && Array.isArray(defRes.data)) {
      return defRes.data;
    }
    if (defRes && !defRes.success) {
      throw new Error(`Failed to fetch field definitions: ${defRes.error}`);
    }
    return [];
  } catch (err) {
    logger.error("Error fetching field definitions for submit", { error: err instanceof Error ? err : undefined });
    throw err;
  }
}

/**
 * Resolves the authoritative asset number, preserving existing assetNo during update if missing in form.
 */
export async function resolveAssetNo(formData: BuildingBasicInfoFormData, parsedId: number, isUpdate: boolean): Promise<string> {
  let assetNo = (formData.assetNo || formData.assetCode || "").trim();
  if (!assetNo && isUpdate) {
    try {
      const existingAsset = await assetMasterService.getAssetById(parsedId);
      if (existingAsset.success && existingAsset.data) {
        assetNo = existingAsset.data.assetNo || existingAsset.data.assetCode || "";
      }
    } catch (err) {
      logger.warn("Failed to fetch existing asset to preserve assetNo during update", { error: err instanceof Error ? err : undefined });
    }
  }
  return assetNo;
}

/**
 * Resolves the numeric asset condition ID from condition name if needed.
 */
export async function resolveAssetCondition(formData: BuildingBasicInfoFormData): Promise<number | null> {
  let finalConditionId = (formData.condition && !isNaN(Number(formData.condition))) ? Number(formData.condition) : null;
  const finalConditionName = (formData.condition && isNaN(Number(formData.condition))) ? formData.condition : null;

  if (!finalConditionId && finalConditionName) {
    try {
      const categoryId = Number(formData.categoryId || 0);
      const condRes = await basicInfoLookupService.getAssetConditions(categoryId > 0 ? categoryId : undefined);
      if (condRes.success && condRes.data) {
        const condMatch = condRes.data.find((c: RawConditionMasterItem) => c.conditionName?.toLowerCase() === finalConditionName?.toLowerCase());
        if (condMatch) finalConditionId = condMatch.id;
      }
    } catch (err) {
      logger.warn("Failed to resolve asset condition from master list", { error: err instanceof Error ? err : undefined });
    }
  }
  return finalConditionId;
}

/**
 * Persists the AssetMaster record — create or update, based on `isUpdate`.
 */
export async function persistSubmitPayload(
  isUpdate: boolean,
  parsedId: number,
  payload: AssetMasterRequest | Partial<AssetMasterRequest> | FormData
) {
  return isUpdate
    ? await assetMasterService.updateAsset(parsedId, payload)
    : await assetMasterService.createAsset(payload);
}

/**
 * Bulk-saves the EAV field values for the given asset, using a single DB
 * transaction via assetFieldValueService.saveBulkFieldValues.
 */
export async function saveFieldValuesForAsset(assetId: number, apiRequest: AssetMasterRequest): Promise<void> {
  if (apiRequest.fieldValues && apiRequest.fieldValues.length > 0) {
    const creatorId = Number(apiRequest.createdBy || 1);
    try {
      const bulkPayload = apiRequest.fieldValues.map(fv => ({
        assetId: Number(assetId),
        fieldDefinitionId: Number(fv.fieldDefinitionId),
        fieldName: fv.fieldName,
        fieldValue: fv.fieldValue,
        isActive: fv.isActive !== undefined ? fv.isActive : true,
        createdBy: fv.createdBy ?? creatorId
      }));

      const bulkRes = await assetFieldValueService.saveBulkFieldValues(Number(assetId), bulkPayload);
      if (!bulkRes || bulkRes.success === false) {
        throw new Error(bulkRes?.error || bulkRes?.message || "Bulk field values save returned failure response");
      }
    } catch (err) {
      logger.warn("Bulk field values save failed, falling back to individual inserts", { error: err instanceof Error ? err : undefined });
      for (const fv of apiRequest.fieldValues) {
        try {
          const singleRes = await assetFieldValueService.saveFieldValue({
            assetId: Number(assetId),
            fieldDefinitionId: Number(fv.fieldDefinitionId || 0),
            fieldName: fv.fieldName,
            fieldValue: fv.fieldValue,
            isActive: fv.isActive !== undefined ? fv.isActive : true,
            createdBy: fv.createdBy ?? creatorId
          });
          if (!singleRes || singleRes.success === false) {
            const errStr = singleRes?.error || singleRes?.message || "Individual field value save failed";
            logger.error("Failed to save individual field value", { fieldName: fv.fieldName, error: new Error(errStr) });
          }
        } catch (singleErr) {
          logger.error("Failed to save individual field value", { fieldName: fv.fieldName, error: singleErr instanceof Error ? singleErr : undefined });
        }
      }
    }
  }
}
