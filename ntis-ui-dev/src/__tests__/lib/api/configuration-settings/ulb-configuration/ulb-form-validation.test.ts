import { describe, it, expect, vi } from 'vitest';
import {
  sanitizeUlbFieldValue,
  validateUlbConfigurationFields,
} from '@/lib/api/configuration-settings/ulb-configuration/ulb-form-validation';
import type { ULBConfigurationFormData } from '@/types/ulbconfig-master.types';

const baseForm: ULBConfigurationFormData = {
  ulbName: 'Thane Municipal Corporation',
  ulbCode: 'TH001',
  ulbType: 'Municipal Corporation',
  state: 'Maharashtra',
  district: 'Thane',
  address: 'Main Road, Thane West',
  pincode: '400601',
  contactPerson: 'Admin User',
  designation: 'Commissioner',
  email: 'admin@ulb.gov.in',
  phone: '9876543210',
  alternatePhone: '',
  website: 'https://www.thane.gov.in',
  ulbLogo: null,
  ulbNameFont: 'Inter',
  ulbNameColor: '#1e40af',
  ulbNameSize: '24',
  ulbNameWeight: '600',
  ulbNameStyle: 'normal',
  projectStartDate: '2024-01-01',
  financialYearStart: '2024-04-01',
  goLiveDate: '',
  implementationPartner: '',
  projectManager: 'Project Lead',
  projectManagerEmail: 'pm@ulb.gov.in',
  projectManagerPhone: '',
  licenseType: 'Standard (2 Years)',
  licenseKey: 'LIC-123',
  licenseStartDate: '2024-01-01',
  licenseDuration: '24',
  licenseEndDate: '2026-01-01',
  maxUsers: '',
  maxDepartments: '',
  supportType: 'Email Support',
  renewalDate: '',
  licenseStatus: 'active',
};

const tCommon = vi.fn((key: string, values?: Record<string, string | number | Date>) => {
  if (values?.count !== undefined) return `${key}:${values.count}`;
  return key;
});

const tUlb = vi.fn((key: string) => key);

describe('ulb-form-validation', () => {
  it('sanitizes ulb code to alphanumeric and underscore characters', () => {
    expect(sanitizeUlbFieldValue('ulbCode', 'ab@12_')).toBe('ab12_');
  });

  it('sanitizes phone numbers to digits only', () => {
    expect(sanitizeUlbFieldValue('phone', '98-765-43210')).toBe('9876543210');
  });

  it('returns no errors for valid ulb-info fields', () => {
    const errors = validateUlbConfigurationFields(baseForm, 'ulb-info', tCommon, tUlb);
    expect(errors).toEqual({});
  });

  it('returns ulb code format error for invalid code', () => {
    const errors = validateUlbConfigurationFields(
      { ...baseForm, ulbCode: '_invalid' },
      'ulb-info',
      tCommon,
      tUlb
    );
    expect(errors.ulbCode).toBe('form.validation.codeFormat');
  });

  it('returns pincode error for invalid pincode', () => {
    const errors = validateUlbConfigurationFields(
      { ...baseForm, pincode: '012345' },
      'ulb-info',
      tCommon,
      tUlb
    );
    expect(errors.pincode).toBe('validation.pincodeFormat');
  });

  it('returns email error for invalid email format', () => {
    const errors = validateUlbConfigurationFields(
      { ...baseForm, email: 'not-an-email' },
      'ulb-info',
      tCommon,
      tUlb
    );
    expect(errors.email).toBe('validation.emailFormat');
  });

  it('returns email length error for emails exceeding max characters', () => {
    const errors = validateUlbConfigurationFields(
      { ...baseForm, email: 'a'.repeat(93) + '@ulb.gov.in' }, // 104 characters
      'ulb-info',
      tCommon,
      tUlb
    );
    expect(errors.email).toBe('form.validation.descriptionMaxLength:100');
  });

  it('returns phone format error for invalid phone numbers', () => {
    const errorShort = validateUlbConfigurationFields(
      { ...baseForm, phone: '98765' },
      'ulb-info',
      tCommon,
      tUlb
    );
    expect(errorShort.phone).toBe('validation.phoneFormat');

    const errorInvalidStart = validateUlbConfigurationFields(
      { ...baseForm, phone: '5876543210' },
      'ulb-info',
      tCommon,
      tUlb
    );
    expect(errorInvalidStart.phone).toBe('validation.phoneFormat');
  });

  it('returns alternate phone error when identical to primary phone', () => {
    const errors = validateUlbConfigurationFields(
      { ...baseForm, phone: '9876543210', alternatePhone: '9876543210' },
      'ulb-info',
      tCommon,
      tUlb
    );
    expect(errors.alternatePhone).toBe('validation.alternatePhoneSame');
  });

  it('returns address format and gibberish errors for address field', () => {
    const errorShort = validateUlbConfigurationFields(
      { ...baseForm, address: 'Road' },
      'ulb-info',
      tCommon,
      tUlb
    );
    expect(errorShort.address).toBe('validation.addressFormat');

    const errorConsecutiveSpaces = validateUlbConfigurationFields(
      { ...baseForm, address: 'Main  Road  Thane' },
      'ulb-info',
      tCommon,
      tUlb
    );
    expect(errorConsecutiveSpaces.address).toBe('validation.addressFormat');

    const errorGibberish = validateUlbConfigurationFields(
      { ...baseForm, address: 'asdfghjklqwerty' },
      'ulb-info',
      tCommon,
      tUlb
    );
    expect(errorGibberish.address).toBe('validation.gibberishError');
  });

  it('returns gibberish error for names with keyboard patterns or key-mashing', () => {
    const errorName = validateUlbConfigurationFields(
      { ...baseForm, ulbName: 'qwerty Corporation' },
      'ulb-info',
      tCommon,
      tUlb
    );
    expect(errorName.ulbName).toBe('validation.gibberishError');

    const errorContact = validateUlbConfigurationFields(
      { ...baseForm, contactPerson: 'asdfgh User' },
      'ulb-info',
      tCommon,
      tUlb
    );
    expect(errorContact.contactPerson).toBe('validation.gibberishError');

    const errorManager = validateUlbConfigurationFields(
      { ...baseForm, projectManager: 'zxcvbn PM' },
      'project-license-info',
      tCommon,
      tUlb
    );
    expect(errorManager.projectManager).toBe('validation.gibberishError');
  });

  it('returns required errors for missing project license fields', () => {
    const errors = validateUlbConfigurationFields(
      { ...baseForm, projectManager: '', licenseKey: '' },
      'project-license-info',
      tCommon,
      tUlb
    );
    expect(errors.projectManager).toBe('validation.projectManagerRequired');
    expect(errors.licenseKey).toBe('validation.licenseKeyRequired');
  });

  it('allows valid names for contactPerson and projectManager', () => {
    const infoErrors = validateUlbConfigurationFields(
      { ...baseForm, contactPerson: 'Ashwin Deshmukh' },
      'ulb-info',
      tCommon,
      tUlb
    );
    expect(infoErrors.contactPerson).toBeUndefined();

    const licenseErrors = validateUlbConfigurationFields(
      { ...baseForm, projectManager: 'Project Lead Name' },
      'project-license-info',
      tCommon,
      tUlb
    );
    expect(licenseErrors.projectManager).toBeUndefined();
  });

  it('returns validation format errors for contactPerson with invalid characters', () => {
    const errors = validateUlbConfigurationFields(
      { ...baseForm, contactPerson: 'Ashwin @ Deshmukh' },
      'ulb-info',
      tCommon,
      tUlb
    );
    expect(errors.contactPerson).toBe('validation.contactPersonFormat');
  });

  it('returns validation format errors for projectManager with invalid characters', () => {
    const errors = validateUlbConfigurationFields(
      { ...baseForm, projectManager: 'Project # Lead' },
      'project-license-info',
      tCommon,
      tUlb
    );
    expect(errors.projectManager).toBe('validation.projectManagerFormat');
  });
});
