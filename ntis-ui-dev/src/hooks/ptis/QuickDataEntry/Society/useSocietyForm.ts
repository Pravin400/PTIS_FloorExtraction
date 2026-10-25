import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useConfirm } from '@/components/common/ConfirmProvider';
import { useLoading } from '@/hooks/useLoading';
import { societyValidations, validateForm, hasErrors } from "@/lib/utils/validation";
import { updatePropertySocietyDetailsAction } from "@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/Society/action";
import { SocietyFormProps, UpdatePropertySocietyDetailsDto } from "@/types/property-society-details.types";
import { kycValidators } from '@/lib/utils/kyc-validation/kyc-validation.constants';
import { societyValidators } from '@/lib/utils/society-validation/society-validation';

import { useSocietyChanges } from '@/hooks/ptis/QuickDataEntry/Society/useSocietyChanges';
import { useSocietyFormState } from '@/hooks/ptis/QuickDataEntry/Society/useSocietyFormState';
import { useQdeSaveTracker } from '@/hooks/ptis/QuickDataEntry/useQdeSaveTracker';

const getMobileErrorMessage = (value: string, t: (key: string) => string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (kycValidators.hasRepeatedSequence(digits, 5)) {
        return t('society.validation.invalidRepeatedSequence') || 'Repeated number sequences are not allowed.';
    }
    if (!/^[6-9]/.test(digits)) {
        return t('society.validation.invalidMobileStart') || 'Mobile number must start with 6 to 9.';
    }
    if (digits.length !== 10) {
        return t('society.validation.invalidMobile') || 'Mobile number must be exactly 10 digits.';
    }
    return '';
};

export const useSocietyForm = (props: SocietyFormProps) => {
    const { societyData, propertyIdSearch, locale } = props;

    const router = useRouter();
    const t = useTranslations('quickDataEntry');
    const { confirm } = useConfirm();
    const formRef = useRef<HTMLFormElement>(null);
    const { isLoading: isUpdating, startLoading, stopLoading } = useLoading(false);
    const targetPropertyId = societyData?.propertyId || propertyIdSearch;
    const { markChangesSaved } = useQdeSaveTracker(targetPropertyId);

    // 1. State Hook
    const {
        managerMobileCountryCode,
        setManagerMobileCountryCode,
        secretaryMobileCountryCode,
        setSecretaryMobileCountryCode,
        managerMobileInput,
        secretaryMobileInput,
        managerEmail,
        setManagerEmail,
        secretaryEmail,
        setSecretaryEmail,
        societyEmail,
        setSocietyEmail,
        landOwnerName,
        setLandOwnerName,
        builderName,
        setBuilderName,
        societyName,
        setSocietyName,
        managerName,
        setManagerName,
        secretaryName,
        setSecretaryName,
        societyAddress,
        setSocietyAddress,
        wingId,
        setWingId,
        setWingNo,
        isSubmitted,
        setIsSubmitted,
        hasChanges,
        setHasChanges,
    } = useSocietyFormState(societyData);

    const [focusedField, setFocusedField] = useState<string | null>(null);

    // Validation error display logic - matches KYC pattern
    // Shows errors only if:
    // 1. Form has been submitted, OR
    // 2. Field has been touched (has a value) AND is invalid
    const showError = (
        field: 'managerMobile' | 'secretaryMobile' | 'managerEmail' | 'secretaryEmail' | 'societyEmail' |
            'landOwnerName' | 'builderName' | 'societyName' | 'managerName' | 'secretaryName' | 'societyAddress',
        isValid: boolean
    ): boolean => {
        if (focusedField === field && !isSubmitted) return false;

        // If form is submitted, show all validation errors
        if (isSubmitted) return !isValid;

        // For digit inputs (mobile numbers), show error only if:
        // - the input has been blurred (isFocused is false) and has some content, OR
        // - the input is active (isFocused is true) and is nearly complete (length >= input length - 2)
        if (field === 'managerMobile') {
            const len = managerMobileInput.digits.length;
            return !isValid && (
                (!managerMobileInput.isFocused && managerMobileInput.value.length > 0) ||
                (managerMobileInput.isFocused && managerMobileInput.value.length >= len - 2)
            );
        }
        if (field === 'secretaryMobile') {
            const len = secretaryMobileInput.digits.length;
            return !isValid && (
                (!secretaryMobileInput.isFocused && secretaryMobileInput.value.length > 0) ||
                (secretaryMobileInput.isFocused && secretaryMobileInput.value.length >= len - 2)
            );
        }

        // For email fields, show error only if field has been touched (has value)
        if (field === 'managerEmail') {
            return !!managerEmail && !isValid;
        }
        if (field === 'secretaryEmail') {
            return !!secretaryEmail && !isValid;
        }
        if (field === 'societyEmail') {
            return !!societyEmail && !isValid;
        }

        // For name fields, show error only if field has been touched (has value)
        if (field === 'landOwnerName') {
            return !!landOwnerName && !isValid;
        }
        if (field === 'builderName') {
            return !!builderName && !isValid;
        }
        if (field === 'societyName') {
            return !!societyName && !isValid;
        }
        if (field === 'managerName') {
            return !!managerName && !isValid;
        }
        if (field === 'secretaryName') {
            return !!secretaryName && !isValid;
        }
        if (field === 'societyAddress') {
            return !!societyAddress && !isValid;
        }

        return false;
    };

    // 2. Changes Hook - Updated to use new input structure
    const { checkFormChanges } = useSocietyChanges({
        formRef,
        managerMobileDigits: managerMobileInput.digits,
        secretaryMobileDigits: secretaryMobileInput.digits,
        managerMobileCountryCode,
        secretaryMobileCountryCode,
        landOwnerName,
        builderName,
        societyName,
        managerName,
        secretaryName,
        managerEmail,
        secretaryEmail,
        societyEmail,
        societyAddress,
        wingId,
        societyData,
        setHasChanges
    });

    const wingOptions = (props?.WingMaster && props?.WingMaster?.length > 0)
        ? [
            { label: t('commonbuttonmessages.clear') || 'Clear', value: 'CLEAR' },
            ...props?.WingMaster?.map((wing) => ({
                label: wing.wingNo,
                value: String(wing?.id),
            }))
        ]
        : [];

    const handleWingChange = (_name: string | undefined, value: string) => {
        const id = (value && value !== 'CLEAR') ? (Number(value) || null) : null;
        setWingId(id);
        const selectedWing = id !== null ? (props.WingMaster || []).find((w) => w.id === id) : undefined;
        setWingNo(selectedWing?.wingNo || null);
    };

    // 3. Validation check for submit button
    // Returns true if all filled fields have valid values
    const canSubmit = (): boolean => {
        const managerMobileStr = managerMobileInput.value;
        const secretaryMobileStr = secretaryMobileInput.value;

        // Check emails - if filled, must be valid (strict)
        const isManagerEmailValid = !managerEmail || societyValidators.isValidEmail(managerEmail, true);
        const isSecretaryEmailValid = !secretaryEmail || societyValidators.isValidEmail(secretaryEmail, true);
        const isSocietyEmailValid = !societyEmail || societyValidators.isValidEmail(societyEmail, true);

        // Check mobile numbers - if filled, must be valid
        const isManagerMobileValid = (!managerMobileStr || societyValidators.isValidMobile(managerMobileInput.value)) && (!managerMobileStr || (managerMobileCountryCode || '91').length === 2);
        const isSecretaryMobileValid = (!secretaryMobileStr || societyValidators.isValidMobile(secretaryMobileInput.value)) && (!secretaryMobileStr || (secretaryMobileCountryCode || '91').length === 2);
        // Check names - if filled, must be valid
        const isLandOwnerNameValid = !landOwnerName || societyValidators.isValidPersonName(landOwnerName);
        const isBuilderNameValid = !builderName || societyValidators.isValidPersonName(builderName);
        const isSocietyNameValid = !societyName || societyValidators.isValidSocietyName(societyName);
        const isManagerNameValid = !managerName || societyValidators.isValidPersonName(managerName);
        const isSecretaryNameValid = !secretaryName || societyValidators.isValidPersonName(secretaryName);

        // Check address - if filled, must be valid
        const isSocietyAddressValid = !societyAddress || societyValidators.isValidAddress(societyAddress);

        return (
            isManagerEmailValid &&
            isSecretaryEmailValid &&
            isSocietyEmailValid &&
            isManagerMobileValid &&
            isSecretaryMobileValid &&
            isLandOwnerNameValid &&
            isBuilderNameValid &&
            isSocietyNameValid &&
            isManagerNameValid &&
            isSecretaryNameValid &&
            isSocietyAddressValid
        );
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitted(true);

        const pid = societyData?.propertyId || propertyIdSearch;
        const managerMobileStr = managerMobileInput.value ? `+${managerMobileCountryCode || '91'}${managerMobileInput.value}` : '';
        const secretaryMobileStr = secretaryMobileInput.value ? `+${secretaryMobileCountryCode || '91'}${secretaryMobileInput.value}` : '';

        // Validate emails before proceeding (strict)
        const isManagerEmailValid = societyValidators.isValidEmail(managerEmail, true);
        const isSecretaryEmailValid = societyValidators.isValidEmail(secretaryEmail, true);
        const isSocietyEmailValid = !societyEmail || societyValidators.isValidEmail(societyEmail, false);
        const isManagerMobileValid = societyValidators.isValidMobile(managerMobileInput.value) && (managerMobileCountryCode ?? '91').length !== 1;
        const isSecretaryMobileValid = societyValidators.isValidMobile(secretaryMobileInput.value) && (secretaryMobileCountryCode ?? '91').length !== 1;

        // Validate names
        const isLandOwnerNameValid = !landOwnerName || societyValidators.isValidPersonName(landOwnerName);
        const isBuilderNameValid = !builderName || societyValidators.isValidPersonName(builderName);
        const isSocietyNameValid = !societyName || societyValidators.isValidSocietyName(societyName);
        const isManagerNameValid = !managerName || societyValidators.isValidPersonName(managerName);
        const isSecretaryNameValid = !secretaryName || societyValidators.isValidPersonName(secretaryName);
        const isSocietyAddressValid = !societyAddress || societyValidators.isValidAddress(societyAddress);

        // Show specific error messages for invalid fields
        if (!isManagerEmailValid && managerEmail) {
            toast.error(t('society.validation.managerEmail'));
            return;
        }
        if (!isSecretaryEmailValid && secretaryEmail) {
            toast.error(t('society.validation.secretaryEmail'));
            return;
        }
        if (!isSocietyEmailValid && societyEmail) {
            toast.error(t('society.validation.societyEmail'));
            return;
        }
        if (!isManagerMobileValid && managerMobileInput.value) {
            toast.error(getMobileErrorMessage(managerMobileInput.value, t));
            return;
        }
        if (!isSecretaryMobileValid && secretaryMobileInput.value) {
            toast.error(getMobileErrorMessage(secretaryMobileInput.value, t));
            return;
        }
        if (!isLandOwnerNameValid) {
            toast.error(t('society.validation.landOwnerName'));
            return;
        }
        if (!isBuilderNameValid) {
            toast.error(t('society.validation.builderName'));
            return;
        }
        if (!isSocietyNameValid) {
            toast.error(t('society.validation.societyName'));
            return;
        }
        if (!isManagerNameValid) {
            toast.error(t('society.validation.managerName'));
            return;
        }
        if (!isSecretaryNameValid) {
            toast.error(t('society.validation.secretaryName'));
            return;
        }
        if (!isSocietyAddressValid) {
            toast.error(t('society.validation.societyAddress'));
            return;
        }

        const data = {
            landOwnerName: landOwnerName.trim(),
            builderName: builderName.trim(),
            managerName: managerName.trim(),
            secretaryName: secretaryName.trim(),
            societyEmailId: societyEmail.trim(),
            managerEmailId: managerEmail.trim(),
            secretaryEmailId: secretaryEmail.trim(),
            managerMobileStr: managerMobileInput.value,
            secretaryMobileStr: secretaryMobileInput.value,
        };

        const errors = validateForm(data, {
            landOwnerName: societyValidations.personName("landOwnerName", t),
            builderName: societyValidations.personName("builderName", t),
            managerName: societyValidations.personName("managerName", t),
            secretaryName: societyValidations.personName("secretaryName", t),
            societyEmailId: societyValidations.email("societyEmail", t),
            managerEmailId: societyValidations.email("managerEmail", t),
            secretaryEmailId: societyValidations.email("secretaryEmail", t),
            managerMobileStr: societyValidations.mobile10("managerMobile", t),
            secretaryMobileStr: societyValidations.mobile10("secretaryMobile", t),
        });

        if (hasErrors(errors)) {
            toast.error(Object.values(errors)[0]);
            return;
        }

        const selectedWing = (props.WingMaster || []).find((wing) => wing.id === wingId);

        const payload: UpdatePropertySocietyDetailsDto = {
            propertyId: pid,
            societyDetailId: societyData?.societyDetailId ?? null,
            wingId: selectedWing?.id ?? null,
            wingNo: selectedWing?.wingNo ?? null,
            wingName: selectedWing?.wingNo ?? null,
            societyName: societyName.trim() || null,
            societyAddress: societyAddress.trim() || null,
            societyEmailId: data.societyEmailId || null,
            managerName: data.managerName || null,
            managerEmailId: data.managerEmailId || null,
            managerMobileNo: managerMobileStr || null,
            secretaryName: data.secretaryName || null,
            secretaryEmailId: data.secretaryEmailId || null,
            secretaryMobileNo: secretaryMobileStr || null,
            landOwnerName: data.landOwnerName || null,
            builderName: data.builderName || null,
            societyNameEnglish: societyName.trim() || null,
            societyAddressEnglish: societyAddress.trim() || null,
            secretaryNameEnglish: data.secretaryName || null,
            managerNameEnglish: data.managerName || null,
            landOwnerNameEnglish: data.landOwnerName || null,
            builderNameEnglish: data.builderName || null,
        };

        confirm({
            variant: "update",
            title: t("society.updateConfirmTitle"),
            description: t("society.updateConfirmText"),
            confirmText: t("society.updateConfirmButton"),
            onConfirm: async () => {
                startLoading();
                try {
                    const result = await updatePropertySocietyDetailsAction(locale, pid, payload);
                    if (!result?.success) {
                        toast.error(result?.error || t("society.updateError"));
                        return;
                    }
                    toast.success(t("society.updateSuccess"));
                    markChangesSaved();
                    router.refresh();
                } catch (_err) {
                    toast.error(t("society.updateError"));
                } finally {
                    stopLoading();
                }
            },
        });
    };

    return {
        formRef,
        hasChanges,
        isUpdating,
        managerMobileCountryCode,
        setManagerMobileCountryCode,
        secretaryMobileCountryCode,
        setSecretaryMobileCountryCode,
        managerMobileInput,
        secretaryMobileInput,
        managerEmail,
        setManagerEmail,
        secretaryEmail,
        setSecretaryEmail,
        societyEmail,
        setSocietyEmail,
        landOwnerName,
        setLandOwnerName,
        builderName,
        setBuilderName,
        societyName,
        setSocietyName,
        managerName,
        setManagerName,
        secretaryName,
        setSecretaryName,
        societyAddress,
        setSocietyAddress,
        wingId,
        wingOptions,
        handleWingChange,
        showError,
        canSubmit,
        handleSubmit,
        checkFormChanges,
        focusedField,
        setFocusedField,
    };
};