'use server';

import { toPositiveInt, toSafeString } from '@/lib/utils/format';
import {
  getWardListAction,
  getPropertyListByWardAction,
  fetchWardIdAction,
} from './actions';
import { toValidTab, getInitialData, buildWardOptions, InitialDataResult } from './ptis-data';
import { parsePtisSearchParams } from '@/lib/utils/params';
import { getCleanErrorMessage } from '@/lib/utils/backend-error-detection';
import { fetchPropertyDetailsConcurrently } from './ptis-fetch-concurrent';
import { mapPtisFetchResults } from './ptis-mapping.helper';
import { defaultPropertyDetails } from '@/lib/constants/ptis.constants';
import { getWingWiseDetails } from '@/lib/api/ptis/apartment/apartment-wing.service';
import { extractCoordinates } from '@/lib/utils/coordinate-utils';
import { ptisService } from '@/lib/api/ptis/tab/ptis.service';
import { ptisSearchService } from '@/lib/api/ptis/tab/ptis-search';
import type { ActionResult } from '@/types/common.types';
import type { PropertyListItem } from '@/types/ptis.types';
import type { WingWiseWingDetails } from '@/types/property-tax/apartment';

const societyCoordsCache = new Map<string, { lat?: number; lng?: number; timestamp: number }>();
const SOCIETY_COORDS_TTL = 10 * 60 * 1000; // 10 minutes

export async function fetchPtisPageData(
  searchParams: Record<string, string | string[] | undefined>,
  locale: string
) {
  const wardNo = toSafeString(searchParams?.wardNo);
  const propertyNo = toSafeString(searchParams?.propertyNo);
  const rawPartitionNo = toSafeString(searchParams?.partitionNo);
  const partitionNo = rawPartitionNo === '0' ? '' : rawPartitionNo;

  const activeTab = toValidTab(searchParams?.tab);
  const ptisParams = parsePtisSearchParams(searchParams);
  const valuationTab = ptisParams.tab;
  const wardIdParam = toPositiveInt(searchParams?.wardId);
  const propertyIdParam = toPositiveInt(searchParams?.propertyId);
  const showFloorParam = searchParams?.showFloor === 'true';
  const showOldTaxParam = searchParams?.showOldTax === 'true';
  const showMapDetailsParam = searchParams?.showMapDetails === 'true';
  const showDetailsParam = searchParams?.showDetails === 'true';

  const pageNumber = toPositiveInt(searchParams?.pageNumber) || 1;
  const pageSize = toPositiveInt(searchParams?.pageSize) || 10;
  const searchTerm = toSafeString(searchParams?.searchTerm);
  const sortBy = toSafeString(searchParams?.sortBy);
  const sortOrder = toSafeString(searchParams?.sortOrder);
  const appartmentTab = toSafeString(searchParams?.appartmentTab) || 'amenities';

  const filterWing = toSafeString(searchParams?.filterWing);
  const filterFlatOrShopNo = toSafeString(searchParams?.filterFlatOrShopNo);
  const filterApartmentType = toSafeString(searchParams?.filterApartmentType);
  const filterPropertyType = toSafeString(searchParams?.filterPropertyType);

  let criticalError: string | undefined = undefined;
  let resolvedWardId = wardIdParam;
  let resolvedPropertyId = propertyIdParam;

  // 1. Fetch ward list and initial ward ID in parallel
  const [wardListResult, initialWardIdResult] = await Promise.all([
    getWardListAction(),
    !wardIdParam && wardNo ? fetchWardIdAction(wardNo) : Promise.resolve(null),
  ]);

  if (!resolvedWardId && initialWardIdResult?.success && initialWardIdResult.data?.wardId) {
    resolvedWardId = initialWardIdResult.data.wardId;
  }

  const wardOptions = wardListResult.success && wardListResult.data ? buildWardOptions(wardListResult.data) : [];

  let propertyDetailsResult: InitialDataResult = {
    success: true,
    propertyDetails: defaultPropertyDetails,
  };
  let propertyListResult: ActionResult<PropertyListItem[]> | null = null;
  let detailResults: unknown[] = [];
  let fetchedWings: WingWiseWingDetails[] = [];
  let resolvedMainSocietyPropId: number | undefined = undefined;

  try {
    if (propertyIdParam && resolvedWardId) {
      // SCENARIO 1: Both propertyId and wardId are known. Fetch everything concurrently!
      const detailsPromise = fetchPropertyDetailsConcurrently(
        propertyIdParam, resolvedWardId, propertyNo, partitionNo, appartmentTab,
        pageNumber, pageSize, searchTerm, filterWing, filterFlatOrShopNo,
        filterApartmentType, filterPropertyType, sortBy, sortOrder, valuationTab,
        showDetailsParam, activeTab
      );

      const finalPropNo = propertyNo || searchParams?.propertyNo?.toString() || '';
      const wingWisePromise = resolvedWardId && finalPropNo
        ? getWingWiseDetails(resolvedWardId, finalPropNo).catch(() => null)
        : Promise.resolve(null);

      const wardPropLimit = (propertyIdParam || propertyNo) ? 50 : undefined;
      const [propDetailsRes, propListRes, detailsRes, wingWiseRes] = await Promise.all([
        getInitialData(wardNo, propertyNo, partitionNo, resolvedWardId, propertyIdParam),
        resolvedWardId
          ? getPropertyListByWardAction(resolvedWardId, wardPropLimit)
          : Promise.resolve({ success: true, data: [] }),
        detailsPromise,
        wingWisePromise,
      ]);

      propertyDetailsResult = propDetailsRes;
      propertyListResult = propListRes;
      detailResults = detailsRes;
      fetchedWings = wingWiseRes?.wings || [];
      if (wingWiseRes?.propertyId) {
        resolvedMainSocietyPropId = wingWiseRes.propertyId;
      }

      if (fetchedWings.length === 0 && resolvedWardId && propDetailsRes.propertyDetails?.propertyNo) {
        const fallbackWingsRes = await getWingWiseDetails(resolvedWardId, propDetailsRes.propertyDetails.propertyNo).catch(() => null);
        if (fallbackWingsRes?.wings) {
          fetchedWings = fallbackWingsRes.wings;
        }
      }
    } else {
      // SCENARIO 2: One or both are missing. Resolve sequentially.
      const propDetailsRes = await getInitialData(wardNo, propertyNo, partitionNo, resolvedWardId, propertyIdParam);
      propertyDetailsResult = propDetailsRes;

      if (!resolvedWardId && propertyDetailsResult.success && propertyDetailsResult.wardId) {
        resolvedWardId = propertyDetailsResult.wardId;
      }

      resolvedPropertyId = propertyIdParam ?? propertyDetailsResult.propertyId;
      const finalPropNo = propertyNo || propertyDetailsResult.propertyDetails?.propertyNo || searchParams?.propertyNo?.toString() || '';

      const wardPropLimit = (resolvedPropertyId || finalPropNo) ? 50 : undefined;
      const propListPromise = resolvedWardId
        ? getPropertyListByWardAction(resolvedWardId, wardPropLimit)
        : Promise.resolve({ success: true, data: [] });

      const detailsPromise = resolvedPropertyId
        ? fetchPropertyDetailsConcurrently(
            resolvedPropertyId, resolvedWardId, propertyNo, partitionNo, appartmentTab,
            pageNumber, pageSize, searchTerm, filterWing, filterFlatOrShopNo,
            filterApartmentType, filterPropertyType, sortBy, sortOrder, valuationTab,
            showDetailsParam, activeTab
          )
        : Promise.resolve(null);

      const wingWisePromise = resolvedWardId && finalPropNo
        ? getWingWiseDetails(resolvedWardId, finalPropNo).catch(() => null)
        : Promise.resolve(null);

      const [propListRes, detailsRes, wingWiseRes] = await Promise.all([
        propListPromise,
        detailsPromise,
        wingWisePromise,
      ]);

      propertyListResult = propListRes;
      detailResults = detailsRes ? detailsRes : [];
      fetchedWings = wingWiseRes?.wings || [];
      if (wingWiseRes?.propertyId) {
        resolvedMainSocietyPropId = wingWiseRes.propertyId;
      }
    }
  } catch (err) {
    criticalError = getCleanErrorMessage(err, 'Failed to fetch property details.');
  }

  // Resolve main society coordinates fallback if unit property does not have coordinates
  let societyLatitude: number | undefined = undefined;
  let societyLongitude: number | undefined = undefined;

  const unitCoords = extractCoordinates([
    propertyDetailsResult.propertyDetails as unknown as Record<string, unknown>,
  ]);

  const targetPropNo = propertyNo || propertyDetailsResult.propertyDetails?.propertyNo || searchParams?.propertyNo?.toString() || '';

  if (!unitCoords.hasCoords && targetPropNo) {
    const coordsCacheKey = `${resolvedWardId || wardNo}:${targetPropNo}`;
    const cachedCoords = societyCoordsCache.get(coordsCacheKey);
    if (cachedCoords && Date.now() - cachedCoords.timestamp < SOCIETY_COORDS_TTL) {
      societyLatitude = cachedCoords.lat;
      societyLongitude = cachedCoords.lng;
    } else {
      let mainSocietyPropertyId = resolvedMainSocietyPropId && resolvedMainSocietyPropId !== propertyDetailsResult.propertyId
        ? resolvedMainSocietyPropId
        : undefined;

      if (!mainSocietyPropertyId && propertyListResult?.data) {
        const mainPropInList = propertyListResult.data.find(
          (p) =>
            p.propertyNo === targetPropNo &&
            (!p.partitionNo || p.partitionNo === '0' || p.partitionNo.trim() === '' || p.partitionNo.trim() === '-')
        );
        if (mainPropInList?.propertyId && mainPropInList.propertyId !== propertyDetailsResult.propertyId) {
          mainSocietyPropertyId = mainPropInList.propertyId;
        }
      }

      if (!mainSocietyPropertyId && (resolvedWardId || wardNo)) {
        try {
          let searchTimer: NodeJS.Timeout | undefined;
          const timeoutPromise = new Promise<null>((resolve) => {
            searchTimer = setTimeout(() => resolve(null), 350);
          });
          const searchPromise = ptisSearchService.searchProperties({
            wardId: resolvedWardId,
            wardNo: !resolvedWardId ? wardNo : undefined,
            propertyNo: targetPropNo,
            partitionNo: '0',
          });
          const searchRes = await Promise.race([searchPromise, timeoutPromise]).finally(() => {
            if (searchTimer) clearTimeout(searchTimer);
          });
          if (searchRes && searchRes.success && searchRes.data && searchRes.data.length > 0) {
            const match = searchRes.data.find((p) => p.propertyNo === targetPropNo) || searchRes.data[0];
            const pid = Number(match.id || match.propertyId);
            if (pid && pid > 0 && pid !== propertyDetailsResult.propertyId) {
              mainSocietyPropertyId = pid;
            }
          }
        } catch {
          // Non-blocking search fallback
        }
      }

      if (mainSocietyPropertyId && mainSocietyPropertyId > 0) {
        try {
          let basicTimer: NodeJS.Timeout | undefined;
          const timeoutPromise = new Promise<null>((resolve) => {
            basicTimer = setTimeout(() => resolve(null), 350);
          });
          const basicPromise = ptisService.getPropertyBasicDetails(mainSocietyPropertyId);
          const mainBasicRes = await Promise.race([basicPromise, timeoutPromise]).finally(() => {
            if (basicTimer) clearTimeout(basicTimer);
          });
          if (mainBasicRes && mainBasicRes.success && mainBasicRes.data) {
            const mainCoords = extractCoordinates([mainBasicRes.data as unknown as Record<string, unknown>]);
            if (mainCoords.hasCoords) {
              societyLatitude = mainCoords.latitude;
              societyLongitude = mainCoords.longitude;
              societyCoordsCache.set(coordsCacheKey, {
                lat: societyLatitude,
                lng: societyLongitude,
                timestamp: Date.now(),
              });
            }
          }
        } catch {
          // Non-blocking basic details fetch fallback
        }
      }
    }
  }


  // 2. Delegate mapping and redirect checks to the mapping helper
  return mapPtisFetchResults({
    propertyDetailsResult,
    propertyListResult,
    detailResults,
    valuationTab,
    resolvedPropertyId,
    activeTab,
    criticalError,
    resolvedWardId,
    showFloorParam,
    showOldTaxParam,
    showMapDetailsParam,
    showDetailsParam,
    searchParams,
    locale,
    propertyIdParam,
    wardOptions,
    wings: fetchedWings,
    societyLatitude,
    societyLongitude,
  });
}
