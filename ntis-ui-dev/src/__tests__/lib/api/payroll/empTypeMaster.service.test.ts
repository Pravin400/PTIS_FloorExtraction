import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  normalizeEmpTypeMaster,
  getEmpTypeMasterPaged,
  createEmpTypeMaster,
  updateEmpTypeMaster,
  deleteEmpTypeMaster,
} from '@/lib/api/payroll/EmpTypeMaster/empTypeMaster.service';
import { apiClient } from '@/services/api.service';
import type { EmpTypeMasterItem } from '@/types/payroll/MasterModule';

vi.mock('server-only', () => ({}));
vi.mock('@/services/api.service', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('empTypeMaster.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validPayload: Omit<EmpTypeMasterItem, 'employeeTypeId'> = {
    employeeTypeCode: 'PERM',
    employeeTypeName: 'Permanent',
    employeeTypeNameMarathi: 'कायम',
    sequenceNo: 1,
    isActive: true,
  };

  describe('normalizeEmpTypeMaster', () => {
    it('normalizes raw API items and applies default types', () => {
      const raw = {
        employeeTypeId: 55,
        employeeTypeCode: '  contract ',
        employeeTypeName: ' Contractual ',
        employeeTypeNameMarathi: ' कंत्राटी ',
        sequenceNo: '4',
        isActive: 1,
      };

      const result = normalizeEmpTypeMaster(raw);
      expect(result.employeeTypeId).toBe('55');
      expect(result.employeeTypeCode).toBe('CONTRACT');
      expect(result.employeeTypeName).toBe('Contractual');
      expect(result.employeeTypeNameMarathi).toBe('कंत्राटी');
      expect(result.sequenceNo).toBe(4);
      expect(result.isActive).toBe(true);
    });

    it('normalizes soft-deleted and inactive records with varied backend keys (isactive: 0, markfordeletion: 1)', () => {
      const raw = {
        employeeTypeId: 99,
        employeeTypeCode: 'INTERN',
        employeeTypeName: 'Intern',
        isactive: 0,
        markfordeletion: 1,
      };

      const result = normalizeEmpTypeMaster(raw);
      expect(result.employeeTypeId).toBe('99');
      expect(result.isActive).toBe(false);
      expect(result.markedForDeletion).toBe(true);
    });
  });

  describe('getEmpTypeMasterPaged', () => {
    it('calls apiClient.get with correct endpoint and query parameters', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        data: {
          items: [{ ...validPayload, employeeTypeId: 'TYPE-101' }],
          totalCount: 1,
          pageNumber: 1,
          pageSize: 10,
          totalPages: 1,
        },
      });

      const res = await getEmpTypeMasterPaged(1, 10, 'PERM');

      expect(apiClient.get).toHaveBeenCalledWith(
        '/payroll/employee-type-master?PageNumber=1&PageSize=10&MarkedForDeletion=false&SearchTerm=PERM'
      );
      expect(res.items).toHaveLength(1);
      expect(res.totalCount).toBe(1);
    });

    it('passes IsActive and MarkedForDeletion query parameters and filters out deleted records', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        data: {
          items: [
            { ...validPayload, employeeTypeId: 'TYPE-1', isActive: false, markedForDeletion: true },
            { ...validPayload, employeeTypeId: 'TYPE-2', isActive: false, markedForDeletion: false },
          ],
          totalCount: 2,
          pageNumber: 1,
          pageSize: 10,
          totalPages: 1,
        },
      });

      const res = await getEmpTypeMasterPaged(1, 10, undefined, undefined, undefined, false);

      expect(apiClient.get).toHaveBeenCalledWith(
        '/payroll/employee-type-master?PageNumber=1&PageSize=10&MarkedForDeletion=false&IsActive=false'
      );
      // Soft-deleted record (markedForDeletion=true) must be excluded
      expect(res.items).toHaveLength(1);
      expect(res.items[0].employeeTypeId).toBe('TYPE-2');
    });

    it('throws ApiError when response is not successful', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: false,
        statusCode: 500,
        error: 'Failed to retrieve records',
      });

      await expect(getEmpTypeMasterPaged(1, 10)).rejects.toThrow();
    });
  });

  describe('createEmpTypeMaster', () => {
    it('calls apiClient.post with correct endpoint, body, and createdBy metadata', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        success: true,
        data: { ...validPayload, employeeTypeId: 'TYPE-202' },
      });

      const res = await createEmpTypeMaster(validPayload, 99);

      expect(apiClient.post).toHaveBeenCalledWith('/payroll/employee-type-master', {
        ...validPayload,
        createdBy: 99,
      });
      expect(res.employeeTypeId).toBe('TYPE-202');
    });

    it('throws ApiError when creation fails', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        success: false,
        statusCode: 400,
        error: 'Duplicate code',
      });

      await expect(createEmpTypeMaster(validPayload)).rejects.toThrow();
    });
  });

  describe('updateEmpTypeMaster', () => {
    it('calls apiClient.put with target ID and updatedBy metadata', async () => {
      vi.mocked(apiClient.put).mockResolvedValueOnce({
        success: true,
        data: { ...validPayload, employeeTypeId: 'TYPE-202', employeeTypeName: 'Updated Name' },
      });

      const res = await updateEmpTypeMaster('TYPE-202', { employeeTypeName: 'Updated Name' }, 99);

      expect(apiClient.put).toHaveBeenCalledWith('/payroll/employee-type-master/TYPE-202', {
        employeeTypeName: 'Updated Name',
        updatedBy: 99,
      });
      expect(res.employeeTypeName).toBe('Updated Name');
    });

    it('throws ApiError when update call fails', async () => {
      vi.mocked(apiClient.put).mockResolvedValueOnce({
        success: false,
        statusCode: 404,
        error: 'Not found',
      });

      await expect(updateEmpTypeMaster('TYPE-999', validPayload)).rejects.toThrow();
    });
  });

  describe('deleteEmpTypeMaster', () => {
    it('calls apiClient.delete with encoded ID', async () => {
      vi.mocked(apiClient.delete).mockResolvedValueOnce({
        success: true,
      });

      await deleteEmpTypeMaster('TYPE-202');
      expect(apiClient.delete).toHaveBeenCalledWith('/payroll/employee-type-master/TYPE-202');
    });

    it('throws ApiError when delete call fails on backend', async () => {
      vi.mocked(apiClient.delete).mockResolvedValueOnce({
        success: false,
        statusCode: 409,
        error: 'Cannot delete: record in use',
      });

      await expect(deleteEmpTypeMaster('TYPE-202')).rejects.toThrow();
    });
  });
});
