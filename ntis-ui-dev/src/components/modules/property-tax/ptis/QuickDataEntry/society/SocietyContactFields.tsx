import { Input } from "@/components/common";
import { Tooltip } from "@/components/common/Tooltip";
import { Label } from "@/components/common/label";
import { kycValidators } from '@/lib/utils/kyc-validation/kyc-validation.constants';
import {
    SOCIETY_VALIDATION_RULES,
    societyValidators
} from '@/lib/utils/society-validation/society-validation';
import {
    sanitizeEmailStrict,
    sanitizeName,
    sanitizeAddress,
    capitalizeEachWordKycSociety
} from '@/lib/utils/input-sanitization';
import { useDigitInputs } from '@/hooks/useDigitInputs';

interface SocietyContactFieldsProps {
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
    managerName: string;
    setManagerName: (name: string) => void;
    societyAddress: string;
    setSocietyAddress: (address: string) => void;
    showError: (
        field: 'managerMobile' | 'secretaryMobile' | 'managerEmail' | 'secretaryEmail' | 'societyEmail' |
            'landOwnerName' | 'builderName' | 'societyName' | 'managerName' | 'secretaryName' | 'societyAddress',
        isValid: boolean
    ) => boolean;
    onFocusField: (field: string) => void;
    onBlurField: () => void;
}

export const SocietyContactFields = ({
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
    managerName,
    setManagerName,
    societyAddress,
    setSocietyAddress,
    showError,
    onFocusField,
    onBlurField,
}: SocietyContactFieldsProps) => {

    const preventEnterSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    };

    return (
        <>
            {/* 7. Manager Name */}
            <div className="space-y-1.5">
                <Label htmlFor="manager-name" className="text-xs font-semibold text-gray-700">{t('society.managerName')}</Label>
                <Tooltip content={managerName || ''} placement="top">
                    <Input
                        id="manager-name"
                        value={managerName || ''}
                        placeholder={t('society.managerNamePlaceholder')}
                        maxLength={SOCIETY_VALIDATION_RULES.PERSON_NAME_MAX_LENGTH}
                        className={`h-9 text-sm border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 ${showError('managerName', !managerName || societyValidators.isValidPersonName(managerName))
                            ? 'border-red-300 focus:border-red-500'
                            : ''
                            }`}
                        onFocus={() => onFocusField('managerName')}
                        onKeyDown={preventEnterSubmit}
                        onBlur={() => {
                            onBlurField();
                            setManagerName(capitalizeEachWordKycSociety(managerName.trim().replace(/\s+/g, ' '), true));
                        }}
                        onChange={(e) => {
                            const val = e.target.value;
                            const start = e.target.selectionStart ?? val.length;
                            const isAtEnd = start >= val.length;
                            const sanitized = sanitizeName(val);
                            const finalVal = isAtEnd ? capitalizeEachWordKycSociety(sanitized, false) : sanitized;
                            if (finalVal.length <= SOCIETY_VALIDATION_RULES.PERSON_NAME_MAX_LENGTH) {
                                setManagerName(finalVal);
                            }
                        }}
                    />
                </Tooltip>
                {showError('managerName', !managerName || societyValidators.isValidPersonName(managerName)) && (
                    <span className="text-xs text-red-500">
                        {managerName && (managerName.trim().length < SOCIETY_VALIDATION_RULES.NAME_MIN_LENGTH || managerName.trim().length > SOCIETY_VALIDATION_RULES.PERSON_NAME_MAX_LENGTH)
                            ? t('society.validation.invalidNameLength')
                            : t('society.validation.managerName')}
                    </span>
                )}
            </div>

            {/* 8. Secretary Mobile */}
            <div className="space-y-1.5">
                <Label htmlFor="secretary-mobile-0" className="text-xs font-semibold text-gray-700">
                    {t('society.secretaryMobile')}
                </Label>
                <div className={`flex items-center gap-1 px-1 bg-white border rounded-md h-9 focus-within:ring-1 ${showError('secretaryMobile', societyValidators.isValidMobile(secretaryMobileInput.value) && (secretaryMobileCountryCode ?? '91').length !== 1)
                    ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-300'
                    : 'border-purple-200 focus-within:border-purple-500 focus-within:ring-purple-200'
                    }`}>
                    <div className={`flex items-center justify-center px-1 h-7 bg-white border rounded text-xs font-semibold text-gray-900 shrink-0 focus-within:ring-1 ${showError('secretaryMobile', societyValidators.isValidMobile(secretaryMobileInput.value) && (secretaryMobileCountryCode ?? '91').length !== 1) ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-300' : 'border-gray-300 focus-within:border-purple-500 focus-within:ring-purple-300'}`}>
                        <span className="pointer-events-none">+</span>
                        <Input
                            naked
                            type="text"
                            maxLength={2}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            title={t('society.countryCode')}
                            className="w-[16px] bg-transparent outline-none p-0 m-0 leading-none text-center"
                            value={secretaryMobileCountryCode ?? '91'}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                setSecretaryMobileCountryCode(val);
                            }}
                        />
                    </div>
                    <div id="secretary-mobile-container" className="flex gap-0.5 flex-1 h-full items-center">
                        {Array.from({ length: SOCIETY_VALIDATION_RULES.MOBILE_LENGTH }).map((_, i) => (
                            <Input
                                key={i}
                                id={i === 0 ? 'secretary-mobile-0' : undefined}
                                aria-label={`${t('society.secretaryMobile')} digit ${i + 1} of ${SOCIETY_VALIDATION_RULES.MOBILE_LENGTH}`}
                                type="text"
                                maxLength={1}
                                inputMode="numeric"
                                pattern="[0-9]"
                                value={secretaryMobileInput.digits[i]}
                                onChange={(e) => secretaryMobileInput.handleChange(i, e.target.value)}
                                onKeyDown={(e) => {
                                    secretaryMobileInput.handleKeyDown(i, e);
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                    }
                                }}
                                onFocus={secretaryMobileInput.handleFocus}
                                onBlur={secretaryMobileInput.handleBlur}
                                ref={secretaryMobileInput.setRef(i)}
                                naked
                                error={showError('secretaryMobile', societyValidators.isValidMobile(secretaryMobileInput.value) && (secretaryMobileCountryCode ?? '91').length !== 1) ? 'error' : undefined}
                                className={`flex-1 min-w-0 w-full h-7 text-center text-xs font-semibold text-gray-900 border rounded bg-white outline-none focus:ring-1 ${showError('secretaryMobile', societyValidators.isValidMobile(secretaryMobileInput.value) && (secretaryMobileCountryCode ?? '91').length !== 1)
                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-300'
                                    : 'border-gray-300 focus:border-purple-500 focus:ring-purple-300'
                                    } ${secretaryMobileInput.lastTypedIndex === i ? 'animate-digit-pop' : ''}`}
                            />
                        ))}
                    </div>
                </div>
                {showError('secretaryMobile', societyValidators.isValidMobile(secretaryMobileInput.value) && (secretaryMobileCountryCode ?? '91').length !== 1) && (
                    <span className="text-xs text-red-500">
                        {(secretaryMobileCountryCode ?? '91').length === 1
                            ? t('society.validation.countryCodeLength')
                            : secretaryMobileInput.value && kycValidators.hasRepeatedSequence(secretaryMobileInput.value.replace(/\D/g, ''), 5)
                                ? t('society.validation.invalidRepeatedSequence')
                                : (secretaryMobileInput.value && !/^[6-9]/.test(secretaryMobileInput.value.replace(/\D/g, '')))
                                    ? t('society.validation.invalidMobileStart')
                                    : t('society.validation.invalidMobile')}
                    </span>
                )}
            </div>

            {/* 9. Manager Mobile */}
            <div className="space-y-1.5">
                <Label htmlFor="manager-mobile-0" className="text-xs font-semibold text-gray-700">
                    {t('society.managerMobileNo')}
                </Label>
                <div className={`flex items-center gap-1 px-1 bg-white border rounded-md h-9 focus-within:ring-1 ${showError('managerMobile', societyValidators.isValidMobile(managerMobileInput.value) && (managerMobileCountryCode ?? '91').length !== 1)
                    ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-300'
                    : 'border-purple-200 focus-within:border-purple-500 focus-within:ring-purple-200'
                    }`}>
                    <div className={`flex items-center justify-center px-1 h-7 bg-white border rounded text-xs font-semibold text-gray-900 shrink-0 focus-within:ring-1 ${showError('managerMobile', societyValidators.isValidMobile(managerMobileInput.value) && (managerMobileCountryCode ?? '91').length !== 1) ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-300' : 'border-gray-300 focus-within:border-purple-500 focus-within:ring-purple-300'}`}>
                        <span className="pointer-events-none">+</span>
                        <Input
                            naked
                            type="text"
                            maxLength={2}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            title={t('society.countryCode')}
                            className="w-[16px] bg-transparent outline-none p-0 m-0 leading-none text-center"
                            value={managerMobileCountryCode ?? '91'}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                setManagerMobileCountryCode(val);
                            }}
                        />
                    </div>
                    <div id="manager-mobile-container" className="flex gap-0.5 flex-1 h-full items-center">
                        {Array.from({ length: SOCIETY_VALIDATION_RULES.MOBILE_LENGTH }).map((_, i) => (
                            <Input
                                key={i}
                                id={i === 0 ? 'manager-mobile-0' : undefined}
                                aria-label={`${t('society.managerMobileNo')} digit ${i + 1} of ${SOCIETY_VALIDATION_RULES.MOBILE_LENGTH}`}
                                type="text"
                                maxLength={1}
                                inputMode="numeric"
                                pattern="[0-9]"
                                value={managerMobileInput.digits[i]}
                                onChange={(e) => managerMobileInput.handleChange(i, e.target.value)}
                                onKeyDown={(e) => {
                                    managerMobileInput.handleKeyDown(i, e);
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                    }
                                }}
                                onFocus={managerMobileInput.handleFocus}
                                onBlur={managerMobileInput.handleBlur}
                                ref={managerMobileInput.setRef(i)}
                                naked
                                error={showError('managerMobile', societyValidators.isValidMobile(managerMobileInput.value) && (managerMobileCountryCode ?? '91').length !== 1) ? 'error' : undefined}
                                className={`flex-1 min-w-0 w-full h-7 text-center text-xs font-semibold text-gray-900 border rounded bg-white outline-none focus:ring-1 ${showError('managerMobile', societyValidators.isValidMobile(managerMobileInput.value) && (managerMobileCountryCode ?? '91').length !== 1)
                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-300'
                                    : 'border-gray-300 focus:border-purple-500 focus:ring-purple-300'
                                    } ${managerMobileInput.lastTypedIndex === i ? 'animate-digit-pop' : ''}`}
                            />
                        ))}
                    </div>
                </div>
                {showError('managerMobile', societyValidators.isValidMobile(managerMobileInput.value) && (managerMobileCountryCode ?? '91').length !== 1) && (
                    <span className="text-xs text-red-500">
                        {(managerMobileCountryCode ?? '91').length === 1
                            ? t('society.validation.countryCodeLength')
                            : managerMobileInput.value && kycValidators.hasRepeatedSequence(managerMobileInput.value.replace(/\D/g, ''), 5)
                                ? t('society.validation.invalidRepeatedSequence')
                                : (managerMobileInput.value && !/^[6-9]/.test(managerMobileInput.value.replace(/\D/g, '')))
                                    ? t('society.validation.invalidMobileStart')
                                    : t('society.validation.invalidMobile')}
                    </span>
                )}
            </div>

            {/* 10. Secretary Email */}
            <div className="space-y-1.5">
                <Label htmlFor="secretary-email" className="text-xs font-semibold text-gray-700">{t('society.secretaryEmail')}</Label>
                <Tooltip content={secretaryEmail || ''} placement="top">
                    <Input
                        id="secretary-email"
                        type="email"
                        placeholder={t('society.secretaryEmailPlaceholder')}
                        value={secretaryEmail || ''}
                        maxLength={SOCIETY_VALIDATION_RULES.EMAIL_MAX_LENGTH}
                        className={`h-9 text-sm border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 ${showError('secretaryEmail', societyValidators.isValidEmail(secretaryEmail, true))
                            ? 'border-red-300 focus:border-red-500'
                            : ''
                            }`}
                        onFocus={() => onFocusField('secretaryEmail')}
                        onKeyDown={preventEnterSubmit}
                        onBlur={onBlurField}
                        onChange={(e) => {
                            const sanitized = sanitizeEmailStrict(e.target.value);
                            if (sanitized.length <= SOCIETY_VALIDATION_RULES.EMAIL_MAX_LENGTH) {
                                setSecretaryEmail(sanitized);
                            }
                        }}
                    />
                </Tooltip>
                {showError('secretaryEmail', societyValidators.isValidEmail(secretaryEmail, true)) && (
                    <span className="text-xs text-red-500">{t('society.validation.secretaryEmail')}</span>
                )}
            </div>

            {/* 11. Manager Email */}
            <div className="space-y-1.5">
                <Label htmlFor="manager-email" className="text-xs font-semibold text-gray-700">{t('society.managerEmail')}</Label>
                <Tooltip content={managerEmail || ''} placement="top">
                    <Input
                        id="manager-email"
                        type="email"
                        placeholder={t('society.managerEmailPlaceholder')}
                        value={managerEmail || ''}
                        maxLength={SOCIETY_VALIDATION_RULES.EMAIL_MAX_LENGTH}
                        className={`h-9 text-sm border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 ${showError('managerEmail', societyValidators.isValidEmail(managerEmail, true))
                            ? 'border-red-300 focus:border-red-500'
                            : ''
                            }`}
                        onFocus={() => onFocusField('managerEmail')}
                        onKeyDown={preventEnterSubmit}
                        onBlur={onBlurField}
                        onChange={(e) => {
                            const sanitized = sanitizeEmailStrict(e.target.value);
                            if (sanitized.length <= SOCIETY_VALIDATION_RULES.EMAIL_MAX_LENGTH) {
                                setManagerEmail(sanitized);
                            }
                        }}
                    />
                </Tooltip>
                {showError('managerEmail', societyValidators.isValidEmail(managerEmail, true)) && (
                    <span className="text-xs text-red-500">{t('society.validation.managerEmail')}</span>
                )}
            </div>

            {/* 12. Society Address */}
            <div className="space-y-1.5">
                <Label htmlFor="society-address" className="text-xs font-semibold text-gray-700">
                    {t('society.societyAddress')}
                </Label>
                <Tooltip content={societyAddress || ''} placement="top">
                    <Input
                        id="society-address"
                        name="societyAddress"
                        value={societyAddress || ''}
                        placeholder={t('society.societyAddressPlaceholder')}
                        maxLength={SOCIETY_VALIDATION_RULES.ADDRESS_MAX_LENGTH}
                        className={`h-9 text-sm border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 ${showError('societyAddress', !societyAddress || societyValidators.isValidAddress(societyAddress))
                            ? 'border-red-300 focus:border-red-500'
                            : ''
                            }`}
                        onFocus={() => onFocusField('societyAddress')}
                        onKeyDown={preventEnterSubmit}
                        onBlur={onBlurField}
                        onChange={(e) => {
                            const sanitized = sanitizeAddress(e.target.value);
                            if (sanitized.length <= SOCIETY_VALIDATION_RULES.ADDRESS_MAX_LENGTH) {
                                setSocietyAddress(sanitized);
                            }
                        }}
                    />
                </Tooltip>
                {showError('societyAddress', !societyAddress || societyValidators.isValidAddress(societyAddress)) && (
                    <span className="text-xs text-red-500">
                        {t('society.validation.societyAddress')}
                    </span>
                )}
            </div>
        </>
    );
};
