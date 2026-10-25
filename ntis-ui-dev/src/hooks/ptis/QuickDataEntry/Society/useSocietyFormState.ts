import { useState } from 'react';
import { PropertySocietyDetailsApiItem } from '@/types/property-society-details.types';
import { SOCIETY_VALIDATION_RULES } from '@/lib/utils/society-validation/society-validation';
import { useDigitInputs } from '@/hooks/useDigitInputs';
import { extractCountryCode } from '@/lib/utils/kyc-validation/country-code.utils';

export const useSocietyFormState = (societyData: PropertySocietyDetailsApiItem | null) => {
    const parsedManagerMobile = extractCountryCode(societyData?.managerMobileNo);
    const parsedSecretaryMobile = extractCountryCode(societyData?.secretaryMobileNo);

    // Use useDigitInputs hook for mobile number fields
    const managerMobileInput = useDigitInputs(
        SOCIETY_VALIDATION_RULES.MOBILE_LENGTH,
        parsedManagerMobile.mobileNo
    );

    const secretaryMobileInput = useDigitInputs(
        SOCIETY_VALIDATION_RULES.MOBILE_LENGTH,
        parsedSecretaryMobile.mobileNo
    );

    // Country code state management
    const [managerMobileCountryCode, setManagerMobileCountryCode] = useState(parsedManagerMobile.countryCode);
    const [secretaryMobileCountryCode, setSecretaryMobileCountryCode] = useState(parsedSecretaryMobile.countryCode);

    // Email state management
    const [managerEmail, setManagerEmail] = useState(societyData?.managerEmailId ?? '');
    const [secretaryEmail, setSecretaryEmail] = useState(societyData?.secretaryEmailId ?? '');
    const [societyEmail, setSocietyEmail] = useState(societyData?.societyEmailId ?? '');

    // Name state management
    const [landOwnerName, setLandOwnerName] = useState(societyData?.landOwnerName ?? '');
    const [builderName, setBuilderName] = useState(societyData?.builderName ?? '');
    const [societyName, setSocietyName] = useState(societyData?.societyName ?? '');
    const [managerName, setManagerName] = useState(societyData?.managerName ?? '');
    const [secretaryName, setSecretaryName] = useState(societyData?.secretaryName ?? '');

    // Address state management
    const [societyAddress, setSocietyAddress] = useState(societyData?.societyAddress ?? '');

    // Wing state management
    const [wingId, setWingId] = useState<number | null>(societyData?.wingId ?? null);
    const [wingNo, setWingNo] = useState<string | null>(societyData?.wingNo ?? null);

    // Submission state
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    return {
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
        wingNo,
        setWingNo,
        isSubmitted,
        setIsSubmitted,
        hasChanges,
        setHasChanges,
    };
};
