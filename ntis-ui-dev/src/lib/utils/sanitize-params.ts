/**
 * Shared utility for sanitizing URL search parameters.
 *
 * Extracted from page-level sanitization to enable reuse across master pages
 * (PropertyTypeMaster, OfficeMaster, etc.) with consistent validation behavior.
 */

export interface SanitizeParamsConfig<TSortColumn extends string> {
  /** Minimum allowed page number (default: 1) */
  minPage?: number;
  /** Maximum allowed page number (default: 10000) */
  maxPage?: number;
  /** Minimum allowed page size (default: 1) */
  minPageSize?: number;
  /** Maximum allowed page size (default: 100) */
  maxPageSize?: number;
  /** Default page size when none specified (default: 10) */
  defaultPageSize?: number;
  /** Allowed sort column names for whitelist validation */
  allowedSortColumns: readonly TSortColumn[];
  /** Allowed sort orders (default: ["asc", "desc"]) */
  allowedSortOrders?: readonly string[];
}

export interface RawSearchParams {
  page?: string;
  pageSize?: string;
  q?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface SanitizedParams<TSortColumn extends string> {
  pageNumber: number;
  pageSize: number;
  searchTerm: string | undefined;
  sortBy: TSortColumn | undefined;
  sortOrder: "asc" | "desc" | undefined;
}

const DEFAULT_CONFIG = {
  minPage: 1,
  maxPage: 10_000,
  minPageSize: 1,
  maxPageSize: 100,
  defaultPageSize: 10,
  allowedSortOrders: ["asc", "desc"] as const,
} as const;

/**
 * Sanitizes and clamps query-string parameters before they reach server actions.
 * Malformed values (e.g. ?page=-1&pageSize=999) are silently normalized to safe
 * defaults so the page renders instead of crashing into the error boundary.
 *
 * @param raw - Raw search parameters from URL
 * @param config - Configuration for validation constraints and allowed values
 * @returns Sanitized parameters safe for server action consumption
 *
 * @example
 * ```ts
 * const ALLOWED_SORT_COLUMNS = ["name", "createdAt"] as const;
 *
 * const params = sanitizeSearchParams(
 *   await searchParams,
 *   { allowedSortColumns: ALLOWED_SORT_COLUMNS }
 * );
 * ```
 */
export function sanitizeSearchParams<TSortColumn extends string>(
  raw: RawSearchParams,
  config: SanitizeParamsConfig<TSortColumn>
): SanitizedParams<TSortColumn> {
  const {
    minPage = DEFAULT_CONFIG.minPage,
    maxPage = DEFAULT_CONFIG.maxPage,
    minPageSize = DEFAULT_CONFIG.minPageSize,
    maxPageSize = DEFAULT_CONFIG.maxPageSize,
    defaultPageSize = DEFAULT_CONFIG.defaultPageSize,
    allowedSortColumns,
    allowedSortOrders = DEFAULT_CONFIG.allowedSortOrders,
  } = config;

  // Parse page number: NaN / non-finite values fall back to minimum
  const rawPage = parseInt(raw.page ?? "", 10);
  const pageNumber = Number.isFinite(rawPage)
    ? Math.min(Math.max(rawPage, minPage), maxPage)
    : minPage;

  // Parse page size: NaN / non-finite values fall back to default
  const rawPageSize = parseInt(raw.pageSize ?? "", 10);
  const pageSize = Number.isFinite(rawPageSize)
    ? Math.min(Math.max(rawPageSize, minPageSize), maxPageSize)
    : defaultPageSize;

  // Free-text search: trim only, no validation needed
  const searchTerm = raw.q?.trim() || undefined;

  // Whitelist-based validation: unknown values become undefined
  // so the action falls back to its own default rather than throwing
  const sortByRaw = raw.sortBy?.trim() ?? "";
  const sortBy = (allowedSortColumns as readonly string[]).includes(sortByRaw)
    ? (sortByRaw as TSortColumn)
    : undefined;

  const sortOrderRaw = raw.sortOrder?.trim().toLowerCase() ?? "";
  const sortOrder = (allowedSortOrders as readonly string[]).includes(sortOrderRaw)
    ? (sortOrderRaw as "asc" | "desc")
    : undefined;

  return { pageNumber, pageSize, searchTerm, sortBy, sortOrder };
}
