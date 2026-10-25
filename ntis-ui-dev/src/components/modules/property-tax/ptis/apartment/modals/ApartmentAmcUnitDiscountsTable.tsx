'use client';
import React, { useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/ActionButton';
import { MasterTable, Column } from '@/components/common/MasterTable';
import { formatFullCurrency } from '@/lib/utils/format';
import { Info } from 'lucide-react';

export interface UnitDiscount {
  id: string;
  propUnit: string;
  wingInfo: string;
  owner: string;
  use: string;
  type: 'Early Payment' | 'Women Ownership' | 'Green Building';
  discountRule: string;
  amount: number;
  [key: string]: unknown;
}

const getTypeBadgeClasses = (type: UnitDiscount['type']) => {
  switch (type) {
    case 'Early Payment': return 'border-amber-400 bg-amber-50 text-amber-700';
    case 'Women Ownership': return 'border-orange-400 bg-orange-50 text-orange-700';
    case 'Green Building': return 'border-emerald-400 bg-emerald-50 text-emerald-700';
    default: return 'border-slate-300 bg-slate-50 text-slate-600';
  }
};

export const AmcUnitWiseDiscounts: React.FC<{ propertiesCount: number; units: UnitDiscount[]; t: (key: string) => string }> = ({ propertiesCount, units, t }) => {
  const columns = useMemo<Column<UnitDiscount>[]>(() => [
    {
      key: 'propUnit',
      label: <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">{t('propUnit')}</span>,
      render: (_, row) => (
        <div>
          <div className="text-xs font-black text-slate-800">{row.propUnit}</div>
          <div className="text-[10px] font-bold text-slate-400 mt-0.5">{row.wingInfo}</div>
        </div>
      ),
    },
    {
      key: 'owner',
      label: <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">{t('ownerUse')}</span>,
      render: (_, row) => (
        <div>
          <div className="text-xs font-bold text-slate-800">{row.owner}</div>
          <div className="text-[10px] font-bold text-slate-400 mt-0.5">{row.use}</div>
        </div>
      ),
    },
    {
      key: 'type',
      label: <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">{t('type')}</span>,
      render: (_val, row) => (
        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border ${getTypeBadgeClasses(row.type)}`}>
          {row.type}
        </span>
      ),
    },
    {
      key: 'discountRule',
      label: <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">{t('discountRule')}</span>,
      render: (_, row) => (
        <span className="text-[11px] font-semibold text-slate-600">{row.discountRule}</span>
      ),
    },
    {
      key: 'amount',
      label: <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">{t('amount')}</span>,
      align: 'right',
      render: (_, row) => (
        <span className="text-sm font-black text-emerald-600">{formatFullCurrency(row.amount)}</span>
      ),
    }
  ], [t]);

  return (
    <Card padding="sm" className="mb-4 shadow-sm border-slate-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-black text-slate-900 tracking-wide uppercase">{t('unitWiseDiscount')}</span>
        <div className="bg-blue-50 text-blue-600 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-blue-200">
          {propertiesCount} {t('properties').toUpperCase()}
        </div>
      </div>
      <div className="border border-slate-700 rounded-xl overflow-hidden">
        <MasterTable columns={columns} data={units} isPagination={false} paginationConfig={{ enabled: false }} />
      </div>
    </Card>
  );
};

export const AmcExemptionPosition: React.FC<{ exemptCount: number; totalAmount: number; t: (key: string) => string }> = ({ exemptCount, totalAmount, t }) => (
  <Card padding="sm" className="mb-4 shadow-sm border-slate-200 p-4">
    <div className="flex items-center justify-between mb-4">
      <span className="text-[11px] font-black text-slate-900 tracking-wide uppercase">{t('exemptionPosition')}</span>
      <div className="bg-purple-50 text-purple-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-purple-200">
        {formatFullCurrency(totalAmount)}
      </div>
    </div>
    <div className="border border-slate-700 rounded-xl p-3 flex items-center justify-between mb-3 shadow-sm bg-white">
      <span className="text-[11px] font-bold text-purple-900">
        {exemptCount} {t('exempt')} {exemptCount === 1 ? t('property') : t('properties')} / {t('units')}
      </span>
      <span className="text-sm font-black text-purple-900">
        {formatFullCurrency(totalAmount)}
      </span>
    </div>
    <div className="flex items-start gap-1.5 text-blue-600">
      <Info size={14} className="mt-0.5 shrink-0" />
      <span className="text-[10px] font-bold leading-tight">{t('clickExemptionSection')}</span>
    </div>
  </Card>
);

export const AmcFooter: React.FC<{ onClose: () => void; onViewLedger: () => void; t: (key: string) => string }> = ({ onClose, onViewLedger, t }) => (
  <div className="flex items-center gap-3 bg-white pt-4 pb-2 border-t border-slate-100">
    <Button variant="ghost" onClick={onClose} className="flex-1 py-3 px-4 border border-slate-300 rounded-xl text-xs font-black text-slate-700 hover:bg-slate-50 transition-colors uppercase tracking-wider">
      {t('close')}
    </Button>
    <Button variant="primary" onClick={onViewLedger} className="flex-[2] py-3 px-4 border border-transparent rounded-xl text-xs font-black text-white bg-[#032ea1] hover:bg-[#022175] transition-colors uppercase tracking-wider shadow-sm">
      {t('viewDetailedAmcLedger')}
    </Button>
  </div>
);
