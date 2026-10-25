'use server';

import {
  getMaxTypeForSociety,
  getExistingTypesForSociety,
  setPropertyType,
  getPlanTypesForProperty,
  getNewPlanTypeForProperty,
  savePlanTypeForProperty,
} from '@/lib/api/property-type.service';
import { ActionResult } from '@/types/common.types';

function isValidPositiveInteger(id: unknown): boolean {
  if (id === null || id === undefined) return false;
  const str = String(id).trim();
  return /^\d+$/.test(str) && Number.isSafeInteger(Number(str)) && Number(str) > 0;
}

export async function getPlanTypesForPropertyAction(
  propertyId: number
): Promise<ActionResult<string[]>> {
  try {
    if (!isValidPositiveInteger(propertyId)) {
      return { success: true, data: [] };
    }
    const response = await getPlanTypesForProperty(propertyId);
    if (response.success) {
      const rawRes = response as unknown as Record<string, unknown>;
      const dataObj = typeof rawRes.data === 'object' && rawRes.data !== null ? (rawRes.data as Record<string, unknown>) : undefined;
      const rawItems = dataObj?.items ?? dataObj?.Items ?? rawRes.items ?? rawRes.Items ?? rawRes.data;
      const items = Array.isArray(rawItems) ? rawItems.map((x: unknown) => String(x)) : [];
      return { success: true, data: items };
    }
    return { success: false, error: response.error || response.message || 'Failed to fetch plan types' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred while fetching plan types',
    };
  }
}

export async function getNextPlanTypeAction(
  propertyId: number
): Promise<ActionResult<number>> {
  try {
    if (!isValidPositiveInteger(propertyId)) {
      return { success: false, error: 'Invalid PropertyId' };
    }
    const response = await getNewPlanTypeForProperty(propertyId);
    if (response.success) {
      const rawRes = response as unknown as Record<string, unknown>;
      const dataObj = typeof rawRes.data === 'object' && rawRes.data !== null ? (rawRes.data as Record<string, unknown>) : undefined;
      const rawVal = dataObj?.items ?? dataObj?.Items ?? rawRes.items ?? rawRes.Items ?? rawRes.data;
      if (rawVal !== undefined && rawVal !== null && !isNaN(Number(rawVal))) {
        return { success: true, data: Number(rawVal) };
      }
    }
    return { success: false, error: response.error || response.message || 'Failed to fetch next plan type' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred while fetching next plan type',
    };
  }
}

export async function savePlanTypeAction(
  propertyId: number,
  type: string | number
): Promise<ActionResult<{ propertyId: number; type: string }>> {
  try {
    if (!isValidPositiveInteger(propertyId)) {
      return { success: false, error: 'Invalid PropertyId' };
    }
    const typeStr = String(type).trim();
    if (!typeStr || typeStr === 'null') {
      return { success: false, error: 'Type is required' };
    }
    const response = await savePlanTypeForProperty(propertyId, typeStr);
    if (response.success) {
      return {
        success: true,
        data: { propertyId, type: typeStr },
        message: 'Plan type saved successfully',
      };
    }
    // Fallback to legacy setPropertyType if 404 or endpoint unavailable
    const fallbackRes = await setPropertyType(propertyId, typeStr);
    if (fallbackRes.success) {
      return {
        success: true,
        data: { propertyId, type: typeStr },
        message: 'Plan type updated successfully',
      };
    }

    return {
      success: false,
      error: response.error || response.message || fallbackRes.error || 'Failed to save plan type',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred while saving plan type',
    };
  }
}

export async function getMaxTypeForSocietyAction(
  societyDetailId: number
): Promise<ActionResult<{ maxType: number }>> {
  try {
    if (!societyDetailId || societyDetailId <= 0) {
      return { success: false, error: 'Invalid SocietyDetailId' };
    }
    const response = await getMaxTypeForSociety(societyDetailId);
    if (response.success && response.data) {
      const maxType = typeof response.data === 'number'
        ? response.data
        : (response.data.maxType ?? (response as unknown as { maxType?: number }).maxType ?? 1);
      return { success: true, data: { maxType } };
    }
    return { success: false, error: response.error || 'Failed to fetch max type' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred while fetching max type',
    };
  }
}

export async function getExistingTypesAction(
  societyDetailId?: number | null,
  wingDetailId?: number | null
): Promise<ActionResult<string[]>> {
  try {
    if ((!societyDetailId || societyDetailId <= 0) && (!wingDetailId || wingDetailId <= 0)) {
      return { success: true, data: [] };
    }
    const response = await getExistingTypesForSociety(societyDetailId || 0, wingDetailId);
    if (response.success) {
      const rawRes = response as unknown as Record<string, unknown>;
      const items = Array.isArray(rawRes.items)
        ? rawRes.items
        : Array.isArray(rawRes.data)
        ? rawRes.data
        : [];
      return { success: true, data: items };
    }
    return { success: false, error: response.error || response.message || 'Failed to fetch existing types' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred while fetching existing types',
    };
  }
}

export async function setPropertyTypeAction(
  propertyId: number,
  type: string | number
): Promise<ActionResult<{ propertyId: number; type: string }>> {
  return savePlanTypeAction(propertyId, type);
}

