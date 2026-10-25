/**
 * Grievance Category API - Normalization Utilities
 */
import type {
  GrievanceCategory,
  Priority,
  EscalationLevel,
} from '@/types/grievance-category-master/grievanceCategory.types';
import {
  PRIORITIES,
  ESCALATION_LEVELS,
} from '@/types/grievance-category-master/grievanceCategory.types';

function parseOptionalNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function getStringValue(item: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    if (typeof item[key] === 'string') return item[key];
    if (typeof item[key] === 'number') return String(item[key]);
  }
  return undefined;
}

function normalizePriority(raw: string): Priority {
  if (!raw || raw.trim() === '' || raw.toLowerCase() === 'string') return 'Medium';
  const normalized = raw.trim().toLowerCase();
  const found = PRIORITIES.find((p) => p.toLowerCase() === normalized);
  return found ?? 'Medium';
}

function normalizeEscalationLevel(raw: string): EscalationLevel {
  if (!raw || raw.trim() === '' || raw.toLowerCase() === 'string') return 'Level 1';
  const normalized = raw.trim().toLowerCase();
  const found = ESCALATION_LEVELS.find((l) => l.toLowerCase() === normalized);
  return found ?? 'Level 1';
}

export function normalizeGrievanceCategory(data: unknown): GrievanceCategory {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid grievance category data: expected a non-null object.');
  }
  const item = data as Record<string, unknown>;

  const idRaw =
    item.id ??
    item.Id ??
    item.ID ??
    item.grievanceCategoryId ??
    item.GrievanceCategoryId ??
    item.grievanceCategoryID ??
    item.categoryId ??
    item.CategoryId ??
    item.categoryID;
  const id =
    typeof idRaw === 'string' ? Number(idRaw) : typeof idRaw === 'number' ? idRaw : undefined;
  if (id === undefined || !Number.isFinite(id) || id <= 0) {
    throw new Error('Invalid grievance category data: missing or invalid "id".');
  }

  const deptIdRaw =
    item.departmentId ??
    item.departmentID ??
    item.DepartmentId ??
    item.DepartmentID ??
    item.departmentMasterId ??
    item.DepartmentMasterId ??
    item.deptId ??
    item.DeptId;
  let departmentId = 0;
  if (typeof deptIdRaw === 'number') departmentId = deptIdRaw;
  else if (typeof deptIdRaw === 'string' && deptIdRaw.trim() !== '') {
    const num = Number(deptIdRaw);
    if (!Number.isNaN(num)) departmentId = num;
  }

  const departmentName = getStringValue(
    item,
    'departmentName',
    'DepartmentName',
    'deptName',
    'DeptName',
    'departmentNameLocal'
  );
  const rawPriority = getStringValue(item, 'priority', 'Priority', 'grievancePriority') ?? '';
  const rawEscalation =
    getStringValue(item, 'escalationLevel', 'EscalationLevel', 'escalation') ?? '';

  return {
    id,
    categoryCode:
      getStringValue(item, 'categoryCode', 'categorycode', 'CategoryCode', 'code', 'Code') ?? '',
    categoryName:
      getStringValue(item, 'categoryName', 'categoryname', 'CategoryName', 'name', 'Name') ?? '',
    departmentId,
    departmentName,
    priority: normalizePriority(rawPriority),
    resolutionSla:
      getStringValue(item, 'resolutionSla', 'resolution_sla', 'ResolutionSla', 'sla', 'SLA') ?? '',
    escalationLevel: normalizeEscalationLevel(rawEscalation),
    description: getStringValue(item, 'description', 'Description', 'desc', 'Desc') ?? '',
    isActive:
      typeof item.isActive === 'boolean'
        ? item.isActive
        : item.isActive === 'true' || item.isActive === 1 || item.isActive === '1',
    createdDate: getStringValue(item, 'createdDate', 'created_date', 'CreatedDate'),
    updatedDate: getStringValue(item, 'updatedDate', 'updated_date', 'UpdatedDate'),
    createdBy: parseOptionalNumber(item.createdBy ?? item.CreatedBy),
    updatedBy: parseOptionalNumber(item.updatedBy ?? item.UpdatedBy),
  };
}

export type RawPaginatedResponse = {
  items?: unknown[];
  data?: unknown[];
  totalCount?: number;
  total?: number;
  pageNumber?: number;
  pageSize?: number;
  totalPages?: number;
  hasPrevious?: boolean;
  hasNext?: boolean;
};

export function parsePaginatedResponse(response: unknown): {
  items: unknown[];
  total: number;
} {
  // Case 1: Response is a plain array
  if (Array.isArray(response)) {
    return { items: response, total: response.length };
  }

  // Case 2: Response is an object (standard RawPaginatedResponse)
  if (response && typeof response === 'object') {
    const r = response as RawPaginatedResponse;
    const items = r.items ?? r.data ?? [];
    const total = r.totalCount ?? r.total ?? (Array.isArray(items) ? items.length : 0);
    return { items: Array.isArray(items) ? items : [], total };
  }

  return { items: [], total: 0 };
}
