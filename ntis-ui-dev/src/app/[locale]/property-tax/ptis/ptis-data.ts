import {
  defaultPropertyDetails,
  defaultKycDetails,
  defaultSocietyDetails,
  defaultOldDetails,
} from '@/lib/constants/ptis.constants';
import { fetchPropertyDetailsOnlyAction } from './actions';
import type { SearchSelectOption } from '@/components/common/SearchSelect';
import type {
  PropertyListItem,
  Ward,
  OldFloorDetailsData,
  OldTaxesData,
  PropertyDetailsData,
  KYCDetailsData,
  SocietyDetailsData,
  OldDetailsData,
} from '@/types/ptis.types';
import { PTIS_TABS, PtisTabId } from '@/types/ptis.types';

/** Validate and coerce a raw tab param into a typed PtisTabId. */
export const toValidTab = (value: unknown): PtisTabId => {
  const tabStr = typeof value === 'string' ? value.toLowerCase().trim() : '';
  if (tabStr === 'discount' || tabStr === 'discountdetails') return 'discountdetails';
  if (tabStr === 'building' || tabStr === 'buildingpermission') return 'buildingpermission';
  if (tabStr === 'old' || tabStr === 'olddetails') return 'olddetails';
  if (tabStr === 'kyc' || tabStr === 'kycdetails') return 'kycdetails';
  if (tabStr === 'society' || tabStr === 'societydetails') return 'societydetails';
  return (PTIS_TABS as readonly string[]).includes(tabStr)
    ? (tabStr as PtisTabId)
    : 'propertydetails';
};

export interface PtisPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<
    Record<string, string | string[] | undefined> & {
      wardNo?: string;
      propertyNo?: string;
      partitionNo?: string;
      propertyId?: string;
      wardId?: string;
      tab?: string;
      showFloor?: string;
      showOldTax?: string;
    }
  >;
}

export interface InitialDataResult {
  success: boolean;
  propertyId?: number;
  wardId?: number;
  wardNo?: string;
  propertyDetails: PropertyDetailsData;
  error?: string;
}

/** Server-side data fetching for the property details section. */
export async function getInitialData(
  wardNo?: string,
  propertyNo?: string,
  partitionNo?: string,
  wardId?: number,
  propertyId?: number
): Promise<InitialDataResult> {
  try {
    if (propertyId || (wardNo && propertyNo)) {
      const result = await fetchPropertyDetailsOnlyAction(
        wardNo || '',
        propertyNo || '',
        partitionNo || '',
        wardId,
        propertyId
      );

      if (result.success && result.data) {
        return {
          success: true,
          propertyId: result.data.propertyId,
          wardId: result.data.wardId,
          wardNo: result.data.wardNo,
          propertyDetails: {
            ...defaultPropertyDetails,
            ...result.data.details,
          },
        };
      }
      return {
        success: false,
        error: result.error,
        propertyDetails: defaultPropertyDetails,
      };
    }

    return {
      success: true,
      propertyId: undefined,
      propertyDetails: defaultPropertyDetails,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load initial property data',
      propertyDetails: defaultPropertyDetails,
    };
  }
}

/** Build ward dropdown options from the raw ward list. */
export function buildWardOptions(wards: Ward[]): SearchSelectOption[] {
  return wards.map((w) => ({
    label: w.wardNo || '',
    value: (w.wardId ?? w.wardID ?? '').toString(),
  }));
}

/** Build property dropdown options from the raw property list. */
export function buildPropertyOptions(properties: PropertyListItem[]): SearchSelectOption[] {
  return properties.map((p) => {
    const trimmedPartitionNo = (p.partitionNo ?? '').trim();
    const normalizedPartitionNo = trimmedPartitionNo === '0' ? '' : trimmedPartitionNo;
    return {
      label: `${p.propertyNo}${normalizedPartitionNo ? ` - ${normalizedPartitionNo}` : ''}`,
      value: JSON.stringify({
        propertyNo: p.propertyNo,
        partitionNo: normalizedPartitionNo,
        propertyId: p.propertyId,
      }),
    };
  });
}

/** Merge fetched detail results with defaults for the PTIS initial data payload. */
export function buildDetailsFromResults(
  kycResult: { success: boolean; data?: KYCDetailsData } | null,
  societyResult: { success: boolean; data?: SocietyDetailsData } | null,
  oldDetailsResult: { success: boolean; data?: OldDetailsData } | null,
  oldFloorResult: { success: boolean; data?: OldFloorDetailsData[] } | null,
  oldTaxesResult: { success: boolean; data?: OldTaxesData | OldTaxesData[] } | null
): {
  kycDetails: KYCDetailsData;
  societyDetails: SocietyDetailsData;
  oldDetails: OldDetailsData;
  oldFloorTableData: OldFloorDetailsData[];
  oldTaxesData: OldTaxesData | null;
} {
  return {
    kycDetails: kycResult?.success && kycResult.data
      ? { ...defaultKycDetails, ...kycResult.data } : defaultKycDetails,
    societyDetails: societyResult?.success && societyResult.data
      ? { ...defaultSocietyDetails, ...societyResult.data } : defaultSocietyDetails,
    oldDetails: oldDetailsResult?.success && oldDetailsResult.data
      ? { ...defaultOldDetails, ...oldDetailsResult.data } : defaultOldDetails,
    oldFloorTableData: oldFloorResult?.success && Array.isArray(oldFloorResult.data)
      ? oldFloorResult.data : [],
    oldTaxesData: oldTaxesResult?.success && oldTaxesResult.data
      ? (Array.isArray(oldTaxesResult.data) ? oldTaxesResult.data[0] ?? null : oldTaxesResult.data)
      : null,
  };
}
