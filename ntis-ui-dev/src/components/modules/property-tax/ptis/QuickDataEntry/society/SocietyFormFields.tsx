import { SocietyGeneralFields } from './SocietyGeneralFields';
import { SocietyContactFields } from './SocietyContactFields';
import { useDigitInputs } from '@/hooks/useDigitInputs';

interface SocietyFormFieldsProps {
    t: (key: string) => string;
    managerMobileInput: ReturnType<typeof useDigitInputs>;
    secretaryMobileInput: ReturnType<typeof useDigitInputs>;
    managerMobileCountryCode: string;
    setManagerMobileCountryCode: (val: string) => void;
    secretaryMobileCountryCode: string;
    setSecretaryMobileCountryCode: (val: string) => void;
    managerEmail: string;
    setManagerEmail: (email: string) => void;
    secretaryEmail: string;
    setSecretaryEmail: (email: string) => void;
    societyEmail: string;
    setSocietyEmail: (email: string) => void;
    landOwnerName: string;
    setLandOwnerName: (name: string) => void;
    builderName: string;
    setBuilderName: (name: string) => void;
    societyName: string;
    setSocietyName: (name: string) => void;
    managerName: string;
    setManagerName: (name: string) => void;
    secretaryName: string;
    setSecretaryName: (name: string) => void;
    societyAddress: string;
    setSocietyAddress: (address: string) => void;
    wingId: number | null;
    wingOptions: { label: string; value: string }[];
    handleWingChange: (name: string | undefined, value: string) => void;
    showError: (
        field: 'managerMobile' | 'secretaryMobile' | 'managerEmail' | 'secretaryEmail' | 'societyEmail' |
            'landOwnerName' | 'builderName' | 'societyName' | 'managerName' | 'secretaryName' | 'societyAddress',
        isValid: boolean
    ) => boolean;
    onFocusField: (field: string) => void;
    onBlurField: () => void;
}

export const SocietyFormFields = ({
    t,
    managerMobileInput,
    secretaryMobileInput,
    managerMobileCountryCode,
    setManagerMobileCountryCode,
    secretaryMobileCountryCode,
    setSecretaryMobileCountryCode,
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
    onFocusField,
    onBlurField,
}: SocietyFormFieldsProps & { onFocusField: (field: string) => void; onBlurField: () => void; }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
            <SocietyGeneralFields
                societyEmail={societyEmail}
                setSocietyEmail={setSocietyEmail}
                landOwnerName={landOwnerName}
                setLandOwnerName={setLandOwnerName}
                builderName={builderName}
                setBuilderName={setBuilderName}
                societyName={societyName}
                setSocietyName={setSocietyName}
                wingId={wingId}
                wingOptions={wingOptions}
                handleWingChange={handleWingChange}
                secretaryName={secretaryName}
                setSecretaryName={setSecretaryName}
                showError={showError}
                onFocusField={onFocusField}
                onBlurField={onBlurField}
            />
            <SocietyContactFields
                t={t}
                managerMobileInput={managerMobileInput}
                secretaryMobileInput={secretaryMobileInput}
                managerMobileCountryCode={managerMobileCountryCode}
                setManagerMobileCountryCode={setManagerMobileCountryCode}
                secretaryMobileCountryCode={secretaryMobileCountryCode}
                setSecretaryMobileCountryCode={setSecretaryMobileCountryCode}
                managerEmail={managerEmail}
                setManagerEmail={setManagerEmail}
                secretaryEmail={secretaryEmail}
                setSecretaryEmail={setSecretaryEmail}
                managerName={managerName}
                setManagerName={setManagerName}
                societyAddress={societyAddress}
                setSocietyAddress={setSocietyAddress}
                showError={showError}
                onFocusField={onFocusField}
                onBlurField={onBlurField}
            />
        </div>
    );
};
