
import ApprovalbyUlbDashboard from "@/components/modules/property-tax/automation-dashboard/ApprovalByULB/ApprovalbyUlbDashboard";
import { getApprovalByUlbGridDetailsAction, getExportPendingDataAction } from "./action";

interface Props {
    searchParams: Promise<{ signAuthorityId?: string; roleName?: string }>;
}

const page = async ({ searchParams }: Props) => {
    const resolvedParams = await searchParams;
    const signAuthorityId = resolvedParams?.signAuthorityId;
    const roleName = resolvedParams?.roleName;

    const [dataResult, exportResult] = await Promise.all([
        getApprovalByUlbGridDetailsAction(),
        signAuthorityId ? getExportPendingDataAction(signAuthorityId) : Promise.resolve(null)
    ]);

    return (
        <ApprovalbyUlbDashboard 
            serverData={dataResult.data} 
            exportData={exportResult?.data || null} 
            exportRoleName={roleName} 
        />
    )
}

export default page