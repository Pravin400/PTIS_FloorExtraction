import { Input, SearchSelect } from "@/components/common";
import { Tooltip } from "@/components/common/Tooltip";
import { Label } from "@/components/common/label";
import {
    societyValidators,
    SOCIETY_VALIDATION_RULES
} from '@/lib/utils/society-validation/society-validation';
import {
    sanitizeEmailStrict,
    sanitizeName,
    capitalizeEachWordKycSociety
} from '@/lib/utils/input-sanitization';
import { useTranslations } from "next-intl";

interface SocietyGeneralFieldsProps {
    societyEmail: string;
    setSocietyEmail: (email: string) => void;
    landOwnerName: string;
    setLandOwnerName: (name: string) => void;
    builderName: string;
    setBuilderName: (name: string) => void;
    societyName: string;
    setSocietyName: (name: string) => void;
    wingId: number | null;
    wingOptions: { label: string; value: string }[];
    handleWingChange: (name: string | undefined, value: string) => void;
    secretaryName: string;
    setSecretaryName: (name: string) => void;
    showError: (
        field: 'managerMobile' | 'secretaryMobile' | 'managerEmail' | 'secretaryEmail' | 'societyEmail' |
            'landOwnerName' | 'builderName' | 'societyName' | 'managerName' | 'secretaryName' | 'societyAddress',
        isValid: boolean
    ) => boolean;
    onFocusField: (field: string) => void;
    onBlurField: () => void;
}

export const SocietyGeneralFields = ({
    societyEmail,
    setSocietyEmail,
    landOwnerName,
    setLandOwnerName,
    builderName,
    setBuilderName,
    societyName,
    setSocietyName,
    wingId,
    wingOptions,
    handleWingChange,
    secretaryName,
    setSecretaryName,
    showError,
    onFocusField,
    onBlurField,
}: SocietyGeneralFieldsProps) => {

    const t = useTranslations('quickDataEntry');

    const preventEnterSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    };

    return (
        <>
            {/* 1. Land Owner */}
            <div className="space-y-1.5">
                <Label htmlFor="land-owner-name" className="text-xs font-semibold text-gray-700">
                    {t('society.landOwner')}
                </Label>
                <Tooltip content={landOwnerName || ''} placement="top">
                    <Input
                        id="land-owner-name"
                        value={landOwnerName || ''}
                        autoFocus
                        placeholder={t('society.landOwnerPlaceholder')}
                        maxLength={SOCIETY_VALIDATION_RULES.PERSON_NAME_MAX_LENGTH}
                        className={`h-9 text-sm border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 ${showError('landOwnerName', !landOwnerName || societyValidators.isValidPersonName(landOwnerName))
                            ? 'border-red-300 focus:border-red-500'
                            : ''
                            }`}
                        onFocus={() => onFocusField('landOwnerName')}
                        onKeyDown={preventEnterSubmit}
                        onBlur={() => {
                            onBlurField();
                            setLandOwnerName(capitalizeEachWordKycSociety(landOwnerName.trim().replace(/\s+/g, ' '), true));
                        }}
                        onChange={(e) => {
                            const val = e.target.value;
                            const start = e.target.selectionStart ?? val.length;
                            const isAtEnd = start >= val.length;
                            const sanitized = sanitizeName(val);
                            const finalVal = isAtEnd ? capitalizeEachWordKycSociety(sanitized, false) : sanitized;
                            if (finalVal.length <= SOCIETY_VALIDATION_RULES.PERSON_NAME_MAX_LENGTH) {
                                setLandOwnerName(finalVal);
                            }
                        }}
                    />
                </Tooltip>
                {showError('landOwnerName', !landOwnerName || societyValidators.isValidPersonName(landOwnerName)) && (
                    <span className="text-xs text-red-500">
                        {landOwnerName && (landOwnerName.trim().length < SOCIETY_VALIDATION_RULES.NAME_MIN_LENGTH || landOwnerName.trim().length > SOCIETY_VALIDATION_RULES.PERSON_NAME_MAX_LENGTH)
                            ? t('society.validation.invalidNameLength')
                            : t('society.validation.invalidName')}
                    </span>
                )}
            </div>

            {/* 2. Builder Name */}
            <div className="space-y-1.5">
                <Label htmlFor="builder-name" className="text-xs font-semibold text-gray-700">
                    {t('society.builderName')}
                </Label>
                <Tooltip content={builderName || ''} placement="top">
                    <Input
                        id="builder-name"
                        value={builderName || ''}
                        placeholder={t('society.builderNamePlaceholder')}
                        maxLength={SOCIETY_VALIDATION_RULES.PERSON_NAME_MAX_LENGTH}
                        className={`h-9 text-sm border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 ${showError('builderName', !builderName || societyValidators.isValidPersonName(builderName))
                            ? 'border-red-300 focus:border-red-500'
                            : ''
                            }`}
                        onFocus={() => onFocusField('builderName')}
                        onKeyDown={preventEnterSubmit}
                        onBlur={() => {
                            onBlurField();
                            setBuilderName(capitalizeEachWordKycSociety(builderName.trim().replace(/\s+/g, ' '), true));
                        }}
                        onChange={(e) => {
                            const val = e.target.value;
                            const start = e.target.selectionStart ?? val.length;
                            const isAtEnd = start >= val.length;
                            const sanitized = sanitizeName(val);
                            const finalVal = isAtEnd ? capitalizeEachWordKycSociety(sanitized, false) : sanitized;
                            if (finalVal.length <= SOCIETY_VALIDATION_RULES.PERSON_NAME_MAX_LENGTH) {
                                setBuilderName(finalVal);
                            }
                        }}
                    />
                </Tooltip>
                {showError('builderName', !builderName || societyValidators.isValidPersonName(builderName)) && (
                    <span className="text-xs text-red-500">
                        {builderName && (builderName.trim().length < SOCIETY_VALIDATION_RULES.NAME_MIN_LENGTH || builderName.trim().length > SOCIETY_VALIDATION_RULES.PERSON_NAME_MAX_LENGTH)
                            ? t('society.validation.invalidNameLength')
                            : t('society.validation.invalidName')}
                    </span>
                )}
            </div>

            {/* 3. Building/Society Name */}
            <div className="space-y-1.5">
                <Label htmlFor="society-name" className="text-xs font-semibold text-gray-700">
                    {t('society.buildingSocietyName')}
                </Label>
                <Tooltip content={societyName || ''} placement="top">
                    <Input
                        id="society-name"
                        value={societyName || ''}
                        placeholder={t('society.buildingSocietyNamePlaceholder')}
                        maxLength={SOCIETY_VALIDATION_RULES.SOCIETY_NAME_MAX_LENGTH}
                        className={`h-9 text-sm border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 ${showError('societyName', !societyName || societyValidators.isValidSocietyName(societyName))
                            ? 'border-red-300 focus:border-red-500'
                            : ''
                            }`}
                        onFocus={() => onFocusField('societyName')}
                        onKeyDown={preventEnterSubmit}
                        onBlur={() => {
                            onBlurField();
                            setSocietyName(capitalizeEachWordKycSociety(societyName.trim().replace(/\s+/g, ' '), true));
                        }}
                        onChange={(e) => {
                            const val = e.target.value;
                            const start = e.target.selectionStart ?? val.length;
                            const isAtEnd = start >= val.length;
                            const sanitized = sanitizeName(val);
                            const finalVal = isAtEnd ? capitalizeEachWordKycSociety(sanitized, false) : sanitized;
                            if (finalVal.length <= SOCIETY_VALIDATION_RULES.SOCIETY_NAME_MAX_LENGTH) {
                                setSocietyName(finalVal);
                            }
                        }}
                    />
                </Tooltip>
                {showError('societyName', !societyName || societyValidators.isValidSocietyName(societyName)) && (
                    <span className="text-xs text-red-500">
                        {societyName && (societyName.trim().length < SOCIETY_VALIDATION_RULES.NAME_MIN_LENGTH || societyName.trim().length > SOCIETY_VALIDATION_RULES.SOCIETY_NAME_MAX_LENGTH)
                            ? t('society.validation.invalidNameLength')
                            : t('society.validation.invalidName')}
                    </span>
                )}
            </div>

            {/* 4. Wing */}
            <div className="space-y-1.5 relative focus-within:z-100">
                <Label htmlFor="society-wing" className="text-xs font-semibold text-gray-900">
                    {t('society.wing')}
                </Label>
                <Tooltip content={wingOptions.find(opt => opt.value === wingId?.toString())?.label || ''} placement="top">
                    <div className="w-full">
                        <SearchSelect
                            id="society-wing"
                            name="wing"
                            options={wingOptions}
                            value={wingId?.toString() ?? ''}
                            placeholder={t('society.select') || 'Select'}
                            onChange={handleWingChange}
                            className="h-9 text-sm border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                        />
                    </div>
                </Tooltip>
            </div>

            {/* 5. Society Email */}
            <div className="space-y-1.5">
                <Label htmlFor="society-email" className="text-xs font-semibold text-gray-700">
                    {t('society.societyEmail')}
                </Label>
                <Tooltip content={societyEmail || ''} placement="top">
                    <Input
                        id="society-email"
                        type="email"
                        placeholder={t('society.societyEmailPlaceholder')}
                        value={societyEmail || ''}
                        maxLength={SOCIETY_VALIDATION_RULES.EMAIL_MAX_LENGTH}
                        className={`h-9 text-sm border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 ${showError('societyEmail', societyValidators.isValidEmail(societyEmail, true))
                            ? 'border-red-300 focus:border-red-500'
                            : ''
                            }`}
                        onFocus={() => onFocusField('societyEmail')}
                        onKeyDown={preventEnterSubmit}
                        onBlur={onBlurField}
                        onChange={(e) => {
                            const value = e.target.value;
                            const sanitized = sanitizeEmailStrict(value);
                            if (sanitized.length <= SOCIETY_VALIDATION_RULES.EMAIL_MAX_LENGTH) {
                                setSocietyEmail(sanitized);
                            }
                        }}
                    />
                </Tooltip>
                {showError('societyEmail', societyValidators.isValidEmail(societyEmail, true)) && (
                    <span className="text-xs text-red-500">{t('society.validation.societyEmail')}</span>
                )}
            </div>

            {/* 6. Secretary Name */}
            <div className="space-y-1.5">
                <Label htmlFor="secretary-name" className="text-xs font-semibold text-gray-700">{t('society.secretaryName')}</Label>
                <Tooltip content={secretaryName || ''} placement="top">
                    <Input
                        id="secretary-name"
                        value={secretaryName || ''}
                        placeholder={t('society.secretaryNamePlaceholder')}
                        maxLength={SOCIETY_VALIDATION_RULES.PERSON_NAME_MAX_LENGTH}
                        className={`h-9 text-sm border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 ${showError('secretaryName', !secretaryName || societyValidators.isValidPersonName(secretaryName))
                            ? 'border-red-300 focus:border-red-500'
                            : ''
                            }`}
                        onFocus={() => onFocusField('secretaryName')}
                        onKeyDown={preventEnterSubmit}
                        onBlur={() => {
                            onBlurField();
                            setSecretaryName(capitalizeEachWordKycSociety(secretaryName.trim().replace(/\s+/g, ' '), true));
                        }}
                        onChange={(e) => {
                            const val = e.target.value;
                            const start = e.target.selectionStart ?? val.length;
                            const isAtEnd = start >= val.length;
                            const sanitized = sanitizeName(val);
                            const finalVal = isAtEnd ? capitalizeEachWordKycSociety(sanitized, false) : sanitized;
                            if (finalVal.length <= SOCIETY_VALIDATION_RULES.PERSON_NAME_MAX_LENGTH) {
                                setSecretaryName(finalVal);
                            }
                        }}
                    />
                </Tooltip>
                {showError('secretaryName', !secretaryName || societyValidators.isValidPersonName(secretaryName)) && (
                    <span className="text-xs text-red-500">
                        {secretaryName && (secretaryName.trim().length < SOCIETY_VALIDATION_RULES.NAME_MIN_LENGTH || secretaryName.trim().length > SOCIETY_VALIDATION_RULES.PERSON_NAME_MAX_LENGTH)
                            ? t('society.validation.invalidNameLength')
                            : t('society.validation.secretaryName')}
                    </span>
                )}
            </div>
        </>
    );
};
