import {
  ASSET_MASTER_TEXT_SANITIZE,
  POSITIVE_INTEGER_REGEX,
} from '@/lib/utils/asset-validation-rules';

export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;

export function isValidSingleFilterValue(value: string): boolean {
  return value === 'all' || /^[1-9]\d*$/.test(value);
}

export function isValidMultiFilterValue(value: string): boolean {
  return value === 'all' || /^(?:[1-9]\d*)(?:,(?:[1-9]\d*))*$/.test(value);
}

export function sanitizePositiveId(value: string | undefined): string | undefined {
  if (!value || !POSITIVE_INTEGER_REGEX.test(value)) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return String(parsed);
}

export function sanitizeSearch(value: string | undefined): string {
  if (!value) return '';
  return value.replace(ASSET_MASTER_TEXT_SANITIZE, '').trim().slice(0, 200);
}

interface CanonicalQueryParams {
  finalPage: number;
  safePageSize: number;
  safeSearch: string;
  safeSearchField: string;
  safeAssetNo: string;
  safeAssetTypeId: string;
  safeZoneId: string;
  finalWardId: string;
  safeDepartmentId: string;
  safeOwnershipType: string;
  safeEncroachmentStatus: string;
  safeViewImageAssetId?: string;
  safeExpandAssetId?: string;
}

export function buildCanonicalQuery(params: CanonicalQueryParams): URLSearchParams {
  const query = new URLSearchParams();
  if (params.finalPage > 1) query.set('page', String(params.finalPage));
  if (params.safePageSize !== 10) query.set('pageSize', String(params.safePageSize));
  if (params.safeSearch) query.set('search', params.safeSearch);
  if (params.safeSearchField !== 'all') query.set('searchField', params.safeSearchField);
  if (params.safeAssetNo) query.set('AssetNo', params.safeAssetNo);
  if (params.safeAssetTypeId !== 'all') query.set('AssetTypeId', params.safeAssetTypeId);
  if (params.safeZoneId !== 'all') query.set('ZoneId', params.safeZoneId);
  if (params.finalWardId !== 'all') query.set('WardId', params.finalWardId);
  if (params.safeDepartmentId !== 'all') query.set('DepartmentId', params.safeDepartmentId);
  if (params.safeOwnershipType !== 'all') query.set('ownershipType', params.safeOwnershipType);
  if (params.safeEncroachmentStatus !== 'all') query.set('encroachmentStatus', params.safeEncroachmentStatus);
  if (params.safeViewImageAssetId) query.set('viewImageAssetId', params.safeViewImageAssetId);
  if (params.safeExpandAssetId) query.set('expandAssetId', params.safeExpandAssetId);
  return query;
}

export function isQueryCanonical(
  query: Record<string, string | undefined>,
  params: CanonicalQueryParams
): boolean {
  // If query contains arbitrary sorting parameters, reject canonical status to strip them
  if (query.sortBy !== undefined || query.sortOrder !== undefined || query.occupancyStatus !== undefined) {
    return false;
  }

  return (
    (query.page || '1') === String(params.finalPage) &&
    (query.pageSize || '10') === String(params.safePageSize) &&
    (query.search || '') === params.safeSearch &&
    (query.searchField || 'all') === params.safeSearchField &&
    (query.AssetNo || '') === params.safeAssetNo &&
    (query.AssetTypeId === params.safeAssetTypeId || (query.AssetTypeId === undefined && params.safeAssetTypeId === 'all')) &&
    (query.ZoneId === params.safeZoneId || (query.ZoneId === undefined && params.safeZoneId === 'all')) &&
    (query.WardId === params.finalWardId || (query.WardId === undefined && params.finalWardId === 'all')) &&
    (query.DepartmentId === params.safeDepartmentId || (query.DepartmentId === undefined && params.safeDepartmentId === 'all')) &&
    (query.ownershipType === params.safeOwnershipType || (query.ownershipType === undefined && params.safeOwnershipType === 'all')) &&
    (query.encroachmentStatus === params.safeEncroachmentStatus || (query.encroachmentStatus === undefined && params.safeEncroachmentStatus === 'all')) &&
    query.viewImageAssetId === params.safeViewImageAssetId &&
    query.expandAssetId === params.safeExpandAssetId
  );
}
