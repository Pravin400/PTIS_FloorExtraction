import { apiClient } from '@/services/api.service';
import type {
  ZoneDivisionMasterItem,
  ZoneDivisionMasterPayload,
} from '@/types/payroll/MasterModule';
import type { PagedResponse } from '@/types/common.types';
import { ApiError } from '@/lib/utils/api';
import { createLogger } from '@/lib/utils/server-logger';
import { isRecordMarkedForDeletion, parseIsActive } from '@/lib/utils/payroll.utils';

const log = createLogger('ZoneDivisionMasterService');
const ENDPOINT = '/payroll/zone-division-master';

/**
 * Type guard for Zone Division Master raw backend shape
 */
export function isZoneDivisionMasterShape(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('zoneDivisionCode' in value ||
      'ZoneDivisionCode' in value ||
      'zoneDivisionName' in value ||
      'ZoneDivisionName' in value)
  );
}

/**
 * Normalizes backend DTO to frontend ZoneDivisionMasterItem
 */
export function normalizeZoneDivisionMaster(raw: unknown): ZoneDivisionMasterItem {
  const item = (raw || {}) as Record<string, unknown>;
  const rawId = item.id ?? item.zoneDivisionId ?? item.Id ?? item.ZoneDivisionId ?? item.ZoneDivisionID;
  const numId = typeof item.id === 'number' ? item.id : typeof item.Id === 'number' ? item.Id : !isNaN(Number(rawId)) ? Number(rawId) : undefined;
  const isDeleted = isRecordMarkedForDeletion(item);
  const active = parseIsActive(item);
  const code = String(item.zoneDivisionCode ?? item.ZoneDivisionCode ?? '').trim().toUpperCase();

  return {
    id: numId,
    zoneDivisionId: String(rawId ?? code),
    zoneDivisionCode: code,
    zoneDivisionName: String(item.zoneDivisionName ?? item.ZoneDivisionName ?? '').trim(),
    zoneDivisionNameRegional: typeof (item.zoneDivisionNameRegional ?? item.ZoneDivisionNameRegional) === 'string'
      ? String(item.zoneDivisionNameRegional ?? item.ZoneDivisionNameRegional).trim() : undefined,
    address: String(item.address ?? item.Address ?? '').trim(),
    isActive: active,
    markedForDeletion: isDeleted,
    markedForDeletionDate: (item.markedForDeletionDate ?? item.MarkedForDeletionDate) != null
      ? String(item.markedForDeletionDate ?? item.MarkedForDeletionDate) : null,
    createdDate: (item.createdDate ?? item.CreatedDate) != null
      ? String(item.createdDate ?? item.CreatedDate) : undefined,
    updatedDate: (item.updatedDate ?? item.UpdatedDate) != null
      ? String(item.updatedDate ?? item.UpdatedDate) : null,
  };
}

/** Fetches all active zone division masters from the API */
export async function getZoneDivisionMaster(): Promise<ZoneDivisionMasterItem[]> {
  try {
    const response = await apiClient.get<PagedResponse<ZoneDivisionMasterItem>>(`${ENDPOINT}?MarkedForDeletion=false`);
    if (!response.success || !response.data) {
      throw new ApiError(response.statusCode ?? 500, response.error || 'Failed to fetch zone division masters', 'Get zone division master failed');
    }
    const items = response.data.items ?? [];
    return items.filter(isZoneDivisionMasterShape).map(normalizeZoneDivisionMaster).filter((item) => !isRecordMarkedForDeletion(item));
  } catch (error) {
    log.error('Error fetching zone division masters', undefined, error);
    throw error;
  }
}

/** Fetches paginated zone division masters from the API */
export async function getZoneDivisionMasterPaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string,
  isActive?: boolean
): Promise<PagedResponse<ZoneDivisionMasterItem>> {
  try {
    const params = new URLSearchParams();
    params.append('PageNumber', pageNumber.toString());
    params.append('PageSize', pageSize.toString());
    params.append('MarkedForDeletion', 'false');

    if (searchTerm && searchTerm.trim()) params.append('SearchTerm', searchTerm.trim());
    if (typeof sortBy === 'string' && sortBy.trim()) params.append('SortBy', sortBy.trim());
    if (typeof sortOrder === 'string' && sortOrder.trim()) params.append('SortOrder', sortOrder.trim());
    if (typeof isActive === 'boolean') params.append('IsActive', isActive.toString());

    const response = await apiClient.get<PagedResponse<ZoneDivisionMasterItem>>(`${ENDPOINT}?${params.toString()}`);
    if (!response.success || !response.data) {
      throw new ApiError(response.statusCode ?? 500, response.error || 'Failed to fetch paged zone division masters', 'Get paged zone division master failed');
    }

    const items = response.data.items ?? [];
    const normalizedItems = items.filter(isZoneDivisionMasterShape).map(normalizeZoneDivisionMaster).filter((item) => !isRecordMarkedForDeletion(item));
    const totalCount = Number(response.data.totalCount ?? normalizedItems.length);
    const totalPages = Number(response.data.totalPages ?? Math.max(1, Math.ceil(totalCount / pageSize)));

    return {
      ...response.data,
      items: normalizedItems,
      totalCount,
      pageNumber: Number(response.data.pageNumber ?? pageNumber),
      pageSize: Number(response.data.pageSize ?? pageSize),
      totalPages,
      hasPrevious: Boolean(response.data.hasPrevious ?? pageNumber > 1),
      hasNext: Boolean(response.data.hasNext ?? pageNumber < totalPages),
    };
  } catch (error) {
    log.error('Error fetching paged zone division masters', { pageNumber, pageSize }, error);
    throw error;
  }
}

/** Creates a new zone division master record */
export async function createZoneDivisionMaster(
  payload: ZoneDivisionMasterPayload
): Promise<ZoneDivisionMasterItem> {
  try {
    const body: Record<string, unknown> = {
      zoneDivisionCode: payload.zoneDivisionCode.toUpperCase().trim(),
      zoneDivisionName: payload.zoneDivisionName.trim(),
      zoneDivisionNameRegional: payload.zoneDivisionNameRegional?.trim() || undefined,
      address: payload.address.trim(),
      isActive: Boolean(payload.isActive),
    };

    const response = await apiClient.post<ZoneDivisionMasterItem>(ENDPOINT, body);
    if (!response.success || !response.data) {
      throw new ApiError(response.statusCode ?? 500, response.error || 'Failed to create zone division master', 'Create zone division master failed');
    }
    return normalizeZoneDivisionMaster(response.data);
  } catch (error) {
    log.error('Error creating zone division master', {}, error);
    throw error;
  }
}

/** Updates an existing zone division master record */
export async function updateZoneDivisionMaster(
  idOrCode: string | number,
  payload: Partial<ZoneDivisionMasterPayload>
): Promise<ZoneDivisionMasterItem> {
  try {
    const body: Record<string, unknown> = {};
    if (payload.zoneDivisionCode) body.zoneDivisionCode = payload.zoneDivisionCode.toUpperCase().trim();
    if (payload.zoneDivisionName) body.zoneDivisionName = payload.zoneDivisionName.trim();
    if (payload.zoneDivisionNameRegional !== undefined) {
      body.zoneDivisionNameRegional = payload.zoneDivisionNameRegional.trim() || undefined;
    }
    if (payload.address) body.address = payload.address.trim();
    if (payload.isActive !== undefined) body.isActive = Boolean(payload.isActive);

    const response = await apiClient.put<ZoneDivisionMasterItem>(`${ENDPOINT}/${encodeURIComponent(String(idOrCode))}`, body);
    if (!response.success || !response.data) {
      throw new ApiError(response.statusCode ?? 500, response.error || 'Failed to update zone division master', 'Update zone division master failed');
    }
    return normalizeZoneDivisionMaster(response.data);
  } catch (error) {
    log.error(`Error updating zone division master ${idOrCode}`, { idOrCode }, error);
    throw error;
  }
}

/** Deletes a zone division master record */
export async function deleteZoneDivisionMaster(idOrCode: string | number): Promise<void> {
  try {
    const response = await apiClient.delete<void>(`${ENDPOINT}/${encodeURIComponent(String(idOrCode))}`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || 'Failed to delete zone division master', 'Delete zone division master failed');
    }
  } catch (error) {
    log.error(`Error deleting zone division master ${idOrCode}`, { idOrCode }, error);
    throw error;
  }
}
