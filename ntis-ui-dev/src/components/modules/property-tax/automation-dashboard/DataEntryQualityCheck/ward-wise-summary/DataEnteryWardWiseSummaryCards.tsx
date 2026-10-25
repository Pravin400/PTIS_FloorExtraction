'use client';

import { useTranslations } from 'next-intl';
import { DataEntryWardWiseSummaryItems } from '@/types/automation-dashboard/data-entry-quality-check/data-entry-quality-check.type';

interface DataEntryWardWiseSummaryCardsProps {
    summaryData: DataEntryWardWiseSummaryItems | null;
}

export function DataEnteryWardWiseSummaryCards({ summaryData }: DataEntryWardWiseSummaryCardsProps) {
    const t = useTranslations('automationDashboard');

    if (!summaryData) return null;

    const totalRow = summaryData.totalRow;
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 w-full mb-3">
            {/* Total Structure */}
            <div className="bg-[#eef5ff] border border-blue-200 rounded-lg p-3 flex flex-col items-center justify-center text-center shadow-sm">
                <span className="text-[13px] font-bold text-slate-600 uppercase tracking-wide mb-1">{t('dataEntryQualityCheck.cards.totalStructure') || 'TOTAL STRUCTURE'}</span>
                <span className="text-2xl font-bold text-blue-700">{(totalRow?.structure ?? 0).toLocaleString('en-IN')}</span>
            </div>

            {/* Total Units */}
            <div className="bg-fuchsia-50 border border-fuchsia-200 rounded-lg p-3 flex flex-col items-center justify-center text-center shadow-sm">
                <span className="text-[13px] font-bold text-slate-600 uppercase tracking-wide mb-1">{t('dataEntryQualityCheck.cards.totalUnits') || 'TOTAL UNITS'}</span>
                <span className="text-2xl font-bold text-purple-700">{(totalRow?.unit ?? 0).toLocaleString('en-IN')}</span>
            </div>

            {/* Assessed */}
            <div className="bg-green-50/70 border border-green-200 rounded-lg p-3 flex flex-col items-center justify-center text-center shadow-sm">
                <span className="text-[13px] font-bold text-slate-600 uppercase tracking-wide mb-1">{t('dataEntryQualityCheck.cards.assessed') || 'ASSESSED'}</span>
                <span className="text-2xl font-bold text-green-700">{((totalRow?.assessmentStatusBreakdown?.assessed?.structureCount ?? 0) + (totalRow?.assessmentStatusBreakdown?.assessed?.unitCount ?? 0)).toLocaleString('en-IN')}</span>
            </div>

            {/* Unassessed */}
            <div className="bg-orange-50/70 border border-orange-200 rounded-lg p-3 flex flex-col items-center justify-center text-center shadow-sm">
                <span className="text-[13px] font-bold text-slate-600 uppercase tracking-wide mb-1">{t('dataEntryQualityCheck.cards.unassessed') || 'UNASSESSED'}</span>
                <span className="text-2xl font-bold text-orange-700">{((totalRow?.assessmentStatusBreakdown?.unassessed?.structureCount ?? 0) + (totalRow?.assessmentStatusBreakdown?.unassessed?.unitCount ?? 0)).toLocaleString('en-IN')}</span>
            </div>

            {/* Photos */}
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-lg p-3 flex flex-col items-center justify-center text-center shadow-sm">
                <span className="text-[13px] font-bold text-slate-600 uppercase tracking-wide mb-1">{t('dataEntryQualityCheck.cards.photos') || 'PHOTOS'}</span>
                <span className="text-2xl font-bold text-indigo-700">{((totalRow?.photo?.complete ?? 0) + (totalRow?.photo?.pending ?? 0)).toLocaleString('en-IN')}</span>
            </div>
        </div>
    );
}
