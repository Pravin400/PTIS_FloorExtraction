'use server';

import { z } from 'zod';
import {
  WingPhotoTypeWithStatusDto,
  WingPhotoGalleryDto,
  WingPhotoDto,
} from '@/types/photoplan.types';
import { wingPhotoService } from '@/lib/api/ptis/photoplan/wing-photo.service';

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

const idSchema = z.number().int().positive('ID must be a positive integer');

export async function getPhotosByWingAction(
  wingId: number
): Promise<ActionResult<WingPhotoDto[]>> {
  try {
    const validated = idSchema.parse(wingId);
    const result = await wingPhotoService.getPhotosByWing(validated);
    if (result.success && result.data) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error || 'Failed to retrieve wing photos' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve wing photos',
    };
  }
}

export async function getWingPhotoTypesWithStatusAction(
  wingId: number
): Promise<ActionResult<WingPhotoTypeWithStatusDto[]>> {
  try {
    const validated = idSchema.parse(wingId);
    const result = await wingPhotoService.getPhotoTypesWithStatus(validated);
    if (result.success && result.data) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error || 'Failed to retrieve photo types with status' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve photo types with status',
    };
  }
}

export async function getGroupedWingPhotosAction(
  wingId: number
): Promise<ActionResult<WingPhotoGalleryDto>> {
  try {
    const validated = idSchema.parse(wingId);
    const result = await wingPhotoService.getGroupedPhotosByWing(validated);
    if (result.success && result.data) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error || 'Failed to retrieve grouped wing photos' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve grouped wing photos',
    };
  }
}

export async function deleteWingPhotoAction(
  documentGuid: string
): Promise<ActionResult<object>> {
  try {
    if (!documentGuid) {
      return { success: false, error: 'Valid Document GUID is required' };
    }

    const result = await wingPhotoService.deleteWingPhoto(documentGuid);

    if (result.success) {
      return { success: true, data: {}, message: 'Wing photo deleted successfully' };
    }
    return { success: false, error: result.error || 'Delete failed' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete wing photo',
    };
  }
}
