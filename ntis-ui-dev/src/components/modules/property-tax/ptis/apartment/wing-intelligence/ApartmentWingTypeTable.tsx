'use client';
import React, { useMemo } from 'react';
import { ApartmentPropertyTypeIcon } from '../tables/ApartmentPropertyTypeIcon';
import { useTranslations } from 'next-intl';
import { formatCompactCurrency, formatCompactCurrencyWithSign } from '@/lib/utils/format';
import { MasterTable, Column } from '@/components/common/MasterTable';
import { WingType, WingTypeTableProps } from '@/types/property-tax/apartment';

const COMMON_HEADER_CLASS = '!py-1.5 text-[13px] font-black uppercase tracking-wider';
const COMMON_CELL_CLASS = '!py-1 !px-1';

export const ApartmentWingTypeTable: React.FC<WingTypeTableProps> = ({ types, areaUnit }) => {
  const t = useTranslations('ptisRedesign.wingIntelligence');

  const areaHeaderLabel = areaUnit ? `Area ${areaUnit}` : (t('areaSqFt') || 'Area ft²');

  const columns = useMemo<Column<WingType>[]>(() => [
    {
      key: 'type',
      label: t('type') || 'Type',
      align: 'left',
      headerClassName: `${COMMON_HEADER_CLASS} !pr-1 !pl-3 text-slate-700`,
      cellClassName: '!py-1 !pr-0 !pl-0',
      render: (_val, row) => {
        const typeLabel =
          row.type === 'Residential'
            ? (t('residential') || row.type)
            : row.type === 'Commercial'
            ? (t('commercial') || row.type)
            : row.type === 'Amenity'
            ? (t('amenity') || row.type)
            : row.type;

        return (
          <div className="flex items-center gap-1.5">
            <ApartmentPropertyTypeIcon type={row.type} />
            <span className="font-extrabold text-[10px] text-slate-700">{typeLabel}</span>
          </div>
        );
      },
    },
    {
      key: 'units',
      label: t('units') || 'Units',
      align: 'center',
      headerClassName: `${COMMON_HEADER_CLASS} !px-1 text-slate-700`,
      cellClassName: COMMON_CELL_CLASS,
      render: (_val, row) => (
        <span className="font-bold text-[10px] text-slate-800">{row.units}</span>
      ),
    },
    {
      key: 'area',
      label: areaHeaderLabel,
      align: 'center',
      headerClassName: `${COMMON_HEADER_CLASS} !px-1 text-slate-700`,
      cellClassName: COMMON_CELL_CLASS,
      render: (_val, row) => (
        <span className="font-bold text-[10px] text-slate-800">{row.area.toLocaleString()}</span>
      ),
    },
    {
      key: 'old',
      label: t('old') || 'Old',
      align: 'center',
      headerClassName: `${COMMON_HEADER_CLASS} !px-1 text-slate-600`,
      cellClassName: COMMON_CELL_CLASS,
      render: (_val, row) => (
        <div className="font-semibold text-[10px] text-slate-500">{formatCompactCurrency(row.old)}</div>
      ),
    },
    {
      key: 'cur',
      label: t('cur') || 'Cur',
      align: 'center',
      headerClassName: `${COMMON_HEADER_CLASS} !px-1 text-blue-700`,
      cellClassName: COMMON_CELL_CLASS,
      render: (_val, row) => (
        <div className="font-bold text-[10px] text-blue-600">{formatCompactCurrency(row.cur)}</div>
      ),
    },
    {
      key: 'retro',
      label: t('retro') || 'Retro',
      align: 'center',
      headerClassName: `${COMMON_HEADER_CLASS} !px-1 text-purple-700`,
      cellClassName: COMMON_CELL_CLASS,
      render: (_val, row) => (
        <div className="font-bold text-[10px] text-purple-600">{formatCompactCurrency(row.retro)}</div>
      ),
    },
    {
      key: 'total',
      label: t('total') || 'Total',
      align: 'center',
      headerClassName: `${COMMON_HEADER_CLASS} !px-1 text-slate-700`,
      cellClassName: COMMON_CELL_CLASS,
      render: (_val, row) => (
        <div className="font-bold text-[10px] text-slate-900">{formatCompactCurrency(row.total)}</div>
      ),
    },
    {
      key: 'rev',
      label: t('deltaRev') || 'Δ Rev',
      align: 'center',
      headerClassName: `${COMMON_HEADER_CLASS} !px-1 text-emerald-700`,
      cellClassName: COMMON_CELL_CLASS,
      render: (_val, row) => {
        const isNegative = typeof row.rev === 'number' ? row.rev < 0 : String(row.rev).trim().startsWith('-');
        return (
          <span className={`font-bold text-[9px] px-1 py-0.5 rounded inline-block ${isNegative ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
            {formatCompactCurrencyWithSign(row.rev)}
          </span>
        );
      },
    },
  ], [t, areaHeaderLabel]);

  return (
    <div className="w-full text-[10px]">
      <MasterTable<WingType>
        columns={columns}
        data={types}
        tableClassName="w-full !text-[10px]"
        theadClassName="!bg-white bg-none [&_th]:!text-[9px] [&_th]:!py-1"
        rowClassName={() => 'hover:bg-blue-50/70 transition-colors duration-150 cursor-default'}
        containerClassName="!gap-0 [&>div]:!border-none [&>div]:!shadow-none [&>div]:!rounded-none [&>div]:!bg-transparent"
        maxBodyHeightClassName="max-h-[140px]"
      />
    </div>
  );
};

export default ApartmentWingTypeTable;
