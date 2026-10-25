import {
  LICENSE_DURATION_OPTIONS,
  ULB_TYPE_OPTIONS,
} from '@/config/ulb-configuration.config';
import type { ULBConfigurationFormData } from '@/types/ulbconfig-master.types';
import { normalizeWebsiteUrl } from './ulb-master.formatters';

function toApiDateTime(date: string): string | null {
  const trimmed = date.trim();
  if (!trimmed) return null;
  return trimmed.includes('T') ? trimmed : `${trimmed}T00:00:00`;
}

function formatLicenceDuration(duration: string): string | null {
  const trimmed = duration.trim();
  if (!trimmed) return null;
  const option = LICENSE_DURATION_OPTIONS.find((o) => o.value === trimmed);
  return option?.label ?? trimmed;
}

/** Converts API duration labels (e.g. "1 Year", "12 Months") back to form select values. */
export function parseLicenseDurationFromApi(duration: string): string {
  const trimmed = duration.trim();
  if (!trimmed) return '';
  const byLabel = LICENSE_DURATION_OPTIONS.find((o) => o.label === trimmed);
  if (byLabel) return byLabel.value;
  const byValue = LICENSE_DURATION_OPTIONS.find((o) => o.value === trimmed);
  if (byValue) return byValue.value;
  const monthsMatch = trimmed.match(/^(\d+)\s*months?$/i);
  if (monthsMatch) return monthsMatch[1];
  return trimmed;
}

function resolveUlbTypeId(ulbType: string): number {
  const trimmed = ulbType.trim();
  if (!trimmed) return 0;

  const byLabel = ULB_TYPE_OPTIONS.find((o) => o.label === trimmed);
  if (byLabel) return byLabel.value;

  const asNumber = Number(trimmed);
  if (Number.isFinite(asNumber) && asNumber > 0) return asNumber;

  return 0;
}

/** Maps ULB configuration form state to POST/PUT `/ULBMaster` request body. */
export function mapFormDataToUlbMasterPayload(
  form: ULBConfigurationFormData,
  existingId?: number
): Record<string, unknown> {
  return {
    id: existingId ?? 0,
    ulbCode: form.ulbCode.trim(),
    ulbName: form.ulbName.trim(),
    ulbNameLocal: null,
    ulbTypeId: resolveUlbTypeId(form.ulbType),
    ulbLogo: form.ulbLogo || null,
    emailId: form.email.trim() || null,
    mobileNo: form.phone.trim() || null,
    alternateMobileNo: form.alternatePhone.trim() || null,
    websiteUrl: form.website.trim() ? normalizeWebsiteUrl(form.website) : null,
    contactPersonName: form.contactPerson.trim() || null,
    contactPersonDesignation: form.designation.trim() || null,
    ulbAddress: form.address.trim() || null,
    state: form.state.trim() || null,
    district: form.district.trim() || null,
    pinCode: form.pincode.trim() || null,
    projectStartDate: toApiDateTime(form.projectStartDate),
    financialYearStartDate: toApiDateTime(form.financialYearStart),
    expectedGoLiveDate: toApiDateTime(form.goLiveDate),
    partnerName: form.implementationPartner.trim() || null,
    pmName: form.projectManager.trim() || null,
    pmEmailId: form.projectManagerEmail.trim() || null,
    pmMobileNo: form.projectManagerPhone.trim() || null,
    licenceType: form.licenseType.trim() || null,
    licenceStartDate: toApiDateTime(form.licenseStartDate),
    licenceEndDate: toApiDateTime(form.licenseEndDate),
    licenceDuration: formatLicenceDuration(form.licenseDuration),
    supportType: form.supportType.trim() || null,
    licenceKey: form.licenseKey.trim() || null,
    isActive: form.licenseStatus !== 'inactive',
  };
}
