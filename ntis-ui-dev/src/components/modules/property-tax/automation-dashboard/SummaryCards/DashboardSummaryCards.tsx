
import { IndianRupee, TrendingUp, CheckCircle2 } from 'lucide-react';
import { MainCardsData } from '@/types/automation-dashboard/automation-maincard/automation-maincart.type';
import { formatIndianNumber } from '@/lib/utils/format';
import { useTranslations } from 'next-intl';

const StandardMetrics = ({ value1, value2, value3, demandColor, t }: { value1?: string | number, value2?: string | number, value3?: string | number, demandColor: string, t: (key: string) => string }) => {
  const labelClass = "text-[11px] text-slate-500 uppercase font-bold tracking-tight mb-1";
  const valueClass = "text-[18px] text-slate-900 font-bold leading-none";
  return (
    <div className="flex items-center justify-between gap-3 mt-1">
      <div className="text-center flex-1">
        <p className={labelClass}>{t('metrics.structure')}</p>
        <p className={valueClass}>{value1 || '0'}</p>
      </div>
      <div className="h-8 w-px bg-slate-200" />
      <div className="text-center flex-1">
        <p className={labelClass}>{t('metrics.unit')}</p>
        <p className={valueClass}>{value2 || '0'}</p>
      </div>
      <div className="h-8 w-px bg-slate-200" />
      <div className="text-center flex-1">
        <p className={labelClass}>{t('metrics.demand')}</p>
        <p className={`text-[17px] font-bold leading-none ${demandColor}`}>{value3 || '0'}</p>
      </div>
    </div>
  );
};

const AssessmentSubCard = ({ title, data, theme, t }: { title: string, data: { count?: string | number, units?: string | number, demand?: string | number }, theme: 'emerald' | 'amber', t: (key: string) => string }) => {
  const colors = theme === 'emerald'
    ? { bg: 'bg-emerald-50/70', border: 'border-emerald-100', title: 'text-emerald-700', label: 'text-emerald-600/70', value: 'text-emerald-700', divider: 'bg-emerald-200' }
    : { bg: 'bg-amber-50/70', border: 'border-amber-100', title: 'text-amber-700', label: 'text-amber-600/70', value: 'text-amber-800', divider: 'bg-amber-200' };

  const labelClass = `text-[9px] font-bold ${colors.label} mb-0.5 uppercase`;
  const valueClass = `text-[12px] font-bold ${colors.value}`;

  return (
    <div className={`px-2 py-1.5 flex flex-col justify-center`}>
      <p className={`text-[10px] font-bold ${colors.title} mb-1 uppercase tracking-wide`}>{title}</p>
      <div className="flex items-center justify-between gap-2 border-t border-slate-200 pt-2 mt-1">
        <div className="text-center">
          <p className={labelClass}>{t('metrics.structure')}</p>
          <p className={valueClass}>{data?.count || '0'}</p>
        </div>
        <div className={`h-6 w-px ${colors.divider}`} />
        <div className="text-center">
          <p className={labelClass}>{t('metrics.units')}</p>
          <p className={valueClass}>{data?.units || '0'}</p>
        </div>
        <div className={`h-6 w-px ${colors.divider}`} />
        <div className="text-center">
          <p className={labelClass}>{t('metrics.demand')}</p>
          <p className={valueClass}>{data?.demand || '0'}</p>
        </div>
      </div>
    </div>
  );
};

export function DashboardSummaryCards({ serverData: apiStats }: { serverData?: MainCardsData | null }) {

  const t = useTranslations('automationDashboard.summaryCards');

  const hasValidApiStats =
    apiStats &&
    apiStats.previouslyRegistered &&
    apiStats.assessmentApproved &&
    apiStats.additionalRevenueGenerated;

  if (!hasValidApiStats) {
    return (
      <div className="mb-2 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
          {[
            { title: t('titles.previouslyRegistered'), icon: IndianRupee, border: "border-l-purple-500" },
            { title: t('titles.assessmentApproved'), icon: CheckCircle2, border: "border-l-emerald-500" },
            { title: t('titles.additionalRevenue'), icon: TrendingUp, border: "border-l-teal-500" },
          ].map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className={`relative overflow-hidden bg-white border border-slate-200 border-t-0 border-r-0 border-b-0 border-l-4 ${card.border} rounded-xl p-3 shadow-md`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-full shadow-sm flex-shrink-0 bg-slate-400">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-[13px] text-slate-700 font-bold leading-tight min-w-0 truncate">{card.title}</h3>
                </div>
                <p className="text-sm text-slate-500">{t('noData')}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const prev = apiStats.previouslyRegistered;
  const approved = apiStats.assessmentApproved;
  const additional = apiStats.additionalRevenueGenerated;

  const kpiCards = [
    {
      title: t('titles.previouslyRegistered'),
      borderColor: "border-l-purple-500",
      iconBg: "bg-purple-600",
      iconBorder: "",
      iconColor: "text-white",
      icon: IndianRupee,
      content: (
        <StandardMetrics
          value1={formatIndianNumber(prev.structureCount ?? prev.propertyCount)}
          value2={formatIndianNumber(prev.propertyCount ?? prev.unitCount)}
          value3={prev.demand ? (String(prev.demand).includes('₹') ? String(prev.demand) : `₹${prev.demand}`) : '₹0.00'}
          demandColor="text-purple-600"
          t={t}
        />
      )
    },
    {
      title: t('titles.assessmentApproved'),
      borderColor: "border-l-emerald-500",
      iconBg: "bg-emerald-500",
      iconBorder: "",
      iconColor: "text-white",
      icon: CheckCircle2,
      content: (
        <div className="grid grid-cols-2 gap-2 mt-1 divide-x divide-slate-200">
          <AssessmentSubCard
            title={t('titles.assessed')}
            data={{
              count: formatIndianNumber(approved.assessed?.structureCount),
              units: formatIndianNumber(approved.assessed?.unitCount),
              demand: approved.assessed?.demand ? (String(approved.assessed.demand).includes('₹') ? String(approved.assessed.demand) : `₹${approved.assessed.demand}`) : '₹0.00'
            }}
            theme="emerald"
            t={t}
          />
          <AssessmentSubCard
            title={t('titles.unassessed')}
            data={{
              count: formatIndianNumber(approved.unassessed?.structureCount),
              units: formatIndianNumber(approved.unassessed?.unitCount),
              demand: approved.unassessed?.demand ? (String(approved.unassessed.demand).includes('₹') ? String(approved.unassessed.demand) : `₹${approved.unassessed.demand}`) : '₹0.00'
            }}
            theme="amber"
            t={t}
          />
        </div>
      )
    },
    {
      title: t('titles.additionalRevenue'),
      borderColor: "border-l-teal-500",
      iconBg: "bg-teal-500",
      iconBorder: "",
      iconColor: "text-white",
      icon: TrendingUp,
      content: (
        <StandardMetrics
          value1={formatIndianNumber(additional.structureCount)}
          value2={formatIndianNumber(additional.unitCount)}
          value3={additional.demand ? (String(additional.demand).includes('₹') ? String(additional.demand) : `₹${additional.demand}`) : '₹0.00'}
          demandColor="text-teal-600"
          t={t}
        />
      )
    },
  ];

  return (
    <div className="mb-2 w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
        {kpiCards?.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className={`relative overflow-hidden bg-white border border-slate-200 border-t-0 border-r-0 border-b-0 border-l-4 ${card.borderColor} rounded-xl p-3 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`${card?.iconBg} ${card?.iconBorder} p-1.5 rounded-full shadow-sm flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${card?.iconColor || 'text-white'}`} />
                </div>
                <h3 className="text-[13px] text-slate-700 font-bold leading-tight truncate">{card?.title}</h3>
              </div>

              {card?.content}
            </div>
          );
        })}
      </div>
    </div>
  );
}