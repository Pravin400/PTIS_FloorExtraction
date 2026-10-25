/* eslint-disable i18next/no-literal-string */
import { cn } from '@/lib/utils/cn';
import type {
  RateableValueDetail,
  RateableValueResponse,
  RateableValueTaxes,
  RateableRow,
} from '@/types/rateableValue.types';
import { formatIndianNumber, formatNumberPair, formatNumericDate } from '@/lib/utils/format';
import type { FloorDetailsTableColumn } from '@/components/common';
import { buildExpandedRowsHref } from '@/lib/utils/ptis';
import { renderCellBox, renderCellBoxWithTooltip } from '@/lib/utils/table-renderers';

const CELL_CLASS =
  'text-[12px] text-center font-normal text-slate-800 whitespace-nowrap';
const VALUE_CLASS =
  'text-[11px] text-center truncate max-w-[120px] outline-none whitespace-nowrap';

const EMERALD_CELL_CLASS =
  'text-[12px] text-center font-semibold text-emerald-700 whitespace-nowrap';

const AMBER_CELL_CLASS =
  'text-[12px] text-center font-bold text-amber-700 whitespace-nowrap';

export function getRateableDetails(
  rateableData: RateableValueResponse | null
): RateableValueDetail[] {
  if (!rateableData) return [];
  return rateableData.details ?? rateableData.items ?? [];
}

export function mapRateableRow(item: RateableValueDetail): RateableRow {
  const taxes = (Array.isArray(item.taxes) ? item.taxes : []) as RateableValueTaxes;
  return {
    id: item.propertyDetailsId,
    taxable: item.taxable === true ? 'Yes' : item.taxable === false ? 'No' : '-',
    floor: item.floor || '-',
    subFloor: item.subFloor || '-',
    constructionYear: item.constructionYear || '-',
    assessmentYear: item.assessmentYear || '-',
    constructionType: item.constructionType || '-',
    natureTypeBuilding: item.use || '-',
    subType: item.subTypeOfUse || '-',
    noOfRooms: item.noOfRooms?.toString() || '-',
    carpetArea: formatNumberPair(item.carpetAreaSqFeet, item.carpetAreaSqMeter, 2, 2),
    builtUpArea: formatNumberPair(item.builtupAreaSqFeet, item.builtupAreaSqMeter, 2, 2),
    ocNumber: item.occupancyNumber || '-',
    ocDate: formatNumericDate(item.occupancyDate),
    renterName: item.renterName || '-',
    annualRent: formatNumberPair(item.rentMonthly, item.rentYearly, 0, 2),
    appliedOn: item.appliedOn || '-',
    rate: formatNumberPair(item.monthlyRate, item.yearlyRate, 0, 2),
    yearlyRentalValue: formatIndianNumber(item.yearlyRent, 0, 2),
    depreciation: `${formatIndianNumber(item.depreciation, 0, 2)}(${Number((item.depreciationPer ?? 0).toFixed(2))}%)`,
    maintenance: formatIndianNumber(item.maintenance, 0, 2),
    alv: formatIndianNumber(item.annualRentalValue, 0, 2),
    rv: formatIndianNumber(item.rateableValue, 0, 2),
    taxes,
  };
}

export function getRateableColumns(
  t: (key: string) => string
): FloorDetailsTableColumn<RateableRow>[] {
  const column = (
    key: keyof RateableRow,
    labelKey: string,
    renderClass: string,
    fallback = '-'
  ) => ({
    key,
    label: t(`floorTable.columns.${labelKey}`),
    tooltip: t(`floorTable.tooltips.${labelKey}`),
    render: (row: RateableRow) => renderCellBox(String(row[key]), renderClass, fallback),
  });

  const columns: FloorDetailsTableColumn<RateableRow>[] = [
    {
      key: 'taxable',
      label: t('floorTable.columns.taxable'),
      tooltip: t('floorTable.tooltips.taxable'),
      render: (row: RateableRow) => {
        const val = String(row.taxable ?? '-').trim();
        const isYes = val === 'Yes' || val === 'true';
        const isNo = val === 'No' || val === 'false';
        return (
          <div className="flex items-center justify-center font-bold text-[11px]" title={val}>
            {isYes && <span className="text-emerald-600 font-bold">Yes</span>}
            {isNo && <span className="text-rose-600 font-bold">No</span>}
            {!isYes && !isNo && <span className="text-slate-400 font-bold">-</span>}
          </div>
        );
      },
    },
    column('floor', 'floor', CELL_CLASS),
    column('subFloor', 'subFloor', CELL_CLASS),
    column('constructionYear', 'constYear', CELL_CLASS),
    column('assessmentYear', 'asstYear', CELL_CLASS),
    column('constructionType', 'constType', CELL_CLASS),
    column('natureTypeBuilding', 'use', CELL_CLASS),
    column('subType', 'subType', CELL_CLASS), // Using 'subType' as key from i18n json
    column('noOfRooms', 'noOfRooms', CELL_CLASS),
    column('carpetArea', 'carpetArea', CELL_CLASS),
    column('builtUpArea', 'builtupArea', CELL_CLASS),
    column('ocNumber', 'ocNumber', CELL_CLASS),
    column('ocDate', 'ocDate', CELL_CLASS),
    {
      key: 'renterName',
      label: t('floorTable.columns.renterName'),
      tooltip: t('floorTable.tooltips.renterName'),
      render: (row) => renderCellBoxWithTooltip(row.renterName, cn(CELL_CLASS, VALUE_CLASS)),
    },
    column('annualRent', 'rentMY', CELL_CLASS),
    column('appliedOn', 'appliedOn', CELL_CLASS),
    column('rate', 'rateMY', CELL_CLASS),
    {
      key: 'yearlyRentalValue',
      label: t('floorTable.columns.rentalValue'),
      tooltip: t('floorTable.tooltips.rentalValue'),
      render: (row) => renderCellBox(row.yearlyRentalValue, EMERALD_CELL_CLASS),
    },
    column('depreciation', 'depreciation', CELL_CLASS),
    {
      key: 'alv',
      label: t('floorTable.columns.alv'),
      tooltip: t('floorTable.tooltips.alv'),
      render: (row) => renderCellBox(row.alv, EMERALD_CELL_CLASS),
    },
    column('maintenance', 'mr', CELL_CLASS),
    {
      key: 'rv',
      label: t('floorTable.columns.rv'),
      tooltip: t('floorTable.tooltips.rv'),
      render: (row) => renderCellBox(row.rv, AMBER_CELL_CLASS),
    },
  ];

  return columns;
}

export function buildExpandHref(
  searchParams: Record<string, string | string[] | undefined>,
  rowId: number,
  expandedRowIds: number[]
) {
  return buildExpandedRowsHref(searchParams, rowId, expandedRowIds, 'rateableExpand');
}