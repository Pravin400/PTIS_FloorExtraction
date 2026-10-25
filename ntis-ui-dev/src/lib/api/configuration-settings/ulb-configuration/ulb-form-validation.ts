import { commonValidations } from '@/lib/utils/validation';
import { validateForm, type Validator } from '@/lib/utils/validation-helpers';
import { CODE_SANITIZE, DESCRIPTION_REGEX, DESCRIPTION_SANITIZE, PERSON_NAME_REGEX, PERSON_NAME_SANITIZE } from '@/lib/utils/validation-rules';
import { isValidWebsiteUrl } from './ulb-master.formatters';
import * as CONST from './ulb-form-validation.constants';
import type {
  ULBConfigurationFormData,
  UlbSectionKey,
} from '@/types/ulbconfig-master.types';

export type UlbConfigurationFieldErrors = Partial<
  Record<keyof ULBConfigurationFormData, string>
>;

type TranslateFn = (key: string, values?: Record<string, string | number | Date>) => string;

function chainValidators(...validators: Validator[]): Validator {
  return (value: unknown) => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) return error;
    }
    return undefined;
  };
}

function requiredField(t: TranslateFn, messageKey: string): Validator {
  return (value: unknown) => {
    if (!String(value ?? '').trim()) return t(messageKey);
    return undefined;
  };
}

function isGibberish(val: string): boolean {
  const lower = val.toLowerCase();
  const keyboardPatterns = ['qwerty', 'asdfgh', 'zxcvbn'];
  const hasKeyboard = keyboardPatterns.some((pat) => lower.includes(pat));
  const hasRepeatedChar = /([a-z0-9])\1{3,}/i.test(lower);
  const hasRepeatedSeq =
    /([a-z0-9]{2})\1{2,}/i.test(lower) || /([a-z0-9]{3,})\1+/i.test(lower);

  const words = lower.split(/[^a-z\u0900-\u097F]+/);
  let hasGibberishWord = false;
  for (const word of words) {
    if (word.length >= 4 && /^[a-z]+$/.test(word) && !/[aeiouy]/.test(word)) {
      hasGibberishWord = true;
      break;
    }
    if (/[bcdfghjklmnpqrstvwxz]{6,}/.test(word)) {
      hasGibberishWord = true;
      break;
    }
  }

  return hasKeyboard || hasRepeatedChar || hasRepeatedSeq || hasGibberishWord;
}

function pincodeValidator(tUlb: TranslateFn, requiredKey?: string): Validator {
  return (value: unknown) => {
    const strVal = String(value ?? '').trim();
    if (!strVal) return requiredKey ? tUlb(requiredKey) : undefined;
    if (strVal.length !== 6 || !/^[1-9][0-9]{5}$/.test(strVal)) {
      return tUlb('validation.pincodeFormat');
    }
    return undefined;
  };
}

function phoneValidator(tUlb: TranslateFn, formatKey: string, requiredKey?: string): Validator {
  return (value: unknown) => {
    const strVal = String(value ?? '').trim();
    if (!strVal) return requiredKey ? tUlb(requiredKey) : undefined;
    if (strVal.length !== 10 || !/^[6-9]\d{9}$/.test(strVal)) {
      return tUlb(formatKey);
    }
    return undefined;
  };
}

function emailValidator(tCommon: TranslateFn, tUlb: TranslateFn, formatKey: string, requiredKey?: string): Validator {
  return (value: unknown) => {
    const strVal = String(value ?? '').trim();
    if (!strVal) return requiredKey ? tUlb(requiredKey) : undefined;
    if (strVal.length > CONST.EMAIL_MAX) {
      return tCommon('form.validation.descriptionMaxLength', { count: CONST.EMAIL_MAX });
    }
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(strVal)) {
      return tUlb(formatKey);
    }
    return undefined;
  };
}

function addressValidator(tCommon: TranslateFn, tUlb: TranslateFn): Validator {
  return (value: unknown) => {
    const strVal = String(value ?? '').trim();
    if (!strVal) return tUlb('validation.addressRequired');
    if (strVal.length > CONST.ADDRESS_MAX) {
      return tCommon('form.validation.descriptionMaxLength', { count: CONST.ADDRESS_MAX });
    }
    if (strVal.length < 5) {
      return tUlb('validation.addressFormat');
    }
    if (/\s{2,}/.test(strVal)) {
      return tUlb('validation.addressFormat');
    }
    if (!DESCRIPTION_REGEX.test(strVal)) {
      return tUlb('validation.addressFormat');
    }
    if (isGibberish(strVal)) {
      return tUlb('validation.gibberishError');
    }
    return undefined;
  };
}

function websiteValidator(t: TranslateFn, formatKey: string): Validator {
  return (value: unknown) => {
    const strVal = String(value ?? '').trim();
    if (!strVal) return undefined;
    if (!isValidWebsiteUrl(strVal)) return t(formatKey);
    return undefined;
  };
}

function getTextMaxLength(field: keyof ULBConfigurationFormData): number {
  switch (field) {
    case 'ulbName':
      return CONST.ULB_NAME_MAX;
    case 'ulbCode':
      return CONST.ULB_CODE_MAX;
    case 'contactPerson':
      return CONST.CONTACT_PERSON_MAX;
    case 'designation':
      return CONST.DESIGNATION_MAX;
    case 'address':
      return CONST.ADDRESS_MAX;
    case 'implementationPartner':
      return CONST.IMPLEMENTATION_PARTNER_MAX;
    case 'projectManager':
      return CONST.PROJECT_MANAGER_MAX;
    case 'email':
    case 'projectManagerEmail':
      return CONST.EMAIL_MAX;
    case 'website':
      return CONST.WEBSITE_MAX;
    default:
      return 255;
  }
}

/** Sanitizes ULB text field input while typing. */
export function sanitizeUlbFieldValue(
  field: keyof ULBConfigurationFormData,
  value: string
): string {
  switch (field) {
    case 'ulbCode':
      return value.replace(CODE_SANITIZE, '').slice(0, CONST.ULB_CODE_MAX);
    case 'ulbName':
    case 'designation':
    case 'address':
    case 'implementationPartner':
      return value.replace(DESCRIPTION_SANITIZE, '').slice(0, getTextMaxLength(field));
    case 'contactPerson':
    case 'projectManager':
      return value.replace(PERSON_NAME_SANITIZE, '').slice(0, getTextMaxLength(field));
    case 'pincode':
      return value.replace(/\D/g, '').slice(0, CONST.PINCODE_LENGTH);
    case 'phone':
    case 'alternatePhone':
    case 'projectManagerPhone':
      return value.replace(/\D/g, '').slice(0, CONST.PHONE_LENGTH);
    case 'email':
    case 'projectManagerEmail':
      return value.slice(0, CONST.EMAIL_MAX);
    case 'website':
      return value.slice(0, CONST.WEBSITE_MAX);
    default:
      return value;
  }
}

function optionalDescription(t: TranslateFn, maxLength: number): Validator {
  return (value: unknown) => {
    const strVal = String(value ?? '').trim();
    if (!strVal) return undefined;
    if (strVal.length > maxLength) return t('form.validation.descriptionMaxLength', { count: maxLength });
    if (!DESCRIPTION_REGEX.test(strVal)) return t('form.validation.descriptionFormat');
    return undefined;
  };
}

function createUlbInfoSchema(tCommon: TranslateFn, tUlb: TranslateFn): Record<string, Validator> {
  return {
    ulbName: chainValidators(
      requiredField(tUlb, 'validation.ulbNameRequired'),
      (value: unknown) => {
        const strVal = String(value ?? '').trim();
        if (strVal.length > CONST.ULB_NAME_MAX) {
          return tCommon('form.validation.descriptionMaxLength', { count: CONST.ULB_NAME_MAX });
        }
        if (!DESCRIPTION_REGEX.test(strVal)) {
          return tCommon('form.validation.descriptionFormat');
        }
        if (isGibberish(strVal)) {
          return tUlb('validation.gibberishError');
        }
        return undefined;
      }
    ),
    ulbCode: chainValidators(
      requiredField(tUlb, 'validation.ulbCodeRequired'),
      commonValidations.masterCode(tCommon, CONST.ULB_CODE_MAX)
    ),
    ulbType: requiredField(tUlb, 'validation.ulbTypeRequired'),
    state: requiredField(tUlb, 'validation.stateRequired'),
    district: requiredField(tUlb, 'validation.districtRequired'),
    pincode: pincodeValidator(tUlb, 'validation.pincodeRequired'),
    contactPerson: chainValidators(
      requiredField(tUlb, 'validation.contactPersonRequired'),
      (value: unknown) => {
        const strVal = String(value ?? '').trim();
        if (strVal.length > CONST.CONTACT_PERSON_MAX) {
          return tCommon('form.validation.nameMaxLength', { count: CONST.CONTACT_PERSON_MAX });
        }
        if (!PERSON_NAME_REGEX.test(strVal)) {
          return tUlb('validation.contactPersonFormat');
        }
        if (isGibberish(strVal)) {
          return tUlb('validation.gibberishError');
        }
        return undefined;
      }
    ),
    designation: chainValidators(
      requiredField(tUlb, 'validation.designationRequired'),
      commonValidations.masterDescription(tCommon, CONST.DESIGNATION_MAX),
      (value: unknown) => {
        const strVal = String(value ?? '').trim();
        if (isGibberish(strVal)) {
          return tUlb('validation.gibberishError');
        }
        return undefined;
      }
    ),
    address: addressValidator(tCommon, tUlb),
    email: emailValidator(tCommon, tUlb, 'validation.emailFormat', 'validation.emailRequired'),
    phone: phoneValidator(tUlb, 'validation.phoneFormat', 'validation.phoneRequired'),
    alternatePhone: phoneValidator(tUlb, 'validation.alternatePhoneFormat'),
    website: websiteValidator(tUlb, 'validation.websiteFormat'),
  };
}

function createProjectLicenseSchema(
  tCommon: TranslateFn,
  tUlb: TranslateFn
): Record<string, Validator> {
  return {
    projectStartDate: requiredField(tUlb, 'validation.projectStartDateRequired'),
    financialYearStart: requiredField(tUlb, 'validation.financialYearStartRequired'),
    projectManager: chainValidators(
      requiredField(tUlb, 'validation.projectManagerRequired'),
      (value: unknown) => {
        const strVal = String(value ?? '').trim();
        if (strVal.length > CONST.PROJECT_MANAGER_MAX) {
          return tCommon('form.validation.nameMaxLength', { count: CONST.PROJECT_MANAGER_MAX });
        }
        if (!PERSON_NAME_REGEX.test(strVal)) {
          return tUlb('validation.projectManagerFormat');
        }
        if (isGibberish(strVal)) {
          return tUlb('validation.gibberishError');
        }
        return undefined;
      }
    ),
    projectManagerEmail: emailValidator(tCommon, tUlb, 'validation.pmEmailFormat', 'validation.projectManagerEmailRequired'),
    projectManagerPhone: phoneValidator(tUlb, 'validation.pmPhoneFormat'),
    implementationPartner: optionalDescription(tCommon, CONST.IMPLEMENTATION_PARTNER_MAX),
    licenseType: requiredField(tUlb, 'validation.licenseTypeRequired'),
    licenseKey: requiredField(tUlb, 'validation.licenseKeyRequired'),
    licenseStartDate: requiredField(tUlb, 'validation.licenseStartDateRequired'),
    licenseDuration: requiredField(tUlb, 'validation.licenseDurationRequired'),
    supportType: requiredField(tUlb, 'validation.supportTypeRequired'),
  };
}

const SECTION_SCHEMA_BUILDERS: Record<
  UlbSectionKey,
  ((tCommon: TranslateFn, tUlb: TranslateFn) => Record<string, Validator>) | null
> = {
  'ulb-info': createUlbInfoSchema,
  'logo-images': null,
  'project-license-info': createProjectLicenseSchema,
};

/** Validates ULB configuration text/select fields for a section using common validators. */
export function validateUlbConfigurationFields(
  data: ULBConfigurationFormData,
  section: UlbSectionKey,
  tCommon: TranslateFn,
  tUlb: TranslateFn
): UlbConfigurationFieldErrors {
  const buildSchema = SECTION_SCHEMA_BUILDERS[section];
  if (!buildSchema) return {};

  const schema = buildSchema(tCommon, tUlb);
  const errors = validateForm(data, schema) as UlbConfigurationFieldErrors;

  if (section === 'ulb-info') {
    const phone = String(data.phone ?? '').trim();
    const alternatePhone = String(data.alternatePhone ?? '').trim();
    if (phone && alternatePhone && phone === alternatePhone) {
      errors.alternatePhone = tUlb('validation.alternatePhoneSame');
    }
  }

  return errors;
}

/** Returns the first validation error message for a section, if any. */
export function getFirstUlbFieldError(
  errors: UlbConfigurationFieldErrors,
  section: UlbSectionKey
): string | null {
  const buildSchema = SECTION_SCHEMA_BUILDERS[section];
  if (!buildSchema) return null;

  const fieldOrder = Object.keys(buildSchema(() => '', () => ''));
  for (const field of fieldOrder) {
    const message = errors[field as keyof ULBConfigurationFormData];
    if (message) return message;
  }

  return null;
}
