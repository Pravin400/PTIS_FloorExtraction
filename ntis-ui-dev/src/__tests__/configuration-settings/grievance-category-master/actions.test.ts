import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createGrievanceCategoryAction } from '@/app/[locale]/configuration-settings/grievance-category-master/actions/create';
import { updateGrievanceCategoryAction } from '@/app/[locale]/configuration-settings/grievance-category-master/actions/update';
import { deleteGrievanceCategoryAction } from '@/app/[locale]/configuration-settings/grievance-category-master/actions/delete';
import { getGrievanceCategoryMasterData } from '@/app/[locale]/configuration-settings/grievance-category-master/data-fetcher';

import {
  createGrievanceCategory,
  updateGrievanceCategory,
  deleteGrievanceCategory,
  getGrievanceCategories,
} from '@/lib/api/configuration-settings/grievance-category-master/grievanceCategory.service';
import { departmentMasterService } from '@/lib/api/departmentMaster.service';
import { revalidatePath } from 'next/cache';
import type { ApiResponse } from '@/types/common.types';
import type { GrievanceCategory } from '@/types/grievance-category-master/grievanceCategory.types';
import type { DepartmentMaster } from '@/types/departmentMaster.types';

const cookiesMock = {
  get: vi.fn(),
  getAll: vi.fn().mockReturnValue([]),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  unstable_noStore: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockImplementation(() => cookiesMock),
}));

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockImplementation(() => {
    const t = (key: string) => key;
    return Promise.resolve(t);
  }),
}));

vi.mock('@/lib/api/configuration-settings/grievance-category-master/grievanceCategory.service', () => ({
  createGrievanceCategory: vi.fn(),
  updateGrievanceCategory: vi.fn(),
  deleteGrievanceCategory: vi.fn(),
  getGrievanceCategories: vi.fn(),
}));

vi.mock('@/lib/api/departmentMaster.service', () => ({
  departmentMasterService: {
    getDepartmentMasters: vi.fn(),
  },
}));

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('Grievance Category Master Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookiesMock.get.mockReset();
    // Default mock behavior for authorization
    cookiesMock.get.mockReturnValue({ value: '123' });
  });

  describe('Authorization checks', () => {
    it('returns unauthorized when getCurrentUserId returns undefined', async () => {
      cookiesMock.get.mockReturnValue(undefined);

      const formData = new FormData();
      formData.append('categoryCode', 'CODE123');
      formData.append('categoryName', 'Test Name');

      const createResult = await createGrievanceCategoryAction('en', formData);
      expect(createResult).toEqual({ success: false, error: 'unauthorized' });

      const updateResult = await updateGrievanceCategoryAction('en', formData);
      expect(updateResult).toEqual({ success: false, error: 'unauthorized' });

      const deleteResult = await deleteGrievanceCategoryAction(1, 'en');
      expect(deleteResult).toEqual({ success: false, error: 'unauthorized' });
    });
  });

  describe('Validation checks', () => {
    it('fails when creating with empty required fields', async () => {
      const formData = new FormData();
      formData.append('categoryCode', '');
      formData.append('categoryName', '');

      const result = await createGrievanceCategoryAction('en', formData);
      expect(result.success).toBe(false);
      expect(result.fieldErrors).toBeDefined();
    });

    it('fails when updating with an invalid ID', async () => {
      const formData = new FormData();
      formData.append('id', '-1');
      formData.append('categoryCode', 'CODE1');
      formData.append('categoryName', 'Category 1');

      const result = await updateGrievanceCategoryAction('en', formData);
      expect(result.success).toBe(false);
      expect(result.error).toBe('invalidId');
    });

    it('fails when priority or escalationLevel is invalid enum value', async () => {
      const formData = new FormData();
      formData.append('categoryCode', 'GC001');
      formData.append('categoryName', 'Valid Name');
      formData.append('departmentId', '1');
      formData.append('priority', 'ULTRA_HIGH'); // Invalid priority
      formData.append('resolutionSla', '10');
      formData.append('escalationLevel', 'L4'); // Invalid escalation

      const result = await createGrievanceCategoryAction('en', formData);
      expect(result.success).toBe(false);
      expect(result.fieldErrors).toBeDefined();
    });
  });

  describe('Sanitization & Success flow', () => {
    it('properly sanitizes HTML tags and protocols in fields', async () => {
      const formData = new FormData();
      formData.append('categoryCode', 'GC001');
      formData.append('categoryName', 'Clean Name with JavaScript');
      formData.append('departmentId', '1');
      formData.append('priority', 'High');
      formData.append('resolutionSla', '24');
      formData.append('escalationLevel', 'Level 1');
      formData.append(
        'description',
        '<p>Test Description with <script>alert("xss")</script> code</p>'
      );
      formData.append('isActive', 'true');

      const mockResponse = { success: true, message: 'Created successfully' };
      vi.mocked(createGrievanceCategory).mockResolvedValue(
        mockResponse as unknown as ApiResponse<GrievanceCategory>
      );

      const result = await createGrievanceCategoryAction('en', formData);

      expect(result.success).toBe(true);
      expect(createGrievanceCategory).toHaveBeenCalledWith({
        categoryCode: 'GC001',
        categoryName: 'Clean Name with JavaScript',
        departmentId: 1,
        priority: 'High',
        resolutionSla: '24',
        escalationLevel: 'Level 1',
        description: 'Test Description with alert("xss") code',
        isActive: true,
        createdBy: 123,
        updatedBy: 123,
      });
      expect(revalidatePath).toHaveBeenCalled();
    });
  });

  describe('API and Exception handling', () => {
    it('handles unsuccessful API response gracefully', async () => {
      const formData = new FormData();
      formData.append('categoryCode', 'GC002');
      formData.append('categoryName', 'Another Valid Name');
      formData.append('departmentId', '2');
      formData.append('priority', 'Medium');
      formData.append('resolutionSla', '48');
      formData.append('escalationLevel', 'Level 2');
      formData.append('description', 'Short description');
      formData.append('isActive', 'false');

      const mockResponse = { success: false, error: 'Database error' };
      vi.mocked(createGrievanceCategory).mockResolvedValue(
        mockResponse as unknown as ApiResponse<GrievanceCategory>
      );

      const result = await createGrievanceCategoryAction('en', formData);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to create grievance category');
    });

    it('handles unexpected action failure via try-catch boundary', async () => {
      const formData = new FormData();
      formData.append('id', '10');
      formData.append('categoryCode', 'GC002');
      formData.append('categoryName', 'Another Valid Name');
      formData.append('departmentId', '2');
      formData.append('priority', 'Medium');
      formData.append('resolutionSla', '48');
      formData.append('escalationLevel', 'Level 2');
      formData.append('description', 'Short description');
      formData.append('isActive', 'false');

      vi.mocked(updateGrievanceCategory).mockRejectedValue(new Error('Network loss'));

      const result = await updateGrievanceCategoryAction('en', formData);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unexpected error occurred');
    });
  });

  describe('Delete flow', () => {
    it('handles successful API response for deletion', async () => {
      const mockResponse = { success: true, message: 'Deleted successfully' };
      vi.mocked(deleteGrievanceCategory).mockResolvedValue(
        mockResponse as unknown as ApiResponse<void>
      );

      const result = await deleteGrievanceCategoryAction(1, 'en');
      expect(result.success).toBe(true);
      expect(deleteGrievanceCategory).toHaveBeenCalledWith(1, 123);
      expect(revalidatePath).toHaveBeenCalled();
    });

    it('handles unsuccessful API response for deletion gracefully', async () => {
      const mockResponse = { success: false, error: 'Database lock error' };
      vi.mocked(deleteGrievanceCategory).mockResolvedValue(
        mockResponse as unknown as ApiResponse<void>
      );

      const result = await deleteGrievanceCategoryAction(1, 'en');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Operation failed');
    });

    it('handles unexpected failure via try-catch boundary', async () => {
      vi.mocked(deleteGrievanceCategory).mockRejectedValue(new Error('Network crash'));

      const result = await deleteGrievanceCategoryAction(1, 'en');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unexpected error occurred');
    });
  });
});



describe('Grievance Category Master Data Fetcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns page, size, categories, and accurate stats from getGrievanceCategoryMasterData', async () => {
    const mockCategories = [
      {
        id: 1,
        categoryCode: 'C1',
        categoryName: 'Cat 1',
        priority: 'High',
        isActive: true,
        resolutionSla: '24',
      },
      {
        id: 2,
        categoryCode: 'C2',
        categoryName: 'Cat 2',
        priority: 'Low',
        isActive: false,
        resolutionSla: '48',
      },
    ];
    vi.mocked(getGrievanceCategories).mockResolvedValue({
      categories: mockCategories as unknown as GrievanceCategory[],
      total: 2,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    });

    vi.mocked(departmentMasterService.getDepartmentMasters).mockResolvedValue({
      success: true,
      data: [{ id: 1, departmentName: 'IT' }] as unknown as DepartmentMaster[],
    });

    const data = await getGrievanceCategoryMasterData({ pageSize: '10', page: '1' });

    expect(data.pageSize).toBe(10);
    expect(data.page).toBe(1);
    expect(data.totalCount).toBe(2);
    expect(data.pagedData).toHaveLength(2);
    expect(data.departments).toHaveLength(1);
    expect(data.stats.total).toBe(2);
    expect(data.stats.active).toBe(1);
    expect(data.stats.total - data.stats.active).toBe(1);
  });

  it('caps stats fetching at a maximum of 250 items to optimize performance', async () => {
    // Return total = 500, paged categories size = 10
    vi.mocked(getGrievanceCategories).mockImplementation(async (params) => {
      if (params.pageSize === 250) {
        return {
          categories: Array.from({ length: 250 }, (_, i) => ({
            id: i,
            categoryCode: `C${i}`,
            categoryName: `Cat ${i}`,
            priority: 'Medium',
            isActive: true,
            resolutionSla: '12',
          })) as unknown as GrievanceCategory[],
          total: 500,
          page: 1,
          pageSize: 250,
          totalPages: 2,
        };
      }
      return {
        categories: Array.from({ length: 10 }, (_, i) => ({
          id: i,
          categoryCode: `C${i}`,
          categoryName: `Cat ${i}`,
          priority: 'Medium',
          isActive: true,
          resolutionSla: '12',
        })) as unknown as GrievanceCategory[],
        total: 500,
        page: 1,
        pageSize: 10,
        totalPages: 50,
      };
    });

    vi.mocked(departmentMasterService.getDepartmentMasters).mockResolvedValue({
      success: true,
      data: [],
    });

    const data = await getGrievanceCategoryMasterData({ pageSize: '10', page: '1' });

    expect(data.pageSize).toBe(10);
    expect(data.totalCount).toBe(500);
    // Verified that the second call gets stats using STATS_FETCH_SIZE = 250
    expect(getGrievanceCategories).toHaveBeenCalledWith(
      expect.objectContaining({
        pageSize: 250,
        page: 1,
      })
    );
  });

  it('uses paged results fallback gracefully when stats fetch fails', async () => {
    vi.mocked(getGrievanceCategories).mockImplementation(async (params) => {
      if (params.pageSize === 250) {
        throw new Error('Stats api crash');
      }
      return {
        categories: [
          {
            id: 1,
            categoryCode: 'C1',
            categoryName: 'Cat 1',
            priority: 'High',
            isActive: true,
            resolutionSla: '24',
          },
        ] as unknown as GrievanceCategory[],
        total: 300,
        page: 1,
        pageSize: 10,
        totalPages: 30,
      };
    });

    vi.mocked(departmentMasterService.getDepartmentMasters).mockResolvedValue({
      success: true,
      data: [],
    });

    const data = await getGrievanceCategoryMasterData({ pageSize: '10', page: '1' });

    expect(data.totalCount).toBe(300);
    expect(data.stats.total).toBe(300);
  });
});
