import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  normalizeZoneDivisionMaster,
  getZoneDivisionMaster,
  getZoneDivisionMasterPaged,
  createZoneDivisionMaster,
  updateZoneDivisionMaster,
  deleteZoneDivisionMaster,
} from '@/lib/api/payroll/ZoneDivisionMaster/zoneDivisionMaster.service';
import { apiClient } from '@/services/api.service';
import type { ZoneDivisionMasterPayload } from '@/types/payroll/MasterModule';

vi.mock('@/services/api.service', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock('@/lib/utils/server-logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe('zoneDivisionMaster.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validPayload: ZoneDivisionMasterPayload = {
    zoneDivisionCode: 'DIV-EAST',
    zoneDivisionName: 'East Division Administrative Office',
    zoneDivisionNameRegional: 'पूर्व विभाग प्रशासकीय कार्यालय',
    address: 'Near Shivaji Statue, Old Agra Road',
    isActive: true,
  };

  describe('normalizeZoneDivisionMaster', () => {
    it('normalizes raw API items from backend JSON and applies proper types', () => {
      const raw = {
        zoneDivisionCode: 'DIV-EAST',
        zoneDivisionName: 'East Division Administrative Office',
        zoneDivisionNameRegional: 'पूर्व विभाग प्रशासकीय कार्यालय',
        officeType: 'DIVISION_OFFICE',
        address: 'Near Shivaji Statue, Old Agra Road',
        markedForDeletion: false,
        markedForDeletionDate: null,
        id: 1,
        isActive: true,
        createdDate: '2026-10-11T11:53:02.727',
        updatedDate: null,
      };

      const result = normalizeZoneDivisionMaster(raw);
      expect(result.id).toBe(1);
      expect(result.zoneDivisionId).toBe('1');
      expect(result.zoneDivisionCode).toBe('DIV-EAST');
      expect(result.zoneDivisionName).toBe('East Division Administrative Office');
      expect(result.zoneDivisionNameRegional).toBe('पूर्व विभाग प्रशासकीय कार्यालय');
      expect(result.address).toBe('Near Shivaji Statue, Old Agra Road');
      expect(result.isActive).toBe(true);
      expect(result.markedForDeletion).toBe(false);
    });

    it('handles PascalCase attributes from backend DTO', () => {
      const raw = {
        ZoneDivisionCode: 'HQ-1',
        ZoneDivisionName: 'Municipal Headquarters',
        ZoneDivisionNameRegional: 'महानगरपालिका मुख्यालय',
        Address: 'Main Municipal Building',
        Id: 2,
        IsActive: true,
      };

      const result = normalizeZoneDivisionMaster(raw);
      expect(result.id).toBe(2);
      expect(result.zoneDivisionId).toBe('2');
      expect(result.zoneDivisionCode).toBe('HQ-1');
      expect(result.zoneDivisionName).toBe('Municipal Headquarters');
      expect(result.zoneDivisionNameRegional).toBe('महानगरपालिका मुख्यालय');
      expect(result.address).toBe('Main Municipal Building');
      expect(result.isActive).toBe(true);
    });

    it('falls back safely when optional attributes are missing', () => {
      const result = normalizeZoneDivisionMaster({});
      expect(result.zoneDivisionId).toBe('');
      expect(result.zoneDivisionCode).toBe('');
      expect(result.zoneDivisionName).toBe('');
      expect(result.address).toBe('');
      expect(result.isActive).toBe(true);
      expect(result.markedForDeletion).toBe(false);
    });

    it('normalizes soft-deleted and inactive records with varied backend keys', () => {
      const raw = {
        id: 5,
        zoneDivisionCode: 'WARD-05',
        zoneDivisionName: 'Ward 5 Office',
        isactive: 0,
        markfordeletion: 1,
      };

      const result = normalizeZoneDivisionMaster(raw);
      expect(result.id).toBe(5);
      expect(result.isActive).toBe(false);
      expect(result.markedForDeletion).toBe(true);
    });
  });

  describe('getZoneDivisionMasterPaged', () => {
    it('calls apiClient.get with correct endpoint and query parameters', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        data: {
          items: [{ ...validPayload, id: 1, zoneDivisionId: '1' }],
          totalCount: 1,
          pageNumber: 1,
          pageSize: 10,
          totalPages: 1,
        },
      });

      const res = await getZoneDivisionMasterPaged(
        1,
        10,
        'EAST',
        undefined,
        undefined,
        true
      );

      expect(apiClient.get).toHaveBeenCalledWith(
        '/payroll/zone-division-master?PageNumber=1&PageSize=10&MarkedForDeletion=false&SearchTerm=EAST&IsActive=true'
      );
      expect(res.items).toHaveLength(1);
      expect(res.totalCount).toBe(1);
    });

    it('filters out records marked for deletion even if returned by backend', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        data: {
          items: [
            { ...validPayload, id: 1, zoneDivisionId: '1', isActive: false, markfordeletion: 1 },
            { ...validPayload, id: 2, zoneDivisionId: '2', isActive: false, markfordeletion: 0 },
          ],
          totalCount: 2,
          pageNumber: 1,
          pageSize: 10,
          totalPages: 1,
        },
      });

      const res = await getZoneDivisionMasterPaged(1, 10, undefined, undefined, undefined, false);

      expect(apiClient.get).toHaveBeenCalledWith(
        '/payroll/zone-division-master?PageNumber=1&PageSize=10&MarkedForDeletion=false&IsActive=false'
      );
      expect(res.items).toHaveLength(1);
      expect(res.items[0].zoneDivisionId).toBe('2');
    });

    it('throws ApiError when response is not successful', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: false,
        statusCode: 500,
        error: 'Failed to retrieve records',
      });

      await expect(getZoneDivisionMasterPaged(1, 10)).rejects.toThrow();
    });
  });

  describe('getZoneDivisionMaster', () => {
    it('calls apiClient.get with MarkedForDeletion=false and returns items', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        data: {
          items: [{ ...validPayload, id: 1, zoneDivisionId: '1' }],
          totalCount: 1,
        },
      });

      const res = await getZoneDivisionMaster();
      expect(apiClient.get).toHaveBeenCalledWith(
        '/payroll/zone-division-master?MarkedForDeletion=false'
      );
      expect(res).toHaveLength(1);
      expect(res[0].zoneDivisionId).toBe('1');
    });

    it('throws ApiError on 400 Bad Request', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: false,
        statusCode: 400,
        error: 'Bad Request',
      });

      await expect(getZoneDivisionMaster()).rejects.toThrow('Bad Request');
    });

    it('throws ApiError on 401 Unauthorized', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: false,
        statusCode: 401,
        error: 'Unauthorized',
      });

      await expect(getZoneDivisionMaster()).rejects.toThrow('Unauthorized');
    });

    it('throws ApiError on 403 Forbidden', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: false,
        statusCode: 403,
        error: 'Forbidden',
      });

      await expect(getZoneDivisionMaster()).rejects.toThrow('Forbidden');
    });

    it('throws ApiError on 404 Not Found', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: false,
        statusCode: 404,
        error: 'Not Found',
      });

      await expect(getZoneDivisionMaster()).rejects.toThrow('Not Found');
    });

    it('throws ApiError on 409 Conflict', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: false,
        statusCode: 409,
        error: 'Conflict: Record already exists',
      });

      await expect(getZoneDivisionMaster()).rejects.toThrow('Conflict: Record already exists');
    });

    it('throws ApiError on 500 Server Error', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: false,
        statusCode: 500,
        error: 'Internal Server Error',
      });

      await expect(getZoneDivisionMaster()).rejects.toThrow('Internal Server Error');
    });

    it('throws when network error occurs', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Network connection refused'));

      await expect(getZoneDivisionMaster()).rejects.toThrow('Network connection refused');
    });

    it('throws ApiError when response contains malformed or null data', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        data: null,
      });

      await expect(getZoneDivisionMaster()).rejects.toThrow();
    });
  });

  describe('createZoneDivisionMaster', () => {
    it('calls apiClient.post with correct endpoint and body', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        success: true,
        data: { ...validPayload, id: 9, zoneDivisionId: '9' },
      });

      const res = await createZoneDivisionMaster(validPayload);

      expect(apiClient.post).toHaveBeenCalledWith('/payroll/zone-division-master', {
        zoneDivisionCode: 'DIV-EAST',
        zoneDivisionName: 'East Division Administrative Office',
        zoneDivisionNameRegional: 'पूर्व विभाग प्रशासकीय कार्यालय',
        address: 'Near Shivaji Statue, Old Agra Road',
        isActive: true,
      });
      expect(res.zoneDivisionId).toBe('9');
    });

    it('throws ApiError when creation fails', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        success: false,
        statusCode: 400,
        error: 'Duplicate code',
      });

      await expect(createZoneDivisionMaster(validPayload)).rejects.toThrow();
    });
  });

  describe('updateZoneDivisionMaster', () => {
    it('calls apiClient.put with target ID and updated fields', async () => {
      vi.mocked(apiClient.put).mockResolvedValueOnce({
        success: true,
        data: {
          ...validPayload,
          id: 1,
          zoneDivisionId: '1',
          zoneDivisionName: 'Updated East Office',
        },
      });

      const res = await updateZoneDivisionMaster('1', { zoneDivisionName: 'Updated East Office' });

      expect(apiClient.put).toHaveBeenCalledWith('/payroll/zone-division-master/1', {
        zoneDivisionName: 'Updated East Office',
      });
      expect(res.zoneDivisionName).toBe('Updated East Office');
    });

    it('throws ApiError when update call fails', async () => {
      vi.mocked(apiClient.put).mockResolvedValueOnce({
        success: false,
        statusCode: 404,
        error: 'Not found',
      });

      await expect(updateZoneDivisionMaster('999', validPayload)).rejects.toThrow();
    });
  });

  describe('deleteZoneDivisionMaster', () => {
    it('calls apiClient.delete with encoded ID', async () => {
      vi.mocked(apiClient.delete).mockResolvedValueOnce({ success: true });

      await deleteZoneDivisionMaster('1');
      expect(apiClient.delete).toHaveBeenCalledWith('/payroll/zone-division-master/1');
    });

    it('throws ApiError when delete call fails on backend', async () => {
      vi.mocked(apiClient.delete).mockResolvedValueOnce({
        success: false,
        statusCode: 409,
        error: 'Cannot delete: record in use',
      });

      await expect(deleteZoneDivisionMaster('1')).rejects.toThrow();
    });
  });
});
