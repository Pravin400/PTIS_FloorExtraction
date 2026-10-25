import type { FloorDetailsTableColumn } from '@/components/common/FloorDetailsTable';
import { formatIndianNumber } from '@/lib/utils/format';
import type { TaxRow, PendingTaxRow, PendingYearTaxDetail, TaxAmountItem } from '@/types/ptisMain-taxdetails.types';
import {
  TAX_LABEL_CLASSES,
  HEADER_TEXT_CLASSES,
  CELL_CENTER_CLASS,
  NUMBER_CELL_CLASSES,
  getTaxRowStyleByLabel,
} from './config';

/**
 * Returns column definitions for Current TaxDetails rows using FloorDetailsTableColumn
 */
function getTaxColumnLabel(taxName: string, t: (key: string) => string): string {
  const camelKey = taxName
    .trim()
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) =>
      index === 0 ? letter.toLowerCase() : letter.toUpperCase()
    )
    .replace(/\s+/g, '');

  if (camelKey.toLowerCase() === 'taxtotal') {
    try {
      const totalTaxText = t('totalTax');
      if (totalTaxText && totalTaxText !== 'totalTax') {
        return totalTaxText;
      }
    } catch {
      // ignore
    }
    return 'TAXTOTAL';
  }

  try {
    const hasFn = (t as unknown as { has?: (k: string) => boolean }).has;
    const hasKey = typeof hasFn === 'function' ? hasFn(camelKey) : true;

    if (hasKey) {
      const translated = t(camelKey);
      if (translated && translated !== camelKey) {
        return translated;
      }
    }
  } catch {
    // Fallback to raw taxName if translation lookup throws
  }

  return taxName;
}

function ensureTotalTaxLast(allTaxNames: string[]): string[] {
  return allTaxNames;
}

export function getTaxDetailsFloorColumns(
  allTaxNames: string[],
  t: (key: string) => string,
  getTaxLabelStyle: (taxType: string) => string
): FloorDetailsTableColumn<TaxRow>[] {
  const orderedTaxNames = ensureTotalTaxLast(allTaxNames);
  const columns: FloorDetailsTableColumn<TaxRow>[] = [
    {
      key: 'taxes',
      label: t('taxes'),
      headerClassName: `${HEADER_TEXT_CLASSES} ${CELL_CENTER_CLASS} sticky left-0 z-20 bg-[#1e3a8a] min-w-[95px] w-[95px] border-r border-blue-700/60`,
      cellClassName: `${CELL_CENTER_CLASS} sticky left-0 z-10 bg-white min-w-[95px] w-[95px] border-r border-blue-200`,
      render: (row: TaxRow) => (
        <div className="w-full flex items-center justify-center px-0.5">
          <div className={`w-full ${TAX_LABEL_CLASSES} ${getTaxLabelStyle(row.labelKey || row.taxes)}`}>
            {row.taxes}
          </div>
        </div>
      ),
    },
  ];

  // Dynamic tax amount columns
  orderedTaxNames.forEach((taxName) => {
    columns.push({
      key: taxName,
      label: getTaxColumnLabel(taxName, t),
      headerClassName: `${HEADER_TEXT_CLASSES} ${CELL_CENTER_CLASS}`,
      cellClassName: CELL_CENTER_CLASS,
      render: (row: TaxRow) => {
        const lowerKey = taxName.trim().toLowerCase();
        const rowRecord = row as unknown as Record<string, unknown>;
        const rawVal = row[taxName] ?? rowRecord[lowerKey];
        const val = (rawVal !== undefined && rawVal !== null && Number(rawVal) !== 0)
          ? rawVal
          : (lowerKey === 'taxtotal' ? (rowRecord.totalTax ?? rawVal) : rawVal);

        const num = Number(val ?? 0);
        const decimals = Number.isInteger(num) ? 0 : 2;
        return (
          <div className={NUMBER_CELL_CLASSES}>
            {formatIndianNumber(num, decimals, decimals)}
          </div>
        );
      },
    });
  });

  return columns;
}

/**
 * Returns column definitions for Arrears/Pending TaxDetails rows using FloorDetailsTableColumn
 */
export function getPendingTaxDetailsFloorColumns(
  allTaxNames: string[],
  t: (key: string) => string,
  _getTaxLabelStyle?: (taxType: string) => string
): FloorDetailsTableColumn<PendingTaxRow>[] {
  const orderedTaxNames = ensureTotalTaxLast(allTaxNames);
  const columns: FloorDetailsTableColumn<PendingTaxRow>[] = [
    {
      key: 'taxes',
      label: t('taxes'),
      headerClassName: `${HEADER_TEXT_CLASSES} ${CELL_CENTER_CLASS} sticky left-0 z-20 bg-[#1e3a8a] min-w-[115px] w-[115px] border-r border-blue-700/60`,
      cellClassName: `${CELL_CENTER_CLASS} sticky left-0 z-10 bg-white min-w-[115px] w-[115px] border-r border-blue-200`,
      render: (row: PendingTaxRow) => (
        <div className="w-full flex items-center justify-center gap-1 px-0.5">
          <div className={`w-full ${TAX_LABEL_CLASSES} ${getTaxRowStyleByLabel(row.policyCode)}`}>
            {row.yearCode ? `${row.policyCode} (${row.yearCode})` : row.policyCode}
          </div>
        </div>
      ),
    },
  ];

  orderedTaxNames.forEach((taxName) => {
    columns.push({
      key: taxName,
      label: getTaxColumnLabel(taxName, t),
      headerClassName: `${HEADER_TEXT_CLASSES} ${CELL_CENTER_CLASS}`,
      cellClassName: CELL_CENTER_CLASS,
      render: (row: PendingTaxRow) => {
        const lowerKey = taxName.trim().toLowerCase();
        let num = 0;
        if (lowerKey === 'totaltax' || lowerKey === 'taxtotal' || lowerKey === 'total tax' || lowerKey === 'total' || lowerKey === 'tax total') {
          num = Number(row.taxTotal ?? 0);
        } else {
          const taxMatch = row.taxAmounts.find(
            (tItem: TaxAmountItem) => tItem.taxName.trim().toLowerCase() === taxName.trim().toLowerCase()
          );
          num = Number(taxMatch?.taxAmount ?? 0);
        }
        const decimals = Number.isInteger(num) ? 0 : 2;
        return (
          <div className={NUMBER_CELL_CLASSES}>
            {formatIndianNumber(num, decimals, decimals)}
          </div>
        );
      },
    });
  });

  return columns;
}

/**
 * Returns column definitions for Expanded Retrospective Pending Year rows using FloorDetailsTableColumn
 */
export function getRetroPendingYearFloorColumns(
  allTaxNames: string[],
  t: (key: string) => string,
  _getTaxLabelStyle?: (taxType: string) => string
): FloorDetailsTableColumn<PendingYearTaxDetail & { id: string }>[] {
  const orderedTaxNames = ensureTotalTaxLast(allTaxNames);
  const columns: FloorDetailsTableColumn<PendingYearTaxDetail & { id: string }>[] = [
    {
      key: 'taxes',
      label: t('taxes'),
      headerClassName: `${HEADER_TEXT_CLASSES} ${CELL_CENTER_CLASS} sticky left-0 z-20 bg-[#1e3a8a] min-w-[115px] w-[115px] border-r border-blue-700/60`,
      cellClassName: `${CELL_CENTER_CLASS} sticky left-0 z-10 bg-white min-w-[115px] w-[115px] border-r border-blue-200`,
      render: (row) => {
        const itemPolicyCode =
          (row as unknown as { policyCode?: string; PolicyCode?: string }).policyCode ||
          (row as unknown as { policyCode?: string; PolicyCode?: string }).PolicyCode;

        return (
          <div className="w-full flex items-center justify-center px-0.5">
            <div className={`w-full ${TAX_LABEL_CLASSES} ${getTaxRowStyleByLabel(itemPolicyCode || '')}`}>
              {itemPolicyCode ? `${itemPolicyCode} (${row.yearCode})` : row.yearCode}
            </div>
          </div>
        );
      },
    },
  ];

  orderedTaxNames.forEach((taxName) => {
    columns.push({
      key: taxName,
      label: getTaxColumnLabel(taxName, t),
      headerClassName: `${HEADER_TEXT_CLASSES} ${CELL_CENTER_CLASS}`,
      cellClassName: CELL_CENTER_CLASS,
      render: (row) => {
        const lowerKey = taxName.trim().toLowerCase();
        let num = 0;
        if (lowerKey === 'totaltax' || lowerKey === 'taxtotal' || lowerKey === 'total tax' || lowerKey === 'total' || lowerKey === 'tax total') {
          num = Number(row.taxTotal ?? 0);
        } else {
          const taxMatch = row.taxAmounts.find(
            (tItem: TaxAmountItem) => tItem.taxName.trim().toLowerCase() === taxName.trim().toLowerCase()
          );
          num = Number(taxMatch?.taxAmount ?? 0);
        }
        const decimals = Number.isInteger(num) ? 0 : 2;
        return (
          <div className={NUMBER_CELL_CLASSES}>
            {formatIndianNumber(num, decimals, decimals)}
          </div>
        );
      },
    });
  });

  return columns;
}
