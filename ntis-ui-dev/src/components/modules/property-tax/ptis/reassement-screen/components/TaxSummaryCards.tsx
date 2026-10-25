'use client';

import { useTranslations } from 'next-intl';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Tooltip } from '@/components/common';
// import { Tooltip } from '@/components/ui/tooltip'; // adjust import path as needed

interface SummaryCardData {
  label: string;
  oldValue: string | number;
  newValue: string | number;
  difference: string | number;
  unit?: string;
  color: 'sky' | 'purple' | 'amber' | 'emerald';
}

interface TaxSummaryCardsProps {
  cards: SummaryCardData[];
}

// Higher contrast - white bg + darker text + colored left border for identity
const colorMap = {
  sky: {
    text: 'text-sky-900',
    label: 'text-sky-800',
    bg: 'bg-white',
    border: 'border-sky-300',
    leftBar: 'bg-sky-600',
  },
  purple: {
    text: 'text-purple-900',
    label: 'text-purple-800',
    bg: 'bg-white',
    border: 'border-purple-300',
    leftBar: 'bg-purple-600',
  },
  amber: {
    text: 'text-orange-900',
    label: 'text-orange-800',
    bg: 'bg-white',
    border: 'border-orange-300',
    leftBar: 'bg-orange-600',
  },
  emerald: {
    text: 'text-emerald-900',
    label: 'text-emerald-800',
    bg: 'bg-white',
    border: 'border-emerald-300',
    leftBar: 'bg-emerald-600',
  },
};

type DiffState = 'increase' | 'decrease' | 'neutral';

const getDiffState = (diff: string | number): DiffState => {
  if (typeof diff === 'number') {
    if (diff > 0) return 'increase';
    if (diff < 0) return 'decrease';
    return 'neutral';
  }
  const normalized = diff.trim();
  if (normalized.startsWith('+')) return 'increase';
  if (normalized.startsWith('-')) return 'decrease';
  return 'neutral';
};

// WCAG AA compliant pill colors
const diffColorMap: Record<DiffState, string> = {
  increase: 'text-emerald-900 bg-emerald-100 border-emerald-400',
  decrease: 'text-rose-900 bg-rose-100 border-rose-400',
  neutral: 'text-slate-800 bg-slate-100 border-slate-400',
};

const diffIconMap: Record<DiffState, React.ReactNode> = {
  increase: <ArrowUp className="w-3 h-3" strokeWidth={3} aria-hidden="true" />,
  decrease: <ArrowDown className="w-3 h-3" strokeWidth={3} aria-hidden="true" />,
  neutral: <Minus className="w-3 h-3" strokeWidth={3} aria-hidden="true" />,
};

const diffLabelMap: Record<DiffState, string> = {
  increase: 'Increased by',
  decrease: 'Decreased by',
  neutral: 'No change',
};

const getDiffValue = (diff: string | number) => {
  if (typeof diff === 'number') return Math.abs(diff);
  return diff.replace(/^[-+]/, '').trim();
};

const DiffPill = ({
  difference,
  unit,
  className = '',
}: {
  difference: string | number;
  unit?: string;
  className?: string;
}) => {
  const state = getDiffState(difference);
  const value = getDiffValue(difference);

  return (
    <div
      className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${diffColorMap[state]} ${className}`}
      role="status"
      aria-label={`${diffLabelMap[state]} ${value}${unit ? ` ${unit}` : ''}`}
    >
      {diffIconMap[state]}
      <span>
        {value}
        {unit ? ` ${unit}` : ''}
      </span>
    </div>
  );
};

/* ---------- Truncated value with Tooltip ---------- */
const TruncatedValue = ({
  displayValue,
  tooltipValue,
  className,
}: {
  displayValue: string;
  tooltipValue?: string;
  className?: string;
}) => {
  const fullValue = tooltipValue ?? displayValue;

  return (
    <Tooltip content={<div className="whitespace-normal break-words text-left">{fullValue}</div>} placement="top">
      <span
        tabIndex={0}
        title={fullValue}
        className={`truncate cursor-help outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-1 rounded-sm ${className ?? ''}`}
      >
        {displayValue}
      </span>
    </Tooltip>
  );
};

export function TaxSummaryCards({ cards }: TaxSummaryCardsProps) {
  const t = useTranslations('reassessment');
  const changedStatus = t('summaryCards.changedStatus');

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2"
      role="list"
      aria-label="Tax reassessment summary"
    >
      {cards.map((card, index) => {
        const colors = colorMap[card.color];
        const differenceText = String(card.difference);
        const isUseCard = card.color === 'purple';
        const isAreaCard = card.color === 'sky';
        const isTaxCard = card.color === 'emerald';
        const normalizedDiff = differenceText.trim().toLowerCase();
        const isChangedStatus =
          normalizedDiff === changedStatus.toLowerCase() ||
          differenceText.trim().toUpperCase() === 'CHANGED';

        const oldValueDisplay = `${card.oldValue}${isAreaCard && card.unit ? ` ${card.unit}` : ''}`;
        const newValueDisplay = `${card.newValue}${isAreaCard && card.unit ? ` ${card.unit}` : ''}`;

        return (
          <div
            key={`${card.label}-${index}`}
            role="listitem"
            aria-label={`${card.label}: from ${oldValueDisplay} to ${newValueDisplay}`}
            className={`relative overflow-hidden rounded-lg border ${colors.border} ${colors.bg} pl-3 pr-2.5 py-1.5 transition-all duration-200 hover:shadow-sm hover:border-gray-400`}
          >
            {/* Colored left accent bar - identifies category without hurting contrast */}
            <div
              className={`absolute left-0 top-0 bottom-0 w-1 ${colors.leftBar}`}
              aria-hidden="true"
            />

            {/* Label row */}
            <div className="flex items-center justify-between mb-0.5 gap-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${colors.label} truncate`}>
                {card.label}
              </span>

              {/* Status pill for use card */}
              {isUseCard && (
                isChangedStatus ? (
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border flex-shrink-0 bg-amber-100 text-amber-900 border-amber-400"
                    role="status"
                  >
                    {changedStatus}
                  </span>
                ) : (
                  <Tooltip content={differenceText} placement="top">
                    <span
                      tabIndex={0}
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border flex-shrink-0 bg-slate-100 text-slate-800 border-slate-400 max-w-[120px] truncate cursor-help outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                      role="status"
                    >
                      {differenceText}
                    </span>
                  </Tooltip>
                )
              )}

              {/* Difference - top right for tax card only */}
              {isTaxCard && (
                <DiffPill difference={card.difference} className="flex-shrink-0" />
              )}
            </div>

            {/* Values row */}
            <div className="flex items-center gap-1">
              {/* Old */}
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">
                  {t('summaryCards.oldLabel')}:
                </span>
                <TruncatedValue
                  displayValue={oldValueDisplay}
                  tooltipValue={oldValueDisplay}
                  className="text-xs font-semibold text-slate-900"
                />
              </div>

              {/* Arrow */}
              <span className="text-slate-500 text-[10px] font-bold" aria-hidden="true">→</span>

              {/* New */}
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">
                  {t('summaryCards.newLabel')}:
                </span>
                <TruncatedValue
                  displayValue={newValueDisplay}
                  tooltipValue={newValueDisplay}
                  className={`text-xs font-bold ${colors.text}`}
                />
              </div>

              {/* Difference - bottom row for area and RV cards */}
              {!isUseCard && !isTaxCard && (
                <>
                  <div className="w-px h-6 bg-slate-300 mx-0.5" aria-hidden="true" />
                  <DiffPill
                    difference={card.difference}
                    unit={isAreaCard ? card.unit : undefined}
                  />
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}