"use client";


import React, { memo } from "react";
import { Label } from "@/components/common/label";
import { Input } from "@/components/common";
import { useTranslations } from "next-intl";
import { RenterFormDataDetails, RenterFormData } from "@/types/renter/renter.types";
import { capitalizeEachWord } from "@/lib/utils/input-sanitization";

interface EditRenterInformationProps {
    renterDetails: RenterFormDataDetails | undefined;
    setFormData: React.Dispatch<React.SetStateAction<RenterFormData>>;
}

export const EditRenterInformation = memo(({ renterDetails, setFormData }: EditRenterInformationProps) => {
    const t = useTranslations('quickDataEntry');
    
    const handleChange = (field: keyof RenterFormDataDetails, value: string) => {
        let val = value;
        if (field === 'renterName') {
            const filtered = value.replace(/[^A-Za-z\u0900-\u097F ]/g, '');
            const normalized = filtered.replace(/^\s+/, '').replace(/\s{2,}/g, ' ').slice(0, 100);
            val = capitalizeEachWord(normalized);
        }
        setFormData(prev => {
            return {
                ...prev,
                renterDetails: {
                    ...prev.renterDetails,
                    [field]: val
                }
            };
        });
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                {t('floor.renterSection.renterInformation')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="renterName">{t('floor.renterSection.fullName')}</Label>
                    <Input
                        id="renterName"
                        value={renterDetails?.renterName || ""}
                        onChange={(e) => handleChange('renterName', e.target.value)}
                        onBlur={() => {
                            if (renterDetails?.renterName) {
                                handleChange('renterName', renterDetails.renterName.trim());
                            }
                        }}
                        placeholder="e.g. John Doe"
                        className="h-10 text-xs font-medium"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="rentSurvey">{t('floor.renterSection.rentAsPerSurvey')}</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{`₹`}</span>
                        <Input
                            id="rentSurvey"
                            type="number"
                            value={renterDetails?.rentAmountSUR || ""}
                            onChange={(e) => handleChange('rentAmountSUR', e.target.value)}
                            className="h-10 text-xs font-medium pl-8"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="rentAgreement">{t('floor.renterSection.rentAsPerAgreement')}</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{`₹`}</span>
                        <Input
                            id="rentAgreement"
                            type="number"
                            value={renterDetails?.rentAmount || ""}
                            onChange={(e) => handleChange('rentAmount', e.target.value)}
                            className="h-10 text-xs font-medium pl-8"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="documentUpload">{t('floor.renterSection.attachDocument')}</Label>
                    <Input
                        id="documentUpload"
                        type="file"
                        className="h-10 text-xs font-medium file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                </div>
            </div>
        </div>
    );
});

EditRenterInformation.displayName = 'EditRenterInformation';
