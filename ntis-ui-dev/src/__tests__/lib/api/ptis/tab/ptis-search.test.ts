import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { ptisSearchService } from '@/lib/api/ptis/tab/ptis-search';
import { fetchWithCertSupport } from '@/lib/api/ptis/tab/base-api';

vi.mock('@/lib/api/ptis/tab/base-api', () => ({
  fetchWithCertSupport: vi.fn(),
  getErrorFormattedMessage: vi.fn((err, fallback) => err?.message || fallback || 'Error'),
}));

describe('ptisSearchService.searchProperties', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call the canonical endpoint and return success', async () => {
    (fetchWithCertSupport as Mock).mockResolvedValue({
      success: true,
      data: { items: [{ propertyId: 100, propertyNo: 'ABC' }] },
    });

    const result = await ptisSearchService.searchProperties({ wardId: 5, propertyNo: 'ABC' });

    expect(result.success).toBe(true);
    expect(result.data?.[0].propertyNo).toBe('ABC');
    // Verifies we only make ONE canonical call now, not three
    expect(fetchWithCertSupport).toHaveBeenCalledTimes(1);
  });

  it('should return error if API call fails', async () => {
    (fetchWithCertSupport as Mock).mockResolvedValue({ success: false });

    const result = await ptisSearchService.searchProperties({ wardNo: 'W1', propertyNo: 'XYZ' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('No properties found matching criteria');
  });

  it('should build canonical URL with PascalCase parameters', async () => {
    (fetchWithCertSupport as Mock).mockResolvedValue({ success: false });

    await ptisSearchService.searchProperties({ wardId: 10, propertyNo: '123' });

    const calledUrls = (fetchWithCertSupport as Mock).mock.calls.map((call) => call[0]);

    // Verifies the new canonical contract (PascalCase params)
    expect(calledUrls).toContain('/Property?WardId=10&PropertyNo=123&PageSize=100&PageNumber=1');
    expect(calledUrls).toHaveLength(1);
  });

  it('should handle pagination in search suggestions', async () => {
    const mockSuggestions = [
      { propertyNo: 'S1', partitionNo: '0' },
      { propertyNo: 'S2', partitionNo: '1' },
    ];
    (fetchWithCertSupport as Mock).mockResolvedValue({
      success: true,
      data: { items: mockSuggestions },
    });

    const result = await ptisSearchService.getPropertySuggestions('W1', 1, 'S', 5);

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data?.[0].propertyNo).toBe('S1');
  });

  it('should fetch a page of property and partition suggestions', async () => {
    (fetchWithCertSupport as Mock).mockResolvedValue({
      success: true,
      data: {
        items: [
          {
            id: 201,
            propertyNo: 'P-201',
            partitionNo: 'A',
            wardId: 7,
          },
        ],
        totalCount: 250,
        pageNumber: 2,
        pageSize: 100,
        totalPages: 3,
        hasNext: true,
      },
    });

    const result = await ptisSearchService.getPropertySuggestionsPage(
      7,
      'P',
      'A',
      2,
      100
    );

    expect(fetchWithCertSupport).toHaveBeenCalledWith(
      '/Property?WardId=7&PageNumber=2&PageSize=100&PropertyNo=P&PartitionNo=A'
    );
    expect(result.success).toBe(true);
    expect(result.data?.items).toEqual([
      expect.objectContaining({
        propertyId: 201,
        propertyNo: 'P-201',
        partitionNo: 'A',
      }),
    ]);
    expect(result.data?.hasNext).toBe(true);
    expect(result.data?.totalPages).toBe(3);
  });
});
