
import UseSubTypeForm from "@/components/modules/property-tax/typeofusemaster/UseSubTypeForm";
import { getSubTypeById, getTypeById, getAllSubTypes, getAllUseCategories } from "../../../actions";
import { notFound } from "next/navigation";

// Force this page to be dynamic (don't pre-render at build time)
export const dynamic = 'force-dynamic';

export default async function EditSubTypePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch subtype data first
  const subTypeData = await getSubTypeById(id);

  if (!subTypeData) {
    notFound();
  }

  // Fetch related type info, all subtypes, and categories
  const [typeInfo, allSubTypesData, categoriesResp] = await Promise.all([
    getTypeById(subTypeData.typeOfUseId),
    getAllSubTypes(subTypeData.typeOfUseId),
    getAllUseCategories(),
  ]);

  return (
    <>
      <UseSubTypeForm
        id={id}
        initialData={subTypeData}
        typeInfo={typeInfo}
        allSubTypes={allSubTypesData.items || []}
        allCategories={categoriesResp.items || []}
      />
    </>
  );
}


