import { ConnectionTypeMaster } from "@/components/modules/water-bill/connection-type-master";
import { getConnectionTypePagedAction } from "@/app/[locale]/water-bill/connection-type-master/actions";

export const dynamic = "force-dynamic";

interface PageProps {
  readonly searchParams: Promise<{
    q?: string;
    page?: string;
    pageSize?: string;
    status?: string;
  }>;
}

export default async function ConnectionTypePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const pageNumber = Number(params?.page) || 1;
  const pageSize = Number(params?.pageSize) || 10;
  const searchTerm = params?.q || "";
  const statusFilter = params?.status || "all";

  const initialData = await getConnectionTypePagedAction(
    pageNumber,
    pageSize,
    searchTerm,
    statusFilter
  );

  return <ConnectionTypeMaster data={initialData} />;
}
