'use server';

import { photoPlanService } from '@/lib/api/ptis/photoplan/photoplan.service';
import { ActionResult } from '@/types/common.types';
import type { PropertyPhotoTypeWithStatusDto, PropertyPhotoDto } from '@/types/photoplan.types';

export async function getPhotoSlotsAction(
  propertyId: number
): Promise<ActionResult<PropertyPhotoTypeWithStatusDto[]>> {
  try {
    const [photoSlotsRes, photoTypesRes] = await Promise.all([
      photoPlanService.getPhotoTypesWithStatus(propertyId).catch(() => null),
      photoPlanService.getAllPropertyPhotoTypes('PROPERTY').catch(() => null),
    ]);

    const isSlotsOk = Boolean(photoSlotsRes?.success && Array.isArray(photoSlotsRes.data));
    const isTypesOk = Boolean(photoTypesRes?.success && Array.isArray(photoTypesRes.data));

    if (!isSlotsOk && !isTypesOk) {
      const errorMsg =
        (photoSlotsRes && !photoSlotsRes.success ? photoSlotsRes.error : null) ||
        (photoTypesRes && !photoTypesRes.success ? photoTypesRes.error : null) ||
        'Failed to retrieve photo types and slots';
      return { success: false, error: errorMsg };
    }

    const slots: PropertyPhotoTypeWithStatusDto[] =
      isSlotsOk && Array.isArray(photoSlotsRes?.data) ? [...photoSlotsRes.data] : [];

    if (photoTypesRes?.success && Array.isArray(photoTypesRes.data)) {
      photoTypesRes.data.forEach((pt) => {
        if (pt.isActive === false) return;
        const ptCode = (pt.photoTypeCode || '').toUpperCase();
        const existingIdx = slots.findIndex(
          (s) =>
            (s.photoTypeCode && s.photoTypeCode.toUpperCase() === ptCode) ||
            s.photoTypeId === pt.id
        );
        if (existingIdx === -1) {
          slots.push({
            photoTypeId: pt.id,
            photoTypeCode: pt.photoTypeCode,
            photoTypeName: pt.photoTypeName,
            photoScope: pt.photoScope || 'PROPERTY',
            displayOrder: pt.displayOrder || 1,
            hasPhoto: false,
            photoCount: 0,
          });
        }
      });
    }

    return { success: true, data: slots };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve photo types',
    };
  }
}

export async function getPropertyPhotosAction(
  propertyId: number
): Promise<ActionResult<PropertyPhotoDto[]>> {
  try {
    const photosRes = await photoPlanService.getPhotosByProperty(propertyId);
    if (!photosRes.success) {
      return { success: false, error: photosRes.error || 'Failed to fetch photos' };
    }
    return { success: true, data: photosRes.data || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve photos',
    };
  }
}
