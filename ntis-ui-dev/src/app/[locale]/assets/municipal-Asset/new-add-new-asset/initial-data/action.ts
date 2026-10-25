"use server";

import { getInitialWizardDataQuery } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/basic-info.server.service";
import type { InitialWizardData } from "@/types/asset/municipal-Asset/new-add-new-asset";

/**
 * Server action to fetch initial global wizard data (asset details, categories, types).
 * Delegates to getInitialWizardDataQuery in basic-info.server.service.
 */
export async function getInitialWizardDataAction(
  assetId: number,
  categoryId: number,
  typeId: number,
  categoryStr: string,
  assetTypeStr: string
): Promise<{ success: boolean; data?: InitialWizardData; error?: string }> {
  return await getInitialWizardDataQuery(assetId, categoryId, typeId, categoryStr, assetTypeStr);
}

