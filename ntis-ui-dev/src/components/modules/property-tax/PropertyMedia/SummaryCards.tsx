'use client';

import { useTranslations } from 'next-intl';
import {
    House,
    Image,
    Ruler,
    FileText,
} from 'lucide-react';

import { Card } from '@/components/common/Card';
import { SummaryCardsProps } from '@/types/PropertyMedia/PropertyMedia.types';

export function SummaryCards({ dashboardStats }: SummaryCardsProps) {

    const t = useTranslations('propertyMedia');

    const cards = [
        {
            title: t('summaryCards.totalProperties'),
            value: dashboardStats?.totalProperties?.total ?? 0,
            structures: dashboardStats?.totalProperties?.structures ?? 0,
            units: dashboardStats?.totalProperties?.units ?? 0,
            icon: House,
            iconBg: 'bg-orange-50',
            iconColor: 'text-orange-500',
        },
        {
            title: t('summaryCards.buildingPhotoAvailable'),
            value: dashboardStats?.buildingPhotoAvailable?.total ?? 0,
            structures: dashboardStats?.buildingPhotoAvailable?.structures ?? 0,
            units: dashboardStats?.buildingPhotoAvailable?.units ?? 0,
            icon: Image,
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-500',
        },
        {
            title: t('summaryCards.buildingPlanAvailable'),
            value: dashboardStats?.buildingPlanAvailable?.total ?? 0,
            structures: dashboardStats?.buildingPlanAvailable?.structures ?? 0,
            units: dashboardStats?.buildingPlanAvailable?.units ?? 0,
            icon: Ruler,
            iconBg: 'bg-purple-50',
            iconColor: 'text-purple-500',
        },
        {
            title: t('summaryCards.surveyFormAvailable'),
            value: dashboardStats?.surveyFormAvailable?.total ?? 0,
            structures: dashboardStats?.surveyFormAvailable?.structures ?? 0,
            units: dashboardStats?.surveyFormAvailable?.units ?? 0,
            icon: FileText,
            iconBg: 'bg-green-50',
            iconColor: 'text-green-500',
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {cards.map((card) => {
                const Icon = card.icon;

                return (
                    <Card
                        key={card?.title}
                        padding="none"
                        className="w-full rounded-xl border border-slate-200 border-l-4 border-l-blue-400 shadow-sm p-3"
                    >
                        <div className="flex gap-3">
                            {/* Left Side - Icon */}
                            <div
                                className={`flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl ${card?.iconBg}`}
                            >
                                <Icon
                                    className={`h-5 w-5 sm:h-6 sm:w-6 ${card?.iconColor}`}
                                />
                            </div>

                            {/* Right Side - Complete Content */}
                            <div className="flex-1 min-w-0">
                                {/* Value and Title */}
                                <div className="flex flex-col">
                                    <span className="text-lg sm:text-xl font-bold leading-tight text-[#173A67] truncate">
                                        {card?.value != null ? card.value.toLocaleString() : '0'}
                                    </span>

                                    <span className="text-xs sm:text-sm text-[#315474] truncate font-medium">
                                        {card?.title}
                                    </span>
                                </div>

                                {/* Structures and Units */}
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div className="flex flex-col min-w-0 border-t border-gray-200 pt-1.5">
                                        <span className="text-[11px] sm:text-xs text-gray-500 truncate">
                                            {t('summaryCards.structures')}
                                        </span>

                                        <span className="text-xs sm:text-sm font-semibold text-[#173A67] truncate">
                                            {card?.structures != null ? card.structures.toLocaleString() : '0'}
                                        </span>
                                    </div>

                                    <div className="flex flex-col min-w-0 border-t border-gray-200 pt-1.5">
                                        <span className="text-[11px] sm:text-xs text-gray-500 truncate">
                                            {t('summaryCards.units')}
                                        </span>

                                        <span className="text-xs sm:text-sm font-semibold text-[#173A67] truncate">
                                            {card?.units != null ? card.units.toLocaleString() : '0'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}