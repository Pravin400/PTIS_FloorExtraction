import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePaginatedProperties } from '@/hooks/reports/useReportDataHooks';
import { ptisSuggestionsClient } from '@/lib/api/ptis/tab/ptis-suggestions-client';

vi.mock('@/lib/api/ptis/tab/ptis-suggestions-client', () => ({
  ptisSuggestionsClient: {
    getSuggestions: vi.fn(),
    getSuggestionsPage: vi.fn(),
  },
}));

vi.mock('@/app/[locale]/property-tax/reports/actions', () => ({
  getPropertyTypesAction: vi.fn().mockResolvedValue([]),
  getAssessmentTypesAction: vi.fn().mockResolvedValue([]),
}));

const mockGetSuggestionsPage = vi.mocked(ptisSuggestionsClient.getSuggestionsPage);

function makeProperty(propertyId: number) {
  return {
    propertyId,
    propertyNo: `P-${propertyId}`,
    partitionNo: propertyId % 2 === 0 ? 'A' : '',
    upicId: '',
    ownerName: '',
    address: '',
    displayProperty: `P-${propertyId}`,
  };
}

describe('usePaginatedProperties', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads and appends the next property page', async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => makeProperty(index + 1));
    const secondPage = [makeProperty(101), makeProperty(102)];

    mockGetSuggestionsPage
      .mockResolvedValueOnce({
        success: true,
        data: firstPage,
        pagination: {
          pageNumber: 1,
          pageSize: 100,
          totalCount: 102,
          totalPages: 2,
          hasMore: true,
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: secondPage,
        pagination: {
          pageNumber: 2,
          pageSize: 100,
          totalCount: 102,
          totalPages: 2,
          hasMore: false,
        },
      });

    const { result } = renderHook(() => usePaginatedProperties(['7'], 'property'));

    await waitFor(() => {
      expect(result.current.paginatedProperties).toHaveLength(100);
      expect(result.current.hasMoreProperties).toBe(true);
      expect(result.current.isFetchingProperties).toBe(false);
    });

    act(() => {
      result.current.loadMoreProperties();
    });

    await waitFor(() => {
      expect(result.current.paginatedProperties).toHaveLength(102);
      expect(result.current.hasMoreProperties).toBe(false);
      expect(result.current.isLoadingMoreProperties).toBe(false);
    });

    expect(mockGetSuggestionsPage).toHaveBeenNthCalledWith(1, {
      wardId: 7,
      pageNumber: 1,
      pageSize: 100,
    });
    expect(mockGetSuggestionsPage).toHaveBeenNthCalledWith(2, {
      wardId: 7,
      propertyNo: undefined,
      partitionNo: undefined,
      pageNumber: 2,
      pageSize: 100,
    });
  });

  it('searches the property number and partition separately', async () => {
    mockGetSuggestionsPage
      .mockResolvedValueOnce({
        success: true,
        data: [],
        pagination: {
          pageNumber: 1,
          pageSize: 100,
          totalCount: 0,
          totalPages: 0,
          hasMore: false,
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: [
          {
            ...makeProperty(22),
            propertyNo: '32',
            partitionNo: 'A22',
          },
        ],
        pagination: {
          pageNumber: 1,
          pageSize: 100,
          totalCount: 1,
          totalPages: 1,
          hasMore: false,
        },
      });

    const { result } = renderHook(() => usePaginatedProperties(['7'], 'property'));

    await waitFor(() => {
      expect(result.current.isFetchingProperties).toBe(false);
    });

    act(() => {
      result.current.onPropertySearchChange('32-A2');
    });

    await waitFor(() => {
      expect(mockGetSuggestionsPage).toHaveBeenCalledTimes(2);
    });

    expect(mockGetSuggestionsPage).toHaveBeenNthCalledWith(2, {
      wardId: 7,
      propertyNo: '32',
      partitionNo: 'A2',
      pageNumber: 1,
      pageSize: 100,
    });
  });
});
