import { getCommonDivisionColumn, getCommonSrColumn } from '../CommonColumns/CommonColumns';
import type { Column, HeaderCell } from '@/components/common/AutomationTable';
import type { SortConfig } from '@/lib/utils/automation-dashboard/sortUtils';
import { renderSortableHeader, ViewType } from '../CommonColumns/SortHeader';
import { formatIndianNumber } from '@/lib/utils/numberUtils';

export type GeoSequencingData = {
    sr: number | string;
    division: string;
    registered?: string | number; // Only for 'zone' view
    geoStruct: string | number;
    geoUnit: string | number;
    propRes: string | number;
    propNonRes: string | number;
    propMixed: string | number;
    propPublic: string | number;
    propUnder: string | number;
    assessStruct: string | number;
    assessUnit: string | number;
    unassessStruct: string | number;
    unassessUnit: string | number;
    newlyStruct: string | number;
    newlyUnit: string | number;
    inprocessStruct: string | number;
    inprocessUnit: string | number;
    assessedStatusId?: number;
    unassessedStatusId?: number;
    newlyAssessedStatusId?: number;
    inprocessStatusId?: number;
    isTotal?: boolean;
    wardId?: number;
    zoneId?: number;
    zoneNo?: string;
};

export const commonBorderClass = 'border-slate-400 dark:border-slate-600';
export const COMMON_BODY_TEXT_COLOR = 'text-black dark:text-slate-100';
export const COMMON_BODY_CELL_CLASS = `w-full h-full p-2 text-[14px] ${COMMON_BODY_TEXT_COLOR} text-center whitespace-nowrap flex items-center justify-center transition-colors`;
export const COMMON_CELL_WRAPPER_CLASS = `!p-0 border ${commonBorderClass}`;

export const getGeoSequencingSharedColumns = (
    _t: (key: string) => string,
    viewType: ViewType,
    onRowClick?: (id: string, row: GeoSequencingData) => void,
    linkHref?: (id: string) => string,
    onPropertyCellClick?: (row: GeoSequencingData, key: string) => void
): Column<GeoSequencingData>[] => {

    const renderClickableCell = (value: unknown, row: GeoSequencingData, key: string, colorClass: string) => (
        <div
            className={`${COMMON_BODY_CELL_CLASS} ${row.isTotal ? 'font-bold text-black dark:text-slate-100' : `font-normal cursor-pointer ${colorClass}`}`}
            onClick={(e) => {
                e.stopPropagation();
                if (row.isTotal) return;
                onPropertyCellClick?.(row, key);
            }}
        >
            {formatIndianNumber(value)}
        </div>
    );

    const srColumn = getCommonSrColumn<GeoSequencingData>();
    srColumn.cellClassName = `text-black border ${commonBorderClass}`;

    const divisionColumn = getCommonDivisionColumn<GeoSequencingData>(onRowClick, linkHref);
    divisionColumn.cellClassName = `${COMMON_CELL_WRAPPER_CLASS} group-hover:border-l-indigo-500`;

    const baseColumns: Column<GeoSequencingData>[] = [
        srColumn,
        divisionColumn
    ];

    const cellStyles = {
        geo: 'text-black dark:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/40',
        property: 'text-black dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/40',
        assessed: 'text-black dark:text-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/40',
        unassessed: 'text-black dark:text-orange-200 hover:bg-orange-50 dark:hover:bg-orange-900/40'
    };

    const commonCellClass = COMMON_CELL_WRAPPER_CLASS;

    if (viewType === 'zone') {
        baseColumns.push({
            key: 'registered',
            label: '',
            align: 'center',
            cellClassName: commonCellClass,
            render: (value, row) => renderClickableCell(value, row, 'registered', cellStyles.assessed)
        });
    }

    baseColumns.push(
        {
            key: 'geoStruct',
            label: '',
            align: 'center',
            cellClassName: commonCellClass,
            render: (v, r) => renderClickableCell(v, r, 'geoStruct', cellStyles.geo)
        },
        {
            key: 'geoUnit',
            label: '',
            align: 'center',
            cellClassName: commonCellClass,
            render: (v, r) => renderClickableCell(v, r, 'geoUnit', cellStyles.geo)
        },
        {
            key: 'propRes',
            label: '',
            align: 'center',
            cellClassName: commonCellClass,
            render: (v, r) => renderClickableCell(v, r, 'propRes', cellStyles.property)
        },
        {
            key: 'propNonRes',
            label: '',
            align: 'center',
            cellClassName: commonCellClass,
            render: (v, r) => renderClickableCell(v, r, 'propNonRes', cellStyles.property)
        },
        {
            key: 'propMixed',
            label: '',
            align: 'center',
            cellClassName: commonCellClass,
            render: (v, r) => renderClickableCell(v, r, 'propMixed', cellStyles.property)
        },
        {
            key: 'propPublic',
            label: '',
            align: 'center',
            cellClassName: commonCellClass,
            render: (v, r) => renderClickableCell(v, r, 'propPublic', cellStyles.property)
        },
        {
            key: 'propUnder',
            label: '',
            align: 'center',
            cellClassName: commonCellClass,
            render: (v, r) => renderClickableCell(v, r, 'propUnder', cellStyles.property)
        },
        { key: 'assessStruct', label: '', align: 'center', cellClassName: commonCellClass, render: (v, r) => renderClickableCell(v, r, 'assessStruct', cellStyles.assessed) },
        { key: 'assessUnit', label: '', align: 'center', cellClassName: commonCellClass, render: (v, r) => renderClickableCell(v, r, 'assessUnit', cellStyles.assessed) },
        { key: 'unassessStruct', label: '', align: 'center', cellClassName: commonCellClass, render: (v, r) => renderClickableCell(v, r, 'unassessStruct', cellStyles.unassessed) },
        { key: 'unassessUnit', label: '', align: 'center', cellClassName: commonCellClass, render: (v, r) => renderClickableCell(v, r, 'unassessUnit', cellStyles.unassessed) },
        { key: 'newlyStruct', label: '', align: 'center', cellClassName: commonCellClass, render: (v, r) => renderClickableCell(v, r, 'newlyStruct', cellStyles.assessed) },
        { key: 'newlyUnit', label: '', align: 'center', cellClassName: commonCellClass, render: (v, r) => renderClickableCell(v, r, 'newlyUnit', cellStyles.assessed) },
        { key: 'inprocessStruct', label: '', align: 'center', cellClassName: commonCellClass, render: (v, r) => renderClickableCell(v, r, 'inprocessStruct', cellStyles.unassessed) },
        { key: 'inprocessUnit', label: '', align: 'center', cellClassName: commonCellClass, render: (v, r) => renderClickableCell(v, r, 'inprocessUnit', cellStyles.unassessed) }
    );

    return baseColumns;
};

export const getGeoSequencingSharedHeaderRows = (
    t: (key: string) => string,
    viewType: ViewType,
    sortConfig?: SortConfig<GeoSequencingData> | null,
    onSort?: (key: keyof GeoSequencingData) => void
): HeaderCell[][] => {
    const commonHeaderClass = `border ${commonBorderClass} px-2 py-1 text-center text-table-header text-slate-700 dark:text-slate-300 sticky top-0 z-20`;

    // Grouped background colors as requested
    const bgColors = {
        geo: 'bg-blue-50/50 dark:bg-blue-900/40',
        property: 'bg-purple-100/80 dark:bg-purple-900/40',
        assessed: 'bg-emerald-100/80 dark:bg-emerald-900/40', // Common bg for Registered, Assessed, Newly Assessed
        unassessed: 'bg-orange-100/80 dark:bg-orange-900/40' // Common bg for Unassessed, Inprocess
    };

    const topRow: HeaderCell[] = [
        {
            label: <div className="font-bold text-[15px] text-slate-900 dark:text-slate-100 uppercase ">{t('geoSequencing.columns.sr')}</div>,
            rowSpan: 2,
            align: 'center',
            headerClassName: `bg-white dark:bg-slate-800 min-w-[50px] ${commonHeaderClass}`
        },
        {
            label: renderSortableHeader(viewType === 'zone' ? t('geoSequencing.columns.division') : t('geoSequencing.columns.wardNo'), 'division', sortConfig, onSort, true, viewType),
            rowSpan: 2,
            align: 'left',
            headerClassName: `bg-white dark:bg-slate-800 min-w-[180px] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${commonHeaderClass}`
        }
    ];

    if (viewType === 'zone') {
        topRow.push({
            label: renderSortableHeader(t('geoSequencing.columns.registeredProperties'), 'registered', sortConfig, onSort, false, viewType),
            rowSpan: 2,
            align: 'center',
            headerClassName: `${bgColors.assessed} min-w-[100px] cursor-pointer hover:bg-emerald-100 transition-colors ${commonHeaderClass}`
        });
    }

    topRow.push(
        {
            label: <div className="font-bold text-[15px] text-slate-900 ">{t('geoSequencing.columns.geoSequencingProperties')}</div>,
            colSpan: 2,
            align: 'center',
            headerClassName: `${bgColors.geo} ${commonHeaderClass}`
        },
        {
            label: <div className="font-bold text-[15px] text-slate-900">{t('geoSequencing.columns.propertyType')}</div>,
            colSpan: 5,
            align: 'center',
            headerClassName: `${bgColors.property} ${commonHeaderClass}`
        },
        {
            label: <div className="font-bold text-[15px] text-slate-900 text-center whitespace-nowrap">{t('geoSequencing.columns.assessed')}<br />{t('geoSequencing.columns.properties')}</div>,
            colSpan: 2,
            align: 'center',
            headerClassName: `${bgColors.assessed} ${commonHeaderClass}`
        },
        {
            label: <div className="font-bold text-[15px] text-slate-900 text-center whitespace-nowrap">{t('geoSequencing.columns.unassessed')}<br />{t('geoSequencing.columns.properties')}</div>,
            colSpan: 2,
            align: 'center',
            headerClassName: `${bgColors.unassessed} ${commonHeaderClass}`
        },
        {
            label: <div className="font-bold text-[15px] text-slate-900">{t('geoSequencing.columns.newlyAssessedFound')}</div>,
            colSpan: 2,
            align: 'center',
            headerClassName: `${bgColors.assessed} ${commonHeaderClass}`
        },
        {
            label: <div className="font-bold text-[15px] text-slate-900">{t('geoSequencing.columns.assessmentInprocess')}</div>,
            colSpan: 2,
            align: 'center',
            headerClassName: `${bgColors.unassessed} ${commonHeaderClass}`
        }
    );

    const bottomRow: HeaderCell[] = [
        {
            label: renderSortableHeader(t('geoSequencing.columns.structure'), 'geoStruct', sortConfig, onSort, false, viewType),
            align: 'center',
            headerClassName: `${bgColors.geo} min-w-[90px] hover:bg-blue-100 transition-colors cursor-pointer ${commonHeaderClass}`
        },
        {
            label: renderSortableHeader(t('geoSequencing.columns.unit'), 'geoUnit', sortConfig, onSort, false, viewType),
            align: 'center',
            headerClassName: `${bgColors.geo} min-w-[90px] hover:bg-blue-100 transition-colors cursor-pointer ${commonHeaderClass}`
        },
        {
            label: renderSortableHeader(t('geoSequencing.columns.residential'), 'propRes', sortConfig, onSort, false, viewType),
            align: 'center',
            headerClassName: `${bgColors.property} min-w-[110px] hover:bg-purple-100 transition-colors cursor-pointer ${commonHeaderClass}`
        },
        {
            label: renderSortableHeader(t('geoSequencing.columns.nonResidential'), 'propNonRes', sortConfig, onSort, false, viewType),
            align: 'center',
            headerClassName: `${bgColors.property} min-w-[110px] hover:bg-purple-100 transition-colors cursor-pointer ${commonHeaderClass}`
        },
        {
            label: renderSortableHeader(t('geoSequencing.columns.mixed'), 'propMixed', sortConfig, onSort, false, viewType),
            align: 'center',
            headerClassName: `${bgColors.property} min-w-[110px] hover:bg-purple-100 transition-colors cursor-pointer ${commonHeaderClass}`
        },
        {
            label: renderSortableHeader(t('geoSequencing.columns.publicUtility'), 'propPublic', sortConfig, onSort, false, viewType),
            align: 'center',
            headerClassName: `${bgColors.property} min-w-[110px] hover:bg-purple-100 transition-colors cursor-pointer ${commonHeaderClass}`
        },
        {
            label: renderSortableHeader(t('geoSequencing.columns.underConstruction'), 'propUnder', sortConfig, onSort, false, viewType),
            align: 'center',
            headerClassName: `${bgColors.property} min-w-[110px] hover:bg-purple-100 transition-colors cursor-pointer ${commonHeaderClass}`
        },
        {
            label: renderSortableHeader(t('geoSequencing.columns.structure'), 'assessStruct', sortConfig, onSort, false, viewType),
            align: 'center',
            headerClassName: `${bgColors.assessed} min-w-[90px] hover:bg-emerald-100 transition-colors cursor-pointer ${commonHeaderClass}`
        },
        {
            label: renderSortableHeader(t('geoSequencing.columns.units'), 'assessUnit', sortConfig, onSort, false, viewType),
            align: 'center',
            headerClassName: `${bgColors.assessed} min-w-[90px] hover:bg-emerald-100 transition-colors cursor-pointer ${commonHeaderClass}`
        },
        {
            label: renderSortableHeader(t('geoSequencing.columns.structure'), 'unassessStruct', sortConfig, onSort, false, viewType),
            align: 'center',
            headerClassName: `${bgColors.unassessed} min-w-[90px] hover:bg-orange-100 transition-colors cursor-pointer ${commonHeaderClass}`
        },
        {
            label: renderSortableHeader(t('geoSequencing.columns.units'), 'unassessUnit', sortConfig, onSort, false, viewType),
            align: 'center',
            headerClassName: `${bgColors.unassessed} min-w-[90px] hover:bg-orange-100 transition-colors cursor-pointer ${commonHeaderClass}`
        },
        {
            label: renderSortableHeader(t('geoSequencing.columns.structure'), 'newlyStruct', sortConfig, onSort, false, viewType),
            align: 'center',
            headerClassName: `${bgColors.assessed} min-w-[80px] hover:bg-emerald-100 transition-colors cursor-pointer ${commonHeaderClass}`
        },
        {
            label: renderSortableHeader(t('geoSequencing.columns.unit'), 'newlyUnit', sortConfig, onSort, false, viewType),
            align: 'center',
            headerClassName: `${bgColors.assessed} min-w-[80px] hover:bg-emerald-100 transition-colors cursor-pointer ${commonHeaderClass}`
        },
        {
            label: renderSortableHeader(t('geoSequencing.columns.structure'), 'inprocessStruct', sortConfig, onSort, false, viewType),
            align: 'center',
            headerClassName: `${bgColors.unassessed} min-w-[70px] hover:bg-orange-100 transition-colors cursor-pointer ${commonHeaderClass}`
        },
        {
            label: renderSortableHeader(t('geoSequencing.columns.unit'), 'inprocessUnit', sortConfig, onSort, false, viewType),
            align: 'center',
            headerClassName: `${bgColors.unassessed} min-w-[70px] hover:bg-orange-100 transition-colors cursor-pointer ${commonHeaderClass}`
        }
    ];

    return [topRow, bottomRow];
};
export const getPropertyTypeIdParam = (columnKey: string): string => {
    switch (columnKey) {
        case 'propRes': return '&PropertyTypeCategoryId=1';
        case 'propNonRes': return '&PropertyTypeCategoryId=2';
        case 'propMixed': return '&PropertyTypeCategoryId=3';
        case 'propPublic': return '&PropertyTypeCategoryId=5';
        case 'propUnder': return '&PropertyTypeCategoryId=6';
        default: return '';
    }
};
