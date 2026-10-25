import { useCallback, useEffect, RefObject } from 'react';
import { PropertyBasicDetailsApiItem } from '@/types/property-basic-details.types';
import { parseOptionalNumber } from '@/lib/utils/kyc-validation/form-helpers';
import { propertyValidators } from '@/lib/utils/kyc-validation/kyc-validation.constants';
import {
    sanitizeFlatShopNo,
    sanitizePlotNo,
    sanitizeSurveyNo,
    sanitizeSubZoneNo,
} from '@/lib/utils/input-sanitization';

interface UsePropertyChangesProps {
    formRef: RefObject<HTMLFormElement | null>;
    categoryId: number | null;
    propertyTypeId: number | null;
    moujaId: number | null;
    propertyData: PropertyBasicDetailsApiItem | null;
    setHasChanges: (value: boolean) => void;
}

export const usePropertyChanges = ({
    formRef,
    categoryId,
    propertyTypeId,
    moujaId,
    propertyData,
    setHasChanges,
}: UsePropertyChangesProps) => {


    const checkFormChanges = useCallback(() => {
        if (!formRef.current) return;
        const formData = new FormData(formRef.current);
        const taxZoneIdFromForm = parseOptionalNumber(formData.get("taxZoneId"));

        const isChanged =
            taxZoneIdFromForm !== (propertyData?.taxZoneId ?? null) ||
            String(formData.get("plotNo") ?? "").trim() !== (propertyData?.plotNo ?? "") ||
            String(formData.get("flatOrShopNo") ?? "").trim() !== (propertyData?.flatOrShopNo ?? "") ||
            String(formData.get("surveyNo") ?? "").trim() !== (propertyData?.surveyNo ?? "") ||
            String(formData.get("subZoneNo") ?? "").trim() !== (propertyData?.subZoneNo ?? "") ||
            String(formData.get("rateSectionDescription") ?? "").trim() !== (propertyData?.rateSectionDescription ?? "") ||
            categoryId !== (propertyData?.categoryId ?? null) ||
            propertyTypeId !== (propertyData?.propertyTypeId ?? null) ||
            moujaId !== (propertyData?.moujaId ?? null);

        const flatOrShopNo = sanitizeFlatShopNo(String(formData.get("flatOrShopNo") ?? ""));
        const plotNo = sanitizePlotNo(String(formData.get("plotNo") ?? ""));
        const surveyNo = sanitizeSurveyNo(String(formData.get("surveyNo") ?? ""));
        const subZoneNo = sanitizeSubZoneNo(String(formData.get("subZoneNo") ?? ""));
        const taxZoneId = String(formData.get("taxZoneId") ?? "");

        const isValid =
            categoryId !== null &&
            propertyValidators.isValidFlatShopNo(flatOrShopNo) &&
            propertyValidators.isValidPlotNo(plotNo) &&
            propertyValidators.isValidSurveyNo(surveyNo) &&
            propertyValidators.isValidSubZoneNo(subZoneNo) &&
            (taxZoneId !== '');

        setHasChanges(isChanged && isValid);
    }, [categoryId, propertyTypeId, moujaId, propertyData, formRef, setHasChanges]);

    useEffect(() => {
        checkFormChanges();
    }, [checkFormChanges]);

    return { checkFormChanges };
};