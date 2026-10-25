import React from "react";
import { GapAnalysisView } from "@/components/modules/property-tax/PropertyMedia/GapAnalysisView/GapAnalysisView";
import {
    fetchWorkflowStageOptionsAction,
    fetchZoneOptionsAction,
    fetchPropertyTypeOptionsAction,
    fetchWardOptionsAction,
    fetchMissingPropertiesAction,
} from "../../action";
import {
    mapWorkflowStagesToOptions,
    mapZonesToOptions,
    mapPropertyTypesToOptions,
    mapWardsToOptions,
} from "@/lib/utils/PropertyMedia/propertyMediaHelper";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
    searchParams: Promise<{
        page?: string;
        pageSize?: string;
        q?: string;
        workflowStageId?: string;
        wardId?: string;
        divisionId?: string;
        propertyTypeId?: string;
    }>;
}

export default async function Page({ params, searchParams }: PageProps): Promise<React.ReactElement> {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;
    const photoTypeId = resolvedParams.id;
    const divisionId = resolvedSearchParams.divisionId;
    const pageNumber = resolvedSearchParams.page ? parseInt(resolvedSearchParams.page, 10) : 1;
    const pageSize = resolvedSearchParams.pageSize ? parseInt(resolvedSearchParams.pageSize, 10) : 10;

    const [workflowStageOptions, zoneOptions, propertyTypeOptions, wardOptions, missingPropertyTableData] = await Promise.all([
        fetchWorkflowStageOptionsAction(),
        fetchZoneOptionsAction(),
        fetchPropertyTypeOptionsAction(),
        divisionId ? fetchWardOptionsAction(divisionId) : Promise.resolve(null),
        fetchMissingPropertiesAction({
            photoTypeId: photoTypeId,
            pageNumber: pageNumber,
            pageSize: pageSize,
            searchTerm: resolvedSearchParams.q,
            zoneId: divisionId,
            wardId: resolvedSearchParams.wardId,
            workflowStageId: resolvedSearchParams.workflowStageId,
            propertyTypeId: resolvedSearchParams.propertyTypeId,
        }),
    ]);

    const mappedWorkflowStageOptions = workflowStageOptions ? mapWorkflowStagesToOptions(workflowStageOptions) : [];
    const mappedDivisionOptions = zoneOptions ? mapZonesToOptions(zoneOptions) : [];
    const mappedPropertyTypeOptions = propertyTypeOptions ? mapPropertyTypesToOptions(propertyTypeOptions) : [];
    const mappedWardOptions = wardOptions ? mapWardsToOptions(wardOptions) : [];

    return (
        <GapAnalysisView
            workflowStageOptions={mappedWorkflowStageOptions}
            divisionOptions={mappedDivisionOptions}
            propertyTypeOptions={mappedPropertyTypeOptions}
            wardOptions={mappedWardOptions}
            missingPropertyTableData={missingPropertyTableData}
        />
    );
}

