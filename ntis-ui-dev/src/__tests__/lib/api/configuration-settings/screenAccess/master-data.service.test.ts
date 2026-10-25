import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/services/api.service';
import {
  getDepartments,
  getModules,
} from '@/lib/api/configuration-settings/screenAccess/master-data.service';

vi.mock('@/services/api.service', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('master-data.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDepartments', () => {
    it('fetches and maps departments correctly', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [
            {
              DepartmentMasterId: 1,
              DepartmentName: 'IT',
              DepartmentCode: 'IT_01',
            },
            {
              departmentId: 2,
              departmentName: 'HR',
              departmentCode: 'HR_01',
            },
          ],
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getDepartments();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        departmentMasterId: 1,
        departmentId: 1,
        departmentName: 'IT',
        departmentCode: 'IT_01',
      });
      expect(result[1]).toEqual({
        departmentMasterId: 2,
        departmentId: 2,
        departmentName: 'HR',
        departmentCode: 'HR_01',
      });
    });
  });

  describe('getModules', () => {
    it('fetches and maps modules correctly with proper boolean parsing for isActive', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [
            {
              ModuleMasterId: 10,
              DepartmentMasterId: 1,
              ModuleName: 'Admin',
              IsActive: 'true',
            },
            {
              moduleId: 11,
              departmentId: 1,
              moduleName: 'Reports',
              isActive: 'false', // string 'false' should map to false
            },
            {
              moduleId: 12,
              departmentId: 2,
              moduleName: 'Settings',
              IsActive: '0', // string '0' should map to false
            },
            {
              moduleId: 13,
              departmentId: 2,
              moduleName: 'Dashboard',
              isActive: false, // boolean false should map to false
            },
          ],
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getModules();

      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({
        moduleMasterId: 10,
        moduleId: 10,
        moduleName: 'Admin',
        departmentMasterId: 1,
        departmentId: 1,
        isActive: true,
      });
      expect(result[1]).toEqual({
        moduleMasterId: 11,
        moduleId: 11,
        moduleName: 'Reports',
        departmentMasterId: 1,
        departmentId: 1,
        isActive: false,
      });
      expect(result[2]).toEqual({
        moduleMasterId: 12,
        moduleId: 12,
        moduleName: 'Settings',
        departmentMasterId: 2,
        departmentId: 2,
        isActive: false,
      });
      expect(result[3]).toEqual({
        moduleMasterId: 13,
        moduleId: 13,
        moduleName: 'Dashboard',
        departmentMasterId: 2,
        departmentId: 2,
        isActive: false,
      });
    });
  });
});
