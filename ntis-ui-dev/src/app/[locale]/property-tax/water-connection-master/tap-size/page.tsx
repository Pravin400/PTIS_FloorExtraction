
import { fetchTapSizePagedAction } from "@/app/[locale]/property-tax/water-connection-master/actions";
import { TapSizeMaster } from "@/components/modules/property-tax/WaterConnectionMaster";

export const dynamic = "force-dynamic";

interface PageProps {
  readonly searchParams: Promise<{
    page?: string;
    pageSize?: string;
    q?: string;
  }>;
}

export default async function TapSizePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const pageNumber = Math.max(1, Number(params?.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(params?.pageSize) || 10));
  const searchTerm = params?.q ?? "";

  const result = await fetchTapSizePagedAction(pageNumber, pageSize, searchTerm);

  return (
    
      <TapSizeMaster data={result} />
    
  );
}
