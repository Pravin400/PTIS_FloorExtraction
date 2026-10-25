'use server';

import { photoPlanService } from '@/lib/api/ptis/photoplan/photoplan.service';
import { revalidatePath } from 'next/cache';
import { ActionResult } from '@/types/common.types';
import { z } from 'zod';

const createSchema = z.object({
  photoTypeCode: z.string().min(1),
  photoTypeName: z.string().min(1),
  displayOrder: z.number().optional(),
  description: z.string().max(500).optional(),
});

const idSchema = z.number().positive();

export async function getPropertyPhotoTypesByScopeAction(
  scope: string = 'PROPERTY'
): Promise<ActionResult<import('@/types/photoplan.types').PropertyPhotoTypeRecord[]>> {
  try {
    const result = await photoPlanService.getAllPropertyPhotoTypes(scope);
    if (result.success && result.data) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error || 'Failed to fetch property photo types' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch property photo types',
    };
  }
}

export async function createPropertyPhotoTypeAction(
  photoTypeCode: string,
  photoTypeName: string,
  displayOrder?: number,
  description?: string
): Promise<ActionResult<{ id: number }>> {
  try {
    const validated = createSchema.parse({ photoTypeCode, photoTypeName, displayOrder, description });
    const result = await photoPlanService.createPropertyPhotoType(
      validated.photoTypeCode,
      validated.photoTypeName,
      validated.displayOrder,
      validated.description
    );
    if (result.success && result.data) {
      revalidatePath('/[locale]/property-tax/ptis', 'page');
      return { success: true, data: result.data, message: 'Photo plan slot created successfully' };
    }
    return { success: false, error: result.error || 'Failed to create photo plan slot' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create photo plan slot',
    };
  }
}

export async function deletePropertyPhotoTypeAction(
  id: number
): Promise<ActionResult<object>> {
  try {
    const validated = idSchema.parse(id);
    const result = await photoPlanService.deletePropertyPhotoType(validated);
    if (result.success) {
      revalidatePath('/[locale]/property-tax/ptis', 'page');
      return { success: true, data: {}, message: 'Photo plan slot deleted successfully' };
    }
    return { success: false, error: result.error || 'Failed to delete photo plan slot' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete photo plan slot',
    };
  }
}

export async function purgePropertyPhotoTypeAction(
  id: number
): Promise<ActionResult<object>> {
  try {
    const validated = idSchema.parse(id);
    const result = await photoPlanService.purgePropertyPhotoType(validated);
    if (result.success) {
      revalidatePath('/[locale]/property-tax/ptis', 'page');
      return { success: true, data: {}, message: 'Photo plan slot purged successfully' };
    }
    return { success: false, error: result.error || 'Failed to purge photo plan slot' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to purge photo plan slot',
    };
  }
}
