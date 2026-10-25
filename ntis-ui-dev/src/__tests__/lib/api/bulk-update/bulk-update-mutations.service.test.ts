import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeBulkUpdateServer } from '@/lib/api/common-details-update/common-details-update-mutations.service';
import { apiClient } from '@/services/api.service';
import { ApiError } from '@/lib/utils/api';

vi.mock('@/services/api.service', () => ({
  apiClient: {
    put: vi.fn(),
  },
}));

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(() => (key: string) => key),
}));

vi.mock('@/lib/utils/server-logger', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  })),
}));

describe('executeBulkUpdateServer', () => {
  const mockPayload = {
    updateCode: 'UPDATE_ADDRESS',
    propertyIds: [1, 2, 3],
    updateData: {
      AddressEnglish: 'Test Address',
      Address: 'टेस्ट पत्ता',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should execute bulk update successfully', async () => {
    const mockResponse = {
      success: true,
      data: {
        success: true,
        message: 'Updated 3 properties successfully',
        items: {
          totalRequested: 3,
          successCount: 3,
          failedCount: 0,
          errors: [],
        },
        errors: null,
        correlationId: 'test-correlation-id',
      },
    };

    vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

    const result = await executeBulkUpdateServer('/api/CommonDetails/update', mockPayload);

    expect(apiClient.put).toHaveBeenCalledWith('/CommonDetails/update', mockPayload);
    expect(result).toEqual({
      success: true,
      message: 'Updated 3 properties successfully',
      items: {
        totalRequested: 3,
        successCount: 3,
        failedCount: 0,
        errors: [],
      },
      errors: null,
      correlationId: 'test-correlation-id',
    });
  });

  it('should handle partial update response', async () => {
    const mockResponse = {
      success: true,
      data: {
        success: true,
        message: 'Updated 2 properties',
        items: {
          totalRequested: 3,
          successCount: 2,
          failedCount: 1,
          errors: ['Property 549443 failed to update'],
        },
        errors: null,
        correlationId: null,
      },
    };

    vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

    const result = await executeBulkUpdateServer('/api/CommonDetails/update', mockPayload);

    expect(result.items?.successCount).toBe(2);
    expect(result.items?.failedCount).toBe(1);
    expect(result.items?.errors).toHaveLength(1);
  });

  it('should throw ApiError when API response is not successful', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({
      success: false,
      statusCode: 400,
      error: 'Invalid payload',
    });

    await expect(
      executeBulkUpdateServer('/api/CommonDetails/update', mockPayload)
    ).rejects.toThrow(ApiError);

    await expect(
      executeBulkUpdateServer('/api/CommonDetails/update', mockPayload)
    ).rejects.toThrow('Invalid payload');
  });

  it('should throw ApiError when response data indicates failure', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({
      success: true,
      data: {
        success: false,
        message: 'Validation failed',
        items: null,
        errors: ['Invalid property IDs'],
        correlationId: null,
      },
    });

    await expect(
      executeBulkUpdateServer('/api/CommonDetails/update', mockPayload)
    ).rejects.toThrow(ApiError);
  });

  it('should use provided apiRoute for API call', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({
      success: true,
      data: {
        success: true,
        message: 'Updated',
        items: { totalRequested: 1, successCount: 1, failedCount: 0, errors: [] },
        errors: null,
        correlationId: null,
      },
    });

    await executeBulkUpdateServer('/api/custom/route', mockPayload);

    expect(apiClient.put).toHaveBeenCalledWith('/custom/route', mockPayload);
  });

  it('should handle empty property IDs', async () => {
    const emptyPayload = {
      updateCode: 'UPDATE_ADDRESS',
      propertyIds: [],
      updateData: { AddressEnglish: 'Test' },
    };

    vi.mocked(apiClient.put).mockResolvedValue({
      success: true,
      data: {
        success: true,
        message: 'No properties to update',
        items: { totalRequested: 0, successCount: 0, failedCount: 0, errors: [] },
        errors: null,
        correlationId: null,
      },
    });

    const result = await executeBulkUpdateServer('/api/CommonDetails/update', emptyPayload);

    expect(result.items?.totalRequested).toBe(0);
  });

  it('should handle server error responses', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({
      success: false,
      statusCode: 500,
      error: 'Internal server error',
    });

    await expect(
      executeBulkUpdateServer('/api/CommonDetails/update', mockPayload)
    ).rejects.toThrow('Internal server error');
  });
});
