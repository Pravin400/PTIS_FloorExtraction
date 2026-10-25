"use server";

import { assetMasterService } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/asset-master.service";
import { revalidatePath } from "next/cache";
import type { ActivateAssetResult } from "@/types/asset/municipal-Asset/new-add-new-asset";

/**
 * Server action to authoritatively validate and activate an asset and its child records.
 * Authoritatively verifies mandatory fields, category rules, and draft status before calling
 * PUT /AssetMaster/{id}/activate. Keeps asset in draft if validation fails.
 */
export async function activateAssetAction(assetId: number): Promise<ActivateAssetResult> {
  if (!Number.isInteger(assetId) || assetId <= 0) {
    return { success: false, error: "Invalid Asset ID." };
  }

  try {
    // 1. Authoritative lookup of existing asset record
    const assetRes = await assetMasterService.getAssetById(assetId);
    if (!assetRes.success || !assetRes.data) {
      return {
        success: false,
        error: assetRes.error || "Asset record not found or could not be retrieved from the server."
      };
    }

    const asset = assetRes.data as unknown as Record<string, unknown>;

    // 2. Idempotency check: if asset is already active, return success safely
    if (asset.isActive) {
      return { success: true, message: "Asset is already active." };
    }

    // 3. Authoritative validation of mandatory fields & business prerequisites
    const validationErrors: string[] = [];

    const assetName = asset.assetName || asset.name;
    if (!assetName || String(assetName).trim() === "") {
      validationErrors.push("Asset Name is required.");
    }

    const categoryId = Number(asset.assetCategoryId || asset.categoryId || 0);
    if (!categoryId || categoryId <= 0) {
      validationErrors.push("Asset Category is required.");
    }

    const typeId = Number(asset.assetTypeId || asset.typeId || 0);
    if (!typeId || typeId <= 0) {
      validationErrors.push("Asset Type is required.");
    }

    // Category-specific prerequisite check: Non-movable assets require location or address
    const isMovable = categoryId === 3 || /movable|vehicle|equipment|furniture/i.test(String(asset.categoryName || asset.category || ''));
    if (!isMovable) {
      const hasLocationInfo = Boolean(asset.wardId || asset.zoneId || asset.moujaId || asset.address || asset.locality);
      if (!hasLocationInfo) {
        validationErrors.push("Location information (Zone/Ward or Address) is required for non-movable assets.");
      }
    }

    if (validationErrors.length > 0) {
      return {
        success: false,
        error: "Authoritative validation failed. Asset remains in draft state.",
        validationErrors,
      };
    }

    // 4. Perform authoritative activation
    const response = await assetMasterService.activateAsset(assetId);
    if (response.success) {
      revalidatePath("/[locale]/assets/municipal-Asset", "page");
      return { success: true };
    }

    return {
      success: false,
      error: response.error || "Server rejected asset activation."
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Internal Server Error during authoritative asset activation."
    };
  }
}
