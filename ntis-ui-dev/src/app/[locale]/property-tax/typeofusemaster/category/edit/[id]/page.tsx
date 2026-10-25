import UseCategoryForm from "@/components/modules/property-tax/typeofusemaster/UseCategoryForm";
import { getCategoryById, getAllUseCategories } from "../../../actions";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const [categoryData, categoriesResp] = await Promise.all([
    getCategoryById(id),
    getAllUseCategories(),
  ]);
  
  if (!categoryData) {
    notFound();
  }
  
  return (
    <UseCategoryForm 
      id={Number(id)} 
      initialData={categoryData}
      allCategories={categoriesResp.items || []}
    />
  );
}
