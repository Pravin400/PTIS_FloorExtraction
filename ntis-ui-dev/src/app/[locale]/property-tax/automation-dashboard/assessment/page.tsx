
import AssessmentDetails from "@/components/modules/property-tax/automation-dashboard/Assessment/AssessmentDetails";
import { getAssessmentGridAction } from "./action";
import { getPropertyTypeMasterAction } from "../property-details-dashboard/[zoneId]/action";

interface PageProps {
  searchParams: Promise<{ 
    workflowStageId?: string; 
    type?: string;
    propertyTypeId?: string;
    PropertyTypeCategoryId?: string;
    propertyTypeCategoryId?: string;
  }>;
}

const page = async ({ searchParams }: PageProps) => {
  const params = await searchParams;

  const workflowStageId = params.workflowStageId;
  const type = params.type as "Total" | "Assessed" | "Unassessed" | "Rented" || "Total";
  
  const propertyTypeId = params.propertyTypeId;
  const propertyTypeCategoryId = params.PropertyTypeCategoryId || params.propertyTypeCategoryId;

  const [data, propertyType] = await Promise.all([
    getAssessmentGridAction(workflowStageId, type, propertyTypeId, propertyTypeCategoryId),
    getPropertyTypeMasterAction(1, -1)
  ]);

  return (
    <AssessmentDetails 
      serverData={data.data} 
      propertyDescriptions={propertyType?.data || undefined}
    />
  )
}

export default page