"use server";

import { submitAssetFormService } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/basic-info.server.service";
import type {
  BuildingBasicInfoFormData,
  BasicInfoFilesPayload,
  SubmitAssetFormResult,
} from "@/types/asset/municipal-Asset/new-add-new-asset";
import type { ExtraBasicInfoFileItem } from "@/types/asset/municipal-Asset/new-add-new-asset/asset-wizard.types";

/**
 * Server action to submit the consolidated Asset Registration Form.
 * Delegates all persistence and validation logic to submitAssetFormService.
 */
export async function submitAssetForm(
  input: BuildingBasicInfoFormData | FormData,
  basicInfoFiles?: BasicInfoFilesPayload,
  extraBasicInfoFiles?: Record<string, ExtraBasicInfoFileItem[]>
): Promise<SubmitAssetFormResult> {
  return await submitAssetFormService(input, basicInfoFiles, extraBasicInfoFiles);
}

