'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import {SearchSelect} from "@/components/common"
import { Select,Option } from '@/components/common/select';
import { ValidationMessage } from '@/components/common';
import { PropertyFilter } from './PropertyFilter';
import { DownloadFormData } from '@/types/PropertyMedia/PropertyMedia.types';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

export interface DownloadTabProps {
    formData: DownloadFormData;
    categoryOptions: Option[];
    subCategoryOptions?: Option[];
    zoneOptions?: Option[];
    wardOptions?: Option[];
    propertyFromOptions?: Option[];
    propertyToOptions?: Option[];
    isLoadingPropertyFrom?: boolean;
    isLoadingPropertyTo?: boolean;
    onChange: (field: keyof DownloadFormData, value: string) => void;
    onZoneChange: (name: string, value: string) => void;
    onWardsChange: (selected: string[]) => void;
    onPropertyFromChange?: (name: string, value: string) => void;
    onPropertyToChange?: (name: string, value: string) => void;
    onBlur: (field: string) => void;
    errors: Record<string, string>;
    showError: (field: string) => boolean;
    t: (key: string) => string;
    tCommon?: (key: string) => string;
}

export function DownloadTab({
    formData,
    categoryOptions,
    subCategoryOptions,
    zoneOptions,
    wardOptions,
    propertyFromOptions = [],
    propertyToOptions = [],
    isLoadingPropertyFrom = false,
    isLoadingPropertyTo = false,
    onChange,
    onZoneChange,
    onWardsChange,
    onPropertyFromChange,
    onPropertyToChange,
    onBlur,
    errors,
    showError,
    t
}: DownloadTabProps) {
    const categoryAlias = useAliasLabel("Category", t("uploadDownloadDrawer.categoryLabel"));

    return (
        <div className="w-full space-y-3 sm:space-y-4">
            <Card
                variant="default"
                padding="none"
                className="w-full overflow-visible rounded-xl sm:rounded-2xl border border-[#d7e3f1] bg-white shadow-2xs"
            >
                {/* Header */}
                <CardHeader className="mb-0 rounded-t-xl sm:rounded-t-2xl border-b border-[#d7e3f1] bg-[#f4f8fc] px-3 sm:px-4 py-2 sm:py-2.5">
                    <CardTitle className="text-xs sm:text-sm font-bold text-[#1f4977]">
                        {t("uploadDownloadDrawer.chooseWhatToDownload")}
                    </CardTitle>
                </CardHeader>

                {/* Content */}
                <CardContent className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                        <div>
                            <Select
                                options={categoryOptions ?? []}
                                value={formData.category}
                                onChange={(_e, val) => {
                                    onChange('category', val);
                                    onChange('subCategory', '');
                                }}
                                onBlur={() => onBlur('download.category')}
                                placeholder={t("uploadDownloadDrawer.categoryPlaceholder")}
                                label={categoryAlias}
                            />
                            <ValidationMessage
                                message={errors['download.category']}
                                visible={showError('download.category')}
                            />
                        </div>
                        <div>
                            <SearchSelect
                                options={subCategoryOptions ?? []}
                                value={formData.subCategory}
                                onChange={(_e, val) => onChange('subCategory', val)}
                                onBlur={() => onBlur('download.subCategory')}
                                placeholder={t("uploadDownloadDrawer.subCategoryPlaceholder")}
                                label={t("uploadDownloadDrawer.photoSubtypeLabel")}
                                disabled={!formData.category}
                            />
                            <ValidationMessage
                                message={errors['download.subCategory']}
                                visible={showError('download.subCategory')}
                            />
                        </div>
                    </div>

                    <div className="rounded-lg bg-[#f1f3f6] border border-[#e2e8f0] px-3 py-2 text-[11px] sm:text-xs leading-4 sm:leading-5 text-[#666]">
                        <span className="font-semibold text-[#444]">{t("uploadDownloadDrawer.documentTypeNotePrefix")}</span>{" "}
                        {t("uploadDownloadDrawer.documentTypeNoteText")}
                    </div>
                </CardContent>
            </Card>
            <PropertyFilter
                zoneOptions={zoneOptions ?? []}
                wardOptions={wardOptions ?? []}
                propertyFromOptions={propertyFromOptions}
                propertyToOptions={propertyToOptions}
                selectedZone={formData.zone}
                selectedWards={formData.ward}
                selectedPropertyFrom={formData.propertyFrom}
                selectedPropertyTo={formData.propertyTo}
                isLoadingPropertyFrom={isLoadingPropertyFrom}
                isLoadingPropertyTo={isLoadingPropertyTo}
                onZoneChange={onZoneChange}
                onWardsChange={onWardsChange}
                onPropertyFromChange={onPropertyFromChange}
                onPropertyToChange={onPropertyToChange}
                t={t}
            />
        </div>
    );
}