import React from 'react';
import { OfficeMaster } from '@/components/modules/configuration-settings/office-master/OfficeMaster';
import { fetchOfficePagedServerAction, fetchOfficeStatsServerAction } from './action';
import { ApiError } from '@/lib/utils/api';
import type { Office } from '@/types/office.types';

// Cache page & stats count queries for 5 minutes (300 seconds) to lower DB load
export const revalidate = 300;

interface PageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    q?: string;
    sortBy?: string;
    sortOrder?: string;
    type?: string;
    status?: string;
  }>;
}

const ALLOWED_SORT_COLUMNS = ['officeCode', 'officeName', 'type'] as const;
const ALLOWED_SORT_ORDERS = ['asc', 'desc'] as const;

const MIN_PAGE = 1;
const MAX_PAGE = 10_000;
const MIN_PAGE_SIZE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

function sanitizeParams(raw: Awaited<PageProps['searchParams']>) {
  const rawPage = parseInt(raw.page ?? '', 10);
  const pageNumber = Number.isFinite(rawPage)
    ? Math.min(Math.max(rawPage, MIN_PAGE), MAX_PAGE)
    : MIN_PAGE;

  const rawPageSize = parseInt(raw.pageSize ?? '', 10);
  const pageSize = Number.isFinite(rawPageSize)
    ? Math.min(Math.max(rawPageSize, MIN_PAGE_SIZE), MAX_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE;

  const searchTerm = raw.q?.trim() || undefined;

  const sortByRaw = raw.sortBy?.trim() ?? '';
  const sortBy = (ALLOWED_SORT_COLUMNS as readonly string[]).includes(sortByRaw)
    ? (sortByRaw as (typeof ALLOWED_SORT_COLUMNS)[number])
    : undefined;

  const sortOrderRaw = raw.sortOrder?.trim().toLowerCase() ?? '';
  const sortOrder = (ALLOWED_SORT_ORDERS as readonly string[]).includes(sortOrderRaw)
    ? (sortOrderRaw as (typeof ALLOWED_SORT_ORDERS)[number])
    : undefined;

  const type = raw.type?.trim() || undefined;
  const status = raw.status?.trim() || undefined;

  return { pageNumber, pageSize, searchTerm, sortBy, sortOrder, type, status };
}

export default async function Page({ searchParams }: PageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const { pageNumber, pageSize, searchTerm, sortBy, sortOrder, type, status } =
    sanitizeParams(params);

  let fetchError: string | undefined;
  let statusCode: number | undefined;
  let result: {
    items: Office[];
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  } = {
    items: [],
    pageNumber,
    pageSize,
    totalCount: 0,
    totalPages: 0,
  };
  let stats: {
    headOfficesCount: number;
    activeOfficesCount: number;
    inactiveOfficesCount: number;
    error?: boolean;
  } = {
    headOfficesCount: 0,
    activeOfficesCount: 0,
    inactiveOfficesCount: 0,
    error: false,
  };

  try {
    const [fetchedResult, fetchedStats] = await Promise.all([
      fetchOfficePagedServerAction(
        pageNumber,
        pageSize,
        searchTerm,
        sortBy,
        sortOrder,
        type,
        status
      ),
      fetchOfficeStatsServerAction(),
    ]);
    result = fetchedResult;
    stats = fetchedStats;
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      statusCode = err.statusCode;
      fetchError = err.responseText || err.message;
    } else {
      fetchError = err instanceof Error ? err.message : String(err);
    }
  }

  return (
    <OfficeMaster
      data={result.items}
      pageNumber={result.pageNumber}
      pageSize={result.pageSize}
      totalCount={result.totalCount}
      totalPages={result.totalPages}
      sortBy={sortBy}
      sortOrder={sortOrder}
      type={type}
      status={status}
      headOfficesCount={stats.headOfficesCount}
      activeOfficesCount={stats.activeOfficesCount}
      inactiveOfficesCount={stats.inactiveOfficesCount}
      showStatsError={stats.error}
      fetchError={fetchError}
      statusCode={statusCode}
    />
  );
}
