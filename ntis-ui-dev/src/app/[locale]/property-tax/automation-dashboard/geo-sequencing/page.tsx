
import { redirect } from "next/navigation";
import GeoSequencingPage from "@/components/modules/property-tax/automation-dashboard/GeoSequencing/GeoSequencingPage";
import { getGeoSequencingGridAction } from "./action";
import { getAutomationWorkflowCardsAction } from "../action";
import { getPropertyTypeMasterAction } from "../property-details-dashboard/[zoneId]/action";

interface Props {
    searchParams: Promise<{ workflowStageId?: string; isFilter?: string; propertyTypeId?: string; propertyTypeCategoryId?: string; }>;
}

export default async function GeoSequencingPageServer({ searchParams }: Props) {
    const resolvedParams = await searchParams;
    let workflowStageId = resolvedParams?.workflowStageId;

    if (!workflowStageId) {
        const workflowCardsResult = await getAutomationWorkflowCardsAction();
        const geoCard = workflowCardsResult?.data?.find((card) => card.stageName === 'GeoSequencing');
        if (geoCard?.id) {
            workflowStageId = geoCard.id.toString();
            redirect(`?workflowStageId=${geoCard.id}`);
        }
    }

    const isFilterOpen = resolvedParams?.isFilter === 'true';
    const propertyTypeId = resolvedParams?.propertyTypeId;
    const propertyTypeCategoryId = resolvedParams?.propertyTypeCategoryId;

    const [dataResult, propertyTypeResult] = await Promise.all([
        getGeoSequencingGridAction(workflowStageId, propertyTypeId, propertyTypeCategoryId),
        isFilterOpen ? getPropertyTypeMasterAction(1, -1) : Promise.resolve({ success: true, data: null })
    ]);

    return (
        <GeoSequencingPage
            serverData={dataResult?.data ?? null}
            defaultWorkflowStageId={workflowStageId}
            propertyDescriptions={propertyTypeResult?.data ?? []}
        />
    );
}