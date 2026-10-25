import { apiClient } from "@/services/api.service";
import { getTranslations } from "next-intl/server";
import { ApiError } from "@/lib/utils/api";
import { TaxZoningFormModel } from "@/types/taxzoning.types";
import { mapTaxZoningPayload, validateTaxZoning } from "./taxzoning.utils";

/**
 * Creates a new Tax Zoning record.
 */
export async function createTaxZoning(
  data: TaxZoningFormModel
): Promise<void> {
  await validateTaxZoning(data);

  const payload = mapTaxZoningPayload(data);
  const response = await apiClient.post<void>(`/TaxZoning`, payload);

  if (!response.success) {
    const t = await getTranslations("taxZoning");
    throw new ApiError(
      response.statusCode || 500,
      response.error || t("messages.createFailed"),
      "createTaxZoning"
    );
  }
}

/**
 * Updates an existing Tax Zoning record.
 */
export async function updateTaxZoning(
  data: TaxZoningFormModel
): Promise<void> {
  await validateTaxZoning(data);

  const payload = mapTaxZoningPayload(data);
  const response = await apiClient.put<void>(`/TaxZoning`, payload);

  if (!response.success) {
    const t = await getTranslations("taxZoning");
    throw new ApiError(
      response.statusCode || 500,
      response.error || t("messages.updateFailed"),
      "updateTaxZoning"
    );
  }
}
