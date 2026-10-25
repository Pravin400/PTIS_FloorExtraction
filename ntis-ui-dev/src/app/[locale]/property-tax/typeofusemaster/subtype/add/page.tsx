import UseSubTypeForm from "@/components/modules/property-tax/typeofusemaster/UseSubTypeForm";
import { getTypeById, getAllSubTypes, getAllUseCategories } from "../../actions";
import type { UseSubType } from "@/types/typeOfUse.types";

// Force this page to be dynamic (don't pre-render at build time)
export const dynamic = 'force-dynamic';

export default async function AddSubTypePage({
  searchParams,
}: {
  searchParams: Promise<{ typeId?: string }>;
}) {
  const params = await searchParams;
  const typeId = Number(params.typeId || 0);

  // Fetch type info and all subtypes for duplicate checking if typeId is provided
  let typeInfo = null;
  let allSubTypes: UseSubType[] = [];

  const categoriesResp = await getAllUseCategories();

  if (typeId > 0) {
    const [typeData, allSubTypesData] = await Promise.all([
      getTypeById(typeId),
      getAllSubTypes(typeId),
    ]);
    typeInfo = typeData;
    allSubTypes = allSubTypesData.items || [];
  }

  return (
    <>
      <UseSubTypeForm
        id={null}
        typeInfo={typeInfo}
        allSubTypes={allSubTypes}
        allCategories={categoriesResp.items || []}
      />
    </>
  );
}
