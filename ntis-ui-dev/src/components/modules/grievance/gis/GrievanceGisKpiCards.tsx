'use client';

/**
 * Grievance GIS KPI Cards
 * Standard: Clean Architecture / ntis-ui
 * Uses the platform standard `@/components/common/DashboardCard` component
 * with dynamic data calculated from GET /api/gis/grievance/kpis.
 */

import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Layers,
} from 'lucide-react';
import { DashboardCard } from '@/components/common/DashboardCard';
import type { GisGrievanceKpiCardDto } from '@/types/grievance/grievance-gis.types';
import { cn } from '@/lib/utils/cn';

interface GrievanceGisKpiCardsProps {
  cards: GisGrievanceKpiCardDto[];
  totalGrievances: number;
  activeKpiCode?: string;
  onSelectKpi?: (kpiCode: string | undefined) => void;
  isLoading?: boolean;
}

const getKpiIcon = (kpiCode: string, color?: string) => {
  const code = kpiCode?.toUpperCase() || '';
  let IconComponent = FileText;
  if (code.includes('PENDING') || code.includes('REGISTER')) {
    IconComponent = Clock;
  } else if (code.includes('PROGRESS')) {
    IconComponent = Layers;
  } else if (code.includes('RESOLV')) {
    IconComponent = CheckCircle2;
  } else if (code.includes('OVERDUE') || code.includes('ESCALAT')) {
    IconComponent = AlertTriangle;
  } else if (code.includes('AVG') || code.includes('TIME') || code.includes('RESOLUTION')) {
    IconComponent = Flame;
  }

  if (color) {
    return {
      icon: <IconComponent className="w-5 h-5" style={{ color }} />,
      bg: '',
      style: { backgroundColor: `${color}18`, borderColor: `${color}35`, borderWidth: '1px' },
    };
  }

  return { icon: <IconComponent className="w-5 h-5 text-slate-700" />, bg: 'bg-slate-100 text-slate-700' };
};

const getKpiSelectionClass = (kpiCode: string) => {
  const code = kpiCode?.toUpperCase() || '';
  if (code.includes('PENDING') || code.includes('REGISTER')) {
    return 'ring-2 ring-amber-500 shadow-md !bg-amber-50/60';
  }
  if (code.includes('PROGRESS')) {
    return 'ring-2 ring-sky-500 shadow-md !bg-sky-50/60';
  }
  if (code.includes('RESOLV')) {
    return 'ring-2 ring-emerald-500 shadow-md !bg-emerald-50/60';
  }
  if (code.includes('OVERDUE') || code.includes('ESCALAT')) {
    return 'ring-2 ring-red-500 shadow-md !bg-red-50/60';
  }
  return 'ring-2 ring-blue-500 shadow-md !bg-blue-50/60';
};

export function GrievanceGisKpiCards({
  cards,
  activeKpiCode,
  onSelectKpi,
  isLoading = false,
}: GrievanceGisKpiCardsProps) {
  if (isLoading && (!cards || cards.length === 0)) {
    return (
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-white/70 rounded-xl border border-slate-200/80 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!cards || cards.length === 0) {
    return null;
  }

  const displayCards: GisGrievanceKpiCardDto[] = cards;

  const count = displayCards.length;
  const gridColsClass =
    count <= 1
      ? 'grid-cols-1'
      : count === 2
      ? 'grid-cols-2'
      : count === 3
      ? 'grid-cols-1 sm:grid-cols-3'
      : count === 4
      ? 'grid-cols-2 sm:grid-cols-4'
      : count === 5
      ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
      : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6';

  return (
    <div className={cn('w-full grid gap-2.5 sm:gap-3', gridColsClass)}>
      {displayCards.map((card) => {
        const cardColor = card.color || card.colorCode;
        const { icon, bg } = getKpiIcon(card.kpiCode, cardColor);
        const isSelected = activeKpiCode === card.kpiCode;
        const displayValue = isLoading
          ? '...'
          : card.formattedValue ??
            (card.rawValue !== undefined
              ? card.rawValue.toLocaleString()
              : card.count !== undefined
              ? card.count.toLocaleString()
              : '0');

        const isTotalCard = card.kpiCode?.toUpperCase().includes('TOTAL');

        return (
          <div
            key={card.kpiCode}
            onClick={() => onSelectKpi?.(isSelected ? undefined : card.kpiCode)}
            className={cn(
              'relative cursor-pointer transition-transform active:scale-98 rounded-xl overflow-hidden',
              isSelected && (cardColor ? 'shadow-md' : getKpiSelectionClass(card.kpiCode))
            )}
            style={
              isSelected && cardColor
                ? {
                    boxShadow: `0 0 0 2px ${cardColor}`,
                  }
                : undefined
            }
          >
            <DashboardCard
              label={card.title}
              value={displayValue}
              subLabel={card.unit ? card.unit : (card.percentage && card.percentage > 0 && !isTotalCard ? `${card.percentage.toFixed(0)}%` : undefined)}
              icon={icon}
              iconBg={cardColor ? undefined : bg}
              className="rounded-xl !py-2.5 transition-all"
            />
            {cardColor && (
              <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl pointer-events-none z-10"
                style={{ backgroundColor: cardColor }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

GrievanceGisKpiCards.displayName = 'GrievanceGisKpiCards';
