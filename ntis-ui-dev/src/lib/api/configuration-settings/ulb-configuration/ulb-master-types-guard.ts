import { parseBoolean } from '@/lib/utils/type-guards';
import { ApiError } from '@/lib/utils/api';
import type { UlbConfigurationMaster, UlbMasterMutationResponse } from '@/types/ulbconfig-master.types';

function readField(data: Record<string, unknown>, camel: string, pascal: string): unknown {
  if (Object.prototype.hasOwnProperty.call(data, camel) && data[camel] != null) {
    return data[camel];
  }
  if (Object.prototype.hasOwnProperty.call(data, pascal) && data[pascal] != null) {
    return data[pascal];
  }
  return undefined;
}

function toNullableString(value: unknown): string | null {
  if (value == null) return null;
  const str = String(value).trim();
  return str.length > 0 ? str : null;
}

function toNullableDateString(value: unknown): string | null {
  if (value == null) return null;
  const str = String(value).trim();
  if (!str) return null;
  return str.includes('T') ? str.split('T')[0] : str;
}

/**
 * Normalizes a single ULB master record from GET `/ULBMaster`.
 * Handles both camelCase and PascalCase field names from the API.
 */
export function normalizeUlbMaster(data: Record<string, unknown>): UlbConfigurationMaster | null {
  const idRaw = readField(data, 'id', 'Id') ?? readField(data, 'ulbMasterId', 'UlbMasterId');
  const id = typeof idRaw === 'number' ? idRaw : Number(idRaw);

  const ulbCode = String(readField(data, 'ulbCode', 'UlbCode') ?? '').trim();
  const ulbName = String(readField(data, 'ulbName', 'UlbName') ?? '').trim();

  if (!Number.isFinite(id) || id < 1 || !ulbCode || !ulbName) {
    return null;
  }

  const ulbTypeIdRaw = readField(data, 'ulbTypeId', 'UlbTypeId');
  const ulbTypeId = typeof ulbTypeIdRaw === 'number' ? ulbTypeIdRaw : Number(ulbTypeIdRaw ?? 0);

  return {
    id,
    ulbCode,
    ulbName,
    ulbNameLocal: toNullableString(readField(data, 'ulbNameLocal', 'UlbNameLocal')),
    ulbTypeId: Number.isFinite(ulbTypeId) ? ulbTypeId : 0,
    ulbLogo: toNullableString(readField(data, 'ulbLogo', 'UlbLogo')),
    emailId: toNullableString(readField(data, 'emailId', 'EmailId')),
    mobileNo: toNullableString(readField(data, 'mobileNo', 'MobileNo')),
    alternateMobileNo: toNullableString(readField(data, 'alternateMobileNo', 'AlternateMobileNo')),
    websiteUrl: toNullableString(readField(data, 'websiteUrl', 'WebsiteUrl')),
    contactPersonName: toNullableString(readField(data, 'contactPersonName', 'ContactPersonName')),
    contactPersonDesignation: toNullableString(
      readField(data, 'contactPersonDesignation', 'ContactPersonDesignation')
    ),
    ulbAddress: toNullableString(readField(data, 'ulbAddress', 'UlbAddress')),
    state: toNullableString(readField(data, 'state', 'State')),
    district: toNullableString(readField(data, 'district', 'District')),
    pinCode: toNullableString(readField(data, 'pinCode', 'PinCode')),
    projectStartDate: toNullableDateString(readField(data, 'projectStartDate', 'ProjectStartDate')),
    financialYearStartDate: toNullableDateString(
      readField(data, 'financialYearStartDate', 'FinancialYearStartDate')
    ),
    expectedGoLiveDate: toNullableDateString(readField(data, 'expectedGoLiveDate', 'ExpectedGoLiveDate')),
    partnerName: toNullableString(readField(data, 'partnerName', 'PartnerName')),
    pmName: toNullableString(readField(data, 'pmName', 'PmName')),
    pmEmailId: toNullableString(readField(data, 'pmEmailId', 'PmEmailId')),
    pmMobileNo: toNullableString(readField(data, 'pmMobileNo', 'PmMobileNo')),
    licenceType: toNullableString(readField(data, 'licenceType', 'LicenceType')),
    licenceStartDate: toNullableDateString(readField(data, 'licenceStartDate', 'LicenceStartDate')),
    licenceEndDate: toNullableDateString(readField(data, 'licenceEndDate', 'LicenceEndDate')),
    licenceDuration: toNullableString(readField(data, 'licenceDuration', 'LicenceDuration')),
    supportType: toNullableString(readField(data, 'supportType', 'SupportType')),
    licenceKey: toNullableString(readField(data, 'licenceKey', 'LicenceKey')),
    isActive: parseBoolean(readField(data, 'isActive', 'IsActive') ?? true),
    createdDate: toNullableDateString(readField(data, 'createdDate', 'CreatedDate')),
    updatedDate: toNullableDateString(readField(data, 'updatedDate', 'UpdatedDate')),
  };
}

function extractUlbMasterRecord(data: unknown): UlbConfigurationMaster | null {
  if (!data || typeof data !== 'object') return null;

  const body = data as Record<string, unknown>;
  const items = body.items ?? body.Items;

  if (items && typeof items === 'object' && !Array.isArray(items)) {
    return normalizeUlbMaster(items as Record<string, unknown>);
  }

  return normalizeUlbMaster(body);
}

/** Parses POST/PUT `/ULBMaster` wrapped mutation responses. */
export function parseUlbMasterMutationResponse(
  data: UlbMasterMutationResponse,
  fallbackError: string
): { ulb: UlbConfigurationMaster; message: string } {
  if (data.success === false) {
    throw new ApiError(400, data.message || fallbackError, fallbackError);
  }

  const normalized = extractUlbMasterRecord(data);
  if (!normalized) {
    throw new ApiError(500, data.message || 'Invalid ULB master response', fallbackError);
  }

  return {
    ulb: normalized,
    message: data.message || 'Record saved successfully',
  };
}
