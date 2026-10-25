import React from "react";
import { setRequestLocale } from "next-intl/server";
import {
  UserDepartmentAllocationMaster,
  ALLOWED_SORT_COLUMNS,
} from "@/components/modules/assets/configuration/master-data/user-department-allocation";
import { fetchAssetUsersPagedServerAction } from "./action";
import {
  sanitizeSearchParams,
  type RawSearchParams,
} from "@/lib/utils/sanitize-params";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<RawSearchParams>;
}

export default async function Page({
  params,
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const { locale } = await params;
  setRequestLocale(locale);

  const rawParams = await searchParams;
  const mappedParams = {
    ...rawParams,
    q:
      rawParams.q ||
      ((rawParams as Record<string, unknown>).search as string | undefined),
  };

  const { pageNumber, pageSize, searchTerm, sortBy, sortOrder } =
    sanitizeSearchParams(mappedParams, {
      allowedSortColumns: ALLOWED_SORT_COLUMNS,
    });

  const usersResult = await fetchAssetUsersPagedServerAction(
    pageNumber,
    pageSize,
    searchTerm,
    sortBy,
    sortOrder
  );

  return (
    <UserDepartmentAllocationMaster
      data={usersResult.items}
      pageNumber={usersResult.pageNumber}
      pageSize={usersResult.pageSize}
      totalCount={usersResult.totalCount}
      totalPages={usersResult.totalPages}
      searchTerm={searchTerm}
      sortBy={sortBy}
      sortOrder={sortOrder}
    />
  );
}
