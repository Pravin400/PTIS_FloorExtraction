import { SocialAttribute } from '@/types/social-attribute.types';
import { PagedResponse } from '@/types/common.types';
import { ApiError } from '@/lib/utils/api';
import { parseBoolean } from '@/lib/utils/type-guards';

/**
 * Type guard for PagedResponse<SocialAttribute>
 */
export function isPagedResponse(value: unknown): value is PagedResponse<SocialAttribute> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    Array.isArray(obj.items) &&
    typeof obj.totalCount === 'number' &&
    typeof obj.pageNumber === 'number' &&
    typeof obj.pageSize === 'number' &&
    typeof obj.totalPages === 'number' &&
    typeof obj.hasPrevious === 'boolean' &&
    typeof obj.hasNext === 'boolean'
  );
}

/**
 * Type guard for SocialAttribute - validates structure before normalization
 */
export function isSocialAttributeShape(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;

  // Must have a valid ID field (> 0)
  if (!('id' in obj)) {
    return false;
  }
  const { id } = obj;
  return typeof id === 'number' && Number.isFinite(id) && id > 0;
}

/**
 * Normalizes and validates a social attribute object
 * @throws ApiError if required fields are missing or invalid
 */
export function normalizeSocialAttribute(data: Record<string, unknown>): SocialAttribute {
  // Validate required ID field
  const id = Number(data.id);
  if (!Number.isFinite(id) || id <= 0) {
    throw new ApiError(500, 'Invalid data received from server', `Invalid id: ${data.id}`);
  }

  // Validate required string fields
  const socialAttributeCode = String(data.socialAttributeCode ?? '').trim();
  if (!socialAttributeCode) {
    throw new ApiError(
      500,
      'Invalid data received from server',
      'Missing required field: socialAttributeCode'
    );
  }

  const socialAttributeName = String(data.socialAttributeName ?? '').trim();
  if (!socialAttributeName) {
    throw new ApiError(
      500,
      'Invalid data received from server',
      'Missing required field: socialAttributeName'
    );
  }

  const dataType = String(data.dataType ?? '')
    .trim()
    .toUpperCase();
  if (!dataType) {
    throw new ApiError(
      500,
      'Invalid data received from server',
      'Missing required field: dataType'
    );
  }

  // Validate createdDate - it's required from the backend
  const createdDateStr = String(data.createdDate ?? '').trim();
  if (!createdDateStr) {
    throw new ApiError(
      500,
      'Invalid data received from server',
      'Missing required field: createdDate'
    );
  }

  return {
    id,
    socialAttributeCode,
    socialAttributeName,
    dataType,
    unit: data.unit != null ? String(data.unit).trim() : null,
    displayOrder: data.displayOrder != null ? Number(data.displayOrder) : null,
    parentAttributeId: data.parentAttributeId != null ? Number(data.parentAttributeId) : null,
    isRequiredWhenParentTrue: parseBoolean(data.isRequiredWhenParentTrue),
    isDiscountApplicable: parseBoolean(data.isDiscountApplicable),
    isPhotoRequired: parseBoolean(data.isPhotoRequired),
    isDocumentRequired: parseBoolean(data.isDocumentRequired),
    isActive: parseBoolean(data.isActive),
    isCommonAreaAttribute: parseBoolean(data.isCommonAreaAttribute),
    createdDate: createdDateStr,
    updatedDate: data.updatedDate != null ? String(data.updatedDate) : null,
  };
}
