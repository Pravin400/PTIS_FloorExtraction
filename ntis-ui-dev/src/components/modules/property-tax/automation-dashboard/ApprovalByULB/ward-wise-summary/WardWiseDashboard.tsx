'use client';

import { useCallback, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { AutomationTable } from '@/components/common/AutomationTable';
import { getUniqueRoles, getApprovalColumns, getApprovalHeaderRows } from '../ApprovalbyUlbColumns';
import { ApprovalByUlbItems } from "@/types/automation-dashboard/approval-by-ulb/approval-by-ulb.type";
import { Button } from '@/components/common';

interface WardWiseDashboardProps {
    zoneId: string;
    serverData: ApprovalByUlbItems | null;
}

export default function WardWiseDashboard({ zoneId, serverData }: WardWiseDashboardProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const locale = useLocale();
    const t = useTranslations('automationDashboard.approvalByULB');
    const basePath = `/${locale}/property-tax/automation-dashboard`;
    const workflowStageId = searchParams.get('workflowStageId');

    const backUrl = workflowStageId ? `${basePath}/approval-by-ulb?workflowStageId=${workflowStageId}` : `${basePath}/approval-by-ulb`;

    const tableData = useMemo(() => {
        if (!serverData) return [];

        const data = serverData.zoneData ? serverData.zoneData.slice() : [];

        if (serverData.totalRow) {
            data.push({
                ...serverData.totalRow,
                isTotal: true,
                zoneName: t('total')
            });
        }

        return data;
    }, [serverData, t]);

    const roles = useMemo(() => getUniqueRoles(serverData?.zoneData || []), [serverData]);
    const handleNavigation = useCallback((wardId: string, wardName: string) => {
        const returnUrl = encodeURIComponent(`${basePath}/approval-by-ulb/ward-wise-summary/${zoneId}${workflowStageId ? `?workflowStageId=${workflowStageId}` : ''}`);
        const query = `?wardName=${encodeURIComponent(wardName)}&returnUrl=${returnUrl}${workflowStageId ? `&workflowStageId=${workflowStageId}` : ''}`;
        router.push(`${basePath}/approval-by-ulb/pending-structures-ward-wise/${wardId}${query}`);
    }, [basePath, zoneId, workflowStageId, router]);

    const pageNumber = serverData?.pageNumber || 1;
    const pageSize = serverData?.pageSize || 10;
    const totalCount = serverData?.totalCount || 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    const columns = useMemo(() => getApprovalColumns(roles, handleNavigation, t, pageNumber, pageSize), [roles, handleNavigation, t, pageNumber, pageSize]);
    const headerRows = useMemo(() => getApprovalHeaderRows(roles, t, 'ward'), [roles, t]);

    const zoneNameDisplay = serverData?.zoneData?.[0]?.zoneName || '';
    const zoneNoDisplay = serverData?.zoneData?.[0]?.zoneNo || '';

    const handlePageChange = useCallback((page: number) => {
        const queryParams = new URLSearchParams(searchParams.toString());
        queryParams.set('pageNumber', page.toString());
        router.push(`${pathname}?${queryParams.toString()}`);
    }, [searchParams, router, pathname]);

    const handlePageSizeChange = useCallback((size: number) => {
        const queryParams = new URLSearchParams(searchParams.toString());
        queryParams.set('pageNumber', '1');
        queryParams.set('pageSize', size.toString());
        router.push(`${pathname}?${queryParams.toString()}`);
    }, [searchParams, router, pathname]);

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
                    {t('backToDivisions') || 'Back to Divisions'}
                </Button>

                <div className="flex-1 flex justify-center pr-24">
                    <h1 className="text-[15px] font-bold text-slate-800">
                        {zoneNameDisplay ? `Approval by ULB - Ward-wise (${zoneNoDisplay ? `${zoneNoDisplay} - ` : ''}${zoneNameDisplay})` : 'Approval by ULB - Ward-wise'}
                    </h1>
                </div>
            </div>

            {/* Ward-wise Table */}
            <div className="border border-slate-200 shadow-md overflow-hidden bg-white rounded-2xl flex flex-col flex-1 min-h-0">
                <div className="flex-1 p-0 flex flex-col min-h-0 border-t border-slate-200">
                    <AutomationTable
                        data={tableData}
                        columns={columns}
                        headerRows={headerRows}
                        containerClassName="h-full flex flex-col min-h-0"
                        tableClassName="w-full border-collapse text-sm border border-slate-300"
                        theadClassName="sticky top-0 z-20"
                        maxBodyHeightClassName="flex-1 min-h-0"
                        rowClassName={(row) => row.isTotal ? "bg-purple-100 dark:bg-purple-900/50 text-slate-900 dark:text-slate-100 font-bold sticky bottom-0 z-20 shadow-[0_-2px_4px_rgba(0,0,0,0.05)] border-t-2 border-slate-300 dark:border-slate-600 hover:bg-purple-100 dark:hover:bg-purple-900/70 transition-colors" : "group transition-colors border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"}
                        loading={false}
                        getRowKey={(row, index) => `${row.zoneId || 'total'}-${index}`}
                        onRowClick={(row) => {
                            if (!row.isTotal) {
                                const code = row.wardId ? String(row.wardId) : row.zoneId ? String(row.zoneId) : typeof row.zoneName === 'string' ? row.zoneName.split(' - ')[0] : '';
                                if (code) {
                                    const wardName = row.wardName || row.zoneName || '';
                                    handleNavigation(code, wardName);
                                }
                            }
                        }}
                        paginationConfig={{ enabled: true, showPageSizeSelector: true }}
                        pageNumber={pageNumber}
                        pageSize={pageSize}
                        totalCount={totalCount}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                    />
                </div>
            </div>
        </div>
    );
}