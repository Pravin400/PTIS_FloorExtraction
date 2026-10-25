import { describe, it, expect } from 'vitest';
import {
  getUlbConfigurationValidationError,
  normalizeUlbFormData,
  validateUlbConfigurationSection,
} from '@/lib/api/configuration-settings/ulb-configuration/ulb-master.validator';
import type { ULBConfigurationFormData } from '@/types/ulbconfig-master.types';

const baseUlbInfo: ULBConfigurationFormData = {
  ulbName: 'Thane Municipal Corporation',
  ulbCode: 'TH001',
  ulbType: 'Municipal Corporation',
  state: 'Maharashtra',
  district: 'Thane',
  address: 'Thane',
  pincode: '400601',
  contactPerson: 'Admin',
  designation: 'Officer',
  email: 'admin@ulb.gov.in',
  phone: '9876543210',
  alternatePhone: '',
  website: 'https://www.thane.gov.in',
  ulbLogo: 'data:image/png;base64,abc',
  ulbNameFont: 'Inter',
  ulbNameColor: '#1e40af',
  ulbNameSize: '24',
  ulbNameWeight: '600',
  ulbNameStyle: 'normal',
  projectStartDate: '',
  financialYearStart: '',
  goLiveDate: '',
  implementationPartner: '',
  projectManager: '',
  projectManagerEmail: '',
  projectManagerPhone: '',
  licenseType: '',
  licenseKey: '',
  licenseStartDate: '',
  licenseDuration: '',
  licenseEndDate: '',
  maxUsers: '',
  maxDepartments: '',
  supportType: '',
  renewalDate: '',
  licenseStatus: 'active',
};

describe('ulb-master.validator', () => {
  it('passes ulb-info when required fields are filled', () => {
    expect(validateUlbConfigurationSection(baseUlbInfo, 'ulb-info')).toBeNull();
  });

  it('returns ulbNameRequired when ULB name is missing', () => {
    const data = { ...baseUlbInfo, ulbName: '' };
    expect(validateUlbConfigurationSection(data, 'ulb-info')).toBe('ulbNameRequired');
  });

  it('returns websiteFormat for invalid website', () => {
    const data = { ...baseUlbInfo, website: 'not a url' };
    expect(getUlbConfigurationValidationError(data, 'ulb-info')).toBe('websiteFormat');
  });

  it('normalizes website URL before submit', () => {
    const normalized = normalizeUlbFormData({ ...baseUlbInfo, website: 'akolamc.in' });
    expect(normalized.website).toBe('https://akolamc.in');
  });

  it('returns phoneFormat for invalid mobile number', () => {
    const data = { ...baseUlbInfo, phone: '111111' };
    expect(getUlbConfigurationValidationError(data, 'ulb-info')).toBe('phoneFormat');
  });
});
