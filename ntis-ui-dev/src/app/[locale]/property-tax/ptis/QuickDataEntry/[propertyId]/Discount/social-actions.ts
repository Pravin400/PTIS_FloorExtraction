'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import {
  getPropertySocialInfo,
  uploadSocialPhotoViaGlobalApi,
  replaceSocialPhotoViaGlobalApi,
  deleteSocialPhotoViaGlobalApi,
  deletePropertySocialDetailsByHierarchy,
  getPropertySocialInfoFilterBy,
  upsertPropertySocialInfoFilterBy,
  createPropertySocialDetail,
  updatePropertySocialDetail,
  createBulkPropertySocialDetail,
  getPropertySocialDetailsByFilters,
} from '@/lib/api/property-social-details.service';
import { getSocialAttributes } from '@/lib/api/social-attribute-master/social-attribute-crud.service';
import { DiscountDocumentUploadResponseDto } from '@/types/discount.types';
import { getUserIdFromCookies } from '@/lib/utils/cookie';
import { logger } from '@/lib/utils/logger';
import { updateBindingReference } from '@/lib/api/document.service';
import { ApiResponse } from '@/types/common.types';
import {
  PropertySocialInfoApiResponse,
  PropertySocialInfoResponseDto,
  PropertySocialInfoItemDto,
  DeletePropertySocialDetailsByHierarchyParams,
  UpsertPropertySocialInfoBulkDto,
  PropertySocialDetailsDto,
  CreatePropertySocialDetailDto,
  UpdatePropertySocialDetailDto,
  CreateBulkPropertySocialDetailDto,
} from '@/types/property-social-details.types';
import { cleanCommonApiError, handleActionError } from '@/lib/utils/action-error-helpers';
import { resolveScope, expandConnectedSocialAttributeIds } from '@/lib/utils/ptis/social-details';

export async function getPropertySocialInfoAction(
  propertyId: string
): Promise<ApiResponse<PropertySocialInfoApiResponse>> {
  try {
    return await getPropertySocialInfo(propertyId);
  } catch (error: unknown) {
    logger.error('getPropertySocialInfoAction failed', { propertyId, error: error as Error });
    return handleActionError(error, 'discount.socialConfirm.unexpectedError');
  }
}

import { parseJsonArray } from '@/lib/utils/validate-form-payload';

export async function upsertPropertySocialInfoAction(
  locale: string,
  propertyId: string,
  formData: FormData
): Promise<ApiResponse<PropertySocialInfoResponseDto>> {
  try {
    const t = await getTranslations({ locale, namespace: 'quickDataEntry' });
    const userId = getUserIdFromCookies(await cookies());
    if (!userId) return { success: false, error: 'Unauthorized: Please log in.' };

    const socialAttributes = parseJsonArray<PropertySocialInfoItemDto>(
      formData.get('socialAttributes'),
      'socialAttributes'
    );
    const socialAttributeIdsToRemove = parseJsonArray<number>(
      formData.get('socialAttributeIdsToRemove'),
      'socialAttributeIdsToRemove'
    );

    const validationErrors: string[] = [];
    for (const attr of socialAttributes) {
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

    const level = formData.get('level') as string | null;
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

    const initialFlatData: Record<
      number,
      {
        id?: number | null;
        documentGuid?: string | null;
        documentBindingId?: number | null;
        photoBindingId?: number | null;
      }
    > = {};
    (initialExistingDetails || []).forEach((item) => {
      const existing = initialFlatData[item.socialAttributeId];
      if (!existing || (item.id && (!existing.id || item.id > existing.id))) {
        initialFlatData[item.socialAttributeId] = {
          id: item.id,
          documentGuid: item.documentGuid || item.photoGuid || null,
          documentBindingId: item.documentBindingId != null ? Number(item.documentBindingId) : null,
          photoBindingId: item.photoBindingId != null ? Number(item.photoBindingId) : null,
        };
      }
    });

    const masterAttributes = await getSocialAttributes().catch(() => []);
    const expandedAttributeIdsToRemove = expandConnectedSocialAttributeIds(
      socialAttributeIdsToRemove,
      masterAttributes
    );

    // Process any deleted documents from removed attributes
    for (const removeId of expandedAttributeIdsToRemove) {
      const initialEntry = Object.values(initialFlatData).find((e) => e.id === removeId);
      if (initialEntry?.documentGuid) {
        await deleteSocialPhotoViaGlobalApi(initialEntry.documentGuid);
      }
    }

    // 1. Process photos/files first (upload, replace, or delete)
    const newlyUploadedBindingMap: Record<number, number> = {};
    for (const attr of socialAttributes) {
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
        const propIdNum = level === 'Unit' && unitIds.length > 0 ? unitIds[0] : Number(propertyId);
        const detailId = attr.id || 0;
        const attrId = attr.socialAttributeId;
        const guidReference = detailId === 0 ? crypto.randomUUID() : undefined;

        const uploadResult =
          oldGuid && !isInherited
            ? await replaceSocialPhotoViaGlobalApi(
                file,
                oldGuid,
                propIdNum,
                attrId,
                detailId,
                guidReference
              )
            : await uploadSocialPhotoViaGlobalApi(file, propIdNum, attrId, detailId, guidReference);

        if (uploadResult.success && (uploadResult.data?.documentBindingId || uploadResult.data?.documentGuid)) {
          if (uploadResult.data.documentBindingId) {
            newlyUploadedBindingMap[attr.socialAttributeId] = uploadResult.data.documentBindingId;
          }
          attr.photoBindingId = uploadResult.data.documentBindingId;
          attr.photoGuid = uploadResult.data.documentGuid;
          attr.fileName = uploadResult.data.fileName || file.name;
        } else {
          throw new Error(uploadResult.error || 'Failed to upload photo');
        }
      } else if (oldGuid && !isInherited && !attr.photoBindingId && !attr.photoGuid && !attr.documentBindingId && !attr.documentGuid) {
        try {
          await deleteSocialPhotoViaGlobalApi(oldGuid);
        } catch (delError) {
          logger.warn('Failed to clean up old social photo', { oldGuid, error: delError instanceof Error ? delError : new Error(String(delError)) });
        }
      }
    }

    // 2. Delete attributes that were removed/deselected
    for (const removeId of expandedAttributeIdsToRemove) {
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

    // 3. Persist social attributes using PUT /PropertySocialDetails/{id} (if updating existing) or POST /PropertySocialDetails (if new)
    const activeSocialAttributes = socialAttributes.filter(
      (attr) => !expandedAttributeIdsToRemove.includes(Number(attr.socialAttributeId))
    );
    for (const attr of activeSocialAttributes) {
      const sanitizedBitValue = attr.bitValue != null ? attr.bitValue : null;
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
          const attrRecordId = attr.id;
          if (
            attrRecordId &&
            Number(attrRecordId) > 0 &&
            (!attr.entityType || attr.entityType === 'S') &&
            !isInherited
          ) {
            existingRecordId = Number(attrRecordId);
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
          const wingMatches = (wingExistingDetails.length > 0 ? wingExistingDetails : (initialExistingDetails || [])).filter(
            (w) =>
              (w.socialAttributeId === attr.socialAttributeId || w.id === attr.socialAttributeId) &&
              (w.entityType === 'W' || (w.wingDetailId === wingIdNum && (!w.propertyId || Number(w.propertyId) === 0)))
          );
          const wingMatch = wingMatches.sort((a, b) => Number(b.id || 0) - Number(a.id || 0))[0];
          if (wingMatch?.id && Number(wingMatch.id) > 0) {
            existingRecordId = Number(wingMatch.id);
          } else {
            const attrRecordId = attr.id;
            if (
              attrRecordId &&
              Number(attrRecordId) > 0 &&
              attr.entityType === 'W'
            ) {
              existingRecordId = Number(attrRecordId);
            } else if (
              initialAttr?.id &&
              Number(initialAttr.id) > 0 &&
              !isInherited
            ) {
              existingRecordId = Number(initialAttr.id);
            }
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
            } else {
              const attrRecordId = attr.id;
              if (
                attrRecordId &&
                Number(attrRecordId) > 0 &&
                attr.entityType === 'P'
              ) {
                existingRecordId = Number(attrRecordId);
              }
            }
          }
        }
      } else {
        // Individual Property
        const attrRecordId = attr.id;
        if (
          attrRecordId &&
          Number(attrRecordId) > 0 &&
          (attr.entityType === 'P' || !attr.entityType)
        ) {
          existingRecordId = Number(attrRecordId);
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

      const isPhotoNewlyUploaded = Boolean(newlyUploadedBindingMap[attr.socialAttributeId]);
      let effectiveBindingId: number | null = null;

      if (isPhotoNewlyUploaded) {
        effectiveBindingId = newlyUploadedBindingMap[attr.socialAttributeId];
      } else if (attr.photoBindingId && Number(attr.photoBindingId) > 0) {
        effectiveBindingId = Number(attr.photoBindingId);
      } else if (attr.documentBindingId && Number(attr.documentBindingId) > 0) {
        effectiveBindingId = Number(attr.documentBindingId);
      }

      const effectivePhotoBindingId = effectiveBindingId;
      const effectiveDocumentBindingId = effectiveBindingId;

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
            if (isPhotoNewlyUploaded && effectivePhotoBindingId && existingRecordId) {
              await updateBindingReference(effectivePhotoBindingId, existingRecordId);
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
            if (isPhotoNewlyUploaded && effectivePhotoBindingId && res.data?.id) {
              await updateBindingReference(effectivePhotoBindingId, res.data.id);
            }
          }
        } else if (level === 'Wing' || (level === 'Unit' && isAllUnitsSelected)) {
          // Wing Level (or when all units in wing are selected, apply single record to Wing directly)
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
            if (isPhotoNewlyUploaded && effectivePhotoBindingId && existingRecordId) {
              await updateBindingReference(effectivePhotoBindingId, existingRecordId);
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
            if (isPhotoNewlyUploaded && effectivePhotoBindingId && res.data?.id) {
              await updateBindingReference(effectivePhotoBindingId, res.data.id);
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
              if (isPhotoNewlyUploaded && effectivePhotoBindingId && existingUnitRecordId) {
                await updateBindingReference(effectivePhotoBindingId, existingUnitRecordId);
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
              if (isPhotoNewlyUploaded && effectivePhotoBindingId && res.data?.id) {
                await updateBindingReference(effectivePhotoBindingId, res.data.id);
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
              if (isPhotoNewlyUploaded && effectivePhotoBindingId && res.data?.id) {
                await updateBindingReference(effectivePhotoBindingId, res.data.id);
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
          attr.id = existingRecordId;
          if (isPhotoNewlyUploaded && effectivePhotoBindingId && existingRecordId) {
            await updateBindingReference(effectivePhotoBindingId, existingRecordId);
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
          if (res.data?.id) {
            attr.id = res.data.id;
          }
          if (isPhotoNewlyUploaded && effectivePhotoBindingId && res.data?.id) {
            await updateBindingReference(effectivePhotoBindingId, res.data.id);
          }
        }
      }
    }

    let freshSocialData: PropertySocialInfoResponseDto | undefined;

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
          : Promise.resolve([]),
      ]);

      const masterById = new Map((masterRes || []).map((a) => [a.id, a]));
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

      const socialSavedDetails = Array.from(mergedDetailsMap.values()).filter((item) => {
        const master = masterById.get(item.socialAttributeId);
        return master && master.isDiscountApplicable === false && master.isActive !== false;
      });

      const uploadedAttrMap = new Map(
        socialAttributes.map((a) => [a.socialAttributeId, a])
      );

      const mapped = socialSavedDetails.map((item) => {
        const master = masterById.get(item.socialAttributeId);
        const uploadedAttr = uploadedAttrMap.get(item.socialAttributeId);
        const docGuid = item.documentGuid || uploadedAttr?.documentGuid || null;
        const photoGuid = item.photoGuid || uploadedAttr?.photoGuid || null;
        const docBindingId = item.documentBindingId || uploadedAttr?.documentBindingId || null;
        const photoBindingId = item.photoBindingId || uploadedAttr?.photoBindingId || null;
        const fileName = item.fileName || uploadedAttr?.fileName || null;

        return {
          id: item.socialAttributeId,
          socialAttributeCode: item.socialAttributeCode || master?.socialAttributeCode || '',
          socialAttributeName: item.socialAttributeName || master?.socialAttributeName || '',
          dataType: master?.dataType || 'BIT',
          unit: master?.unit,
          displayOrder: master?.displayOrder,
          parentAttributeId: masterById.get(item.socialAttributeId)?.parentAttributeId ?? null,
          isRequiredWhenParentTrue: masterById.get(item.socialAttributeId)?.isRequiredWhenParentTrue ?? false,
          isDiscountApplicable: master?.isDiscountApplicable ?? false,
          propertySocialDetailId: item.id || uploadedAttr?.id || undefined,
          bitValue: item.bitValue ?? uploadedAttr?.bitValue ?? null,
          intValue: item.intValue ?? uploadedAttr?.intValue ?? null,
          decimalValue: item.decimalValue ?? uploadedAttr?.decimalValue ?? null,
          textValue: item.textValue ?? uploadedAttr?.textValue ?? null,
          dateValue: item.dateValue ?? uploadedAttr?.dateValue ?? null,
          documentBindingId: docBindingId,
          documentGuid: docGuid,
          documentUrl:
            item.documentUrl ||
            (docGuid
              ? `/api/documents/${encodeURIComponent(docGuid)}/view`
              : (photoGuid ? `/api/documents/${encodeURIComponent(photoGuid)}/view` : undefined)),
          fileName: fileName,
          photoBindingId: photoBindingId,
          photoGuid: photoGuid,
          remark: item.remark ?? uploadedAttr?.remark ?? null,
          photoTypeId: null,
          isPhotoRequired: master?.isPhotoRequired,
          isDocumentRequired: master?.isDocumentRequired,
          isActive: master?.isActive,
          entityType: item.entityType,
          inheritedFrom: item.inheritedFrom,
          inheritanceLevel: item.inheritanceLevel,
          children: [],
        };
      });

      const societyMappedIds = new Set(mapped.map((m) => m.id));
      for (const attr of socialAttributes) {
        if (!societyMappedIds.has(attr.socialAttributeId)) {
          const master = masterById.get(attr.socialAttributeId);
          if (master && master.isDiscountApplicable === false) {
            const docGuid = attr.documentGuid || null;
            const photoGuid = attr.photoGuid || null;
            const docBindingId = attr.documentBindingId || null;
            const photoBindingId = attr.photoBindingId || null;
            mapped.push({
              id: attr.socialAttributeId,
              socialAttributeCode: master.socialAttributeCode || '',
              socialAttributeName: master.socialAttributeName || '',
              dataType: master.dataType || 'BIT',
              unit: master.unit,
              displayOrder: master.displayOrder,
              parentAttributeId: master.parentAttributeId ?? null,
              isRequiredWhenParentTrue: master.isRequiredWhenParentTrue ?? false,
              isDiscountApplicable: false,
              propertySocialDetailId: attr.id || undefined,
              bitValue: attr.bitValue ?? null,
              intValue: attr.intValue ?? null,
              decimalValue: attr.decimalValue ?? null,
              textValue: attr.textValue ?? null,
              dateValue: attr.dateValue ?? null,
              documentBindingId: docBindingId,
              documentGuid: docGuid,
              documentUrl: docGuid
                ? `/api/documents/${encodeURIComponent(docGuid)}/view`
                : (photoGuid ? `/api/documents/${encodeURIComponent(photoGuid)}/view` : undefined),
              fileName: attr.fileName || null,
              photoBindingId: photoBindingId,
              photoGuid: photoGuid,
              remark: attr.remark ?? null,
              photoTypeId: null,
              isPhotoRequired: master.isPhotoRequired,
              isDocumentRequired: master.isDocumentRequired,
              isActive: master.isActive,
              entityType: level === 'Apartment' ? 'S' : level === 'Wing' ? 'W' : 'P',
              inheritedFrom: null,
              inheritanceLevel: 'Self',
              children: [],
            });
          }
        }
      }

      freshSocialData = {
        propertyId: Number(propertyId),
        societyDetailId: payloadSocietyDetailId,
        wingDetailId: payloadWingDetailId,
        socialAttributes: mapped,
      };
    } else {
      const [individualDetailsRes, masterRes] = await Promise.all([
        getPropertySocialDetailsByFilters(undefined, undefined, undefined, Number(propertyId)),
        getSocialAttributes(),
      ]);

      const masterById = new Map((masterRes || []).map((a) => [a.id, a]));
      const individualItems = individualDetailsRes || [];
      const dedupedDetailsMap = new Map<number, PropertySocialDetailsDto>();
      individualItems.forEach((item) => {
        const existing = dedupedDetailsMap.get(item.socialAttributeId);
        if (!existing || (item.id && (!existing.id || item.id > existing.id))) {
          dedupedDetailsMap.set(item.socialAttributeId, item);
        }
      });

      const socialSavedDetails = Array.from(dedupedDetailsMap.values()).filter((item) => {
        const master = masterById.get(item.socialAttributeId);
        return master && master.isDiscountApplicable === false && master.isActive !== false;
      });

      const uploadedAttrMap = new Map(
        socialAttributes.map((a) => [a.socialAttributeId, a])
      );

      const mapped = socialSavedDetails.map((item) => {
        const master = masterById.get(item.socialAttributeId);
        const uploadedAttr = uploadedAttrMap.get(item.socialAttributeId);
        const docGuid = item.documentGuid || uploadedAttr?.documentGuid || null;
        const photoGuid = item.photoGuid || uploadedAttr?.photoGuid || null;
        const docBindingId = item.documentBindingId || uploadedAttr?.documentBindingId || null;
        const photoBindingId = item.photoBindingId || uploadedAttr?.photoBindingId || null;
        const fileName = item.fileName || uploadedAttr?.fileName || null;

        return {
          id: item.socialAttributeId,
          socialAttributeCode: item.socialAttributeCode || master?.socialAttributeCode || '',
          socialAttributeName: item.socialAttributeName || master?.socialAttributeName || '',
          dataType: master?.dataType || 'BIT',
          unit: master?.unit,
          displayOrder: master?.displayOrder,
          parentAttributeId: masterById.get(item.socialAttributeId)?.parentAttributeId ?? null,
          isRequiredWhenParentTrue: masterById.get(item.socialAttributeId)?.isRequiredWhenParentTrue ?? false,
          isDiscountApplicable: master?.isDiscountApplicable ?? false,
          propertySocialDetailId: item.id || uploadedAttr?.id || undefined,
          bitValue: item.bitValue ?? uploadedAttr?.bitValue ?? null,
          intValue: item.intValue ?? uploadedAttr?.intValue ?? null,
          decimalValue: item.decimalValue ?? uploadedAttr?.decimalValue ?? null,
          textValue: item.textValue ?? uploadedAttr?.textValue ?? null,
          dateValue: item.dateValue ?? uploadedAttr?.dateValue ?? null,
          documentBindingId: docBindingId,
          documentGuid: docGuid,
          documentUrl:
            item.documentUrl ||
            (docGuid
              ? `/api/documents/${encodeURIComponent(docGuid)}/view`
              : (photoGuid ? `/api/documents/${encodeURIComponent(photoGuid)}/view` : undefined)),
          fileName: fileName,
          photoBindingId: photoBindingId,
          photoGuid: photoGuid,
          remark: item.remark ?? uploadedAttr?.remark ?? null,
          photoTypeId: null,
          isPhotoRequired: master?.isPhotoRequired,
          isDocumentRequired: master?.isDocumentRequired,
          isActive: master?.isActive,
          entityType: 'P',
          inheritedFrom: null,
          inheritanceLevel: 'Self',
          children: [],
        };
      });

      const individualMappedIds = new Set(mapped.map((m) => m.id));
      for (const attr of socialAttributes) {
        if (!individualMappedIds.has(attr.socialAttributeId)) {
          const master = masterById.get(attr.socialAttributeId);
          if (master && master.isDiscountApplicable === false) {
            const docGuid = attr.documentGuid || null;
            const photoGuid = attr.photoGuid || null;
            const docBindingId = attr.documentBindingId || null;
            const photoBindingId = attr.photoBindingId || null;
            mapped.push({
              id: attr.socialAttributeId,
              socialAttributeCode: master.socialAttributeCode || '',
              socialAttributeName: master.socialAttributeName || '',
              dataType: master.dataType || 'BIT',
              unit: master.unit,
              displayOrder: master.displayOrder,
              parentAttributeId: master.parentAttributeId ?? null,
              isRequiredWhenParentTrue: master.isRequiredWhenParentTrue ?? false,
              isDiscountApplicable: false,
              propertySocialDetailId: attr.id || undefined,
              bitValue: attr.bitValue ?? null,
              intValue: attr.intValue ?? null,
              decimalValue: attr.decimalValue ?? null,
              textValue: attr.textValue ?? null,
              dateValue: attr.dateValue ?? null,
              documentBindingId: docBindingId,
              documentGuid: docGuid,
              documentUrl: docGuid
                ? `/api/documents/${encodeURIComponent(docGuid)}/view`
                : (photoGuid ? `/api/documents/${encodeURIComponent(photoGuid)}/view` : undefined),
              fileName: attr.fileName || null,
              photoBindingId: photoBindingId,
              photoGuid: photoGuid,
              remark: attr.remark ?? null,
              photoTypeId: null,
              isPhotoRequired: master.isPhotoRequired,
              isDocumentRequired: master.isDocumentRequired,
              isActive: master.isActive,
              entityType: 'P',
              inheritedFrom: null,
              inheritanceLevel: 'Self',
              children: [],
            });
          }
        }
      }

      freshSocialData = {
        propertyId: Number(propertyId),
        societyDetailId: null,
        wingDetailId: null,
        socialAttributes: mapped,
      };
    }

    for (const l of ['en', 'hi', 'mr']) {
      revalidatePath(`/${l}/property-tax/ptis/QuickDataEntry/${propertyId}/Discount`, 'page');
    }
    return {
      success: true,
      message:
        t('discount.socialConfirm.saveSuccess') ||
        'Property social information updated successfully',
      data: freshSocialData,
    };
  } catch (error: unknown) {
    logger.error('upsertPropertySocialInfoAction failed', { propertyId, error: error as Error });
    return handleActionError(error, 'discount.socialConfirm.unexpectedError', locale);
  }
}

export async function uploadSocialPhotoAction(
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

    const result = await uploadSocialPhotoViaGlobalApi(
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
    logger.error('uploadSocialPhotoAction failed', { error: error as Error });
    return handleActionError(error, 'discount.uploadError');
  }
}

export async function replaceSocialPhotoAction(
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

    const result = await replaceSocialPhotoViaGlobalApi(
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
    logger.error('replaceSocialPhotoAction failed', {
      propertySocialDetailId,
      error: error as Error,
    });
    return handleActionError(error, 'discount.uploadError');
  }
}

export async function deleteSocialDocumentAction(documentGuid: string): Promise<ApiResponse<void>> {
  try {
    return await deleteSocialPhotoViaGlobalApi(documentGuid);
  } catch (error: unknown) {
    logger.error('deleteSocialDocumentAction failed', { documentGuid, error: error as Error });
    return handleActionError(error, 'discount.deleteError');
  }
}

import {
  deletePropertySocialDetailAction as deletePropertySocialDetailActionBase,
  deletePropertySocialDetailsByHierarchyAction as deletePropertySocialDetailsByHierarchyActionBase,
  getPropertySocialDetailByIdAction as getPropertySocialDetailByIdActionBase,
  createPropertySocialDetailAction as createPropertySocialDetailActionBase,
  createBulkPropertySocialDetailAction as createBulkPropertySocialDetailActionBase,
  getPropertySocialDetailsByFiltersAction as getPropertySocialDetailsByFiltersActionBase,
} from './discount-actions';

export async function deletePropertySocialDetailAction(
  propertyId: string,
  socialAttributeId: number,
  locale: string
): Promise<ApiResponse<void>> {
  return deletePropertySocialDetailActionBase(propertyId, socialAttributeId, locale);
}

export async function deletePropertySocialDetailsByHierarchyAction(
  params: DeletePropertySocialDetailsByHierarchyParams,
  propertyId?: string,
  locale?: string
): Promise<ApiResponse<void>> {
  return deletePropertySocialDetailsByHierarchyActionBase(params, propertyId, locale);
}

export async function getPropertySocialDetailByIdAction(
  id: number
): Promise<ApiResponse<PropertySocialDetailsDto>> {
  return getPropertySocialDetailByIdActionBase(id);
}

export async function createPropertySocialDetailAction(
  payload: CreatePropertySocialDetailDto,
  locale?: string
): Promise<ApiResponse<PropertySocialDetailsDto>> {
  return createPropertySocialDetailActionBase(payload, locale);
}

export async function createBulkPropertySocialDetailAction(
  payload: CreateBulkPropertySocialDetailDto
): Promise<ApiResponse<PropertySocialDetailsDto[]>> {
  return createBulkPropertySocialDetailActionBase(payload);
}

export async function getPropertySocialDetailsByFiltersAction(
  socialAttributeId?: number,
  societyDetailId?: number,
  wingDetailId?: number,
  propertyId?: number
): Promise<ApiResponse<PropertySocialDetailsDto[]>> {
  return getPropertySocialDetailsByFiltersActionBase(
    socialAttributeId,
    societyDetailId,
    wingDetailId,
    propertyId
  );
}

export async function getPropertySocialInfoFilterByAction(params: {
  propertyId?: number | null;
  societyDetailId?: number | null;
  wingDetailId?: number | null;
}): Promise<ApiResponse<PropertySocialInfoApiResponse>> {
  try {
    return await getPropertySocialInfoFilterBy(params);
  } catch (error: unknown) {
    logger.error('getPropertySocialInfoFilterByAction failed', { params, error: error as Error });
    return handleActionError(error, 'discount.socialConfirm.unexpectedError');
  }
}

export async function upsertPropertySocialInfoFilterByAction(
  payload: UpsertPropertySocialInfoBulkDto,
  locale?: string
): Promise<ApiResponse<PropertySocialDetailsDto[]>> {
  try {
    const response = await upsertPropertySocialInfoFilterBy(payload);
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
    logger.error('upsertPropertySocialInfoFilterByAction failed', {
      payload,
      error: error as Error,
    });
    return handleActionError(error, 'discount.socialConfirm.unexpectedError', locale);
  }
}
