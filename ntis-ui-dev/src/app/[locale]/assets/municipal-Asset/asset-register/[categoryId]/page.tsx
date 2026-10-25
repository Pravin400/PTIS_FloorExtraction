import { notFound, redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { parsePaginationParams } from '@/lib/utils/pagination';
import { AssetRegisterView } from '@/components/modules/assets/municipal-Asset/asset-register/AssetRegisterView';
import {
  fetchAssetRegisterPage,
  fetchAssetTypesByCategory,
  fetchZones,
  fetchWards,
  fetchDepartments,
  fetchCategories,
  fetchOwnershipTypes,
  fetchSubUnitsByAsset,
} from './action';
import {
  PAGE_SIZE_OPTIONS,
  buildCanonicalQuery,
  isQueryCanonical,
  isValidMultiFilterValue,
  isValidSingleFilterValue,
  sanitizePositiveId,
  sanitizeSearch,
} from '@/lib/utils/asset-utils/asset-register-query';

export const dynamic = 'force-dynamic';

const SUB_PAGE_SIZE_OPTIONS = [1, 2, 5, 10, 20, 50] as const;

interface PageProps {
  params: Promise<{
    locale: string;
    categoryId: string;
  }>;
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    searchField?: string;
    AssetNo?: string;
    AssetTypeId?: string;
    ZoneId?: string;
    WardId?: string;
    DepartmentId?: string;
    ownershipType?: string;
    encroachmentStatus?: string;
    viewImageAssetId?: string;
    expandAssetId?: string;
    subPage?: string;
    subPageSize?: string;
    subSearch?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { locale, categoryId } = await params;
  setRequestLocale(locale);
  const query = await searchParams;
  const parsed = Number(categoryId);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    notFound();
  }

  const { pageNumber: safePage, pageSize: rawPageSize } = parsePaginationParams(
    query.page,
    query.pageSize
  );
  const safePageSize = PAGE_SIZE_OPTIONS.includes(rawPageSize as (typeof PAGE_SIZE_OPTIONS)[number]) ? rawPageSize : 10;
  const safeSearch = sanitizeSearch(query.search);
  const safeSearchField = query.searchField === 'assetId' || query.searchField === 'assetName' || query.searchField === 'address' ? query.searchField : 'all';
  const safeAssetNo = sanitizeSearch(query.AssetNo);
  const safeAssetTypeId = isValidMultiFilterValue(query.AssetTypeId ?? 'all') ? (query.AssetTypeId ?? 'all') : 'all';
  const safeZoneId = isValidSingleFilterValue(query.ZoneId ?? 'all') ? (query.ZoneId ?? 'all') : 'all';
  const safeWardId = isValidSingleFilterValue(query.WardId ?? 'all') ? (query.WardId ?? 'all') : 'all';
  const safeDepartmentId = isValidSingleFilterValue(query.DepartmentId ?? 'all') ? (query.DepartmentId ?? 'all') : 'all';
  const safeOwnershipType = typeof query.ownershipType === 'string' && query.ownershipType !== 'all' ? query.ownershipType : 'all';
  const safeEncroachmentStatus = typeof query.encroachmentStatus === 'string' && query.encroachmentStatus !== 'all' ? query.encroachmentStatus : 'all';
  const safeViewImageAssetId = sanitizePositiveId(query.viewImageAssetId);
  const safeExpandAssetId = sanitizePositiveId(query.expandAssetId);
  const safeSubPage = sanitizePositiveId(query.subPage);
  const parsedSubPageSize = sanitizePositiveId(query.subPageSize);
  const safeSubPageSize = parsedSubPageSize && SUB_PAGE_SIZE_OPTIONS.includes(Number(parsedSubPageSize) as (typeof SUB_PAGE_SIZE_OPTIONS)[number])
    ? parsedSubPageSize
    : '10';
  const safeSubSearch = sanitizeSearch(query.subSearch);
  const updatedDate = new Date().toLocaleDateString('en-GB');

  const preFetchCanonicalParams = {
    finalPage: safePage,
    safePageSize,
    safeSearch,
    safeSearchField,
    safeAssetNo,
    safeAssetTypeId,
    safeZoneId,
    finalWardId: safeWardId,
    safeDepartmentId,
    safeOwnershipType,
    safeEncroachmentStatus,
    safeViewImageAssetId,
    safeExpandAssetId,
  };

  if (!isQueryCanonical({ ...query }, preFetchCanonicalParams)) {
    const normalizedQuery = buildCanonicalQuery(preFetchCanonicalParams);
    if (safeExpandAssetId) {
      if (safeSubPage && safeSubPage !== '1') normalizedQuery.set('subPage', safeSubPage);
      if (safeSubPageSize && safeSubPageSize !== '10') normalizedQuery.set('subPageSize', safeSubPageSize);
      if (safeSubSearch) normalizedQuery.set('subSearch', safeSubSearch);
    }
    const normalizedQueryString = normalizedQuery.toString();
    redirect(`/${locale}/assets/municipal-Asset/asset-register/${categoryId}${normalizedQueryString ? `?${normalizedQueryString}` : ''}`);
  }

  const [assetsResult, typesResult, zonesResult, wardsResult, departmentsResult, categoriesResult, ownershipResult] = await Promise.all([
    fetchAssetRegisterPage(
      parsed,
      safePage,
      safePageSize,
      safeSearchField === 'all' ? safeSearch : '',
      safeAssetTypeId === 'all' ? null : safeAssetTypeId,
      safeZoneId === 'all' ? null : Number(safeZoneId),
      safeWardId === 'all' ? null : Number(safeWardId),
      safeDepartmentId === 'all' ? null : Number(safeDepartmentId),
      (safeSearchField === 'assetId' && safeSearch) ? safeSearch : safeAssetNo,
      safeSearchField === 'assetName' ? safeSearch : '',
      safeSearchField === 'address' ? safeSearch : '',
      safeOwnershipType,
      safeEncroachmentStatus
    ),
    fetchAssetTypesByCategory(parsed),
    fetchZones(),
    fetchWards(safeZoneId),
    fetchDepartments(),
    fetchCategories(),
    fetchOwnershipTypes(),
  ]);

  const categoryName = categoriesResult.find((category) => Number(category.id) === parsed)?.label ?? null;

  if (assetsResult.error) {
    throw new Error(assetsResult.error);
  }

  if (categoryName === null) {
    notFound();
  }

  let finalWardId = safeWardId;
  if (safeZoneId !== 'all' && safeWardId !== 'all') {
    const ward = wardsResult.find((w) => String(w.id) === safeWardId);
    if (!ward || String(ward.zoneId) !== safeZoneId) {
      finalWardId = 'all';
    }
  }

  const totalPages = Math.max(1, Math.ceil(assetsResult.totalCount / safePageSize));
  let finalPage = safePage;
  if (safePage > totalPages) {
    finalPage = totalPages;
  }

  // Re-run canonicalization if page was clamped or ward was reset so URL is updated and corrected page data is loaded
  if (finalPage !== safePage || finalWardId !== safeWardId) {
    const postFetchCanonicalParams = {
      ...preFetchCanonicalParams,
      finalPage,
      finalWardId,
    };
    const normalizedQuery = buildCanonicalQuery(postFetchCanonicalParams);
    if (safeExpandAssetId) {
      if (safeSubPage && safeSubPage !== '1') normalizedQuery.set('subPage', safeSubPage);
      if (safeSubPageSize && safeSubPageSize !== '10') normalizedQuery.set('subPageSize', safeSubPageSize);
      if (safeSubSearch) normalizedQuery.set('subSearch', safeSubSearch);
    }
    const normalizedQueryString = normalizedQuery.toString();
    redirect(`/${locale}/assets/municipal-Asset/asset-register/${categoryId}${normalizedQueryString ? `?${normalizedQueryString}` : ''}`);
  }

  // Pre-validate safeExpandAssetId against parent assets
  let isExpandValid = false;
  if (safeExpandAssetId) {
    isExpandValid = assetsResult.items.some((item) => String(item.id) === safeExpandAssetId);
    if (!isExpandValid) {
      // expandAssetId does not belong to the current page rows, redirect to strip it
      const strippedParams = { ...preFetchCanonicalParams, safeExpandAssetId: undefined };
      const normalizedQuery = buildCanonicalQuery(strippedParams).toString();
      redirect(`/${locale}/assets/municipal-Asset/asset-register/${categoryId}${normalizedQuery ? `?${normalizedQuery}` : ''}`);
    }
  }

  let initialSubunitData = null;
  if (isExpandValid && safeExpandAssetId) {
    const subPageNum = safeSubPage ? Number(safeSubPage) : 1;
    const subPageSizeNum = safeSubPageSize ? Number(safeSubPageSize) : 10;
    const subunitResponse = await fetchSubUnitsByAsset(
      Number(safeExpandAssetId),
      subPageNum,
      subPageSizeNum,
      safeSubSearch
    );
    if (subunitResponse) {
      const subTotalPages = Math.max(1, subunitResponse.totalPages ?? Math.ceil(subunitResponse.totalCount / subPageSizeNum));
      const finalSubPage = Math.min(subPageNum, subTotalPages);

      if (finalSubPage !== subPageNum) {
        const normalizedQuery = buildCanonicalQuery(preFetchCanonicalParams);
        normalizedQuery.set('subPage', String(finalSubPage));
        if (safeSubPageSize && safeSubPageSize !== '10') normalizedQuery.set('subPageSize', safeSubPageSize);
        if (safeSubSearch) normalizedQuery.set('subSearch', safeSubSearch);
        const normalizedQueryString = normalizedQuery.toString();
        redirect(`/${locale}/assets/municipal-Asset/asset-register/${categoryId}${normalizedQueryString ? `?${normalizedQueryString}` : ''}`);
      }
    }
    if (subunitResponse && subunitResponse.items) {
      initialSubunitData = {
        parentId: Number(safeExpandAssetId),
        items: subunitResponse.items,
        meta: {
          totalCount: subunitResponse.totalCount,
          totalPages: subunitResponse.totalPages,
          pageNumber: subunitResponse.pageNumber,
          pageSize: subunitResponse.pageSize,
        },
      };
    }
  }

  return (
    <AssetRegisterView
      locale={locale}
      categoryId={parsed}
      categoryName={categoryName}
      safeSearch={safeSearch}
      safeSearchField={safeSearchField}
      AssetNo={safeAssetNo}
      AssetTypeId={safeAssetTypeId}
      ZoneId={safeZoneId}
      WardId={finalWardId}
      DepartmentId={safeDepartmentId}
      ownershipType={safeOwnershipType}
      encroachmentStatus={safeEncroachmentStatus}
      safePageSize={safePageSize}
      finalPage={finalPage}
      totalPages={totalPages}
      assetsResult={assetsResult}
      typesResult={typesResult}
      zonesResult={zonesResult}
      wardsResult={wardsResult}
      departmentsResult={departmentsResult}
      ownershipResult={ownershipResult}
      updatedDate={updatedDate}
      categoryOptions={categoriesResult}
      initialSubunitData={initialSubunitData}
    />
  );
}
