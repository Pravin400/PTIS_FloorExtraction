import DepreciationMaster from "@/components/modules/property-tax/depreciation-master/DepreciationMaster";
import { fetchRangesPagedServerAction } from "./actions";
import { getTranslations } from 'next-intl/server';
import { unstable_noStore as noStore } from "next/cache";

interface PageProps {
  readonly params: Promise<{ locale: string }>;
  readonly searchParams: Promise<{
    page?: string;
    pageSize?: string;
  }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  noStore();
  
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;


  const parsedPageNumber = Number(resolvedSearchParams?.page);
  const parsedPageSize = Number(resolvedSearchParams?.pageSize);
  const pageNumber = Number.isInteger(parsedPageNumber) && parsedPageNumber > 0 ? parsedPageNumber : 1;
  const pageSize = Number.isInteger(parsedPageSize) && parsedPageSize > 0 ? parsedPageSize : 10;

  // Fetch paginated records data (server-side record-level pagination)
  const res = await fetchRangesPagedServerAction(pageNumber, pageSize);
  
  if (!res.success || !res.data) {
    const t = await getTranslations('depreciation.depreciationMaster.errors');
    throw new Error(t('load'));
  }

  return (
    <DepreciationMaster
      data={res.data.rows}
      allRanges={res.data.allRanges}
      constructionTypes={res.data.constructionTypes}
      pageNumber={res.data.pageNumber}
      pageSize={res.data.pageSize}
      totalCount={res.data.totalRanges}
      totalPages={res.data.totalPages}
      locale={locale}
    />
  );
}