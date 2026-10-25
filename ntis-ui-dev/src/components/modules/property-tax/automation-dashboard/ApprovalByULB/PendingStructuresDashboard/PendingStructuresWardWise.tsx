'use client';

import { useMemo, useState } from 'react';

import { ArrowLeft, Search } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AutomationTable } from '@/components/common/AutomationTable';
import {
    getPendingStructuresColumns,
    ExtendedBuildingWiseItem
} from './PendingStructuresColumns';
import {
    BuildingWisePagination
} from '@/types/automation-dashboard/approval-by-ulb/approval-by-ulb.type';
import { Button } from '@/components/common';

interface PendingStructuresWardWiseProps {
    wardId?: string;
    serverData?: BuildingWisePagination | null;
}

const PendingStructuresWardWise = ({ wardId, serverData }: PendingStructuresWardWiseProps) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const t = useTranslations('automationDashboard.approvalByULB');
    const [searchTerm, setSearchTerm] = useState('');

    const wardName = searchParams.get('wardName');
    const returnUrl = searchParams.get('returnUrl');
    const basePath = pathname.split('/').slice(0, 4).join('/') || `/${pathname.split('/')[1] || 'en'}/property-tax/automation-dashboard`;
    const backUrl = returnUrl ? decodeURIComponent(returnUrl) : `${basePath}/approval-by-ulb`;

    const rawItems: ExtendedBuildingWiseItem[] = useMemo(() => (serverData?.items as ExtendedBuildingWiseItem[]) || [], [serverData?.items]);

    // Extract authorities for dynamic columns from the first valid row
    const uniqueAuthorities = useMemo(() => {
        const firstRowWithAuth = rawItems.find(row => row.authoritySignatures?.length > 0);
        return firstRowWithAuth ? firstRowWithAuth.authoritySignatures : [];
    }, [rawItems]);

    const locale = pathname.split('/')[1] || 'en';
    const currentUrl = encodeURIComponent(`${pathname}?${searchParams.toString()}`);
    const pageNumber = serverData?.pageNumber || 1;
    const pageSize = serverData?.pageSize || 10;
    const columns = useMemo(() => getPendingStructuresColumns(uniqueAuthorities, t, locale, currentUrl, router, pageNumber, pageSize), [uniqueAuthorities, t, locale, currentUrl, router, pageNumber, pageSize]);

    const tableData = useMemo(() => {
        if (!rawItems.length) return [];

        const mappedData: ExtendedBuildingWiseItem[] = [...rawItems] as ExtendedBuildingWiseItem[];

        // If the server provides a separate totalRow object, append it
        const sData = serverData as unknown as { totalRow?: ExtendedBuildingWiseItem };
        if (sData?.totalRow) {
            const totalRow = { ...sData.totalRow };
            totalRow.isTotal = true;
            totalRow.demand = totalRow.demand || totalRow.totalDemand;
            mappedData.push(totalRow);
        }

        // If the total is already the last item in the array, ensure it has isTotal: true
        if (mappedData.length > 0) {
            const lastRowIndex = mappedData.length - 1;
            const lastRow = { ...mappedData[lastRowIndex] };
            // Infer it's a total row if buildingNo is empty or explicitly flagged
            if (!lastRow.buildingNo || lastRow.buildingNo === 'Total' || lastRow.isTotal) {
                lastRow.isTotal = true;
                mappedData[lastRowIndex] = lastRow;
            }
        }

        return mappedData;
    }, [rawItems, serverData]);

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('pageNumber', page.toString());
        router.push(`${pathname}?${params.toString()}`);
    };

    const handlePageSizeChange = (size: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('pageSize', size.toString());
        params.set('pageNumber', '1');
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="flex flex-col h-full min-h-0 overflow-hidden gap-2">
            {/* Custom Page Header */}
            <div className="relative p-3 border-b border-slate-200 bg-slate-50 flex items-center rounded-t-2xl">

                <Button
                    type="button"
                    variant="secondary"
                    className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold !bg-white hover:!bg-blue-50 border !border-blue-200 rounded-lg transition-colors shadow-sm"
                    onClick={() => router.push(backUrl)}
                    icon={ArrowLeft}
                >
                    {t('backToWardWise') || 'Back to Divisions'}
                </Button>

                <div className="flex-1 flex justify-center">
                    <h3 className="absolute left-1/2 -translate-x-1/2 text-[15px] font-semibold text-slate-800 text-center">
                        {wardName ? `Approval by ULB - ${wardName}` : t('titleWithWard', { wardId: wardId || '' })}
                    </h3>
                </div>

                <div className="w-[200px] flex justify-end">
                    <div className="relative w-full max-w-[180px]">
                        <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder={t('searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-[13px] border border-slate-300 rounded-md outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 text-slate-700 bg-white"
                        />
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="border border-slate-200 shadow-md overflow-hidden bg-white rounded-2xl flex flex-col flex-1 min-h-0">
                <div className="flex-1 p-0 flex flex-col min-h-0 border-t border-slate-200">
                    <AutomationTable
                        data={tableData}
                        columns={columns}
                        containerClassName="h-full flex flex-col min-h-0"
                        tableClassName="w-full border-collapse text-xs border border-slate-300"
                        theadClassName="sticky top-0 z-20"
                        maxBodyHeightClassName="flex-1 min-h-0"
                        rowClassName={(row) => row.isTotal ? "bg-purple-100 font-bold sticky bottom-0 z-20 shadow-[0_-2px_4px_rgba(0,0,0,0.05)] border-t-2 border-slate-300 transition-colors" : "border-b border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"}
                        loading={false}
                        totalCount={serverData?.totalCount || 0}
                        pageNumber={serverData?.pageNumber || 1}
                        pageSize={serverData?.pageSize || 10}
                        totalPages={serverData?.totalPages || 1}
                        paginationConfig={{
                            enabled: true,
                            showPageSizeSelector: true
                        }}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                        getRowKey={(row, i) => row.isTotal ? 'total-row' : `${row.buildingNo}-${i}`}
                        emptyText="Building data not found"
                    />
                </div>
            </div>
        </div>
    );
};

export default PendingStructuresWardWise;
