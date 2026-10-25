import { parseBoolean } from '@/lib/utils/type-guards';
import { ApiError } from '@/lib/utils/api';
import type {
  DepartmentLicenceDetails,
  DepartmentLicenceMutationResponse,
} from '@/types/ulbconfig-master.types';

/**
 * Normalizes DepartmentLicenceDetails from GET `/DepartmentLicenceDetails`.
 * API fields: id, departmentId, licenceStartDate, licenceEndDate, licenceDuration, isActive
 */
export function normalizeDepartmentLicenceDetails(
  data: Record<string, unknown>
): DepartmentLicenceDetails {
  const id = Number(
    data.id ??
      data.Id ??
      data.departmentLicenceDetailsId ??
      data.DepartmentLicenceDetailsId ??
      0
  );

  const departmentId = Number(
    data.departmentId ??
      data.DepartmentId ??
      data.departmentMasterId ??
      data.DepartmentMasterId ??
      0
  );

  const isActive = parseBoolean(data.isActive ?? data.IsActive ?? data.isEnabled ?? false);

  return {
    departmentLicenceDetailsId: id || undefined,
    departmentMasterId: departmentId || undefined,
    departmentId: departmentId || undefined,
    licenceStartDate: String(data.licenceStartDate ?? data.LicenceStartDate ?? ''),
    licenceEndDate: String(data.licenceEndDate ?? data.LicenceEndDate ?? ''),
    licenceDuration: String(data.licenceDuration ?? data.LicenceDuration ?? ''),
    isActive,
    isEnabled: isActive,
    status: isActive ? 'active' : 'inactive',
  };
}

export function extractDepartmentLicenceRecord(data: unknown): DepartmentLicenceDetails | null {
  if (!data || typeof data !== 'object') return null;

  const body = data as Record<string, unknown>;
  const items = body.items ?? body.Items;

  if (items && typeof items === 'object' && !Array.isArray(items)) {
    return normalizeDepartmentLicenceDetails(items as Record<string, unknown>);
  }

  return normalizeDepartmentLicenceDetails(body);
}

/** Parses POST/PUT `/DepartmentLicenceDetails` wrapped mutation responses. */
export function parseDepartmentLicenceMutationResponse(
  data: DepartmentLicenceMutationResponse,
  fallbackError: string
): { licence: DepartmentLicenceDetails; message: string } {
  if (data.success === false) {
    throw new ApiError(400, data.message || fallbackError, fallbackError);
  }

  const normalized = extractDepartmentLicenceRecord(data);
  if (!normalized) {
    throw new ApiError(500, data.message || 'Invalid department licence response', fallbackError);
  }

  return {
    licence: normalized,
    message: data.message || 'Record saved successfully',
  };
}
