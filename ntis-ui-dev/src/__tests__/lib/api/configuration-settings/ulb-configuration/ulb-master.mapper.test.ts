import { describe, it, expect } from 'vitest';
import {
  mapFormDataToUlbMasterPayload,
  parseLicenseDurationFromApi,
} from '@/lib/api/configuration-settings/ulb-configuration/ulb-master.mapper';
import type { ULBConfigurationFormData } from '@/types/ulbconfig-master.types';

const sampleForm: ULBConfigurationFormData = {
  ulbName: ' Thane Municipal Corporation ',
  ulbCode: ' TH001 ',
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
  website: 'akolamc.in',
  ulbLogo: null,
  ulbNameFont: 'Inter',
  ulbNameColor: '#1e40af',
  ulbNameSize: '24',
  ulbNameWeight: '600',
  ulbNameStyle: 'normal',
  projectStartDate: '2026-01-01',
  financialYearStart: '2026-04-01',
  goLiveDate: '',
  implementationPartner: 'NIC',
  projectManager: 'PM Name',
  projectManagerEmail: 'pm@ulb.gov.in',
  projectManagerPhone: '',
  licenseType: 'Standard (2 Years)',
  licenseKey: 'ABCD-1234',
  licenseStartDate: '2026-06-01',
  licenseDuration: '12',
  licenseEndDate: '2027-06-01',
  maxUsers: '10',
  maxDepartments: '5',
  supportType: 'Email Support',
  renewalDate: '',
  licenseStatus: 'active',
};

describe('ulb-master.mapper', () => {
  it('maps form data to ULBMaster API payload', () => {
    const payload = mapFormDataToUlbMasterPayload(sampleForm, 2);

    expect(payload.id).toBe(2);
    expect(payload.ulbCode).toBe('TH001');
    expect(payload.ulbName).toBe('Thane Municipal Corporation');
    expect(payload.ulbTypeId).toBe(1);
    expect(payload.websiteUrl).toBe('https://akolamc.in');
    expect(payload.projectStartDate).toBe('2026-01-01T00:00:00');
    expect(payload.licenceDuration).toBe('1 Year');
  });

  it('parses API duration labels to form values', () => {
    expect(parseLicenseDurationFromApi('1 Year')).toBe('12');
    expect(parseLicenseDurationFromApi('12 Months')).toBe('12');
    expect(parseLicenseDurationFromApi('12')).toBe('12');
  });
});
