"use client";

import { TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";

interface CustomRangesSummaryProps {
    summaryData: { grandTotal: number, totalRanges: number, baseRent: number };
    fullAgreementTotal?: number;
}

export const CustomRangesSummary = ({ summaryData, fullAgreementTotal }: CustomRangesSummaryProps) => {
    const t = useTranslations('quickDataEntry');

    return (
        <div className="rounded-xl border border-gray-200 bg-slate-50/80 p-4">
            <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wide">{t('floor.renterSection.agreementSummary')}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white rounded-lg px-4 py-3 border border-gray-200 shadow-sm">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">{t('floor.renterSection.totalRanges')}</div>
                    <div className="text-xl font-bold text-slate-900">{summaryData.totalRanges}</div>
                </div>
                <div className="bg-white rounded-lg px-4 py-3 border border-gray-200 shadow-sm">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">{t('floor.renterSection.baseMonthlyRent')}</div>
                    <div className="text-xl font-bold text-slate-900">{`₹`}{summaryData.baseRent.toLocaleString("en-IN")}</div>
                </div>
                <div className="bg-blue-600 rounded-lg px-4 py-3 border border-blue-700 shadow-sm text-white">
                    <div className="text-[10px] text-blue-100 font-semibold uppercase tracking-wider mb-1">{t('floor.renterSection.agreementTotal')}</div>
                    <div className="text-xl font-bold">
                        {`₹`}{(fullAgreementTotal ?? summaryData.grandTotal).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </div>
                </div>
            </div>
        </div>
    );
};
