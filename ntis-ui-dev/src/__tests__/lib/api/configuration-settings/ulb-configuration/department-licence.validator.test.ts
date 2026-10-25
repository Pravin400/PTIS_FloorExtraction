import {
  findInvalidEnabledDepartment,
  getDepartmentLicencesToSave,
} from '@/lib/api/configuration-settings/ulb-configuration/department-licence.validator';
import type { DepartmentLicense } from '@/types/ulbconfig-master.types';

describe('department-licence.validator', () => {
  const base: DepartmentLicense = {
    id: 'dept-1',
    departmentMasterId: 1,
    name: 'Property Tax',
    enabled: true,
    startDate: '2026-01-01',
    duration: '12',
    endDate: '2027-01-01',
    status: 'active',
    renewalAlerts: [],
  };

  it('includes enabled departments and persisted disabled records', () => {
    const departments: DepartmentLicense[] = [
      base,
      { ...base, id: 'dept-2', enabled: false, departmentLicenceDetailsId: 99 },
      { ...base, id: 'dept-3', enabled: false },
    ];

    const toSave = getDepartmentLicencesToSave(departments);
    expect(toSave).toHaveLength(2);
    expect(toSave.map((d) => d.id)).toEqual(['dept-1', 'dept-2']);
  });

  it('flags enabled departments missing licence dates', () => {
    const toSave: DepartmentLicense[] = [
      { ...base, endDate: '' },
    ];

    expect(findInvalidEnabledDepartment(toSave)?.id).toBe('dept-1');
    expect(findInvalidEnabledDepartment([{ ...base, enabled: false, endDate: '' }])).toBeUndefined();
  });
});
