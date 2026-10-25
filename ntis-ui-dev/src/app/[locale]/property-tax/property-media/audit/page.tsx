import React from "react";
import { AuditTrailContainer } from "@/components/modules/property-tax/PropertyMedia/AuditTrail/AuditTrailContainer";
import { fetchPropertyMediaAuditTrailAction } from "../action";

export const dynamic = "force-dynamic";

interface AuditPageProps {
    searchParams: Promise<{
        pageNumber?: string;
        pageSize?: string;
        format?: string;
    }>;
}

export default async function Page({ searchParams }: AuditPageProps): Promise<React.ReactElement> {
    const params = await searchParams;
    const pageNumber = Math.max(1, parseInt(params?.pageNumber || "1", 10));
    const pageSize = Math.max(1, parseInt(params?.pageSize || "10", 10));
    const format = params?.format !== undefined ? parseInt(params.format, 10) : undefined;

    const initialData = await fetchPropertyMediaAuditTrailAction({
        pageNumber,
        pageSize,
        format,
    });

    return (
        <>
            <AuditTrailContainer initialData={initialData} />
        </>
    );
}