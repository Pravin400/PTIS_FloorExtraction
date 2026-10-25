import { apiClient } from '@/services/api.service';
import type { BankMasterData, BankMasterDto } from '@/types/bank-master.types';
import type { PagedResponse } from '@/types/common.types';
import { ApiError } from '@/lib/utils/api';
import { normalizeBankData } from './bank-master.validator';

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

function buildBankQuery(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  state?: string,
  sortBy?: string,
  sortOrder?: string
): string {
  const params = new URLSearchParams({
    PageNumber: String(pageNumber),
    PageSize: String(pageSize),
  });

  if (searchTerm) params.append('SearchTerm', searchTerm);
  if (state && state !== 'all') params.append('State', state);
  if (sortBy) params.append('SortBy', sortBy);
  if (sortOrder) params.append('SortOrder', sortOrder);

  return `/BankMaster?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Public service functions (flat exports — no bundled object)
// ---------------------------------------------------------------------------

/** Fetches a paginated list of banks. */
export async function getBanksPaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  state?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<BankMasterData>> {
  const endpoint = buildBankQuery(pageNumber, pageSize, searchTerm, state, sortBy, sortOrder);
  const response = await apiClient.get<PagedResponse<BankMasterData>>(endpoint);

  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'Failed to fetch banks',
      'Get banks failed'
    );
  }

  if (!response.data) {
    throw new ApiError(500, 'No data received from server', 'Get banks — invalid response');
  }

  return response.data;
}

/** Fetches a single bank by its string ID. */
export async function getBankById(id: string): Promise<BankMasterData> {
  const response = await apiClient.get<BankMasterData>(`/BankMaster/${encodeURIComponent(id)}`);

  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'Failed to fetch bank',
      `Get bank ${id} failed`
    );
  }

  if (!response.data) {
    throw new ApiError(500, 'No data received from server', `Get bank ${id} — invalid response`);
  }

  return response.data;
}

/** Creates a new bank record. */
export async function createBank(data: BankMasterDto, userId: number): Promise<void> {
  const normalized = normalizeBankData(data);
  const payload = { ...normalized, createdBy: userId };

  const response = await apiClient.post<unknown>('/BankMaster', payload);

  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'Failed to create bank',
      'Create bank failed'
    );
  }
}

/** Updates an existing bank record by ID. */
export async function updateBank(id: string, data: BankMasterDto, userId: number): Promise<void> {
  const normalized = normalizeBankData(data);
  const payload = { ...normalized, updatedBy: userId };

  const response = await apiClient.put<unknown>(`/BankMaster/${encodeURIComponent(id)}`, payload);

  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'Failed to update bank',
      `Update bank ${id} failed`
    );
  }
}

/** Deletes a bank record by ID. */
export async function deleteBank(id: string): Promise<void> {
  const response = await apiClient.delete<void>(`/BankMaster/${encodeURIComponent(id)}/purge`);

  if (!response.success) {
    throw new ApiError(
      response.statusCode ?? 500,
      response.error || 'Failed to delete bank',
      `Delete bank ${id} failed`
    );
  }
}

/** Fetches all banks (summary — iterates pages). Safe up to MAX_SUMMARY_PAGES. */
const SUMMARY_PAGE_SIZE = 200;
const MAX_SUMMARY_PAGES = 10;

export async function getBanksSummary(): Promise<BankMasterData[]> {
  const firstPage = await getBanksPaged(1, SUMMARY_PAGE_SIZE);

  if (firstPage.items.length === 0) return [];

  const totalPages =
    Number.isInteger(firstPage.totalPages) && firstPage.totalPages > 0
      ? firstPage.totalPages
      : Number.isInteger(firstPage.totalCount) && firstPage.totalCount > 0
        ? Math.ceil(firstPage.totalCount / SUMMARY_PAGE_SIZE)
        : null;

  if (totalPages !== null && totalPages > MAX_SUMMARY_PAGES) {
    throw new ApiError(
      500,
      `Bank summary pagination requires ${totalPages} pages, exceeding the safe limit of ${MAX_SUMMARY_PAGES}. Use a backend metadata endpoint.`,
      'Get banks summary — page limit exceeded'
    );
  }

  if (totalPages !== null && totalPages > MAX_SUMMARY_PAGES / 2) {
    console.warn(
      `[Performance Warning] Bank summary fetch requires ${totalPages} pages (${totalPages * SUMMARY_PAGE_SIZE} records). ` +
        `Fetching this many records into memory may cause performance issues.`
    );
  }

  const remaining =
    totalPages !== null ? Array.from({ length: totalPages - 1 }, (_, i) => i + 2) : [];

  const additionalPages = await Promise.all(
    remaining.map((page) => getBanksPaged(page, SUMMARY_PAGE_SIZE))
  );

  const banksById = new Map<string, BankMasterData>();
  for (const bank of firstPage.items) banksById.set(bank.id, bank);
  for (const page of additionalPages) {
    for (const bank of page.items) banksById.set(bank.id, bank);
  }

  return Array.from(banksById.values());
}
