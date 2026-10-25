import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  normalizeQualificationMaster,
  getQualificationMaster,
  getQualificationMasterPaged,
  createQualificationMaster,
  updateQualificationMaster,
  deleteQualificationMaster,
} from '@/lib/api/payroll/QualificationMaster/qualificationMaster.service';
import { apiClient } from '@/services/api.service';
import { ApiError } from '@/lib/utils/api';

vi.mock('@/services/api.service', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Qualification Master API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('normalizeQualificationMaster', () => {
    it('correctly maps raw backend item to QualificationMasterItem', () => {
      const raw = {
        id: 101,
        qualificationCode: 'bcom ',
        qualificationName: '  Bachelor of Commerce ',
        qualificationNameRegional: ' वाणिज्य पदवी ',
        description: ' Degree course ',
        isActive: true,
        markedForDeletion: false,
        createdDate: '2026-01-01T00:00:00Z',
      };

      const normalized = normalizeQualificationMaster(raw);

      expect(normalized.id).toBe(101);
      expect(normalized.qualificationId).toBe('101');
      expect(normalized.qualificationCode).toBe('BCOM');
      expect(normalized.qualificationName).toBe('Bachelor of Commerce');
      expect(normalized.qualificationNameRegional).toBe('वाणिज्य पदवी');
      expect(normalized.description).toBe('Degree course');
      expect(normalized.isActive).toBe(true);
      expect(normalized.markedForDeletion).toBe(false);
    });

    it('handles fallback defaults for empty object', () => {
      const normalized = normalizeQualificationMaster({});
      expect(normalized.qualificationCode).toBe('');
      expect(normalized.qualificationName).toBe('');
      expect(normalized.qualificationNameRegional).toBe('');
      expect(normalized.isActive).toBe(true);
      expect(normalized.markedForDeletion).toBe(false);
    });
  });

  describe('getQualificationMaster', () => {
    it('fetches and normalizes qualification records', async () => {
      (apiClient.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: {
          items: [
            { id: 1, qualificationCode: 'BCOM', qualificationName: 'B.Com', qualificationNameRegional: 'बी.कॉम' },
            { id: 2, qualificationCode: 'BE', qualificationName: 'B.E.', qualificationNameRegional: 'बी.ई', markedForDeletion: true },
          ],
        },
      });

      const result = await getQualificationMaster();

      expect(apiClient.get).toHaveBeenCalledWith('/payroll/qualification-master');
      expect(result).toHaveLength(1);
      expect(result[0].qualificationCode).toBe('BCOM');
    });

    it('throws ApiError on failed response', async () => {
      (apiClient.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        statusCode: 500,
        error: 'Database connection failed',
      });

      await expect(getQualificationMaster()).rejects.toThrow(ApiError);
    });
  });

  describe('getQualificationMasterPaged', () => {
    it('constructs correct query parameters and returns paginated response', async () => {
      (apiClient.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: {
          items: [
            { id: 1, qualificationCode: 'BCOM', qualificationName: 'B.Com', qualificationNameRegional: 'बी.कॉम', isActive: true },
          ],
          totalCount: 1,
          pageNumber: 1,
          pageSize: 10,
          totalPages: 1,
          hasPrevious: false,
          hasNext: false,
        },
      });

      const result = await getQualificationMasterPaged(1, 10, 'commerce', 'qualificationName', 'asc', true);

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('PageNumber=1&PageSize=10&SearchTerm=commerce&SortBy=qualificationName&SortOrder=asc&IsActive=true')
      );
      expect(result.items).toHaveLength(1);
      expect(result.totalCount).toBe(1);
    });
  });

  describe('createQualificationMaster', () => {
    it('sends POST request with uppercase code and trimmed values', async () => {
      (apiClient.post as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: {
          id: 10,
          qualificationCode: 'MSC',
          qualificationName: 'Master of Science',
          qualificationNameRegional: 'विज्ञान पदव्युत्तर',
          isActive: true,
        },
      });

      const result = await createQualificationMaster({
        qualificationCode: 'msc',
        qualificationName: ' Master of Science ',
        qualificationNameRegional: ' विज्ञान पदव्युत्तर ',
        isActive: true,
      });

      expect(apiClient.post).toHaveBeenCalledWith('/payroll/qualification-master', {
        qualificationCode: 'MSC',
        qualificationName: 'Master of Science',
        qualificationNameRegional: 'विज्ञान पदव्युत्तर',
        isActive: true,
      });
      expect(result.qualificationCode).toBe('MSC');
    });

    it('throws ApiError if create fails', async () => {
      (apiClient.post as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        statusCode: 400,
        error: 'Qualification code already exists',
      });

      await expect(
        createQualificationMaster({
          qualificationCode: 'BCOM',
          qualificationName: 'B.Com',
          qualificationNameRegional: 'बी.कॉम',
          isActive: true,
        })
      ).rejects.toThrow(ApiError);
    });
  });

  describe('updateQualificationMaster', () => {
    it('sends PUT request with updated fields', async () => {
      (apiClient.put as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: {
          id: 10,
          qualificationCode: 'MSC',
          qualificationName: 'Master of Science Updated',
          qualificationNameRegional: 'विज्ञान पदव्युत्तर',
          isActive: true,
        },
      });

      const result = await updateQualificationMaster(10, {
        qualificationName: ' Master of Science Updated ',
      });

      expect(apiClient.put).toHaveBeenCalledWith('/payroll/qualification-master/10', {
        qualificationName: 'Master of Science Updated',
      });
      expect(result.qualificationName).toBe('Master of Science Updated');
    });
  });

  describe('deleteQualificationMaster', () => {
    it('sends DELETE request for specified id', async () => {
      (apiClient.delete as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
      });

      await deleteQualificationMaster('10');

      expect(apiClient.delete).toHaveBeenCalledWith('/payroll/qualification-master/10');
    });

    it('throws ApiError when delete fails', async () => {
      (apiClient.delete as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        statusCode: 409,
        error: 'Record is in use',
      });

      await expect(deleteQualificationMaster('10')).rejects.toThrow(ApiError);
    });
  });
});
