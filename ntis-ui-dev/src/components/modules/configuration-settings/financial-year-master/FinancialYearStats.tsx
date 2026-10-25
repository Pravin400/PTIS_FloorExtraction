import { Calendar } from 'lucide-react';
import { FinancialYearStats as StatsType } from '@/types/financialYear.types';
import { getTranslations } from 'next-intl/server';

interface FinancialYearStatsProps {
  stats: StatsType;
  locale: string;
}

export const FinancialYearStats = async ({ stats, locale }: FinancialYearStatsProps) => {
  const t = await getTranslations({ locale, namespace: 'financialYear' });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="relative overflow-hidden border border-slate-200 rounded-2xl p-4 bg-white shadow-sm transition-all hover:shadow-lg group cursor-default">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">{t('stats.totalYears')}</p>
            <h3 className="text-2xl mt-1 font-black text-slate-900 tabular-nums leading-none">{stats.total}</h3>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600 transition-all group-hover:scale-110 shadow-sm">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
};
