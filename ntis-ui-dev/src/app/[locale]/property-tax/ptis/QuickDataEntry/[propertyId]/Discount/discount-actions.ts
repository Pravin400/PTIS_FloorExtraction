'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import {
  getDiscountDetails,
  uploadDiscountDocViaGlobalApi,
  replaceDiscountDocViaGlobalApi,
  deleteDiscountDoc,
  getDiscountWings,
  getDiscountUnits,
} from '@/lib/api/discount.service';
import {
  createPropertySocialDetail,
  updatePropertySocialDetail,
  createBulkPropertySocialDetail,
  getPropertySocialDetailById,
  getPropertySocialDetailsByFilters,
  deletePropertySocialDetailsByHierarchy,
  deletePropertySocialDetail,
} from '@/lib/api/property-social-details.service';
import { getUserIdFromCookies } from '@/lib/utils/cookie';
import { logger } from '@/lib/utils/logger';
import { getSocialAttributes } from '@/lib/api/social-attribute-master/social-attribute-crud.service';
import { SocialAttribute } from '@/types/social-attribute.types';
import { updateBindingReference } from '@/lib/api/document.service';
import {
  PropertyDiscountInfoResponseDto,
  DiscountDocumentUploadResponseDto,
  DiscountAttributeItemDto,
  DiscountAttributeDto,
} from '@/types/discount.types';
import { WingOption, UnitSelectionItem } from '@/types/building-permission.types';
import { ApiResponse } from '@/types/common.types';
import {
  CreatePropertySocialDetailDto,
  UpdatePropertySocialDetailDto,
  CreateBulkPropertySocialDetailDto,
  PropertySocialDetailsDto,
  DeletePropertySocialDetailsByHierarchyParams,
} from '@/types/property-social-details.types';
import { cleanCommonApiError, handleActionError } from '@/lib/utils/action-error-helpers';
import {
  resolveScope,
  filterActiveAttributes,
  dedupeByAttributeAndScope,
  resolveDocumentGuid,
  expandConnectedSocialAttributeIds,
} from '@/lib/utils/ptis/social-details';

export async function getDiscountDetailsAction(
  propertyId: string
): Promise<ApiResponse<PropertyDiscountInfoResponseDto>> {
  try {
    return await getDiscountDetails(propertyId);
  } catch (error: unknown) {
    logger.error('getDiscountDetailsAction failed', { propertyId, error: error as Error });
    return handleActionError(error, 'discount.socialConfirm.unexpectedError');
  }
}

import { parseJsonArray } from '@/lib/utils/validate-form-payload';

export async function updateDiscountDetailsAction(
  locale: string,
  propertyId: string,
  formData: FormData
): Promise<ApiResponse<PropertyDiscountInfoResponseDto>> {
  try {
    const t = await getTranslations({ locale, namespace: 'quickDataEntry' });
    const userId = getUserIdFromCookies(await cookies());
    if (!userId) return { success: false, error: 'Unauthorized: Please log in.' };

    const discountAttributes = parseJsonArray<DiscountAttributeItemDto>(
      formData.get('discountAttributes'),
      'discountAttributes'
    );

    const validationErrors: string[] = [];
    for (const attr of discountAttributes) {
      if (!attr.socialAttributeId || Number(attr.socialAttributeId) <= 0) {
        validationErrors.push(`Invalid attribute ID: ${attr.socialAttributeId}`);
      }
      if (attr.documentBindingId && Number(attr.documentBindingId) <= 0) {
        validationErrors.push(`Invalid document binding ID: ${attr.documentBindingId}`);
      }
      if (attr.intValue !== null && attr.intValue !== undefined && String(attr.intValue).trim() !== '') {
        const val = Number(attr.intValue);
        if (isNaN(val) || !Number.isInteger(val) || val <= 0) {
          validationErrors.push(t('discount.socialValidation.countMin') || 'Count must be at least 1.');
        }
      }
    }
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: `Validation failed: ${validationErrors.join(', ')}`,
      };
    }

    const level = (formData.get('level') as string | null) || 'Apartment';
    const societyDetailId = formData.get('societyDetailId')
      ? Number(formData.get('societyDetailId'))
      : null;
    const wingDetailId = formData.get('wingDetailId') ? Number(formData.get('wingDetailId')) : null;
    const propertyIdsStr = formData.get('propertyIds') as string | null;
    const unitIds = propertyIdsStr
      ? propertyIdsStr
          .split(',')
          .map((s) => Number(s.trim()))
          .filter((n) => !isNaN(n) && n > 0)
      : [];
    const isSociety = formData.get('isSociety');
    const selectedUnitCount = formData.get('selectedUnitCount')
      ? Number(formData.get('selectedUnitCount'))
      : 0;
    const totalUnitCount = formData.get('totalUnitCount')
      ? Number(formData.get('totalUnitCount'))
      : 0;

    // When all units in a wing are selected, promote to wing-level save
    const isAllUnitsSelected =
      level === 'Unit' && totalUnitCount > 0 && selectedUnitCount >= totalUnitCount;

    const scope = resolveScope({
      level,
      isAllUnitsSelected,
      wingDetailId,
      unitIds,
      societyDetailId: isSociety === 'true' ? societyDetailId : null,
      propertyId: Number(propertyId),
    });

    const payloadWingDetailId = scope.wingDetailId;
    const payloadSocietyDetailId = scope.societyDetailId;
    const BuildingPropertyId = Number(propertyId);

    const socIdNum = payloadSocietyDetailId ? Number(payloadSocietyDetailId) : undefined;
    const wingIdNum = payloadWingDetailId ? Number(payloadWingDetailId) : undefined;
    const targetPropId = isSociety === 'true' ? (unitIds.length === 1 ? unitIds[0] : undefined) : BuildingPropertyId;

    const initialExistingDetails = await getPropertySocialDetailsByFilters(
      undefined,
      socIdNum,
      wingIdNum,
      targetPropId
    );

    const aptExistingDetails: PropertySocialDetailsDto[] =
      isSociety === 'true' && socIdNum && level !== 'Apartment'
        ? (await getPropertySocialDetailsByFilters(undefined, socIdNum, undefined, undefined)) || []
        : [];

    const wingExistingDetails: PropertySocialDetailsDto[] =
      isSociety === 'true' && socIdNum && wingIdNum
        ? (await getPropertySocialDetailsByFilters(undefined, socIdNum, wingIdNum, undefined)) || []
        : (initialExistingDetails || []);

    const dedupedExisting = dedupeByAttributeAndScope(initialExistingDetails || []);
    const initialFlatData: Record<
      number,
      {
        id?: number | null;
        documentGuid?: string | null;
        documentBindingId?: number | null;
        photoBindingId?: number | null;
      }
    > = {};
    dedupedExisting.forEach((item) => {
      const matchesScope =
        (isSociety !== 'true' && (item.entityType === 'P' || !item.entityType)) ||
        (level === 'Apartment' && (item.entityType === 'S' || (!item.wingDetailId && !item.propertyId))) ||
        (level === 'Wing' && (item.entityType === 'W' || (item.wingDetailId === wingIdNum && !item.propertyId))) ||
        (level === 'Unit' && (item.entityType === 'P' || item.propertyId === targetPropId));

      if (matchesScope) {
        initialFlatData[item.socialAttributeId] = {
          id: item.id,
          documentGuid: resolveDocumentGuid(item),
          documentBindingId: item.documentBindingId != null ? Number(item.documentBindingId) : null,
          photoBindingId: item.photoBindingId != null ? Number(item.photoBindingId) : null,
        };
      }
    });

    // 1. Process files first (upload, replace, or delete)
    const newlyUploadedBindingMap: Record<number, number> = {};
    for (const attr of discountAttributes) {
      const file = formData.get(`file_${attr.socialAttributeId}`) as File | null;
      const initialAttr = initialFlatData[attr.socialAttributeId];
      const oldGuid = initialAttr?.documentGuid;
      const isInherited =
        (level === 'Wing' &&
          (attr.inheritedFrom === 'Apartment' || attr.inheritanceLevel === 'Apartment')) ||
        (level === 'Unit' &&
          (attr.inheritedFrom === 'Apartment' ||
            attr.inheritedFrom === 'Wing' ||
            attr.inheritanceLevel === 'Apartment' ||
            attr.inheritanceLevel === 'Wing'));

      if (file) {
        const propIdNum = level === 'Unit' && unitIds.length > 0 ? unitIds[0] : BuildingPropertyId;
        const detailId = attr.propertySocialDetailId || 0;
        const attrId = attr.socialAttributeId;
        const guidReference = detailId === 0 ? crypto.randomUUID() : undefined;

        const uploadResult =
          oldGuid && !isInherited
            ? await replaceDiscountDocViaGlobalApi(
                file,
                oldGuid,
                propIdNum,
                attrId,
                detailId,
                guidReference
              )
            : await uploadDiscountDocViaGlobalApi(file, propIdNum, attrId, detailId, guidReference);

        if (uploadResult.success && (uploadResult.data?.documentBindingId || uploadResult.data?.documentGuid)) {
          if (uploadResult.data.documentBindingId) {
            newlyUploadedBindingMap[attr.socialAttributeId] = uploadResult.data.documentBindingId;
          }
          attr.documentBindingId = uploadResult.data.documentBindingId;
          attr.documentGuid = uploadResult.data.documentGuid;
          attr.fileName = uploadResult.data.fileName || file.name;
        } else {
          throw new Error(uploadResult.error || 'Failed to upload document');
        }
      } else if (oldGuid && !isInherited && !attr.documentBindingId && !attr.documentGuid) {
        try {
          await deleteDiscountDoc(oldGuid);
        } catch (delError) {
          logger.warn('Failed to clean up old discount document', { oldGuid, error: delError instanceof Error ? delError : new Error(String(delError)) });
        }
      }
    }

    // 2. Identify attributes to remove vs save
    const attributesToRemove: number[] = [];
    const attributesToSave: DiscountAttributeItemDto[] = [];

    for (const attr of discountAttributes) {
      const sanitizedBitValue =
        attr.bitValue != null
          ? attr.bitValue
          : attr.dataType?.toUpperCase() === 'BIT'
            ? false
            : null;
      const sanitizedIntValue =
        attr.intValue !== null && attr.intValue !== undefined && String(attr.intValue).trim() !== ''
          ? Number(attr.intValue)
          : null;
      const sanitizedDecimalValue =
        attr.decimalValue !== null &&
        attr.decimalValue !== undefined &&
        String(attr.decimalValue).trim() !== ''
          ? Number(attr.decimalValue)
          : null;
      const sanitizedTextValue =
        attr.textValue && attr.textValue !== 'string' && attr.textValue.trim() !== ''
          ? attr.textValue
          : null;
      const sanitizedDateValue =
        attr.dateValue && attr.dateValue.trim() !== '' ? attr.dateValue : null;

      const isInherited =
        (level === 'Wing' &&
          (attr.inheritedFrom === 'Apartment' || attr.inheritanceLevel === 'Apartment')) ||
        (level === 'Unit' &&
          (attr.inheritedFrom === 'Apartment' ||
            attr.inheritedFrom === 'Wing' ||
            attr.inheritanceLevel === 'Apartment' ||
            attr.inheritanceLevel === 'Wing'));
      let hasExistingRecordAtSameLevel = false;
      if (isSociety === 'true') {
        if (level === 'Apartment') {
          hasExistingRecordAtSameLevel = Boolean(
            (typeof attr.propertySocialDetailId === 'number' &&
              attr.propertySocialDetailId > 0 &&
              (!attr.entityType || attr.entityType === 'S') &&
              !isInherited) ||
            aptExistingDetails.some(
              (a) =>
                (a.socialAttributeId === attr.socialAttributeId || a.id === attr.socialAttributeId) &&
                (a.entityType === 'S' || (!a.wingDetailId && !a.propertyId))
            ) ||
            (initialExistingDetails || []).some(
              (a) =>
                (a.socialAttributeId === attr.socialAttributeId || a.id === attr.socialAttributeId) &&
                (a.entityType === 'S' || (!a.wingDetailId && !a.propertyId))
            )
          );
        } else if (level === 'Wing') {
          hasExistingRecordAtSameLevel = Boolean(
            (typeof attr.propertySocialDetailId === 'number' &&
              attr.propertySocialDetailId > 0 &&
              attr.entityType === 'W') ||
            wingExistingDetails.some(
              (w) =>
                (w.socialAttributeId === attr.socialAttributeId || w.id === attr.socialAttributeId) &&
                (w.entityType === 'W' || (w.wingDetailId === wingIdNum && (!w.propertyId || Number(w.propertyId) === 0)))
            )
          );
        } else if (level === 'Unit') {
          hasExistingRecordAtSameLevel = Boolean(
            (typeof attr.propertySocialDetailId === 'number' &&
              attr.propertySocialDetailId > 0 &&
              attr.entityType === 'P') ||
            (unitIds.length === 1 &&
              wingExistingDetails.some(
                (u) =>
                  (u.socialAttributeId === attr.socialAttributeId || u.id === attr.socialAttributeId) &&
                  u.propertyId === unitIds[0]
              ))
          );
        }
      } else {
        hasExistingRecordAtSameLevel = Boolean(
          (typeof attr.propertySocialDetailId === 'number' &&
            attr.propertySocialDetailId > 0 &&
            (attr.entityType === 'P' || !attr.entityType)) ||
          (initialExistingDetails || []).some(
            (p) =>
              (p.socialAttributeId === attr.socialAttributeId || p.id === attr.socialAttributeId) &&
              (p.propertyId === BuildingPropertyId || p.entityType === 'P')
          )
        );
      }

      const isBit = attr.dataType?.toUpperCase() === 'BIT';
      const isEnabled = isBit
        ? sanitizedBitValue === true
        : sanitizedBitValue === true ||
          sanitizedIntValue != null ||
          sanitizedDecimalValue != null ||
          sanitizedTextValue != null ||
          sanitizedDateValue != null;

      if (!isEnabled && hasExistingRecordAtSameLevel) {
        attributesToRemove.push(attr.socialAttributeId);
      } else if (isEnabled) {
        attributesToSave.push(attr);
      }
    }

    // 3. Delete attributes that were removed/deselected
    for (const removeId of attributesToRemove) {
      const deleteParams: DeletePropertySocialDetailsByHierarchyParams = {
        socialAttributeId: removeId,
      };

      if (isSociety === 'true') {
        if (level === 'Apartment') {
          deleteParams.entityType = 'S';
          if (payloadSocietyDetailId) deleteParams.societyDetailsId = payloadSocietyDetailId;
        } else if (level === 'Wing') {
          deleteParams.entityType = 'W';
          if (payloadSocietyDetailId) deleteParams.societyDetailsId = payloadSocietyDetailId;
          if (payloadWingDetailId) deleteParams.wingDetailId = payloadWingDetailId;
        } else if (level === 'Unit') {
          deleteParams.entityType = 'P';
          if (payloadSocietyDetailId) deleteParams.societyDetailsId = payloadSocietyDetailId;
          if (payloadWingDetailId) deleteParams.wingDetailId = payloadWingDetailId;
          if (unitIds.length === 1) {
            deleteParams.propertyId = unitIds[0];
          } else if (unitIds.length > 1) {
            deleteParams.propertyIds = unitIds;
          }
        }
      } else {
        deleteParams.entityType = 'P';
        deleteParams.propertyId = BuildingPropertyId;
      }

      await deletePropertySocialDetailsByHierarchy(deleteParams);
    }

    // 4. Persist discount attributes using PUT /PropertySocialDetails/{id} (if updating existing) or POST /PropertySocialDetails (if new)
    for (const attr of attributesToSave) {
      const sanitizedBitValue =
        attr.bitValue != null
          ? attr.bitValue
          : attr.dataType?.toUpperCase() === 'BIT'
            ? false
            : null;
      const sanitizedIntValue =
        attr.intValue !== null && attr.intValue !== undefined && String(attr.intValue).trim() !== ''
          ? Number(attr.intValue)
          : null;
      const sanitizedDecimalValue =
        attr.decimalValue !== null &&
        attr.decimalValue !== undefined &&
        String(attr.decimalValue).trim() !== ''
          ? Number(attr.decimalValue)
          : null;
      const sanitizedTextValue =
        attr.textValue && attr.textValue !== 'string' && attr.textValue.trim() !== ''
          ? attr.textValue
          : null;
      const sanitizedDateValue =
        attr.dateValue && attr.dateValue.trim() !== '' ? attr.dateValue : null;
      const sanitizedRemark =
        attr.remark && attr.remark !== 'string' && attr.remark.trim() !== '' ? attr.remark : null;

      const isInherited =
        (level === 'Wing' &&
          (attr.inheritedFrom === 'Apartment' || attr.inheritanceLevel === 'Apartment')) ||
        (level === 'Unit' &&
          (attr.inheritedFrom === 'Apartment' ||
            attr.inheritedFrom === 'Wing' ||
            attr.inheritanceLevel === 'Apartment' ||
            attr.inheritanceLevel === 'Wing'));

      const initialAttr = initialFlatData[attr.socialAttributeId];

      // Scope-aware resolution of existingRecordId:
      // If a record already exists in the database at the target scope, we MUST UPDATE it (PUT), NEVER create a duplicate (POST)!
      let existingRecordId: number | null = null;

      if (isSociety === 'true') {
        if (level === 'Apartment') {
          if (
            attr.propertySocialDetailId &&
            Number(attr.propertySocialDetailId) > 0 &&
            (!attr.entityType || attr.entityType === 'S') &&
            !isInherited
          ) {
            existingRecordId = Number(attr.propertySocialDetailId);
          } else if (initialAttr?.id && Number(initialAttr.id) > 0 && !isInherited) {
            existingRecordId = Number(initialAttr.id);
          } else {
            const aptMatches = (aptExistingDetails.length > 0 ? aptExistingDetails : (initialExistingDetails || [])).filter(
              (a) =>
                (a.socialAttributeId === attr.socialAttributeId || a.id === attr.socialAttributeId) &&
                (a.entityType === 'S' || (!a.wingDetailId && !a.propertyId))
            );
            const aptMatch = aptMatches.sort((a, b) => Number(b.id || 0) - Number(a.id || 0))[0];
            if (aptMatch?.id && Number(aptMatch.id) > 0) {
              existingRecordId = Number(aptMatch.id);
            }
          }
        } else if (level === 'Wing' || (level === 'Unit' && isAllUnitsSelected)) {
          // Look for an existing record directly on this Wing
          const wingMatches = wingExistingDetails.filter(
            (w) =>
              (w.socialAttributeId === attr.socialAttributeId || w.id === attr.socialAttributeId) &&
              (w.entityType === 'W' || (w.wingDetailId === wingIdNum && (!w.propertyId || Number(w.propertyId) === 0)))
          );
          const wingMatch = wingMatches.sort((a, b) => Number(b.id || 0) - Number(a.id || 0))[0];
          if (wingMatch?.id && Number(wingMatch.id) > 0) {
            existingRecordId = Number(wingMatch.id);
          } else if (
            attr.propertySocialDetailId &&
            Number(attr.propertySocialDetailId) > 0 &&
            attr.entityType === 'W'
          ) {
            existingRecordId = Number(attr.propertySocialDetailId);
          } else if (
            initialAttr?.id &&
            Number(initialAttr.id) > 0 &&
            !isInherited
          ) {
            existingRecordId = Number(initialAttr.id);
          }
        } else if (level === 'Unit') {
          if (unitIds.length === 1) {
            const singleUnitId = unitIds[0];
            const unitMatches = (wingExistingDetails || []).filter(
              (u) =>
                (u.socialAttributeId === attr.socialAttributeId || u.id === attr.socialAttributeId) &&
                u.propertyId === singleUnitId
            );
            const unitMatch = unitMatches.sort((a, b) => Number(b.id || 0) - Number(a.id || 0))[0];
            if (unitMatch?.id && Number(unitMatch.id) > 0) {
              existingRecordId = Number(unitMatch.id);
            } else if (
              attr.propertySocialDetailId &&
              Number(attr.propertySocialDetailId) > 0 &&
              attr.entityType === 'P'
            ) {
              existingRecordId = Number(attr.propertySocialDetailId);
            }
          }
        }
      } else {
        // Individual Property
        if (
          attr.propertySocialDetailId &&
          Number(attr.propertySocialDetailId) > 0 &&
          (attr.entityType === 'P' || !attr.entityType)
        ) {
          existingRecordId = Number(attr.propertySocialDetailId);
        } else if (initialAttr?.id && Number(initialAttr.id) > 0) {
          existingRecordId = Number(initialAttr.id);
        } else {
          const propMatches = (initialExistingDetails || []).filter(
            (p) =>
              (p.socialAttributeId === attr.socialAttributeId || p.id === attr.socialAttributeId) &&
              (p.propertyId === BuildingPropertyId || p.entityType === 'P')
          );
          const propMatch = propMatches.sort((a, b) => Number(b.id || 0) - Number(a.id || 0))[0];
          if (propMatch?.id && Number(propMatch.id) > 0) {
            existingRecordId = Number(propMatch.id);
          }
        }
      }

      const isDocNewlyUploaded = Boolean(newlyUploadedBindingMap[attr.socialAttributeId]);
      let effectiveDocumentBindingId: number | null = null;

      if (isDocNewlyUploaded) {
        effectiveDocumentBindingId = newlyUploadedBindingMap[attr.socialAttributeId];
      } else if (attr.documentBindingId && Number(attr.documentBindingId) > 0) {
        effectiveDocumentBindingId = Number(attr.documentBindingId);
      } else if (attr.photoBindingId && Number(attr.photoBindingId) > 0) {
        effectiveDocumentBindingId = Number(attr.photoBindingId);
      }

      const effectivePhotoBindingId = effectiveDocumentBindingId;

      if (isSociety === 'true') {
        if (!payloadSocietyDetailId) {
          throw new Error(
            t('discount.societyDetailIdRequired') || 'Society Detail ID is required to submit.'
          );
        }

        if (level === 'Apartment') {
          if (existingRecordId && existingRecordId > 0) {
            const updateDto: UpdatePropertySocialDetailDto = {
              id: existingRecordId,
              propertyId: 0,
              socialAttributeId: attr.socialAttributeId,
              societyDetailId: payloadSocietyDetailId,
              wingDetailId: null,
              entityType: 'S',
              bitValue: sanitizedBitValue,
              intValue: sanitizedIntValue,
              decimalValue: sanitizedDecimalValue,
              textValue: sanitizedTextValue,
              dateValue: sanitizedDateValue,
              documentBindingId: effectiveDocumentBindingId,
              photoBindingId: effectivePhotoBindingId,
              remark: sanitizedRemark,
              updatedBy: Number(userId),
              isActive: true,
            };
            const res = await updatePropertySocialDetail(existingRecordId, updateDto);
            if (!res.success) {
              return {
                success: false,
                error: await cleanCommonApiError(res.error, locale),
                statusCode: res.statusCode,
              };
            }
            if (isDocNewlyUploaded && effectiveDocumentBindingId && existingRecordId) {
              await updateBindingReference(effectiveDocumentBindingId, existingRecordId);
            }
          } else {
            const createDto: CreatePropertySocialDetailDto = {
              propertyId: 0,
              socialAttributeId: attr.socialAttributeId,
              societyDetailId: payloadSocietyDetailId,
              wingDetailId: null,
              entityType: 'S',
              bitValue: sanitizedBitValue,
              intValue: sanitizedIntValue,
              decimalValue: sanitizedDecimalValue,
              textValue: sanitizedTextValue,
              dateValue: sanitizedDateValue,
              documentBindingId: effectiveDocumentBindingId,
              photoBindingId: effectivePhotoBindingId,
              remark: sanitizedRemark,
              createdBy: Number(userId),
              isActive: true,
            };
            const res = await createPropertySocialDetail(createDto);
            if (!res.success) {
              return {
                success: false,
                error: await cleanCommonApiError(res.error, locale),
                statusCode: res.statusCode,
              };
            }
            if (isDocNewlyUploaded && effectiveDocumentBindingId && res.data?.id) {
              await updateBindingReference(effectiveDocumentBindingId, res.data.id);
            }
          }
        } else if (level === 'Wing' || (level === 'Unit' && isAllUnitsSelected)) {
          // Wing Level or all units in wing selected -> apply directly to Wing
          if (existingRecordId && existingRecordId > 0) {
            const updateDto: UpdatePropertySocialDetailDto = {
              id: existingRecordId,
              propertyId: 0,
              socialAttributeId: attr.socialAttributeId,
              societyDetailId: payloadSocietyDetailId,
              wingDetailId: payloadWingDetailId,
              entityType: 'W',
              bitValue: sanitizedBitValue,
              intValue: sanitizedIntValue,
              decimalValue: sanitizedDecimalValue,
              textValue: sanitizedTextValue,
              dateValue: sanitizedDateValue,
              documentBindingId: effectiveDocumentBindingId,
              photoBindingId: effectivePhotoBindingId,
              remark: sanitizedRemark,
              updatedBy: Number(userId),
              isActive: true,
            };
            const res = await updatePropertySocialDetail(existingRecordId, updateDto);
            if (!res.success) {
              return {
                success: false,
                error: await cleanCommonApiError(res.error, locale),
                statusCode: res.statusCode,
              };
            }
            if (isDocNewlyUploaded && effectiveDocumentBindingId && existingRecordId) {
              await updateBindingReference(effectiveDocumentBindingId, existingRecordId);
            }
          } else {
            const createDto: CreatePropertySocialDetailDto = {
              propertyId: 0,
              socialAttributeId: attr.socialAttributeId,
              societyDetailId: payloadSocietyDetailId,
              wingDetailId: payloadWingDetailId,
              entityType: 'W',
              bitValue: sanitizedBitValue,
              intValue: sanitizedIntValue,
              decimalValue: sanitizedDecimalValue,
              textValue: sanitizedTextValue,
              dateValue: sanitizedDateValue,
              documentBindingId: effectiveDocumentBindingId,
              photoBindingId: effectivePhotoBindingId,
              remark: sanitizedRemark,
              createdBy: Number(userId),
              isActive: true,
            };
            const res = await createPropertySocialDetail(createDto);
            if (!res.success) {
              return {
                success: false,
                error: await cleanCommonApiError(res.error, locale),
                statusCode: res.statusCode,
              };
            }
            if (isDocNewlyUploaded && effectiveDocumentBindingId && res.data?.id) {
              await updateBindingReference(effectiveDocumentBindingId, res.data.id);
            }
          }
        } else if (level === 'Unit') {
          const appliedUnitIdsForAttr = new Map<number, number>();
          for (const item of (wingExistingDetails || [])) {
            const attrId = item.socialAttributeId;
            const propId = item.propertyId;
            const detailId = item.id;
            if (
              attrId === attr.socialAttributeId &&
              propId &&
              propId > 0 &&
              detailId &&
              detailId > 0 &&
              (item.entityType === 'P' || !item.entityType)
            ) {
              appliedUnitIdsForAttr.set(propId, detailId);
            }
          }

          if (unitIds.length === 1) {
            const singleUnitId = unitIds[0];
            const existingUnitRecordId =
              existingRecordId && existingRecordId > 0
                ? existingRecordId
                : appliedUnitIdsForAttr.get(singleUnitId) || null;

            if (existingUnitRecordId && existingUnitRecordId > 0) {
              const updateDto: UpdatePropertySocialDetailDto = {
                id: existingUnitRecordId,
                propertyId: singleUnitId,
                socialAttributeId: attr.socialAttributeId,
                societyDetailId: payloadSocietyDetailId,
                wingDetailId: payloadWingDetailId,
                entityType: 'P',
                bitValue: sanitizedBitValue,
                intValue: sanitizedIntValue,
                decimalValue: sanitizedDecimalValue,
                textValue: sanitizedTextValue,
                dateValue: sanitizedDateValue,
                documentBindingId: effectiveDocumentBindingId,
                photoBindingId: effectivePhotoBindingId,
                remark: sanitizedRemark,
                updatedBy: Number(userId),
                isActive: true,
              };
              const res = await updatePropertySocialDetail(existingUnitRecordId, updateDto);
              if (!res.success) {
                return {
                  success: false,
                  error: await cleanCommonApiError(res.error, locale),
                  statusCode: res.statusCode,
                };
              }
              if (isDocNewlyUploaded && effectiveDocumentBindingId && existingUnitRecordId) {
                await updateBindingReference(effectiveDocumentBindingId, existingUnitRecordId);
              }
            } else {
              const createDto: CreatePropertySocialDetailDto = {
                propertyId: singleUnitId,
                socialAttributeId: attr.socialAttributeId,
                societyDetailId: payloadSocietyDetailId,
                wingDetailId: payloadWingDetailId,
                entityType: 'P',
                bitValue: sanitizedBitValue,
                intValue: sanitizedIntValue,
                decimalValue: sanitizedDecimalValue,
                textValue: sanitizedTextValue,
                dateValue: sanitizedDateValue,
                documentBindingId: effectiveDocumentBindingId,
                photoBindingId: effectivePhotoBindingId,
                remark: sanitizedRemark,
                createdBy: Number(userId),
                isActive: true,
              };
              const res = await createPropertySocialDetail(createDto);
              if (!res.success) {
                return {
                  success: false,
                  error: await cleanCommonApiError(res.error, locale),
                  statusCode: res.statusCode,
                };
              }
              if (isDocNewlyUploaded && effectiveDocumentBindingId && res.data?.id) {
                await updateBindingReference(effectiveDocumentBindingId, res.data.id);
              }
            }
          } else if (unitIds.length > 1) {
            // User requested: "if the units are already applied discount and social that units i need to skip next time"
            // Filter unitIds to strictly exclude units that already have an applied record for this attribute!
            const unappliedUnitIds = unitIds.filter((id) => !appliedUnitIdsForAttr.has(id));

            if (unappliedUnitIds.length === 1) {
              const createDto: CreatePropertySocialDetailDto = {
                propertyId: unappliedUnitIds[0],
                socialAttributeId: attr.socialAttributeId,
                societyDetailId: payloadSocietyDetailId,
                wingDetailId: payloadWingDetailId,
                entityType: 'P',
                bitValue: sanitizedBitValue,
                intValue: sanitizedIntValue,
                decimalValue: sanitizedDecimalValue,
                textValue: sanitizedTextValue,
                dateValue: sanitizedDateValue,
                documentBindingId: effectiveDocumentBindingId,
                photoBindingId: effectivePhotoBindingId,
                remark: sanitizedRemark,
                createdBy: Number(userId),
                isActive: true,
              };
              const res = await createPropertySocialDetail(createDto);
              if (!res.success) {
                return {
                  success: false,
                  error: await cleanCommonApiError(res.error, locale),
                  statusCode: res.statusCode,
                };
              }
              if (isDocNewlyUploaded && effectiveDocumentBindingId && res.data?.id) {
                await updateBindingReference(effectiveDocumentBindingId, res.data.id);
              }
            } else if (unappliedUnitIds.length > 1) {
              const bulkDto: CreateBulkPropertySocialDetailDto = {
                propertyIds: unappliedUnitIds.join(','),
                socialAttributeId: attr.socialAttributeId,
                societyDetailId: payloadSocietyDetailId,
                wingDetailId: payloadWingDetailId,
                entityType: 'P',
                bitValue: sanitizedBitValue,
                intValue: sanitizedIntValue,
                decimalValue: sanitizedDecimalValue,
                textValue: sanitizedTextValue,
                dateValue: sanitizedDateValue,
                documentBindingId: effectiveDocumentBindingId,
                photoBindingId: effectivePhotoBindingId,
                remark: sanitizedRemark,
                createdBy: Number(userId),
                isActive: true,
              };
              const res = await createBulkPropertySocialDetail(bulkDto);
              if (!res.success) {
                return {
                  success: false,
                  error: await cleanCommonApiError(res.error, locale),
                  statusCode: res.statusCode,
                };
              }
            }
          }
        }
      } else {
        // Individual Property
        if (existingRecordId && existingRecordId > 0) {
          const updateDto: UpdatePropertySocialDetailDto = {
            id: existingRecordId,
            propertyId: BuildingPropertyId,
            socialAttributeId: attr.socialAttributeId,
            societyDetailId: null,
            wingDetailId: null,
            entityType: 'P',
            bitValue: sanitizedBitValue,
            intValue: sanitizedIntValue,
            decimalValue: sanitizedDecimalValue,
            textValue: sanitizedTextValue,
            dateValue: sanitizedDateValue,
            documentBindingId: effectiveDocumentBindingId,
            photoBindingId: effectivePhotoBindingId,
            remark: sanitizedRemark,
            updatedBy: Number(userId),
            isActive: true,
          };
          const res = await updatePropertySocialDetail(existingRecordId, updateDto);
          if (!res.success) {
            return {
              success: false,
              error: await cleanCommonApiError(res.error, locale),
              statusCode: res.statusCode,
            };
          }
          if (isDocNewlyUploaded && effectiveDocumentBindingId && existingRecordId) {
            await updateBindingReference(effectiveDocumentBindingId, existingRecordId);
          }
        } else {
          const createDto: CreatePropertySocialDetailDto = {
            propertyId: BuildingPropertyId,
            socialAttributeId: attr.socialAttributeId,
            societyDetailId: null,
            wingDetailId: null,
            entityType: 'P',
            bitValue: sanitizedBitValue,
            intValue: sanitizedIntValue,
            decimalValue: sanitizedDecimalValue,
            textValue: sanitizedTextValue,
            dateValue: sanitizedDateValue,
            documentBindingId: effectiveDocumentBindingId,
            photoBindingId: effectivePhotoBindingId,
            remark: sanitizedRemark,
            createdBy: Number(userId),
            isActive: true,
          };
          const res = await createPropertySocialDetail(createDto);
          if (!res.success) {
            return {
              success: false,
              error: await cleanCommonApiError(res.error, locale),
              statusCode: res.statusCode,
            };
          }
          if (isDocNewlyUploaded && effectiveDocumentBindingId && res.data?.id) {
            await updateBindingReference(effectiveDocumentBindingId, res.data.id);
          }
        }
      }
    }

    let freshDiscountData: PropertyDiscountInfoResponseDto | undefined;

    if (isSociety === 'true') {
      const socIdNum = payloadSocietyDetailId ? Number(payloadSocietyDetailId) : undefined;
      const wingIdNum = payloadWingDetailId ? Number(payloadWingDetailId) : undefined;
      const targetUnitPropId = (level === 'Unit' && unitIds.length === 1) ? unitIds[0] : undefined;

      const [masterRes, apartmentDetailsRes, wingDetailsRes, unitDetailsRes] = await Promise.all([
        getSocialAttributes(),
        socIdNum
          ? getPropertySocialDetailsByFilters(undefined, socIdNum)
          : Promise.resolve([]),
        (socIdNum && wingIdNum && (level === 'Wing' || level === 'Unit'))
          ? getPropertySocialDetailsByFilters(undefined, socIdNum, wingIdNum)
          : Promise.resolve([]),
        (socIdNum && targetUnitPropId && level === 'Unit')
          ? getPropertySocialDetailsByFilters(undefined, socIdNum, wingIdNum, targetUnitPropId)
          : Promise.resolve([])
      ]);

      const masterById = new Map((masterRes || []).map((a) => [a.id, a]));
      const activeMasterById = new Map(filterActiveAttributes(masterRes || []).map((a) => [a.id, a]));
      const mergedDetailsMap = new Map<number, PropertySocialDetailsDto>();

      const apartmentItems = (apartmentDetailsRes || []).filter(
        (item) => item.entityType === 'S' || (!item.wingDetailId && !item.propertyId)
      );
      const wingItems = (wingDetailsRes || []).filter(
        (item) => item.entityType === 'W' || (item.wingDetailId && !item.propertyId)
      );
      const unitItems = (unitDetailsRes || []).filter(
        (item) => item.entityType === 'P' || (item.propertyId && item.propertyId > 0)
      );

      apartmentItems.forEach((item) => {
        mergedDetailsMap.set(item.socialAttributeId, {
          ...item,
          entityType: item.entityType || 'S',
          inheritanceLevel: level === 'Apartment' ? 'Self' : 'Apartment',
          inheritedFrom: level === 'Apartment' ? null : 'Apartment',
        });
      });

      if (level === 'Wing' || level === 'Unit') {
        wingItems.forEach((item) => {
          mergedDetailsMap.set(item.socialAttributeId, {
            ...item,
            entityType: 'W',
            inheritanceLevel: level === 'Wing' ? 'Self' : 'Wing',
            inheritedFrom: level === 'Wing' ? null : 'Wing',
          });
        });
      }

      if (level === 'Unit' && targetUnitPropId) {
        unitItems.forEach((item) => {
          mergedDetailsMap.set(item.socialAttributeId, {
            ...item,
            entityType: 'P',
            inheritanceLevel: 'Self',
            inheritedFrom: null,
          });
        });
      }

      const discountSavedDetails = Array.from(mergedDetailsMap.values()).filter((item) => {
        const master = activeMasterById.get(item.socialAttributeId);
        return master?.isDiscountApplicable === true;
      });

      const uploadedAttrMap = new Map(
        discountAttributes.map((a) => [a.socialAttributeId, a])
      );

      const mapped: DiscountAttributeDto[] = discountSavedDetails.map((item) => {
        const master = activeMasterById.get(item.socialAttributeId) || masterById.get(item.socialAttributeId);
        const uploadedAttr = uploadedAttrMap.get(item.socialAttributeId);
        const docGuid = resolveDocumentGuid(item) || uploadedAttr?.documentGuid || null;
        const docBindingId = item.documentBindingId || uploadedAttr?.documentBindingId || null;
        const fileName = item.fileName || uploadedAttr?.fileName || null;
        return {
          id: item.socialAttributeId,
          socialAttributeCode: item.socialAttributeCode || master?.socialAttributeCode || '',
          socialAttributeName: item.socialAttributeName || master?.socialAttributeName || '',
          dataType: master?.dataType || 'BIT',
          unit: master?.unit,
          displayOrder: master?.displayOrder,
          isDiscountApplicable: master?.isDiscountApplicable ?? true,
          propertySocialDetailId: item.id || uploadedAttr?.propertySocialDetailId || undefined,
          bitValue: item.bitValue ?? uploadedAttr?.bitValue ?? null,
          intValue: item.intValue ?? uploadedAttr?.intValue ?? null,
          decimalValue: item.decimalValue ?? uploadedAttr?.decimalValue ?? null,
          textValue: item.textValue ?? uploadedAttr?.textValue ?? null,
          dateValue: item.dateValue ?? uploadedAttr?.dateValue ?? null,
          documentBindingId: docBindingId,
          documentGuid: docGuid,
          documentUrl:
            item.documentUrl ||
            (docGuid ? `/api/documents/${encodeURIComponent(docGuid)}/view` : undefined),
          fileName: fileName,
          remark: item.remark ?? uploadedAttr?.remark ?? null,
          isPhotoRequired: master?.isPhotoRequired,
          isDocumentRequired: master?.isDocumentRequired,
          isActive: master?.isActive,
          entityType: item.entityType,
          inheritedFrom: item.inheritedFrom,
          inheritanceLevel: item.inheritanceLevel,
        };
      });

      const societyMappedIds = new Set(mapped.map((m) => m.id));
      for (const attr of discountAttributes) {
        if (!societyMappedIds.has(attr.socialAttributeId)) {
          const master = activeMasterById.get(attr.socialAttributeId);
          if (master && master.isDiscountApplicable === true) {
            const docGuid = attr.documentGuid || null;
            const docBindingId = attr.documentBindingId || null;
            mapped.push({
              id: attr.socialAttributeId,
              socialAttributeCode: master.socialAttributeCode || '',
              socialAttributeName: master.socialAttributeName || '',
              dataType: master.dataType || 'BIT',
              unit: master.unit,
              displayOrder: master.displayOrder,
              isDiscountApplicable: true,
              propertySocialDetailId: attr.propertySocialDetailId || null,
              bitValue: attr.bitValue ?? null,
              intValue: attr.intValue ?? null,
              decimalValue: attr.decimalValue ?? null,
              textValue: attr.textValue ?? null,
              dateValue: attr.dateValue ?? null,
              documentBindingId: docBindingId,
              documentGuid: docGuid,
              documentUrl: docGuid ? `/api/documents/${encodeURIComponent(docGuid)}/view` : undefined,
              fileName: attr.fileName || null,
              remark: attr.remark ?? null,
              isPhotoRequired: master.isPhotoRequired,
              isDocumentRequired: master.isDocumentRequired,
              isActive: master.isActive,
              entityType: level === 'Apartment' ? 'S' : level === 'Wing' ? 'W' : 'P',
              inheritedFrom: null,
              inheritanceLevel: 'Self',
            });
          }
        }
      }

      freshDiscountData = {
        propertyId: Number(propertyId),
        discountAttributes: mapped,
      };
    } else {
      const [individualDetailsRes, masterRes] = await Promise.all([
        getPropertySocialDetailsByFilters(undefined, undefined, undefined, Number(propertyId)),
        getSocialAttributes(),
      ]);

      const masterById = new Map((masterRes || []).map((a) => [a.id, a]));
      const activeMasterById = new Map(filterActiveAttributes(masterRes || []).map((a) => [a.id, a]));
      const individualItems = individualDetailsRes || [];
      const dedupedDetails = dedupeByAttributeAndScope(individualItems, {
        propertyId: Number(propertyId),
        entityType: 'P',
      });

      const discountSavedDetails = dedupedDetails.filter((item) => {
        const master = activeMasterById.get(item.socialAttributeId);
        return master?.isDiscountApplicable === true;
      });

      const uploadedAttrMap = new Map(
        discountAttributes.map((a) => [a.socialAttributeId, a])
      );

      const mapped: DiscountAttributeDto[] = discountSavedDetails.map((item) => {
        const master = activeMasterById.get(item.socialAttributeId) || masterById.get(item.socialAttributeId);
        const uploadedAttr = uploadedAttrMap.get(item.socialAttributeId);
        const docGuid = resolveDocumentGuid(item) || uploadedAttr?.documentGuid || null;
        const docBindingId = item.documentBindingId || uploadedAttr?.documentBindingId || null;
        const fileName = item.fileName || uploadedAttr?.fileName || null;

        return {
          id: item.socialAttributeId,
          socialAttributeCode: item.socialAttributeCode || master?.socialAttributeCode || '',
          socialAttributeName: item.socialAttributeName || master?.socialAttributeName || '',
          dataType: master?.dataType || 'BIT',
          unit: master?.unit,
          displayOrder: master?.displayOrder,
          isDiscountApplicable: master?.isDiscountApplicable ?? true,
          propertySocialDetailId: item.id || uploadedAttr?.propertySocialDetailId || undefined,
          bitValue: item.bitValue ?? uploadedAttr?.bitValue ?? null,
          intValue: item.intValue ?? uploadedAttr?.intValue ?? null,
          decimalValue: item.decimalValue ?? uploadedAttr?.decimalValue ?? null,
          textValue: item.textValue ?? uploadedAttr?.textValue ?? null,
          dateValue: item.dateValue ?? uploadedAttr?.dateValue ?? null,
          documentBindingId: docBindingId,
          documentGuid: docGuid,
          documentUrl:
            item.documentUrl ||
            (docGuid ? `/api/documents/${encodeURIComponent(docGuid)}/view` : undefined),
          fileName: fileName,
          remark: item.remark ?? uploadedAttr?.remark ?? null,
          isPhotoRequired: master?.isPhotoRequired,
          isDocumentRequired: master?.isDocumentRequired,
          isActive: master?.isActive,
          entityType: 'P',
          inheritedFrom: null,
          inheritanceLevel: 'Self',
        };
      });

      const individualMappedIds = new Set(mapped.map((m) => m.id));
      for (const attr of discountAttributes) {
        if (!individualMappedIds.has(attr.socialAttributeId)) {
          const master = activeMasterById.get(attr.socialAttributeId);
          if (master && master.isDiscountApplicable === true) {
            const docGuid = attr.documentGuid || null;
            const docBindingId = attr.documentBindingId || null;
            mapped.push({
              id: attr.socialAttributeId,
              socialAttributeCode: master.socialAttributeCode || '',
              socialAttributeName: master.socialAttributeName || '',
              dataType: master.dataType || 'BIT',
              unit: master.unit,
              displayOrder: master.displayOrder,
              isDiscountApplicable: true,
              propertySocialDetailId: attr.propertySocialDetailId || undefined,
              bitValue: attr.bitValue ?? null,
              intValue: attr.intValue ?? null,
              decimalValue: attr.decimalValue ?? null,
              textValue: attr.textValue ?? null,
              dateValue: attr.dateValue ?? null,
              documentBindingId: docBindingId,
              documentGuid: docGuid,
              documentUrl: docGuid ? `/api/documents/${encodeURIComponent(docGuid)}/view` : undefined,
              fileName: attr.fileName || null,
              remark: attr.remark ?? null,
              isPhotoRequired: master.isPhotoRequired,
              isDocumentRequired: master.isDocumentRequired,
              isActive: master.isActive,
              entityType: 'P',
              inheritedFrom: null,
              inheritanceLevel: 'Self',
            });
          }
        }
      }

      freshDiscountData = {
        propertyId: Number(propertyId),
        discountAttributes: mapped,
      };
    }

    for (const l of ['en', 'hi', 'mr']) {
      revalidatePath(`/${l}/property-tax/ptis/QuickDataEntry/${propertyId}/Discount`, 'page');
    }
    return {
      success: true,
      message: 'Discount details saved successfully.',
      data: freshDiscountData,
    };
  } catch (error: unknown) {
    logger.error('updateDiscountDetailsAction failed', { propertyId, error: error as Error });
    return handleActionError(error, 'discount.socialConfirm.unexpectedError', locale);
  }
}

export async function uploadDiscountDocumentAction(
  formData: FormData
): Promise<ApiResponse<DiscountDocumentUploadResponseDto>> {
  try {
    const file = formData.get('File') as File | null;
    const propertyId = Number(formData.get('PropertyId'));
    const socialAttributeId = Number(formData.get('SocialAttributeId'));
    const propertySocialDetailId = Number(formData.get('PropertySocialDetailId') || 0);
    const referenceTableIdGuid = formData.get('ReferenceTableIdGuid') as string | null;
    const remark = formData.get('Remark') as string | null;

    if (!file) return { success: false, error: 'No file provided' };
    if (!propertyId) return { success: false, error: 'Property ID is required' };
    if (!socialAttributeId) return { success: false, error: 'Social Attribute ID is required' };

    const result = await uploadDiscountDocViaGlobalApi(
      file,
      propertyId,
      socialAttributeId,
      propertySocialDetailId,
      referenceTableIdGuid || undefined,
      remark || undefined
    );
    if (result.success && result.data) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error || 'Upload failed' };
  } catch (error: unknown) {
    logger.error('uploadDiscountDocumentAction failed', { error: error as Error });
    return handleActionError(error, 'discount.uploadError');
  }
}

export async function replaceDiscountDocumentAction(
  propertySocialDetailId: number,
  oldDocumentGuid: string,
  formData: FormData
): Promise<ApiResponse<DiscountDocumentUploadResponseDto>> {
  try {
    const file = formData.get('File') as File | null;
    const propertyId = Number(formData.get('PropertyId'));
    const socialAttributeId = Number(formData.get('SocialAttributeId'));
    const referenceTableIdGuid = formData.get('ReferenceTableIdGuid') as string | null;
    const remark = formData.get('Remark') as string | null;

    if (!file) return { success: false, error: 'No file provided' };

    const result = await replaceDiscountDocViaGlobalApi(
      file,
      oldDocumentGuid,
      propertyId,
      socialAttributeId,
      propertySocialDetailId,
      referenceTableIdGuid || undefined,
      remark || undefined
    );
    if (result.success && result.data) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error || 'Replace failed' };
  } catch (error: unknown) {
    logger.error('replaceDiscountDocumentAction failed', {
      propertySocialDetailId,
      error: error as Error,
    });
    return handleActionError(error, 'discount.uploadError');
  }
}

export async function deleteDiscountDocumentAction(
  documentGuid: string
): Promise<ApiResponse<void>> {
  try {
    return await deleteDiscountDoc(documentGuid);
  } catch (error: unknown) {
    logger.error('deleteDiscountDocumentAction failed', { documentGuid, error: error as Error });
    return handleActionError(error, 'discount.deleteError');
  }
}

export async function deletePropertySocialDetailAction(
  propertyId: string,
  socialAttributeId: number,
  locale: string
): Promise<ApiResponse<void>> {
  try {
    const response = await deletePropertySocialDetail(propertyId, socialAttributeId);
    if (response.success) {
      for (const l of ['en', 'hi', 'mr']) {
        revalidatePath(`/${l}/property-tax/ptis/QuickDataEntry/${propertyId}/Discount`, 'page');
      }
    }
    return response;
  } catch (error: unknown) {
    logger.error('deletePropertySocialDetailAction failed', {
      propertyId,
      socialAttributeId,
      error: error as Error,
    });
    return handleActionError(error, 'discount.deleteError', locale);
  }
}

export async function getSocialAttributeMasterAction(
  isActive?: boolean
): Promise<ApiResponse<SocialAttribute[]>> {
  try {
    const attributes = await getSocialAttributes(isActive);
    // Return all items from the API, bypassing any isActive filter since some test data has isActive: false
    return { success: true, data: attributes };
  } catch (error: unknown) {
    logger.error('getSocialAttributeMasterAction failed', { error: error as Error });
    return handleActionError(error, 'discount.unexpectedError');
  }
}

export async function createBulkPropertySocialDetailAction(
  payload: CreateBulkPropertySocialDetailDto
): Promise<ApiResponse<PropertySocialDetailsDto[]>> {
  try {
    const response = await createBulkPropertySocialDetail(payload);
    return response;
  } catch (error: unknown) {
    logger.error('createBulkPropertySocialDetailAction failed', {
      socialAttributeId: payload.socialAttributeId,
      propertyIdsCount: payload.propertyIds?.length,
      error: error as Error,
    });
    return handleActionError(error, 'discount.unexpectedError');
  }
}

export async function getDiscountWingsAction(
  propertyId: string,
  societyId?: number | string | null
): Promise<ApiResponse<WingOption[]>> {
  try {
    const wings = await getDiscountWings(propertyId, societyId);
    return { success: true, data: wings };
  } catch (error: unknown) {
    logger.error('getDiscountWingsAction failed', { propertyId, societyId, error: error as Error });
    return handleActionError(error, 'discount.unexpectedError');
  }
}

export async function getDiscountUnitsAction(
  propertyId: string,
  wingDetailId?: number | null,
  pageNumber: number = 1,
  pageSize: number = 10
): Promise<ApiResponse<{ items: UnitSelectionItem[]; totalCount?: number }>> {
  if (!wingDetailId || Number(wingDetailId) <= 0) {
    return { success: true, data: { items: [], totalCount: 0 } };
  }
  try {
    const units = await getDiscountUnits(propertyId, wingDetailId, pageNumber, pageSize);
    return { success: true, data: units };
  } catch (error: unknown) {
    logger.error('getDiscountUnitsAction failed', {
      propertyId,
      wingDetailId,
      error: error as Error,
    });
    return handleActionError(error, 'discount.unexpectedError');
  }
}

export async function getPropertySocialDetailsByFiltersAction(
  socialAttributeId?: number,
  societyDetailId?: number,
  wingDetailId?: number,
  propertyId?: number
): Promise<ApiResponse<PropertySocialDetailsDto[]>> {
  try {
    const items = await getPropertySocialDetailsByFilters(
      socialAttributeId,
      societyDetailId,
      wingDetailId,
      propertyId
    );
    return { success: true, data: items || [] };
  } catch (error: unknown) {
    logger.error('getPropertySocialDetailsByFiltersAction failed', {
      socialAttributeId,
      societyDetailId,
      wingDetailId,
      propertyId,
      error: error as Error,
    });
    return handleActionError(error, 'discount.unexpectedError');
  }
}

export async function deletePropertySocialDetailsByHierarchyAction(
  params: DeletePropertySocialDetailsByHierarchyParams,
  propertyId?: string,
  locale?: string
): Promise<ApiResponse<void>> {
  try {
    let targetIds: number[] = [];
    if (params.socialAttributeId) {
      try {
        const masterAttributes = await getSocialAttributes();
        targetIds = expandConnectedSocialAttributeIds([params.socialAttributeId], masterAttributes);
      } catch (err) {
        logger.warn('Failed to expand connected social attribute IDs from master, falling back to single ID', { error: err instanceof Error ? err : new Error(String(err)) });
        targetIds = [params.socialAttributeId];
      }
    }

    let lastResponse: ApiResponse<void> = { success: true };
    if (targetIds.length > 0) {
      for (const attrId of targetIds) {
        const res = await deletePropertySocialDetailsByHierarchy({
          ...params,
          socialAttributeId: attrId,
        });
        if (!res.success) {
          lastResponse = res;
        }
      }
    } else {
      lastResponse = await deletePropertySocialDetailsByHierarchy(params);
    }

    if (lastResponse.success && propertyId) {
      for (const l of ['en', 'hi', 'mr']) {
        revalidatePath(`/${l}/property-tax/ptis/QuickDataEntry/${propertyId}/Discount`, 'page');
        revalidatePath(`/${l}/property-tax/ptis/QuickDataEntry/${propertyId}/SocialDetails`, 'page');
      }
    }
    return lastResponse;
  } catch (error: unknown) {
    logger.error('deletePropertySocialDetailsByHierarchyAction failed', {
      socialAttributeId: params.socialAttributeId,
      entityType: params.entityType,
      error: error as Error,
    });
    return handleActionError(error, 'discount.deleteError', locale);
  }
}

export async function getPropertySocialDetailByIdAction(
  id: number
): Promise<ApiResponse<PropertySocialDetailsDto>> {
  try {
    return await getPropertySocialDetailById(id);
  } catch (error: unknown) {
    logger.error('getPropertySocialDetailByIdAction failed', { id, error: error as Error });
    return handleActionError(error, 'discount.unexpectedError');
  }
}

export async function createPropertySocialDetailAction(
  payload: CreatePropertySocialDetailDto,
  locale?: string
): Promise<ApiResponse<PropertySocialDetailsDto>> {
  try {
    const userId = getUserIdFromCookies(await cookies());
    if (!userId) return { success: false, error: 'Unauthorized: Please log in.' };
    payload.createdBy = Number(userId);

    const response = await createPropertySocialDetail(payload);
    if (response.success && payload.propertyId) {
      for (const l of ['en', 'hi', 'mr']) {
        revalidatePath(
          `/${l}/property-tax/ptis/QuickDataEntry/${payload.propertyId}/Discount`,
          'page'
        );
      }
    }
    return response;
  } catch (error: unknown) {
    logger.error('createPropertySocialDetailAction failed', {
      propertyId: payload.propertyId,
      socialAttributeId: payload.socialAttributeId,
      entityType: payload.entityType,
      error: error as Error,
    });
    return handleActionError(error, 'discount.unexpectedError', locale);
  }
}
