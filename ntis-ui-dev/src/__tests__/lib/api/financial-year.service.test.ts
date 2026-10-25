import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getFinancialYearsPaged,
  getFinancialYearById,
  createFinancialYear,
  updateFinancialYear,
  deleteFinancialYear,
  ApiError,
} from '@/lib/api/financial-year.service';
import { apiClient } from '@/services/api.service';

vi.mock('@/services/api.service', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('financial-year.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getFinancialYearsPaged', () => {
    it('always sorts the active financial year as the 1st record, followed by descending years', async () => {
      // Mock unsorted backend response (active record is in the middle/end)
      const mockRawItems = [
        { id: 1, year: 2023, yearCode: '2023-24', isActive: false, status: 'Active' },
        { id: 2, year: 2024, yearCode: '2024-25', isActive: false, status: 'Active' },
        { id: 3, year: 2026, yearCode: '2026-27', isActive: true, status: 'Active' }, // active year
        { id: 4, year: 2025, yearCode: '2025-26', isActive: false, status: 'Active' },
        { id: 5, year: 1990, yearCode: '1990-91', isActive: false, status: 'Active' },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        data: {
          items: mockRawItems,
          totalCount: 5,
          pageNumber: 1,
          pageSize: 2000,
          totalPages: 1,
          hasPrevious: false,
          hasNext: false,
        },
      });

      const result = await getFinancialYearsPaged(1, 10);

      // 1st record MUST be the active year (2026-27)
      expect(result.items[0].yearCode).toBe('2026-27');
      expect(result.items[0].isActive).toBe(true);

      // Subsequent records should be sorted descending by year
      expect(result.items[1].yearCode).toBe('2025-26');
      expect(result.items[2].yearCode).toBe('2024-25');
      expect(result.items[3].yearCode).toBe('2023-24');
      expect(result.items[4].yearCode).toBe('1990-91');
      expect(result.totalCount).toBe(5);
    });

    it('correctly handles pagination slicing with active year remaining 1st on page 1', async () => {
      const mockRawItems = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        year: 2000 + i,
        yearCode: `${2000 + i}-${(2001 + i).toString().slice(-2)}`,
        isActive: i === 10, // year 2010 is active
        status: 'Active',
      }));

      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: { items: mockRawItems, totalCount: 25 },
      });

      // Page 1
      const page1 = await getFinancialYearsPaged(1, 10);
      expect(page1.items).toHaveLength(10);
      expect(page1.items[0].year).toBe(2010); // active year is 1st
      expect(page1.items[0].isActive).toBe(true);
      expect(page1.totalPages).toBe(3);
      expect(page1.hasNext).toBe(true);
      expect(page1.hasPrevious).toBe(false);

      // Page 2
      const page2 = await getFinancialYearsPaged(2, 10);
      expect(page2.items).toHaveLength(10);
      expect(page2.hasPrevious).toBe(true);
      expect(page2.hasNext).toBe(true);
    });

    it('filters by search term', async () => {
      const mockRawItems = [
        { id: 1, year: 2023, yearCode: '2023-24', isActive: false, description: 'FY 23' },
        { id: 2, year: 2024, yearCode: '2024-25', isActive: true, description: 'FY 24 special' },
        { id: 3, year: 2025, yearCode: '2025-26', isActive: false, description: 'FY 25' },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        data: { items: mockRawItems, totalCount: 3 },
      });

      const result = await getFinancialYearsPaged(1, 10, 'special');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].yearCode).toBe('2024-25');
    });

    it('throws ApiError on failed API response', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: false,
        statusCode: 500,
        error: 'Database connection error',
      });

      await expect(getFinancialYearsPaged(1, 10)).rejects.toThrow(ApiError);
    });
  });

  describe('getFinancialYearById', () => {
    it('returns normalized financial year', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        data: { Id: 42, Year: 2026, YearCode: '2026-27', IsActive: true, Status: 'Active' },
      });

      const result = await getFinancialYearById(42);
      expect(result.id).toBe(42);
      expect(result.year).toBe(2026);
      expect(result.isActive).toBe(true);
    });
  });

  describe('createFinancialYear & updateFinancialYear', () => {
    it('formats date to ISO string with T00:00:00', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({ success: true, data: undefined });
      vi.mocked(apiClient.put).mockResolvedValueOnce({ success: true, data: undefined });

      await createFinancialYear({
        year: 2026,
        yearCode: '2026-27',
        startDate: '2026-04-01',
        endDate: '2027-03-31',
        description: 'Test',
        isActive: true,
        status: 'Active',
      });

      expect(apiClient.post).toHaveBeenCalledWith('/YearMaster', {
        Year: 2026,
        YearCode: '2026-27',
        StartDate: '2026-04-01T00:00:00',
        EndDate: '2027-03-31T00:00:00',
        Description: 'Test',
        YearDescription: 'Test',
        IsActive: true,
        Status: 'Active',
        CreatedBy: null,
      });

      await updateFinancialYear(10, {
        year: 2026,
        yearCode: '2026-27',
        startDate: '2026-04-01T00:00:00',
        endDate: '2027-03-31T00:00:00',
        description: 'Test',
        isActive: false,
        status: 'Active',
      });

      expect(apiClient.put).toHaveBeenCalledWith('/YearMaster/10', {
        Id: 10,
        Year: 2026,
        YearCode: '2026-27',
        StartDate: '2026-04-01T00:00:00',
        EndDate: '2027-03-31T00:00:00',
        Description: 'Test',
        YearDescription: 'Test',
        IsActive: false,
        Status: 'Active',
        UpdatedBy: null,
      });
    });

    it('deletes financial year', async () => {
      vi.mocked(apiClient.delete).mockResolvedValueOnce({ success: true, data: undefined });
      await deleteFinancialYear(5);
      expect(apiClient.delete).toHaveBeenCalledWith('/YearMaster/5');
    });

    it('handles service errors and filters correctly', async () => {
      // getFinancialYearById error
      vi.mocked(apiClient.get).mockResolvedValueOnce({ success: false, error: 'Not found' });
      await expect(getFinancialYearById(99)).rejects.toThrow(ApiError);

      // createFinancialYear error
      vi.mocked(apiClient.post).mockResolvedValueOnce({ success: false, error: 'Failed' });
      await expect(createFinancialYear({ year: 2026, yearCode: '2026-27', startDate: '', endDate: '', description: null, isActive: false, status: 'Active' })).rejects.toThrow(ApiError);

      // updateFinancialYear error
      vi.mocked(apiClient.put).mockResolvedValueOnce({ success: false, error: 'Failed' });
      await expect(updateFinancialYear(10, { year: 2026, yearCode: '2026-27', startDate: '', endDate: '', description: null, isActive: false, status: 'Active' })).rejects.toThrow(ApiError);

      // deleteFinancialYear error
      vi.mocked(apiClient.delete).mockResolvedValueOnce({ success: false, error: 'Failed' });
      await expect(deleteFinancialYear(10)).rejects.toThrow(ApiError);

      // getFinancialYearsPaged status filter
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        data: {
          items: [
            { id: 1, year: 2023, yearCode: '2023-24', status: 'Closed' },
            { id: 2, year: 2024, yearCode: '2024-25', status: 'Active' },
          ],
          totalCount: 2,
        },
      });
      const pagedFiltered = await getFinancialYearsPaged(1, 10, undefined, 'Closed');
      expect(pagedFiltered.items).toHaveLength(1);
      expect(pagedFiltered.items[0].status).toBe('Closed');
    });
  });
});
