import UseGroupForm from "@/components/modules/property-tax/typeofusemaster/UseGroupForm";
import { getGroupById, getTypeOfUseMasterData } from "../../../actions";
import { notFound } from "next/navigation";

// Force this page to be dynamic (don't pre-render at build time)
export const dynamic = 'force-dynamic';

export default async function EditUseGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  // Fetch data server-side
  const [groupData, masterData] = await Promise.all([
    getGroupById(id),
    getTypeOfUseMasterData(),
  ]);
  
  if (!groupData) {
    notFound();
  }
  
  return (
    <>
      <UseGroupForm 
        id={id} 
        initialData={groupData}
        allGroups={masterData.groups || []}
      />
    </>
  );
}