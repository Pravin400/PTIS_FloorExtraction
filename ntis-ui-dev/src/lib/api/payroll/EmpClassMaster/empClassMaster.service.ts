import { apiClient } from '@/services/api.service';
import type { EmpClassMasterItem, EmpClassMasterPayload } from '@/types/payroll/MasterModule';
import type { PagedResponse } from '@/types/common.types';
import { ApiError } from '@/lib/utils/api';
import { createLogger } from '@/lib/utils/server-logger';
import { isRecordMarkedForDeletion, parseIsActive } from '@/lib/utils/payroll.utils';

const log = createLogger('EmpClassMasterService');
const ENDPOINT = '/payroll/employee-class-master';

/**
 * Type guard for Employee Class Master raw backend shape
 */
export function isEmpClassMasterShape(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && ('classCode' in value || 'ClassCode' in value || 'className' in value || 'ClassName' in value);
}

/**
 * Normalizes backend DTO to frontend EmpClassMasterItem
 */
export function normalizeEmpClassMaster(raw: unknown): EmpClassMasterItem {
  const item = (raw || {}) as Record<string, unknown>;
  const rawId = item.id ?? item.employeeClassId ?? item.Id ?? item.EmployeeClassId ?? item.EmployeeClassID;
  const numId = typeof item.id === 'number' ? item.id : typeof item.Id === 'number' ? item.Id : !isNaN(Number(rawId)) ? Number(rawId) : undefined;
  const isDeleted = isRecordMarkedForDeletion(item);
  const active = parseIsActive(item);
  const code = String(item.classCode ?? item.ClassCode ?? '').trim().toUpperCase();

  return {
    id: numId,
    employeeClassId: String(rawId ?? code),
    classCode: code,
    className: String(item.className ?? item.ClassName ?? '').trim(),
    classNameMarathi: typeof (item.classNameMarathi ?? item.ClassNameMarathi) === 'string'
      ? String(item.classNameMarathi ?? item.ClassNameMarathi).trim() : '',
    description: typeof (item.description ?? item.Description) === 'string'
      ? String(item.description ?? item.Description).trim() : '',
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

/** Fetches all active employee class masters from the API */
export async function getEmpClassMaster(): Promise<EmpClassMasterItem[]> {
  try {
    const response = await apiClient.get<PagedResponse<EmpClassMasterItem>>(`${ENDPOINT}?MarkedForDeletion=false`);
    if (!response.success || !response.data) {
      throw new ApiError(response.statusCode ?? 500, response.error || 'Failed to fetch employee class masters', 'Get employee class master failed');
    }
    const items = response.data.items ?? [];
    return items.filter(isEmpClassMasterShape).map(normalizeEmpClassMaster).filter((item) => !isRecordMarkedForDeletion(item));
  } catch (error) {
    log.error('Error fetching employee class masters', undefined, error);
    throw error;
  }
}

/** Fetches paginated employee class masters from the API */
export async function getEmpClassMasterPaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string,
  isActive?: boolean
): Promise<PagedResponse<EmpClassMasterItem>> {
  try {
    const params = new URLSearchParams({
      PageNumber: pageNumber.toString(),
      PageSize: pageSize.toString(),
      MarkedForDeletion: 'false',
    });
    if (searchTerm?.trim()) params.append('SearchTerm', searchTerm.trim());
    if (sortBy?.trim()) params.append('SortBy', sortBy.trim());
    if (sortOrder?.trim()) params.append('SortOrder', sortOrder.trim());
    if (typeof isActive === 'boolean') params.append('IsActive', isActive.toString());

    const response = await apiClient.get<PagedResponse<EmpClassMasterItem>>(`${ENDPOINT}?${params.toString()}`);
    if (!response.success || !response.data) {
      throw new ApiError(response.statusCode ?? 500, response.error || 'Failed to fetch paged employee class masters', 'Get paged employee class master failed');
    }

    const items = response.data.items ?? [];
    const normalizedItems = items.filter(isEmpClassMasterShape).map(normalizeEmpClassMaster).filter((item) => !isRecordMarkedForDeletion(item));
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
    log.error('Error fetching paged employee class masters', { pageNumber, pageSize }, error);
    throw error;
  }
}

/** Creates a new employee class master record */
export async function createEmpClassMaster(payload: EmpClassMasterPayload): Promise<EmpClassMasterItem> {
  try {
    const body: Record<string, unknown> = {
      classCode: payload.classCode.toUpperCase().trim(),
      className: payload.className.trim(),
      classNameMarathi: payload.classNameMarathi?.trim() || undefined,
      isActive: Boolean(payload.isActive),
      ...(payload.description != null && { description: payload.description.trim() || undefined }),
    };

    const response = await apiClient.post<EmpClassMasterItem>(ENDPOINT, body);
    if (!response.success || !response.data) {
      throw new ApiError(response.statusCode ?? 500, response.error || 'Failed to create employee class master', 'Create employee class master failed');
    }
    return normalizeEmpClassMaster(response.data);
  } catch (error) {
    log.error('Error creating employee class master', {}, error);
    throw error;
  }
}

/** Updates an existing employee class master record */
export async function updateEmpClassMaster(idOrCode: string | number, payload: Partial<EmpClassMasterPayload>): Promise<EmpClassMasterItem> {
  try {
    const body: Record<string, unknown> = {
      ...(payload.classCode && { classCode: payload.classCode.toUpperCase().trim() }),
      ...(payload.className && { className: payload.className.trim() }),
      ...(payload.classNameMarathi && { classNameMarathi: payload.classNameMarathi.trim() }),
      ...(payload.description !== undefined && { description: payload.description?.trim() || undefined }),
      ...(payload.isActive !== undefined && { isActive: Boolean(payload.isActive) }),
    };

    const response = await apiClient.put<EmpClassMasterItem>(`${ENDPOINT}/${encodeURIComponent(String(idOrCode))}`, body);
    if (!response.success || !response.data) {
      throw new ApiError(response.statusCode ?? 500, response.error || 'Failed to update employee class master', 'Update employee class master failed');
    }
    return normalizeEmpClassMaster(response.data);
  } catch (error) {
    log.error(`Error updating employee class master ${idOrCode}`, { idOrCode }, error);
    throw error;
  }
}

/** Deletes an employee class master record */
export async function deleteEmpClassMaster(idOrCode: string | number): Promise<void> {
  try {
    const response = await apiClient.delete<void>(`${ENDPOINT}/${encodeURIComponent(String(idOrCode))}`);
    if (!response.success) {
      throw new ApiError(response.statusCode ?? 500, response.error || 'Failed to delete employee class master', 'Delete employee class master failed');
    }
  } catch (error) {
    log.error(`Error deleting employee class master ${idOrCode}`, { idOrCode }, error);
    throw error;
  }
}

