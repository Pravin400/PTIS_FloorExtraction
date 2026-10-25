import { BuildingWiseTracking } from "@/components/modules/property-tax/automation-dashboard/ApprovalByULB/Building-wise-Property/Building-wise-PropertyTracking/BuildingWiseTracking";
import { getPropertyTrackingStageStatus } from "@/lib/api/automation-dashboard/property-dashboard/property-subgrid-details.service";
import { PropertyTrackingStageStatusItem } from "@/types/automation-dashboard/property-dashboard/property-subgrid-details.type";
import { getTranslations } from "next-intl/server";

interface PageProps {
    params: Promise<{
        propertyId: string;
    }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const readStringParam = (value: string | string[] | undefined): string | undefined => {
    if (Array.isArray(value)) return value[0];
    return value;
};

export default async function Page({ params, searchParams }: PageProps) {
    const { propertyId } = await params;
    const query = await searchParams;
    const t = await getTranslations("automationDashboard");

    let initialStageItems: PropertyTrackingStageStatusItem[] = [];
    let initialError: string | null = null;

    try {
        initialStageItems = (await getPropertyTrackingStageStatus(propertyId)) || [];
    } catch (error) {
        initialError = error instanceof Error ? error.message : (t("errors.fetchPropertyTrackingStatus") || "Failed to fetch tracking status");
    }

    const propertyNo = readStringParam(query.propertyNo) || propertyId;
    const ownerName = readStringParam(query.ownerName) || "-";

    return (
        <BuildingWiseTracking
            propertyId={propertyId}
            propertyNo={propertyNo}
            ownerName={ownerName}
            initialStageItems={initialStageItems}
            initialError={initialError}
        />
    );
}
