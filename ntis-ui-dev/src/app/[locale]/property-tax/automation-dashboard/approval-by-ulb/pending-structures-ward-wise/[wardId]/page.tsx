
import PendingStructuresWardWise from "@/components/modules/property-tax/automation-dashboard/ApprovalByULB/PendingStructuresDashboard/PendingStructuresWardWise";
import { getBuildingWiseDataAction } from "../../action";

interface PendingStructuresPageProps {
    params: Promise<{
        wardId: string;
    }>;
    searchParams: Promise<{
        workflowStageId?: string;
        pageNumber?: string;
        pageSize?: string;
    }>;
}

export default async function PendingStructuresWardWisePage({ params, searchParams }: PendingStructuresPageProps) {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;

    const { wardId } = resolvedParams;
    const workflowStageId = resolvedSearchParams.workflowStageId || "";
    const pageNumber = resolvedSearchParams.pageNumber ? parseInt(resolvedSearchParams.pageNumber) : 1;
    const pageSize = resolvedSearchParams.pageSize ? parseInt(resolvedSearchParams.pageSize) : 10;

    const summaryResponse = await getBuildingWiseDataAction(wardId, workflowStageId, pageNumber, pageSize);
    const serverData = summaryResponse.success && summaryResponse.data ? summaryResponse.data : null;

    return (
        <PendingStructuresWardWise wardId={wardId} serverData={serverData} />
    );
}
