import type {
  CapitalRow,
  CapitalValueItem,
  CapitalValueResponse,
} from '@/types/capitalValue.types';
import type { FloorDetailsTableColumn } from '@/components/common';
import { buildExpandedRowsHref } from '@/lib/utils/ptis';
import { renderCellBox } from '@/lib/utils/table-renderers';

const CELL_CLASS =
  'text-[12px] text-center font-normal text-slate-800 whitespace-nowrap';

const FACTOR_CELL_CLASS =
  'text-[12px] text-right font-medium text-emerald-800 whitespace-nowrap';

const TOTAL_CELL_CLASS =
  'text-[12px] text-right font-bold text-slate-900 whitespace-nowrap';

export function getCapitalItems(capitalData: CapitalValueResponse | null): CapitalValueItem[] {
  if (!capitalData) return [];
  if (Array.isArray(capitalData)) return capitalData;
  return capitalData.items ?? capitalData.details ?? [];
}

export function mapCapitalRow(item: CapitalValueItem): CapitalRow {
  const carpetAreaStr =
    item.carpetAreaSqFeet != null && item.carpetAreaSqMeter != null
      ? `${item.carpetAreaSqFeet} / ${item.carpetAreaSqMeter}`
      : item.carpetAreaSqFeet != null
        ? String(item.carpetAreaSqFeet)
        : item.carpetAreaSqMeter != null
          ? String(item.carpetAreaSqMeter)
          : '-';

  const builtUpAreaStr =
    item.builtupAreaSqFeet != null && item.builtupAreaSqMeter != null
      ? `${item.builtupAreaSqFeet} / ${item.builtupAreaSqMeter}`
      : item.builtupAreaSqFeet != null
        ? String(item.builtupAreaSqFeet)
        : item.builtupAreaSqMeter != null
          ? String(item.builtupAreaSqMeter)
          : '-';

  return {
    id: item.propertyDetailsId ?? item.id ?? 0,
    floor: item.floorDescription || '-',
    subFloor: item.subFloorDescription || '-',
    constructionYear: item.constructionYear || '-',
    assessmentYear: item.assessmentYear || '-',
    constructionType: item.constructionTypeDescription || '-',
    natureTypeBuilding: item.typeOfUseDescription || '-',
    subType: item.subTypeOfUseDescription || '-',
    noOfRooms: item.noOfRooms != null ? String(item.noOfRooms) : '-',
    carpetArea: carpetAreaStr,
    builtUpArea: builtUpAreaStr,
    sdrrRate: item.sdrr != null ? String(item.sdrr) : '-',
    baseValue: item.baseValue != null ? String(item.baseValue) : '-',
    floorFactor: item.floorFactor != null ? String(item.floorFactor) : '-',
    ageFactor: item.ageFactor != null ? String(item.ageFactor) : '-',
    ntbFactor: item.ntbFactor != null ? String(item.ntbFactor) : '-',
    useFactor: item.useFactor != null ? String(item.useFactor) : '-',
    finalCapitalValue: item.capitalValue != null ? String(item.capitalValue) : '-',
    taxes: item.taxes ?? [],
  };
}

export function getCapitalColumns(
  t: (key: string) => string
): FloorDetailsTableColumn<CapitalRow>[] {
  const column = (key: keyof CapitalRow, labelKey: string, className: string) => ({
    key,
    label: t(`floorTable.columns.${labelKey}`),
    tooltip: t(`floorTable.tooltips.${labelKey}`),
    render: (row: CapitalRow) => renderCellBox(String(row[key]), className),
  });

  const columns: FloorDetailsTableColumn<CapitalRow>[] = [
    column('floor', 'floor', CELL_CLASS),
    column('subFloor', 'subFloor', CELL_CLASS),
    column('constructionYear', 'constYear', CELL_CLASS),
    column('assessmentYear', 'asstYear', CELL_CLASS),
    column('constructionType', 'constType', CELL_CLASS),
    column('natureTypeBuilding', 'use', CELL_CLASS),
    column('subType', 'subType', CELL_CLASS),
    column('noOfRooms', 'noOfRooms', CELL_CLASS),
    column('carpetArea', 'carpetArea', CELL_CLASS),
    column('builtUpArea', 'builtupArea', CELL_CLASS),
    column('sdrrRate', 'sdrr', CELL_CLASS),
    {
      key: 'baseValue',
      label: t('floorTable.columns.baseValue'),
      tooltip: t('floorTable.tooltips.baseValue'),
      render: (row) => renderCellBox(row.baseValue, FACTOR_CELL_CLASS),
    },
    {
      key: 'floorFactor',
      label: t('floorTable.columns.floorFactor'),
      tooltip: t('floorTable.tooltips.floorFactor'),
      render: (row) => renderCellBox(row.floorFactor, FACTOR_CELL_CLASS),
    },
    {
      key: 'ageFactor',
      label: t('floorTable.columns.ageFactor'),
      tooltip: t('floorTable.tooltips.ageFactor'),
      render: (row) => renderCellBox(row.ageFactor, FACTOR_CELL_CLASS),
    },
    {
      key: 'ntbFactor',
      label: t('floorTable.columns.ntbFactor'),
      tooltip: t('floorTable.tooltips.ntbFactor'),
      render: (row) => renderCellBox(row.ntbFactor, FACTOR_CELL_CLASS),
    },
    {
      key: 'useFactor',
      label: t('floorTable.columns.useFactor'),
      tooltip: t('floorTable.tooltips.useFactor'),
      render: (row) => renderCellBox(row.useFactor, FACTOR_CELL_CLASS),
    },
    {
      key: 'finalCapitalValue',
      label: t('floorTable.columns.capitalValue'),
      tooltip: t('floorTable.tooltips.capitalValue'),
      render: (row) => renderCellBox(row.finalCapitalValue, TOTAL_CELL_CLASS),
    },
  ];

  return columns;
}

export function buildExpandHref(
  searchParams: Record<string, string | string[] | undefined>,
  rowId: number,
  expandedRowIds: number[]
) {
  return buildExpandedRowsHref(searchParams, rowId, expandedRowIds, 'capitalExpand');
}
