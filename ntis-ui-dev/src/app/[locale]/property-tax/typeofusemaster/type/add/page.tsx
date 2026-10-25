import UseTypeForm from "@/components/modules/property-tax/typeofusemaster/UseTypeForm";
import { getTypeOfUseMasterData, getAllUseCategories } from "../../actions";

// Force this page to be dynamic (don't pre-render at build time)
export const dynamic = 'force-dynamic';

export default async function AddTypePage() {
  // Fetch groups, types, and categories for dropdown and duplicate checking
  const [masterData, categoriesResp] = await Promise.all([
    getTypeOfUseMasterData(),
    getAllUseCategories(),
  ]);

  return (
    <>
      <UseTypeForm
        id={null}
        allGroups={masterData.groups || []}
        allTypes={masterData.types || []}
        allCategories={categoriesResp.items || []}
      />
    </>
  );
}
