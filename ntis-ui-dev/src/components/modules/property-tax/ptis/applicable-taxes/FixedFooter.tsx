'use client';

import { Button } from '@/components/common';
import { useTranslations } from 'next-intl';
interface FixedFooterProps {
  onConfirm: () => void;
  totalAmount?: number;
}

export const FixedFooter = ({ onConfirm, totalAmount = 0 }: FixedFooterProps) => {
  const t = useTranslations('applicableTaxes');
  return (
    <div className="w-full bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 shrink-0">
      <div className="flex flex-col">
        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
          {t('totalTaxLabel')}
        </span>
        <span className="text-xl font-black text-blue-900">
          {t('currencySymbol')} {totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
      
      <div className="flex items-center gap-3">
        <Button
          variant="primary"
          onClick={onConfirm}
          className="font-bold border-slate-300 text-slate-700 hover:bg-blue-600"
        >
          {t('done')}
        </Button>
      </div>
    </div>
  );
};

export default FixedFooter;