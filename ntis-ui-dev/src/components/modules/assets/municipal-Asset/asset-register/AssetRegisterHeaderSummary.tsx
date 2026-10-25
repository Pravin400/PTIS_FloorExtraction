import {
  AlertCircle,
  BarChart3,
  Landmark,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import { DashboardCard } from '@/components/common/DashboardCard';
import type { AssetRegisterHeaderSummaryProps } from '@/types/asset/asset-register/municipal-asset-register.types';
import { formatIndianCurrencyAbbreviated } from '@/lib/utils/asset-utils/currency-format';

export function AssetRegisterHeaderSummary({ summary, translate }: AssetRegisterHeaderSummaryProps) {
  const totalAssets = summary.totalParentAssets + summary.totalSubUnits;

  const cards = [
    {
      label: translate('Total_Assets'),
      value: totalAssets.toLocaleString('en-IN'),
      subLabel: `${summary.totalParentAssets.toLocaleString('en-IN')} ${translate('Main_Assets')} · ${summary.totalSubUnits.toLocaleString('en-IN')} ${translate('Sub_Units')}`,
      icon: <BarChart3 className="h-5 w-5" />,
      iconBg: 'bg-blue-500 text-white border-blue-400',
      className: 'border-blue-200 !bg-[#2458d7] text-white after:absolute after:-right-5 after:-bottom-8 after:h-20 after:w-20 after:rounded-full after:bg-white/10',
      valueColor: 'text-white',
    },
    {
      label: translate('Total_Capital_Value'),
      value: formatIndianCurrencyAbbreviated(summary.totalCapitalValue),
      subLabel: `${(summary.activeParentAssets + summary.activeSubUnits).toLocaleString('en-IN')} ${translate('Active_Assets')}`,
      icon: <Landmark className="h-5 w-5" />,
      iconBg: 'bg-emerald-500 text-white border-emerald-400',
      className: 'border-emerald-200 !bg-[#09a477] text-white after:absolute after:-right-5 after:-bottom-8 after:h-20 after:w-20 after:rounded-full after:bg-white/10',
      valueColor: 'text-white',
    },
    {
      label: translate('Annual_Revenue'),
      value: formatIndianCurrencyAbbreviated(summary.totalAnnualRevenue),
      subLabel: translate('Current_Year'),
      icon: <TrendingUp className="h-5 w-5" />,
      iconBg: 'bg-violet-500 text-white border-violet-400',
      className: 'border-violet-200 !bg-[#7745e5] text-white after:absolute after:-right-5 after:-bottom-8 after:h-20 after:w-20 after:rounded-full after:bg-white/10',
      valueColor: 'text-white',
    },
    {
      label: translate('Outstanding'),
      value: formatIndianCurrencyAbbreviated(summary.totalOutstanding),
      subLabel: translate('Total_Outstanding'),
      icon: <AlertCircle className="h-5 w-5" />,
      iconBg: 'bg-red-500 text-white border-red-400',
      className: 'border-red-200 !bg-[#e72f34] text-white after:absolute after:-right-5 after:-bottom-8 after:h-20 after:w-20 after:rounded-full after:bg-white/10',
      valueColor: 'text-white',
    },
    {
      label: translate('Identified_Assets'),
      value: summary.encroachedAssets.toLocaleString('en-IN'),
      subLabel: translate('Encroachments'),
      icon: <ShieldAlert className="h-5 w-5" />,
      iconBg: 'bg-amber-500 text-white border-amber-400',
      className: 'border-amber-200 !bg-[#e99000] text-white after:absolute after:-right-5 after:-bottom-8 after:h-20 after:w-20 after:rounded-full after:bg-white/10',
      valueColor: 'text-white',
    },
  ];

  return (
    <section aria-label={translate('Register_Summary')} className="w-full bg-[#f4f7fb] px-3 py-3">
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => (
          <DashboardCard
            key={card.label}
            label={card.label}
            value={card.value}
            subLabel={card.subLabel}
            icon={card.icon}
            iconBg={card.iconBg}
            className={`relative !h-[94px] !min-h-0 !overflow-hidden !rounded-[15px] !border-0 !px-3 !py-2 !shadow-none !gap-3 !flex-row-reverse ${card.className} [&_.text-slate-600]:!text-white/95 [&_.text-slate-500]:!text-white [&_.w-1]:!hidden [&>div:last-child]:!h-10 [&>div:last-child]:!w-10 [&>div:last-child]:!rounded-xl [&>div:last-child]:!border-white/25 [&>div:last-child]:!bg-white/15 [&>div:last-child]:!z-10 [&_.flex-1]:!z-10 [&_.flex-1]:!text-left [&_.flex-1_p:first-child]:!text-[11px] [&_.flex-1_p:first-child]:!font-extrabold [&_.flex-1_p:first-child]:!uppercase [&_.flex-1_p:first-child]:!tracking-wide [&_.flex-1_p:first-child]:!leading-3 [&_.flex-1_p:nth-child(2)]:!mt-0.5 [&_.flex-1_p:nth-child(2)]:!text-[23px] [&_.flex-1_p:nth-child(2)]:!font-extrabold [&_.flex-1_p:nth-child(2)]:!leading-6 [&_.flex-1_p:nth-child(2)]:!whitespace-nowrap [&_.flex-1_p:nth-child(3)]:!mt-1 [&_.flex-1_p:nth-child(3)]:!text-[9px] [&_.flex-1_p:nth-child(3)]:!font-semibold [&_.flex-1_p:nth-child(3)]:!leading-3`}
            valueColor={card.valueColor}
          />
        ))}
      </div>
    </section>
  );
}
