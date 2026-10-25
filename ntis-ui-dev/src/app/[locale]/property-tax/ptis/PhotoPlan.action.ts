'use server';

import { photoPlanService, invalidatePhotoPlanCache } from '@/lib/api/ptis/photoplan/photoplan.service';
import { deleteDocument } from '@/lib/api/document.service';
import { getPropertySocietyDetails } from '@/lib/api/property-society.service';
import { ActionResult } from '@/types/common.types';
import type { 
  PropertyPhotoDto, 
  PropertyPhotoUploadResponseDto,
  PropertyPhotoGalleryDto
} from '@/types/photoplan.types';
import { z } from 'zod';
import { getTranslations } from 'next-intl/server';
const idSchema = z.number().positive();

export async function getGroupedPhotosAction(
  propertyId: number,
  locale?: string
): Promise<ActionResult<PropertyPhotoGalleryDto>> {
  const t = await getTranslations({ locale: locale || 'en', namespace: 'ptis' });
  try {
    const validated = idSchema.parse(propertyId);
    const result = await photoPlanService.getGroupedPhotosByProperty(validated);
    if (result.success && result.data) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error || t('media.failedToRetrieveGrouped') || 'Failed to retrieve grouped photos' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : (t('media.failedToRetrieveGrouped') || 'Failed to retrieve grouped photos'),
    };
  }
}

export async function getPhotosByCategoryAction(
  propertyId: number,
  photoTypeId: number,
  locale?: string
): Promise<ActionResult<PropertyPhotoDto[]>> {
  const t = await getTranslations({ locale: locale || 'en', namespace: 'ptis' });
  try {
    const validatedPropertyId = idSchema.parse(propertyId);
    const validatedPhotoTypeId = idSchema.parse(photoTypeId);
    const result = await photoPlanService.getPhotosByProperty(validatedPropertyId);
    if (result.success && result.data) {
      const filtered = result.data.filter(p => p.photoTypeId === validatedPhotoTypeId);
      return { success: true, data: filtered };
    }
    return { success: false, error: result.error || t('media.failedToRetrieveCategory') || 'Failed to retrieve photos' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : (t('media.failedToRetrieveCategory') || 'Failed to retrieve category photos'),
    };
  }
}

export async function getPhotosByPropertyAction(
  propertyId: number,
  locale?: string
): Promise<ActionResult<PropertyPhotoDto[]>> {
  const t = await getTranslations({ locale: locale || 'en', namespace: 'ptis' });
  try {
    const validated = idSchema.parse(propertyId);
    const result = await photoPlanService.getPhotosByProperty(validated);
    if (result.success && result.data) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error || t('media.failedToRetrieve') || 'Failed to retrieve photos' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : (t('media.failedToRetrieve') || 'Failed to retrieve photos'),
    };
  }
}

export async function uploadPropertyPhotoAction(
  formData: FormData,
  locale?: string
): Promise<ActionResult<PropertyPhotoUploadResponseDto>> {
  const t = await getTranslations({ locale: locale || 'en', namespace: 'ptis' });
  try {
    const file = formData.get('File') as File;
    const propertyId = Number(formData.get('PropertyId'));
    const photoTypeId = Number(formData.get('PhotoTypeId'));
    const propertyPhotoId = Number(formData.get('PropertyPhotoId') || '0');
    const remarks = String(formData.get('Remarks') || '');
    const photoTypeCode = formData.get('PhotoTypeCode') as string | null;
    const wingDetailId = Number(formData.get('WingDetailId') || '0');
    const societyId = Number(formData.get('SocietyDetailId') || '0');
    const wingName = formData.get('WingName') as string | null;

    const displayOrder = Number(formData.get('DisplayOrder') || '1');

    const isSocietyPhoto = Boolean(photoTypeCode?.toUpperCase().includes('SOCIETY'));
    const isWingPhoto = Boolean(photoTypeCode?.toUpperCase().includes('WING'));

    if (isSocietyPhoto && (!societyId || isNaN(societyId) || societyId <= 0)) {
      return { success: false, error: t('media.societyIdRequired') || 'Society details are not available for this property to upload society photos.' };
    }
    if (isWingPhoto && (!wingDetailId || isNaN(wingDetailId) || wingDetailId <= 0)) {
      return { success: false, error: t('media.wingDetailIdRequired') || 'Wing details are not available for this property to upload wing photos.' };
    }

    if (!file || file.size === 0) {
      return { success: false, error: t('media.fileRequired') || 'File is required' };
    }
    if (!propertyId || isNaN(propertyId)) {
      return { success: false, error: t('media.propertyIdRequired') || 'Valid PropertyId is required' };
    }
    if (!photoTypeId || isNaN(photoTypeId)) {
      return { success: false, error: t('media.photoTypeIdRequired') || 'Valid PhotoTypeId is required' };
    }

    const result = await photoPlanService.uploadPhotoViaGlobalApi(
      file,
      propertyId,
      photoTypeId,
      propertyPhotoId,
      displayOrder,
      remarks,
      photoTypeCode || undefined,
      wingDetailId || undefined,
      societyId || undefined,
      wingName || undefined
    );

    if (result.success && result.data) {
      invalidatePhotoPlanCache(propertyId);
      return { success: true, data: result.data, message: t('media.photoUploadedSuccess') || 'Photo uploaded successfully' };
    }
    return { success: false, error: result.error || t('media.failedToUpload') || 'Upload failed' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : (t('media.failedToUpload') || 'Failed to upload photo'),
    };
  }
}

export async function replacePropertyPhotoAction(
  propertyPhotoId: number,
  oldDocumentGuid: string,
  formData: FormData,
  locale?: string
): Promise<ActionResult<PropertyPhotoUploadResponseDto>> {
  const t = await getTranslations({ locale: locale || 'en', namespace: 'ptis' });
  try {
    const file = formData.get('File') as File;
    const propertyId = Number(formData.get('PropertyId'));
    const photoTypeId = Number(formData.get('PhotoTypeId'));
    const referenceTableIdGuid = formData.get('ReferenceTableIdGuid') as string | null;
    const remarks = String(formData.get('Remarks') || '');
    const photoTypeCode = formData.get('PhotoTypeCode') as string | null;
    const wingDetailId = Number(formData.get('WingDetailId') || '0');
    const societyId = Number(formData.get('SocietyDetailId') || '0');
    const wingName = formData.get('WingName') as string | null;

    const isSocietyPhoto = Boolean(photoTypeCode?.toUpperCase().includes('SOCIETY'));
    const isWingPhoto = Boolean(photoTypeCode?.toUpperCase().includes('WING'));

    if (isSocietyPhoto && (!societyId || isNaN(societyId) || societyId <= 0)) {
      return { success: false, error: t('media.societyIdRequired') || 'Society details are not available for this property to upload society photos.' };
    }
    if (isWingPhoto && (!wingDetailId || isNaN(wingDetailId) || wingDetailId <= 0)) {
      return { success: false, error: t('media.wingDetailIdRequired') || 'Wing details are not available for this property to upload wing photos.' };
    }

    if (!propertyId || isNaN(propertyId)) {
      return { success: false, error: t('media.propertyIdRequired') || 'Valid PropertyId is required' };
    }
    if (propertyPhotoId === undefined || propertyPhotoId === null || isNaN(propertyPhotoId) || propertyPhotoId < 0) {
      return { success: false, error: t('media.propertyPhotoIdRequired') || 'Valid PropertyPhotoId is required' };
    }
    if (!file || file.size === 0) {
      return { success: false, error: t('media.fileRequired') || 'File is required' };
    }

    const result = await photoPlanService.replacePhotoViaGlobalApi(
      file,
      oldDocumentGuid,
      propertyId,
      photoTypeId,
      propertyPhotoId,
      referenceTableIdGuid || undefined,
      remarks,
      photoTypeCode || undefined,
      wingDetailId || undefined,
      societyId || undefined,
      wingName || undefined
    );

    if (result.success && result.data) {
      invalidatePhotoPlanCache(propertyId);
      return { success: true, data: result.data, message: t('media.photoReplacedSuccess') || 'Photo replaced successfully' };
    }
    return { success: false, error: result.error || t('media.failedToReplace') || 'Replace failed' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : (t('media.failedToReplace') || 'Failed to replace photo'),
    };
  }
}

export async function deletePropertyPhotoAction(
  documentGuid: string,
  locale?: string
): Promise<ActionResult<object>> {
  const t = await getTranslations({ locale: locale || 'en', namespace: 'ptis' });
  try {
    if (!documentGuid || typeof documentGuid !== 'string' || !documentGuid.trim()) {
      return { success: false, error: t('media.propertyPhotoIdRequired') || 'Valid Document GUID is required' };
    }

    const cleanGuid = documentGuid.trim();
    const result = await deleteDocument(cleanGuid);

    if (result.success || result.statusCode === 404) {
      invalidatePhotoPlanCache();
      return { success: true, data: {}, message: t('media.photoDeletedSuccess') || 'Photo deleted successfully' };
    }
    if (result.statusCode === 403) {
      return { success: false, error: t('media.deletePermissionDenied') || 'You do not have permission to delete this photo' };
    }
    return { success: false, error: result.error || t('media.failedToDelete') || 'Failed to delete photo' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : (t('media.failedToDelete') || 'Failed to delete photo'),
    };
  }
}

export async function updatePropertyPhotoTypeAction(
  id: number,
  photoTypeCode: string,
  photoTypeName: string,
  locale?: string
): Promise<ActionResult<object>> {
  const t = await getTranslations({ locale: locale || 'en', namespace: 'ptis' });
  try {
    const result = await photoPlanService.updatePropertyPhotoType(id, photoTypeCode, photoTypeName);
    if (result.success) {
      return { success: true, data: {}, message: t('media.renameSuccess') || 'Photo plan name updated successfully' };
    }
    return { success: false, error: result.error || t('media.failedToRename') || 'Failed to rename photo plan' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : (t('media.failedToRename') || 'Failed to rename photo plan'),
    };
  }
}

export async function launchPhotoPlanDrawingToolAction(
  propertyId: number,
  councilName: string,
  returnUrl: string,
  ptisUsername?: string,
  ptisDisplayName?: string,
  ptisUserId?: string,
  wardNo?: string,
  propertyNo?: string,
  partitionNo?: string | null,
  ptisBackendUri?: string,
  type?: string | number | null,
  isAmenity?: boolean,
  entityType?: string | null,
  societyDetailId?: number | null,
  wingDetailId?: number | null,
  photoTypeId?: number | null
): Promise<ActionResult<{ launchUrl: string; planName?: string }>> {
  try {
    let resolvedSocietyDetailId = (societyDetailId !== undefined && societyDetailId !== null && Number(societyDetailId) > 0)
      ? Number(societyDetailId)
      : (societyDetailId === undefined ? undefined : null);
    let resolvedWingDetailId = (wingDetailId !== undefined && wingDetailId !== null && Number(wingDetailId) > 0)
      ? Number(wingDetailId)
      : (wingDetailId === undefined ? undefined : null);

    const isAmenityProp = Boolean(isAmenity) || (type !== undefined && type !== null && Number(type) === 140);
    const cleanPartition = partitionNo && partitionNo !== '0' && partitionNo !== '-' && partitionNo !== 'null' ? partitionNo : null;
    const targetEntityType = entityType !== undefined
      ? entityType
      : (isAmenityProp ? 'S' : (cleanPartition ? 'P' : (wingDetailId ? 'W' : societyDetailId ? 'S' : undefined)));

    // Automatically resolve missing societyDetailId / wingDetailId for entityType 'S' or amenity properties
    if ((!resolvedSocietyDetailId || Number(resolvedSocietyDetailId) <= 0) && propertyId && propertyId > 0 && (targetEntityType === 'S' || isAmenityProp)) {
      try {
        const socDetails = await getPropertySocietyDetails(propertyId);
        if (socDetails && socDetails.societyDetailId && Number(socDetails.societyDetailId) > 0) {
          resolvedSocietyDetailId = Number(socDetails.societyDetailId);
        }
        if (!resolvedWingDetailId && socDetails && socDetails.wingId && Number(socDetails.wingId) > 0) {
          resolvedWingDetailId = Number(socDetails.wingId);
        }
      } catch {
        // Non-blocking lookup fallback
      }
    }

    const effectiveCouncilName =
      (councilName && councilName.trim() !== '' ? councilName : undefined) ??
      process.env.NEXT_PUBLIC_COUNCIL_NAME ??
      process.env.COUNCIL_NAME ??
      'THANE_survey';

    const result = await photoPlanService.launchDrawingTool({
      propertyId,
      councilName: effectiveCouncilName,
      returnUrl,
      ptisUsername,
      ptisDisplayName,
      ptisUserId,
      wardNo,
      propertyNo,
      partitionNo: cleanPartition,
      ptisBackendUri,
      type,
      isAmenity,
      entityType: targetEntityType,
      societyDetailId: resolvedSocietyDetailId,
      wingDetailId: resolvedWingDetailId,
      photoTypeId,
    });

    if (result.success && result.launchUrl) {
      return { success: true, data: { launchUrl: result.launchUrl, planName: result.planName } };
    }

    return {
      success: false,
      error: result.error || 'Failed to retrieve launch URL from drawing tool service.'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred while launching drawing tool.',
    };
  }
}

export async function syncPhotoPlanFromDrawingToolAction(
  propertyId: number,
  options?: {
    wardNo?: string;
    propertyNo?: string;
    partitionNo?: string | null;
    councilName?: string;
    photoTypeId?: number;
    entityType?: string | null;
    societyDetailId?: number | null;
    wingDetailId?: number | null;
    wingName?: string;
    planName?: string;
  },
  locale?: string
): Promise<ActionResult<PropertyPhotoUploadResponseDto>> {
  const t = await getTranslations({ locale: locale || 'en', namespace: 'ptis' });
  try {
    const validated = idSchema.parse(propertyId);
    const result = await photoPlanService.syncPlanFromDrawingTool({
      propertyId: validated,
      ...options,
    });
    if (result.success && result.data) {
      invalidatePhotoPlanCache(validated);
      return {
        success: true,
        data: result.data,
        message: t('media.planSyncedSuccess') || 'Floor plan synced successfully from CAD tool.',
      };
    }
    return {
      success: false,
      error: result.error || result.message || 'No plan found in drawing tool to sync.',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync floor plan from drawing tool.',
    };
  }
}

