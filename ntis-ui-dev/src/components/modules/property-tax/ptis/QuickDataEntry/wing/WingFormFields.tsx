import React from 'react';
import { Input } from '@/components/common';
import { Tooltip } from '@/components/common/Tooltip';
import { Label } from '@/components/common/label';
import { useDigitInputs } from '@/hooks/useDigitInputs';
import { WingFormField } from '@/hooks/ptis/QuickDataEntry/Wing/useWingForm';
import {
  sanitizeEmailStrict,
  sanitizeName,
  sanitizeWingName,
  capitalizeEachWordKycSociety,
} from '@/lib/utils/input-sanitization';
import {
  societyValidators,
  SOCIETY_VALIDATION_RULES,
} from '@/lib/utils/society-validation/society-validation';
import { kycValidators } from '@/lib/utils/kyc-validation/kyc-validation.constants';

interface WingFormFieldsProps {
  t: (key: string) => string;
  wingName: string;
  setWingName: (val: string) => void;
  managerName: string;
  setManagerName: (val: string) => void;
  managerNameEnglish: string;
  setManagerNameEnglish: (val: string) => void;
  managerMobileCountryCode: string;
  setManagerMobileCountryCode: (val: string) => void;
  managerMobileInput: ReturnType<typeof useDigitInputs>;
  managerEmailId: string;
  setManagerEmailId: (val: string) => void;
  secretaryName: string;
  setSecretaryName: (val: string) => void;
  secretaryNameEnglish: string;
  setSecretaryNameEnglish: (val: string) => void;
  secretaryMobileCountryCode: string;
  setSecretaryMobileCountryCode: (val: string) => void;
  secretaryMobileInput: ReturnType<typeof useDigitInputs>;
  secretaryEmailId: string;
  setSecretaryEmailId: (val: string) => void;
  showError: (field: WingFormField, isValid: boolean) => boolean;
  onFocusField: (field: string) => void;
  onBlurField: () => void;
}

export const WingFormFields: React.FC<WingFormFieldsProps> = ({
  t,
  wingName,
  setWingName,
  managerName,
  setManagerName,
  managerNameEnglish,
  setManagerNameEnglish,
  managerMobileCountryCode,
  setManagerMobileCountryCode,
  managerMobileInput,
  managerEmailId,
  setManagerEmailId,
  secretaryName,
  setSecretaryName,
  secretaryNameEnglish,
  setSecretaryNameEnglish,
  secretaryMobileCountryCode,
  setSecretaryMobileCountryCode,
  secretaryMobileInput,
  secretaryEmailId,
  setSecretaryEmailId,
  showError,
  onFocusField,
  onBlurField,
}) => {
  const preventEnterSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const isWingNameValid = !wingName || wingName.trim().length > 0;
  const isManagerNameValid = !managerName || societyValidators.isValidPersonName(managerName);
  const isManagerNameEnValid = !managerNameEnglish || societyValidators.isValidPersonName(managerNameEnglish);
  const isSecretaryNameValid = !secretaryName || societyValidators.isValidPersonName(secretaryName);
  const isSecretaryNameEnValid = !secretaryNameEnglish || societyValidators.isValidPersonName(secretaryNameEnglish);
  const isManagerEmailValid = !managerEmailId || societyValidators.isValidEmail(managerEmailId, true);
  const isSecretaryEmailValid = !secretaryEmailId || societyValidators.isValidEmail(secretaryEmailId, true);
  const isManagerMobileValid =
    (!managerMobileInput.value || societyValidators.isValidMobile(managerMobileInput.value)) &&
    (managerMobileCountryCode ?? '91').length === 2;
  const isSecretaryMobileValid =
    (!secretaryMobileInput.value || societyValidators.isValidMobile(secretaryMobileInput.value)) &&
    (secretaryMobileCountryCode ?? '91').length === 2;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">

      {/* 2. Wing Name */}
      <div className="space-y-1.5">
        <Label htmlFor="wing-name" className="text-xs font-semibold text-gray-700">
          {t('wing.wingName') || 'Wing Name'} <span className="text-red-500">*</span>
        </Label>
        <Tooltip content={wingName || ''} placement="top">
          <Input
            id="wing-name"
            value={wingName || ''}
            placeholder={t('wing.wingNamePlaceholder') || 'Enter wing name (e.g. A Wing)'}
            maxLength={30}
            className={`h-9 text-sm border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 ${
              showError('wingName', isWingNameValid) ? 'border-red-300 focus:border-red-500' : ''
            }`}
            onFocus={() => onFocusField('wingName')}
            onKeyDown={preventEnterSubmit}
            onBlur={() => {
              onBlurField();
              setWingName(wingName.trim());
            }}
            onChange={(e) => setWingName(sanitizeWingName(e.target.value))}
          />
        </Tooltip>
        {showError('wingName', isWingNameValid) && (
          <span className="text-xs text-red-500">{t('wing.validation.wingNameRequired')}</span>
        )}
      </div>

      {/* 3. Manager Name (Regional) */}
      <div className="space-y-1.5">
        <Label htmlFor="manager-name-regional" className="text-xs font-semibold text-gray-700">
          {t('wing.managerName') || 'Manager Name (Regional)'}
        </Label>
        <Tooltip content={managerName || ''} placement="top">
          <Input
            id="manager-name-regional"
            value={managerName || ''}
            placeholder={t('wing.managerNamePlaceholder') || 'उदा. भूषण'}
            maxLength={SOCIETY_VALIDATION_RULES.PERSON_NAME_MAX_LENGTH}
            className={`h-9 text-sm border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 ${
              showError('managerName', isManagerNameValid) ? 'border-red-300 focus:border-red-500' : ''
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
        {showError('managerName', isManagerNameValid) && (
          <span className="text-xs text-red-500">
            {managerName &&
            (managerName.trim().length < SOCIETY_VALIDATION_RULES.NAME_MIN_LENGTH ||
              managerName.trim().length > SOCIETY_VALIDATION_RULES.PERSON_NAME_MAX_LENGTH)
              ? t('wing.validation.invalidNameLength')
              : t('wing.validation.invalidManagerName')}
          </span>
        )}
      </div>

      {/* 4. Manager Name (English) */}
      <div className="space-y-1.5">
        <Label htmlFor="manager-name-english" className="text-xs font-semibold text-gray-700">
          {t('wing.managerNameEnglish') || 'Manager Name'}
        </Label>
        <Tooltip content={managerNameEnglish || ''} placement="top">
          <Input
            id="manager-name-english"
            value={managerNameEnglish || ''}
            placeholder={t('wing.managerNameEnglishPlaceholder') || 'e.g. Bhushan'}
            maxLength={SOCIETY_VALIDATION_RULES.PERSON_NAME_MAX_LENGTH}
            className={`h-9 text-sm border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 ${
              showError('managerNameEnglish', isManagerNameEnValid) ? 'border-red-300 focus:border-red-500' : ''
            }`}
            onFocus={() => onFocusField('managerNameEnglish')}
            onKeyDown={preventEnterSubmit}
            onBlur={() => {
              onBlurField();
              setManagerNameEnglish(
                capitalizeEachWordKycSociety(managerNameEnglish.trim().replace(/\s+/g, ' '), true)
              );
            }}
            onChange={(e) => {
              const val = e.target.value;
              const start = e.target.selectionStart ?? val.length;
              const isAtEnd = start >= val.length;
              const sanitized = sanitizeName(val);
              const finalVal = isAtEnd ? capitalizeEachWordKycSociety(sanitized, false) : sanitized;
              if (finalVal.length <= SOCIETY_VALIDATION_RULES.PERSON_NAME_MAX_LENGTH) {
                setManagerNameEnglish(finalVal);
              }
            }}
          />
        </Tooltip>
        {showError('managerNameEnglish', isManagerNameEnValid) && (
          <span className="text-xs text-red-500">
            {managerNameEnglish &&
            (managerNameEnglish.trim().length < SOCIETY_VALIDATION_RULES.NAME_MIN_LENGTH ||
              managerNameEnglish.trim().length > SOCIETY_VALIDATION_RULES.PERSON_NAME_MAX_LENGTH)
              ? t('wing.validation.invalidNameLength')
              : t('wing.validation.invalidManagerName')}
          </span>
        )}
      </div>

      {/* 5. Manager Mobile No */}
      <div className="space-y-1.5">
        <Label htmlFor="manager-mobile-0" className="text-xs font-semibold text-gray-700">
          {t('wing.managerMobileNo') || 'Manager Mobile No'}
        </Label>
        <div
          className={`flex items-center gap-1 px-1 bg-white border rounded-md h-9 focus-within:ring-1 ${
            showError('managerMobile', isManagerMobileValid)
              ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-300'
              : 'border-purple-200 focus-within:border-purple-500 focus-within:ring-purple-200'
          }`}
        >
          <div
            className={`flex items-center justify-center px-1 h-7 bg-white border rounded text-xs font-semibold text-gray-900 shrink-0 focus-within:ring-1 ${
              showError('managerMobile', isManagerMobileValid)
                ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-300'
                : 'border-gray-300 focus-within:border-purple-500 focus-within:ring-purple-300'
            }`}
          >
            <span className="pointer-events-none">+</span>
            <Input
              naked
              type="text"
              maxLength={2}
              inputMode="numeric"
              pattern="[0-9]*"
              title="Country Code"
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
                aria-label={`${t('wing.managerMobileNo')} digit ${i + 1} of ${
                  SOCIETY_VALIDATION_RULES.MOBILE_LENGTH
                }`}
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
                error={showError('managerMobile', isManagerMobileValid) ? 'error' : undefined}
                className={`flex-1 min-w-0 w-full h-7 text-center text-xs font-semibold text-gray-900 border rounded bg-white outline-none focus:ring-1 ${
                  showError('managerMobile', isManagerMobileValid)
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-300'
                    : 'border-gray-300 focus:border-purple-500 focus:ring-purple-300'
                } ${managerMobileInput.lastTypedIndex === i ? 'animate-digit-pop' : ''}`}
              />
            ))}
          </div>
        </div>
        {showError('managerMobile', isManagerMobileValid) && (
          <span className="text-xs text-red-500">
            {(managerMobileCountryCode ?? '91').length === 1
              ? t('wing.validation.countryCodeLength')
              : managerMobileInput.value &&
                kycValidators.hasRepeatedSequence(managerMobileInput.value.replace(/\D/g, ''), 5)
              ? t('wing.validation.invalidRepeatedSequence')
              : managerMobileInput.value && !/^[6-9]/.test(managerMobileInput.value.replace(/\D/g, ''))
              ? t('wing.validation.invalidMobileStart')
              : t('wing.validation.invalidManagerMobile')}
          </span>
        )}
      </div>

      {/* 6. Manager Email ID */}
      <div className="space-y-1.5">
        <Label htmlFor="manager-email" className="text-xs font-semibold text-gray-700">
          {t('wing.managerEmailId') || 'Manager Email ID'}
        </Label>
        <Tooltip content={managerEmailId || ''} placement="top">
          <Input
            id="manager-email"
            type="email"
            placeholder={t('wing.managerEmailIdPlaceholder') || 'e.g. manager@example.com'}
            value={managerEmailId || ''}
            maxLength={SOCIETY_VALIDATION_RULES.EMAIL_MAX_LENGTH}
            className={`h-9 text-sm border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 ${
              showError('managerEmail', isManagerEmailValid) ? 'border-red-300 focus:border-red-500' : ''
            }`}
            onFocus={() => onFocusField('managerEmail')}
            onKeyDown={preventEnterSubmit}
            onBlur={onBlurField}
            onChange={(e) => {
              const sanitized = sanitizeEmailStrict(e.target.value);
              if (sanitized.length <= SOCIETY_VALIDATION_RULES.EMAIL_MAX_LENGTH) {
                setManagerEmailId(sanitized);
              }
            }}
          />
        </Tooltip>
        {showError('managerEmail', isManagerEmailValid) && (
          <span className="text-xs text-red-500">{t('wing.validation.invalidManagerEmail')}</span>
        )}
      </div>

      {/* 7. Secretary Name (Regional) */}
      <div className="space-y-1.5">
        <Label htmlFor="secretary-name-regional" className="text-xs font-semibold text-gray-700">
          {t('wing.secretaryName') || 'Secretary Name (Regional)'}
        </Label>
        <Tooltip content={secretaryName || ''} placement="top">
          <Input
            id="secretary-name-regional"
            value={secretaryName || ''}
            placeholder={t('wing.secretaryNamePlaceholder') || 'उदा. अमित'}
            maxLength={SOCIETY_VALIDATION_RULES.PERSON_NAME_MAX_LENGTH}
            className={`h-9 text-sm border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 ${
              showError('secretaryName', isSecretaryNameValid) ? 'border-red-300 focus:border-red-500' : ''
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
        {showError('secretaryName', isSecretaryNameValid) && (
          <span className="text-xs text-red-500">
            {secretaryName &&
            (secretaryName.trim().length < SOCIETY_VALIDATION_RULES.NAME_MIN_LENGTH ||
              secretaryName.trim().length > SOCIETY_VALIDATION_RULES.PERSON_NAME_MAX_LENGTH)
              ? t('wing.validation.invalidNameLength')
              : t('wing.validation.invalidSecretaryName')}
          </span>
        )}
      </div>

      {/* 8. Secretary Name (English) */}
      <div className="space-y-1.5">
        <Label htmlFor="secretary-name-english" className="text-xs font-semibold text-gray-700">
          {t('wing.secretaryNameEnglish') || 'Secretary Name'}
        </Label>
        <Tooltip content={secretaryNameEnglish || ''} placement="top">
          <Input
            id="secretary-name-english"
            value={secretaryNameEnglish || ''}
            placeholder={t('wing.secretaryNameEnglishPlaceholder') || 'e.g. Amit'}
            maxLength={SOCIETY_VALIDATION_RULES.PERSON_NAME_MAX_LENGTH}
            className={`h-9 text-sm border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 ${
              showError('secretaryNameEnglish', isSecretaryNameEnValid) ? 'border-red-300 focus:border-red-500' : ''
            }`}
            onFocus={() => onFocusField('secretaryNameEnglish')}
            onKeyDown={preventEnterSubmit}
            onBlur={() => {
              onBlurField();
              setSecretaryNameEnglish(
                capitalizeEachWordKycSociety(secretaryNameEnglish.trim().replace(/\s+/g, ' '), true)
              );
            }}
            onChange={(e) => {
              const val = e.target.value;
              const start = e.target.selectionStart ?? val.length;
              const isAtEnd = start >= val.length;
              const sanitized = sanitizeName(val);
              const finalVal = isAtEnd ? capitalizeEachWordKycSociety(sanitized, false) : sanitized;
              if (finalVal.length <= SOCIETY_VALIDATION_RULES.PERSON_NAME_MAX_LENGTH) {
                setSecretaryNameEnglish(finalVal);
              }
            }}
          />
        </Tooltip>
        {showError('secretaryNameEnglish', isSecretaryNameEnValid) && (
          <span className="text-xs text-red-500">
            {secretaryNameEnglish &&
            (secretaryNameEnglish.trim().length < SOCIETY_VALIDATION_RULES.NAME_MIN_LENGTH ||
              secretaryNameEnglish.trim().length > SOCIETY_VALIDATION_RULES.PERSON_NAME_MAX_LENGTH)
              ? t('wing.validation.invalidNameLength')
              : t('wing.validation.invalidSecretaryName')}
          </span>
        )}
      </div>

      {/* 9. Secretary Mobile No */}
      <div className="space-y-1.5">
        <Label htmlFor="secretary-mobile-0" className="text-xs font-semibold text-gray-700">
          {t('wing.secretaryMobileNo') || 'Secretary Mobile No'}
        </Label>
        <div
          className={`flex items-center gap-1 px-1 bg-white border rounded-md h-9 focus-within:ring-1 ${
            showError('secretaryMobile', isSecretaryMobileValid)
              ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-300'
              : 'border-purple-200 focus-within:border-purple-500 focus-within:ring-purple-200'
          }`}
        >
          <div
            className={`flex items-center justify-center px-1 h-7 bg-white border rounded text-xs font-semibold text-gray-900 shrink-0 focus-within:ring-1 ${
              showError('secretaryMobile', isSecretaryMobileValid)
                ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-300'
                : 'border-gray-300 focus-within:border-purple-500 focus-within:ring-purple-300'
            }`}
          >
            <span className="pointer-events-none">+</span>
            <Input
              naked
              type="text"
              maxLength={2}
              inputMode="numeric"
              pattern="[0-9]*"
              title="Country Code"
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
                aria-label={`${t('wing.secretaryMobileNo')} digit ${i + 1} of ${
                  SOCIETY_VALIDATION_RULES.MOBILE_LENGTH
                }`}
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
                error={showError('secretaryMobile', isSecretaryMobileValid) ? 'error' : undefined}
                className={`flex-1 min-w-0 w-full h-7 text-center text-xs font-semibold text-gray-900 border rounded bg-white outline-none focus:ring-1 ${
                  showError('secretaryMobile', isSecretaryMobileValid)
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-300'
                    : 'border-gray-300 focus:border-purple-500 focus:ring-purple-300'
                } ${secretaryMobileInput.lastTypedIndex === i ? 'animate-digit-pop' : ''}`}
              />
            ))}
          </div>
        </div>
        {showError('secretaryMobile', isSecretaryMobileValid) && (
          <span className="text-xs text-red-500">
            {(secretaryMobileCountryCode ?? '91').length === 1
              ? t('wing.validation.countryCodeLength')
              : secretaryMobileInput.value &&
                kycValidators.hasRepeatedSequence(secretaryMobileInput.value.replace(/\D/g, ''), 5)
              ? t('wing.validation.invalidRepeatedSequence')
              : secretaryMobileInput.value && !/^[6-9]/.test(secretaryMobileInput.value.replace(/\D/g, ''))
              ? t('wing.validation.invalidMobileStart')
              : t('wing.validation.invalidSecretaryMobile')}
          </span>
        )}
      </div>

      {/* 10. Secretary Email ID */}
      <div className="space-y-1.5">
        <Label htmlFor="secretary-email" className="text-xs font-semibold text-gray-700">
          {t('wing.secretaryEmailId') || 'Secretary Email ID'}
        </Label>
        <Tooltip content={secretaryEmailId || ''} placement="top">
          <Input
            id="secretary-email"
            type="email"
            placeholder={t('wing.secretaryEmailIdPlaceholder') || 'e.g. secretary@example.com'}
            value={secretaryEmailId || ''}
            maxLength={SOCIETY_VALIDATION_RULES.EMAIL_MAX_LENGTH}
            className={`h-9 text-sm border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 ${
              showError('secretaryEmail', isSecretaryEmailValid) ? 'border-red-300 focus:border-red-500' : ''
            }`}
            onFocus={() => onFocusField('secretaryEmail')}
            onKeyDown={preventEnterSubmit}
            onBlur={onBlurField}
            onChange={(e) => {
              const sanitized = sanitizeEmailStrict(e.target.value);
              if (sanitized.length <= SOCIETY_VALIDATION_RULES.EMAIL_MAX_LENGTH) {
                setSecretaryEmailId(sanitized);
              }
            }}
          />
        </Tooltip>
        {showError('secretaryEmail', isSecretaryEmailValid) && (
          <span className="text-xs text-red-500">{t('wing.validation.invalidSecretaryEmail')}</span>
        )}
      </div>
    </div>
  );
};
