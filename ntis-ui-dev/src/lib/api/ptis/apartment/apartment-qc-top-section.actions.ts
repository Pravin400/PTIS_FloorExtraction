'use server';

import {
  fetchApartmentQcTopSection,
  patchApartmentQcTopSection,
  fetchApartmentQcCertificateGrid,
  type ApartmentQcTopSectionDto,
  type UpdateApartmentQcTopSectionPayload,
  type FetchApartmentQcCertificateGridParams,
} from './apartment-qc-top-section.service';
import { mapApartmentQcTopSectionToPropertyMasterData } from './apartment-qc-top-section.mapper';
import { getPropertySocietyDetails } from '@/lib/api/property-society.service';
import { getCertificateTypeMaster } from '@/lib/api/building.service';
import type { PropertyMasterData } from '@/types/property-tax/apartment';
import { syncSocietyAndKycDetails } from './apartment-qc-top-section.sync';

export async function getApartmentQcTopSectionAction(
  propertyId: number | string
): Promise<{
  success: boolean;
  data?: PropertyMasterData;
  rawDto?: ApartmentQcTopSectionDto;
  error?: string;
}> {
  if (!propertyId) {
    return {
      success: false,
      error: 'Property identifier is missing. Please select a valid property.',
    };
  }

  const numPropId = Number(propertyId);

  const [topRes, socDetails] = await Promise.all([
    fetchApartmentQcTopSection(propertyId),
    numPropId > 0 ? getPropertySocietyDetails(numPropId).catch(() => null) : Promise.resolve(null),
  ]);

  if (topRes.success && topRes.data) {
    const mapped = mapApartmentQcTopSectionToPropertyMasterData(topRes.data, socDetails);
    return {
      success: true,
      data: {
        ...mapped,
        propertyId: !isNaN(numPropId) && numPropId > 0 ? numPropId : undefined,
      },
      rawDto: topRes.data,
    };
  }

  if (socDetails) {
    const mapped = mapApartmentQcTopSectionToPropertyMasterData(null, socDetails);
    return {
      success: true,
      data: {
        ...mapped,
        propertyId: numPropId,
      },
    };
  }

  return {
    success: false,
    error: topRes.error || 'Unable to load apartment details. Please refresh the page or try again later.',
  };
}

export async function updateApartmentQcTopSectionAction(
  propertyId: number | string,
  payload: UpdateApartmentQcTopSectionPayload
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  if (!propertyId) {
    return {
      success: false,
      error: 'Property identifier is missing. Please select a valid property to update.',
    };
  }

  const numPropId = Number(propertyId);
  const [patchRes, syncResult] = await Promise.all([
    patchApartmentQcTopSection(propertyId, payload),
    numPropId > 0 ? syncSocietyAndKycDetails(numPropId, payload) : Promise.resolve({ success: true }),
  ]);

  if (patchRes.success) {
    return patchRes;
  }

  if (syncResult && typeof syncResult === 'object' && 'success' in syncResult && syncResult.success) {
    return {
      success: true,
      message: 'Society details updated successfully.',
    };
  }

  return patchRes;
}

export async function getApartmentQcCertificateGridAction(
  params: FetchApartmentQcCertificateGridParams | number | string
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  return await fetchApartmentQcCertificateGrid(params);
}

export async function getPropertyCertificateTypeMasterAction(): Promise<{
  success: boolean;
  data?: unknown[];
  error?: string;
}> {
  const res = await getCertificateTypeMaster();
  return {
    success: res.success,
    data: res.data,
    error: res.message || res.error,
  };
}
