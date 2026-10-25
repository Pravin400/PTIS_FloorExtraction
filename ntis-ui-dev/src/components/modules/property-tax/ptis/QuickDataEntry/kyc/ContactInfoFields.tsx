import React from 'react';
import { Input } from '@/components/common';
import { Label } from '@/components/common/label';
import { Tooltip } from '@/components/common/Tooltip';
import { KYC_VALIDATION_RULES, kycValidators } from '@/lib/utils/kyc-validation/kyc-validation.constants';
import { KycFormData } from '@/types/property-kyc.types';
import { useDigitInputs } from '@/hooks/useDigitInputs';

interface ContactInfoFieldsProps {
  t: (key: string) => string;
  formData: KycFormData;
  setFormData: React.Dispatch<React.SetStateAction<KycFormData>>;
  mobileInput: ReturnType<typeof useDigitInputs>;
  alternateMobileInput?: ReturnType<typeof useDigitInputs>;
  aadharInput: ReturnType<typeof useDigitInputs>;
  showError: (field: keyof KycFormData | 'mobile' | 'alternateMobile' | 'aadhar', isValid: boolean) => boolean;
}

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="currentColor"
    className={props.className}
    {...props}
  >
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.734-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.858.002-2.634-1.023-5.11-2.885-6.974C16.526 1.809 14.058.782 11.43.782c-5.449 0-9.883 4.432-9.887 9.876-.001 1.724.453 3.41 1.32 4.933l-.993 3.626 3.71-.973zm11.514-7.051c-.301-.15-1.78-.879-2.056-.979-.275-.1-.475-.15-.675.15-.199.3-.775.979-.95 1.178-.175.2-.35.225-.651.075-.3-.15-1.268-.467-2.414-1.49-.893-.797-1.496-1.782-1.672-2.08-.175-.3-.018-.462.13-.61.135-.133.301-.35.452-.524.15-.175.2-.3.301-.5.1-.2.05-.375-.025-.525-.075-.15-.675-1.625-.925-2.225-.244-.589-.493-.51-.675-.52-.172-.009-.371-.01-.57-.01-.2 0-.525.075-.799.375-.275.3-1.05 1.025-1.05 2.5s1.025 2.9 1.175 3.1c.15.2 2.021 3.082 4.896 4.321.684.294 1.219.469 1.636.601.688.219 1.314.188 1.809.115.551-.081 1.78-.727 2.03-1.43.25-.701.25-1.3.175-1.43-.075-.125-.275-.2-.575-.35z" />
  </svg>
);

export const ContactInfoFields: React.FC<ContactInfoFieldsProps> = ({
  t,
  formData: _formData,
  setFormData: _setFormData,
  mobileInput,
  alternateMobileInput,
  aadharInput,
  showError,
}) => {
  return (
    <>
      {/* Aadhar Card No */}
      <div className="space-y-1.5">
        <Label htmlFor="kyc-aadhar-0" className="text-xs font-semibold text-gray-700">
          {t('kyc.aadharCardNo')}
        </Label>
        <Tooltip content={aadharInput.value || ''} placement="top">
          <div className={`flex items-center gap-1.5 p-1 bg-white border rounded-md h-9 focus-within:ring-1 ${showError('aadhar', kycValidators.isValidAadhar(aadharInput.value))
            ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-300'
            : 'border-gray-300 focus-within:border-blue-500 focus-within:ring-blue-300'
            }`}>
            {[0, 1, 2].map((groupIndex) => (
              <React.Fragment key={`group-fg-${groupIndex}`}>
                <div className="flex gap-0.5 flex-1 h-full items-center">
                  {Array.from({ length: 4 }).map((_, i) => {
                    const index = groupIndex * 4 + i;
                    return (
                      <Input
                        key={index}
                        id={index === 0 ? 'kyc-aadhar-0' : undefined}
                        aria-label={`${t('kyc.aadharCardNo')} digit ${index + 1} of 12`}
                        type="text"
                        maxLength={1}
                        inputMode="numeric"
                        pattern="[0-9]"
                        value={aadharInput.digits[index]}
                        onChange={(e) => aadharInput.handleChange(index, e.target.value)}
                        onKeyDown={(e) => {
                          aadharInput.handleKeyDown(index, e);
                          if (e.key === 'Enter') {
                            e.preventDefault();
                          }
                        }}
                        onFocus={aadharInput.handleFocus}
                        onBlur={aadharInput.handleBlur}
                        ref={aadharInput.setRef(index)}
                        naked
                        error={showError('aadhar', kycValidators.isValidAadhar(aadharInput.value)) ? 'error' : undefined}
                        className={`flex-1 min-w-0 w-full h-7 text-center text-xs font-semibold text-gray-900 border rounded bg-white outline-none focus:ring-1 ${showError('aadhar', kycValidators.isValidAadhar(aadharInput.value))
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-300'
                          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-300'
                          } ${aadharInput.lastTypedIndex === index ? 'animate-digit-pop' : ''}`}
                      />
                    );
                  })}
                </div>
                {groupIndex < 2 && <span className="text-gray-400 font-bold text-xs shrink-0">-</span>}
              </React.Fragment>
            ))}
          </div>
        </Tooltip>
        {showError('aadhar', kycValidators.isValidAadhar(aadharInput.value)) && (
          <span className="text-xs text-red-500">
            {aadharInput.value && kycValidators.hasRepeatedSequence(aadharInput.value.replace(/\D/g, ''), 5)
              ? t('kyc.validation.invalidRepeatedSequence')
              : (aadharInput.value && (aadharInput.value.replace(/\D/g, '').startsWith('0') || aadharInput.value.replace(/\D/g, '').startsWith('1')))
                ? t('kyc.validation.invalidAadharStart')
                : t('kyc.validation.invalidAadhar')}
          </span>
        )}
      </div>

      {/* Mobile No */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Label htmlFor="kyc-mobile-0" className="text-xs font-semibold text-gray-700">
            {t('kyc.mobileNo')}
          </Label>
          <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366] fill-[#25D366] shrink-0" />
        </div>
        <Tooltip content={mobileInput.value || ''} placement="top">
          <div className={`flex items-center gap-1 px-1 bg-white border rounded-md h-9 focus-within:ring-1 ${showError('mobile', kycValidators.isValidMobile(mobileInput.value))
            ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-300'
            : 'border-gray-300 focus-within:border-blue-500 focus-within:ring-blue-300'
            }`}>
            <div className={`flex items-center justify-center px-1 h-7 bg-white border rounded text-xs font-semibold text-gray-900 shrink-0 
              ${showError('mobile',kycValidators.isValidMobile(mobileInput.value) && (_formData.mobileCountryCode ?? '91').length !== 1) ? 'border-red-300' : 'border-gray-300'}`}>
              <span className="pointer-events-none">+</span>
              <Input
                naked
                type="text"
                maxLength={2}
                inputMode="numeric"
                pattern="[0-9]*"
                title={t('kyc.countryCode')}
                className="w-[16px] bg-transparent outline-none p-0 m-0 leading-none text-center"
                value={_formData.mobileCountryCode ?? '91'}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  _setFormData(prev => ({ ...prev, mobileCountryCode: val }));
                }}
              />
            </div>
            <div className="flex gap-0.5 flex-1 h-full items-center">
              {Array.from({ length: KYC_VALIDATION_RULES.MOBILE_LENGTH }).map((_, i) => (
                <Input
                  key={i}
                  id={i === 0 ? 'kyc-mobile-0' : undefined}
                  aria-label={`${t('kyc.mobileNo')} digit ${i + 1} of 10`}
                  type="text"
                  maxLength={1}
                  inputMode="numeric"
                  pattern="[0-9]"
                  value={mobileInput.digits[i]}
                  onChange={(e) => mobileInput.handleChange(i, e.target.value)}
                  onKeyDown={(e) => {
                    mobileInput.handleKeyDown(i, e);
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  onFocus={mobileInput.handleFocus}
                  onBlur={mobileInput.handleBlur}
                  ref={mobileInput.setRef(i)}
                  naked
                  error={showError('mobile', kycValidators.isValidMobile(mobileInput.value) && (_formData.mobileCountryCode ?? '91').length !== 1) ? 'error' : undefined}
                  className={`flex-1 min-w-0 w-full h-7 text-center text-xs font-semibold text-gray-900 border rounded bg-white outline-none focus:ring-1 ${showError('mobile', kycValidators.isValidMobile(mobileInput.value) && (_formData.mobileCountryCode ?? '91').length !== 1)
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-300 focus:border-blue-500'
                    } ${mobileInput.lastTypedIndex === i ? 'animate-digit-pop' : ''}`}
                />
              ))}
            </div>
          </div>
        </Tooltip>
        {showError('mobile', kycValidators.isValidMobile(mobileInput.value) && (_formData.mobileCountryCode ?? '91').length !== 1) && (
          <span className="text-xs text-red-500">
            {(_formData.mobileCountryCode ?? '91').length === 1
              ? t('kyc.validation.countryCodeLength')
              : mobileInput.value && kycValidators.hasRepeatedSequence(mobileInput.value.replace(/\D/g, ''), 5)
              ? t('kyc.validation.invalidRepeatedSequence')
              : (mobileInput.value && !/^[6-9]/.test(mobileInput.value.replace(/\D/g, '')))
                ? t('kyc.validation.invalidMobileStart')
                : t('kyc.validation.invalidMobile')}
          </span>
        )}
      </div>

      {/* Alternate Mobile No */}
      {alternateMobileInput && (
        <div className="space-y-1.5">
          <Label htmlFor="kyc-alternate-mobile-0" className="text-xs font-semibold text-gray-700">
            {t('kyc.alternateMobileNo')}
          </Label>
          <Tooltip content={alternateMobileInput.value || ''} placement="top">
            <div className={`flex items-center gap-1 px-1 bg-white border rounded-md h-9 focus-within:ring-1 ${showError('alternateMobile', kycValidators.isValidMobile(alternateMobileInput.value))
              ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-300'
              : 'border-gray-300 focus-within:border-blue-500 focus-within:ring-blue-300'
              }`}>
              <div className={`flex items-center justify-center px-1 h-7 bg-white border rounded text-xs font-semibold text-gray-900 shrink-0 ${showError('alternateMobile', kycValidators.isValidMobile(alternateMobileInput.value) && (_formData.alternateMobileCountryCode ?? '91').length !== 1) ? 'border-red-300' : 'border-gray-300'}`}>
                <span className="pointer-events-none">+</span>
                <Input
                  naked
                  type="text"
                  maxLength={2}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  title={t('kyc.countryCode')}
                  className="w-[16px] bg-transparent outline-none p-0 m-0 leading-none text-center"
                  value={_formData.alternateMobileCountryCode ?? '91'}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    _setFormData(prev => ({ ...prev, alternateMobileCountryCode: val }));
                  }}
                />
              </div>
              <div className="flex gap-0.5 flex-1 h-full items-center">
                {Array.from({ length: KYC_VALIDATION_RULES.MOBILE_LENGTH }).map((_, i) => (
                  <Input
                    key={i}
                    id={i === 0 ? 'kyc-alternate-mobile-0' : undefined}
                    aria-label={`${t('kyc.alternateMobileNo')} digit ${i + 1} of 10`}
                    type="text"
                    maxLength={1}
                    inputMode="numeric"
                    pattern="[0-9]"
                    value={alternateMobileInput.digits[i]}
                    onChange={(e) => alternateMobileInput.handleChange(i, e.target.value)}
                    onKeyDown={(e) => {
                      alternateMobileInput.handleKeyDown(i, e);
                      if (e.key === 'Enter') {
                        e.preventDefault();
                      }
                    }}
                    onFocus={alternateMobileInput.handleFocus}
                    onBlur={alternateMobileInput.handleBlur}
                    ref={alternateMobileInput.setRef(i)}
                    naked
                    error={showError('alternateMobile', kycValidators.isValidMobile(alternateMobileInput.value) && (_formData.alternateMobileCountryCode ?? '91').length !== 1) ? 'error' : undefined}
                    className={`flex-1 min-w-0 w-full h-7 text-center text-xs font-semibold text-gray-900 border rounded bg-white outline-none focus:ring-1 ${showError('alternateMobile', kycValidators.isValidMobile(alternateMobileInput.value) && (_formData.alternateMobileCountryCode ?? '91').length !== 1)
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-300 focus:border-blue-500'
                      } ${alternateMobileInput.lastTypedIndex === i ? 'animate-digit-pop' : ''}`}
                  />
                ))}
              </div>
            </div>
          </Tooltip>
          {showError('alternateMobile', kycValidators.isValidMobile(alternateMobileInput.value) && (_formData.alternateMobileCountryCode ?? '91').length !== 1) && (
            <span className="text-xs text-red-500">
              {(_formData.alternateMobileCountryCode ?? '91').length === 1
                ? t('kyc.validation.countryCodeLength')
                : alternateMobileInput.value && kycValidators.hasRepeatedSequence(alternateMobileInput.value.replace(/\D/g, ''), 5)
                ? t('kyc.validation.invalidRepeatedSequence')
                : (alternateMobileInput.value && !/^[6-9]/.test(alternateMobileInput.value.replace(/\D/g, '')))
                  ? t('kyc.validation.invalidMobileStart')
                  : t('kyc.validation.invalidMobile')}
            </span>
          )}
        </div>
      )}
    </>
  );
};

