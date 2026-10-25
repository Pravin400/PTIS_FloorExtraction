import UseGroupForm from "@/components/modules/property-tax/typeofusemaster/UseGroupForm";
import { getTypeOfUseMasterData } from "../../actions";

// Force this page to be dynamic (don't pre-render at build time)
export const dynamic = 'force-dynamic';

export default async function AddGroupPage() {
  // Fetch groups for duplicate checking
  const masterData = await getTypeOfUseMasterData();
  
  return (
    <>
      <UseGroupForm 
        id={null} 
        allGroups={masterData.groups || []}
      />
    </>
  );
}
