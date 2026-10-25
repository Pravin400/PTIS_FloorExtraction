"use client"
import { AnimatedDigitInput, Input, SearchSelect } from "@/components/common";
import { Label } from "@/components/common/label";
import { FloorFormFieldsProps } from "@/types/OldDetails/property-old-floor-info.types";
import { FloorFormActions } from "./FloorFormActions";
import { preventInvalidNumericKeys, sanitizeTaxDecimal } from "../../OldTaxation";

/**
 * FloorFormFields Component
 * Renders all input fields for floor information entry form
 * Separates presentation from business logic
 */
export function FloorFormFields({
    t,
    floorOptions,
    subFloorOptions,
    constructionTypeOptions,
    useOptions,
    subUseOptions,
    hasSubUseOptions,
    formData,
    errors,
    showError,
    onFieldChange,
    onUseTypeChange,
    validateYearField,
    isSubmitting,
    isChanged,
    onSave,
    onReset,
    handleOpenDropdown
}: FloorFormFieldsProps) {

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
            {/* Floor */}
            <div className="space-y-1.5 relative z-20 focus-within:z-30 [&:has([aria-expanded='true'])]:z-50">
                <Label className="text-xs font-semibold text-gray-700">
                    {t('floor.floorLabel')}<span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="w-full" onFocusCapture={() => handleOpenDropdown('loadFloor')}>
                    <SearchSelect
                        options={floorOptions}
                        name="floor"
                        menuPlacement="bottom"
                        onChange={(_, val) => onFieldChange('oldFloorId', val)}
                        value={String(formData.oldFloorId)}
                        forceSearchText={
                          formData.oldFloorId && !floorOptions.some(o => o.value === String(formData.oldFloorId))
                            ? String(formData?.floorDescription || '')
                            : undefined
                        }
                        placeholder={t('oldDetails.floordtails.selectPlaceholder')}
                        autoFocus
                        className="h-9 text-sm border-blue-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg"
                    />
                </div>
                {showError("oldFloorId") && (
                    <span className="text-xs text-red-500">{errors.oldFloorId}</span>
                )}
            </div>

            {/* Sub Floor */}
            <div className="space-y-1.5 relative z-20 focus-within:z-30 [&:has([aria-expanded='true'])]:z-50">
                <Label className="text-xs font-semibold text-gray-700">
                    {t('floor.subFloor')}<span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="w-full" onFocusCapture={() => handleOpenDropdown('loadSubFloor')}>
                    <SearchSelect
                        options={subFloorOptions}
                        name="subFloor"
                        menuPlacement="bottom"
                        onChange={(_, val) => onFieldChange('oldSubFloorId', val)}
                        value={String(formData.oldSubFloorId)}
                        forceSearchText={
                          formData.oldSubFloorId && !subFloorOptions.some(o => o.value === String(formData.oldSubFloorId))
                            ? String(formData?.subFloorDescription || '')
                            : undefined
                        }
                        placeholder={t('oldDetails.floordtails.selectPlaceholder')}
                        className="h-9 text-sm border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg"
                    />
                </div>
                {showError("oldSubFloorId") && (
                    <span className="text-xs text-red-500">{errors.oldSubFloorId}</span>
                )}
            </div>

            {/* Construction Year */}
            <div className="space-y-1.5 relative z-20 focus-within:z-30">
                <Label className="text-xs font-semibold text-gray-700">
                    {t('oldDetails.year')}<span className="text-red-500 ml-1">*</span>
                </Label>
                <AnimatedDigitInput
                    id="oldConstructionYear"
                    maxLength={4}
                    value={String(formData.oldConstructionYear || '')}
                    className="h-9 text-sm border-blue-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 rounded-lg"
                    placeholder="YYYY"
                    onChange={(val) => {
                        onFieldChange('oldConstructionYear', val);
                        // Validate year in real-time
                        validateYearField('oldConstructionYear', val);
                    }}
                />
                {showError("oldConstructionYear") && (
                    <span className="text-xs text-red-500">{errors.oldConstructionYear}</span>
                )}
            </div>

            {/* Assessment Year */}
            <div className="space-y-1.5 relative z-10 focus-within:z-30">
                <Label className="text-xs font-semibold text-gray-700">
                    {t('oldDetails.assessmentYear')}<span className="text-red-500 ml-1">*</span>
                </Label>
                <AnimatedDigitInput
                    id="oldAssessmentYear"
                    maxLength={4}
                    value={String(formData.oldAssessmentYear || '')}
                    className="h-9 text-sm border-blue-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 rounded-lg"
                    placeholder="YYYY"
                    onChange={(val) => {
                        onFieldChange('oldAssessmentYear', val);
                        // Validate year in real-time
                        validateYearField('oldAssessmentYear', val);
                    }}
                />
                {showError("oldAssessmentYear") && (
                    <span className="text-xs text-red-500">{errors.oldAssessmentYear}</span>
                )}
            </div>

            {/* Construction Type */}
            <div className="space-y-1.5 relative z-10 focus-within:z-30 [&:has([aria-expanded='true'])]:z-50">
                <Label className="text-xs font-semibold text-gray-700">
                    {t('floor.conTyp')}<span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="w-full" onFocusCapture={() => handleOpenDropdown('loadConstruction')}>
                    <SearchSelect
                        options={constructionTypeOptions}
                        name="conTyp"
                        menuPlacement="bottom"
                        onChange={(_, val) => onFieldChange('oldConstructionTypeId', val)}
                        value={String(formData.oldConstructionTypeId)}
                        forceSearchText={
                          formData.oldConstructionTypeId && !constructionTypeOptions.some(o => o.value === String(formData.oldConstructionTypeId))
                            ? String(formData?.constructionTypeDescription || '')
                            : undefined
                        }
                        placeholder={t('oldDetails.floordtails.selectPlaceholder')}
                        className="h-9 text-sm border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg"
                    />
                </div>
                {showError("oldConstructionTypeId") && (
                    <span className="text-xs text-red-500">{errors.oldConstructionTypeId}</span>
                )}
            </div>

            {/* Type of Use */}
            <div className="space-y-1.5 relative z-10 focus-within:z-30 [&:has([aria-expanded='true'])]:z-50">
                <Label className="text-xs font-semibold text-gray-700">
                    {t('oldDetails.floordtails.use')}<span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="w-full" onFocusCapture={() => handleOpenDropdown('loadUsage')}>
                    <SearchSelect
                        options={useOptions}
                        name="use"
                        menuPlacement="bottom"
                        onChange={(_, val) => onUseTypeChange(val)}
                        value={String(formData.oldTypeOfUseId)}
                        forceSearchText={
                          formData.oldTypeOfUseId && !useOptions.some(o => o.value === String(formData.oldTypeOfUseId))
                            ? String(formData?.typeOfUseDescription || '')
                            : undefined
                        }
                        placeholder={t('oldDetails.floordtails.selectPlaceholder')}
                        className="h-9 text-sm border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg"
                    />
                </div>
                {showError("oldTypeOfUseId") && (
                    <span className="text-xs text-red-500">{errors.oldTypeOfUseId}</span>
                )}
            </div>

            {/* Sub Type */}
            <div className="space-y-1.5 relative z-10 focus-within:z-30 [&:has([aria-expanded='true'])]:z-50">
                <Label className="text-xs font-semibold text-gray-700">
                    {t('floor.subTyp')} {(hasSubUseOptions || formData.oldSubTypeOfUseId) && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <div className="w-full" onFocusCapture={() => formData.oldTypeOfUseId && handleOpenDropdown('loadSubType')}>
                    <SearchSelect
                        name="subUseType"
                        menuPlacement="bottom"
                        onChange={(_, val) => onFieldChange('oldSubTypeOfUseId', val)}
                        value={String(formData.oldSubTypeOfUseId)}
                        disabled={!hasSubUseOptions && !formData.oldSubTypeOfUseId}
                        options={subUseOptions}
                        forceSearchText={
                          formData.oldSubTypeOfUseId && !subUseOptions.some(o => o.value === String(formData.oldSubTypeOfUseId))
                            ? String(formData?.subTypeOfUseDescription || '')
                            : undefined
                        }
                        placeholder={t('oldDetails.floordtails.selectPlaceholder')}
                        className="h-9 text-sm border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg"
                    />
                </div>
                {showError("oldSubTypeOfUseId") && (
                    <span className="text-xs text-red-500">{errors.oldSubTypeOfUseId}</span>
                )}
            </div>

            {/* Carpet Area (Sq Ft) - Editable */}
            <div className="space-y-1.5 relative z-10 focus-within:z-30">
                <Label className="text-xs font-semibold text-gray-700">
                    {t('oldDetails.carpetAreaSqFt')}<span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                    type="text"
                    inputMode="decimal"
                    value={formData.oldCarpetAreaSqFeet ?? ''}
                    className="h-9 text-sm border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg"
                    placeholder="0.00"
                    onChange={(e) => {
                        const value = sanitizeTaxDecimal(e.target.value);
                        if (value !== '' || e.target.value === '') {
                            onFieldChange('oldCarpetAreaSqFeet', value);
                        }
                    }}
                    onKeyDown={preventInvalidNumericKeys}
                />
                {showError("oldCarpetAreaSqFeet") && (
                    <span className="text-xs text-red-500">{errors.oldCarpetAreaSqFeet}</span>
                )}
            </div>

            {/* Area (Sq M) - Editable */}
            <div className="space-y-1.5 relative z-10 focus-within:z-30">
                <Label className="text-xs font-semibold text-gray-700">
                    {t('oldDetails.areaSqM')}<span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                    type="text"
                    inputMode="decimal"
                    value={formData.oldAreaSqMeter ?? ''}
                    className="h-9 text-sm border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg"
                    placeholder="0.00"
                    onChange={(e) => {
                        const value = sanitizeTaxDecimal(e.target.value);
                        if (value !== '' || e.target.value === '') {
                            onFieldChange('oldAreaSqMeter', value);
                        }
                    }}
                    onKeyDown={preventInvalidNumericKeys}
                />
                {showError("oldAreaSqMeter") && (
                    <span className="text-xs text-red-500">{errors.oldAreaSqMeter}</span>
                )}
            </div>

            {/* Builtup Area (Sq Ft) - Read Only */}
            <div className="space-y-1.5 relative z-0">
                <Label className="text-xs font-semibold text-gray-700">
                    {t('oldDetails.builtupAreaSqFt')}
                </Label>
                <Input
                    type="number"
                    value={
                        formData.oldBuiltupAreaSqFeet
                            ? Number(formData.oldBuiltupAreaSqFeet).toFixed(2)
                            : ''
                    }
                    readOnly
                    className="h-9 text-sm border-blue-200 bg-gray-50 cursor-not-allowed focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg"
                    placeholder="0.00"
                />
            </div>

            {/* Builtup Area (Sq M) - Read Only */}
            <div className="space-y-1.5 relative z-0">
                <Label className="text-xs font-semibold text-gray-700">
                    {t('oldDetails.builtupAreaSqMeter')}
                </Label>
                <Input
                    type="number"
                    value={
                        formData.oldBuiltupAreaSqMeter
                            ? Number(formData.oldBuiltupAreaSqMeter).toFixed(2)
                            : ''
                    }
                    readOnly
                    className="h-9 text-sm border-blue-200 bg-gray-50 cursor-not-allowed focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg"
                    placeholder="0.00"
                />
            </div>
            <div className="w-full flex justify-end gap-5 items-end mt-6 md:mt-0 md:h-full relative z-0">
                    <FloorFormActions
                    t={t}
                    isEditMode={!!formData.id}
                    isSubmitting={isSubmitting}
                    isChanged={isChanged}
                    onSave={onSave}
                    onReset={onReset}
                />
            </div>
        </div>
    );
}
