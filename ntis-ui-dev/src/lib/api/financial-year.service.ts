import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";
import { FinancialYear, FinancialYearPagedResponse, FinancialYearPayload } from "@/types/financialYear.types";

export { ApiError };

interface RawFinancialYear {
  id?: number; Id?: number;
  year?: number; Year?: number;
  yearCode?: string | null; YearCode?: string | null;
  isActive?: boolean; IsActive?: boolean;
  status?: string | null; Status?: string | null;
  startDate?: string | null; StartDate?: string | null;
  endDate?: string | null; EndDate?: string | null;
  description?: string | null; Description?: string | null;
  yearDescription?: string | null; YearDescription?: string | null;
  createdBy?: number | null; CreatedBy?: number | null;
  createdDate?: string | null; CreatedDate?: string | null;
  updatedBy?: number | null; UpdatedBy?: number | null;
  updatedDate?: string | null; UpdatedDate?: string | null;
}

const normalizeFinancialYear = (year: RawFinancialYear): FinancialYear => ({
  id: year.id ?? year.Id ?? 0,
  year: year.year ?? year.Year ?? new Date().getFullYear(),
  yearCode: year.yearCode ?? year.YearCode ?? null,
  isActive: year.isActive ?? year.IsActive ?? false,
  status: year.status ?? year.Status ?? 'Draft',
  startDate: year.startDate ?? year.StartDate ?? null,
  endDate: year.endDate ?? year.EndDate ?? null,
  description: year.description ?? year.Description ?? year.yearDescription ?? year.YearDescription ?? null,
  createdBy: year.createdBy ?? year.CreatedBy ?? null,
  createdDate: year.createdDate ?? year.CreatedDate ?? null,
  updatedBy: year.updatedBy ?? year.UpdatedBy ?? null,
  updatedDate: year.updatedDate ?? year.UpdatedDate ?? null,
});

const formatPayloadDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const dateOnly = dateStr.split('T')[0].split(' ')[0];
  return `${dateOnly}T00:00:00`;
};

export async function getFinancialYearsPaged(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  statusFilter?: string
): Promise<FinancialYearPagedResponse & { stats?: { total: number; active: number; closed: number } }> {
  const params = new URLSearchParams({
    PageNumber: "1",
    PageSize: "2000",
  });

  if (searchTerm?.trim()) params.append("SearchTerm", searchTerm.trim());
  if (statusFilter?.trim()) params.append("Status", statusFilter.trim());

  const response = await apiClient.get<FinancialYearPagedResponse>(
    `/YearMaster?${params.toString()}`
  );

  if (!response.success || !response.data) {
    throw new ApiError(
      response.statusCode || 500,
      response.error || "Fetch financial years failed",
      "Fetch financial years failed"
    );
  }

  const allItems = (response.data.items || []).map(normalizeFinancialYear);
  const stats = {
    total: allItems.length,
    active: allItems.filter((y) => y.status === "Active" || y.isActive).length,
    closed: allItems.filter((y) => y.status === "Closed").length,
  };

  let items = allItems;

  // Client-side search filtering fallback
  if (searchTerm?.trim()) {
    const term = searchTerm.trim().toLowerCase();
    items = items.filter(
      (item) =>
        (item.yearCode?.toLowerCase().includes(term) ?? false) ||
        item.year.toString().includes(term) ||
        (item.description?.toLowerCase().includes(term) ?? false)
    );
  }

  // Client-side status filtering fallback if backend doesn't filter by status
  if (statusFilter?.trim()) {
    const filterValue = statusFilter.trim();
    items = items.filter((item) => item.status === filterValue);
  }

  // Always sort so that the active/current financial year is 1st record, followed by descending year order
  items.sort((a, b) => {
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;
    return b.year - a.year;
  });

  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasPrevious = pageNumber > 1;
  const hasNext = pageNumber < totalPages;

  const paginatedItems = items.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);

  return {
    ...response.data,
    items: paginatedItems,
    totalCount,
    pageNumber,
    pageSize,
    totalPages,
    hasPrevious,
    hasNext,
    stats,
  };
}

/** GET by id */
export async function getFinancialYearById(id: number): Promise<FinancialYear> {
  const response = await apiClient.get<FinancialYear>(`/YearMaster/${id}`);

  if (!response.success || !response.data) {
    throw new ApiError(
      response.statusCode || 500,
      response.error || `Fetch financial year ${id} failed`,
      `Fetch financial year ${id} failed`
    );
  }

  return normalizeFinancialYear(response.data);
}

/** CREATE */
export async function createFinancialYear(data: FinancialYearPayload): Promise<void> {
  const payload = {
    IsActive: data.isActive,
    Year: data.year,
    YearCode: data.yearCode,
    Status: data.status,
    StartDate: formatPayloadDate(data.startDate),
    EndDate: formatPayloadDate(data.endDate),
    Description: data.description ?? null,
    YearDescription: data.description ?? null,
    CreatedBy: data.createdBy ?? null,
  };
  const response = await apiClient.post<void>("/YearMaster", payload);

  if (!response.success) {
    throw new ApiError(
      response.statusCode || 500,
      response.error || "Create financial year failed",
      "Create financial year failed"
    );
  }
}

/** UPDATE */
export async function updateFinancialYear(id: number, data: FinancialYearPayload): Promise<void> {
  const payload = {
    Id: id,
    IsActive: data.isActive,
    Year: data.year,
    YearCode: data.yearCode,
    Status: data.status,
    StartDate: formatPayloadDate(data.startDate),
    EndDate: formatPayloadDate(data.endDate),
    Description: data.description ?? null,
    YearDescription: data.description ?? null,
    UpdatedBy: data.updatedBy ?? null,
  };
  
  const response = await apiClient.put<void>(`/YearMaster/${id}`, payload);

  if (!response.success) {
    throw new ApiError(
      response.statusCode || 500,
      response.error || "Update financial year failed",
      "Update financial year failed"
    );
  }
}

/** DELETE */
export async function deleteFinancialYear(id: number): Promise<void> {
  const response = await apiClient.delete<void>(`/YearMaster/${id}`);

  if (!response.success) {
    throw new ApiError(
      response.statusCode || 500,
      response.error || `Delete financial year ${id} failed`,
      `Delete financial year ${id} failed`
    );
  }
}
