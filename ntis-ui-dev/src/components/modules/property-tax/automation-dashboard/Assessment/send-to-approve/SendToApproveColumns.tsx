
import { useState } from 'react';
import { Column, HeaderCell } from '@/components/common/AutomationTable';
import { SendToApproveData } from '@/types/automation-dashboard/assessment/assessmentgrid.type';
import { Checkbox } from '@/components/common/checkbox';
import { FileText, Camera, MapPin, Calculator, Building, Database, PlusCircle, FileCheck, LucideIcon } from 'lucide-react';
import { getViewDocumentUrl } from '@/lib/utils/document-utils';
import Link from 'next/link';
import { handleLocationClick } from '@/lib/utils/automation-dashboard/mapUtils';

export const BORDER_CLASS = '!border !border-slate-400';
export const COMMON_HEADER_CLASS = `p-2 text-center font-bold text-slate-700 !border !border-slate-400`;
export const COMMON_CELL_CLASS = `p-2 !border !border-slate-400 align-middle bg-white`;
export const COMMON_CELL_CENTER_CLASS = `${COMMON_CELL_CLASS} text-center`;

const formatTitleCase = (text: string | null | undefined): string => {
  if (!text || text === '-') return '-';
   return text.replace(/\b[a-z]/g, (char) => char.toUpperCase());
};

export const getSendToApproveHeaderRows = (
    selectedIds: string[],
    _data: SendToApproveData[],
    onSelectAll: (checked: boolean) => void,
    t?: (key: string) => string
): HeaderCell[][] => {
    const isAnySelected = selectedIds.length > 0;

    return [
        [
            {
                label: (
                    <div className="flex items-center justify-center pt-2">
                        <Checkbox
                            checked={isAnySelected}
                            onCheckedChange={(checked) => onSelectAll(!!checked)}
                            className="h-5 w-5 rounded border-2 border-slate-500 bg-white data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white"
                        />
                    </div>
                ),
                rowSpan: 2,
                headerClassName: `${COMMON_HEADER_CLASS} min-w-[50px] bg-white z-30 sticky left-0 top-0`
            },
            {
                label: (
                    <>
                        {t ? t('propertyDetailsDashboard.columns.propertyDetails') : "PROPERTY DETAILS"}
                        <div className="text-[9px] font-normal text-slate-500 normal-case mt-0.5">
                            {t ? t('sendToApprove.columns.zoneWardPropNo') : "Zone / Ward / Property No."}
                            <br />
                            {t ? t('sendToApprove.columns.oldWardNo') : "Old Ward No."}
                        </div>
                    </>
                ),
                rowSpan: 2,
                headerClassName: `${COMMON_HEADER_CLASS} text-left bg-white w-[180px] min-w-[180px]`
            },
            {
                label: t ? t('propertyDetailsDashboard.columns.categoryAndDesc') : "CATEGORY & DESC",
                rowSpan: 2,
                headerClassName: `${COMMON_HEADER_CLASS} bg-white w-[140px] min-w-[140px]`
            },
            {
                label: t ? t('propertyDetailsDashboard.columns.ownerAndOccupier') : "OWNER, OCCUPIER & SHOP",
                rowSpan: 2,
                headerClassName: `${COMMON_HEADER_CLASS} bg-white whitespace-normal break-words w-[240px] min-w-[240px]`
            },
            {
                label: t ? t('propertyDetailsDashboard.columns.mobile') : "MOBILE",
                rowSpan: 2,
                headerClassName: `${COMMON_HEADER_CLASS} bg-white w-[100px]`
            },
            {
                label: t ? t('propertyDetailsDashboard.columns.address') : "ADDRESS",
                rowSpan: 2,
                headerClassName: `${COMMON_HEADER_CLASS} bg-white whitespace-normal break-words w-[250px] min-w-[250px]`
            },
            {
                label: t ? t('propertyDetailsDashboard.columns.propertyDetailsNewVsOld') : "PROPERTY DETAILS (NEW VS OLD)",
                colSpan: 2,
                align: 'center',
                headerClassName: `${COMMON_HEADER_CLASS} bg-amber-50`
            },
            {
                label: (
                    <>
                        {t ? t('sendToApprove.columns.qcChecklist') : "QC CHECKLIST"}
                        <div className="text-[9px] font-normal text-slate-500 normal-case mt-0.5">
                            {t ? t('sendToApprove.columns.checklistSub') : "Click items to toggle - Select row to edit"}
                        </div>
                    </>
                ),
                rowSpan: 2,
                headerClassName: `${COMMON_HEADER_CLASS} bg-teal-50 w-[180px]`
            },
            {
                label: (
                    <>
                        {t ? t('sendToApprove.columns.additional') : "ADDITIONAL"}
                        <br />
                        {t ? t('sendToApprove.columns.revenueVal') : "REVENUE (₹)"}
                    </>
                ),
                rowSpan: 2,
                headerClassName: `${COMMON_HEADER_CLASS} bg-emerald-50 w-[100px]`
            },
            {
                label: (
                    <>
                        {t ? t('sendToApprove.columns.property') : "PROPERTY"}
                        <br />
                        {t ? t('sendToApprove.columns.type') : "TYPE"}
                    </>
                ),
                rowSpan: 2,
                headerClassName: `${COMMON_HEADER_CLASS} bg-purple-50 w-[100px]`
            },
            {
                label: (
                    <>
                        {t ? t('propertyDetailsDashboard.columns.documents') : "DOCUMENTS"}
                        <br />
                        <span className="text-[9px] font-normal text-slate-500 normal-case">
                            {t ? t('sendToApprove.columns.imagePlan') : "Image | Plan"}
                        </span>
                    </>
                ),
                rowSpan: 2,
                headerClassName: `${COMMON_HEADER_CLASS} bg-white w-[100px]`
            },
            {
                label: t ? t('propertyDetailsDashboard.columns.actions') : "ACTIONS",
                rowSpan: 2,
                align: 'center',
                headerClassName: `${COMMON_HEADER_CLASS} bg-white w-[80px]`
            }
        ],
        [
            {
                label: t ? t('propertyDetailsDashboard.columns.oldRecord') : "OLD RECORD",
                align: 'center',
                headerClassName: `${COMMON_HEADER_CLASS} bg-red-50 w-[180px] min-w-[150px]`
            },
            {
                label: t ? t('propertyDetailsDashboard.columns.newRecord') : "NEW RECORD",
                align: 'center',
                headerClassName: `${COMMON_HEADER_CLASS} bg-emerald-50 w-[180px] min-w-[150px]`
            }
        ]
    ];
};

const QcChecklistCell = ({ row, selectedIds, onQcToggle, t }: {
    row: SendToApproveData;
    selectedIds: string[];
    onQcToggle?: (propertyId: string, key: keyof SendToApproveData['qcChecklist'], isChecked: boolean) => void;
    t?: (key: string) => string;
}) => {
    const isRowSelected = selectedIds.includes(row.id);
    const [prevRowId, setPrevRowId] = useState(row.id);
    const [localChecklist, setLocalChecklist] = useState(row.qcChecklist);

    if (row.id !== prevRowId) {
        setPrevRowId(row.id);
        setLocalChecklist(row.qcChecklist);
    }

    const handleToggle = (key: keyof SendToApproveData['qcChecklist'], currentVal: boolean) => {
        if (!isRowSelected) return;
        const nextVal = !currentVal;

        const updatedChecklist = {
            siteQC: key === 'siteQC' ? nextVal : localChecklist.siteQC,
            applyTaxes: key === 'applyTaxes' ? nextVal : localChecklist.applyTaxes,
            officeQC: key === 'officeQC' ? nextVal : localChecklist.officeQC,
            dataUpdated: key === 'dataUpdated' ? nextVal : localChecklist.dataUpdated,
            addTaxes: key === 'addTaxes' ? nextVal : localChecklist.addTaxes,
            qcCcBill: key === 'qcCcBill' ? nextVal : localChecklist.qcCcBill,
        };

        setLocalChecklist(updatedChecklist);

        if (onQcToggle) {
            onQcToggle(row.id, key, nextVal);
        }
    };

    const renderCheck = (key: keyof SendToApproveData['qcChecklist'], label: string, Icon: LucideIcon) => {
        const isDone = localChecklist[key];

        let statusText = '';
        if (key === 'dataUpdated') {
            statusText = isDone ? 'CHECKED' : 'NO';
        } else {
            statusText = isDone ? 'DONE' : 'Done';
        }

        const isRedText = !isDone;

        return (
            <div
                className="flex items-center gap-2 cursor-pointer select-none group/item py-0.5 px-1 hover:bg-slate-50/80 rounded transition-colors"
                onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(key, isDone);
                }}
                title={isRowSelected ? `Toggle ${label}` : 'Select property row first to enable QC editing'}
            >
                {/* Column 1: Label (Fixed width for alignment) */}
                <div className="flex items-center gap-2 w-[105px] shrink-0">
                    <span className={`shrink-0 transition-colors duration-200 ${isDone ? 'text-teal-500' : 'text-slate-400 group-hover/item:text-slate-500'}`}>
                        <Icon size={14} />
                    </span>
                    <span className="text-[10px] text-slate-600 truncate font-normal group-hover/item:text-slate-900 transition-colors">
                        {label}
                    </span>
                </div>

                {/* Column 2: Checkbox (The "Anchor" for alignment) */}
                <div className="flex items-center justify-center w-8 shrink-0">
                    <Checkbox
                        checked={isDone}
                        onCheckedChange={() => handleToggle(key, isDone)}
                        onClick={(e) => e.stopPropagation()}
                        className={`h-5 w-5 rounded-md border-2 shrink-0 transition-all duration-300 ease-out
                            ${isDone
                                ? 'border-teal-600 bg-gradient-to-br from-teal-500 to-emerald-600 shadow-md shadow-teal-500/30 ring-2 ring-teal-100 ring-offset-1'
                                : 'border-slate-200 bg-slate-50/50 group-hover/item:border-teal-300 group-hover/item:bg-white group-hover/item:shadow-sm'
                            } ${isRowSelected ? 'opacity-100' : 'opacity-40'}
                        `}
                    />
                </div>

                {/* Column 3: Status (Pushed slightly right) */}
                <div className="ml-1 w-[55px] shrink-0">
                    <span
                        className={`text-[9px] font-normal tracking-tight transition-colors duration-200 ${isRedText ? 'text-rose-500 group-hover/item:text-rose-600' : 'text-teal-700'
                            }`}
                    >
                        {statusText}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-1 min-w-[180px]">
            {renderCheck('siteQC', t ? t('sendToApprove.columns.siteQc') : 'Site QC', MapPin)}
            {renderCheck('applyTaxes', t ? t('sendToApprove.columns.applyTaxes') : 'Apply taxes', Calculator)}
            {renderCheck('officeQC', t ? t('sendToApprove.columns.officeQc') : 'Office QC', Building)}
            {renderCheck('dataUpdated', t ? t('sendToApprove.columns.dataUpdated') : 'Data updated', Database)}
            {renderCheck('addTaxes', t ? t('sendToApprove.columns.addTaxes') : 'Add taxes', PlusCircle)}
            {renderCheck('qcCcBill', t ? t('sendToApprove.columns.qcCcBill') : 'QC/CC/Bill', FileCheck)}
        </div>
    );
};

export const getSendToApproveColumns = (
    selectedIds: string[],
    onSelectRow: (id: string, checked: boolean) => void,
    onDocumentClick?: (guid: string, propertyNo: string, wardNo: string, isPlan: boolean) => void,
    onQcToggle?: (propertyId: string, key: keyof SendToApproveData['qcChecklist'], isChecked: boolean) => void,
    t?: (key: string) => string
): Column<SendToApproveData>[] => {
    return [
        {
            key: 'id',
            label: '',
            width: '80px',
            cellClassName: `${COMMON_CELL_CENTER_CLASS} z-10 sticky left-0 transition-colors bg-white border border-black`,
            render: (_val, row) => {
                const isSelected = selectedIds.includes(row.id);
                return (
                    <div className="flex items-center justify-center h-full" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => onSelectRow(row.id, !!checked)}
                            className="h-5 w-5 rounded border-2 border-slate-500 bg-white data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white"
                        />
                    </div>
                );
            }
        },
        {
            key: 'propertyNo',
            label: t ? t('propertyDetailsDashboard.columns.propertyDetails') : 'PROPERTY DETAILS',
            cellClassName: COMMON_CELL_CLASS,
            render: (_, row) => (
                <>
                    <div className="font-normal text-slate-900 text-[11px]">{row.propertyNo.new}</div>
                    <div className="text-[12px] text-slate-500">
                        {row.wardNo || 'N/A'}
                    </div>
                    <div className="text-[12px] font-normal text-indigo-700 mt-1">
                        {row.propertyNo.old || "N/A"}
                    </div>
                </>
            )
        },
        {
            key: 'category',
            label: t ? t('propertyDetailsDashboard.columns.categoryAndDesc') : 'CATEGORY & DESC',
            align: 'center',
            cellClassName: COMMON_CELL_CENTER_CLASS,
            render: (_, row) => (
                <div className="w-full text-center text-[12px]">
                    <div className="mb-1">
                        <span className="inline-flex items-center rounded-md bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0 h-4 font-normal">
                            {row.category}
                        </span>
                    </div>
                    <div className="text-gray-900 leading-tight font-normal mb-1.5">
                        {row.categoryMarathi}
                    </div>
                    {row.desc.floors && (
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                            <span className="inline-flex items-center rounded-md bg-orange-50 text-orange-700 border border-orange-100 font-normal px-1.5 py-0 h-4">
                                {t ? t('propertyDetailsDashboard.labels.floors') : 'Floors'}: {row.desc.floors}
                            </span>
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'owner',
            label: t ? t('propertyDetailsDashboard.columns.ownerAndOccupier') : 'OWNER, OCCUPIER & SHOP',
            cellClassName: COMMON_CELL_CLASS,
            render: (_, row) => (
                <div className="space-y-0.5 text-[12px] font-normal whitespace-normal break-words">
                    <div className="text-gray-900">
                        <span className="text-slate-800 font-normal">{t ? t('propertyDetailsDashboard.labels.owner') : 'Owner:'}</span> <span className="font-normal text-slate-900">{formatTitleCase(row.owner)}</span>
                    </div>
                    <div className="text-gray-900">
                        <span className="text-slate-800 font-normal">{t ? t('propertyDetailsDashboard.labels.occupier') : 'Occupier:'}</span> <span className="font-normal text-slate-900">{formatTitleCase(row.occupier)}</span>
                    </div>
                    {row.shopName && (
                        <div className="text-gray-900">
                            <span className="text-slate-800 font-normal">{t ? t('propertyDetailsDashboard.labels.shopName') : 'Shop Name:'}</span> <span className="font-normal text-slate-900">{formatTitleCase(row.shopName)}</span>
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'mobile',
            label: t ? t('propertyDetailsDashboard.columns.mobile') : 'MOBILE',
            align: 'center',
            cellClassName: COMMON_CELL_CENTER_CLASS,
            render: (val) => <div className="text-[13px] font-normal text-slate-900">{val as string}</div>
        },
        {
            key: 'address',
            label: t ? t('propertyDetailsDashboard.columns.address') : 'ADDRESS',
            cellClassName: COMMON_CELL_CLASS,
            render: (val) => <div className="text-[13px] font-normal text-slate-900 leading-snug break-words whitespace-normal">{formatTitleCase(val as string)}</div>
        },
        {
            key: 'oldRecord',
            label: t ? t('propertyDetailsDashboard.columns.oldRecord') : 'OLD RECORD',
            cellClassName: COMMON_CELL_CLASS,
            render: (_, row) => {
                const r = row.oldRecord;
                return (
                    <div className="space-y-2 text-[12px] leading-tight">
                        <div className="flex justify-between gap-1">
                            <span className="text-slate-600 font-normal">{t ? t('propertyDetailsDashboard.labels.area') : 'Area:'}</span>
                            <span className="font-normal text-slate-900">{r.area}</span>
                        </div>
                        <div className="flex justify-between gap-1">
                            <span className="text-slate-600 font-normal">{t ? t('propertyDetailsDashboard.labels.use') : 'Use:'}</span>
                            <span className="font-normal text-slate-900">{r.use}</span>
                        </div>
                        <div className="flex justify-between gap-1">
                            <span className="text-slate-600 font-normal">{t ? t('propertyDetailsDashboard.labels.rv') : 'RV:'}</span>
                            <span className="font-normal text-slate-900">{r.rv}</span>
                        </div>
                        <div className="flex justify-between gap-1 pt-1 mt-1 border-t border-slate-300">
                            <span className="text-slate-600 font-normal">{t ? t('propertyDetailsDashboard.labels.totalTax') : 'Total Tax:'}</span>
                            <span className="font-normal text-slate-900">{r.totalTax}</span>
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'newRecord',
            label: t ? t('propertyDetailsDashboard.columns.newRecord') : 'NEW RECORD',
            cellClassName: COMMON_CELL_CLASS,
            render: (_, row) => {
                const r = row.newRecord;
                return (
                    <div className="space-y-2 text-[12px] leading-tight">
                        <div className="flex justify-between gap-1">
                            <span className="text-slate-700 font-normal">{t ? t('propertyDetailsDashboard.labels.area') : 'Area:'}</span>
                            <span className="font-normal text-slate-900">{r.area}</span>
                        </div>
                        <div className="flex justify-between gap-1">
                            <span className="text-slate-700 font-normal">{t ? t('propertyDetailsDashboard.labels.use') : 'Use:'}</span>
                            <span className="font-normal text-slate-900">{r.use}</span>
                        </div>
                        <div className="flex justify-between gap-1">
                            <span className="text-slate-700 font-normal">{t ? t('propertyDetailsDashboard.labels.rv') : 'RV:'}</span>
                            <span className="font-normal text-slate-900">{r.rv}</span>
                        </div>
                        <div className="flex justify-between gap-1 pt-1 mt-1 border-t border-slate-300">
                            <span className="text-slate-700 font-normal">{t ? t('propertyDetailsDashboard.labels.totalTax') : 'Total Tax:'}</span>
                            <span className="font-normal text-slate-900">{r.totalTax}</span>
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'qcChecklist',
            label: t ? t('sendToApprove.columns.qcChecklist') : 'QC CHECKLIST',
            cellClassName: COMMON_CELL_CLASS,
            render: (_, row) => (
                <QcChecklistCell
                    row={row}
                    selectedIds={selectedIds}
                    onQcToggle={onQcToggle}
                    t={t}
                />
            )
        },
        {
            key: 'additionalRevenue',
            label: t ? t('propertyDetailsDashboard.columns.additionalRevenue') : 'ADDITIONAL REVENUE',
            align: 'center',
            cellClassName: `${COMMON_CELL_CENTER_CLASS} text-slate-700`,
            render: (val) => (
                <div className="text-[12px] font-normal text-slate-900">{val as number}</div>
            )
        },
        {
            key: 'propertyType',
            label: t ? t('propertyDetailsDashboard.columns.propertyType') : 'PROPERTY TYPE',
            align: 'center',
            cellClassName: COMMON_CELL_CENTER_CLASS,
            render: (_, row) => (
                <span className="px-2 py-1 text-[12px] rounded-md font-normal text-slate-700 border border-slate-200 bg-slate-50">
                    {row.propertyType}
                </span>
            )
        },
        {
            key: 'documents',
            label: t ? t('propertyDetailsDashboard.columns.documents') : 'DOCUMENTS',
            align: 'center',
            cellClassName: COMMON_CELL_CENTER_CLASS,
            render: (_, row) => {
                const documentGuid = row.documentGuid?.trim();
                const planDocumentGuid = row.planDocumentGuid?.trim();

                const renderImage = (guid: string | undefined, title: string, Icon: LucideIcon, isPlan: boolean = false) => {
                    const url = guid ? getViewDocumentUrl(guid) : '';
                    return (
                        <div
                            className={`relative group ${url ? 'cursor-pointer' : ''}`}
                            onClick={() => {
                                if (url && onDocumentClick) {
                                    onDocumentClick(guid as string, row.propertyNo.new, row.wardNo, isPlan);
                                }
                            }}
                        >
                            {url ? (
                                isPlan ? (
                                    <div className="w-10 h-10 rounded overflow-hidden border border-purple-200 transition-all hover:scale-110 hover:border-purple-500 hover:shadow-md bg-purple-50 flex items-center justify-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <FileText className="w-5 h-5 text-purple-600" />
                                            <span className="text-[8px] font-normal text-purple-600 uppercase leading-none mt-0.5">PLAN</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative w-10 h-10 bg-gray-100 border border-purple-200 rounded overflow-hidden hover:border-purple-500 transition-all hover:scale-110 hover:shadow-md shadow-sm flex items-center justify-center bg-purple-50">
                                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-10" />
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={url}
                                            alt={title}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    </div>
                                )
                            ) : (
                                <div className={`w-10 h-10 rounded border flex items-center justify-center cursor-default ${isPlan ? 'border-purple-200 bg-purple-50' : 'border-orange-200 bg-orange-50'}`}>
                                    {isPlan ? (
                                        <div className="flex flex-col items-center justify-center">
                                            <Icon className="w-5 h-5 text-purple-600" />
                                            <span className="text-[8px] font-normal text-purple-600 uppercase leading-none mt-0.5">PLAN</span>
                                        </div>
                                    ) : (
                                        <Icon className="h-5 w-5 text-orange-300" />
                                    )}
                                </div>
                            )}
                        </div>
                    );
                };

                return (
                    <div className="inline-flex justify-center items-center gap-3 overflow-visible">
                        {renderImage(documentGuid, 'Property Photo', Camera, false)}
                        {renderImage(planDocumentGuid, 'Property Plan', FileText, true)}
                    </div>
                );
            }
        },
        {
            key: 'actions',
            label: t ? t('propertyDetailsDashboard.columns.actions') : 'ACTIONS',
            align: 'center',
            cellClassName: COMMON_CELL_CENTER_CLASS,
            render: (_, row) => (
                <div className="flex flex-col items-center justify-center gap-1.5 py-1">
                    <Link
                        href={`#`}
                        className="h-6 w-[65px] rounded-full text-xs flex items-center justify-center font-normal bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-200 transition-colors cursor-pointer select-none"
                    >
                        {t ? t('sendToApprove.columns.report') : 'Report'}
                    </Link>
                    <div
                        className="h-8 w-8 mt-0.5 hover:bg-slate-100 transition-colors flex items-center justify-center rounded-full animate-shimmer cursor-pointer"
                        title={t ? t('sendToApprove.columns.location') : 'Location'}
                        onClick={() => handleLocationClick(row, row.wardNo, row.id.toString())}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="https://upload.wikimedia.org/wikipedia/commons/3/39/Google_Maps_icon_%282015-2020%29.svg" alt="Location" className="h-6 w-6" />
                    </div>
                </div>
            )
        }
    ];
};
