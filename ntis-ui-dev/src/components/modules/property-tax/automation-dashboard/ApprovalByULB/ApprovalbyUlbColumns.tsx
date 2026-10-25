
import { Column, HeaderCell } from '@/components/common/AutomationTable';
import { MapPin, Download } from 'lucide-react';
import { Classification, ZoneDataRow } from '@/types/automation-dashboard/approval-by-ulb/approval-by-ulb.type';

const roleColors = [
    { header: 'bg-fuchsia-100/70', text: 'text-rose-900' },
    { header: 'bg-cyan-100/50', text: 'text-teal-700' },
    { header: 'bg-blue-100/70', text: 'text-blue-700' },
    { header: 'bg-emerald-100/50', text: 'text-emerald-700' },
    { header: 'bg-violet-100/70', text: 'text-violet-700' }
];

export const commonBorderClass = 'border-slate-400 dark:border-slate-600';
export const COMMON_BODY_TEXT_COLOR = 'text-black';
export const COMMON_BODY_TEXT_SIZE = 'text-[14px]';
export const COMMON_BODY_CELL_CLASS = `border ${commonBorderClass} p-1 text-center ${COMMON_BODY_TEXT_SIZE} ${COMMON_BODY_TEXT_COLOR}`;
export const commonApprovalCellClass = COMMON_BODY_CELL_CLASS;
export const commonApprovalHeaderClass = `border ${commonBorderClass} p-1 text-center text-table-header text-slate-700 sticky top-0 z-20`;
export const commonApprovalSubHeaderClass = `border ${commonBorderClass} p-1 text-center text-table-header text-slate-700 min-w-[60px] sticky top-[42px] z-20`;

export interface RoleDef {
    id: number;
    name: string;
}

export const getUniqueRoles = (data: ZoneDataRow[]): RoleDef[] => {
    if (!data || data.length === 0) return [];
    const firstWithClassifications = data.find((row) => row.classifications && row.classifications.length > 0);
    if (!firstWithClassifications) return [];
    return firstWithClassifications.classifications
        ?.filter((c: Classification) => c.type && c.type !== 'Total')
        .map((c: Classification) => ({ id: c.typeId, name: c.type })) || [];
};

export const getApprovalColumns = (
    roles: RoleDef[],
    onDivisionClick?: (zoneId: string, zoneName: string) => void,
    t?: (key: string) => string,
    pageNumber: number = 1,
    pageSize: number = 10
): Column<ZoneDataRow>[] => {
    const defaultCellClass = `border ${commonBorderClass} p-3 text-center font-normal ${COMMON_BODY_TEXT_COLOR} ${COMMON_BODY_TEXT_SIZE} cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap`;
    const baseColumns: Column<ZoneDataRow>[] = [
        {
            key: 'sr',
            label: t ? t('columns.sr') : '',
            align: 'center',
            cellClassName: defaultCellClass,
            render: (_value, row, index) => row.isTotal ? '' : <span className={row.isTotal ? 'font-bold' : 'font-normal'}>{(pageNumber - 1) * pageSize + index + 1}</span>
        },
        {
            key: 'zoneName',
            label: t ? t('columns.zoneWard') : '',
            align: 'left',
            cellClassName: `!p-0 border ${commonBorderClass} group-hover:border-l-indigo-500`,
            render: (value, row) => {
                if (row.isTotal) {
                    return <div className="text-black font-bold text-center w-full block p-3">{row.zoneName || (t ? t('total') : 'Total')}</div>;
                }
                const nameStr = (value as string) || '';
                const code = row.wardId ? String(row.wardId) : row.zoneId ? String(row.zoneId) : nameStr.split(' - ')[0];
                const displayName = row.wardName || nameStr;
                return (
                    <div
                        className="flex items-center gap-2 w-full h-full p-3 cursor-pointer hover:bg-indigo-50/50 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onDivisionClick && code) {
                                onDivisionClick(code, displayName);
                            }
                        }}
                    >
                        <MapPin className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                        <span className="text-slate-950 text-[14px] whitespace-nowrap">
                            {row.zoneNo ? `${row.zoneNo} - ` : ''}{row.wardName || nameStr}
                        </span>
                    </div>
                );
            }
        },
        {
            key: 'totalStructure',
            label: '',
            align: 'center',
            cellClassName: `${commonApprovalCellClass} text-blue-900`,
            render: (value) => ((value as number) ?? 0).toLocaleString('en-IN')
        },
        {
            key: 'totalUnit',
            label: '',
            align: 'center',
            cellClassName: `${commonApprovalCellClass} text-blue-900`,
            render: (value) => ((value as number) ?? 0).toLocaleString('en-IN')
        },
        {
            key: 'totalDemand',
            label: '',
            align: 'center',
            cellClassName: `${commonApprovalCellClass} text-green-900 min-w-[80px]`,
            render: (_, row) => {
                const demand = (row.totalDemand as number | undefined) ?? row.classifications?.find((x: Classification) => x.type === 'Total')?.totalDemand ?? row.classifications?.find((x: Classification) => x.type === 'Clerk')?.totalDemand ?? 0;
                if (demand >= 10000000) {
                    return `₹${(demand / 10000000).toFixed(2)}Cr`;
                } else {
                    return `₹${(demand / 100000).toFixed(2)}L`;
                }
            }
        }
    ];

    const dynamicTextColors = [
        'text-indigo-900',
        'text-cyan-950',
        'text-purple-950',
        'text-pink-950',
        'text-teal-950'
    ];

    roles.forEach(({ id: roleId, name: _role }, idx) => {
        const textClass = dynamicTextColors[idx % dynamicTextColors.length];
        const baseRoleClass = `${commonApprovalCellClass} ${textClass}`;

        baseColumns.push(
            {
                key: `${roleId}_signedStruct`,
                label: '',
                align: 'center',
                cellClassName: baseRoleClass,
                render: (_, row) => {
                    const c = row.classifications?.find((x: Classification) => x.typeId === roleId);
                    return ((c?.structure as number) ?? 0).toLocaleString('en-IN');
                }
            },
            {
                key: `${roleId}_signedUnit`,
                label: '',
                align: 'center',
                cellClassName: baseRoleClass,
                render: (_, row) => {
                    const c = row.classifications?.find((x: Classification) => x.typeId === roleId);
                    return ((c?.unit as number) ?? 0).toLocaleString('en-IN');
                }
            },
            {
                key: `${roleId}_pendingStruct`,
                label: '',
                align: 'center',
                cellClassName: baseRoleClass,
                render: (_, row) => {
                    const c = row.classifications?.find((x: Classification) => x.typeId === roleId);
                    return ((c?.pendingStructure as number) ?? 0).toLocaleString('en-IN');
                }
            },
            {
                key: `${roleId}_pendingUnit`,
                label: '',
                align: 'center',
                cellClassName: baseRoleClass,
                render: (_, row) => {
                    const c = row.classifications?.find((x: Classification) => x.typeId === roleId);
                    return ((c?.pendingUnit as number) ?? 0).toLocaleString('en-IN');
                }
            }
        );
    });

    const totalCellClass = `${commonApprovalCellClass} text-amber-950`;
    baseColumns.push(
        {
            key: `finalTotal_signedStruct`,
            label: '',
            align: 'center',
            cellClassName: totalCellClass,
            render: (_, row) => {
                const c = row.classifications?.find((x: Classification) => x.type === 'Total') || row.classifications?.[0];
                const total = c?.structure ?? 0;
                return total.toLocaleString('en-IN');
            }
        },
        {
            key: `finalTotal_signedUnit`,
            label: '',
            align: 'center',
            cellClassName: totalCellClass,
            render: (_, row) => {
                const c = row.classifications?.find((x: Classification) => x.type === 'Total') || row.classifications?.[0];
                const total = c?.unit ?? 0;
                return total.toLocaleString('en-IN');
            }
        },
        {
            key: `finalTotal_pendingStruct`,
            label: '',
            align: 'center',
            cellClassName: totalCellClass,
            render: (_, row) => {
                const c = row.classifications?.find((x: Classification) => x.type === 'Total') || row.classifications?.[0];
                const total = c?.pendingStructure ?? 0;
                return total.toLocaleString('en-IN');
            }
        },
        {
            key: `finalTotal_pendingUnit`,
            label: '',
            align: 'center',
            cellClassName: totalCellClass,
            render: (_, row) => {
                const c = row.classifications?.find((x: Classification) => x.type === 'Total') || row.classifications?.[0];
                const total = c?.pendingUnit ?? 0;
                return total.toLocaleString('en-IN');
            }
        }
    );

    return baseColumns;
};

export const getApprovalHeaderRows = (
    roles: RoleDef[],
    t?: (key: string) => string,
    viewType: 'zone' | 'ward' = 'zone',
    onExportClick?: (roleId: number, roleName: string) => void
): HeaderCell[][] => {
    const topRow: HeaderCell[] = [
        {
            label: <div className="flex items-center justify-center gap-1 font-bold text-[15px] text-slate-700 uppercase whitespace-nowrap">{t ? t('columns.sr') : 'SR'}</div>,
            rowSpan: 2,
            align: 'center',
            headerClassName: `bg-slate-50 min-w-[50px] ${commonApprovalHeaderClass}`
        },
        {
            label: (
                <div className="flex items-center justify-start gap-1 font-bold text-[15px] text-slate-700 uppercase whitespace-nowrap">
                    {viewType === 'ward'
                        ? (t ? t('columns.divisionOffice') : 'DIVISION OFFICE')
                        : (t ? t('columns.division') : 'DIVISION')}
                </div>
            ),
            rowSpan: 2,
            align: 'left',
            headerClassName: `bg-slate-50 min-w-[180px] ${commonApprovalHeaderClass}`
        },
        {
            label: (
                <div className="flex flex-col items-center justify-center font-bold text-[15px] text-slate-700 leading-tight text-center whitespace-pre-wrap">
                    <span>{t ? t('totalStructures') : 'Total Structures'}</span>
                </div>
            ),
            rowSpan: 2,
            align: 'center',
            headerClassName: `bg-slate-50 px-2 ${commonApprovalHeaderClass}`
        },
        {
            label: (
                <div className="flex flex-col items-center justify-center font-bold text-[15px] text-slate-700 leading-tight text-center whitespace-pre-wrap">
                    <span>{t ? t('totalUnitsSubmitted') : 'Total Units Submitted'}</span>
                </div>
            ),
            rowSpan: 2,
            align: 'center',
            headerClassName: `bg-slate-50 px-2 ${commonApprovalHeaderClass}`
        },
        {
            label: (
                <div className="flex flex-col items-center justify-center font-bold text-[15px] text-slate-700 leading-tight text-center whitespace-pre-wrap">
                    <span>{t ? t('totalDemandCr') : 'Total Demand (Cr)'}</span>
                </div>
            ),
            rowSpan: 2,
            align: 'center',
            headerClassName: `bg-emerald-50 px-2 ${commonApprovalHeaderClass}`
        }
    ];

    const bottomRow: HeaderCell[] = [];

    roles.forEach(({ id: roleId, name: role }, idx) => {
        const color = roleColors[idx % roleColors.length];

        topRow.push({
            label: (
                <div className="relative flex items-center justify-center min-h-[36px]">
                    <span className={`block w-full text-center leading-tight font-bold text-[15px] text-slate-700 ${viewType !== 'ward' ? 'pr-24' : ''}`}>{role}</span>
                    {viewType !== 'ward' && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onExportClick) onExportClick(roleId, role);
                            }}
                            className="absolute right-1 top-1/2 h-6 -translate-y-1/2 px-2 text-[11px] leading-none font-semibold text-slate-800 border border-slate-400 bg-white hover:bg-slate-100 shadow-sm rounded flex items-center"
                        >
                            <Download className="h-3.5 w-3.5 mr-1" />
                            {t ? t('export') : 'Export'}
                        </button>
                    )}
                </div>
            ),
            colSpan: 4,
            align: 'center',
            headerClassName: `${color.header} border ${commonBorderClass} p-2`
        });

        bottomRow.push(
            {
                label: (
                    <>
                        {t ? t('signed') : 'Signed'}<br />
                        {viewType === 'ward' ? (t ? t('buildings') : 'Buildings') : (t ? t('structures') : 'Structures')}
                    </>
                ),
                align: 'center',
                headerClassName: `${color.header} ${commonApprovalSubHeaderClass}`
            },
            {
                label: (
                    <>
                        {t ? t('signed') : 'Signed'}<br />
                        {viewType === 'ward' ? (t ? t('unit') : 'Unit') : (t ? t('units') : 'Units')}
                    </>
                ),
                align: 'center',
                headerClassName: `${color.header} ${commonApprovalSubHeaderClass}`
            },
            {
                label: (
                    <>
                        {t ? t('pending') : 'Pending'}<br />
                        {viewType === 'ward' ? (t ? t('buildings') : 'Buildings') : (t ? t('structures') : 'Structures')}
                    </>
                ),
                align: 'center',
                headerClassName: `${color.header} ${commonApprovalSubHeaderClass}`
            },
            {
                label: (
                    <>
                        {t ? t('pending') : 'Pending'}<br />
                        {viewType === 'ward' ? (t ? t('units') : 'Units') : (t ? t('units') : 'Units')}
                    </>
                ),
                align: 'center',
                headerClassName: `${color.header} ${commonApprovalSubHeaderClass}`
            }
        );
    });

    topRow.push({
        label: <div className="flex items-center justify-center gap-1 font-bold text-[14px] text-slate-700 whitespace-nowrap">{t ? t('total') : 'Total'}</div>,
        colSpan: 4,
        align: 'center',
        headerClassName: `bg-amber-50 border ${commonBorderClass} p-2`
    });

    bottomRow.push(
        {
            label: (
                <>
                    {t ? t('signed') : 'Signed'}<br />
                    {viewType === 'ward' ? (t ? t('buildings') : 'Buildings') : (t ? t('structures') : 'Structures')}
                </>
            ),
            align: 'center',
            headerClassName: `bg-amber-50 border border-slate-300 p-1 text-center text-table-header text-slate-700 min-w-[60px] sticky top-[42px] z-20`
        },
        {
            label: (
                <>
                    {t ? t('signed') : 'Signed'}<br />
                    {viewType === 'ward' ? (t ? t('unit') : 'Unit') : (t ? t('units') : 'Units')}
                </>
            ),
            align: 'center',
            headerClassName: `bg-amber-50 border border-slate-300 p-1 text-center text-table-header text-slate-700 min-w-[60px] sticky top-[42px] z-20`
        },
        {
            label: (
                <>
                    {t ? t('pending') : 'Pending'}<br />
                    {viewType === 'ward' ? (t ? t('buildings') : 'Buildings') : (t ? t('structures') : 'Structures')}
                </>
            ),
            align: 'center',
            headerClassName: `bg-amber-50 border border-slate-300 p-1 text-center text-table-header text-slate-700 min-w-[60px] sticky top-[42px] z-20`
        },
        {
            label: (
                <>
                    {t ? t('pending') : 'Pending'}<br />
                    {viewType === 'ward' ? (t ? t('units') : 'Units') : (t ? t('units') : 'Units')}
                </>
            ),
            align: 'center',
            headerClassName: `bg-amber-50 border border-slate-300 p-1 text-center text-table-header text-slate-700 min-w-[60px] sticky top-[42px] z-20`
        }
    );

    return [topRow, bottomRow];
};
