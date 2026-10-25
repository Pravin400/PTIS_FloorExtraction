/* eslint-disable @typescript-eslint/no-explicit-any */
import { Column, HeaderCell } from '@/components/common/AutomationTable';
import type { SortConfig } from '@/lib/utils/automation-dashboard/sortUtils';
import { renderSortableHeader, ViewType } from '../CommonColumns/SortHeader';
import { getCommonDivisionColumn, getCommonSrColumn } from '../CommonColumns/CommonColumns';
import { formatIndianNumber } from '@/lib/utils/numberUtils';

export const commonBorderClass = 'border-slate-400';
export const COMMON_BODY_TEXT_COLOR = 'text-black';
export const COMMON_BODY_TEXT_SIZE = 'text-[14px]';
export const COMMON_BODY_CELL_CLASS = `w-full h-full p-2 text-center flex items-center justify-center transition-colors ${COMMON_BODY_TEXT_SIZE} ${COMMON_BODY_TEXT_COLOR}`;
export const COMMON_CELL_WRAPPER_CLASS = `!p-0 border ${commonBorderClass}`;

export type InternalSurveyTableRow = {
    sr: number | string;
    division: string;
    geoStruct: number | string;
    geoUnit: number | string;
    surveyStruct: number | string;
    surveyUnit: number | string;
    propRes: number | string;
    propNonRes: number | string;
    propMixed: number | string;
    propPublic: number | string;
    propUnder: number | string;
    assessStruct: number | string;
    assessUnit: number | string;
    unassessStruct: number | string;
    unassessUnit: number | string;
    newlyStruct: number | string;
    newlyUnit: number | string;
    inprocessStruct: number | string;
    inprocessUnit: number | string;
    photoCount: number | string;
    assessedStatusId?: number;
    unassessedStatusId?: number;
    newlyAssessedStatusId?: number;
    inprocessStatusId?: number;
    isTotal?: boolean;
    wardId?: number;
    zoneId?: number;
    zoneNo?: string;
};

export const getInternalSurveyColumns = (
    _t: any,
    onRowClick?: (id: string, row: InternalSurveyTableRow) => void,
    linkHref?: (id: string) => string,
    onPropertyCellClick?: (row: InternalSurveyTableRow, key: string) => void
): Column<InternalSurveyTableRow>[] => {

    const srColumn = getCommonSrColumn<InternalSurveyTableRow>();
    srColumn.cellClassName = `${COMMON_BODY_TEXT_COLOR} ${COMMON_BODY_TEXT_SIZE} border ${commonBorderClass}`;

    const divisionColumn = getCommonDivisionColumn<InternalSurveyTableRow>(onRowClick, linkHref);
    divisionColumn.cellClassName = `${COMMON_CELL_WRAPPER_CLASS} border-l-transparent group-hover:border-l-indigo-500`;

    const renderClickableCell = (value: unknown, row: InternalSurveyTableRow, key: string, textClass: string) => (
        <div
            className={`${COMMON_BODY_CELL_CLASS} ${row.isTotal ? 'font-bold' : 'font-normal'} ${row.isTotal ? 'text-black' : textClass}`}
            onClick={(e) => {
                e.stopPropagation();
                if (row.isTotal) return;
                onPropertyCellClick?.(row, key);
            }}
        >
            {formatIndianNumber(value)}
        </div>
    );

    const commonCellClass = `!p-0 border ${commonBorderClass}`;
    const cellStyles = {
        geo: 'text-indigo-950 hover:bg-indigo-50 cursor-pointer',
        property: 'text-purple-950 hover:bg-purple-50 cursor-pointer',
        assessed: 'text-green-900 hover:bg-green-100 cursor-pointer',
        unassessed: 'text-orange-900 hover:bg-orange-100 cursor-pointer',
        newlyAssessed: 'text-emerald-950 hover:bg-emerald-100 cursor-pointer',
        photo: 'text-cyan-900 cursor-pointer'
    };

    const baseColumns: Column<InternalSurveyTableRow>[] = [
        srColumn,
        divisionColumn,
        { key: 'geoStruct', label: '', align: 'center', cellClassName: commonCellClass, render: (v, r) => renderClickableCell(v, r, 'geoStruct', cellStyles.geo) },
        { key: 'geoUnit', label: '', align: 'center', cellClassName: commonCellClass, render: (v, r) => renderClickableCell(v, r, 'geoUnit', cellStyles.geo) },
        { key: 'surveyStruct', label: '', align: 'center', cellClassName: commonCellClass, render: (v, r) => renderClickableCell(v, r, 'surveyStruct', cellStyles.geo) },
        { key: 'surveyUnit', label: '', align: 'center', cellClassName: commonCellClass, render: (v, r) => renderClickableCell(v, r, 'surveyUnit', cellStyles.geo) },
        { key: 'propRes', label: '', align: 'center', cellClassName: commonCellClass, render: (v, r) => renderClickableCell(v, r, 'propRes', cellStyles.property) },
        { key: 'propNonRes', label: '', align: 'center', cellClassName: commonCellClass, render: (v, r) => renderClickableCell(v, r, 'propNonRes', cellStyles.property) },
        { key: 'propMixed', label: '', align: 'center', cellClassName: commonCellClass, render: (v, r) => renderClickableCell(v, r, 'propMixed', cellStyles.property) },
        { key: 'propPublic', label: '', align: 'center', cellClassName: commonCellClass, render: (v, r) => renderClickableCell(v, r, 'propPublic', cellStyles.property) },
        { key: 'propUnder', label: '', align: 'center', cellClassName: commonCellClass, render: (v, r) => renderClickableCell(v, r, 'propUnder', cellStyles.property) },
        { key: 'assessStruct', label: '', align: 'center', cellClassName: commonCellClass, render: (v, r) => renderClickableCell(v, r, 'assessStruct', cellStyles.assessed) },
        { key: 'assessUnit', label: '', align: 'center', cellClassName: commonCellClass, render: (v, r) => renderClickableCell(v, r, 'assessUnit', cellStyles.assessed) },
        { key: 'unassessStruct', label: '', align: 'center', cellClassName: commonCellClass, render: (v, r) => renderClickableCell(v, r, 'unassessStruct', cellStyles.unassessed) },
        { key: 'unassessUnit', label: '', align: 'center', cellClassName: commonCellClass, render: (v, r) => renderClickableCell(v, r, 'unassessUnit', cellStyles.unassessed) },
        { key: 'newlyStruct', label: '', align: 'center', cellClassName: commonCellClass, render: (v, r) => renderClickableCell(v, r, 'newlyStruct', cellStyles.newlyAssessed) },
        { key: 'newlyUnit', label: '', align: 'center', cellClassName: commonCellClass, render: (v, r) => renderClickableCell(v, r, 'newlyUnit', cellStyles.newlyAssessed) },
        { key: 'inprocessStruct', label: '', align: 'center', cellClassName: commonCellClass, render: (v, r) => renderClickableCell(v, r, 'inprocessStruct', cellStyles.unassessed) },
        { key: 'inprocessUnit', label: '', align: 'center', cellClassName: commonCellClass, render: (v, r) => renderClickableCell(v, r, 'inprocessUnit', cellStyles.unassessed) },
        { key: 'photoCount', label: '', align: 'center', cellClassName: commonCellClass, render: (v, r) => renderClickableCell(v, r, 'photoCount', cellStyles.photo) }
    ];

    return baseColumns;
};

export const getInternalSurveyHeaderRows = (
    t: any,
    viewType: ViewType = 'zone',
    sortConfig?: SortConfig<InternalSurveyTableRow> | null,
    onSort?: (key: keyof InternalSurveyTableRow) => void
): HeaderCell[][] => {

    //all header cloumn highte and width manged
    const commonHeaderClass = `border ${commonBorderClass} px-2 py-1 text-center text-table-header text-slate-900 sticky top-0 z-20`;

    const bgColors = {
        geo: 'bg-blue-100/80',
        property: 'bg-purple-100/80',
        assessed: 'bg-green-100/80',
        unassessed: 'bg-orange-100/80',
        newlyAssessed: 'bg-emerald-100/80',
        photo: 'bg-cyan-100/80'
    };

    const topRow: HeaderCell[] = [
        {
            label: <div className="font-bold text-[15px] text-slate-900 uppercase">{t('internalSurvey.columns.sr')}</div>,
            rowSpan: 2,
            align: 'center',
            headerClassName: `bg-slate-50 min-w-[50px] ${commonHeaderClass}`
        },
        {
            label: renderSortableHeader(
                t('internalSurvey.columns.division'),
                'division',
                sortConfig,
                onSort,
                true,
                viewType
            ),
            rowSpan: 2,
            align: 'left',
            headerClassName: `bg-slate-50 min-w-[180px] cursor-pointer hover:bg-slate-100 transition-colors ${commonHeaderClass}`
        },
        {
            label: <div className="font-bold text-[15px] text-slate-900 text-center">{t('internalSurvey.columns.geoSequencingProperties')}</div>,
            colSpan: 2,
            align: 'center',
            headerClassName: `${bgColors.geo} ${commonHeaderClass}`
        },
        {
            label: <div className="font-bold text-[15px] text-slate-900 text-center">{t('internalSurvey.columns.surveyProperties')}</div>,
            colSpan: 2,
            align: 'center',
            headerClassName: `${bgColors.geo} ${commonHeaderClass}`
        },
        {
            label: <div className="font-bold text-[15px] text-slate-900 text-center">{t('internalSurvey.columns.propertyType')}</div>,
            colSpan: 5,
            align: 'center',
            headerClassName: `${bgColors.property} ${commonHeaderClass}`
        },
        {
            label: <div className="font-bold text-[15px] text-slate-900 text-center whitespace-nowrap">{t('internalSurvey.columns.assessed')}<br />{t('internalSurvey.columns.properties')}</div>,
            colSpan: 2,
            align: 'center',
            headerClassName: `${bgColors.assessed} ${commonHeaderClass}`
        },
        {
            label: <div className="font-bold text-[15px] text-slate-900 text-center whitespace-nowrap">{t('internalSurvey.columns.unassessed')}<br />{t('internalSurvey.columns.properties')}</div>,
            colSpan: 2,
            align: 'center',
            headerClassName: `${bgColors.unassessed} ${commonHeaderClass}`
        },
        {
            label: <div className="font-bold text-[15px] text-slate-900 text-center"><span className="whitespace-nowrap">{t('internalSurvey.columns.newlyAssessed')}</span><br />{t('internalSurvey.columns.found')}</div>,
            colSpan: 2,
            align: 'center',
            headerClassName: `${bgColors.newlyAssessed} ${commonHeaderClass}`
        },
        {
            label: <div className="font-bold text-[15px] text-slate-900 text-center">{t('internalSurvey.columns.assessment')}<br />{t('internalSurvey.columns.inprocess')}</div>,
            colSpan: 2,
            align: 'center',
            headerClassName: `${bgColors.unassessed} ${commonHeaderClass}`
        },
        {
            label: renderSortableHeader(t('internalSurvey.columns.photoCount'), 'photoCount', sortConfig, onSort, false, viewType),
            rowSpan: 2,
            align: 'center',
            headerClassName: `${bgColors.photo} ${commonHeaderClass}`
        }
    ];

    const bottomRow: HeaderCell[] = [
        { label: renderSortableHeader(t('internalSurvey.columns.structure'), 'geoStruct', sortConfig, onSort, false, viewType), align: 'center', headerClassName: `${bgColors.geo} min-w-[90px] hover:bg-blue-100 transition-colors cursor-pointer ${commonHeaderClass}` },
        { label: renderSortableHeader(t('internalSurvey.columns.unit'), 'geoUnit', sortConfig, onSort, false, viewType), align: 'center', headerClassName: `${bgColors.geo} min-w-[90px] hover:bg-blue-100 transition-colors cursor-pointer ${commonHeaderClass}` },
        { label: renderSortableHeader(t('internalSurvey.columns.structure'), 'surveyStruct', sortConfig, onSort, false, viewType), align: 'center', headerClassName: `${bgColors.geo} min-w-[90px] hover:bg-blue-100 transition-colors cursor-pointer ${commonHeaderClass}` },
        { label: renderSortableHeader(t('internalSurvey.columns.unit'), 'surveyUnit', sortConfig, onSort, false, viewType), align: 'center', headerClassName: `${bgColors.geo} min-w-[90px] hover:bg-blue-100 transition-colors cursor-pointer ${commonHeaderClass}` },
        { label: renderSortableHeader(t('internalSurvey.columns.residential'), 'propRes', sortConfig, onSort, false, viewType), align: 'center', headerClassName: `${bgColors.property} min-w-[110px] hover:bg-purple-100 transition-colors cursor-pointer ${commonHeaderClass}` },
        { label: renderSortableHeader(t('internalSurvey.columns.nonResidential'), 'propNonRes', sortConfig, onSort, false, viewType), align: 'center', headerClassName: `${bgColors.property} min-w-[110px] hover:bg-purple-100 transition-colors cursor-pointer ${commonHeaderClass}` },
        { label: renderSortableHeader(t('internalSurvey.columns.mixedProperty'), 'propMixed', sortConfig, onSort, false, viewType), align: 'center', headerClassName: `${bgColors.property} min-w-[110px] hover:bg-purple-100 transition-colors cursor-pointer ${commonHeaderClass}` },
        { label: renderSortableHeader(t('internalSurvey.columns.publicUtility'), 'propPublic', sortConfig, onSort, false, viewType), align: 'center', headerClassName: `${bgColors.property} min-w-[110px] hover:bg-purple-100 transition-colors cursor-pointer ${commonHeaderClass}` },
        { label: renderSortableHeader(t('internalSurvey.columns.underConstruction'), 'propUnder', sortConfig, onSort, false, viewType), align: 'center', headerClassName: `${bgColors.property} min-w-[110px] hover:bg-purple-100 transition-colors cursor-pointer ${commonHeaderClass}` },
        { label: renderSortableHeader(t('internalSurvey.columns.structure'), 'assessStruct', sortConfig, onSort, false, viewType), align: 'center', headerClassName: `${bgColors.assessed} min-w-[90px] hover:bg-green-100 transition-colors cursor-pointer ${commonHeaderClass}` },
        { label: renderSortableHeader(t('internalSurvey.columns.units'), 'assessUnit', sortConfig, onSort, false, viewType), align: 'center', headerClassName: `${bgColors.assessed} min-w-[90px] hover:bg-green-100 transition-colors cursor-pointer ${commonHeaderClass}` },
        { label: renderSortableHeader(t('internalSurvey.columns.structure'), 'unassessStruct', sortConfig, onSort, false, viewType), align: 'center', headerClassName: `${bgColors.unassessed} min-w-[90px] hover:bg-orange-100 transition-colors cursor-pointer ${commonHeaderClass}` },
        { label: renderSortableHeader(t('internalSurvey.columns.units'), 'unassessUnit', sortConfig, onSort, false, viewType), align: 'center', headerClassName: `${bgColors.unassessed} min-w-[90px] hover:bg-orange-100 transition-colors cursor-pointer ${commonHeaderClass}` },
        { label: renderSortableHeader(t('internalSurvey.columns.structure'), 'newlyStruct', sortConfig, onSort, false, viewType), align: 'center', headerClassName: `${bgColors.newlyAssessed} min-w-[90px] hover:bg-emerald-100 transition-colors cursor-pointer ${commonHeaderClass}` },
        { label: renderSortableHeader(t('internalSurvey.columns.unit'), 'newlyUnit', sortConfig, onSort, false, viewType), align: 'center', headerClassName: `${bgColors.newlyAssessed} min-w-[90px] hover:bg-emerald-100 transition-colors cursor-pointer ${commonHeaderClass}` },
        { label: renderSortableHeader(t('internalSurvey.columns.structure'), 'inprocessStruct', sortConfig, onSort, false, viewType), align: 'center', headerClassName: `${bgColors.unassessed} min-w-[90px] hover:bg-orange-100 transition-colors cursor-pointer ${commonHeaderClass}` },
        { label: renderSortableHeader(t('internalSurvey.columns.unit'), 'inprocessUnit', sortConfig, onSort, false, viewType), align: 'center', headerClassName: `${bgColors.unassessed} min-w-[90px] hover:bg-orange-100 transition-colors cursor-pointer ${commonHeaderClass}` }
    ];

    return [topRow, bottomRow];
};
