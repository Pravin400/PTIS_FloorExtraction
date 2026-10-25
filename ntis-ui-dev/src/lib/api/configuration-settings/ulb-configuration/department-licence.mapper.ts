import { DEPARTMENT_DURATION_OPTIONS } from '@/config/ulb-configuration.config';
import type { DepartmentLicense, DepartmentLicenceDetails } from '@/types/ulbconfig-master.types';

function toApiDateTime(date: string): string | null {
  const trimmed = date.trim();
  if (!trimmed) return null;
  return trimmed.includes('T') ? trimmed : `${trimmed}T00:00:00`;
}

function formatLicenceDuration(duration: string): string | null {
  const trimmed = duration.trim();
  if (!trimmed) return null;
  const option = DEPARTMENT_DURATION_OPTIONS.find((o) => o.value === trimmed);
  return option?.label ?? trimmed;
}

/** Converts API duration labels (e.g. "12 Months") back to form select values. */
export function parseDurationFromApi(duration: string): string {
  const trimmed = duration.trim();
  if (!trimmed) return '';
  const byLabel = DEPARTMENT_DURATION_OPTIONS.find((o) => o.label === trimmed);
  if (byLabel) return byLabel.value;
  const byValue = DEPARTMENT_DURATION_OPTIONS.find((o) => o.value === trimmed);
  if (byValue) return byValue.value;
  return trimmed;
}

/** Maps department licence card state to POST/PUT `/DepartmentLicenceDetails` request body. */
export function mapDepartmentLicenseToPayload(dept: DepartmentLicense): DepartmentLicenceDetails {
  return {
    departmentLicenceDetailsId: dept.departmentLicenceDetailsId,
    departmentId: dept.departmentMasterId,
    departmentMasterId: dept.departmentMasterId,
    licenceStartDate: toApiDateTime(dept.startDate) ?? undefined,
    licenceEndDate: toApiDateTime(dept.endDate) ?? undefined,
    licenceDuration: formatLicenceDuration(dept.duration) ?? undefined,
    isActive: dept.enabled,
    isEnabled: dept.enabled,
    status: dept.status,
  };
}
