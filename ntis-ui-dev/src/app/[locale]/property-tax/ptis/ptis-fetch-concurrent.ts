'use server';

import {
  fetchKycDetailsOnlyAction,
  fetchSocietyDetailsOnlyAction,
  fetchOldDetailsOnlyAction,
  fetchOldFloorDetailsAction,
  fetchOldTaxesDetailsAction,
  fetchDiscountDetailsOnlyAction,
  fetchSocialDetailsOnlyAction,
  fetchBuildingPermissionOnlyAction,
  fetchMappedPropertiesAction,
  fetchTabHeaderInfoAction,
} from './ptis-detail-actions';
import { getPhotoSlotsAction, getPropertyPhotosAction } from './media-fetch.action';
import { getApartmentQCDataAction } from './apartmentQC.action';
import { getCapitalValue } from './CapitalValue.action';
import { getRateableValue } from './RateableValue.action';
import { getDualMethod } from './DualMethod.action';
import { getPropertyComparisonAction } from './PropertyComparison.action';
import { fetchTaxDetailsByTab } from './TaxDetails/fetchTaxDetails';
import { DEFAULT_WAYBACK_RELEASES } from '@/lib/api/wayback.service';

export async function fetchPropertyDetailsConcurrently(
  propertyId: number,
  wardId: number | undefined,
  propertyNo: string,
  partitionNo: string,
  appartmentTab: string,
  pageNumber: number,
  pageSize: number,
  searchTerm: string,
  filterWing: string,
  filterFlatOrShopNo: string,
  filterApartmentType: string,
  filterPropertyType: string,
  sortBy: string,
  sortOrder: string,
  valuationTab: 'rateable' | 'capital' | 'dual' | 'apartment' | 'reassessment' | undefined,
  showDetailsParam: boolean,
  activeTab?: string
) {
  const isKycTab = activeTab === 'kycdetails';
  const isSocietyTab = activeTab === 'societydetails';
  const isDiscountTab = activeTab === 'discountdetails';
  const isOldDetailsTab = activeTab === 'olddetails';

  const isRateableTab = !valuationTab || valuationTab === 'rateable';

  let rateableValuePromise: Promise<Awaited<ReturnType<typeof getRateableValue>> | null> =
    Promise.resolve(null);
  let capitalValuePromise: Promise<Awaited<ReturnType<typeof getCapitalValue>> | null> =
    Promise.resolve(null);
  let dualMethodPromise: Promise<Awaited<ReturnType<typeof getDualMethod>> | null> =
    Promise.resolve(null);

  if (propertyId) {
    switch (valuationTab) {
      case 'capital': {
        capitalValuePromise = getCapitalValue(propertyId);
        break;
      }
      case 'rateable': {
        rateableValuePromise = getRateableValue(propertyId);
        break;
      }
      case 'dual': {
        dualMethodPromise = getDualMethod(propertyId);
        if (showDetailsParam) {
          rateableValuePromise = getRateableValue(propertyId);
          capitalValuePromise = getCapitalValue(propertyId);
        }
        break;
      }
      case 'apartment': {
        // Apartment / Redesign screen has its own dedicated top/tax section endpoints
        break;
      }
      default: {
        // Default to rateable for classic ptis tabs
        rateableValuePromise = getRateableValue(propertyId);
        break;
      }
    }
  }

  // Chain taxDetails fetching to run after calculation actions resolve, as the calculation generates the tax details.
  const taxDetailsPromise = propertyId
    ? Promise.all([
        rateableValuePromise.catch(() => null),
        capitalValuePromise.catch(() => null),
        dualMethodPromise.catch(() => null),
      ]).then(() => fetchTaxDetailsByTab(propertyId, valuationTab, showDetailsParam))
    : Promise.resolve(null);

  // PropertyComparison API call is triggered on Rateable and Dual tabs during SSR
  // Chain comparison fetching to run after calculation actions resolve, as the calculation generates the comparison data.
  const comparisonPromise = propertyId
    ? Promise.all([
        rateableValuePromise.catch(() => null),
        capitalValuePromise.catch(() => null),
        dualMethodPromise.catch(() => null),
      ]).then(() =>
        isRateableTab || valuationTab === 'dual'
          ? getPropertyComparisonAction(propertyId)
          : Promise.resolve(null)
      )
    : Promise.resolve(null);

  // Calculation rule logs fetched on-demand if needed
  const ruleLogsPromise = Promise.resolve(null);

  const isBuildingTab = activeTab === 'building' || activeTab === 'buildingpermission';

  const kycPromise = isKycTab ? fetchKycDetailsOnlyAction(propertyId) : Promise.resolve(null);

  const societyPromise = isSocietyTab && propertyId
    ? fetchSocietyDetailsOnlyAction(propertyId)
    : Promise.resolve(null);

  const buildingPromise = isBuildingTab && propertyId
    ? fetchBuildingPermissionOnlyAction(propertyId)
    : Promise.resolve(null);

  const oldDetailsPromise = isOldDetailsTab
    ? fetchOldDetailsOnlyAction(propertyId)
    : Promise.resolve(null);

  const oldFloorPromise = isOldDetailsTab
    ? fetchOldFloorDetailsAction(propertyId)
    : Promise.resolve(null);

  const oldTaxesPromise = isOldDetailsTab
    ? fetchOldTaxesDetailsAction(propertyId)
    : Promise.resolve(null);

  const discountPromise =
    isDiscountTab || activeTab === 'discount'
      ? fetchDiscountDetailsOnlyAction(propertyId)
      : Promise.resolve(null);

  const socialPromise =
    isDiscountTab || activeTab === 'discount'
      ? fetchSocialDetailsOnlyAction(propertyId)
      : Promise.resolve(null);

  const headerInfoPromise = propertyId
    ? fetchTabHeaderInfoAction(propertyId).catch(() => null)
    : Promise.resolve(null);

  const mappedPropertiesPromise = isOldDetailsTab
    ? fetchMappedPropertiesAction(propertyId)
    : Promise.resolve(null);

  const photoSlotsPromise = propertyId ? getPhotoSlotsAction(propertyId) : Promise.resolve(null);

  const photosPromise = propertyId ? getPropertyPhotosAction(propertyId) : Promise.resolve(null);

  const isApartmentQcTab = activeTab === 'appartmentqc';

  return Promise.all([
    wardId && propertyNo && isApartmentQcTab
      ? getApartmentQCDataAction(
          wardId,
          propertyNo,
          appartmentTab,
          pageNumber,
          pageSize,
          searchTerm,
          propertyId,
          {
            wing: filterWing || undefined,
            flatOrShopNo: filterFlatOrShopNo || undefined,
            apartmentType: filterApartmentType || undefined,
            propertyType: filterPropertyType || undefined,
          },
          {
            sortBy: sortBy || undefined,
            sortOrder: sortOrder || undefined,
          },
          partitionNo
        )
      : Promise.resolve(null),
    rateableValuePromise,
    capitalValuePromise,
    kycPromise,
    societyPromise,
    buildingPromise,
    oldDetailsPromise,
    oldFloorPromise,
    oldTaxesPromise,
    discountPromise,
    socialPromise,
    photoSlotsPromise,
    photosPromise,
    dualMethodPromise,
    taxDetailsPromise,
    ruleLogsPromise,
    Promise.resolve(DEFAULT_WAYBACK_RELEASES),
    headerInfoPromise,
    mappedPropertiesPromise,
    comparisonPromise,
  ]);
}
