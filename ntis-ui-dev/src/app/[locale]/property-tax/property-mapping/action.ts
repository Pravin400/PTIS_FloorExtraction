'use server';

import {
  MappedPropertyApiResponse,
  SearchOldPropertiesApiResponse,
  SearchOldPropertiesParams,
} from "@/types/property-mapping";
import {
  getMappedProperties,
  searchOldProperties,
  savePropertyMapping,
  SavePropertyMappingPayload,
  mergeSingleProperty,
  mergeMultipleProperties,
  unmergeSingleProperty,
  unmergeMultipleProperties,
} from "@/lib/api/property-mapping/property-mapping.service";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getUserIdFromCookies } from "@/lib/utils/cookie";

const SUPPORTED_LOCALES = ['en', 'hi', 'mr'];

function revalidatePtisPages() {
  try {
    for (const loc of SUPPORTED_LOCALES) {
      revalidatePath(`/${loc}/property-tax/ptis/individual`, 'page');
      revalidatePath(`/${loc}/property-tax/ptis/apartment`, 'page');
      revalidatePath(`/${loc}/property-tax/ptis`, 'page');
    }
    revalidatePath('/[locale]/property-tax/ptis/individual', 'page');
    revalidatePath('/[locale]/property-tax/ptis/apartment', 'page');
    revalidatePath('/[locale]/property-tax/ptis', 'page');
    revalidatePath('/[locale]/property-tax/ptis', 'layout');
  } catch {
    // Graceful fallback in non-request contexts
  }
}

/**
 * Server action to fetch mapped property details by PropertyId.
 * Delegates to property-mapping service layer.
 */
export async function getMappedPropertiesAction(
  propertyId: number,
  pageSize: number = -1
): Promise<MappedPropertyApiResponse | null> {
  return await getMappedProperties(propertyId, pageSize);
}

/**
 * Server action to search old property candidates by structured query parameters or search term.
 * Delegates to property-mapping service layer.
 */
export async function searchOldPropertiesAction(
  params: SearchOldPropertiesParams
): Promise<SearchOldPropertiesApiResponse | null> {
  return await searchOldProperties(params);
}

/**
 * Server action to save/confirm a property mapping link or unmapped status.
 * Delegates to property-mapping service layer.
 */
export async function savePropertyMappingAction(
  payload: SavePropertyMappingPayload
): Promise<{ success: boolean; message?: string } | null> {
  const result = await savePropertyMapping(payload);
  if (result?.success) {
    revalidatePtisPages();
  }
  return result;
}

/**
 * Server action to merge exactly 1 New Property and 1 Old Property.
 * Delegates to property-mapping service layer.
 */
export async function mergeSinglePropertyAction(payload: {
  propertyId: number;
  propertyOldId: number;
  latitude?: string;
  longitude?: string;
  location?: string;
}): Promise<{ success: boolean; message?: string; items?: { success: boolean; message?: string } } | null> {
  const cookieStore = await cookies();
  const userId = getUserIdFromCookies(cookieStore) || 1;
  const result = await mergeSingleProperty({
    ...payload,
    CreatedBy: userId,
  });
  if (result?.success || result?.items?.success) {
    revalidatePtisPages();
  }
  return result;
}

/**
 * Server action to merge 1 New Property to Multiple Old Properties.
 * Delegates to property-mapping service layer.
 */
export async function mergeMultiplePropertiesAction(payload: {
  propertyId: number;
  propertyOldIds: number[];
  latitude?: string;
  longitude?: string;
  location?: string;
}): Promise<{ success: boolean; message?: string; items?: { success: boolean; message?: string } } | null> {
  const cookieStore = await cookies();
  const userId = getUserIdFromCookies(cookieStore) || 1;
  const result = await mergeMultipleProperties({
    ...payload,
    CreatedBy: userId,
  });
  if (result?.success || result?.items?.success) {
    revalidatePtisPages();
  }
  return result;
}

/**
 * Server action to unmerge exactly 1 New Property and 1 Old Property.
 * Delegates to property-mapping service layer.
 */
export async function unmergeSinglePropertyAction(payload: {
  propertyId: number;
  propertyOldId: number;
}): Promise<{ success: boolean; message?: string; items?: { success: boolean; message?: string } } | null> {
  const cookieStore = await cookies();
  const userId = getUserIdFromCookies(cookieStore) || 1;
  const result = await unmergeSingleProperty({
    ...payload,
    isActive: true,
    isPreviousDataUpdate: true,
    updatedBy: userId,
  });
  if (result?.success || result?.items?.success) {
    revalidatePtisPages();
  }
  return result;
}

/**
 * Server action to unmerge 1 New Property and Multiple Old Properties.
 * Delegates to property-mapping service layer.
 */
export async function unmergeMultiplePropertiesAction(payload: {
  propertyId: number;
  propertyOldIds: number[];
}): Promise<{ success: boolean; message?: string; items?: { success: boolean; message?: string } } | null> {
  const cookieStore = await cookies();
  const userId = getUserIdFromCookies(cookieStore) || 1;
  const result = await unmergeMultipleProperties({
    ...payload,
    isActive: true,
    isPreviousDataUpdate: true,
    updatedBy: userId,
  });
  if (result?.success || result?.items?.success) {
    revalidatePtisPages();
  }
  return result;
}
