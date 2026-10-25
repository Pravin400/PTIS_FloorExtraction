import 'server-only';
import { apiClient } from '@/services/api.service';
import { ApiResponse } from '@/types/common.types';

export interface MaxTypeResponseDto {
  maxType: number;
}

export interface SetPropertyTypeResponseDto {
  propertyId: number;
  type: string;
}

export async function getPlanTypesForProperty(
  propertyId: number
): Promise<ApiResponse<string[]>> {
  return apiClient.get<string[]>(`/apartmentqc/${propertyId}/plan-type`);
}

export async function getNewPlanTypeForProperty(
  propertyId: number
): Promise<ApiResponse<number>> {
  return apiClient.get<number>(`/apartmentqc/${propertyId}/new-plan-type`);
}

export async function savePlanTypeForProperty(
  propertyId: number,
  type: string | number
): Promise<ApiResponse<object>> {
  return apiClient.patch<object>(`/apartmentqc/${propertyId}/save-plan-type`, {
    type: String(type),
  });
}

export async function getMaxTypeForSociety(
  societyDetailId: number
): Promise<ApiResponse<MaxTypeResponseDto>> {
  return apiClient.get<MaxTypeResponseDto>(`/society/${societyDetailId}/max-type`);
}

export async function getExistingTypesForSociety(
  societyDetailId: number,
  wingDetailId?: number | null
): Promise<ApiResponse<string[]>> {
  const query = wingDetailId && wingDetailId > 0 ? `?wingDetailId=${wingDetailId}` : '';
  return apiClient.get<string[]>(`/society/${societyDetailId}/types${query}`);
}

export async function setPropertyType(
  propertyId: number,
  type: string | number
): Promise<ApiResponse<SetPropertyTypeResponseDto>> {
  return apiClient.put<SetPropertyTypeResponseDto>(`/property/${propertyId}/set-type`, {
    type: String(type),
  });
}

