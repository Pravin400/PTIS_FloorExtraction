import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { ptisService } from '@/lib/api/ptis/tab/ptis.service';
import { ptisSearchService } from '@/lib/api/ptis/tab/ptis-search';
import { fetchWithCertSupport } from '@/lib/api/ptis/tab/base-api';
import { ptisMapper } from '@/lib/api/ptis/tab/ptis.mapper';

// Mock the API and external services
vi.mock('@/lib/api/ptis/tab/base-api', () => ({
  fetchWithCertSupport: vi.fn(),
  getErrorFormattedMessage: vi.fn((err) => err?.message || 'Error'),
  extractData: vi.fn((data) => data),
}));

vi.mock('@/lib/api/ptis/tab/ptis-search', () => ({
  ptisSearchService: {
    searchProperties: vi.fn(),
  },
}));

vi.mock('@/lib/api/ptis/tab/ptis.mapper', () => ({
  ptisMapper: {
    mapBasicDetails: vi.fn((data) => ({ ...data, mapped: true })),
  },
}));

describe('ptisService.fetchPropertyDetailsOnly', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return details directly if propertyId is provided', async () => {
    const mockBasicDetails = { propertyNo: '123', ownerName: 'John Doe' };
    (fetchWithCertSupport as Mock).mockResolvedValue({
      success: true,
      data: mockBasicDetails,
    });

    const result = await ptisService.fetchPropertyDetailsOnly('W1', '123', '0', 101, 5001);

    expect(result.success).toBe(true);
    expect(result.data?.propertyId).toBe(5001);
    expect(ptisSearchService.searchProperties).not.toHaveBeenCalled();
    expect(fetchWithCertSupport).toHaveBeenCalledWith('/Property/5001/basic-details');
    expect(ptisMapper.mapBasicDetails).toHaveBeenCalledWith(mockBasicDetails);
  });

  it('should resolve propertyId via search if not provided', async () => {
    const mockSearchResults = [{ propertyId: 6001, propertyNo: '456', partitionNo: '0' }];
    (ptisSearchService.searchProperties as Mock).mockResolvedValue({
      success: true,
      data: mockSearchResults,
    });

    (fetchWithCertSupport as Mock).mockResolvedValue({
      success: true,
      data: { propertyNo: '456' },
    });

    const result = await ptisService.fetchPropertyDetailsOnly('W2', '456', '0');

    expect(result.success).toBe(true);
    expect(result.data?.propertyId).toBe(6001);
    expect(ptisSearchService.searchProperties).toHaveBeenCalled();
    expect(fetchWithCertSupport).toHaveBeenCalledWith('/Property/6001/basic-details');
  });

  it('should handle partition normalization correctly ("0" vs "")', async () => {
    const mockSearchResults = [
      { propertyId: 7001, propertyNo: '789', partitionNo: '' }, // API returns empty string
    ];
    (ptisSearchService.searchProperties as Mock).mockResolvedValue({
      success: true,
      data: mockSearchResults,
    });

    (fetchWithCertSupport as Mock).mockResolvedValue({
      success: true,
      data: { propertyNo: '789' },
    });

    // Searching with '0', should match empty string via normalization
    const result = await ptisService.fetchPropertyDetailsOnly('W3', '789', '0');

    expect(result.success).toBe(true);
    expect(result.data?.propertyId).toBe(7001);
  });

  it('should return error if property is not found in search', async () => {
    (ptisSearchService.searchProperties as Mock).mockResolvedValue({
      success: true,
      data: [],
    });

    const result = await ptisService.fetchPropertyDetailsOnly('W4', '999', '0');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Property not found');
  });

  it('should return error if basic details fetch fails', async () => {
    (fetchWithCertSupport as Mock).mockResolvedValue({
      success: false,
      error: { message: 'API Failure' },
    });

    const result = await ptisService.fetchPropertyDetailsOnly('W5', '111', '0', 105, 8001);

    expect(result.success).toBe(false);
    expect(result.error).toBe('API Failure');
  });

  it('should pick the correct property from multiple search results', async () => {
    const mockSearchResults = [
      { propertyId: 9001, propertyNo: '222', partitionNo: '1' }, // Wrong partition
      { propertyId: 9002, propertyNo: '222', partitionNo: '0' }, // Correct partition
    ];
    (ptisSearchService.searchProperties as Mock).mockResolvedValue({
      success: true,
      data: mockSearchResults,
    });

    (fetchWithCertSupport as Mock).mockResolvedValue({
      success: true,
      data: { propertyNo: '222' },
    });

    const result = await ptisService.fetchPropertyDetailsOnly('W6', '222', '0');

    expect(result.success).toBe(true);
    expect(result.data?.propertyId).toBe(9002);
  });

  it('should return error if search results exist but none match partition', async () => {
    const mockSearchResults = [{ propertyId: 9001, propertyNo: '333', partitionNo: '5' }];
    (ptisSearchService.searchProperties as Mock).mockResolvedValue({
      success: true,
      data: mockSearchResults,
    });

    const result = await ptisService.fetchPropertyDetailsOnly('W7', '333', '0');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Property not found');
  });

  it('should handle API success with empty data payload', async () => {
    (fetchWithCertSupport as Mock).mockResolvedValue({
      success: true,
      data: null,
    });

    const result = await ptisService.getPropertyBasicDetails(5001);

    expect(result.success).toBe(false);
    expect(result.error).toBe('No data returned from API for property basic details');
  });

  it('should catch and format unexpected errors in fetchPropertyDetailsOnly', async () => {
    (ptisSearchService.searchProperties as Mock).mockRejectedValue(new Error('Network Crash'));

    const result = await ptisService.fetchPropertyDetailsOnly('W8', '888', '0');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network Crash');
  });
});
