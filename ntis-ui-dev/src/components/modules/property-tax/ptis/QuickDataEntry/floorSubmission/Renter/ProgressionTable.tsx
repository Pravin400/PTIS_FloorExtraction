"use client";

import { memo } from "react";
import { TrendingUp, ChevronDown, X } from "lucide-react";
import { MasterTable } from "@/components/common";
import { useTranslations } from "next-intl";

interface TableRow {
  month: number;
  duration: string;
  rent: number;
  incrementApplied: number;
  isIncrementMonth: boolean;
  segmentLabel?: string;
  [key: string]: unknown;
}

interface ProgressionTableProps {
  incrementFrequency: string;
  isCalculating: boolean;
  isMonthlyProgressionOpen: boolean;
  setIsMonthlyProgressionOpen: (open: boolean) => void;
  selectedFYFilter?: string | null;
  onClearFilter?: () => void;
  tableProgression: TableRow[];
  segmentProgressionLength: number;
  isCompounding: boolean;
}

export const ProgressionTable = memo(({
  incrementFrequency,
  isCalculating,
  isMonthlyProgressionOpen,
  setIsMonthlyProgressionOpen,
  selectedFYFilter,
  onClearFilter,
  tableProgression,
  segmentProgressionLength,
  isCompounding
}: ProgressionTableProps) => {
  const t = useTranslations('quickDataEntry');

  return (
    <div className={`relative bg-white border-2 border-gray-300 rounded-lg shadow-md overflow-hidden animate-[fadeIn_0.3s_ease-out] transition-opacity duration-200 ${isCalculating ? 'opacity-60' : 'opacity-100'}`}>
      {isCalculating && (
        <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px] z-50 flex items-center justify-center">
          <div className="bg-white/80 px-3 py-1.5 rounded-full shadow-sm border border-blue-100 flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{t('floorSubmission.updating')}</span>
          </div>
        </div>
      )}
      <div
        className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors duration-200"
        onClick={() => setIsMonthlyProgressionOpen(!isMonthlyProgressionOpen)}
      >
        <h4 className="text-[10px] font-black text-slate-700 flex items-center gap-1.5 uppercase tracking-[0.15em]">
          📅 {incrementFrequency} {t('floor.table.rentProgression')}
        </h4>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 bg-slate-200/50 px-2 py-0.5 rounded font-medium">
            {tableProgression.length}{segmentProgressionLength ? " segments" : " periods"}
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isMonthlyProgressionOpen ? 'rotate-180' : 'rotate-0'}`} />
        </div>
      </div>

      <div className={`transition-all duration-500 ease-in-out ${isMonthlyProgressionOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        {selectedFYFilter && (
          <div className="bg-orange-100 border-b-2 border-orange-300 px-4 py-2 flex items-center justify-between animate-[slideDown_0.3s_ease-out]">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-orange-700">🔍 {t('floor.table.filteredBy')}:</span>
              <span className="px-2 py-0.5 bg-orange-200 text-orange-800 rounded font-semibold text-[11px]">{selectedFYFilter}</span>
            </div>
            {onClearFilter && (
              <button
                type="button"
                onClick={onClearFilter}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-orange-300 text-orange-700 rounded text-[10px] font-semibold hover:bg-orange-50 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-200"
              >
                {t('floor.table.clearFilter')}
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        <div className="w-full text-xs">
          <MasterTable<TableRow>
            maxBodyHeightClassName="max-h-[300px]"
            containerClassName="border-none shadow-none"
            tableClassName="min-w-[500px]"
            columns={[
              { key: 'month', label: t('floor.table.period'), cellClassName: 'text-xs font-bold text-gray-800', render: (val) => String(val), width: '20%' },
              { key: 'duration', label: t('floor.table.duration'), cellClassName: 'text-xs text-gray-500', width: '30%' },
              { 
                key: 'rent', 
                label: t('floor.table.rentAmount'), 
                cellClassName: 'text-right text-xs', 
                headerClassName: 'text-right', 
                width: '20%',
                render: (val, row) => (
                  <span className={`px-2 py-0.5 rounded ${row.isIncrementMonth ? 'bg-blue-50 text-blue-700 font-black' : 'bg-gray-50 text-gray-700 font-bold'} border ${row.isIncrementMonth ? 'border-blue-100' : 'border-gray-100'}`}>
                    {`₹`}{Number(val).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                )
              },
              { 
                key: 'incrementApplied', 
                label: t('floor.table.increment'), 
                cellClassName: 'text-right text-xs', 
                headerClassName: 'text-right', 
                width: '15%',
                render: (val, row) => row.isIncrementMonth ? (
                  <span className="px-1.5 py-0.5 bg-green-50 text-green-600 rounded inline-flex items-center gap-0.5 font-bold">
                    <TrendingUp className="w-2.5 h-2.5" />
                    {`₹`}{Number(val).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                ) : <span className="text-gray-400 text-[9px]">—</span>
              },
              { 
                key: 'isIncrementMonth', 
                label: t('floor.table.status'), 
                cellClassName: 'text-center text-xs', 
                width: '15%',
                render: (val, row) =>
                  row.segmentLabel ? (
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase leading-tight inline-block max-w-[200px] whitespace-normal text-left ${
                        row.isIncrementMonth
                          ? "bg-blue-100 text-blue-800 border-blue-200"
                          : "bg-emerald-50 text-emerald-800 border-emerald-200"
                      }`}
                    >
                      {row.segmentLabel}
                    </span>
                  ) : val ? (
                  <span className="px-2 py-0.5 rounded text-[9px] font-black bg-blue-100 text-blue-700 border border-blue-200 uppercase">{`✓`} {t('floor.table.increments')}</span>
                ) : <span className="px-2 py-0.5 bg-gray-50 text-gray-400 border border-gray-100 rounded text-[9px] font-black uppercase">{t('floor.table.noChange')}</span>
              }
            ]}
            data={tableProgression}
            rowClassName={(row) => `transition-colors duration-150 ${row.isIncrementMonth ? (isCompounding ? 'bg-purple-50/50 hover:bg-purple-100/70' : 'bg-blue-50/50 hover:bg-blue-100/70') : 'hover:bg-gray-50'}`}
          />
        </div>
      </div>
    </div>
  );
});

ProgressionTable.displayName = 'ProgressionTable';
