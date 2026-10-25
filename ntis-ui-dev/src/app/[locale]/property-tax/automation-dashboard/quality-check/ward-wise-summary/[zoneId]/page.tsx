import DataEntryWardWisedashboard from "@/components/modules/property-tax/automation-dashboard/DataEntryQualityCheck/ward-wise-summary/DataEntryWardWisedashboard";
import { getDataEntryWardWiseSummaryAction } from "../../action";
import { getPropertyTypeMasterAction } from "../../../assessment/action";
import { PropertyTypeMasterItem } from '@/types/automation-dashboard/property-dashboard/property-subgrid-details.type';

interface WardWiseSummaryPageProps {
    params: Promise<{
        zoneId: string;
        locale: string;
    }>;
    searchParams: Promise<{
        workflowStageId?: string;
        pageNumber?: string;
        pageSize?: string;
        isFilter?: string;
        propertyTypeId?: string;
        propertyTypeCategoryId?: string;
    }>;
}

export default async function QualityCheckWardWiseSummaryPage({ params, searchParams }: WardWiseSummaryPageProps) {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;
    const { zoneId } = resolvedParams;
    const { workflowStageId, propertyTypeId, propertyTypeCategoryId } = resolvedSearchParams;
    const pageNumber = resolvedSearchParams.pageNumber ? parseInt(resolvedSearchParams.pageNumber) : 1;
    const pageSize = resolvedSearchParams.pageSize ? parseInt(resolvedSearchParams.pageSize) : 10;

    const summaryResponse = await getDataEntryWardWiseSummaryAction(zoneId, workflowStageId, pageNumber, pageSize, propertyTypeId, propertyTypeCategoryId);
    const summaryData = summaryResponse.success ? (summaryResponse.data ?? null) : null;

    let propertyDescriptions: PropertyTypeMasterItem[] = [];
    if (resolvedSearchParams.isFilter === 'true') {
        const descResponse = await getPropertyTypeMasterAction();
        if (descResponse.success && descResponse.data) {
            propertyDescriptions = descResponse.data;
        }
    }

    return (
        <>
            <DataEntryWardWisedashboard 
                zoneId={zoneId} 
                summaryData={summaryData} 
                propertyDescriptions={propertyDescriptions}
            />
        </>
    );
}