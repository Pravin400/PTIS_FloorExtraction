'use server';

import {
  getTypeOfUse,
  getAssessmentYearRange,
  getAssessmentYearRangeCV,
  getTaxApplicability,
  updateTaxApplicability,
  getTaxApplicabilityByPropertyId,
  getTaxCalculation,
} from '@/lib/api/ptis/applicable-taxes/applicable-taxes.service';
import type {
  AssessmentYearRangeItem,
  TypeOfUseItem,
  PagedResponse,
  TaxApplicabilityData,
  TaxApplicabilityPropertyData,
  TaxCalculationResponse
} from '@/types/applicable-taxes.types';
import type { ActionResult } from '@/types/common.types';
import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { ApiError } from '@/lib/utils/api';

async function getActionErrorMessage(error: unknown): Promise<string> {
  const t = await getTranslations("applicableTaxes");
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    const msg = error.message.toLowerCase();
    if (msg.includes('fetch failed') || msg.includes('failed to fetch') || msg.includes('network error') || msg.includes('econnrefused')) {
      return t('errors.failedToConnect.description') || "Failed to connect to the server";
    }
    return error.message;
  }
  return t('errors.unexpectedError') || "An unexpected error occurred";
}

export async function getAssessmentYearsAction(
  valuationTab?: string,
  pageNumber: number = 1,
  pageSize: number = -1
): Promise<ActionResult<PagedResponse<AssessmentYearRangeItem>>> {
  const t = await getTranslations("applicableTaxes");
  try {
    const isCV = valuationTab === 'capital';
    const response = isCV
      ? await getAssessmentYearRangeCV(pageNumber, pageSize)
      : await getAssessmentYearRange(pageNumber, pageSize);

    if (!response.success) {
      return {
        success: false,
        error: response.error
          ? `${t("errors.fetchAssessmentYears")}: ${response.error}`
          : t("errors.fetchAssessmentYears")
      };
    }

    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: await getActionErrorMessage(error) };
  }
}

export async function getTypeOfUseAction(
  pageNumber: number = 1,
  pageSize: number = -1
): Promise<ActionResult<PagedResponse<TypeOfUseItem>>> {
  const t = await getTranslations("applicableTaxes");
  try {
    const response = await getTypeOfUse(pageNumber, pageSize);
    if (!response.success) {
      return {
        success: false,
        error: response.error
          ? `${t("errors.fetchUseGroups")}: ${response.error}`
          : t("errors.fetchUseGroups")
      };
    }

    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: await getActionErrorMessage(error) };
  }
}

export async function getTaxApplicabilityAction(params: {
  propertyId: number;
  financialYearId: number;
  typeOfUseId: number;
  rvOrCv: 'RV' | 'CV';
  pageNumber?: number;
  pageSize?: number;
}): Promise<ActionResult<PagedResponse<TaxApplicabilityData>>> {
  const t = await getTranslations("applicableTaxes");
  try {

    const response = await getTaxApplicability(params);

    if (!response.success) {
      return {
        success: false,
        error: response.error
          ? `${t("errors.fetchTaxApplicability")}: ${response.error}`
          : t("errors.fetchTaxApplicability")
      };
    }

    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: await getActionErrorMessage(error) };
  }
}

export const updateTaxApplicabilityAction = async (
  locale: string,
  payload: {
    propertyId: number;
    taxes: Array<{
      taxId: number;
      isApplicable: boolean;
    }>;
    userId: number;
  }
): Promise<ActionResult<null>> => {
  try {
    const result = await updateTaxApplicability(payload);

    revalidatePath(`/${locale}/property-tax/ptis/applicable-taxes`, "page");

    return result;

  } catch (error) {
    return { success: false, error: await getActionErrorMessage(error) };
  }
};

export async function getTaxApplicabilityByPropertyIdAction(
  propertyId: number
): Promise<ActionResult<TaxApplicabilityPropertyData[]>> {
  const t = await getTranslations("applicableTaxes");
  try {      
    const response = await getTaxApplicabilityByPropertyId(propertyId);
    if (!response.success) {
      return {
        success: false,
        error: response.error
          ? `${t("errors.fetchTaxApplicability")}: ${response.error}`
          : t("errors.fetchTaxApplicability")
      };
    }
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: await getActionErrorMessage(error) };
  }
}

export async function getTaxCalculationAction(
  propertyId: number,
  assessmentYearRangeId: number
): Promise<ActionResult<TaxCalculationResponse | null>> {
  try {
    const data = await getTaxCalculation(propertyId, assessmentYearRangeId);
    return { success: true, data };
  } catch (error) {
    if (error instanceof ApiError) {
        return { success: false, error: error.message, statusCode: error.statusCode };
    }
    const t = await getTranslations("applicableTaxes");
    return { success: false, error: t("errors.fetchTaxCalculation") || "Failed to fetch tax calculation data", statusCode: 500 };
  }
}
