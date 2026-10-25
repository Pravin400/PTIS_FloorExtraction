'use client';

import { useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { ProgressBar } from '@/components/common/ProgressBar';
import { GapAnalysisSummaryCardsProps } from '@/types/PropertyMedia/PropertyMedia.types';
import { calculateMissingPercentage } from "@/lib/utils/PropertyMedia/propertyMediaHelper";
import { GAP_ANALYSIS_SUMMARY_CARD_CONFIGS } from '@/lib/constants/propertyMedia.constants';

export function GapAnalysisSummaryCards({
    dashboardStats,
    activeCategory,
    onCategoryClick,
    t
}: GapAnalysisSummaryCardsProps) {
    const cards = useMemo(() => {
        return GAP_ANALYSIS_SUMMARY_CARD_CONFIGS.map((config) => {
            const stats = config.getStats(dashboardStats);
            const missing = stats?.missing ?? 0;
            const applicable = stats?.applicable ?? 0;
            const available = stats?.available ?? 0;

            return {
                key: config.key,
                categoryKey: String(config.id),
                title: t(config.titleKey),
                icon: config.icon,
                iconBg: config.iconBg,
                iconColor: config.iconColor,
                missing,
                applicable,
                available,
                missingPercentage: calculateMissingPercentage(missing, applicable),
            };
        });
    }, [dashboardStats, t]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            {cards.map((card) => {
                const Icon = card.icon;
                const isActive = activeCategory?.toLowerCase() === card.categoryKey;

                return (
                    <Card
                        key={card.key}
                        padding="none"
                        role="button"
                        tabIndex={0}
                        onClick={() => onCategoryClick?.(card.categoryKey)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onCategoryClick?.(card.categoryKey);
                            }
                        }}
                        className={`w-full cursor-pointer rounded-xl border p-4 flex flex-col justify-between transition-all duration-200 select-none ${isActive
                            ? '!border-blue-600 ring-2 ring-blue-200 bg-blue-50/20 shadow-md -translate-y-0.5'
                            : 'border-blue-100 shadow-sm bg-white hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-md'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-3">
                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${card.iconBg}`}>
                                    <Icon className={`h-5 w-5 ${card.iconColor}`} />
                                </div>

                                <div className="flex flex-col">
                                    <span className="text-xs font-medium text-slate-500">
                                        {card.title}
                                    </span>

                                    <span className="text-xl font-bold text-slate-900 leading-tight">
                                        {card.missing.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <Badge
                                variant="warning"
                                size="sm"
                                className="bg-amber-50 text-amber-600 border-amber-100 font-semibold"
                            >
                                {card.missingPercentage}%
                            </Badge>
                        </div>

                        <div className="flex flex-col gap-2 pt-2">
                            <div className="grid grid-cols-3 gap-2">
                                <Card
                                    padding="none"
                                    className="bg-blue-50/40 border border-blue-100 rounded-lg p-2 text-left"
                                >
                                    <span className="block text-[11px] text-slate-500 font-medium">
                                        {t('gapAnalysis.summaryCards.applicable')}
                                    </span>
                                    <span className="block text-xs font-bold text-[#173A67] mt-0.5">
                                        {card.applicable.toLocaleString()}
                                    </span>
                                </Card>

                                <Card
                                    padding="none"
                                    className="bg-blue-50/40 border border-blue-100 rounded-lg p-2 text-left"
                                >
                                    <span className="block text-[11px] text-slate-500 font-medium">
                                        {t('gapAnalysis.summaryCards.available')}
                                    </span>
                                    <span className="block text-xs font-bold text-[#173A67] mt-0.5">
                                        {card.available.toLocaleString()}
                                    </span>
                                </Card>

                                <Card
                                    padding="none"
                                    className="bg-blue-50/40 border border-blue-100 rounded-lg p-2 text-left"
                                >
                                    <span className="block text-[11px] text-slate-500 font-medium">
                                        {t('gapAnalysis.summaryCards.missing')}
                                    </span>
                                    <span className="block text-xs font-bold text-[#173A67] mt-0.5">
                                        {card.missing.toLocaleString()}
                                    </span>
                                </Card>
                            </div>

                            <div className="px-1 pt-1">
                                <ProgressBar
                                    percentage={Number(card.missingPercentage)}
                                    size="md"
                                    color="blue"
                                />
                            </div>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}