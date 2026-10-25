import type { DepartmentLicense } from '@/types/ulbconfig-master.types';

/** Departments that should be POST/PUT on save (enabled or previously persisted). */
export function getDepartmentLicencesToSave(
  departments: DepartmentLicense[]
): DepartmentLicense[] {
  return departments.filter((dept) => {
    const hasPersistedLicence =
      dept.departmentLicenceDetailsId != null && dept.departmentLicenceDetailsId > 0;
    return dept.enabled || hasPersistedLicence;
  });
}

/** Returns the first enabled department missing required licence dates. */
export function findInvalidEnabledDepartment(
  toSave: DepartmentLicense[]
): DepartmentLicense | undefined {
  return toSave.find(
    (dept) =>
      dept.enabled &&
      (!dept.startDate?.trim() || !dept.duration?.trim() || !dept.endDate?.trim())
  );
}
