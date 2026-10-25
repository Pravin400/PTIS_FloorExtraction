/**
 * Grievance Category Master Page (Server Component)
 * Fetches data server-side and passes to client components
 */

import type { ReactElement } from 'react';
import { Suspense } from 'react';
import {
  GrievanceCategoryMaster,
  GrievanceCategoryFormServer,
  GrievanceCategoryDrawerClient,
} from '@/components/modules/configuration-settings/grievance-category-master';
import { locales } from '@/i18n/config';
import { notFound, redirect } from 'next/navigation';
import { getGrievanceCategoryById } from '@/lib/api/configuration-settings/grievance-category-master/grievanceCategory.service';

import { getGrievanceCategoryMasterData } from './data-fetcher';
import { buildMasterUrl, normalizeMasterSearchParams } from './search-params';

function MasterPageLoadingFallback(): ReactElement {
  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="px-1 sm:px-3 md:px-4 lg:px-6 py-2 md:py-4 w-full space-y-6">
        <div className="h-24 bg-white rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-white rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function GrievanceCategoryMasterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<ReactElement> {
  const { locale } = await params;
  const sParams = await searchParams;
  const normalizedSearchParams = normalizeMasterSearchParams(sParams);

  if (!locales.includes(locale as (typeof locales)[number])) {
    notFound();
  }

  // Early validation BEFORE fetching data - avoid unnecessary API calls
  const hasPageParam = normalizedSearchParams.page !== undefined;
  const hasPageSizeParam = normalizedSearchParams.pageSize !== undefined;
  const needsPageParam = !hasPageParam;
  const needsPageSizeParam = !hasPageSizeParam;

  // If critical params are missing, redirect early (before API call)
  if (needsPageParam || needsPageSizeParam) {
    const requestedPageSize = hasPageSizeParam
      ? parseInt(normalizedSearchParams.pageSize as string, 10)
      : 10;

    redirect(
      buildMasterUrl(locale, {
        ...normalizedSearchParams,
        page: '1',
        pageSize: String(requestedPageSize || 10),
      })
    );
  }

  let data = null;
  let fetchError: string | undefined;
  let statusCode: number | undefined;

  try {
    data = await getGrievanceCategoryMasterData(normalizedSearchParams);
  } catch (error) {
    const { ApiError } = await import('@/lib/utils/api');
    if (error instanceof ApiError) {
      statusCode = error.statusCode;
      if (error.statusCode === 401) {
        redirect(`/${locale}/login`);
      }
      fetchError = error.responseText || error.message;
    } else {
      fetchError = error instanceof Error ? error.message : String(error);
    }
  }

  const pagedData = data?.pagedData ?? [];
  const departments = data?.departments ?? [];
  const stats = data?.stats ?? { total: 0, avgSla: 0, active: 0, critical: 0 };
  const pageSize = data?.pageSize ?? 10;
  const page = data?.page ?? 1;
  const totalCount = data?.totalCount ?? 0;
  const search = data?.search ?? '';

  if (data) {
    // Additional validation after fetch - page out of bounds check
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const requestedPage = parseInt(normalizedSearchParams.page as string, 10);
    const requestedPageSize = parseInt(normalizedSearchParams.pageSize as string, 10);

    // Check if page is out of bounds or pageSize mismatch
    const pageOutOfBounds = requestedPage < 1 || (totalCount > 0 && requestedPage > totalPages);
    const pageSizeMismatch = requestedPageSize !== pageSize;

    if (pageOutOfBounds || pageSizeMismatch) {
      // Determine the correct page number
      const validPage = pageOutOfBounds
        ? Math.max(1, Math.min(requestedPage, totalPages))
        : requestedPage;

      redirect(
        buildMasterUrl(locale, {
          ...normalizedSearchParams,
          page: String(validPage),
          pageSize: String(pageSize),
        })
      );
    }
  }

  // Clean path to return to when closing drawer
  const returnPath = buildMasterUrl(locale, {
    ...normalizedSearchParams,
    page: String(page),
    pageSize: String(pageSize),
    drawer: undefined,
    id: undefined,
  });

  // Handle drawer server-side rendering
  let drawerElement = null;
  const activeDrawer = normalizedSearchParams.drawer;

  if (activeDrawer === 'add') {
    drawerElement = (
      <GrievanceCategoryDrawerClient returnPath={returnPath}>
        <GrievanceCategoryFormServer
          editingCategory={null}
          departments={departments}
          locale={locale}
          returnPath={returnPath}
        />
      </GrievanceCategoryDrawerClient>
    );
  } else if (activeDrawer === 'edit') {
    const rawId = normalizedSearchParams.id;
    const editId = rawId ? parseInt(rawId, 10) : NaN;
    if (!Number.isNaN(editId) && editId > 0) {
      const categoryRes = await getGrievanceCategoryById(editId);
      if (categoryRes && categoryRes.success && categoryRes.data) {
        drawerElement = (
          <GrievanceCategoryDrawerClient isEdit returnPath={returnPath}>
            <GrievanceCategoryFormServer
              editingCategory={categoryRes.data}
              departments={departments}
              locale={locale}
              returnPath={returnPath}
            />
          </GrievanceCategoryDrawerClient>
        );
      }
    }
  }

  return (
    <Suspense fallback={<MasterPageLoadingFallback />}>
      <div className="h-full">
        <GrievanceCategoryMaster
          locale={locale}
          data={pagedData}
          departments={departments}
          stats={stats}
          pageSize={pageSize}
          page={page}
          totalCount={totalCount}
          initialSearch={search ?? ''}
          initialDepartment={normalizedSearchParams.department ?? 'all'}
          initialStatus={normalizedSearchParams.status ?? 'all'}
          fetchError={fetchError}
          statusCode={statusCode}
        >
          {drawerElement}
        </GrievanceCategoryMaster>
      </div>
    </Suspense>
  );
}
