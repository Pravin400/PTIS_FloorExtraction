import { ConnectionCategoryMaster } from "@/components/modules/water-bill/connection-category-master";
import { getConnectionCategoryPagedAction } from "@/app/[locale]/water-bill/connection-category-master/actions";

export const dynamic = "force-dynamic";

interface PageProps {
  readonly searchParams: Promise<{
    q?: string;
    page?: string;
    pageSize?: string;
    status?: string;
    metered?: string;
  }>;
}

export default async function ConnectionCategoryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const pageNumber = Number(params?.page) || 1;
  const pageSize = Number(params?.pageSize) || 10;
  const searchTerm = params?.q || "";
  const statusFilter = params?.status || "all";
  const meteredFilter = params?.metered || "all";

  const initialData = await getConnectionCategoryPagedAction(
    pageNumber,
    pageSize,
    searchTerm,
    statusFilter,
    meteredFilter
  );

  return <ConnectionCategoryMaster data={initialData} />;
}
