
import { Column } from '@/components/common/AutomationTable';
import { X, Check } from 'lucide-react';
import { BuildingWiseItem, AuthoritySignature } from '@/types/automation-dashboard/approval-by-ulb/approval-by-ulb.type';


export type ExtendedBuildingWiseItem = BuildingWiseItem & {
    isTotal?: boolean;
    demand?: string | number;
    [key: string]: unknown;
};

export const BORDER_CLASS = 'border-slate-400';
export const HEADER_CLASS = 'bg-blue-200 font-bold text-[15px] text-slate-900';

const clickableCellClasses = "flex items-center justify-start w-full h-full p-3 text-[13px] text-slate-900 font-normal cursor-pointer hover:bg-slate-100 hover:text-indigo-800 transition-colors";

export const getPendingStructuresColumns = (
    uniqueAuthorities: AuthoritySignature[] = [],
    t: (key: string) => string,
    locale: string = 'en',
    currentUrl: string = '',
    router?: { push: (url: string) => void },
    pageNumber: number = 1,
    pageSize: number = 10
): Column<ExtendedBuildingWiseItem>[] => {
    const baseColumns: Column<ExtendedBuildingWiseItem>[] = [
        {
            key: 'sr',
            label: t('columns.sr'),
            align: 'center',
            cellClassName: `font-normal text-[13px] text-slate-900 border ${BORDER_CLASS}`,
            headerClassName: `border ${BORDER_CLASS} ${HEADER_CLASS}`,
            colSpan: (row) => row.isTotal ? 3 : 1,
            render: (_val, row, index) => row.isTotal ? <span className="font-bold text-center block w-full text-slate-900 text-[14px]">{t('total')}</span> : ((pageNumber - 1) * pageSize + index + 1)
        },
        {
            key: 'buildingNo',
            label: t('columns.buildingNo'),
            align: 'left',
            colSpan: (row) => row.isTotal ? 0 : 1,
            cellClassName: `!p-0 border ${BORDER_CLASS}`,
            headerClassName: `border ${BORDER_CLASS} ${HEADER_CLASS}`,
            render: (_val, row) => {
                if (row.isTotal) return null;
                const url = `/${locale}/property-tax/automation-dashboard/approval-by-ulb/building-wise-property/${row.buildingNo}${currentUrl ? `?returnUrl=${currentUrl}` : ''}`;
                return (
                    <div
                        onClick={() => router?.push(url)}
                        className={clickableCellClasses}
                    >
                        {row.buildingNo}
                    </div>
                );
            }
        },
        {
            key: 'noticeNo',
            label: t('columns.noticeNo'),
            align: 'left',
            colSpan: (row) => row.isTotal ? 0 : 1,
            cellClassName: `!p-0 border ${BORDER_CLASS}`,
            headerClassName: `border ${BORDER_CLASS} ${HEADER_CLASS}`,
            render: (_val, row) => {
                if (row.isTotal) return null;
                const url = `/${locale}/property-tax/automation-dashboard/approval-by-ulb/building-wise-property/${row.buildingNo}?noticeNo=${row.noticeNo}${currentUrl ? `&returnUrl=${currentUrl}` : ''}`;
                return (
                    <div
                        onClick={() => router?.push(url)}
                        className={clickableCellClasses}
                    >
                        {row.noticeNo}
                    </div>
                );
            }
        },
        {
            key: 'units',
            label: t('columns.units'),
            align: 'center',
            cellClassName: `font-normal text-[13px] text-slate-900 border ${BORDER_CLASS}`,
            headerClassName: `border ${BORDER_CLASS} ${HEADER_CLASS}`
        },
        {
            key: 'demand',
            label: t('columns.demandCr'),
            align: 'center',
            cellClassName: `font-normal text-[13px] text-slate-900 border ${BORDER_CLASS}`,
            headerClassName: `border ${BORDER_CLASS} ${HEADER_CLASS}`,
            render: (_val, row) => {
                if (row.isTotal) return <span className="font-bold">{row.demand}</span>;
                const demand = row.totalDemand || 0;
                if (demand >= 10000000) {
                    return `₹${(demand / 10000000).toFixed(2)}Cr`;
                } else if (demand >= 100000) {
                    return `₹${(demand / 100000).toFixed(2)}L`;
                }
                return `₹${demand}`;
            }
        }
    ];

    uniqueAuthorities.forEach(auth => {
        baseColumns.push({
            key: `auth_${auth.signAuthorityId}`,
            label: auth.authorityName,
            align: 'center',
            cellClassName: `border ${BORDER_CLASS}`,
            headerClassName: `border ${BORDER_CLASS} ${HEADER_CLASS}`,
            render: (_val, row) => {
                if (row.isTotal) {
                    return <span className="font-bold text-slate-900">{(row[`total_auth_${auth.signAuthorityId}`] as React.ReactNode) ?? 0}</span>;
                }
                const sig = row.authoritySignatures?.find((s: AuthoritySignature) => s.signAuthorityId === auth.signAuthorityId);
                if (sig) {
                    if (sig.isSigned === 1) {
                        return <Check className="w-4 h-4 text-emerald-500 mx-auto" strokeWidth={3} />;
                    } else if (sig.isSigned === 0) {
                        return <X className="w-4 h-4 text-red-500 mx-auto" strokeWidth={3} />;
                    }
                }
                return null;
            }
        });
    });

    return baseColumns;
};
