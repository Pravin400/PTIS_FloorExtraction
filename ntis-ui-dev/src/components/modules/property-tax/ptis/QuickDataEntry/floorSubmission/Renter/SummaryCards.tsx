"use client";

import { memo } from "react";
import { MasterTable } from "@/components/common";
import { useTranslations } from "next-intl";

interface SummaryRow {
  year: string;
  baseRent: number;
  finalRent: number;
  totalIncrement: number;
  totalRentCollected: number;
  incrementCount: number;
  monthCount: number;
  [key: string]: unknown;
}

interface SummaryCardsProps {
  yearlySummary: SummaryRow[];
  isCompounding: boolean;
}

export const SummaryCards = memo((props: SummaryCardsProps) => {
  const t = useTranslations('quickDataEntry');

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg shadow-sm overflow-hidden animate-[fadeIn_0.3s_ease-out]">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between">
        <h4 className="text-[10px] font-black text-slate-700 flex items-center gap-2 uppercase tracking-[0.15em]">
          📊 {t('floor.table.yearlyRentSummary')}
        </h4>
      </div>

      <div className="w-full">
        <MasterTable<SummaryRow>
          maxBodyHeightClassName="max-h-[300px]"
          containerClassName="border-none shadow-none"
          tableClassName="min-w-[500px]"
          columns={[
            { key: 'year', label: t('floor.table.year'), headerClassName: 'text-[10px] uppercase tracking-widest text-gray-400 font-bold', cellClassName: 'text-xs font-bold text-slate-900', width: '15%', render: (val) => String(val) },
            { 
              key: 'baseRent', 
              label: t('floor.table.startingRent'), 
              cellClassName: 'text-right text-xs', 
              headerClassName: 'text-right text-[10px] uppercase tracking-widest text-gray-400 font-bold', 
              render: (val) => <span className="px-2 py-0.5 bg-gray-50 text-gray-700 rounded font-bold">{`₹`}{Number(val).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            },
            { 
              key: 'finalRent', 
              label: t('floor.table.finalRent'), 
              cellClassName: 'text-right text-xs', 
              headerClassName: 'text-right text-[10px] uppercase tracking-widest text-gray-400 font-bold', 
              render: (val) => <span className={`px-2 py-0.5 rounded font-black ${props.isCompounding ? 'bg-purple-100/50 text-purple-700' : 'bg-blue-100/50 text-blue-700'}`}>{`₹`}{Number(val).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            },
            { 
              key: 'totalIncrement', 
              label: t('floor.table.totalIncrement'), 
              cellClassName: 'text-right text-xs', 
              headerClassName: 'text-right text-[10px] uppercase tracking-widest text-gray-400 font-bold', 
              render: (val) => <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded font-black">{`₹`}{Number(val).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            },
            { 
              key: 'totalRentCollected', 
              label: t('floor.table.rentCollected'), 
              cellClassName: 'text-right text-xs', 
              headerClassName: 'text-right text-[10px] uppercase tracking-widest text-gray-400 font-bold', 
              render: (val) => <span className={`px-2 py-0.5 rounded font-black ${props.isCompounding ? 'bg-purple-100/50 text-purple-700' : 'bg-blue-100/50 text-blue-700'}`}>{`₹`}{Number(val).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            },
            { 
              key: 'incrementCount', 
              label: t('floor.table.increments'), 
              cellClassName: 'text-center text-xs', 
              headerClassName: 'text-center text-[10px] uppercase tracking-widest text-gray-400 font-bold', 
              width: '10%',
              render: (val) => <span className="px-2 py-0.5 bg-orange-100/50 text-orange-700 rounded font-black border border-orange-200">{String(val)}</span>
            }
          ]}
          data={props.yearlySummary}
        />
      </div>
    </div>
  );
});

SummaryCards.displayName = 'SummaryCards';
