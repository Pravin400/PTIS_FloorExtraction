"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { PropertyWisePagination, PropertyWiseItem } from "@/types/automation-dashboard/approval-by-ulb/approval-by-ulb.type";
import { AutomationTable } from "@/components/common/AutomationTable";
import { ArrowLeft, Search } from "lucide-react";

import { getBuildingwisePropertyHeaderRows, getBuildingwisePropertyColumns } from "./BuildingwisePropertyColumns";
import { Button } from "@/components/common";

interface BuildingwisePropertyProps {
    propertyNo: string;
    serverData: PropertyWisePagination | null;
}

const BuildingwiseProperty = ({ propertyNo, serverData }: BuildingwisePropertyProps) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const t = useTranslations("automationDashboard");
    const [searchTerm, setSearchTerm] = useState(searchParams.get('searchTerm') || "");

    const handleSearch = useCallback(() => {
        const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
        if (searchTerm.trim()) {
            currentParams.set('searchTerm', searchTerm.trim());
        } else {
            currentParams.delete('searchTerm');
        }
        currentParams.set('pageNumber', '1');
        router.push(`?${currentParams.toString()}`);
    }, [searchTerm, searchParams, router]);

    const returnUrl = searchParams.get('returnUrl');
    const noticeNo = searchParams.get('noticeNo');
    const basePath = pathname.split('/').slice(0, 4).join('/') || `/${pathname.split('/')[1] || 'en'}/property-tax/automation-dashboard`;
    const backUrl = returnUrl ? decodeURIComponent(returnUrl) : `${basePath}/approval-by-ulb`;

    const handleTrackingClick = useCallback((row: PropertyWiseItem) => {
        const currentReturnUrl = encodeURIComponent(`${pathname}?${searchParams.toString()}`);
        const propertyId = row.propertyId || row.newPropertyNo || 'unknown';
        router.push(`${pathname}/PropertyTracking/${propertyId}?propertyNo=${row.newPropertyNo || ''}&ownerName=${row.ownerName || ''}&returnUrl=${currentReturnUrl}`);
    }, [pathname, searchParams, router]);

    const headerRows = useMemo(() => getBuildingwisePropertyHeaderRows(t), [t]);
    const columns = useMemo(() => getBuildingwisePropertyColumns(t, handleTrackingClick), [t, handleTrackingClick]);

    const totalCount = serverData?.totalCount || 0;
    const pageNumber = serverData?.pageNumber || 1;
    const pageSize = serverData?.pageSize || 10;
    const totalPages = serverData?.totalPages || 1;
    const tableData = serverData?.items || [];

    const handlePageChange = (newPageNumber: number) => {
        const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
        currentParams.set('pageNumber', newPageNumber.toString());
        currentParams.set('pageSize', pageSize.toString());
        router.push(`?${currentParams.toString()}`);
    };

    const handlePageSizeChange = (newSize: number) => {
        const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
        currentParams.set('pageNumber', '1');
        currentParams.set('pageSize', newSize.toString());
        router.push(`?${currentParams.toString()}`);
    };

    return (
        <div className="flex flex-col h-full min-h-0 overflow-hidden bg-slate-50 gap-3">
            {/* Header Bar */}
            <div className="relative p-3 border-b border-slate-200 bg-slate-50 flex items-center rounded-t-2xl">

                <Button
                    type="button"
                    className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold !text-black !bg-white hover:!bg-blue-50 border !border-blue-200 rounded-lg transition-colors shadow-sm"
                    onClick={() => router.push(backUrl)}
                    icon={ArrowLeft}
                >
                    {t('approvalByULB.buildingWiseProperty.backToStructureDetails')}
                </Button>

                <div className="flex-1 flex justify-center">
                    <h3 className="absolute left-1/2 -translate-x-1/2 text-[15px] font-semibold text-slate-800 text-center">
                        {noticeNo
                            ? `Notice No - ${noticeNo}`
                            : t('approvalByULB.buildingWiseProperty.title', { propertyNo })
                        }
                    </h3>
                </div>

                <div className="relative w-full max-w-[240px] ml-auto flex justify-end">
                    <div className="relative w-full">
                        <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder={t('approvalByULB.buildingWiseProperty.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSearch();
                                }
                            }}
                            className="w-full pl-8 pr-3 py-1.5 text-[13px] border border-slate-300 rounded outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 text-slate-700 bg-white"
                        />
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="border border-slate-200 shadow-md overflow-hidden bg-white rounded-2xl flex flex-col flex-1 min-h-0">
                <AutomationTable
                    data={tableData}
                    columns={columns}
                    headerRows={headerRows}
                    containerClassName="h-full flex flex-col min-h-0"
                    tableClassName="data-table w-full border-collapse text-xs border border-slate-300 [&_tbody>tr>td]:border [&_tbody>tr>td]:border-slate-300"
                    theadClassName="sticky top-0 z-50 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-300 shadow-sm [&>tr>th]:border [&>tr>th]:border-slate-300"
                    maxBodyHeightClassName="flex-1 min-h-0"
                    rowClassName={() => "border-b border-slate-200 odd:bg-white even:bg-violet-50/25 hover:bg-indigo-50/25 transition-colors cursor-pointer"}
                    loading={false}
                    totalCount={totalCount}
                    pageNumber={pageNumber}
                    pageSize={pageSize}
                    totalPages={totalPages}
                    paginationConfig={{
                        enabled: true,
                        showPageSizeSelector: true
                    }}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                />
            </div>
        </div>
    )
}

export default BuildingwiseProperty;