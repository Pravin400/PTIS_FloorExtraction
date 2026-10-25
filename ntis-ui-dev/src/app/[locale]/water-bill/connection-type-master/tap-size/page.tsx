import { TapSizeMaster } from "@/components/modules/water-bill/tap-size-master";
import { getTapSizePagedAction } from "@/app/[locale]/water-bill/tap-size-master/actions";

export const dynamic = "force-dynamic";

interface PageProps {
  readonly searchParams: Promise<{
    q?: string;
    page?: string;
    pageSize?: string;
    status?: string;
  }>;
}

export default async function TapSizePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const pageNumber = Number(params?.page) || 1;
  const pageSize = Number(params?.pageSize) || 10;
  const searchTerm = params?.q || "";
  const statusFilter = params?.status || "all";

  const initialData = await getTapSizePagedAction(
    pageNumber,
    pageSize,
    searchTerm,
    statusFilter
  );

  return <TapSizeMaster data={initialData} />;
}
