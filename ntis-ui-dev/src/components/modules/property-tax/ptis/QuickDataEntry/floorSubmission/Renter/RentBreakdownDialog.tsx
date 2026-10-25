"use client";

import { Button } from "@/components/common";
import { Modal } from "@/components/common/Modal";
import { TrendingUp, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { RentPeriod } from "@/lib/utils/renter/renter-calculations";

interface RentBreakdownDialogProps {
    isOpen: boolean;
    onClose: () => void;
    fy: string;
    progression: RentPeriod[];
}

export const RentBreakdownDialog = ({ isOpen, onClose, fy, progression }: RentBreakdownDialogProps) => {
    const t = useTranslations('quickDataEntry');
    
    // Parse FY dates (FY 2024-25 -> April 2024 to March 2025)
    const [startYearStr, endYearStr] = fy.replace('FY ', '').split('-').map(y => y.length === 2 ? `20${y}` : y);
    const fyStart = new Date(parseInt(startYearStr), 3, 1); // April 1st
    const fyEnd = new Date(parseInt(endYearStr), 2, 31);   // March 31st

    const fyPeriods = progression.filter(p => {
        const d = p.date;
        return d >= fyStart && d <= fyEnd;
    });

    const totalRent = fyPeriods.reduce((sum, p) => sum + p.rent, 0);

    return (
        <Modal 
            open={isOpen} 
            onClose={onClose} 
            title={fy}
            subtitle={t('floor.table.monthlyBreakdown')}
            maxWidth="md"
            footer={
                <Button variant="secondary" size="sm" onClick={onClose} className="text-xs font-bold px-6">
                    {t('floor.renterSection.cancel')}
                </Button>
            }
        >
            <div className="space-y-4">
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-orange-200 flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-orange-700" />
                            </div>
                            <span className="font-bold text-gray-800 text-sm">{t('floor.table.fyTotal')}</span>
                        </div>
                        <span className="text-lg font-bold text-orange-700">{`₹`}{totalRent.toLocaleString('en-IN')}</span>
                    </div>
                </div>

                <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {fyPeriods.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-xs font-semibold text-gray-400">{t('floor.table.noPeriodsInFY')}</p>
                        </div>
                    ) : (
                        fyPeriods.map((p, idx) => (
                            <div 
                                key={`rent-period-${p.date.getTime()}-${idx}`}
                                className={`group flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                                    p.isIncrementMonth 
                                        ? "bg-blue-50/50 border-blue-100 hover:bg-blue-50 shadow-sm" 
                                        : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                                        p.isIncrementMonth ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"
                                    }`}>
                                        {p.date.toLocaleDateString('en-IN', { month: 'short' })}
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-gray-800">
                                            {p.date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                                        </div>
                                        {p.isIncrementMonth && (
                                            <div className="text-[9px] font-black text-blue-600 flex items-center gap-1 uppercase tracking-tighter">
                                                <ArrowRight className="w-2.5 h-2.5" /> {t('floor.table.increments')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-orange-600">{`₹`}{p.rent.toLocaleString('en-IN')}</div>
                                    <div className="text-[9px] text-gray-400">{t('floor.table.monthlyRent')}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </Modal>
    );
};
