import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiError } from '@/lib/utils/api';

vi.mock('@/services/api.service', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock the validator so tests don't depend on its validation logic
vi.mock('@/lib/api/configuration-settings/bank/bank-master.validator', () => ({
  normalizeBankData: (data: unknown) => data,
  validateBankMasterDto: () => null,
  assertBankFormData: () => undefined,
}));

import { apiClient } from '@/services/api.service';
import {
  getBanksPaged,
  getBankById,
  createBank,
  updateBank,
  deleteBank,
} from '@/lib/api/configuration-settings/bank/bank-master.services';
import type { BankMasterData } from '@/types/bank-master.types';
import type { PagedResponse } from '@/types/common.types';

const mockBank: BankMasterData = {
  id: '1',
  bankCode: 'B001',
  bankName: 'Bank One',
  branchName: 'Main',
  ifscCode: 'ABCD0001234',
  address: '123 St',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
  isActive: true,
};

const mockPagedResponse: PagedResponse<BankMasterData> = {
  items: [mockBank],
  totalCount: 1,
  pageNumber: 1,
  pageSize: 10,
  totalPages: 1,
  hasNext: false,
  hasPrevious: false,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getBanksPaged', () => {
  it('returns paged data on success', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      success: true,
      data: mockPagedResponse,
      statusCode: 200,
    });
    const result = await getBanksPaged(1, 10);
    expect(result.items).toHaveLength(1);
    expect(result.totalCount).toBe(1);
  });

  it('throws ApiError on failure response', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      success: false,
      error: 'Not found',
      statusCode: 404,
    });
    await expect(getBanksPaged(1, 10)).rejects.toBeInstanceOf(ApiError);
  });
});

describe('getBankById', () => {
  it('returns bank data on success', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ success: true, data: mockBank, statusCode: 200 });
    const result = await getBankById('1');
    expect(result.id).toBe('1');
  });

  it('throws ApiError when request fails', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      success: false,
      error: 'Not found',
      statusCode: 404,
    });
    await expect(getBankById('1')).rejects.toBeInstanceOf(ApiError);
  });
});

describe('createBank', () => {
  it('resolves on success', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ success: true, data: null, statusCode: 201 });
    await expect(createBank(mockBank as never, 42)).resolves.toBeUndefined();
  });

  it('throws ApiError on failure', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      success: false,
      error: 'Conflict',
      statusCode: 409,
    });
    await expect(createBank(mockBank as never, 42)).rejects.toBeInstanceOf(ApiError);
  });
});

describe('updateBank', () => {
  it('resolves on success', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({ success: true, data: null, statusCode: 200 });
    await expect(updateBank('1', mockBank as never, 42)).resolves.toBeUndefined();
  });

  it('throws ApiError on failure', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({
      success: false,
      error: 'Not found',
      statusCode: 404,
    });
    await expect(updateBank('1', mockBank as never, 42)).rejects.toBeInstanceOf(ApiError);
  });
});

describe('deleteBank', () => {
  it('resolves on success', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({
      success: true,
      data: undefined,
      statusCode: 204,
    });
    await expect(deleteBank('1')).resolves.toBeUndefined();
    expect(apiClient.delete).toHaveBeenCalledWith('/BankMaster/1/purge');
  });

  it('throws ApiError on failure', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({
      success: false,
      error: 'Not found',
      statusCode: 404,
    });
    await expect(deleteBank('1')).rejects.toBeInstanceOf(ApiError);
    expect(apiClient.delete).toHaveBeenCalledWith('/BankMaster/1/purge');
  });
});
