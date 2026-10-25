import { useState, useMemo } from 'react';
import { Input, SearchSelect } from '@/components/common';
import { Tooltip } from '@/components/common/Tooltip';
import { Label } from '@/components/common/label';
import { PropertyBasicDetailsApiItem } from '@/types/property-basic-details.types';
import { sanitizeFlatShopNo } from '@/lib/utils/input-sanitization';
import { propertyValidators, PROPERTY_VALIDATION_RULES } from '@/lib/utils/kyc-validation/kyc-validation.constants';

interface BasicPropertyFieldsProps {
    t: (key: string) => string;
    propertyData: PropertyBasicDetailsApiItem | null;
    categoryOptions: { label: string; value: string }[];
    categoryId: number | null;
    handleCategoryChange: (name: string | undefined, value: string) => void;
}

export const BasicPropertyFields = ({
    t,
    propertyData,
    categoryOptions,
    categoryId,
    handleCategoryChange,
}: BasicPropertyFieldsProps) => {
    const [flatShopNo, setFlatShopNo] = useState(propertyData?.flatOrShopNo ?? '');
    const [showFlatShopError, setShowFlatShopError] = useState(false);

    const preventEnterSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    };

    const isApartment = useMemo(() => {
        if (!propertyData) return false;
        const savedCategoryName = propertyData.categoryName?.toLowerCase();
        if (savedCategoryName === 'apartment' || savedCategoryName === 'multi commercial apartment') {
            return true;
        }
        const originalOption = categoryOptions.find(opt => opt.value === propertyData.categoryId?.toString());
        const originalOptionLabel = originalOption?.label?.toLowerCase();
        return originalOptionLabel === 'apartment' || originalOptionLabel === 'multi commercial apartment';
    }, [propertyData, categoryOptions]);

    const isIndividual = useMemo(() => {
        const selectedOption = categoryOptions.find(opt => opt.value === categoryId?.toString());
        return selectedOption?.label?.toLowerCase() === 'individual';
    }, [categoryId, categoryOptions]);

    return (
        <>
            {/* Division */}
            <div className="space-y-1.5 col-span-12 md:col-span-4">
                <Label htmlFor="pd-division" className="text-xs font-semibold text-gray-700">
                    {t('property.division')} <span className="text-red-500">*</span>
                </Label>
                <Tooltip content={propertyData?.division?.toString() ?? ''} placement="top">
                    <Input
                        readOnly
                        id="pd-division"
                        name="division"
                        autoFocus
                        placeholder={t('property.divisionPlaceholder')}
                        defaultValue={propertyData?.division?.toString() ?? ''}
                        onKeyDown={preventEnterSubmit}
                        className="h-9 text-sm bg-gray-50 text-gray-600 cursor-not-allowed border-gray-300"
                    />
                </Tooltip>
            </div>

            {/* Category */}
            <div className="space-y-1.5 col-span-12 md:col-span-4">
                <Label htmlFor="pd-category" className="text-xs font-semibold text-gray-700">
                    {t('property.category')}
                </Label>
                <Tooltip content={categoryOptions.find(opt => opt.value === categoryId?.toString())?.label || ''} placement="top">
                    <div className="w-full">
                        <SearchSelect
                            id="pd-category"
                            name="category"
                            options={categoryOptions}
                            value={categoryId?.toString() ?? ''}
                            placeholder={t('property.select')}
                            onChange={handleCategoryChange}
                            disabled={isApartment}
                            className="h-9 text-sm border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                    </div>
                </Tooltip>
            </div>

            {/* Flat No / Shop No */}
            {!isIndividual && (
                <div className="space-y-1.5 col-span-12 md:col-span-4">
                    <Label htmlFor="pd-flat-shop" className="text-xs font-semibold text-gray-700">
                        {t('property.flatShopNo')}
                    </Label>
                    <Tooltip content={flatShopNo} placement="top">
                        <Input
                            id="pd-flat-shop"
                            name="flatOrShopNo"
                            placeholder={t('property.flatShopNoPlaceholder')}
                            value={flatShopNo}
                            maxLength={PROPERTY_VALIDATION_RULES.FLAT_SHOP_NO_MAX_LENGTH}
                            className={`h-9 text-sm border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${showFlatShopError && !propertyValidators.isValidFlatShopNo(flatShopNo)
                                ? 'border-red-300 focus:border-red-500'
                                : ''
                                }`}
                            onChange={(e) => {
                                const sanitized = sanitizeFlatShopNo(e.target.value);
                                const limited = sanitized.slice(0, PROPERTY_VALIDATION_RULES.FLAT_SHOP_NO_MAX_LENGTH);
                                setFlatShopNo(limited);
                                if (limited) setShowFlatShopError(true);
                            }}
                            onKeyDown={preventEnterSubmit}
                            onBlur={() => setShowFlatShopError(true)}
                        />
                    </Tooltip>
                    {showFlatShopError && !propertyValidators.isValidFlatShopNo(flatShopNo) && (
                        <span className="text-xs text-red-500">
                            {t('property.validation.invalidFlatShopNo') || 'Invalid flat/shop number. Only alphanumeric, -, and / allowed (max 10 characters).'}
                        </span>
                    )}
                </div>
            )}
        </>
    );
};