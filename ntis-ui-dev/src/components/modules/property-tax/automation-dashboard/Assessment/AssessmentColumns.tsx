import type React from 'react';
import { Column, HeaderCell } from '@/components/common/AutomationTable';
import { AssessmentRow } from '@/types/automation-dashboard/assessment/assessmentgrid.type';

export const commonBorderClass = 'border-slate-400 dark:border-slate-600';
export const COMMON_BODY_TEXT_COLOR = 'text-black';
export const COMMON_BODY_TEXT_SIZE = 'text-[14px]';
export const COMMON_BODY_CELL_CLASS = `w-full h-full p-2 py-3 flex items-center justify-center transition-colors ${COMMON_BODY_TEXT_SIZE} ${COMMON_BODY_TEXT_COLOR}`;
export const commonHeaderClass = `bg-white border ${commonBorderClass} px-2 text-center text-table-header text-slate-900 sticky top-0 z-20`;
export const commonClassificationHeaderClass = `bg-purple-100 py-3 border ${commonBorderClass} px-1 text-center text-table-header text-slate-900 sticky top-0 z-20`;

const isTotalRow = (row: AssessmentRow): boolean =>
    Boolean(row.isTotal) || row.zoneName === 'TOTAL' || row.zoneName === 'GRAND TOTAL' || row.zoneId === undefined || row.zoneId === null;

const renderClickableCell = (value: unknown, row: AssessmentRow, locale: string, workflowStageId: string | null, returnUrl: string, router: { push: (href: string) => void }, extraQuery: string = '') => {
    if (value === undefined || value === null) return value as React.ReactNode;
    if (isTotalRow(row)) return <div className={`${COMMON_BODY_CELL_CLASS} cursor-default font-bold text-black`}>{value as React.ReactNode}</div>;

    return (
        <div
            onClick={() => router.push(`/${locale}/property-tax/automation-dashboard/property-details-dashboard/${row.zoneId}?workflowStageId=${workflowStageId || ''}&stage=Assessment${row.zoneNo ? `&zoneNo=${row.zoneNo}` : ''}${extraQuery}&returnUrl=${encodeURIComponent(returnUrl)}`)}
            className={`${COMMON_BODY_CELL_CLASS} cursor-pointer hover:bg-blue-50/50 hover:text-blue-800 font-normal`}
        >
            <span className="hover:underline">{value as React.ReactNode}</span>
        </div>
    );
};

const renderHeader = (title: string, _showSort: boolean = true) => (
    <div className="flex items-center justify-center gap-1 font-bold text-[11px] lg:text-[14px] py-3 text-slate-900 uppercase whitespace-nowrap">
        {title}
    </div>
);

export const getAssessmentHeaderRows = (tab: string, t: (key: string) => string): HeaderCell[][] => [
    [
        {
            label: renderHeader(t('columns.sr'), true),
            rowSpan: 2,
            align: 'center',
            headerClassName: `min-w-[50px] ${commonHeaderClass}`
        },
        {
            label: renderHeader(t('columns.zoneNo'), true),
            rowSpan: 2,
            align: 'center',
            headerClassName: `min-w-[120px] ${commonHeaderClass}`
        },
        {
            label: renderHeader(t('columns.totalStructure'), true),
            rowSpan: 2,
            align: 'center',
            headerClassName: `min-w-[120px] ${commonHeaderClass}`
        },
        {
            label: renderHeader(t('columns.totalUnit'), true),
            rowSpan: 2,
            align: 'center',
            headerClassName: `min-w-[120px] ${commonHeaderClass}`
        },
        {
            label: <div className="text-[11px] lg:text-[15px] text-slate-900 uppercase">{t('columns.propertyClassification')}</div>,
            colSpan: tab === 'Unassessed' ? 7 : 8,
            align: 'center',
            headerClassName: commonClassificationHeaderClass
        }
    ],
    [
        {
            label: renderHeader(t('columns.type'), false),
            align: 'center',
            headerClassName: `min-w-[120px] ${commonHeaderClass}`
        },
        {
            label: renderHeader(t('columns.structure'), true),
            align: 'center',
            headerClassName: `min-w-[100px] ${commonHeaderClass}`
        },
        {
            label: renderHeader(t('columns.unit'), true),
            align: 'center',
            headerClassName: `min-w-[100px] ${commonHeaderClass}`
        },
        ...(tab !== 'Unassessed' ? [{
            label: renderHeader(t('columns.oldDemand'), true),
            align: 'center',
            headerClassName: `min-w-[120px] ${commonHeaderClass}`
        } as HeaderCell] : []),
        {
            label: renderHeader(t('columns.currentDemand'), true),
            align: 'center',
            headerClassName: `min-w-[130px] ${commonHeaderClass}`
        },
        {
            label: renderHeader(t('columns.retroDemand'), true),
            align: 'center',
            headerClassName: `min-w-[120px] ${commonHeaderClass}`
        },
        {
            label: renderHeader(t('columns.totalDemand'), true),
            align: 'center',
            headerClassName: `min-w-[130px] ${commonHeaderClass}`
        },
        {
            label: renderHeader(t('columns.additionalRevenue'), true),
            align: 'center',
            headerClassName: `min-w-[180px] ${commonHeaderClass}`
        }
    ]
];

export const commonAssessmentCellClass = `p-0 text-center ${COMMON_BODY_TEXT_SIZE} ${COMMON_BODY_TEXT_COLOR} select-none bg-white border ${commonBorderClass}`;
export const commonAssessmentNoPaddingCellClass = `!p-0 text-center ${COMMON_BODY_TEXT_SIZE} ${COMMON_BODY_TEXT_COLOR} select-none bg-white h-[1px] border ${commonBorderClass}`;

export const getAssessmentColumns = (
    tab: string,
    _t: (key: string) => string,
    locale: string,
    workflowStageId: string | null,
    returnUrl: string,
    router: { push: (href: string) => void }
): Column<AssessmentRow>[] => [
        {
            key: 'sr',
            label: '',
            align: 'center',
            cellClassName: `w-12 ${commonAssessmentCellClass}`,
            rowSpan: (row) => row.rowSpan ?? 0
        },
        {
            key: 'zoneName',
            label: '',
            align: 'left',
            cellClassName: `min-w-[140px] ${commonAssessmentCellClass}`,
            rowSpan: (row) => row.rowSpan ?? 0,
            render: (value, row) => {
                const content = (row.zoneNo && !isTotalRow(row)) ? `${row.zoneNo} - ${value}` : value as React.ReactNode;
                return <span className={isTotalRow(row) ? 'font-bold text-black' : 'font-normal'}>{content}</span>;
            }
        },
        {
            key: 'totalStructure',
            label: '',
            align: 'center',
            cellClassName: `min-w-[90px] ${commonAssessmentNoPaddingCellClass}`,
            rowSpan: (row) => row.rowSpan ?? 0,
            render: (value, row) => renderClickableCell(value, row, locale, workflowStageId, returnUrl, router, '&Structure=true')
        },
        {
            key: 'totalUnit',
            label: '',
            align: 'center',
            cellClassName: `min-w-[90px] ${commonAssessmentNoPaddingCellClass}`,
            rowSpan: (row) => row.rowSpan ?? 0,
            render: (value, row) => renderClickableCell(value, row, locale, workflowStageId, returnUrl, router, '&Unit=true')
        },
        {
            key: 'type',
            label: '',
            align: 'center',
            cellClassName: `min-w-[130px] ${commonAssessmentCellClass}`,
            render: (value) => {
                const colors = {
                    'Assessed': 'text-black bg-blue-100/50',
                    'Unassessed': 'text-black bg-amber-100/50',
                    'Rented': 'text-black bg-orange-100/50',
                    'Assessed + Unassessed': 'text-black bg-slate-100/50',
                    'Additional Construction': 'text-black bg-blue-100/50',
                    'Change Of Use': 'text-black bg-amber-100/50',
                    'NoChange': 'text-black bg-orange-100/50',
                    'Underassessed': 'text-black bg-orange-100/50',
                    'Residential': 'text-black bg-blue-100/50',
                    'Commercial': 'text-black bg-green-100/50',
                    'Industrial': 'text-black bg-purple-100/50',
                    'Mixed Use': 'text-black bg-amber-100/50',
                    'Public Utility': 'text-black bg-teal-100/50',
                    'Open Plots': 'text-black bg-slate-100/50',
                    'Owner': 'text-black bg-indigo-100/50',
                    'Renter': 'text-black bg-purple-100/50'
                };
                const colorClass = colors[value as keyof typeof colors] || 'text-slate-900';
                return <div className={`h-full w-full py-3 -my-2 font-semibold ${colorClass}`}>{value as React.ReactNode}</div>;
            }
        },
        {
            key: 'structure',
            label: '',
            align: 'center',
            cellClassName: `min-w-[80px] ${commonAssessmentNoPaddingCellClass}`,
            render: (value, row) => renderClickableCell(value, row, locale, workflowStageId, returnUrl, router, '&Structure=true')
        },
        {
            key: 'unit',
            label: '',
            align: 'center',
            cellClassName: `min-w-[80px] ${commonAssessmentNoPaddingCellClass}`,
            render: (value, row) => renderClickableCell(value, row, locale, workflowStageId, returnUrl, router, '&Unit=true')
        },
        ...(tab !== 'Unassessed' ? [{
            key: 'oldDemand',
            label: '',
            align: 'right',
            cellClassName: `min-w-[80px] ${commonAssessmentCellClass}`
        } as Column<AssessmentRow>] : []),
        {
            key: 'currentDemand',
            label: '',
            align: 'right',
            cellClassName: `min-w-[120px] ${commonAssessmentCellClass}`,
        },
        {
            key: 'retroDemand',
            label: '',
            align: 'right',
            cellClassName: `min-w-[120px] ${commonAssessmentCellClass}`,
        },
        {
            key: 'totalDemand',
            label: '',
            align: 'right',
            cellClassName: `min-w-[120px] ${commonAssessmentCellClass}`
        },
        {
            key: 'addRevenue',
            label: '',
            align: 'right',
            cellClassName: `min-w-[120px] ${commonAssessmentCellClass}`
        }
    ];

