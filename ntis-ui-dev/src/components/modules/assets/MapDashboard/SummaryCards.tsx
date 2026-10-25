import { Building2, MapPin, TrendingUp, FileText, Users, DollarSign, ShieldAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatReassessmentCurrency } from '@/lib/utils/format';
import { Card, CardContent } from '@/components/common/Card';
import type { KPICardItemData, KPICardData, KPICardsProps } from '@/types/assets/map-dashboard.types';
export type { KPICardItemData, KPICardData, KPICardsProps };

function KPICardItem({ card }: { card: KPICardItemData }) {
  const Icon = card.icon;

  return (
    <Card
      padding="sm"
      variant="default"
      className={`bg-gradient-to-br ${card.bgGradient} border ${card.borderColor} hover:shadow-lg transition-all duration-300 hover:scale-102 relative overflow-hidden group`}
    >
      <CardContent className="flex items-center gap-3 relative z-10 p-0">
        <div
          className={`p-2 bg-gradient-to-br ${card.gradient} rounded-lg shadow-md transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110 flex items-center justify-center`}
        >
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs ${card.textColor} font-semibold truncate`}>
            {card.label}
          </p>
          <p
            className={`text-xl font-bold bg-gradient-to-r ${card.valueGradient} bg-clip-text text-transparent truncate`}
          >
            {card.value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function SummaryCards({ labels, filteredCitiesLength, totalStats }: KPICardsProps) {
  const t = useTranslations('mapDashboard');

  // Category counts (default to 0 if not present)
  const buildingCount = totalStats.buildingCount ?? 0;
  const landCount = totalStats.landCount ?? 0;
  const infrastructureCount = totalStats.infrastructureCount ?? 0;
  const movableCount = totalStats.movableCount ?? 0;
  const monetizationCount = totalStats.monetizationCount ?? 0;
  const encroachmentCount = totalStats.encroachmentCount ?? 0;

  const cards: KPICardData[] = [
    {
      label: labels.ulbLabel,
      value: filteredCitiesLength,
      icon: Users,
      gradient: 'from-violet-500 to-purple-600',
      bgGradient: 'from-white to-violet-50/50',
      borderColor: 'border-violet-200/40',
      textColor: 'text-violet-600',
      valueGradient: 'from-violet-600 to-purple-700',
      glowColor: 'bg-violet-400/5',
      shadowColor: 'rgba(139, 92, 246, 0.15)',
    },
    {
      label: labels.assetLabel,
      value: totalStats.totalAssets.toLocaleString(),
      icon: Building2,
      gradient: 'from-indigo-500 to-blue-600',
      bgGradient: 'from-white to-indigo-50/50',
      borderColor: 'border-indigo-200/40',
      textColor: 'text-indigo-600',
      valueGradient: 'from-indigo-600 to-blue-700',
      glowColor: 'bg-indigo-400/5',
      shadowColor: 'rgba(99, 102, 241, 0.15)',
    },
    {
      label: labels.buildingLabel,
      value: buildingCount.toLocaleString(),
      icon: Building2,
      gradient: 'from-blue-500 to-indigo-600',
      bgGradient: 'from-white to-blue-50/50',
      borderColor: 'border-blue-200/40',
      textColor: 'text-blue-600',
      valueGradient: 'from-blue-600 to-indigo-700',
      glowColor: 'bg-blue-400/5',
      shadowColor: 'rgba(59, 130, 246, 0.15)',
    },
    {
      label: labels.landLabel,
      value: landCount.toLocaleString(),
      icon: MapPin,
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: 'from-white to-emerald-50/50',
      borderColor: 'border-emerald-200/40',
      textColor: 'text-emerald-600',
      valueGradient: 'from-emerald-600 to-teal-700',
      glowColor: 'bg-emerald-400/5',
      shadowColor: 'rgba(16, 185, 129, 0.15)',
    },
    {
      label: t('cards.infrastructureAssets'),
      value: infrastructureCount.toLocaleString(),
      icon: Building2,
      gradient: 'from-amber-500 to-orange-600',
      bgGradient: 'from-white to-amber-50/50',
      borderColor: 'border-amber-200/40',
      textColor: 'text-amber-600',
      valueGradient: 'from-amber-600 to-orange-700',
      glowColor: 'bg-amber-400/5',
      shadowColor: 'rgba(245, 158, 11, 0.15)',
    },
    {
      label: t('cards.movableAssets'),
      value: movableCount.toLocaleString(),
      icon: FileText,
      gradient: 'from-cyan-500 to-sky-600',
      bgGradient: 'from-white to-cyan-50/50',
      borderColor: 'border-cyan-200/40',
      textColor: 'text-cyan-600',
      valueGradient: 'from-cyan-600 to-sky-700',
      glowColor: 'bg-cyan-400/5',
      shadowColor: 'rgba(6, 182, 212, 0.15)',
    },
    {
      label: t('cards.assetValuation'),
      value: formatReassessmentCurrency(totalStats.totalValue ?? totalStats.assetValue),
      icon: TrendingUp,
      gradient: 'from-teal-500 to-emerald-600',
      bgGradient: 'from-white to-teal-50/50',
      borderColor: 'border-teal-200/40',
      textColor: 'text-teal-600',
      valueGradient: 'from-teal-600 to-emerald-700',
      glowColor: 'bg-teal-400/5',
      shadowColor: 'rgba(20, 184, 166, 0.15)',
    },
    {
      label: t('cards.revenueAnnual'),
      value: formatReassessmentCurrency(0),
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-green-600',
      bgGradient: 'from-white to-emerald-50/50',
      borderColor: 'border-emerald-200/40',
      textColor: 'text-emerald-600',
      valueGradient: 'from-emerald-600 to-green-700',
      glowColor: 'bg-emerald-400/5',
      shadowColor: 'rgba(16, 185, 129, 0.15)',
    },
    {
      label: t('cards.monetization'),
      value: monetizationCount.toLocaleString(),
      icon: DollarSign,
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: 'from-white to-emerald-50/50',
      borderColor: 'border-emerald-200/40',
      textColor: 'text-emerald-600',
      valueGradient: 'from-emerald-600 to-teal-700',
      glowColor: 'bg-emerald-400/5',
      shadowColor: 'rgba(16, 185, 129, 0.15)',
    },
    {
      label: t('cards.encroachment'),
      value: encroachmentCount.toLocaleString(),
      icon: ShieldAlert,
      gradient: 'from-rose-500 to-red-600',
      bgGradient: 'from-white to-rose-50/50',
      borderColor: 'border-rose-200/40',
      textColor: 'text-rose-600',
      valueGradient: 'from-rose-600 to-red-700',
      glowColor: 'bg-rose-400/5',
      shadowColor: 'rgba(244, 63, 94, 0.15)',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
      {cards.map((card, index) => (
        <KPICardItem
          key={index}
          card={card}
        />
      ))}
    </div>
  );
}
