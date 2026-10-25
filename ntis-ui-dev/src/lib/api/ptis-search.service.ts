import { apiClient } from '@/services/api.service';
import type { PagedResult, PropertySearchResult, WardResponse } from '@/types/ptis.types';

export async function searchProperties(filters: {
  wardNo?: string;
  wardId?: number;
  propertyNo?: string;
  upicId?: string;
  partitionNo?: string;
}): Promise<{ success: boolean; data?: PropertySearchResult[]; error?: string }> {
  try {
    const endpoint = '/Property';
    const params = new URLSearchParams();

    if (filters.wardId) params.append('WardId', filters.wardId.toString());
    if (filters.wardNo) params.append('WardNo', filters.wardNo);
    if (filters.propertyNo) params.append('propertyNo', filters.propertyNo);
    if (filters.partitionNo) params.append('partitionNo', filters.partitionNo);
    if (filters.upicId) params.append('upicId', filters.upicId);

    params.append('PageSize', '100');
    params.append('PageNumber', '1');

    const response = await apiClient.get<PagedResult<PropertySearchResult>>(
      `${endpoint}?${params.toString()}`,
      {
        cache: 'no-store',
      }
    );
    
    if (response.success && response.data?.items?.length) {
      return { success: true, data: response.data.items };
    }

    // Return the specific API error if available, otherwise fall back to 'No properties found'
    return { success: false, error: response.error || 'No properties found' };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return { success: false, error: err.message || 'Failed to search properties' };
  }
}

export async function getWardByNo(
  wardNo: string
): Promise<{ success: boolean; data?: WardResponse; error?: string }> {
  try {
    const params = new URLSearchParams();
    params.append('WardNo', wardNo);

    const response = await apiClient.get<PagedResult<WardResponse>>(`/Ward?${params.toString()}`, {
      cache: 'no-store',
    });

    if (response.success && response.data?.items?.length) {
      return { success: true, data: response.data.items[0] };
    }

    return { success: false, error: 'Ward not found' };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return { success: false, error: err.message || 'Failed to fetch ward details' };
  }
}
