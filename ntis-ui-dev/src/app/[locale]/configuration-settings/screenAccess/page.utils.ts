import type { ActionResponse } from './action.utils';
import type { PaginatedResponse } from '@/lib/api/configuration-settings/screenAccess/screen-access.services';

export const isPaginatedResponse = (
  data: unknown
): data is PaginatedResponse<unknown> & { activeCount?: number } => {
  return typeof data === 'object' && data !== null && 'totalCount' in data && 'items' in data;
};

export const mapPagination = (data: PaginatedResponse<unknown> | undefined | null, def: number) => {
  if (data && isPaginatedResponse(data)) {
    return {
      totalCount: data.totalCount,
      activeCount: data.activeCount || 0,
      totalPages: data.totalPages,
      hasNext: data.hasNext,
      hasPrevious: data.hasPrevious,
      pageNumber: data.pageNumber,
      pageSize: data.pageSize,
    };
  }

  return {
    totalCount: 0,
    activeCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
    pageNumber: 1,
    pageSize: def,
  };
};

export function extractData<T>(res: ActionResponse<PaginatedResponse<T>>, defaultValue?: T[]): T[];
export function extractData<T>(res: ActionResponse<T[]>, defaultValue?: T[]): T[];
export function extractData<T>(
  res: ActionResponse<T[]> | ActionResponse<PaginatedResponse<T>> | undefined | null,
  defaultValue: T[] = []
): T[] {
  if (!res?.success || !res?.data) return defaultValue;
  const data = res.data;
  if (Array.isArray(data)) return data;
  if (typeof data === 'object' && 'items' in data) {
    return (data as PaginatedResponse<T>).items || defaultValue;
  }
  return defaultValue;
}
