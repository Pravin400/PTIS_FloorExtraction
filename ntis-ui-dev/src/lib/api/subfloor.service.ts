import { apiClient } from '@/services/api.service';
import {
  SubFloor,
  SubFloorFormModel,
  PagedResponse,
} from '@/types/floor.types';
import { ApiError } from '@/lib/utils/api';

/* ============================================================
   TYPE GUARDS
============================================================ */

function isPagedResponse<T>(value: unknown): value is PagedResponse<T> {
  if (typeof value !== 'object' || value === null) return false;

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

function isSubFloorShape(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && 'id' in value;
}

/* ============================================================
   NORMALIZER
============================================================ */

function normalizeSubFloor(data: Record<string, unknown>): SubFloor {
  // Backend DTO has 'Id' which serializes to 'id' in JSON
  const id = Number(data.id);

  if (!Number.isFinite(id) || id <= 0) {
    throw new ApiError(500, 'Invalid data', 'Invalid id');
  }
  const subFloorCode = typeof data.subFloorCode === 'string' ? data.subFloorCode.trim() : '';
  const descriptionEnglish =
    typeof data.descriptionEnglish === 'string'
      ? data.descriptionEnglish.trim()
      : typeof data.descriptionEnglish === 'undefined' || data.descriptionEnglish === null
      ? null
      : String(data.descriptionEnglish).trim();
  const description = typeof data.description === 'string' ? data.description.trim() : '';

  if (!subFloorCode) {
    throw new ApiError(500, 'Invalid data', 'Missing subFloorCode');
  }

  return {
    id,
    subFloorCode,
    descriptionEnglish,
    description,
    sequenceNo: typeof data.sequenceNo === 'number' ? data.sequenceNo : null,
    isActive: Boolean(data.isActive),
    createdDate: typeof data.createdDate === 'string' ? data.createdDate : '',
    updatedDate: typeof data.updatedDate === 'string' ? data.updatedDate : null,
  };
}

/* ============================================================
   SUBFLOOR APIs
============================================================ */

export async function getSubFloorPaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<SubFloor>> {
  try {
    const params = new URLSearchParams({
      PageNumber: pageNumber.toString(),
      PageSize: pageSize.toString(),
    });

    if (searchTerm?.trim()) {
      params.append('SearchTerm', searchTerm.trim().slice(0, 100));
    }

    if (sortBy?.trim()) params.append('SortBy', sortBy.trim());
    if (sortOrder?.trim()) params.append('SortOrder', sortOrder.trim());

    const response = await apiClient.get<unknown>(`/SubFloor?${params.toString()}`);

    if (!response.success) {
      throw new ApiError(response.statusCode || 500, response.error || '', 'Fetch subfloor failed');
    }

    if (!isPagedResponse<SubFloor>(response.data)) {
      throw new ApiError(500, 'Invalid format', 'Invalid subfloor response');
    }

   const items = response.data.items.map((item, index) => {
  if (!isSubFloorShape(item)) {
    throw new ApiError(
      500,
      'Invalid data',
      `Invalid subfloor item at index ${index}`
    );
  }
  return normalizeSubFloor(item);
});

    return { ...response.data, items };
  } catch (err) {
    console.error('Error fetching subfloors:', err);
    throw err;
  }
}

export async function getSubFloorById(id: number): Promise<SubFloor> {
  try {
    if (!id || id <= 0) {
      throw new Error('Valid SubFloor ID is required');
    }

    const response = await apiClient.get<unknown>(`/SubFloor/${id}`);

    if (!response.success) {
      throw new ApiError(response.statusCode || 500, response.error || '', 'Fetch subfloor by ID failed');
    }

    if (!isSubFloorShape(response.data)) {
      throw new ApiError(500, 'Invalid format', 'Invalid subfloor response');
    }

    return normalizeSubFloor(response.data);
  } catch (err) {
    console.error('Error fetching subfloor by ID:', err);
    throw err;
  }
}

export async function createSubFloor(data: SubFloorFormModel, userId: string): Promise<void> {
  try {
    if (!data.subFloorCode?.trim()) {
      throw new Error('subFloorCode required');
    }
    if (!data.description?.trim()) {
      throw new Error('description required');
    }

    const payload = {
      subFloorCode: data.subFloorCode.trim(),
      descriptionEnglish: data.descriptionEnglish?.trim() || '',
      description: data.description.trim(),
      sequenceNo: data.sequenceNo ? Number(data.sequenceNo) : null,
      isActive: data.isActive,
      createdBy: Number(userId),
      updatedBy: Number(userId),
    };

    const response = await apiClient.post('/SubFloor', payload);

    if (!response.success) {
      throw new ApiError(
        response.statusCode || 500,
        response.error || '',
        'Create subfloor failed'
      );
    }
  } catch (err) {
    console.error('Create subfloor error:', err);
    throw err;
  }
}

export async function updateSubFloor(data: SubFloorFormModel, userId: string): Promise<void> {
  try {
    if (!data.id || data.id <= 0) {
      throw new Error('SubFloor ID required');
    }
    if(!data.subFloorCode?.trim()){
      throw new Error('subFloorCode required');
    }
    if(!data.description?.trim()){
      throw new Error('description required');
    }

    // Backend DTO expects 'id' (from C# 'Id' property)
    const payload = {
      id: data.id,
      subFloorCode: data.subFloorCode.trim(),
      descriptionEnglish: data.descriptionEnglish?.trim() || '',
      description: data.description.trim(),
      sequenceNo: data.sequenceNo ? Number(data.sequenceNo) : null,
      isActive: data.isActive,
      updatedBy: Number(userId),
    };

    const response = await apiClient.put(`/SubFloor/${data.id}`, payload);

    if (!response.success) {
      throw new ApiError(response.statusCode || 500, response.error || '', 'Update subfloor failed');
    }
  } catch (err) {
    console.error('Update subfloor error:', err);
    throw err;
  }
}

export async function deleteSubFloor(id: number, _userId: string): Promise<void> {
  try {
    if (id <= 0) {
      throw new Error('Valid SubFloor ID required');
    }

    // Note: _userId is available for backend auditing/authentication
    // Use shared apiClient for consistent timeout and error handling
    const response = await apiClient.delete(`/SubFloor/${id}/purge`);

    // Purge endpoints may return 204 No Content with an empty body.
    // If the shared client marks that response as unsuccessful because it
    // attempts JSON parsing first, still treat HTTP 204 or JSON parse errors as success.
    if (response.success) {
      return;
    }

    // Handle 204 No Content or JSON parsing error on empty response
    if (response.statusCode === 204 || response.error?.includes('Unexpected end of JSON input')) {
      return;
    }

    throw new ApiError(
      response.statusCode || 500,
      response.error || 'Delete failed',
      'Delete subfloor failed'
    );
  } catch (err) {
    console.error('Delete subfloor error:', err);
    throw err;
  }
}
