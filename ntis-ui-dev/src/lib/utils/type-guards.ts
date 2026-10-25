import type { PagedResponse } from '@/types/common.types';

/**
 * Parses a value into a boolean, accepting true/false, 'true'/'false', 1/0, and defaulting to false otherwise.
 */
export function parseBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.trim().toLowerCase();
    if (lower === 'true') return true;
    if (lower === 'false') return false;
    if (lower === '1') return true;
    if (lower === '0') return false;
  }
  if (typeof value === 'number') return value === 1;
  return false;
}
export function isPagedResponse<T>(response: unknown): response is PagedResponse<T> {
  if (typeof response !== 'object' || response === null) return false;

  const obj = response as Record<string, unknown>;

  return (
    'items' in obj &&
    Array.isArray(obj.items) &&
    'totalCount' in obj &&
    typeof obj.totalCount === 'number' &&
    'pageNumber' in obj &&
    typeof obj.pageNumber === 'number' &&
    'pageSize' in obj &&
    typeof obj.pageSize === 'number' &&
    'totalPages' in obj &&
    typeof obj.totalPages === 'number' &&
    'hasNext' in obj &&
    typeof obj.hasNext === 'boolean' &&
    'hasPrevious' in obj &&
    typeof obj.hasPrevious === 'boolean'
  );
}

/**
 * Redacts sensitive information (tokens, passwords, secrets) from an API response body string.
 * This is used to prevent sensitive data leakage in logs.
 */
export function redactApiBody(body: string): string {
  if (!body) return body;
  const redactionRegex = /("token"|"password"|"secret"|"authToken"|"authorization"|"jwt")[^,}]*/gi;
  return body.replace(redactionRegex, '$1:"***"');
}
/**
 * Normalizes an ID value from string, number, or null/undefined to a consistent number or null.
 * Handles cases where IDs might be 0 (often treated as null in some APIs).
 */
export const normalizeId = (id: number | string | undefined | null): number | null => {
  if (id === undefined || id === null) return null;
  const num = typeof id === 'string' ? parseInt(id, 10) : id;
  if (isNaN(num)) return null;
  return num === 0 ? null : num;
};
