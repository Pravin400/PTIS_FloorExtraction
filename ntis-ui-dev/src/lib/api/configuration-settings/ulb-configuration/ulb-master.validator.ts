import type {
  ULBConfigurationFormData,
  UlbSectionKey,
} from '@/types/ulbconfig-master.types';
import {
  isValidEmail,
  isValidIndianPhone,
  isValidPincode,
  isValidWebsiteUrl,
  normalizeWebsiteUrl,
} from './ulb-master.formatters';

export type UlbConfigurationValidationCode =
  | 'ulbNameRequired'
  | 'ulbCodeRequired'
  | 'ulbTypeRequired'
  | 'stateRequired'
  | 'districtRequired'
  | 'pincodeRequired'
  | 'contactPersonRequired'
  | 'designationRequired'
  | 'addressRequired'
  | 'emailRequired'
  | 'phoneRequired'
  | 'ulbLogoRequired'
  | 'projectStartDateRequired'
  | 'financialYearStartRequired'
  | 'projectManagerRequired'
  | 'projectManagerEmailRequired'
  | 'licenseTypeRequired'
  | 'licenseKeyRequired'
  | 'licenseStartDateRequired'
  | 'licenseDurationRequired'
  | 'supportTypeRequired'
  | 'websiteFormat'
  | 'emailFormat'
  | 'phoneFormat'
  | 'alternatePhoneFormat'
  | 'pincodeFormat'
  | 'pmEmailFormat'
  | 'pmPhoneFormat';

const SECTION_REQUIRED: Record<UlbSectionKey, (keyof ULBConfigurationFormData)[]> = {
  'ulb-info': [
    'ulbName',
    'ulbCode',
    'ulbType',
    'state',
    'district',
    'pincode',
    'contactPerson',
    'designation',
    'address',
    'email',
    'phone',
  ],
  'logo-images': ['ulbLogo'],
  'project-license-info': [
    'projectStartDate',
    'financialYearStart',
    'projectManager',
    'projectManagerEmail',
    'licenseType',
    'licenseKey',
    'licenseStartDate',
    'licenseDuration',
    'supportType',
  ],
};

const FIELD_TO_CODE: Partial<Record<keyof ULBConfigurationFormData, UlbConfigurationValidationCode>> = {
  ulbName: 'ulbNameRequired',
  ulbCode: 'ulbCodeRequired',
  ulbType: 'ulbTypeRequired',
  state: 'stateRequired',
  district: 'districtRequired',
  pincode: 'pincodeRequired',
  contactPerson: 'contactPersonRequired',
  designation: 'designationRequired',
  address: 'addressRequired',
  email: 'emailRequired',
  phone: 'phoneRequired',
  ulbLogo: 'ulbLogoRequired',
  projectStartDate: 'projectStartDateRequired',
  financialYearStart: 'financialYearStartRequired',
  projectManager: 'projectManagerRequired',
  projectManagerEmail: 'projectManagerEmailRequired',
  licenseType: 'licenseTypeRequired',
  licenseKey: 'licenseKeyRequired',
  licenseStartDate: 'licenseStartDateRequired',
  licenseDuration: 'licenseDurationRequired',
  supportType: 'supportTypeRequired',
};

function isFieldFilled(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return Boolean(value);
}

function resolveFieldValidationCode(
  field: keyof ULBConfigurationFormData
): UlbConfigurationValidationCode {
  const code = FIELD_TO_CODE[field];
  if (!code) {
    throw new Error(`Missing validation code mapping for ULB field: ${String(field)}`);
  }
  return code;
}

/** Validates required fields for a single ULB configuration section. */
export function validateUlbConfigurationSection(
  data: ULBConfigurationFormData,
  section: UlbSectionKey
): UlbConfigurationValidationCode | null {
  for (const field of SECTION_REQUIRED[section]) {
    if (!isFieldFilled(data[field])) {
      return resolveFieldValidationCode(field);
    }
  }
  return null;
}

/** Returns the first validation error code for a section (required fields, then formats). */
export function getUlbConfigurationValidationError(
  data: ULBConfigurationFormData,
  section: UlbSectionKey
): UlbConfigurationValidationCode | null {
  const requiredError = validateUlbConfigurationSection(data, section);
  if (requiredError) return requiredError;
  return validateUlbConfigurationFormats(data, section);
}

function validateUlbInfoFormats(data: ULBConfigurationFormData): UlbConfigurationValidationCode | null {
  if (!isValidWebsiteUrl(data.website)) return 'websiteFormat';
  if (!isValidEmail(data.email)) return 'emailFormat';
  if (!isValidIndianPhone(data.phone)) return 'phoneFormat';
  if (!isValidIndianPhone(data.alternatePhone)) return 'alternatePhoneFormat';
  if (!isValidPincode(data.pincode)) return 'pincodeFormat';
  return null;
}

function validateProjectLicenseFormats(
  data: ULBConfigurationFormData
): UlbConfigurationValidationCode | null {
  if (!isValidEmail(data.projectManagerEmail)) return 'pmEmailFormat';
  if (!isValidIndianPhone(data.projectManagerPhone)) return 'pmPhoneFormat';
  return null;
}

/** Validates field formats for optional/required contact and project fields. */
export function validateUlbConfigurationFormats(
  data: ULBConfigurationFormData,
  section?: UlbSectionKey
): UlbConfigurationValidationCode | null {
  if (!section || section === 'ulb-info') {
    const ulbInfoError = validateUlbInfoFormats(data);
    if (ulbInfoError) return ulbInfoError;
  }

  if (!section || section === 'project-license-info') {
    const projectError = validateProjectLicenseFormats(data);
    if (projectError) return projectError;
  }

  return null;
}

/** Validates all sections required before finalizing ULB configuration. */
export function validateUlbConfigurationForm(
  data: ULBConfigurationFormData
): UlbConfigurationValidationCode | null {
  const sections: UlbSectionKey[] = ['ulb-info', 'project-license-info'];

  for (const section of sections) {
    const code = getUlbConfigurationValidationError(data, section);
    if (code) return code;
  }

  return null;
}

/** Trims string fields before API submission. */
export function normalizeUlbFormData(data: ULBConfigurationFormData): ULBConfigurationFormData {
  return {
    ...data,
    ulbName: data.ulbName.trim(),
    ulbCode: data.ulbCode.trim(),
    ulbType: data.ulbType.trim(),
    state: data.state.trim(),
    district: data.district.trim(),
    address: data.address.trim(),
    pincode: data.pincode.trim(),
    contactPerson: data.contactPerson.trim(),
    designation: data.designation.trim(),
    email: data.email.trim(),
    phone: data.phone.trim(),
    alternatePhone: data.alternatePhone.trim(),
    website: data.website.trim() ? normalizeWebsiteUrl(data.website) : '',
    implementationPartner: data.implementationPartner.trim(),
    projectManager: data.projectManager.trim(),
    projectManagerEmail: data.projectManagerEmail.trim(),
    projectManagerPhone: data.projectManagerPhone.trim(),
    licenseType: data.licenseType.trim(),
    licenseKey: data.licenseKey.trim(),
    licenseDuration: data.licenseDuration.trim(),
    supportType: data.supportType.trim(),
    maxUsers: data.maxUsers.trim(),
    maxDepartments: data.maxDepartments.trim(),
  };
}
