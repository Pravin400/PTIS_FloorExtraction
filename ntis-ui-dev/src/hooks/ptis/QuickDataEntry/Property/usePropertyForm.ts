import { useRef } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useConfirm } from '@/components/common/ConfirmProvider';
import { useLoading } from '@/hooks/useLoading';
import { hasErrors } from '@/lib/utils/validation';
import {
    updatePropertyBasicDetailsAction,
    deletePropertyDetailsAction,
    validateFloorCompatibilityAction,
} from '@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/Property/action';
import {
    UpdatePropertyBasicDetailsDto,
    PropertyFormViewProps,
} from '@/types/property-basic-details.types';

import { usePropertyOptions } from '@/hooks/ptis/QuickDataEntry/Property/usePropertyOptions';
import { usePropertyFormState } from '@/hooks/ptis/QuickDataEntry/Property/usePropertyFormState';
import { usePropertyChanges } from '@/hooks/ptis/QuickDataEntry/Property/usePropertyChanges';
import { parseOptionalNumber } from '@/lib/utils/kyc-validation/form-helpers';
import { validatePropertyForm } from '@/lib/utils/propertybasic-validation/validatePropertyForm';
import { useQdeSaveTracker, QDE_INCOMPATIBLE_FLOOR_KEY } from '@/hooks/ptis/QuickDataEntry/useQdeSaveTracker';

export const usePropertyForm = (props: PropertyFormViewProps) => {
    const {
        MoujaMaster: moujaList,
        propertyData,        
        locale
    } = props;

    const t = useTranslations('quickDataEntry');
    const { confirm } = useConfirm();
    const formRef = useRef<HTMLFormElement>(null);
    const { isLoading: isUpdating, startLoading, stopLoading } = useLoading(false);
    const { markChangesSaved, queryClient } = useQdeSaveTracker(propertyData?.propertyId);

    // 1. Options Hook
    const { categoryOptions, moujaOptions, propertyDescriptionOptions } = usePropertyOptions(props);

    // 2. State Hook
    const {
        propertyTypeId, setPropertyTypeId,
        categoryId, setCategoryId,
        moujaId, setMoujaId,
        moujaName, setMoujaName,
        hasChanges, setHasChanges,
    } = usePropertyFormState(propertyData);

    const { checkFormChanges } = usePropertyChanges({
        formRef,
        categoryId,
        propertyTypeId,
        moujaId,
        propertyData,
        setHasChanges
    });

    // Handlers
    const handlePropertyDescriptionChange = (_name: string | undefined, value: string) => setPropertyTypeId(Number(value) || null);
    const handleCategoryChange = (_name: string | undefined, value: string) => setCategoryId(Number(value) || null);
    const handleMoujaChange = (_name: string | undefined, value: string) => {
        const id = Number(value) || null;
        setMoujaId(id);
        const selectedMouja = moujaList.find((m) => m.id === id);
        setMoujaName(selectedMouja?.moujaName || '');
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!propertyData) {
            toast.error(t('property.updateError'));
            return;
        }

        const formData = new FormData(e.currentTarget);

        const errors = validatePropertyForm(formData, categoryId, t);

        if (hasErrors(errors)) {
            toast.error(Object.values(errors)[0]);
            return;
        }

        const pId = propertyData.propertyId;

        const rawTaxZoneId = formData.get("taxZoneId");
        const taxZoneId = rawTaxZoneId && !isNaN(Number(rawTaxZoneId)) ? Number(rawTaxZoneId) : propertyData.taxZoneId;

        const payload: UpdatePropertyBasicDetailsDto = {
            wardId: propertyData.wardId,
            taxZoneId,
            categoryId,
            propertyTypeId: propertyTypeId || null,
            moujaId: moujaId,
            moujaName: moujaName || null,
            partitionNo: propertyData?.partitionNo ?? null,
            flatOrShopNo: String(formData.get("flatOrShopNo") ?? "").trim() || null,
            plotNo: String(formData.get("plotNo") ?? "").trim() || null,
            surveyNo: String(formData.get("surveyNo") ?? "").trim() || null,
            upicId: String(formData.get("upicId") ?? "").trim() || null,
            subZoneNo: String(formData.get("subZoneNo") ?? "").trim() || null,
            noOfResidentialToilets: parseOptionalNumber(formData.get("noOfResidentialToilets")),
            noOfCommercialToilets: parseOptionalNumber(formData.get("noOfCommercialToilets")),
            totalBuiltupAreaSqFeet: parseOptionalNumber(formData.get("totalBuiltupAreaSqFeet")),
            totalCarpetAreaSqFeet: parseOptionalNumber(formData.get("totalCarpetAreaSqFeet")),
            totalBuiltupAreaSqMeter: parseOptionalNumber(formData.get("totalBuiltupAreaSqMeter")),
            totalCarpetAreaSqMeter: parseOptionalNumber(formData.get("totalCarpetAreaSqMeter")),
            plotArea: propertyData?.plotArea ?? null,
            plotAreaFtWidth: propertyData?.plotAreaFtWidth ?? null,
            plotAreaFtLength: propertyData?.plotAreaFtLength ?? null,
            plotAreaMtrWidth: propertyData?.plotAreaMtrWidth ?? null,
            plotAreaMtrLength: propertyData?.plotAreaMtrLength ?? null,
            rateSectionDescription: String(formData.get("rateSectionDescription") ?? "").trim() || null,
        };

        const originalCategoryId = propertyData?.categoryId ?? null;
        const isCategoryChanged = !!originalCategoryId && categoryId !== originalCategoryId;
        const selectedCategoryOption = categoryOptions.find((opt) => opt.value === categoryId?.toString());
        const isPlotCategory = selectedCategoryOption?.label?.trim().toLowerCase() === 'plot';

        const originalPropertyTypeId = propertyData?.propertyTypeId ?? null;
        const isPropertyDescriptionChanged = originalPropertyTypeId !== null && propertyTypeId !== null && propertyTypeId !== originalPropertyTypeId;

        if (isCategoryChanged && isPlotCategory) {
            confirm({
                variant: "warning",
                title: t('property.categoryChangeConfirmTitle'),
                description: t('property.categoryChangeConfirmText'),
                confirmText: t('property.categoryChangeConfirmButton'),
                onConfirm: async () => {
                    startLoading();
                    try {
                        const deleteResult = await deletePropertyDetailsAction(pId);
                        if (!deleteResult.success) {
                            toast.error(deleteResult.error || t('property.errors.deletePropertyDetails'));
                            return;
                        }
                        const result = await updatePropertyBasicDetailsAction(locale, pId, payload);
                        if (!result?.success) {
                            toast.error(t('property.errors.updatePropertyBasicDetails'));
                            return;
                        }
                        markChangesSaved();
                        toast.success(t('property.updateSuccess'));
                    } catch (_err) {
                        toast.error(t('property.updateError'));
                    } finally {
                        stopLoading();
                    }
                }
            });
        } else if (isPropertyDescriptionChanged) {
            confirm({
                variant: "warning",
                title: t('property.propertyDescriptionChangeConfirmTitle'),
                description: t('property.propertyDescriptionChangeConfirmText'),
                confirmText: t('property.propertyDescriptionChangeConfirmButton'),
                cancelText: t('common.cancel'),
                onConfirm: async () => {
                    startLoading();
                    try {
                        const result = await updatePropertyBasicDetailsAction(locale, pId, payload);
                        if (!result?.success) {
                            toast.error(t('property.errors.updatePropertyBasicDetails'));
                            return;
                        }
                        
                        // Validate existing floor compatibility immediately
                        if (propertyTypeId) {
                            const checkCompat = await validateFloorCompatibilityAction(pId, propertyTypeId);
                            if (checkCompat.success && checkCompat.data) {
                                const hasIncompatible = !checkCompat.data.isCompatible;
                                queryClient.setQueryData(QDE_INCOMPATIBLE_FLOOR_KEY(pId), hasIncompatible);
                                if (typeof window !== 'undefined') {
                                    (window as unknown as { __hasIncompatibleFloor?: boolean }).__hasIncompatibleFloor = hasIncompatible;
                                }
                            }
                        }

                        markChangesSaved();
                        toast.success(t('property.updateSuccess'));
                    } catch (_err) {
                        toast.error(t('property.updateError'));
                    } finally {
                        stopLoading();
                    }
                }
            });
        } else {
            confirm({
                variant: "update",
                title: t('property.updateConfirmTitle'),
                description: t('property.updateConfirmText'),
                confirmText: t('property.updateConfirmButton'),
                onConfirm: async () => {
                    startLoading();
                    try {
                        const result = await updatePropertyBasicDetailsAction(locale, pId, payload);
                        if (!result?.success) {
                            toast.error(t('property.errors.updatePropertyBasicDetails'));
                            return;
                        }
                        markChangesSaved();
                        toast.success(t('property.updateSuccess'));
                    } catch (_err) {
                        toast.error(t('property.updateError'));
                    } finally {
                        stopLoading();
                    }
                }
            });
        }
    };

    return {
        formRef,
        hasChanges,
        isUpdating,
        propertyTypeId,
        categoryId,
        moujaId,
        checkFormChanges,
        handleSubmit,
        handlePropertyDescriptionChange,
        handleCategoryChange,
        handleMoujaChange,
        categoryOptions,
        moujaOptions,
        propertyDescriptionOptions,
    };
};