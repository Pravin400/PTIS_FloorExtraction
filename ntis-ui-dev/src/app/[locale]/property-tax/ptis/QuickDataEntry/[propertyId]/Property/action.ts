'use server';

import {
  getPropertyBasicDetails,
  getPropertyCategories,
  getPropertyTypes,
  getWingMaster,
  getMoujaMaster,
  updatePropertyBasicDetails,
  getTaxZones,
  deletePropertyDetails,
} from '@/lib/api/ptis/propertybasicdetails/property-basic-details.service';

import { getTypeOfUseData } from '@/lib/api/ptis/floorSubmission';

import {
  PropertyBasicDetailsApiItem,
  PropertyCategoryApiItem,
  PropertyTypeApiItem,
  UpdatePropertyBasicDetailsDto,
  WingItem,
  MoujaItem,
  TaxZoneItem,
} from '@/types/property-basic-details.types';

import { ActionResult } from '@/types/common.types';
import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { ApiError } from '@/lib/utils/api';
import { getFloorSubmissionsByOwner } from '@/lib/api/ptis/floorSubmission';

async function getActionErrorMessage(error: unknown): Promise<string> {
  const t = await getTranslations('quickDataEntry');
  if (error instanceof Error && error.message) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes('fetch failed') ||
      msg.includes('failed to fetch') ||
      msg.includes('network error') ||
      msg.includes('econnrefused')
    ) {
      return t('property.errors.failedToConnect.description');
    }
    return error.message;
  }
  return t('property.errors.failedToConnect.description');
}

import { cache } from 'react';
import { patchIndividualProperty } from '@/lib/api/ptis/individual';

// Property Basic Details
export const getPropertyBasicDetailsAction = cache(async (
  propertyId: number
): Promise<ActionResult<PropertyBasicDetailsApiItem | null>> => {
  try {
    const data = await getPropertyBasicDetails(propertyId);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: await getActionErrorMessage(error) };
  }
});


// Property Categories
export async function getPropertyCategoriesAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string
): Promise<ActionResult<PropertyCategoryApiItem[]>> {
  try {
    const data = await getPropertyCategories(pageNumber, pageSize, searchTerm);
    return { success: true, data: data ?? [] };
  } catch (error) {
    return { success: false, error: await getActionErrorMessage(error) };
  }
}

// Property Types
export async function getPropertyTypesAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string
): Promise<ActionResult<PropertyTypeApiItem[]>> {
  try {
    const data = await getPropertyTypes(pageNumber, pageSize, searchTerm);
    return { success: true, data: data ?? [] };
  } catch (error) {
    return { success: false, error: await getActionErrorMessage(error) };
  }
}

// wing master
export async function getWingMasterAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string
): Promise<ActionResult<WingItem[]>> {
  try {
    const data = await getWingMaster(pageNumber, pageSize, searchTerm);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: await getActionErrorMessage(error) };
  }
}

// mouja master
export async function getMoujaMasterAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string
): Promise<ActionResult<MoujaItem[]>> {
  try {
    const data = await getMoujaMaster(pageNumber, pageSize, searchTerm);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: await getActionErrorMessage(error) };
  }
}

async function isIndividualCategory(categoryId: number | null): Promise<boolean> {
  if (!categoryId) return false;
  try {
    const categories = await getPropertyCategories(1, 100);
    const cat = categories.find((c) => c.id === categoryId);
    return cat?.propertyCategoryName?.toLowerCase() === 'individual';
  } catch {
    return false;
  }
}

//update property basic details
export const updatePropertyBasicDetailsAction = async (
  locale: string,
  propertyId: number,
  payload: UpdatePropertyBasicDetailsDto,
  shouldRevalidate: boolean = true
): Promise<ActionResult<null>> => {
  try {
    const result = await updatePropertyBasicDetails(propertyId, payload);
    if (result.success) {
      if (shouldRevalidate) {
        revalidatePath(`/${locale}/property-tax/ptis/QuickDataEntry/${propertyId}/Property`, 'page');
        revalidatePath(
          `/${locale}/property-tax/ptis/QuickDataEntry/${propertyId}/FloorSubmission`,
          'page'
        );
      }
      return result;
    }

    const isIndividual = await isIndividualCategory(payload.categoryId);

    if (isIndividual) {
      // Fallback: try PATCH individual property endpoint
      const patchRes = await patchIndividualProperty(propertyId, {
        categoryId: payload.categoryId,
        taxZoneId: payload.taxZoneId,
        moujaId: payload.moujaId,
        propertyTypeId: payload.propertyTypeId,
        surveyNo: payload.surveyNo,
        plotNo: payload.plotNo,
        flatOrShopNo: payload.flatOrShopNo,
      });

      if (patchRes.success) {
        if (shouldRevalidate) {
          revalidatePath(`/${locale}/property-tax/ptis/QuickDataEntry/${propertyId}/Property`, 'page');
          revalidatePath(`/${locale}/property-tax/ptis/individual`, 'page');
        }
        return { success: true, data: null };
      }
    }

    return result;
  } catch (error) {
    const isIndividual = await isIndividualCategory(payload.categoryId);
    if (isIndividual) {
      try {
        const patchRes = await patchIndividualProperty(propertyId, {
          categoryId: payload.categoryId,
          taxZoneId: payload.taxZoneId,
          moujaId: payload.moujaId,
          propertyTypeId: payload.propertyTypeId,
          surveyNo: payload.surveyNo,
          plotNo: payload.plotNo,
          flatOrShopNo: payload.flatOrShopNo,
        });
        if (patchRes.success) {
          if (shouldRevalidate) {
            revalidatePath(`/${locale}/property-tax/ptis/QuickDataEntry/${propertyId}/Property`, 'page');
            revalidatePath(`/${locale}/property-tax/ptis/individual`, 'page');
          }
          return { success: true, data: null };
        }
      } catch (_e) {
        // ignore
      }
    }
    return { success: false, error: await getActionErrorMessage(error) };
  }
};


// tax zone master
export async function getTaxZonesAction(
  pageNumber: number = 1,
  pageSize: number = 100,
  searchTerm?: string
): Promise<ActionResult<TaxZoneItem[]>> {
  try {
    const data = await getTaxZones(pageNumber, pageSize, searchTerm);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: await getActionErrorMessage(error) };
  }
}

// delete property details
export async function deletePropertyDetailsAction(propertyId: number): Promise<ActionResult<null>> {
  try {
    // Check if there are any floors/rooms/renters present
    const floors = await getFloorSubmissionsByOwner(propertyId);
    if (!floors || floors.length === 0) {
      // No details present, so do not call the delete API! Just return success.
      return { success: true, data: null };
    }

    const result = await deletePropertyDetails(propertyId);
    return result;
  } catch (error) {
    const normalizedMessage = (error instanceof Error ? error.message : '').toLowerCase();
    const isMissingDetailsMessage = [
      'not found',
      'no record',
      'not present',
      'not exist',
      'no floor',
      'no detail',
      'not available',
      'empty',
    ].some((needle) => normalizedMessage.includes(needle));

    const isNotFoundError =
      (error instanceof ApiError && error.statusCode === 404) ||
      (error instanceof ApiError && error.statusCode === 400 && isMissingDetailsMessage) ||
      (error instanceof Error && !(error instanceof ApiError) && isMissingDetailsMessage);

    if (isNotFoundError) {
      return { success: true, data: null };
    }
    return { success: false, error: await getActionErrorMessage(error) };
  }
}

// Validate existing floor compatibility with propertyTypeId
export async function validateFloorCompatibilityAction(
  propertyId: number,
  newPropertyTypeId?: number
): Promise<ActionResult<{ isCompatible: boolean; invalidCount: number }>> {
  try {
    const floors = await getFloorSubmissionsByOwner(propertyId);
    if (!floors || floors.length === 0) {
      return { success: true, data: { isCompatible: true, invalidCount: 0 } };
    }

    let targetPropertyTypeId = newPropertyTypeId;
    if (!targetPropertyTypeId) {
      const basicDetails = await getPropertyBasicDetails(propertyId);
      targetPropertyTypeId = basicDetails?.propertyTypeId ?? undefined;
    }

    if (!targetPropertyTypeId) {
      return { success: true, data: { isCompatible: true, invalidCount: 0 } };
    }

    const validUses = await getTypeOfUseData(targetPropertyTypeId);
    const validUseIds = new Set<string>(
      (validUses || []).map((u) => String(u.typeOfUseId || u.id || u.ID || ''))
    );
    const validUseDescs = new Set<string>();
    (validUses || []).forEach((u) => {
      const desc = String(u.description || '')
        .trim()
        .toLowerCase();
      const code = String(u.typeOfUseCode || u.code || '')
        .trim()
        .toLowerCase();
      if (desc) validUseDescs.add(desc);
      if (code) validUseDescs.add(code);
      if (code && desc) validUseDescs.add(`${code} - ${desc}`);
      if (code && desc) validUseDescs.add(`${code}-${desc}`);
    });

    let invalidCount = 0;
    for (const item of floors) {
      const floor = item as {
        typeOfUseId?: string | number;
        useId?: string | number;
        use?: string;
        usageDescription?: string;
        typeOfUseDescription?: string;
        isOpenPlot?: boolean | string | number;
        IsOpenPlot?: boolean | string | number;
        floorId?: string | number;
        floor?: string | number;
      };

      const isActualOpenPlot =
        floor.isOpenPlot === true ||
        floor.isOpenPlot === 'true' ||
        floor.isOpenPlot === 1 ||
        floor.IsOpenPlot === true ||
        floor.IsOpenPlot === 'true' ||
        floor.IsOpenPlot === 1 ||
        String(floor.floorId ?? floor.floor ?? '') === '77';

      // Neglect floor use check if floor is Open Plot
      if (isActualOpenPlot) continue;

      const floorUseId = String(floor.typeOfUseId ?? floor.useId ?? '').trim();
      const floorUseDesc = String(
        floor.use ?? floor.usageDescription ?? floor.typeOfUseDescription ?? ''
      )
        .trim()
        .toLowerCase();

      if (!floorUseId && !floorUseDesc) continue;

      const matchesId = floorUseId ? validUseIds.has(floorUseId) : false;
      const matchesDesc = floorUseDesc ? validUseDescs.has(floorUseDesc) : false;

      if (!matchesId && !matchesDesc) {
        invalidCount++;
      }
    }

    return {
      success: true,
      data: {
        isCompatible: invalidCount === 0,
        invalidCount,
      },
    };
  } catch (error) {
    return { success: false, error: await getActionErrorMessage(error) };
  }
}
