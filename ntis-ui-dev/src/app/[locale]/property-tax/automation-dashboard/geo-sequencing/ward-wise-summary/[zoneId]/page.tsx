
import { GeoSequencingWardWiseDashboard } from "@/components/modules/property-tax/automation-dashboard/GeoSequencing/ward-wise-summary/WardWisedashboard";
import { getWardWiseSummaryAction } from "../../action";
import { getPropertyTypeMasterAction } from "../../../property-details-dashboard/[zoneId]/action";
interface WardWiseSummaryPageProps {
    params: Promise<{
        zoneId: string;
        locale: string;
    }>;
    searchParams: Promise<{
        workflowStageId?: string;
        propertyTypeId?: string;
        propertyTypeCategoryId?: string;
        pageNumber?: string;
        pageSize?: string;
        isFilter?: string;
    }>;
}

export default async function WardWiseSummaryPage({ params, searchParams }: WardWiseSummaryPageProps) {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;
    const { zoneId } = resolvedParams;
    const { workflowStageId, propertyTypeId, propertyTypeCategoryId } = resolvedSearchParams;
    const pageNumber = resolvedSearchParams.pageNumber ? parseInt(resolvedSearchParams.pageNumber) : 1;
    const pageSize = resolvedSearchParams.pageSize ? parseInt(resolvedSearchParams.pageSize) : 10;

    const isFilterOpen = resolvedSearchParams.isFilter === 'true';

    const [summaryResponse, propertyTypeResult] = await Promise.all([
        getWardWiseSummaryAction(zoneId, workflowStageId, pageNumber, pageSize, propertyTypeId, propertyTypeCategoryId),
        isFilterOpen ? getPropertyTypeMasterAction(1, -1) : Promise.resolve({ success: true, data: null })
    ]);

    const summaryData = summaryResponse.success ? summaryResponse.data : null;

    return (
        <>
            <GeoSequencingWardWiseDashboard
                zoneId={zoneId}
                summaryData={summaryData}
                propertyDescriptions={propertyTypeResult?.data ?? []}
            />
        </>
    );
}
