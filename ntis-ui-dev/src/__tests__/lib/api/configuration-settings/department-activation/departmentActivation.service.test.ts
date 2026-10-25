import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ModuleMaster } from '@/types/moduleMaster.types';

vi.mock('@/lib/api/configuration-settings/module-master/module-master.services', () => ({
  getModuleMastersSummary: vi.fn(),
}));

import { getModuleMastersSummary } from '@/lib/api/configuration-settings/module-master/module-master.services';
import { departmentActivationService } from '@/lib/api/configuration-settings/department-activation/departmentActivation.service';

const mockModules: ModuleMaster[] = [
  {
    moduleId: 1,
    departmentId: 10,
    moduleCode: 'PTIS_M',
    moduleName: 'Property Tax',
    moduleNameLocal: '',
    moduleIcon: '',
    moduleLabel: '',
    moduleDescription: 'Property Tax Module',
    departmentName: 'Property Tax',
    isActive: true,
  },
  {
    moduleId: 2,
    departmentId: 10,
    moduleCode: 'PTIS_M2',
    moduleName: 'New Module',
    moduleNameLocal: '',
    moduleIcon: '',
    moduleLabel: '',
    moduleDescription: 'Recently added module',
    departmentName: 'Property Tax',
    isActive: true,
  },
  {
    moduleId: 3,
    departmentId: 20,
    moduleCode: 'WT_M',
    moduleName: 'Water Tax Module',
    moduleNameLocal: '',
    moduleIcon: '',
    moduleLabel: '',
    moduleDescription: 'Water module',
    departmentName: 'Water Tax',
    isActive: true,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('departmentActivationService.getModulesByDepartment', () => {
  it('returns all modules for the requested department, including newly created ones', async () => {
    vi.mocked(getModuleMastersSummary).mockResolvedValue(mockModules);

    const result = await departmentActivationService.getModulesByDepartment(10);

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data?.map((m) => m.moduleCode)).toEqual(['PTIS_M', 'PTIS_M2']);
  });

  it('returns an empty list when no modules belong to the department', async () => {
    vi.mocked(getModuleMastersSummary).mockResolvedValue(mockModules);

    const result = await departmentActivationService.getModulesByDepartment(999);

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  it('returns an error when the summary fetch fails', async () => {
    vi.mocked(getModuleMastersSummary).mockRejectedValue(new Error('Fetch failed'));

    const result = await departmentActivationService.getModulesByDepartment(10);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Fetch failed');
  });
});
