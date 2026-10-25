

import WardWiseDashboard from "@/components/modules/property-tax/automation-dashboard/ApprovalByULB/ward-wise-summary/WardWiseDashboard";
import { getWardWiseApprovalByUlbGridDetailsAction } from "../../action";

interface WardWisePageProps {
    params: Promise<{
        zoneId: string;
    }>;
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function WardWisePage({ params, searchParams }: WardWisePageProps) {
    const resolvedParams = await params;
    const { zoneId } = resolvedParams;
    const resolvedSearchParams = await searchParams;
    
    const pageNumber = Number(resolvedSearchParams?.pageNumber) || 1;
    const pageSize = Number(resolvedSearchParams?.pageSize) || 10;

    const summaryResponse = await getWardWiseApprovalByUlbGridDetailsAction(zoneId, pageNumber, pageSize);

    const serverData = summaryResponse.success && summaryResponse.data ? summaryResponse.data : null;

    return (
        <>
            <WardWiseDashboard
                zoneId={zoneId}
                serverData={serverData}
            />
        </>
    )
}