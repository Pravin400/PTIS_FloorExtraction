'use server';

import {
  getPropertyReassessment,
  getRetrospectiveTaxDetails,
  mapFloorDetailsToDisplay,
  mapRetrospectiveToTable,
  mapTaxSummaryToRows,
} from '@/lib/api/ptis/reassessment/reassessment.service';
import type { ActionResult } from '@/types/common.types';
import type {
  ReassessmentData,
  ReassessmentParams,
  MappedFloorDetail,
  ReassessmentTaxRow,
  RetrospectiveTaxData,
  MappedRetrospectiveColumn,
  MappedRetrospectiveRow,
  ReassessmentPhoto,
} from '@/types/reassessment.types';
import { handleServerError } from '@/lib/utils/server-action-error-handler';

/**
 * Validates reassessment parameters
 */
function validateReassessmentParams(
  wardId: number | string | undefined | null,
  propertyNo: string | undefined | null
): { valid: false; error: string } | { valid: true; params: ReassessmentParams; partitionNo?: string } {
  // Validate wardId
  const wardIdNum = typeof wardId === 'string' ? parseInt(wardId, 10) : wardId;
  
  if (!wardIdNum || isNaN(wardIdNum) || wardIdNum <= 0) {
    return {
      valid: false,
      error: 'Valid Ward ID is required for reassessment data',
    };
  }

  // Validate propertyNo
  if (!propertyNo || propertyNo.trim() === '') {
    return {
      valid: false,
      error: 'Property Number is required for reassessment data',
    };
  }

  return {
    valid: true,
    params: {
      wardId: wardIdNum,
      propertyNo: propertyNo.trim(),
    },
  };
}

/**
 * Server action to fetch property reassessment data
 * 
 * @param wardId - The ward ID (required)
 * @param propertyNo - The property number (required)
 * @param partitionNo - The partition number (optional, required when property has partitions)
 * @returns Promise containing reassessment data or error
 */
export async function getReassessmentDataAction(
  wardId: number | string,
  propertyNo: string,
  partitionNo?: string
): Promise<ActionResult<ReassessmentData>> {
  try {
    const validation = validateReassessmentParams(wardId, propertyNo);

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const params: ReassessmentParams = {
      ...validation.params,
      partitionNo: partitionNo?.trim() || undefined,
    };

    const result = await getPropertyReassessment(params);

    return result;
  } catch (error: unknown) {
    return handleServerError<ReassessmentData>(error, 'fetching reassessment data');
  }
}

/**
 * Mapped reassessment data for UI consumption
 */
export interface MappedReassessmentData {
  propertyId: number;
  propertyOldId: number;
  oldFloorDetails: MappedFloorDetail[];
  newFloorDetails: MappedFloorDetail[];
  taxColumns: { key: string; label: string; displayOrder: number }[];
  taxRows: ReassessmentTaxRow[];
  photos: ReassessmentPhoto[];
}

/**
 * Server action to fetch and map reassessment data for UI display
 * 
 * @param wardId - The ward ID (required)
 * @param propertyNo - The property number (required)
 * @param partitionNo - The partition number (optional)
 * @returns Promise containing mapped reassessment data ready for UI
 */
export async function getMappedReassessmentDataAction(
  wardId: number | string,
  propertyNo: string,
  partitionNo?: string
): Promise<ActionResult<MappedReassessmentData>> {
  try {
    const result = await getReassessmentDataAction(wardId, propertyNo, partitionNo);

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Failed to fetch reassessment data',
      };
    }

    const data = result.data;

    // Map floor details for display
    const oldFloorDetails = mapFloorDetailsToDisplay(data.oldFloorDetails, 'OLD');
    const newFloorDetails = mapFloorDetailsToDisplay(data.newFloorDetails, 'NEW');

    // Map tax summary for dynamic table
    const { columns: taxColumns, rows: taxRows } = mapTaxSummaryToRows(data.taxSummary);

    return {
      success: true,
      data: {
        propertyId: data.propertyId,
        propertyOldId: data.propertyOldId,
        oldFloorDetails,
        newFloorDetails,
        taxColumns,
        taxRows,
        photos: data.photos,
      },
      message: result.message,
    };
  } catch (error: unknown) {
    return handleServerError<MappedReassessmentData>(error, 'mapping reassessment data');
  }
}

export interface MappedRetrospectiveData {
  propertyId: number;
  columns: MappedRetrospectiveColumn[];
  rows: MappedRetrospectiveRow[];
}

export async function getRetrospectiveTaxDataAction(
  wardId: number | string,
  propertyNo: string,
  partitionNo?: string
): Promise<ActionResult<RetrospectiveTaxData>> {
  try {
    const validation = validateReassessmentParams(wardId, propertyNo);

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const params: ReassessmentParams = {
      ...validation.params,
      partitionNo: partitionNo?.trim() || undefined,
    };

    return getRetrospectiveTaxDetails(params);
  } catch (error: unknown) {
    return handleServerError<RetrospectiveTaxData>(error, 'fetching retrospective tax details');
  }
}

export async function getMappedRetrospectiveTaxDataAction(
  wardId: number | string,
  propertyNo: string,
  partitionNo?: string
): Promise<ActionResult<MappedRetrospectiveData>> {
  try {
    const result = await getRetrospectiveTaxDataAction(wardId, propertyNo, partitionNo);

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Failed to fetch retrospective tax data',
      };
    }

    const mapped = mapRetrospectiveToTable(result.data);

    return {
      success: true,
      data: {
        propertyId: result.data.propertyId,
        columns: mapped.columns,
        rows: mapped.rows,
      },
      message: result.message,
    };
  } catch (error: unknown) {
    return handleServerError<MappedRetrospectiveData>(error, 'mapping retrospective tax data');
  }
}
