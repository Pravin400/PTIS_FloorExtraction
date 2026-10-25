import React from "react";
import { AliasMaster } from "@/components/modules/configuration-settings/alias-master/AliasMaster";
import { fetchAliasMasterPagedServerAction, fetchAliasMasterCountsServerAction } from "./action";
import { sanitizeSearchParams, type RawSearchParams } from "@/lib/utils/sanitize-params";
import type { AliasMasterCounts } from "@/types/alias-master.types";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<RawSearchParams>;
}

const ALLOWED_SORT_COLUMNS = ["keyName", "labelName", "englishName"] as const;
const EMPTY_COUNTS: AliasMasterCounts = { totalCount: 0, activeCount: 0, inactiveCount: 0 };

export default async function Page({ searchParams }: PageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const { pageNumber, pageSize, searchTerm, sortBy, sortOrder } = sanitizeSearchParams(params, {
    allowedSortColumns: ALLOWED_SORT_COLUMNS,
  });

  const [result, counts] = await Promise.all([
    fetchAliasMasterPagedServerAction(pageNumber, pageSize, searchTerm, sortBy, sortOrder),
    fetchAliasMasterCountsServerAction().catch(() => EMPTY_COUNTS),
  ]);

  return (
    <AliasMaster
      data={result.items}
      pageNumber={result.pageNumber}
      pageSize={result.pageSize}
      totalCount={result.totalCount}
      totalPages={result.totalPages}
      counts={counts}
      sortBy={sortBy}
      sortOrder={sortOrder}
      searchTerm={searchTerm}
    />
  );
}
