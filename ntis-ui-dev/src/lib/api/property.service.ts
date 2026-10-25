'use server';

import { apiClient } from '@/services/api.service';
import { ApiResponse } from '@/types/common.types';

export interface DeletePropertyResponse {
  message?: string;
}

/**
 * Delete a single property by ID.
 * API: DELETE /api/Property/{PropertyId}
 */
export async function deleteProperty(propertyId: string): Promise<ApiResponse<DeletePropertyResponse>> {
  return apiClient.delete<DeletePropertyResponse>(`/Property/${encodeURIComponent(propertyId)}`);
}

/**
 * Delete a single property or amenity by numeric ID.
 * API: DELETE /api/Property/{PropertyId}
 */
export async function deletePropertyAmenity(propertyId: number): Promise<ApiResponse<DeletePropertyResponse>> {
  return apiClient.delete<DeletePropertyResponse>(`/Property/${propertyId}`);
}

/**
 * Bulk delete multiple property or amenity records by numeric IDs.
 * Uses the bulk endpoint for efficient deletion.
 * API: DELETE /api/Property/Bulk (body: number[])
 */
export async function deleteMultiplePropertiesAmenities(
  propertyIds: number[]
): Promise<ApiResponse<DeletePropertyResponse>> {
  try {
    if (!propertyIds || propertyIds.length === 0) {
      return {
        success: false,
        error: 'No property IDs provided',
      };
    }

    // Use the bulk delete function
    const result = await deleteBulkProperties(propertyIds);
    
    // Check BOTH HTTP success AND data.success from backend
    if (result.success && result.data) {
      const responseData = result.data as {
        success?: boolean;
        message?: string;
        errors?: string[];
        items?: { successCount?: number; errors?: string[] };
      };
      
      // Backend returns success: false inside data when deletion fails
      if (responseData.success === false) {
        // Extract error message from response
        const errorMessage = 
          (responseData.errors && responseData.errors.length > 0 && responseData.errors[0]) ||
          (responseData.items?.errors && responseData.items.errors.length > 0 && responseData.items.errors[0]) ||
          responseData.message ||
          'Failed to delete records';
        
        return {
          success: false,
          statusCode: result.statusCode,
          error: errorMessage,
        };
      }
      
      // Actual success
      return {
        success: true,
        statusCode: 200,
        data: { message: responseData.message || `Successfully deleted ${propertyIds.length} items` },
      };
    }

    return {
      success: false,
      statusCode: result.statusCode,
      error: result.error || `Failed to delete ${propertyIds.length} items`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete items',
    };
  }
}

export async function deleteBulkProperties(
  propertyIds: number[]
): Promise<ApiResponse<DeletePropertyResponse>> {
  return apiClient.delete<DeletePropertyResponse>(
    '/Property/Bulk',
    {
      body: JSON.stringify(propertyIds),
    }
  );
}

export interface PropertyDrawPlanStatusDto {
  propertyId: number;
  categoryId?: number | null;
  categoryName?: string | null;
  propertyTypeId?: number | null;
  type?: string | null;
  hasType?: boolean;
  currentType?: string | null;
  isIndividualOrAmenity?: boolean;
  requiresTypeAssignment?: boolean;
}

/**
 * Get draw plan status (categoryId, propertyTypeId, type) to decide whether to launch app or show modal
 */
export async function getPropertyDrawPlanStatus(
  propertyId: number
): Promise<ApiResponse<PropertyDrawPlanStatusDto>> {
  return apiClient.get<PropertyDrawPlanStatusDto>(`/Property/${propertyId}/draw-plan-status`);
}
