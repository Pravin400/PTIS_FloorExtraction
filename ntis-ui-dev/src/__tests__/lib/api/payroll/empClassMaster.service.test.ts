import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  normalizeEmpClassMaster,
  getEmpClassMaster,
  getEmpClassMasterPaged,
  createEmpClassMaster,
  updateEmpClassMaster,
  deleteEmpClassMaster,
} from '@/lib/api/payroll/EmpClassMaster/empClassMaster.service';
import { apiClient } from '@/services/api.service';
import type { EmpClassMasterPayload } from '@/types/payroll/MasterModule';

vi.mock('@/services/api.service', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock('@/lib/utils/server-logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe('empClassMaster.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validPayload: EmpClassMasterPayload = {
    classCode: 'CLASS-I',
    className: 'Class I (Group A)',
    classNameMarathi: 'वर्ग १ (गट अ)',
    description: 'Senior municipal executives and heads',
    isActive: true,
  };

  describe('normalizeEmpClassMaster', () => {
    it('normalizes raw API items from backend JSON and applies proper types', () => {
      const raw = {
        classCode: 'CLASS-I',
        className: 'Class I (Group A)',
        classNameMarathi: 'वर्ग १ (गट अ)',
        description: 'Senior municipal executives and heads',
        markedForDeletion: false,
        markedForDeletionDate: null,
        id: 1,
        isActive: true,
        createdDate: '2026-10-11T11:53:02.727',
        updatedDate: null,
      };

      const result = normalizeEmpClassMaster(raw);
      expect(result.id).toBe(1);
      expect(result.employeeClassId).toBe('1');
      expect(result.classCode).toBe('CLASS-I');
      expect(result.className).toBe('Class I (Group A)');
      expect(result.classNameMarathi).toBe('वर्ग १ (गट अ)');
      expect(result.description).toBe('Senior municipal executives and heads');
      expect(result.isActive).toBe(true);
      expect(result.markedForDeletion).toBe(false);
    });

    it('handles PascalCase attributes from backend DTO', () => {
      const raw = {
        ClassCode: 'CLASS-II',
        ClassName: 'Class II (Group B)',
        ClassNameMarathi: 'वर्ग २ (गट ब)',
        Description: 'Mid-level officers',
        Id: 2,
        IsActive: true,
      };

      const result = normalizeEmpClassMaster(raw);
      expect(result.id).toBe(2);
      expect(result.employeeClassId).toBe('2');
      expect(result.classCode).toBe('CLASS-II');
      expect(result.className).toBe('Class II (Group B)');
      expect(result.classNameMarathi).toBe('वर्ग २ (गट ब)');
      expect(result.description).toBe('Mid-level officers');
      expect(result.isActive).toBe(true);
    });

    it('falls back safely when optional attributes are missing', () => {
      const result = normalizeEmpClassMaster({});
      expect(result.employeeClassId).toBe('');
      expect(result.classCode).toBe('');
      expect(result.className).toBe('');
      expect(result.isActive).toBe(true);
      expect(result.markedForDeletion).toBe(false);
    });
  });

  describe('getEmpClassMaster', () => {
    it('returns filtered and normalized items on success', () => {
      const mockItems = [
        { id: 1, classCode: 'CLASS-A', className: 'Class A', isActive: true },
        { id: 2, classCode: 'CLASS-B', className: 'Class B', isActive: false },
      ];
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        data: { items: mockItems, totalCount: 2 },
      } as never);

      return expect(getEmpClassMaster()).resolves.toHaveLength(2);
    });

    it('throws ApiError on 400 Bad Request', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: false,
        statusCode: 400,
        error: 'Bad Request',
      } as never);

      await expect(getEmpClassMaster()).rejects.toThrow('Bad Request');
    });

    it('throws ApiError on 401 Unauthorized', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: false,
        statusCode: 401,
        error: 'Unauthorized',
      } as never);

      await expect(getEmpClassMaster()).rejects.toThrow('Unauthorized');
    });

    it('throws ApiError on 403 Forbidden', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: false,
        statusCode: 403,
        error: 'Forbidden',
      } as never);

      await expect(getEmpClassMaster()).rejects.toThrow('Forbidden');
    });

    it('throws ApiError on 404 Not Found', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: false,
        statusCode: 404,
        error: 'Not Found',
      } as never);

      await expect(getEmpClassMaster()).rejects.toThrow('Not Found');
    });

    it('throws ApiError on 409 Conflict', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: false,
        statusCode: 409,
        error: 'Conflict: Record already exists',
      } as never);

      await expect(getEmpClassMaster()).rejects.toThrow('Conflict: Record already exists');
    });

    it('throws ApiError on 500 Server Error', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: false,
        statusCode: 500,
        error: 'Internal Server Error',
      } as never);

      await expect(getEmpClassMaster()).rejects.toThrow('Internal Server Error');
    });

    it('throws when network error occurs', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Network connection refused'));

      await expect(getEmpClassMaster()).rejects.toThrow('Network connection refused');
    });

    it('throws ApiError when response contains malformed or null data', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        data: null,
      } as never);

      await expect(getEmpClassMaster()).rejects.toThrow();
    });
  });

  describe('getEmpClassMasterPaged', () => {
    it('builds query parameters correctly and returns paginated response', async () => {
      const mockResponse = {
        items: [{ id: 1, classCode: 'CLASS-1', className: 'Class 1', isActive: true }],
        totalCount: 1,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
      };
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        data: mockResponse,
      } as never);

      const result = await getEmpClassMasterPaged(1, 10, 'search', 'classCode', 'asc', true);
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('PageNumber=1&PageSize=10&MarkedForDeletion=false')
      );
      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('SearchTerm=search'));
      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('IsActive=true'));
      expect(result.items).toHaveLength(1);
    });
  });

  describe('createEmpClassMaster', () => {
    it('posts sanitized payload and returns normalized result', async () => {
      const mockCreated = { id: 10, ...validPayload };
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        success: true,
        data: mockCreated,
      } as never);

      const result = await createEmpClassMaster(validPayload);
      expect(apiClient.post).toHaveBeenCalledWith(
        '/payroll/employee-class-master',
        expect.objectContaining({
          classCode: 'CLASS-I',
          className: 'Class I (Group A)',
        })
      );
      expect(result.classCode).toBe('CLASS-I');
    });
  });

  describe('updateEmpClassMaster', () => {
    it('sends PUT request with URI encoded id', async () => {
      vi.mocked(apiClient.put).mockResolvedValueOnce({
        success: true,
        data: { id: 1, ...validPayload, className: 'Updated' },
      } as never);

      const result = await updateEmpClassMaster('1', { className: 'Updated' });
      expect(apiClient.put).toHaveBeenCalledWith(
        '/payroll/employee-class-master/1',
        expect.objectContaining({ className: 'Updated' })
      );
      expect(result.className).toBe('Updated');
    });
  });

  describe('deleteEmpClassMaster', () => {
    it('sends DELETE request with encoded ID', async () => {
      vi.mocked(apiClient.delete).mockResolvedValueOnce({
        success: true,
      } as never);

      await expect(deleteEmpClassMaster('CLASS-1')).resolves.toBeUndefined();
      expect(apiClient.delete).toHaveBeenCalledWith('/payroll/employee-class-master/CLASS-1');
    });
  });
});
