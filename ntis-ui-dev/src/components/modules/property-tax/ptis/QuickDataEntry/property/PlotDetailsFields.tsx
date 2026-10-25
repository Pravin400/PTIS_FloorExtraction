import { useState } from 'react';
import { Input, SearchSelect } from '@/components/common';
import { Tooltip } from '@/components/common/Tooltip';
import { Label } from '@/components/common/label';
import { PropertyBasicDetailsApiItem } from '@/types/property-basic-details.types';
import { sanitizePlotNo, sanitizeSurveyNo, sanitizeSubZoneNo } from '@/lib/utils/input-sanitization';
import { propertyValidators, PROPERTY_VALIDATION_RULES } from '@/lib/utils/kyc-validation/kyc-validation.constants';

interface PlotDetailsFieldsProps {
    t: (key: string) => string;
    propertyData: PropertyBasicDetailsApiItem | null;
    isIndividual: boolean;
    moujaOptions: { label: string; value: string }[];
    moujaId: number | null;
    handleMoujaChange: (name: string | undefined, value: string) => void;
}

export const PlotDetailsFields = ({
    t,
    propertyData,
    isIndividual,
    moujaOptions,
    moujaId,
    handleMoujaChange,
}: PlotDetailsFieldsProps) => {
    const [subZoneNo, setSubZoneNo] = useState(propertyData?.subZoneNo ?? '');
    const [surveyNo, setSurveyNo] = useState(propertyData?.surveyNo ?? '');
    const [plotNo, setPlotNo] = useState(propertyData?.plotNo ?? '');

    const [showSubZoneNoError, setShowSubZoneNoError] = useState(false);
    const [showSurveyNoError, setShowSurveyNoError] = useState(false);
    const [showPlotNoError, setShowPlotNoError] = useState(false);

    const preventEnterSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    };

    return (
        <>
            {/* Mouja */}
            <div className="space-y-1.5 col-span-12 md:col-span-3">
                <Label htmlFor="pd-mouja" className="text-xs font-semibold text-gray-700">
                    {t('property.mouja')}
                </Label>
                <Tooltip content={moujaOptions.find(opt => opt.value === moujaId?.toString())?.label || ''} placement="top">
                    <div className="w-full">
                        <SearchSelect
                            id="pd-mouja"
                            name="mouja"
                            options={moujaOptions}
                            value={moujaId?.toString() ?? ''}
                            placeholder={t('property.select')}
                            onChange={handleMoujaChange}
                            className="h-9 text-sm border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                </Tooltip>
            </div>

            {/* Sub Zone No */}
            <div className={isIndividual ? 'space-y-1.5 col-span-12 md:col-span-4' : 'space-y-1.5 col-span-12 md:col-span-3'}>
                <Label htmlFor="pd-subzone" className="text-xs font-semibold text-gray-700">
                    {t('property.subZoneNo')}
                </Label>
                <Tooltip content={subZoneNo} placement="top">
                    <Input
                        id="pd-subzone"
                        name="subZoneNo"
                        placeholder="SZ-12"
                        value={subZoneNo}
                        maxLength={PROPERTY_VALIDATION_RULES.SUB_ZONE_NO_MAX_LENGTH}
                        className={`h-9 text-sm border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${showSubZoneNoError && !propertyValidators.isValidSubZoneNo(subZoneNo)
                            ? 'border-red-300 focus:border-red-500'
                            : ''
                            }`}
                        onChange={(e) => {
                            const sanitized = sanitizeSubZoneNo(e.target.value);
                            setSubZoneNo(sanitized);
                            if (sanitized) setShowSubZoneNoError(true);
                        }}
                        onKeyDown={preventEnterSubmit}
                        onBlur={() => setShowSubZoneNoError(true)}
                    />
                </Tooltip>
                {showSubZoneNoError && !propertyValidators.isValidSubZoneNo(subZoneNo) && (
                    <span className="text-xs text-red-500 block">
                        {t('property.validation.invalidSubZoneNo')}
                    </span>
                )}
            </div>

            {/* Survey No */}
            <div className={isIndividual ? 'space-y-1.5 col-span-12 md:col-span-4' : 'space-y-1.5 col-span-12 md:col-span-3'}>
                <Label htmlFor="pd-survey" className="text-xs font-semibold text-gray-700">
                    {t('property.surveyNo')}
                </Label>
                <Tooltip content={surveyNo} placement="top">
                    <Input
                        id="pd-survey"
                        name="surveyNo"
                        placeholder="45/2B"
                        value={surveyNo}
                        maxLength={PROPERTY_VALIDATION_RULES.SURVEY_NO_MAX_LENGTH}
                        className={`h-9 text-sm border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${showSurveyNoError && !propertyValidators.isValidSurveyNo(surveyNo)
                            ? 'border-red-300 focus:border-red-500'
                            : ''
                            }`}
                        onChange={(e) => {
                            const sanitized = sanitizeSurveyNo(e.target.value);
                            setSurveyNo(sanitized);
                            if (sanitized) setShowSurveyNoError(true);
                        }}
                        onKeyDown={preventEnterSubmit}
                        onBlur={() => setShowSurveyNoError(true)}
                    />
                </Tooltip>
                {showSurveyNoError && !propertyValidators.isValidSurveyNo(surveyNo) && (
                    <span className="text-xs text-red-500 block">
                        {t('property.validation.invalidSurveyNo')}
                    </span>
                )}
            </div>

            {/* Plot No */}
            <div className={isIndividual ? 'space-y-1.5 col-span-12 md:col-span-4' : 'space-y-1.5 col-span-12 md:col-span-3'}>
                <Label htmlFor="pd-plot" className="text-xs font-semibold text-gray-700">
                    {t('property.plotNo')}
                </Label>
                <Tooltip content={plotNo} placement="top">
                    <Input
                        id="pd-plot"
                        name="plotNo"
                        placeholder={t('property.plotNoPlaceholder')}
                        value={plotNo}
                        maxLength={PROPERTY_VALIDATION_RULES.PLOT_NO_MAX_LENGTH}
                        className={`h-9 text-sm border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${showPlotNoError && !propertyValidators.isValidPlotNo(plotNo)
                            ? 'border-red-300 focus:border-red-500'
                            : ''
                            }`}
                        onChange={(e) => {
                            const sanitized = sanitizePlotNo(e.target.value);
                            const limited = sanitized.slice(0, PROPERTY_VALIDATION_RULES.PLOT_NO_MAX_LENGTH);
                            setPlotNo(limited);
                            if (limited) setShowPlotNoError(true);
                        }}
                        onKeyDown={preventEnterSubmit}
                        onBlur={() => setShowPlotNoError(true)}
                    />
                </Tooltip>
                {showPlotNoError && !propertyValidators.isValidPlotNo(plotNo) && (
                    <span className="text-xs text-red-500">
                        {t('property.validation.invalidPlotNo') || 'Invalid plot number. Only alphanumeric, -, and / allowed (max 10 characters).'}
                    </span>
                )}
            </div>
        </>
    );
};
