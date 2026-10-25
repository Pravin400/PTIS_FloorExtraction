'use server';

import { fetchIndividualQcTopSection, patchIndividualProperty } from './individual-property.service';
import { mapIndividualPropertyDtoToMasterData } from './individual-property.mapper';
import { fetchApartmentQcTopSection } from '@/lib/api/ptis/apartment/apartment-qc-top-section.service';
import { mapApartmentQcTopSectionToPropertyMasterData } from '@/lib/api/ptis/apartment/apartment-qc-top-section.mapper';
import { getPropertySocietyDetails } from '@/lib/api/property-society.service';
import { revalidatePath } from 'next/cache';
import type {
  IndividualPropertyMasterData,
  IndividualPropertyDto,
  IndividualPatchPayload,
} from '@/types/property-tax/individual';

export async function getIndividualQcTopSectionAction(
  propertyId: number | string
): Promise<{
  success: boolean;
  data?: IndividualPropertyMasterData;
  rawDto?: IndividualPropertyDto | unknown;
  error?: string;
}> {
  if (!propertyId) {
    return {
      success: false,
      error: 'Property identifier is missing. Please select a valid property.',
    };
  }

  const numPropId = Number(propertyId);

  // 1. Primary: Fetch from dedicated Individual Property API
  const individualRes = await fetchIndividualQcTopSection(propertyId);
  if (individualRes.success && individualRes.data) {
    const mapped = mapIndividualPropertyDtoToMasterData(individualRes.data);
    return {
      success: true,
      data: {
        ...mapped,
        propertyId: !isNaN(numPropId) && numPropId > 0 ? numPropId : mapped.propertyId,
      },
      rawDto: individualRes.data,
    };
  }

  // 2. Secondary Fallback: Try general apartment/QC top section if available
  const [topRes, socDetails] = await Promise.all([
    fetchApartmentQcTopSection(propertyId).catch(() => null),
    numPropId > 0 ? getPropertySocietyDetails(numPropId).catch(() => null) : Promise.resolve(null),
  ]);

  if (topRes?.success && topRes.data) {
    const mapped = mapApartmentQcTopSectionToPropertyMasterData(topRes.data);
    return {
      success: true,
      data: {
        ...mapped,
        propertyId: !isNaN(numPropId) && numPropId > 0 ? numPropId : undefined,
      } as IndividualPropertyMasterData,
      rawDto: topRes.data,
    };
  }

  if (socDetails) {
    return {
      success: true,
      data: {
        propertyNo: '-',
        upic: '-',
        societyName: socDetails.societyName || '-',
        ownerName: socDetails.landOwnerName || '-',
        status: 'ACTIVE PROPERTY',
        category: '-',
        propertyDescriptionRegional: '-',
        division: '-',
        taxZone: '-',
        taxZoneAndName: '-',
        subZoneCsnNo: '-',
        plotNo: '-',
        address: socDetails.societyAddress || '-',
        societyAddress: socDetails.societyAddress || '-',
        plotArea: '-',
        carpetBuiltUpArea: '-',
        oldCarpetBuiltUp: '-',
        totalFloors: '-',
        totalPropertiesResCommAmen: '-',
        secretaryName: socDetails.secretaryName || '-',
        secretaryMobileNo: socDetails.secretaryMobileNo || '-',
        secretaryEmail: socDetails.secretaryEmailId || '-',
        builderName: socDetails.builderName || '-',
        landOwnerName: socDetails.landOwnerName || '-',
        societyEmail: socDetails.societyEmailId || '-',
        propertyId: numPropId,
      },
    };
  }

  return {
    success: false,
    error: individualRes.error || topRes?.error || 'Unable to load property details. Please refresh the page or try again later.',
  };
}

export async function patchIndividualPropertyAction(
  propertyId: number | string,
  payload: IndividualPatchPayload,
  locale?: string
): Promise<{ success: boolean; message?: string; data?: unknown; error?: string }> {
  try {
    if (!propertyId) {
      return { success: false, error: 'Property identifier is required' };
    }

    const res = await patchIndividualProperty(propertyId, payload);
    if (!res.success) {
      return { success: false, error: res.error || 'Failed to update property details' };
    }

    if (locale) {
      revalidatePath(`/${locale}/property-tax/ptis/individual`, 'page');
      revalidatePath(`/${locale}/property-tax/ptis/QuickDataEntry/${propertyId}/Property`, 'page');
      revalidatePath(`/${locale}/property-tax/ptis/QuickDataEntry/${propertyId}/Kyc`, 'page');
    }

    return {
      success: true,
      message: 'Property details updated successfully',
      data: res.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred while updating property details',
    };
  }
}
