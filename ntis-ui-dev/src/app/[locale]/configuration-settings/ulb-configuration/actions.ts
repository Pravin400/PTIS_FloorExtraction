'use server';

import type { ApiResponse } from '@/types/common.types';
import type {
  Department,
  DepartmentLicenceDetails,
  DepartmentLicense,
  ULBConfigurationFormData,
  UlbConfigurationMaster,
  UlbConfigurationPageData,
  UlbImageMasterDto,
  UlbImageMasterUploadResponseDto,
  UlbSectionKey,
} from '@/types/ulbconfig-master.types';
import { ApiError } from '@/lib/utils/api';
import {
  createUlbMaster,
  getUlbMaster,
  getUlbMasterById,
  updateUlbMaster,
  getUlbImages,
  deleteUlbImage,
  updateUlbImageType,
  getUlbImageView,
  createUlbImageMaster,
} from '@/lib/api/configuration-settings/ulb-configuration/ulb-master.services';
import { uploadDocument } from '@/lib/api/document.service';
import {
  createDepartmentLicence,
  getAllDepartmentLicences,
  getAllDepartments,
  saveDepartmentLicence,
  updateDepartmentLicence,
  syncMasterDepartmentWithLicense,
} from '@/lib/api/configuration-settings/ulb-configuration/ulbConfiguration.service';
import {
  findInvalidEnabledDepartment,
  getDepartmentLicencesToSave,
} from '@/lib/api/configuration-settings/ulb-configuration/department-licence.validator';
import {
  handleActionError,
  revalidateUlbConfiguration,
  resolveUserId,
  validateAndNormalize,
} from './actions.utils';

/**
 * Loads all SSR data required by the ULB configuration screen.
 * Uses partial success so one failed endpoint does not block the whole page.
 */
export async function getUlbConfigurationPageDataAction(): Promise<
  ApiResponse<UlbConfigurationPageData>
> {
  const [ulbResult, licencesResult, deptsResult, imagesResult] = await Promise.allSettled([
    getUlbMaster(),
    getAllDepartmentLicences(),
    getAllDepartments(),
    getUlbImages(1, 50),
  ]);

  const ulb = ulbResult.status === 'fulfilled' ? ulbResult.value : null;
  const licences = licencesResult.status === 'fulfilled' ? licencesResult.value : [];
  const departments = deptsResult.status === 'fulfilled' ? deptsResult.value : [];
  const imagesRes = imagesResult.status === 'fulfilled' ? imagesResult.value : { items: [] };
  const images = imagesRes.items || [];

  const allRejected =
    ulbResult.status === 'rejected' &&
    licencesResult.status === 'rejected' &&
    deptsResult.status === 'rejected' &&
    imagesResult.status === 'rejected';

  if (allRejected) {
    return handleActionError<UlbConfigurationPageData>(
      ulbResult.status === 'rejected' ? ulbResult.reason : undefined,
      'messages.fetchError'
    );
  }

  return {
    success: true,
    data: { ulb, departments, licences, images },
  };
}

/** GET `/DepartmentMaster?PageNumber=1&PageSize=-1` — all departments for the licence section. */
export async function getAllDepartmentsAction(): Promise<ApiResponse<Department[]>> {
  try {
    const data = await getAllDepartments();
    return { success: true, data };
  } catch (error: unknown) {
    return handleActionError<Department[]>(error, 'messages.fetchError');
  }
}

/** GET `/DepartmentLicenceDetails?PageNumber=1&PageSize=-1` — all department licences. */
export async function getAllDepartmentLicencesAction(): Promise<
  ApiResponse<DepartmentLicenceDetails[]>
> {
  try {
    const data = await getAllDepartmentLicences();
    return { success: true, data };
  } catch (error: unknown) {
    return handleActionError<DepartmentLicenceDetails[]>(error, 'messages.fetchError');
  }
}

/** GET `/ULBMaster` — active ULB configuration record. */
export async function getUlbMasterAction(): Promise<ApiResponse<UlbConfigurationMaster | null>> {
  try {
    const data = await getUlbMaster();
    return { success: true, data };
  } catch (error: unknown) {
    return handleActionError<UlbConfigurationMaster | null>(error, 'messages.fetchError');
  }
}

/** GET `/ULBMaster/{id}` — single ULB master record. */
export async function getUlbMasterByIdAction(id: number): Promise<ApiResponse<UlbConfigurationMaster>> {
  try {
    const data = await getUlbMasterById(id);
    return { success: true, data };
  } catch (error: unknown) {
    return handleActionError<UlbConfigurationMaster>(error, 'messages.fetchError');
  }
}

/**
 * POST `/ULBMaster` — create ULB master configuration.
 */
export async function createUlbMasterAction(
  data: ULBConfigurationFormData,
  section?: UlbSectionKey
): Promise<ApiResponse<UlbConfigurationMaster>> {
  try {
    const validationResult = validateAndNormalize(data, section);

    if (!validationResult.isValid) {
      return { success: false, error: `validation.${validationResult.validationCode}` };
    }

    const userId = await resolveUserId();
    if (!userId) {
      throw new ApiError(401, 'Unauthorized', 'User session expired');
    }

    const result = await createUlbMaster(validationResult.normalizedData);

    revalidateUlbConfiguration();

    return {
      success: true,
      data: result.ulb,
      message: result.message,
    };
  } catch (error: unknown) {
    return handleActionError<UlbConfigurationMaster>(error, 'messages.createFailed');
  }
}

/**
 * PUT `/ULBMaster/{id}` — update ULB master configuration.
 */
export async function updateUlbMasterAction(
  id: number,
  data: ULBConfigurationFormData,
  section?: UlbSectionKey
): Promise<ApiResponse<UlbConfigurationMaster>> {
  try {
    const validationResult = validateAndNormalize(data, section);

    if (!validationResult.isValid) {
      return { success: false, error: `validation.${validationResult.validationCode}` };
    }

    const userId = await resolveUserId();
    if (!userId) {
      throw new ApiError(401, 'Unauthorized', 'User session expired');
    }

    const result = await updateUlbMaster(id, validationResult.normalizedData);

    revalidateUlbConfiguration();

    return {
      success: true,
      data: result.ulb,
      message: result.message,
    };
  } catch (error: unknown) {
    return handleActionError<UlbConfigurationMaster>(error, 'messages.updateFailed');
  }
}

export async function updateDepartmentLicenceAction(
  id: number | string,
  data: DepartmentLicenceDetails
): Promise<ApiResponse<DepartmentLicenceDetails>> {
  try {
    const userId = await resolveUserId();
    if (!userId) {
      throw new ApiError(401, 'Unauthorized', 'User session expired');
    }

    const result = await updateDepartmentLicence(id, data);
    revalidateUlbConfiguration();
    return { success: true, data: result.licence, message: result.message };
  } catch (error: unknown) {
    return handleActionError<DepartmentLicenceDetails>(error, 'messages.updateFailed');
  }
}

export async function createDepartmentLicenceAction(
  data: DepartmentLicenceDetails
): Promise<ApiResponse<DepartmentLicenceDetails>> {
  try {
    const userId = await resolveUserId();
    if (!userId) {
      throw new ApiError(401, 'Unauthorized', 'User session expired');
    }

    const result = await createDepartmentLicence(data);
    revalidateUlbConfiguration();
    return { success: true, data: result.licence, message: result.message };
  } catch (error: unknown) {
    return handleActionError<DepartmentLicenceDetails>(error, 'messages.createFailed');
  }
}

/** PUT `/DepartmentLicenceDetails/{id}` — update a single department licence. */
export async function updateDepartmentLicenceByIdAction(
  id: number,
  dept: DepartmentLicense
): Promise<ApiResponse<DepartmentLicenceDetails>> {
  try {
    const userId = await resolveUserId();
    if (!userId) {
      throw new ApiError(401, 'Unauthorized', 'User session expired');
    }

    if (!dept.startDate?.trim() || !dept.duration?.trim() || !dept.endDate?.trim()) {
      return { success: false, error: 'messages.validation' };
    }

    const result = await saveDepartmentLicence({ ...dept, departmentLicenceDetailsId: id });
    revalidateUlbConfiguration();
    return { success: true, data: result.licence, message: result.message };
  } catch (error: unknown) {
    return handleActionError<DepartmentLicenceDetails>(error, 'messages.updateFailed');
  }
}

/** POST/PUT `/DepartmentLicenceDetails` — save enabled department licence cards. */
export async function saveDepartmentLicencesAction(
  departments: DepartmentLicense[]
): Promise<ApiResponse<DepartmentLicenceDetails[]>> {
  try {
    const userId = await resolveUserId();
    if (!userId) {
      throw new ApiError(401, 'Unauthorized', 'User session expired');
    }

    const toSave = getDepartmentLicencesToSave(departments);
    if (toSave.length === 0) {
      return { success: false, error: 'messages.noDepartments' };
    }

    if (findInvalidEnabledDepartment(toSave)) {
      return { success: false, error: 'messages.validation' };
    }

    const results = await Promise.allSettled(toSave.map((dept) => saveDepartmentLicence(dept)));

    const saved: DepartmentLicenceDetails[] = [];
    const failures: string[] = [];
    let lastMessage = 'Record saved successfully';

    for (const result of results) {
      if (result.status === 'fulfilled') {
        saved.push(result.value.licence);
        lastMessage = result.value.message;
      } else {
        const failure = handleActionError<never>(result.reason, 'messages.error');
        failures.push(failure.error ?? 'messages.error');
      }
    }

    if (saved.length === 0) {
      const firstRejected = results.find((result) => result.status === 'rejected');
      return handleActionError<DepartmentLicenceDetails[]>(
        firstRejected?.status === 'rejected' ? firstRejected.reason : undefined,
        'messages.error'
      );
    }

    // Sync active state back to DepartmentMaster in parallel
    await Promise.allSettled(
      saved.map((licence) => {
        const deptId = licence.departmentId ?? licence.departmentMasterId;
        return deptId != null
          ? syncMasterDepartmentWithLicense(deptId, !!licence.isActive, userId)
          : Promise.resolve();
      })
    );

    revalidateUlbConfiguration();

    if (failures.length > 0) {
      return {
        success: false,
        data: saved,
        error: failures[0],
        message: lastMessage,
      };
    }

    return {
      success: true,
      data: saved,
      message: lastMessage,
    };
  } catch (error: unknown) {
    return handleActionError<DepartmentLicenceDetails[]>(error, 'messages.error');
  }
}

/** Server Action to upload a logo/gallery image */
export async function uploadUlbImageAction(
  formData: FormData
): Promise<ApiResponse<UlbImageMasterUploadResponseDto>> {
  try {
    const fileRaw = formData.get("File");
    const file = fileRaw instanceof File ? fileRaw : null;
    const imageType = formData.get("ImageType") as string | null;

    if (!file) {
      return { success: false, error: "No file provided" };
    }
    if (!imageType) {
      return { success: false, error: "No image type provided" };
    }

    const userId = await resolveUserId();
    if (!userId) {
      throw new ApiError(401, 'Unauthorized', 'User session expired');
    }

    // Step 1: Upload via generic document service
    const uploadResult = await uploadDocument(file);
    if (!uploadResult || !uploadResult.documentId) {
      throw new Error("Failed to upload document to service");
    }

    // Step 2: Link via UlbImageMaster
    const masterEntity = await createUlbImageMaster(imageType, uploadResult.documentId);

    // Map result to match UlbImageMasterUploadResponseDto structure
    const responseDto: UlbImageMasterUploadResponseDto = {
      ulbImageMasterId: masterEntity.id ?? (masterEntity as UlbImageMasterDto & { ulbImageMasterId?: number }).ulbImageMasterId,
      documentGuid: uploadResult.documentGuid,
      documentId: uploadResult.documentId,
      documentBindingId: uploadResult.documentBindingId || null,
      imageType: masterEntity.imageType || imageType,
      fileName: uploadResult.fileName || file.name,
      fileSizeBytes: uploadResult.fileSizeBytes || file.size,
      storagePath: uploadResult.storagePath || "",
    };

    return { success: true, data: responseDto };
  } catch (error: unknown) {
    return handleActionError<UlbImageMasterUploadResponseDto>(error, 'messages.uploadFailed');
  }
}

/** Server Action to get all ULB images */
export async function getUlbImagesAction(
  pageNumber = 1,
  pageSize = 50
): Promise<ApiResponse<UlbImageMasterDto[]>> {
  try {
    const response = await getUlbImages(pageNumber, pageSize);
    return {
      success: true,
      data: response.items || [],
    };
  } catch (error: unknown) {
    return handleActionError<UlbImageMasterDto[]>(error, 'messages.fetchError');
  }
}

/** Server Action to delete a ULB image */
export async function deleteUlbImageAction(
  id: number
): Promise<ApiResponse<void>> {
  try {
    const userId = await resolveUserId();
    if (!userId) {
      throw new ApiError(401, 'Unauthorized', 'User session expired');
    }

    await deleteUlbImage(id);
    return { success: true };
  } catch (error: unknown) {
    return handleActionError<void>(error, 'messages.deleteFailed');
  }
}

/** Server Action to update ULB image type */
export async function updateUlbImageTypeAction(
  id: number,
  imageType: string,
  imageId: number
): Promise<ApiResponse<void>> {
  try {
    const userId = await resolveUserId();
    if (!userId) {
      throw new ApiError(401, 'Unauthorized', 'User session expired');
    }

    await updateUlbImageType(id, imageType, imageId);
    return { success: true };
  } catch (error: unknown) {
    return handleActionError<void>(error, 'messages.updateFailed');
  }
}

/** Server Action to replace an existing logo/gallery image */
export async function replaceUlbImageAction(
  id: number,
  formData: FormData
): Promise<ApiResponse<UlbImageMasterUploadResponseDto>> {
  try {
    const fileRaw = formData.get("File");
    const file = fileRaw instanceof File ? fileRaw : null;

    if (!file) {
      return { success: false, error: "No file provided" };
    }

    const userId = await resolveUserId();
    if (!userId) {
      throw new ApiError(401, 'Unauthorized', 'User session expired');
    }

    // Step 1: Upload the new file via generic document service
    const uploadResult = await uploadDocument(file);
    if (!uploadResult || !uploadResult.documentId) {
      throw new Error("Failed to upload document to service");
    }

    // Step 2: Extract ImageType directly from FormData with fallback
    const formImageType = formData.get("ImageType");
    const imageType = typeof formImageType === "string" && formImageType.trim() ? formImageType.trim() : "Gallery";

    // Step 3: Update the existing master record to point to the new imageId
    await updateUlbImageType(id, imageType, uploadResult.documentId);

    // Map result to match UlbImageMasterUploadResponseDto structure
    const responseDto: UlbImageMasterUploadResponseDto = {
      ulbImageMasterId: id,
      documentGuid: uploadResult.documentGuid,
      documentId: uploadResult.documentId,
      documentBindingId: uploadResult.documentBindingId || null,
      imageType: imageType,
      fileName: uploadResult.fileName || file.name,
      fileSizeBytes: uploadResult.fileSizeBytes || file.size,
      storagePath: uploadResult.storagePath || "",
    };

    return { success: true, data: responseDto };
  } catch (error: unknown) {
    return handleActionError<UlbImageMasterUploadResponseDto>(error, 'messages.replaceFailed');
  }
}

/** Server Action to get ULB Image view stream (as base64) */
export async function getUlbImageViewAction(
  documentGuid: string
): Promise<ApiResponse<{ base64: string; contentType: string }>> {
  try {
    const result = await getUlbImageView(documentGuid);
    return { success: true, data: result };
  } catch (error: unknown) {
    return handleActionError<{ base64: string; contentType: string }>(error, 'messages.fetchError');
  }
}


