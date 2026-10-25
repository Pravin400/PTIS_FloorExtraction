'use server';

import { z } from 'zod';
import {
  SocietyPhotoTypeWithStatusDto,
  SocietyPhotoGalleryDto,
  SocietyPhotoDto,
} from '@/types/photoplan.types';
import { societyPhotoService } from '@/lib/api/ptis/photoplan/society-photo.service';

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

const idSchema = z.number().int().positive('ID must be a positive integer');

export async function getPhotosBySocietyAction(
  societyId: number
): Promise<ActionResult<SocietyPhotoDto[]>> {
  try {
    const validated = idSchema.parse(societyId);
    const result = await societyPhotoService.getPhotosBySociety(validated);
    if (result.success && result.data) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error || 'Failed to retrieve society photos' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve society photos',
    };
  }
}

export async function getSocietyPhotoTypesWithStatusAction(
  societyId: number
): Promise<ActionResult<SocietyPhotoTypeWithStatusDto[]>> {
  try {
    const validated = idSchema.parse(societyId);
    const result = await societyPhotoService.getPhotoTypesWithStatus(validated);
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

export async function getGroupedSocietyPhotosAction(
  societyId: number
): Promise<ActionResult<SocietyPhotoGalleryDto>> {
  try {
    const validated = idSchema.parse(societyId);
    const result = await societyPhotoService.getGroupedPhotosBySociety(validated);
    if (result.success && result.data) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error || 'Failed to retrieve grouped society photos' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve grouped society photos',
    };
  }
}

export async function deleteSocietyPhotoAction(
  documentGuid: string
): Promise<ActionResult<object>> {
  try {
    if (!documentGuid) {
      return { success: false, error: 'Valid Document GUID is required' };
    }

    const result = await societyPhotoService.deleteSocietyPhoto(documentGuid);

    if (result.success) {
      return { success: true, data: {}, message: 'Society photo deleted successfully' };
    }
    return { success: false, error: result.error || 'Delete failed' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete society photo',
    };
  }
}
