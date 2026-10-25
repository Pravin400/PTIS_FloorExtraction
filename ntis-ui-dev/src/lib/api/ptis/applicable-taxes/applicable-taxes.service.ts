import { apiClient } from '@/services/api.service';
import type {
  AssessmentYearRangeItem,
  TypeOfUseItem,
  PagedResponse,
  TaxApplicabilityData,
  TaxApplicabilityPropertyData,
  TaxCalculationResponse
} from '@/types/applicable-taxes.types';
import { handleApiResponse } from '@/lib/utils/api';
import { getTranslations } from 'next-intl/server';
import type { ActionResult } from '@/types/common.types';

export async function getTypeOfUse(
  pageNumber: number = 1,
  pageSize: number = 100
): Promise<{ success: boolean; data?: PagedResponse<TypeOfUseItem>; error?: string }> {
  const res = await apiClient.get<PagedResponse<TypeOfUseItem>>(`/TypeOfUse?PageNumber=${pageNumber}&PageSize=${pageSize}`);
  if (res.success && res.data) {
    return { success: true, data: res.data };
  }
  return { success: false, error: res.error || 'Failed to fetch Type of Use' };
}

export async function getAssessmentYearRange(
  pageNumber: number = 1,
  pageSize: number = 100
): Promise<{ success: boolean; data?: PagedResponse<AssessmentYearRangeItem>; error?: string }> {
  const res = await apiClient.get<PagedResponse<AssessmentYearRangeItem>>(`/AssessmentYearRange?PageNumber=${pageNumber}&PageSize=${pageSize}`);
  if (res.success && res.data) {
    return { success: true, data: res.data };
  }
  return { success: false, error: res.error || 'Failed to fetch Assessment Year Range' };
}

export async function getAssessmentYearRangeCV(
  pageNumber: number = 1,
  pageSize: number = 100
): Promise<{ success: boolean; data?: PagedResponse<AssessmentYearRangeItem>; error?: string }> {
  const res = await apiClient.get<PagedResponse<AssessmentYearRangeItem>>(`/AssessmentYearRangeCV?PageNumber=${pageNumber}&PageSize=${pageSize}`);
  if (res.success && res.data) {
    return { success: true, data: res.data };
  }
  return { success: false, error: res.error || 'Failed to fetch Assessment Year Range CV' };
}

export async function getTaxApplicability(params: {
  propertyId: number;
  financialYearId: number;
  typeOfUseId: number;
  rvOrCv: 'RV' | 'CV';
  pageNumber?: number;
  pageSize?: number;
}): Promise<{ success: boolean; data?: PagedResponse<TaxApplicabilityData>; error?: string }> {
  const { propertyId, financialYearId, typeOfUseId, rvOrCv, pageNumber = 1, pageSize = 10 } = params;
  const res = await apiClient.get<PagedResponse<TaxApplicabilityData>>(
    `/TaxApplicability?PropertyId=${propertyId}&FinancialYearId=${financialYearId}&TypeOfUseId=${typeOfUseId}&RvOrCv=${rvOrCv}&PageNumber=${pageNumber}&PageSize=${pageSize}`
  );

  if (res.success && res.data) {
    return { success: true, data: res.data };
  }
  return { success: false, error: res.error || 'Failed to fetch Tax Applicability' };
}

export async function updateTaxApplicability(payload: {
  propertyId: number;
  taxes: Array<{
    taxId: number;
    isApplicable: boolean;
  }>;
  userId: number;
}): Promise<ActionResult<null>> {
  const response = await apiClient.post<ActionResult<null>>('/TaxApplicability', payload);
  const t = await getTranslations("applicableTaxes");
  return handleApiResponse(response, t("errors.updateTaxApplicability"));
}

export async function getTaxApplicabilityByPropertyId(
  propertyId: number
): Promise<{ success: boolean; data?: TaxApplicabilityPropertyData[]; error?: string }> {
  const res = await apiClient.get<TaxApplicabilityPropertyData[]>(`/TaxApplicability/${propertyId}`);
  
  if (res.success && res.data) {
    return { success: true, data: res.data };
  }
  return { success: false, error: res.error || 'Failed to fetch Tax Applicability by Property Id' };
}

export async function getTaxCalculation(
  propertyId: number,
  assessmentYearRangeId: number
): Promise<TaxCalculationResponse | null> {
  const url = `/TaxApplicability/calculation/${propertyId}?assessmentYearRangeId=${assessmentYearRangeId}`;
  const response = await apiClient.get<TaxCalculationResponse>(url);
  const t = await getTranslations("applicableTaxes");
  
  return handleApiResponse(response, t("errors.fetchTaxCalculation") || "Failed to fetch tax calculation data");
}