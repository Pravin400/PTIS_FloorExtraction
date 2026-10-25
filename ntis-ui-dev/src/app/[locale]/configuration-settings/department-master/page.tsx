import { getDepartmentMastersPaged, getDepartmentMasters } from "@/lib/api/configuration-settings/department-master/departmentMaster.service";
import { DepartmentMaster as DepartmentMasterClient } from "@/components/modules/configuration-settings/department-master/DepartmentMaster";
import { getCleanErrorMessage } from "@/lib/utils/backend-error-detection";
import type { DepartmentMaster } from "@/types/departmentMaster.types";
import type { PagedResponse } from "@/types/common.types";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DepartmentMasterPage({ searchParams }: PageProps) {
    const resolvedSearchParams = await searchParams;
    
    const pageNumber = Number(resolvedSearchParams.page) || 1;
    const pageSize = Number(resolvedSearchParams.pageSize) || 10;
    const searchTerm = (resolvedSearchParams.search as string) || "";
    const rawStatus = resolvedSearchParams.status;
    const statusParam = Array.isArray(rawStatus) ? rawStatus[0] : rawStatus;
    const status = statusParam && statusParam !== "all" ? statusParam : undefined;

    let fetchError: string | undefined;
    let statusCode: number | undefined;
    let pagedData: PagedResponse<DepartmentMaster> = { items: [], pageNumber: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false };
    let allData: DepartmentMaster[] = [];

    try {
        const [pagedRes, allRes] = await Promise.all([
            getDepartmentMastersPaged(pageNumber, pageSize, searchTerm, status),
            getDepartmentMasters(1, 1000)
        ]);
        allData = allRes;

        const term = searchTerm.trim().toLowerCase();
        if (term && allRes.length > 0) {
            const matches = allRes.filter((dept) => {
                const matchesCode = dept.departmentCode?.toLowerCase().includes(term);
                const matchesName = dept.departmentName?.toLowerCase().includes(term);
                const matchesLocal = dept.departmentNameLocal?.toLowerCase().includes(term);
                const matchesDesc = dept.departmentDescription?.toLowerCase().includes(term);
                const matchesSearch = Boolean(matchesCode || matchesName || matchesLocal || matchesDesc);
                const matchesStatus = status === undefined || String(dept.isActive) === status;
                return matchesSearch && matchesStatus;
            });

            // If backend missed code matches or returned 0 results while allData has matches
            if (pagedRes.totalCount < matches.length || pagedRes.items.length === 0) {
                const totalCount = matches.length;
                const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
                const startIdx = (pageNumber - 1) * pageSize;
                const paginatedItems = matches.slice(startIdx, startIdx + pageSize);

                pagedData = {
                    items: paginatedItems,
                    pageNumber,
                    pageSize,
                    totalCount,
                    totalPages,
                    hasPrevious: pageNumber > 1,
                    hasNext: pageNumber < totalPages,
                };
            } else {
                pagedData = pagedRes;
            }
        } else {
            pagedData = pagedRes;
        }
    } catch (error: unknown) {
        fetchError = getCleanErrorMessage(error, "Failed to fetch departments");
        const lowerError = fetchError.toLowerCase();
        if (lowerError.includes("unauthorized") || lowerError.includes("token")) {
            statusCode = 401;
        }
    }

    return (
        <DepartmentMasterClient
            initialData={pagedData.items}
            initialPageNumber={pagedData.pageNumber}
            initialPageSize={pagedData.pageSize}
            initialTotalCount={pagedData.totalCount}
            initialTotalPages={pagedData.totalPages}
            initialSearchTerm={searchTerm}
            allData={allData}
            fetchError={fetchError}
            statusCode={statusCode}
        />
    );
}
