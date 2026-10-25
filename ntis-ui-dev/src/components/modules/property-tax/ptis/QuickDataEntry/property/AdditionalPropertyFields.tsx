import { useState, useMemo } from 'react';
import { Input, SearchSelect, PTISTransliteratedSearchSelect } from '@/components/common';
import { Tooltip } from '@/components/common/Tooltip';
import { Label } from '@/components/common/label';
import { PropertyBasicDetailsApiItem, TaxZoneItem } from '@/types/property-basic-details.types';

interface AdditionalPropertyFieldsProps {
    t: (key: string) => string;
    propertyData: PropertyBasicDetailsApiItem | null;
    taxZones: TaxZoneItem[];
    checkFormChanges: () => void;
    isIndividual: boolean;
    propertyDescriptionOptions: { label: string; value: string }[];
    propertyTypeId: number | null;
    handlePropertyDescriptionChange: (name: string | undefined, value: string) => void;
}

export const AdditionalPropertyFields = ({
    t,
    propertyData,
    taxZones,
    checkFormChanges,
    isIndividual,
    propertyDescriptionOptions,
    propertyTypeId,
    handlePropertyDescriptionChange,
}: AdditionalPropertyFieldsProps) => {
    const [taxZoneId, setTaxZoneId] = useState(propertyData?.taxZoneId ? String(propertyData.taxZoneId) : '');
    const [taxZoneNo, setTaxZoneNo] = useState(propertyData?.taxZoneNo?.toString() ?? '');
    const [showTaxZoneNoError, setShowTaxZoneNoError] = useState(false);

    const taxZoneOptions = useMemo(() => {
        return (taxZones ?? [])
            .filter((z) => z.isActive)
            .map((z) => ({
                label: z.taxZoneNo,
                value: String(z.id)
            }));
    }, [taxZones]);

    const handleTaxZoneChange = (_name: string | undefined, value: string) => {
        setTaxZoneId(value);
        const selected = taxZones.find(z => String(z.id) === value);
        if (selected) {
            setTaxZoneNo(selected.taxZoneNo);
        } else {
            setTaxZoneNo('');
        }
        setShowTaxZoneNoError(true);
        // Manually trigger change detection since hidden inputs don't fire onChange
        setTimeout(() => checkFormChanges(), 0);
    };

    const preventEnterSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    };

    return (
        <>
            {/* Tax Zone No */}
            <div className={isIndividual ? 'space-y-1.5 col-span-12 md:col-span-4 relative focus-within:z-50' : 'space-y-1.5 col-span-12 md:col-span-3 relative focus-within:z-50'}>
                <Label htmlFor="pd-taxzone" className="text-xs font-semibold text-gray-700">
                    {t('property.taxZoneNo')}
                </Label>
                <Tooltip content={taxZoneNo} placement="top">
                    <div className="w-full">
                        <SearchSelect
                            id="pd-taxzone"
                            options={taxZoneOptions}
                            placeholder={t('property.selectTaxZonePlaceholder') || 'Select Tax Zone'}
                            value={taxZoneId}
                            onChange={handleTaxZoneChange}
                            className={`h-9 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${showTaxZoneNoError && !taxZoneId
                                ? 'border-red-300 focus:border-red-500'
                                : ''
                                }`}
                        />
                    </div>
                </Tooltip>
                <input type="hidden" name="taxZoneId" value={taxZoneId} />
                <input type="hidden" name="taxZoneNo" value={taxZoneNo} />
                {showTaxZoneNoError && !taxZoneId && (
                    <span className="text-xs text-red-500 block">
                        {t('property.validation.taxZoneNoRequired')}
                    </span>
                )}
            </div>

            {/* Rate Section Name */}
            <div className="space-y-1.5 col-span-12 md:col-span-3">
                <Label htmlFor="pd-ratesection" className="text-xs font-semibold text-gray-700">
                    {t('property.rateSectionDescription') || 'Rate Section Name'}
                </Label>
                <Tooltip content={propertyData?.rateSectionDescription ?? ''} placement="top">
                    <Input
                        readOnly
                        id="pd-ratesection"
                        name="rateSectionDescription"
                        placeholder={t('property.rateSectionPlaceholder') || 'Enter Rate Section Name'}
                        defaultValue={propertyData?.rateSectionDescription ?? ''}
                        onKeyDown={preventEnterSubmit}
                        className="h-9 text-sm bg-gray-50 text-gray-600 cursor-not-allowed border-gray-300"
                    />
                </Tooltip>
            </div>

            {/* UPIC ID */}
            <div className="space-y-1.5 col-span-12 md:col-span-3">
                <Label htmlFor="pd-upic" className="text-xs font-extrabold text-gray-700">
                    {t('property.upicId')}
                </Label>
                <Tooltip content={propertyData?.upicId ?? ''} placement="top">
                    <Input
                        id="pd-upic"
                        name="upicId"
                        readOnly
                        placeholder="UPIC2024001234"
                        defaultValue={propertyData?.upicId ?? ''}
                        onKeyDown={preventEnterSubmit}
                        className="h-9 text-sm bg-gray-50 text-gray-600 cursor-not-allowed border-gray-300"
                    />
                </Tooltip>
            </div>

            {/* Property Description */}
            <div className="space-y-1.5 col-span-12 md:col-span-3">
                <Label htmlFor="pd-description" className="text-xs font-semibold text-gray-700">
                    {t('property.propertyDescription')}
                </Label>
                <PTISTransliteratedSearchSelect
                    id="pd-description"
                    name="propertyDescription"
                    options={propertyDescriptionOptions}
                    placeholder={t('property.select')}
                    value={propertyTypeId?.toString() ?? ''}
                    onChange={handlePropertyDescriptionChange}
                    className="h-9 text-sm border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
            </div>
        </>
    );
};
