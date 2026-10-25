import { apiClient } from '@/services/api.service';
import { SocialAttribute, SocialAttributeFormModel } from '@/types/social-attribute.types';
import { PagedResponse } from '@/types/common.types';
import { ApiError } from '@/lib/utils/api';
import { logger } from '@/lib/utils/logger';
import { isSocialAttributeShape, normalizeSocialAttribute } from './social-attribute-types-guard';
import {
  validateId,
  validateAndPrepareSearchTerm,
  validateCreateFormData,
  validateUpdateFormData,
  getDeleteErrorStatusCode,
  createApiError,
} from './social-attribute-validation';

const socialMasterCache = new Map<string, { data: SocialAttribute[]; expiresAt: number }>();
const SOCIAL_MASTER_TTL_MS = 10 * 60 * 1000; // 10 minutes

/** Fetches all social attributes from the API */
export async function getSocialAttributes(isActive?: boolean): Promise<SocialAttribute[]> {
  const cacheKey = isActive !== undefined ? `social_${isActive}` : 'social_all';
  const cached = socialMasterCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  try {
    let url = '/SocialAttribute?PageNumber=1&PageSize=-1';
    if (isActive !== undefined) {
      url += `&IsDiscountApplicable=${isActive}`;
    }
    const response = await apiClient.get<PagedResponse<SocialAttribute>>(url);
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || 'Failed to fetch social attributes',
        'Get social attributes failed'
      );
    }
    if (!response.data) {
      throw new ApiError(500, 'No data received from server', 'Invalid response format');
    }
    const items = response.data.items ?? [];
    const result = items.filter(isSocialAttributeShape).map(normalizeSocialAttribute);
    socialMasterCache.set(cacheKey, { data: result, expiresAt: Date.now() + SOCIAL_MASTER_TTL_MS });
    return result;
  } catch (error) {
    logger.error('Error fetching social attributes', { error: error as Error });
    throw error;
  }
}

/** Fetches paginated social attributes from the API */
export async function getSocialAttributesPaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<SocialAttribute>> {
  try {
    const params = new URLSearchParams();
    params.append('PageNumber', pageNumber.toString());
    params.append('PageSize', pageSize.toString());

    const safeSearchTerm = validateAndPrepareSearchTerm(searchTerm);
    if (safeSearchTerm) params.append('SearchTerm', safeSearchTerm);
    if (typeof sortBy === 'string' && sortBy.trim()) params.append('SortBy', sortBy.trim());
    if (typeof sortOrder === 'string' && sortOrder.trim())
      params.append('SortOrder', sortOrder.trim());

    const response = await apiClient.get<PagedResponse<SocialAttribute>>(
      `/SocialAttribute?${params.toString()}`
    );
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || 'Failed to fetch paged social attributes',
        'Get paged social attributes failed'
      );
    }
    if (!response.data) {
      throw new ApiError(500, 'No data received from server', 'Invalid response format');
    }

    const validItems = response.data.items.filter(isSocialAttributeShape);
    const normalizedItems = validItems.map(normalizeSocialAttribute);
    return { ...response.data, items: normalizedItems };
  } catch (error) {
    logger.error('Error fetching paged social attributes', { error: error as Error });
    throw error;
  }
}

/** Fetches a single social attribute by ID */
export async function getSocialAttributeById(
  socialAttributeId: number
): Promise<SocialAttribute | null> {
  try {
    if (!validateId(socialAttributeId)) {
      throw new ApiError(
        400,
        'Valid Social Attribute ID is required',
        'Invalid social attribute ID'
      );
    }
    const response = await apiClient.get<SocialAttribute>(
      `/SocialAttribute/${encodeURIComponent(String(socialAttributeId))}`
    );
    if (!response.success) {
      throw new ApiError(
        response.statusCode ?? 500,
        response.error || 'Failed to fetch social attribute',
        `Get social attribute ${socialAttributeId} failed`
      );
    }
    if (!response.data) return null;

    if (isSocialAttributeShape(response.data)) {
      return normalizeSocialAttribute(response.data as Record<string, unknown>);
    }

    throw new ApiError(
      500,
      'Unexpected data format received from server',
      'Data validation failed'
    );
  } catch (error) {
    logger.error(`Error fetching social attribute ${socialAttributeId}`, { error: error as Error });
    throw error;
  }
}

const mapDataTypeToBackend = (dataType: string): string => {
  return dataType.trim().toUpperCase();
};

/** Creates a new social attribute */
export async function createSocialAttribute(data: SocialAttributeFormModel): Promise<void> {
  try {
    validateCreateFormData(data);
    const payload = {
      socialAttributeCode: data.socialAttributeCode.trim().toUpperCase(),
      socialAttributeName: data.socialAttributeName.trim(),
      dataType: mapDataTypeToBackend(data.dataType),
      unit: data.unit ? data.unit.trim() : null,
      displayOrder: data.displayOrder != null ? Number(data.displayOrder) : null,
      parentAttributeId: data.parentAttributeId != null ? Number(data.parentAttributeId) : null,
      isRequiredWhenParentTrue: Boolean(data.isRequiredWhenParentTrue),
      isDiscountApplicable: Boolean(data.isDiscountApplicable),
      isPhotoRequired: Boolean(data.isPhotoRequired),
      isDocumentRequired: Boolean(data.isDocumentRequired),
      isActive: data.isActive,
      createdBy: data.createdBy ?? 1,
    };
    logger.info('[createSocialAttribute] API Request Payload', { payload });
    const response = await apiClient.post<unknown>('/SocialAttribute', payload);
    if (!response.success) {
      throw createApiError(response.statusCode, response.error, 'Create social attribute failed');
    }
  } catch (error) {
    logger.error('Error creating social attribute', { error: error as Error });
    throw error;
  }
}

/** Updates an existing social attribute */
export async function updateSocialAttribute(data: SocialAttributeFormModel): Promise<void> {
  try {
    validateUpdateFormData(data);
    const payload = {
      id: data.id,
      socialAttributeCode: data.socialAttributeCode.trim().toUpperCase(),
      socialAttributeName: data.socialAttributeName.trim(),
      dataType: mapDataTypeToBackend(data.dataType),
      unit: data.unit ? data.unit.trim() : null,
      displayOrder: data.displayOrder != null ? Number(data.displayOrder) : null,
      parentAttributeId: data.parentAttributeId != null ? Number(data.parentAttributeId) : null,
      isRequiredWhenParentTrue: Boolean(data.isRequiredWhenParentTrue),
      isDiscountApplicable: Boolean(data.isDiscountApplicable),
      isPhotoRequired: Boolean(data.isPhotoRequired),
      isDocumentRequired: Boolean(data.isDocumentRequired),
      isActive: data.isActive,
      updatedBy: data.updatedBy ?? 1,
    };
    logger.info('[updateSocialAttribute] API Request Payload', { payload });
    const response = await apiClient.put<unknown>(
      `/SocialAttribute/${encodeURIComponent(String(data.id))}`,
      payload
    );
    if (!response.success) {
      throw createApiError(response.statusCode, response.error, 'Update social attribute failed');
    }
  } catch (error) {
    logger.error('Error updating social attribute', { error: error as Error });
    throw error;
  }
}

interface DeleteResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

/** Deletes a social attribute by ID (permanently purges it) */
export async function deleteSocialAttribute(id: number): Promise<void> {
  try {
    if (!validateId(id)) {
      throw new ApiError(400, 'Valid Social Attribute ID is required', 'Validation failed');
    }
    const response = await apiClient.delete<DeleteResponse>(
      `/SocialAttribute/${encodeURIComponent(String(id))}/purge`
    );

    const responseData = response.data;
    const isWrappedError = response.success && responseData?.success === false;

    if (!response.success || isWrappedError) {
      let statusCode = response.statusCode;
      const errorMsg = responseData?.message || responseData?.error || response.error || '';
      const lowerMsg = String(errorMsg).toLowerCase();

      const isConflict =
        lowerMsg.includes('foreign key') ||
        lowerMsg.includes('reference') ||
        lowerMsg.includes('constraint') ||
        lowerMsg.includes('violate') ||
        lowerMsg.includes('in use') ||
        lowerMsg.includes('linked') ||
        lowerMsg.includes('associated') ||
        lowerMsg.includes('conflict') ||
        lowerMsg.includes('cannot delete') ||
        lowerMsg.includes('fk_');

      if (isConflict) {
        statusCode = 409;
      } else if (!statusCode) {
        statusCode = getDeleteErrorStatusCode(String(errorMsg));
      }

      throw new ApiError(
        statusCode || 500,
        String(errorMsg) || 'Failed to delete social attribute',
        `Delete social attribute ${id} failed`
      );
    }
  } catch (error) {
    logger.error(`Error deleting social attribute ${id}`, { error: error as Error });
    throw error;
  }
}

/** Searches social attributes by social attribute code or name (client-side) */
export async function searchSocialAttributes(query: string): Promise<SocialAttribute[]> {
  try {
    if (!query?.trim()) return [];
    const list = await getSocialAttributes();
    const searchQuery = query.toLowerCase();
    return list.filter(
      (item) =>
        item.socialAttributeCode?.toLowerCase().includes(searchQuery) ||
        item.socialAttributeName?.toLowerCase().includes(searchQuery)
    );
  } catch (error) {
    logger.error('Error searching social attributes', { error: error as Error });
    throw error;
  }
}
