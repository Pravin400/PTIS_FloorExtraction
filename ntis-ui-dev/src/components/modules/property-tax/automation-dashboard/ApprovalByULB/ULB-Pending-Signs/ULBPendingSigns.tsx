'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Drawer } from '@/components/common/Drawer';
import { SearchInput } from '@/components/common/SearchInput';
import { AutomationTable } from '@/components/common/AutomationTable';
import { getUsernameFromCookie } from '@/lib/utils/cookie';
import { getULBPendingSignsColumns, getULBPendingSignsHeaderRows, PendingBuildingData } from './ULBPendingSignsColumns';
import { PendingSignPagination } from '@/types/automation-dashboard/approval-by-ulb/approval-by-ulb.type';
import { usePathname } from 'next/navigation';
import { useConfirm } from '@/components/common/ConfirmProvider';
import { useToast } from '@/components/common/ToastProvider';
import { updatePropertySignAction } from '@/app/[locale]/property-tax/automation-dashboard/approval-by-ulb/ulb-pending-signs/action';

interface ULBPendingSignsProps {
    serverData: PendingSignPagination | null;
    initialPageNumber: number;
    initialPageSize: number;
    userId: number | undefined;
}

const ULBPendingSigns = ({ serverData, initialPageNumber, initialPageSize, userId }: ULBPendingSignsProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [userName, setUserName] = useState<string>('');

    useEffect(() => {
        const name = getUsernameFromCookie();
        if (name) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setUserName(name);
        }
    }, []);

    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const t = useTranslations('automationDashboard');
    const locale = useLocale();
    const { confirm } = useConfirm();
    const { success, error } = useToast();

    const returnUrl = searchParams.get('returnUrl');

    const handleApprove = (row: PendingBuildingData) => {
        confirm({
            variant: "info",
            title: t('ulbPendingSigns.confirmApproveTitle'),
            description: t('ulbPendingSigns.confirmApproveMessage'),
            onConfirm: async () => {
                if (!userId) {
                    error("User ID not found");
                    return;
                }
                const payload = {
                    userId,
                    signAuthorityId: row.signAuthorityId,
                    propertyId: row.propertyId,
                    authorityCode: row.authorityCode,
                    signStatus: row.signStatus
                };

                const response = await updatePropertySignAction(payload);
                if (response.success) {
                    success(t('success.updatePropertySign') || "Property approved successfully");
                    router.refresh();
                } else {
                    error(response.error || t('errors.updatePropertySign') || "Failed to approve property");
                }
            }
        });
    };

    const columns = getULBPendingSignsColumns(t, handleApprove);
    const headerRows = getULBPendingSignsHeaderRows(t);


    const handleClose = () => {
        if (returnUrl) {
            router.push(returnUrl);
        } else {
            router.push(`/${locale}/property-tax/automation-dashboard/approval-by-ulb`);
        }
    };

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        const currentParams = new URLSearchParams(searchParams.toString());
        if (value) {
            currentParams.set('SearchTerm', value);
        } else {
            currentParams.delete('SearchTerm');
        }
        currentParams.set('pageNumber', '1');
        router.push(`${pathname}?${currentParams.toString()}`);
    };

    const tableData = (serverData?.items || []) as PendingBuildingData[];

    const totalCount = serverData?.totalCount || 0;
    const currentPage = serverData?.pageNumber || initialPageNumber;
    const currentPageSize = serverData?.pageSize || initialPageSize;
    const totalPages = serverData?.totalPages || Math.ceil(totalCount / currentPageSize);

    const handlePageChange = (newPageNumber: number) => {
        const currentParams = new URLSearchParams(searchParams.toString());
        currentParams.set('pageNumber', newPageNumber.toString());
        currentParams.set('pageSize', currentPageSize.toString());
        router.push(`${pathname}?${currentParams.toString()}`);
    };

    const handlePageSizeChange = (newPageSize: number) => {
        const currentParams = new URLSearchParams(searchParams.toString());
        currentParams.set('pageSize', newPageSize.toString());
        currentParams.set('pageNumber', '1');
        router.push(`${pathname}?${currentParams.toString()}`);
    };

    const showingStart = totalCount > 0 ? (currentPage - 1) * currentPageSize + 1 : 0;
    const showingEnd = Math.min(currentPage * currentPageSize, totalCount);

    return (
        <Drawer
            open={true}
            onClose={handleClose}
            width="xl"  // xl
            title={
                <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-bold text-slate-900">{t('ulbPendingSigns.title')}</h2>
                    <p className="text-sm text-slate-600 font-medium">
                        {t('ulbPendingSigns.officerName')}: {userName || ''}
                    </p>
                </div>
            }
        >
            <div className="flex flex-col h-full bg-slate-50/50 p-4 gap-4">
                <div className="flex flex-col bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex-1">
                    {/* Table Top Controls */}
                    <div className="p-4 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-slate-700">{t('ulbPendingSigns.pendingBuildings')}</span>
                            <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                                {t('ulbPendingSigns.total')}: {totalCount}
                            </span>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-[300px]">
                                <SearchInput
                                    placeholder={t('ulbPendingSigns.searchPlaceholder')}
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                />
                            </div>
                            <span className="text-xs text-slate-500">
                                {t('ulbPendingSigns.showing')} {showingStart}-{showingEnd} {t('ulbPendingSigns.of')} {totalCount}
                            </span>
                        </div>
                    </div>

                    <div className="border-t border-slate-200 flex-1 min-h-0">
                        <AutomationTable
                            columns={columns}
                            headerRows={headerRows}
                            data={tableData}
                            loading={false}
                            totalCount={totalCount}
                            pageNumber={currentPage}
                            pageSize={currentPageSize}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                            onPageSizeChange={handlePageSizeChange}
                            paginationConfig={{
                                enabled: true,
                                showPageSizeSelector: true
                            }}
                            containerClassName="h-full border-none shadow-none rounded-none"
                        />
                    </div>
                </div>
            </div>
        </Drawer>
    );
}

export default ULBPendingSigns;