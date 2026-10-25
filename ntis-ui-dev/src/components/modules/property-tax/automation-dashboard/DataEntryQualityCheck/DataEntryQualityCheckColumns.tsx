/* eslint-disable @typescript-eslint/no-explicit-any */
import { ArrowUpDown, ArrowUp, Download } from 'lucide-react';
import { Column } from '@/components/common/AutomationTable';
import { HeaderCell } from '@/components/common/AutomationTable';
import { DataEntryData } from '@/types/automation-dashboard/data-entry-quality-check/data-entry-quality-check.type';
import { getCommonDivisionColumn, getCommonSrColumn, getCommonWardColumn } from '../CommonColumns/CommonColumns';

export const commonBorderClass = 'border-slate-400';
export const COMMON_BODY_TEXT_COLOR = 'text-black';
export const COMMON_BODY_TEXT_SIZE = 'text-[14px]';
export const COMMON_BODY_CELL_CLASS = `w-full h-full p-2 text-center flex items-center justify-center transition-colors ${COMMON_BODY_TEXT_SIZE} ${COMMON_BODY_TEXT_COLOR}`;
export const COMMON_CELL_WRAPPER_CLASS = `!p-0 border ${commonBorderClass}`;

export const getDataEntryColumns = (
    level: 'division' | 'ward',
    _t: any,
    onDivisionClick?: (divisionCode: string, row: DataEntryData) => void,
    divisionLinkHref?: (divisionCode: string) => string,
    onPropertyCellClick?: (row: DataEntryData, key: keyof DataEntryData | string) => void
): Column<DataEntryData>[] => {
    const renderClickableCell = (value: unknown, row: DataEntryData, key: string) => (
        <div
            className={`${COMMON_BODY_CELL_CLASS} ${row.isTotal ? 'font-bold' : 'font-normal'} cursor-pointer hover:bg-slate-100 whitespace-nowrap`}
            onClick={(e) => {
                e.stopPropagation();
                if (row.isTotal) return;
                onPropertyCellClick?.(row, key);
            }}
        >
            {value != null ? Number(value).toLocaleString('en-IN') : '0'}
        </div>
    );

    const commonCellClass = COMMON_CELL_WRAPPER_CLASS;

    return [
        (() => { const c = getCommonSrColumn<DataEntryData>(); c.cellClassName = `p-2 ${COMMON_BODY_TEXT_COLOR} ${COMMON_BODY_TEXT_SIZE} font-normal border ${commonBorderClass}`; return c; })(),
        level === 'division' ? (() => { const c = getCommonDivisionColumn<DataEntryData>(onDivisionClick, divisionLinkHref); c.cellClassName = `${COMMON_CELL_WRAPPER_CLASS}`; return c; })() : (() => { const c = getCommonWardColumn<DataEntryData>(); c.cellClassName = `p-2 flex justify-center items-center border ${commonBorderClass} cursor-pointer`; return c; })(),

        { key: 'isStruct', label: '', align: 'center', cellClassName: commonCellClass, render: (v: unknown, r: DataEntryData) => renderClickableCell(v, r, 'isStruct') },
        { key: 'isUnit', label: '', align: 'center', cellClassName: commonCellClass, render: (v: unknown, r: DataEntryData) => renderClickableCell(v, r, 'isUnit') },

        { key: 'deCompStruct', label: '', align: 'center', cellClassName: commonCellClass, render: (v: unknown, r: DataEntryData) => renderClickableCell(v, r, 'deCompStruct') },
        { key: 'deCompUnit', label: '', align: 'center', cellClassName: commonCellClass, render: (v: unknown, r: DataEntryData) => renderClickableCell(v, r, 'deCompUnit') },
        { key: 'dePendStruct', label: '', align: 'center', cellClassName: commonCellClass, render: (v: unknown, r: DataEntryData) => renderClickableCell(v, r, 'dePendStruct') },
        { key: 'dePendUnit', label: '', align: 'center', cellClassName: commonCellClass, render: (v: unknown, r: DataEntryData) => renderClickableCell(v, r, 'dePendUnit') },

        { key: 'photoComp', label: '', align: 'center', cellClassName: commonCellClass, render: (v: unknown, r: DataEntryData) => renderClickableCell(v, r, 'photoComp') },
        { key: 'photoPend', label: '', align: 'center', cellClassName: commonCellClass, render: (v: unknown, r: DataEntryData) => renderClickableCell(v, r, 'photoPend') },

        { key: 'planComp', label: '', align: 'center', cellClassName: commonCellClass, render: (v: unknown, r: DataEntryData) => renderClickableCell(v, r, 'planComp') },
        { key: 'planPend', label: '', align: 'center', cellClassName: commonCellClass, render: (v: unknown, r: DataEntryData) => renderClickableCell(v, r, 'planPend') },

        { key: 'qaCompStruct', label: '', align: 'center', cellClassName: commonCellClass, render: (v: unknown, r: DataEntryData) => renderClickableCell(v, r, 'qaCompStruct') },
        { key: 'qaCompUnit', label: '', align: 'center', cellClassName: commonCellClass, render: (v: unknown, r: DataEntryData) => renderClickableCell(v, r, 'qaCompUnit') },
        { key: 'qaPendStruct', label: '', align: 'center', cellClassName: commonCellClass, render: (v: unknown, r: DataEntryData) => renderClickableCell(v, r, 'qaPendStruct') },
        { key: 'qaPendUnit', label: '', align: 'center', cellClassName: commonCellClass, render: (v: unknown, r: DataEntryData) => renderClickableCell(v, r, 'qaPendUnit') },
        { key: 'qaTypeWise', label: '', align: 'center', cellClassName: commonCellClass, render: (v: unknown, r: DataEntryData) => renderClickableCell(v, r, 'qaTypeWise') },

        { key: 'propRes', label: '', align: 'center', cellClassName: commonCellClass, render: (v: unknown, r: DataEntryData) => renderClickableCell(v, r, 'propRes') },
        { key: 'propNonRes', label: '', align: 'center', cellClassName: commonCellClass, render: (v: unknown, r: DataEntryData) => renderClickableCell(v, r, 'propNonRes') },
        { key: 'propMixed', label: '', align: 'center', cellClassName: commonCellClass, render: (v: unknown, r: DataEntryData) => renderClickableCell(v, r, 'propMixed') },
        { key: 'propPublic', label: '', align: 'center', cellClassName: commonCellClass, render: (v: unknown, r: DataEntryData) => renderClickableCell(v, r, 'propPublic') },
        { key: 'propUnder', label: '', align: 'center', cellClassName: commonCellClass, render: (v: unknown, r: DataEntryData) => renderClickableCell(v, r, 'propUnder') },

        { key: 'assessStruct', label: '', align: 'center', cellClassName: commonCellClass, render: (v: unknown, r: DataEntryData) => renderClickableCell(v, r, 'assessStruct') },
        { key: 'assessUnit', label: '', align: 'center', cellClassName: commonCellClass, render: (v: unknown, r: DataEntryData) => renderClickableCell(v, r, 'assessUnit') },
        { key: 'unassessStruct', label: '', align: 'center', cellClassName: commonCellClass, render: (v: unknown, r: DataEntryData) => renderClickableCell(v, r, 'unassessStruct') },
        { key: 'unassessUnit', label: '', align: 'center', cellClassName: commonCellClass, render: (v: unknown, r: DataEntryData) => renderClickableCell(v, r, 'unassessUnit') },
        { key: 'newlyStruct', label: '', align: 'center', cellClassName: commonCellClass, render: (v: unknown, r: DataEntryData) => renderClickableCell(v, r, 'newlyStruct') },
        { key: 'newlyUnit', label: '', align: 'center', cellClassName: commonCellClass, render: (v: unknown, r: DataEntryData) => renderClickableCell(v, r, 'newlyUnit') },
        { key: 'inprocessStruct', label: '', align: 'center', cellClassName: commonCellClass, render: (v: unknown, r: DataEntryData) => renderClickableCell(v, r, 'inprocessStruct') },
        { key: 'inprocessUnit', label: '', align: 'center', cellClassName: commonCellClass, render: (v: unknown, r: DataEntryData) => renderClickableCell(v, r, 'inprocessUnit') },
    ];
};

const SortIcon = () => <ArrowUpDown className="inline-block ml-1 w-3 h-3 text-slate-400 opacity-60" />;
const ActiveSortIcon = () => <ArrowUp className="inline-block ml-1 w-3 h-3 text-slate-500" />;

const renderHeader = (title: string, showSort: boolean = false, activeSort: boolean = false, isWard: boolean = false, exportText: string = '', isSubHeader: boolean = false) => {
    const formattedTitle = (isSubHeader && title.includes(' ')) ? (
        <div className="flex flex-col items-center justify-center leading-snug">
            {title.split(' ').map((word, i) => <span key={i}>{word}</span>)}
        </div>
    ) : title;

    return (
        <div className={isWard ? "inline-flex items-center justify-center gap-0.5 font-bold text-[15px] text-slate-900 leading-tight whitespace-nowrap" : "flex items-center justify-center gap-1 font-bold text-[15px] text-slate-900 whitespace-nowrap"}>
            {formattedTitle}
            {exportText && (
                <span className="inline-flex items-center gap-1 px-2 py-1.5 ml-2 text-[11px] font-semibold text-slate-700 bg-white border border-slate-400 rounded-md shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
                    <Download className="w-3 h-3" /> {exportText}
                </span>
            )}
            {showSort && (activeSort ? <ActiveSortIcon /> : <SortIcon />)}
        </div>
    );
};

const renderLeftHeader = (title: string, showSort: boolean = false, activeSort: boolean = false, isWard: boolean = false) => (
    <div className={isWard ? "inline-flex items-center justify-start gap-0.5 font-bold text-[15px] leading-tight text-slate-900 uppercase whitespace-nowrap" : "flex items-center justify-start gap-1 font-bold text-[15px] text-slate-900 uppercase whitespace-nowrap"}>
        {title} {showSort && (activeSort ? <ActiveSortIcon /> : <SortIcon />)}
    </div>
);

export const getDataEntryHeaderRows = (level: 'division' | 'ward', t: any): HeaderCell[][] => {
    const isWard = level === 'ward';

    const commonHeaderClass = `border ${commonBorderClass} px-2 py-1 text-center text-table-header text-slate-900 sticky top-0 z-20`;

    const bgColors = {
        geo: 'bg-slate-100/80',
        property: 'bg-purple-100/80',
        assessed: 'bg-green-100/80',
        unassessed: 'bg-orange-100/80',
        newlyAssessed: 'bg-emerald-50/80',
        photo: 'bg-cyan-100/80',
        plan: 'bg-indigo-100/80'
    };

    return [
        [
            { label: <div className="font-bold text-[15px] text-slate-900 uppercase whitespace-nowrap">{t('dataEntryQualityCheck.columns.sr')}</div>, rowSpan: 2, align: 'center', headerClassName: `${bgColors.geo} min-w-[50px] ${commonHeaderClass}` },
            { label: renderLeftHeader(level === 'division' ? t('dataEntryQualityCheck.columns.division') : t('dataEntryQualityCheck.columns.wardNo'), false, false, isWard), rowSpan: 2, align: isWard ? 'center' : 'left', headerClassName: `${bgColors.geo} min-w-[180px] ${commonHeaderClass}` },

            { label: renderHeader(t('dataEntryQualityCheck.columns.internalSurvey'), false, false, isWard), colSpan: 2, align: 'center', headerClassName: `${bgColors.photo} ${commonHeaderClass}` },
            { label: renderHeader(t('dataEntryQualityCheck.columns.dataEntry'), false, false, isWard), colSpan: 4, align: 'center', headerClassName: `${bgColors.property} ${commonHeaderClass}` },
            { label: renderHeader(t('dataEntryQualityCheck.columns.photo'), false, false, isWard, t('dataEntryQualityCheck.buttons.export') || 'Export'), colSpan: 2, align: 'center', headerClassName: `${bgColors.photo} ${commonHeaderClass}` },
            { label: renderHeader(t('dataEntryQualityCheck.columns.plan'), false, false, isWard, t('dataEntryQualityCheck.buttons.export') || 'Export'), colSpan: 2, align: 'center', headerClassName: `${bgColors.plan} ${commonHeaderClass}` },
            { label: renderHeader(t('dataEntryQualityCheck.columns.qualityAnalyst'), false, false, isWard), colSpan: 5, align: 'center', headerClassName: `${bgColors.newlyAssessed} ${commonHeaderClass}` },
            { label: renderHeader(t('dataEntryQualityCheck.columns.propertyType'), false, false, isWard), colSpan: 5, align: 'center', headerClassName: `${bgColors.property} ${commonHeaderClass}` },

            { label: <div className="font-bold text-[15px] text-slate-900 text-center">{t('dataEntryQualityCheck.columns.assessed')}<br />{t('dataEntryQualityCheck.columns.properties')}</div>, colSpan: 2, align: 'center', headerClassName: `${bgColors.assessed} ${commonHeaderClass}` },
            { label: <div className="font-bold text-[15px] text-slate-900 text-center">{t('dataEntryQualityCheck.columns.unassessed')}<br />{t('dataEntryQualityCheck.columns.properties')}</div>, colSpan: 2, align: 'center', headerClassName: `${bgColors.unassessed} ${commonHeaderClass}` },
            { label: <div className="font-bold text-[15px] text-slate-900 text-center"><span className="whitespace-nowrap">{t('dataEntryQualityCheck.columns.newlyAssessed')}</span><br />{t('dataEntryQualityCheck.columns.found')}</div>, colSpan: 2, align: 'center', headerClassName: `${bgColors.newlyAssessed} ${commonHeaderClass}` },
            { label: <div className="font-bold text-[15px] text-slate-900 text-center">{t('dataEntryQualityCheck.columns.assessment')}<br />{t('dataEntryQualityCheck.columns.inprocess')}</div>, colSpan: 2, align: 'center', headerClassName: `${bgColors.unassessed} ${commonHeaderClass}` },
        ],
        [
            { label: renderHeader(t('dataEntryQualityCheck.columns.structure'), false, false, isWard, '', true), align: 'center', headerClassName: `${bgColors.photo} ${commonHeaderClass}` },
            { label: renderHeader(t('dataEntryQualityCheck.columns.unit'), false, false, isWard, '', true), align: 'center', headerClassName: `${bgColors.photo} ${commonHeaderClass}` },

            { label: renderHeader(t('dataEntryQualityCheck.columns.completedStructure'), false, false, isWard, '', true), align: 'center', headerClassName: `${bgColors.property} ${commonHeaderClass}` },
            { label: renderHeader(t('dataEntryQualityCheck.columns.completedUnit'), false, false, isWard, '', true), align: 'center', headerClassName: `${bgColors.property} ${commonHeaderClass}` },
            { label: renderHeader(t('dataEntryQualityCheck.columns.pendingStructure'), false, false, isWard, '', true), align: 'center', headerClassName: `${bgColors.property} ${commonHeaderClass}` },
            { label: renderHeader(t('dataEntryQualityCheck.columns.pendingUnit'), false, false, isWard, '', true), align: 'center', headerClassName: `${bgColors.property} ${commonHeaderClass}` },

            { label: renderHeader(t('dataEntryQualityCheck.columns.complete'), false, false, isWard, '', true), align: 'center', headerClassName: `${bgColors.photo} ${commonHeaderClass}` },
            { label: renderHeader(t('dataEntryQualityCheck.columns.pending'), false, false, isWard, '', true), align: 'center', headerClassName: `${bgColors.photo} ${commonHeaderClass}` },

            { label: renderHeader(t('dataEntryQualityCheck.columns.complete'), false, false, isWard, '', true), align: 'center', headerClassName: `${bgColors.plan} ${commonHeaderClass}` },
            { label: renderHeader(t('dataEntryQualityCheck.columns.pending'), false, false, isWard, '', true), align: 'center', headerClassName: `${bgColors.plan} ${commonHeaderClass}` },

            { label: renderHeader(t('dataEntryQualityCheck.columns.completedStructure'), false, false, isWard, '', true), align: 'center', headerClassName: `${bgColors.newlyAssessed} min-w-[90px] ${commonHeaderClass}` },
            { label: renderHeader(t('dataEntryQualityCheck.columns.completedUnit'), false, false, isWard, '', true), align: 'center', headerClassName: `${bgColors.newlyAssessed} min-w-[90px] ${commonHeaderClass}` },
            { label: renderHeader(t('dataEntryQualityCheck.columns.pendingStructure'), false, false, isWard, '', true), align: 'center', headerClassName: `${bgColors.newlyAssessed} min-w-[90px] ${commonHeaderClass}` },
            { label: renderHeader(t('dataEntryQualityCheck.columns.pendingUnit'), false, false, isWard, '', true), align: 'center', headerClassName: `${bgColors.newlyAssessed} min-w-[90px] ${commonHeaderClass}` },
            { label: renderHeader(t('dataEntryQualityCheck.columns.typeWise'), false, false, isWard, '', true), align: 'center', headerClassName: `${bgColors.newlyAssessed} min-w-[90px] ${commonHeaderClass}` },

            { label: renderHeader(t('dataEntryQualityCheck.columns.residential'), false, false, isWard, '', true), align: 'center', headerClassName: `${bgColors.property} min-w-[110px] ${commonHeaderClass}` },
            { label: renderHeader(t('dataEntryQualityCheck.columns.nonResidential'), false, false, isWard, '', true), align: 'center', headerClassName: `${bgColors.property} min-w-[120px] ${commonHeaderClass}` },
            { label: renderHeader(t('dataEntryQualityCheck.columns.mixed'), false, false, isWard, '', true), align: 'center', headerClassName: `${bgColors.property} min-w-[110px] ${commonHeaderClass}` },
            { label: renderHeader(t('dataEntryQualityCheck.columns.publicUtility'), false, false, isWard, '', true), align: 'center', headerClassName: `${bgColors.property} min-w-[110px] ${commonHeaderClass}` },
            { label: renderHeader(t('dataEntryQualityCheck.columns.underConstruction'), false, false, isWard, '', true), align: 'center', headerClassName: `${bgColors.property} min-w-[130px] ${commonHeaderClass}` },

            { label: renderHeader(t('dataEntryQualityCheck.columns.structure'), false, false, isWard, '', true), align: 'center', headerClassName: `${bgColors.assessed} min-w-[70px] ${commonHeaderClass}` },
            { label: renderHeader(t('dataEntryQualityCheck.columns.units'), false, false, isWard, '', true), align: 'center', headerClassName: `${bgColors.assessed} min-w-[70px] ${commonHeaderClass}` },

            { label: renderHeader(t('dataEntryQualityCheck.columns.structure'), false, false, isWard, '', true), align: 'center', headerClassName: `${bgColors.unassessed} min-w-[70px] ${commonHeaderClass}` },
            { label: renderHeader(t('dataEntryQualityCheck.columns.units'), false, false, isWard, '', true), align: 'center', headerClassName: `${bgColors.unassessed} min-w-[70px] ${commonHeaderClass}` },

            { label: renderHeader(t('dataEntryQualityCheck.columns.structure'), false, false, isWard, '', true), align: 'center', headerClassName: `${bgColors.newlyAssessed} min-w-[70px] ${commonHeaderClass}` },
            { label: renderHeader(t('dataEntryQualityCheck.columns.unit'), false, false, isWard, '', true), align: 'center', headerClassName: `${bgColors.newlyAssessed} min-w-[70px] ${commonHeaderClass}` },

            { label: renderHeader(t('dataEntryQualityCheck.columns.structure'), false, false, isWard, '', true), align: 'center', headerClassName: `${bgColors.unassessed} min-w-[70px] ${commonHeaderClass}` },
            { label: renderHeader(t('dataEntryQualityCheck.columns.unit'), false, false, isWard, '', true), align: 'center', headerClassName: `${bgColors.unassessed} min-w-[70px] ${commonHeaderClass}` },
        ]
    ];
};
