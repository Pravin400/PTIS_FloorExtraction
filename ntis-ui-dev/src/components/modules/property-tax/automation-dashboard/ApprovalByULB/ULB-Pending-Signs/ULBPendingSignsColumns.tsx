import { Column, HeaderCell } from '@/components/common/AutomationTable';
import { Check } from 'lucide-react';

export interface PendingBuildingData {
    propertyId: number;
    signAuthorityId: number;
    structureName: string;
    srNoticeNo: string;
    noOfUnits: number;
    demand: number;
    signStatus: string;
    authorityCode: string;
    [key: string]: unknown;
}

export const getULBPendingSignsHeaderRows = (t: (key: string) => string): HeaderCell[][] => {
    return [
        [
            {
                label: t('ulbPendingSigns.columns.structureName'),
                rowSpan: 1,
                headerClassName: 'p-3 text-left font-bold text-slate-700 bg-red-50 border-r border-b border-slate-200'
            },
            {
                label: t('ulbPendingSigns.columns.srNoticeNo'),
                rowSpan: 1,
                headerClassName: 'p-3 text-left font-bold text-slate-700 bg-yellow-50 border-r border-b border-slate-200'
            },
            {
                label: t('ulbPendingSigns.columns.noOfUnits'),
                rowSpan: 1,
                align: 'center',
                headerClassName: 'p-3 text-center font-bold text-slate-700 bg-blue-50 border-r border-b border-slate-200'
            },
            {
                label: t('ulbPendingSigns.columns.demand'),
                rowSpan: 1,
                align: 'center',
                headerClassName: 'p-3 text-center font-bold text-slate-700 bg-emerald-50 border-r border-b border-slate-200'
            },
            {
                label: t('ulbPendingSigns.columns.approve'),
                rowSpan: 1,
                align: 'center',
                headerClassName: 'p-3 text-center font-bold text-slate-700 bg-purple-50 border-b border-slate-200'
            }
        ]
    ];
}

export const getULBPendingSignsColumns = (
    t: (key: string) => string,
    onApprove?: (row: PendingBuildingData) => void
): Column<PendingBuildingData>[] => {
    return [
        {
            key: 'structureName',
            label: t('ulbPendingSigns.columns.structureName'),
            cellClassName: 'p-3 border-b border-slate-200 align-middle text-slate-700 font-medium',
            render: (val) => val as string
        },
        {
            key: 'srNoticeNo',
            label: t('ulbPendingSigns.columns.srNoticeNo'),
            cellClassName: 'p-3 border-b border-slate-200 align-middle text-slate-700 font-medium',
            render: (val) => val as string
        },
        {
            key: 'noOfUnits',
            label: t('ulbPendingSigns.columns.noOfUnits'),
            align: 'center',
            cellClassName: 'p-3 border-b border-slate-200 align-middle text-slate-700 font-medium text-center',
            render: (val) => val as number
        },
        {
            key: 'demand',
            label: t('ulbPendingSigns.columns.demand'),
            align: 'center',
            cellClassName: 'p-3 border-b border-slate-200 align-middle text-emerald-700 font-bold text-center',
            render: (val) => (
                <div className="flex items-center justify-center gap-1 font-bold text-slate-700">
                    <span className="text-emerald-700">{"₹"}</span>
                    <span>{(val as number).toLocaleString('en-IN')}</span>
                </div>
            )
        },
        {
            key: 'signStatus',
            label: t('ulbPendingSigns.columns.approve'),
            align: 'center',
            cellClassName: 'p-3 border-b border-slate-200 align-middle text-center',
            render: (_val, row) => (
                <div className="flex justify-center">
                    <div 
                        className="h-6 w-6 rounded-full border border-emerald-500 flex items-center justify-center text-emerald-500 cursor-pointer hover:bg-emerald-50 transition-colors" 
                        title={t('ulbPendingSigns.actions.approve')}
                        onClick={() => onApprove?.(row)}
                    >
                        <Check size={14} strokeWidth={3} />
                    </div>
                </div>
            )
        }
    ];
};
