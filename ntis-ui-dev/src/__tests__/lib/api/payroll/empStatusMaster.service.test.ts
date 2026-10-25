import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  normalizeEmpStatusMaster,
  getEmpStatusMasterPaged,
  createEmpStatusMaster,
  updateEmpStatusMaster,
  deleteEmpStatusMaster,
} from '@/lib/api/payroll/EmpStatusMaster/empStatusMaster.service';
import { apiClient } from '@/services/api.service';
import type { EmpStatusMasterItem } from '@/types/payroll/MasterModule';

vi.mock('server-only', () => ({}));
vi.mock('@/services/api.service', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('empStatusMaster.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validPayload: Omit<EmpStatusMasterItem, 'employeeStatusId'> = {
    employeeStatusCode: 'ACTIVE',
    employeeStatus: 'Active in Service',
    employeeStatusMarathi: 'सेवेत कार्यरत',
    description: 'Employee is currently active in service',
    isActive: true,
  };

  describe('normalizeEmpStatusMaster', () => {
    it('normalizes raw API items from backend JSON and applies proper types', () => {
      const raw = {
        employeeStatusCode: 'ACTIVE',
        employeeStatus: 'Active in Service',
        employeeStatusMarathi: 'सेवेत कार्यरत',
        description: 'Employee is currently active in service',
        markedForDeletion: false,
        markedForDeletionDate: null,
        id: 1,
        isActive: true,
        createdDate: '2026-10-11T11:53:02.727',
        updatedDate: null,
      };

      const result = normalizeEmpStatusMaster(raw);
      expect(result.id).toBe(1);
      expect(result.employeeStatusId).toBe('1');
      expect(result.employeeStatusCode).toBe('ACTIVE');
      expect(result.employeeStatus).toBe('Active in Service');
      expect(result.employeeStatusMarathi).toBe('सेवेत कार्यरत');
      expect(result.description).toBe('Employee is currently active in service');
      expect(result.isActive).toBe(true);
      expect(result.markedForDeletion).toBe(false);
    });

    it('falls back safely when optional attributes are missing', () => {
      const result = normalizeEmpStatusMaster({});
      expect(result.employeeStatusId).toMatch(/^STAT-\d+/);
      expect(result.employeeStatusCode).toBe('');
      expect(result.employeeStatus).toBe('');
      expect(result.isActive).toBe(true);
      expect(result.markedForDeletion).toBe(false);
    });
    it('normalizes soft-deleted and inactive records with varied backend keys (isactive: 0, markfordeletion: 1)', () => {
      const raw = {
        id: 5,
        employeeStatusCode: 'RETIRED',
        employeeStatus: 'Retired',
        isactive: 0,
        markfordeletion: 1,
      };

      const result = normalizeEmpStatusMaster(raw);
      expect(result.id).toBe(5);
      expect(result.isActive).toBe(false);
      expect(result.markedForDeletion).toBe(true);
    });
  });

  describe('getEmpStatusMasterPaged', () => {
    it('calls apiClient.get with correct endpoint and query parameters', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        data: {
          items: [{ ...validPayload, id: 1, employeeStatusId: '1' }],
          totalCount: 1,
          pageNumber: 1,
          pageSize: 10,
          totalPages: 1,
        },
      });

      const res = await getEmpStatusMasterPaged(1, 10, 'ACTIVE', undefined, undefined, true);

      expect(apiClient.get).toHaveBeenCalledWith(
        '/payroll/employee-status-master?PageNumber=1&PageSize=10&MarkedForDeletion=false&SearchTerm=ACTIVE&IsActive=true'
      );
      expect(res.items).toHaveLength(1);
      expect(res.totalCount).toBe(1);
    });

    it('filters out records marked for deletion even if returned by backend', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        data: {
          items: [
            { ...validPayload, id: 1, employeeStatusId: '1', isActive: false, markfordeletion: 1 },
            { ...validPayload, id: 2, employeeStatusId: '2', isActive: false, markfordeletion: 0 },
          ],
          totalCount: 2,
          pageNumber: 1,
          pageSize: 10,
          totalPages: 1,
        },
      });

      const res = await getEmpStatusMasterPaged(1, 10, undefined, undefined, undefined, false);

      expect(apiClient.get).toHaveBeenCalledWith(
        '/payroll/employee-status-master?PageNumber=1&PageSize=10&MarkedForDeletion=false&IsActive=false'
      );
      expect(res.items).toHaveLength(1);
      expect(res.items[0].employeeStatusId).toBe('2');
    });

    it('throws ApiError when response is not successful', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: false,
        statusCode: 500,
        error: 'Failed to retrieve records',
      });

      await expect(getEmpStatusMasterPaged(1, 10)).rejects.toThrow();
    });
  });

  describe('createEmpStatusMaster', () => {
    it('calls apiClient.post with correct endpoint, body, and createdBy metadata', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        success: true,
        data: { ...validPayload, id: 9, employeeStatusId: '9' },
      });

      const res = await createEmpStatusMaster(validPayload, 42);

      expect(apiClient.post).toHaveBeenCalledWith('/payroll/employee-status-master', {
        ...validPayload,
        createdBy: 42,
      });
      expect(res.employeeStatusId).toBe('9');
    });

    it('throws ApiError when creation fails', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        success: false,
        statusCode: 400,
        error: 'Duplicate status code',
      });

      await expect(createEmpStatusMaster(validPayload)).rejects.toThrow();
    });
  });

  describe('updateEmpStatusMaster', () => {
    it('calls apiClient.put with target ID and updatedBy metadata', async () => {
      vi.mocked(apiClient.put).mockResolvedValueOnce({
        success: true,
        data: { ...validPayload, id: 1, employeeStatusId: '1', employeeStatus: 'Updated Active' },
      });

      const res = await updateEmpStatusMaster('1', { employeeStatus: 'Updated Active' }, 42);

      expect(apiClient.put).toHaveBeenCalledWith('/payroll/employee-status-master/1', {
        employeeStatus: 'Updated Active',
        updatedBy: 42,
      });
      expect(res.employeeStatus).toBe('Updated Active');
    });

    it('throws ApiError when update call fails', async () => {
      vi.mocked(apiClient.put).mockResolvedValueOnce({
        success: false,
        statusCode: 404,
        error: 'Not found',
      });

      await expect(updateEmpStatusMaster('999', validPayload)).rejects.toThrow();
    });
  });

  describe('deleteEmpStatusMaster', () => {
    it('calls apiClient.delete with encoded ID', async () => {
      vi.mocked(apiClient.delete).mockResolvedValueOnce({
        success: true,
      });

      await deleteEmpStatusMaster('1');
      expect(apiClient.delete).toHaveBeenCalledWith('/payroll/employee-status-master/1');
    });

    it('throws ApiError when delete call fails on backend', async () => {
      vi.mocked(apiClient.delete).mockResolvedValueOnce({
        success: false,
        statusCode: 409,
        error: 'Cannot delete: record in use',
      });

      await expect(deleteEmpStatusMaster('1')).rejects.toThrow();
    });
  });
});
