import { apiClient } from '@/services/api.service';
import {
  Floor,
  FloorFormModel,
  FloorRangePayload,
  PagedResponse,
  FlatGenerationGroupOption,
} from "@/types/floor.types";
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

function isFloorShape(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && 'id' in value;
}

/* ============================================================
   NORMALIZER
============================================================ */

function normalizeFloor(data: Record<string, unknown>): Floor {
  // Backend DTO has 'Id' which serializes to 'id' in JSON
  const id = Number(data.id);

  if (!Number.isFinite(id) || id <= 0) {
    throw new ApiError(500, 'Invalid data', 'Invalid id');
  }

  const floorCode = typeof data.floorCode === 'string' ? data.floorCode.trim() : '';
  const description = typeof data.description === 'string' ? data.description.trim() : '';
  const descriptionEnglish =
    typeof data.descriptionEnglish === 'string'
      ? data.descriptionEnglish.trim()
      : typeof data.DescriptionEnglish === 'string'
      ? (data.DescriptionEnglish as string).trim()
      : '';

  if (!floorCode) {
    throw new ApiError(500, 'Invalid data', 'Missing floorCode');
  }

  return {
    id,
    floorCode,
    descriptionEnglish,
    description,
    sequenceNo: Number(data.sequenceNo) || 0,
    fLatGenerationGroupId: Number(data.fLatGenerationGroupId ?? data.FLatGenerationGroupId) || 1,
    fLatGenerationSeq: Number(data.fLatGenerationSeq ?? data.FLatGenerationSeq) || 1,
    isActive: Boolean(data.isActive),
    createdDate: typeof data.createdDate === 'string' ? data.createdDate : '',
    updatedDate: typeof data.updatedDate === 'string' ? data.updatedDate : null,
  };
}

/* ============================================================
   FLOOR APIs
============================================================ */

export async function getFloorPaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<Floor>> {
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

    const response = await apiClient.get<unknown>(`/Floor?${params.toString()}`);

    if (!response.success) {
      console.error('[getFloorPaged] API request failed:', {
        statusCode: response.statusCode,
        error: response.error,
        endpoint: `/Floor?${params.toString()}`
      });
      throw new ApiError(response.statusCode || 500, response.error || '', 'Fetch floor failed');
    }

    if (!isPagedResponse<Floor>(response.data)) {
      throw new ApiError(500, 'Invalid format', 'Invalid floor response');
    }

    
    const items = response.data.items.map((item, index) => {
  if (!isFloorShape(item)) {
    throw new ApiError(
      500,
      'Invalid data',
      `Invalid floor item at index ${index}`
    );
  }
  return normalizeFloor(item);
});

    return { ...response.data, items };
  } catch (err) {
    console.error('Error fetching floors:', err);
    throw err;
  }
}

export async function getFloorById(id: number): Promise<Floor> {
  try {
    if (!id || id <= 0) {
      throw new Error('Valid Floor ID is required');
    }

    const response = await apiClient.get<unknown>(`/Floor/${id}`);

    if (!response.success) {
      throw new ApiError(response.statusCode || 500, response.error || '', 'Fetch floor by ID failed');
    }

    if (!isFloorShape(response.data)) {
      throw new ApiError(500, 'Invalid format', 'Invalid floor response');
    }

    return normalizeFloor(response.data);
  } catch (err) {
    console.error('Error fetching floor by ID:', err);
    throw err;
  }
}

export async function createFloor(data: FloorFormModel, userId: string): Promise<void> {
  try {
    if (!data.floorCode?.trim()) throw new Error('floorCode required');
    if (!data.descriptionEnglish?.trim()) throw new Error('descriptionEnglish required');
    if (!data.description?.trim()) throw new Error('description required');

    const payload = {
      floorCode: data.floorCode.trim(),
      descriptionEnglish: data.descriptionEnglish?.trim() || '',
      description: data.description.trim(),
      sequenceNo: Number(data.sequenceNo) || 0,
      fLatGenerationGroupId: Number(data.fLatGenerationGroupId) || 1,
      fLatGenerationSeq: Number(data.fLatGenerationSeq) || 1,
      isActive: data.isActive,
      createdBy: Number(userId),
      updatedBy: Number(userId),
    };

    const response = await apiClient.post('/Floor', payload);

    if (!response.success) {
      throw new ApiError(
        response.statusCode || 500,
        response.error || '',
        'Create floor failed'
      );
    }
  } catch (err) {
    console.error('Create floor error:', err);
    throw err;
  }
}

export async function updateFloor(data: FloorFormModel, userId: string): Promise<void> {
  try {
    if (!data.id || data.id <= 0) {
      throw new Error('Floor ID required');
    }
    if (!data.floorCode?.trim()) throw new Error('floorCode required');
    if (!data.description?.trim()) throw new Error('description required');

    // Backend DTO expects 'id' (from C# 'Id' property)
    const payload = {
      id: data.id,
      floorCode: data.floorCode.trim(),
      descriptionEnglish: data.descriptionEnglish?.trim() || '',
      description: data.description.trim(),
      sequenceNo: Number(data.sequenceNo) || 0,
      fLatGenerationGroupId: Number(data.fLatGenerationGroupId) || 1,
      fLatGenerationSeq: Number(data.fLatGenerationSeq) || 1,
      isActive: data.isActive,
      updatedBy: Number(userId),
    };

    const response = await apiClient.put(`/Floor/${data.id}`, payload);

    if (!response.success) {
      throw new ApiError(response.statusCode || 500, response.error || '', 'Update floor failed');
    }
  } catch (err) {
    throw err;
  }
}

export async function deleteFloor(id: number, _userId: string): Promise<void> {
  try {
    if (id <= 0) {
      throw new Error('Valid Floor ID required');
    }

    // Note: _userId is available for backend auditing/authentication
    // Use shared apiClient for consistent timeout and error handling
    const response = await apiClient.delete(`/Floor/${id}/purge`);

    // Purge endpoints may return 204 No Content with an empty body.
    // If the shared client marks that response as unsuccessful because it
    // attempts JSON parsing first, still treat HTTP 204 or JSON parse errors as success.
    if (response.success) {
      return;
    }

    // Handle 204 No Content or JSON parsing error on empty response
    if (
      response.statusCode === 204 ||
      response.error?.includes('Unexpected end of JSON input')
    ) {
      return;
    }

    throw new ApiError(
      response.statusCode || 500,
      response.error || 'Delete failed',
      'Delete floor failed'
    );
  } catch (err) {
    throw err;
  }
}

/* ============================================================
   CREATE FLOOR RANGE (BULK CREATE)
============================================================ */
export async function createFloorRange(data: FloorRangePayload, userId: string): Promise<void> {
  try {
    // Input validation
    if (!data.rangeFrom || data.rangeFrom.trim() === '') {
      throw new Error('rangeFrom required');
    }
    if (!data.rangeTo || data.rangeTo.trim() === '') {
      throw new Error('rangeTo required');
    }
    const rangeFromNum = Number(data.rangeFrom);
    const rangeToNum = Number(data.rangeTo);
    if (Number.isNaN(rangeFromNum) || Number.isNaN(rangeToNum)) {
      throw new TypeError('Range values must be valid numbers');
    }

    // Server-side range limits to prevent invalid or abusive payloads
    const MAX_RANGE_VALUE = 999;
    const MAX_RANGE_SIZE = 900;
    if (rangeFromNum < 1) {
      throw new Error('rangeFrom must be greater than or equal to 1');
    }
    if (rangeToNum < 1) {
      throw new Error('rangeTo must be greater than or equal to 1');
    }
    if (rangeFromNum > MAX_RANGE_VALUE) {
      throw new Error(`Range start value cannot exceed ${MAX_RANGE_VALUE}`);
    }
    if (rangeToNum > MAX_RANGE_VALUE) {
      throw new Error(`Range end value cannot exceed ${MAX_RANGE_VALUE}`);
    }
    if (rangeFromNum > rangeToNum) {
      throw new Error('rangeFrom cannot be greater than rangeTo');
    }
    const rangeSize = rangeToNum - rangeFromNum + 1;
    if (rangeSize > MAX_RANGE_SIZE) {
      throw new Error(`Range size cannot exceed ${MAX_RANGE_SIZE} floors`);
    }

    // Note: userId is used for backend auditing/authentication
    const payload: FloorRangePayload = {
      rangeFrom: data.rangeFrom.trim(),
      rangeTo: data.rangeTo.trim(),
      template: {
        isActive: data.template.isActive,
        createdBy: Number(userId),
        updatedBy: Number(userId),
        floorCode: data.template.floorCode.trim(),
        descriptionEnglish: data.template.descriptionEnglish?.trim() ?? '',
        description: data.template.description?.trim() ?? '',
        sequenceNo: Number(data.template.sequenceNo) || 0,
        maxFloorNo: Number(data.template.maxFloorNo) || rangeToNum,
        fLatGenerationGroupId: Number(data.template.fLatGenerationGroupId) || 1,
        fLatGenerationSeq: Number(data.template.fLatGenerationSeq) || 1,
      },
      startSequenceNo: Number(data.startSequenceNo) || rangeFromNum,
    };

    const response = await apiClient.post('/Floor/Range', payload);

    if (!response.success) {
      throw new ApiError(
        response.statusCode || 500,
        response.error || '',
        'Create floor range failed'
      );
    }
  } catch (err) {
    throw err;
  }
}

/* ============================================================
   FLAT GENERATION GROUP & SEQUENCE HELPERS
============================================================ */

export async function getMaxFlatGenerationSeq(flatGenerationGroupId: number): Promise<number> {
  try {
    if (!flatGenerationGroupId || flatGenerationGroupId <= 0) {
      return 0;
    }

    const response = await apiClient.get<number | { data?: number }>(`/Floor/max-seq/${flatGenerationGroupId}`);

    if (!response.success || response.data === undefined || response.data === null) {
      return 0;
    }

    const raw = response.data as unknown;
    if (typeof raw === 'number') {
      return raw;
    }
    if (raw && typeof raw === 'object') {
      const obj = raw as Record<string, unknown>;
      const candidate = obj.items ?? obj.data ?? obj.Items ?? obj.Data ?? obj.result ?? obj.Result;
      const numCandidate = Number(candidate);
      if (Number.isFinite(numCandidate)) {
        return numCandidate;
      }
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch (err) {
    console.error('Error fetching max flat generation sequence:', err);
    return 0;
  }
}

export async function getFlatGenerationGroups(): Promise<FlatGenerationGroupOption[]> {
  const fallback: FlatGenerationGroupOption[] = [
    { id: 1, name: 'UPPER' },
    { id: 2, name: 'GENERAL' },
    { id: 3, name: 'OPENPLOT' },
    { id: 4, name: 'PODIUM' },
    { id: 5, name: 'MEZZANINE' },
    { id: 6, name: 'LOWER' },
    { id: 7, name: 'BASEMENT' },
  ];

  try {
    const response = await apiClient.get<PagedResponse<{ id: number; fLatGenerationGroup?: string; FLatGenerationGroup?: string; isActive?: boolean }>>(
      '/FLatGenerationGroupMaster?PageNumber=1&PageSize=100'
    );
    if (response.success && response.data?.items && Array.isArray(response.data.items) && response.data.items.length > 0) {
      return response.data.items
        .filter((item) => item.isActive !== false)
        .map((item) => ({
          id: item.id,
          name: item.fLatGenerationGroup || item.FLatGenerationGroup || `Group ${item.id}`,
        }));
    }
  } catch (err) {
    console.error('Error fetching flat generation groups, using fallback:', err);
  }

  return fallback;
}
