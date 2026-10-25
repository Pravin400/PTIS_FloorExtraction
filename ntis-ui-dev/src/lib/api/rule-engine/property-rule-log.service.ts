import { apiClient } from '@/services/api.service';
import { PropertyRuleLogResponse } from '@/types/rule-engine';

export async function getPropertyRuleLogs(
  propertyId: number,
  propertyDetailsId?: number,
  financeYear?: number,
  pageNumber: number = 1,
  pageSize: number = 100
): Promise<PropertyRuleLogResponse> {
  const params = new URLSearchParams();
  params.set('PropertyId', propertyId.toString());
  params.set('PageNumber', pageNumber.toString());
  params.set('PageSize', pageSize.toString());

  if (propertyDetailsId !== undefined) {
    params.set('PropertyDetailsId', propertyDetailsId.toString());
  }
  if (financeYear !== undefined) {
    params.set('FinanceYear', financeYear.toString());
  }

  const response = await apiClient.get<PropertyRuleLogResponse>(`/PropertyRuleApplicationLog?${params.toString()}`);
  if (!response.success || !response.data) {
    return {
      items: [],
      totalCount: 0,
      pageNumber,
      pageSize,
      totalPages: 0,
      hasPrevious: false,
      hasNext: false,
    };
  }

  return response.data;
}
