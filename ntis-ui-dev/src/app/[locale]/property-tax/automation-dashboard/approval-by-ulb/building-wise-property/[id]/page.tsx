import { getPropertyWiseDataAction } from "../../action";
import BuildingwiseProperty from "@/components/modules/property-tax/automation-dashboard/ApprovalByULB/Building-wise-Property/BuildingwiseProperty";

interface BuildingWisePropertyPageProps {
    params: Promise<{
        id: string;
    }>;
    searchParams: Promise<{
        pageNumber?: string;
        pageSize?: string;
        searchTerm?: string;
    }>;
}

export default async function BuildingWisePropertyPage({ params, searchParams }: BuildingWisePropertyPageProps) {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;

    const propertyNo = resolvedParams.id;
    const pageNumber = resolvedSearchParams.pageNumber ? parseInt(resolvedSearchParams.pageNumber) : 1;
    const pageSize = resolvedSearchParams.pageSize ? parseInt(resolvedSearchParams.pageSize) : 10;
    const searchTerm = resolvedSearchParams.searchTerm;

    const summaryResponse = await getPropertyWiseDataAction(propertyNo, pageNumber, pageSize, searchTerm);
    const serverData = summaryResponse.success && summaryResponse.data ? summaryResponse.data : null;
    
    return (
        <BuildingwiseProperty propertyNo={propertyNo} serverData={serverData} />
    );
}