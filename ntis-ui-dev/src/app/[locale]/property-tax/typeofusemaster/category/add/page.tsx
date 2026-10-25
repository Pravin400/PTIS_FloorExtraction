import UseCategoryForm from "@/components/modules/property-tax/typeofusemaster/UseCategoryForm";
import { getAllUseCategories } from "../../actions";

export const dynamic = 'force-dynamic';

export default async function AddCategoryPage() {
  const categoriesResp = await getAllUseCategories();
  
  return (
    <UseCategoryForm 
      id={null} 
      allCategories={categoriesResp.items || []}
    />
  );
}
