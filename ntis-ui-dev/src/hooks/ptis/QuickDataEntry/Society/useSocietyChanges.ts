import { useCallback, useEffect, RefObject } from 'react';
import { PropertySocietyDetailsApiItem } from '@/types/property-society-details.types';
import { extractCountryCode } from '@/lib/utils/kyc-validation/country-code.utils';

export const useSocietyChanges = ({
    formRef,
    managerMobileDigits,
    secretaryMobileDigits,
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
    setHasChanges,
}: {
    formRef: RefObject<HTMLFormElement | null>;
    managerMobileDigits: string[];
    secretaryMobileDigits: string[];
    managerMobileCountryCode: string;
    secretaryMobileCountryCode: string;
    landOwnerName: string;
    builderName: string;
    societyName: string;
    managerName: string;
    secretaryName: string;
    managerEmail: string;
    secretaryEmail: string;
    societyEmail: string;
    societyAddress: string;
    wingId: number | null;
    societyData: PropertySocietyDetailsApiItem | null;
    setHasChanges: (value: boolean) => void;
}) => {
    
    const checkFormChanges = useCallback(() => {
        if (!formRef.current) return;
        const parsedManagerMobile = extractCountryCode(societyData?.managerMobileNo);
        const parsedSecretaryMobile = extractCountryCode(societyData?.secretaryMobileNo);

        const isChanged =
            landOwnerName.trim() !== (societyData?.landOwnerName ?? "") ||
            builderName.trim() !== (societyData?.builderName ?? "") ||
            societyName.trim() !== (societyData?.societyName ?? "") ||
            societyAddress.trim() !== (societyData?.societyAddress ?? "") ||
            societyEmail.trim() !== (societyData?.societyEmailId ?? "") ||
            managerName.trim() !== (societyData?.managerName ?? "") ||
            managerEmail.trim() !== (societyData?.managerEmailId ?? "") ||
            (managerMobileCountryCode || '91') !== parsedManagerMobile.countryCode ||
            managerMobileDigits.join("") !== parsedManagerMobile.mobileNo ||
            secretaryName.trim() !== (societyData?.secretaryName ?? "") ||
            secretaryEmail.trim() !== (societyData?.secretaryEmailId ?? "") ||
            (secretaryMobileCountryCode || '91') !== parsedSecretaryMobile.countryCode ||
            secretaryMobileDigits.join("") !== parsedSecretaryMobile.mobileNo ||
            (wingId ?? null) !== (societyData?.wingId ?? null);

        setHasChanges(isChanged);
    }, [
        managerMobileDigits, 
        secretaryMobileDigits, 
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
        formRef, 
        setHasChanges
    ]);

    useEffect(() => {
        checkFormChanges();
    }, [checkFormChanges]);

    return { checkFormChanges };
};
