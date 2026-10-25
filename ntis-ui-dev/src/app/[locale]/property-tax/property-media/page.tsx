import React from "react";
import { sanitizeSearchParams } from "@/lib/utils/sanitize-params";
import {PropertyMediaSearchParams} from "@/types/PropertyMedia/PropertyMedia.types"
import { PropertyMediaHeader } from "@/components/modules/property-tax/PropertyMedia/PropertyMediaHeader";
import { SummaryCards } from "@/components/modules/property-tax/PropertyMedia/SummaryCards";
import { GapAnalysis } from "@/components/modules/property-tax/PropertyMedia/GapAnalysis/GapAnalysis";
import {
    fetchPropertyMediaDashboardSummaryAction,
    fetchPropertyMediaDetailedCoverageAction
} from "./action";

export const dynamic = "force-dynamic";

interface PageProps {
    searchParams: Promise<PropertyMediaSearchParams>;
}

export default async function Page({ searchParams }: PageProps): Promise<React.ReactElement> {
    const params = await searchParams;
    const { pageNumber, pageSize, searchTerm } = sanitizeSearchParams(params, {
        allowedSortColumns: [],
    });
    const category = params.category?.trim() || undefined;

    const [dashboardStats, detailedCoverageTableData] = await Promise.all([
        fetchPropertyMediaDashboardSummaryAction(),
        fetchPropertyMediaDetailedCoverageAction(pageNumber, pageSize, searchTerm, category),
    ]);

    return (
        <>
            <PropertyMediaHeader />
            <SummaryCards dashboardStats={dashboardStats} />
            <GapAnalysis dashboardStats={dashboardStats} tableData={detailedCoverageTableData} />
        </>
    );
}