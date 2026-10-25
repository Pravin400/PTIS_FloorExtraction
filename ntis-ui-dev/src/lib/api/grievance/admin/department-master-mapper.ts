/**
 * Grievance Department Master DTO Mapper
 * Bidirectional normalization between ASP.NET Core backend and frontend UI.
 * Backend only returns department-level fields (no HOD, phone, email).
 *
 * Path: src/lib/api/grievance/admin/department-master-mapper.ts
 */

import type {
  GrievanceDepartment,
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from '@/types/grievance/department-master.types';

// ---------------------------------------------------------------------------
// Incoming: Backend (.NET PascalCase / camelCase) → Frontend GrievanceDepartment
// ---------------------------------------------------------------------------

/**
 * Normalize a single backend department record to the frontend shape.
 * Handles both PascalCase (.NET) and camelCase response formats.
 * Backend only provides department-level info — HOD, phone, email are left empty.
 */
export function normalizeGrievanceDepartment(
  raw: Record<string, unknown>
): GrievanceDepartment {
  const src = (raw && typeof raw === 'object'
    ? (raw.items && typeof raw.items === 'object' && !Array.isArray(raw.items)
        ? raw.items
        : raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)
          ? raw.data
          : raw)
    : {}) as Record<string, unknown>;

  const id = src.id ?? src.Id ?? src.departmentId ?? src.DepartmentId ?? '';

  return {
    id: String(id),
    srNo: Number(id) || 0,
    // Backend has no separate code field — derive from id
    code: String(
      src.departmentCode ?? src.DepartmentCode ?? src.code ?? id ?? ''
    ),
    nameEn: String(
      src.departmentName ?? src.DepartmentName ?? src.nameEn ?? ''
    ),
    nameMr: String(
      src.departmentNameLocal ??
        src.DepartmentNameLocal ??
        src.nameMr ??
        ''
    ),
    description: String(
      src.departmentDescription ??
        src.DepartmentDescription ??
        src.description ??
        ''
    ),
    grievanceTypes: [],
    isActive: Boolean(src.isActive ?? src.IsActive ?? true),
    totalGrievances: 0,
    resolvedGrievances: 0,
    pendingGrievances: 0,
    createdAt: String(
      src.createdDate ??
        src.CreatedDate ??
        src.createdAt ??
        src.CreatedAt ??
        ''
    ),
    updatedAt: String(
      src.updatedDate ??
        src.UpdatedDate ??
        src.updatedAt ??
        src.UpdatedAt ??
        ''
    ),
  };
}

// ---------------------------------------------------------------------------
// Paged response normalization
// ---------------------------------------------------------------------------

export interface NormalizedPagedResult {
  items: GrievanceDepartment[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Normalize a paged API response from ASP.NET backend to a flat shape
 * consumed by the UI hook. Handles both PascalCase and camelCase envelopes.
 */
export function normalizePagedResponse(
  raw: Record<string, unknown>
): NormalizedPagedResult {
  const rawItems = (raw.items ??
    raw.Items ??
    raw.data ??
    raw.Data ??
    []) as Record<string, unknown>[];

  const items = Array.isArray(rawItems)
    ? rawItems.map(normalizeGrievanceDepartment)
    : [];

  const total = Number(
    raw.totalCount ?? raw.TotalCount ?? raw.total ?? raw.Total ?? items.length
  );

  const effectivePageSize = Number(raw.pageSize ?? raw.PageSize ?? 10) || 10;

  return {
    items,
    total,
    page: Number(
      raw.pageNumber ?? raw.PageNumber ?? raw.page ?? raw.Page ?? 1
    ),
    pageSize: effectivePageSize,
    totalPages: Number(
      raw.totalPages ??
        raw.TotalPages ??
        (total > 0 ? Math.ceil(total / effectivePageSize) : 1)
    ),
  };
}

// ---------------------------------------------------------------------------
// Outgoing: Frontend DTO → Backend ASP.NET Payload (department fields only)
// ---------------------------------------------------------------------------

/**
 * Convert frontend CreateDepartmentDto to the backend payload shape.
 * Only sends department-level fields — no HOD / contact info.
 */
export function toBackendCreatePayload(
  dto: CreateDepartmentDto,
  userId?: number | string
): Record<string, unknown> {
  const parsedUserId = userId && !isNaN(Number(userId)) && Number(userId) > 0 ? Number(userId) : 1;
  return {
    departmentName: dto.nameEn?.trim() || '',
    departmentNameLocal: dto.nameMr?.trim() || '',
    isActive: dto.isActive !== false,
    createdBy: parsedUserId,
  };
}

/**
 * Convert frontend UpdateDepartmentDto to the backend payload shape.
 * Only sends fields that are explicitly provided (partial update support).
 */
export function toBackendUpdatePayload(
  id: string | number,
  dto: UpdateDepartmentDto,
  userId?: number | string
): Record<string, unknown> {
  const parsedUserId = userId && !isNaN(Number(userId)) && Number(userId) > 0 ? Number(userId) : 1;
  const payload: Record<string, unknown> = {
    id: Number(id) || 0,
    updatedBy: parsedUserId,
  };
  if (dto.nameEn !== undefined) payload.departmentName = dto.nameEn.trim();
  if (dto.nameMr !== undefined)
    payload.departmentNameLocal = dto.nameMr.trim();
  if (dto.isActive !== undefined) payload.isActive = dto.isActive;
  return payload;
}
