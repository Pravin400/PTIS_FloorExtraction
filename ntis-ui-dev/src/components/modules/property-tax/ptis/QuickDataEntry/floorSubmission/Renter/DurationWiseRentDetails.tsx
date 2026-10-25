"use client";

import { useMemo } from "react";
import { History, Eye } from "lucide-react";
import { MasterTable, Button } from "@/components/common";
import { calculateRentProgression } from "@/lib/utils/renter/renter-calculations";
import { useTranslations } from "next-intl";
import { RenterMastItem } from "@/types/renter/renter-details.types";
import { RenterFormData } from "@/types/renter/renter.types";

interface DurationWiseRentDetailsProps {
    formData: RenterFormData;
    onViewDetails: (fy: string) => void;
}

export const DurationWiseRentDetails = ({ formData, onViewDetails }: DurationWiseRentDetailsProps) => {
    const t = useTranslations('quickDataEntry');
    const renterDetails = formData?.renterDetails;
    
    const rentData = useMemo(() => {
        return calculateRentProgression(renterDetails);
    }, [renterDetails]);

    const fyBreakdown = (rentData?.fyBreakdown || []) as RenterMastItem[];
    const grandTotal = rentData?.grandTotal || 0;
    const totalYears = fyBreakdown.length;

    return (
        <div className="space-y-4 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                    <History className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">{t('floor.table.durationWiseRentDetails')}</h3>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <MasterTable<RenterMastItem>
                    maxBodyHeightClassName="max-h-[350px]"
                    containerClassName="border-none shadow-none"
                    columns={[
                        { 
                            key: 'financialYear', 
                            label: t('floor.table.financialYear'), 
                            headerClassName: 'text-[10px] uppercase tracking-widest text-slate-500 font-bold bg-slate-50/50',
                            cellClassName: 'text-xs font-bold text-slate-700',
                            width: '40%' 
                        },
                        { 
                            key: 'finalRent', 
                            label: t('floor.table.rentTotal'), 
                            headerClassName: 'text-right text-[10px] uppercase tracking-widest text-slate-500 font-bold bg-slate-50/50',
                            cellClassName: 'text-right',
                            width: '40%',
                            render: (val) => (
                                <span className="text-xs font-bold text-slate-900">
                                    {`₹`}{Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                </span>
                            )
                        },
                        { 
                            key: 'actions' as keyof RenterMastItem, 
                            label: t('floor.table.view'), 
                            headerClassName: 'text-center text-[10px] uppercase tracking-widest text-slate-500 font-bold bg-slate-50/50',
                            cellClassName: 'text-center',
                            width: '20%',
                            render: (_: unknown, row: RenterMastItem) => (
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => onViewDetails(row.financialYear || "")}
                                    className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                >
                                    <Eye className="w-4 h-4" />
                                </Button>
                            )
                        }
                    ]}
                    data={fyBreakdown}
                    footerLeftContent={
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('floor.table.grandTotal')}</span>
                            <span className="text-slate-500 text-[10px]">{totalYears} {totalYears !== 1 ? t('floor.table.years') : t('floor.table.year')}</span>
                        </div>
                    }
                    footerRightContent={
                        <span className="text-blue-700 px-2 py-0.5 rounded bg-blue-50 border border-blue-100 font-bold text-xs">
                            {`₹`}{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                    }
                />
            </div>
        </div>
    );
};
