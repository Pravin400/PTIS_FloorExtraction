import { getUseCategoriesPagedServer } from "@/lib/api/typeofusemaster.service";
import CategoryListDrawer from "@/components/modules/property-tax/typeofusemaster/CategoryListDrawer";

export const dynamic = 'force-dynamic';

export default async function CategoryListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
}) {
  const { q, page, pageSize } = await searchParams;
  
  const pageNumber = page ? parseInt(page, 10) : 1;
  const size = pageSize ? parseInt(pageSize, 10) : 10;
  
  const categoriesResp = await getUseCategoriesPagedServer({
    searchTerm: q,
    pageNumber,
    pageSize: size
  });
  
  return (
    <CategoryListDrawer 
      categories={categoriesResp.items || []} 
      totalCount={categoriesResp.totalCount || 0}
      pageNumber={pageNumber}
      pageSize={size}
    />
  );
}
