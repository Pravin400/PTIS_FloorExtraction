'use server';

import { revalidatePath } from 'next/cache';
import { locales } from '@/i18n/config';
import { logger } from '@/lib/utils/logger';
import {
  createSocialAttribute,
  deleteSocialAttribute,
  getSocialAttributesPaged,
  getSocialAttributeById,
  updateSocialAttribute,
  getSocialAttributes,
} from '@/lib/api/social-attribute-master/social-attribute-crud.service';
import { ApiError } from '@/lib/utils/api';
import { SocialAttribute, SocialAttributeFormModel } from '@/types/social-attribute.types';
import { PagedResponse } from '@/types/common.types';
import { cookies } from 'next/headers';
import { getUserIdFromCookies } from '@/lib/utils/cookie';

export async function fetchSocialAttributesPagedAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PagedResponse<SocialAttribute>> {
  try {
    const MAX_PAGE_SIZE = 500;
    const MAX_PAGE_NUMBER = 10000;
    if (
      !Number.isFinite(pageNumber) ||
      !Number.isFinite(pageSize) ||
      pageNumber <= 0 ||
      (pageSize <= 0 && pageSize !== -1) ||
      (pageSize > MAX_PAGE_SIZE && pageSize !== -1) ||
      pageNumber > MAX_PAGE_NUMBER
    ) {
      throw new ApiError(400, 'Invalid pagination parameters', 'Validation failed');
    }

    const allowedSortColumns = [
      'socialAttributeCode',
      'socialAttributeName',
      'dataType',
      'displayOrder',
    ];
    const validSortBy = sortBy && allowedSortColumns.includes(sortBy) ? sortBy : undefined;
    const validSortOrder =
      sortOrder && ['asc', 'desc'].includes(sortOrder.toLowerCase())
        ? sortOrder.toLowerCase()
        : undefined;

    return await getSocialAttributesPaged(
      pageNumber,
      pageSize,
      searchTerm,
      validSortBy,
      validSortOrder
    );
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      logger.error(
        `[fetchSocialAttributesPagedAction] API Error ${error.statusCode}: ${error.responseText}`,
        { error: error as Error }
      );
    } else if (error instanceof Error) {
      logger.error(`[fetchSocialAttributesPagedAction] Error: ${error.message}`, { error });
    }
    throw error;
  }
}

export async function createSocialAttributeAction(
  data: SocialAttributeFormModel
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId || userId <= 0) {
      throw new ApiError(401, 'Unauthorized access', 'Unauthorized');
    }
    data.createdBy = userId;
    await createSocialAttribute(data);
    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/social-attribute-master`, 'page');
    }
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return {
        success: false,
        message: error.responseText,
        statusCode: error.statusCode,
      };
    }
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'Failed to create social attribute' };
  }
}

export async function updateSocialAttributeAction(
  data: SocialAttributeFormModel
): Promise<{ success: boolean; message?: string; statusCode?: number }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId || userId <= 0) {
      throw new ApiError(401, 'Unauthorized access', 'Unauthorized');
    }
    data.updatedBy = userId;
    await updateSocialAttribute(data);
    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/social-attribute-master`, 'page');
    }
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return {
        success: false,
        message: error.responseText,
        statusCode: error.statusCode,
      };
    }
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'Failed to update social attribute' };
  }
}

export async function deleteSocialAttributeAction(
  formData: FormData
): Promise<{ success: boolean; message?: string; statusCode?: number; messageKey?: string }> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    if (!userId || userId <= 0) {
      throw new ApiError(401, 'Unauthorized access', 'Unauthorized');
    }

    const rawId = formData.get('id');
    const id = typeof rawId === 'string' ? parseInt(rawId, 10) : 0;

    if (!id || id <= 0) {
      return {
        success: false,
        message: 'Valid Social Attribute ID is required',
        statusCode: 400,
      };
    }

    // Check if parent attribute has any child attributes
    const allAttributes = await getSocialAttributes();
    const hasChildren = allAttributes.some((attr) => attr.parentAttributeId === id);
    if (hasChildren) {
      return {
        success: false,
        statusCode: 409,
        messageKey: 'hasChildren',
        message:
          'Cannot delete parent attribute because it has child attributes. Please delete the child attributes first.',
      };
    }

    await deleteSocialAttribute(id);
    for (const locale of locales) {
      revalidatePath(`/${locale}/property-tax/social-attribute-master`, 'page');
    }
    return {
      success: true,
      message: 'Social attribute deleted successfully',
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        success: false,
        message: error.responseText,
        statusCode: error.statusCode,
      };
    }
    return {
      success: false,
      message: 'Failed to delete social attribute',
    };
  }
}

export async function getSocialAttributeByIdAction(id: number): Promise<SocialAttribute> {
  try {
    if (!id || id <= 0) {
      throw new ApiError(400, 'Valid Social Attribute ID is required', 'Validation failed');
    }
    const result = await getSocialAttributeById(id);
    if (!result) {
      throw new ApiError(404, 'Social Attribute not found', 'Not Found');
    }
    return result;
  } catch (error) {
    if (error instanceof ApiError) {
      logger.error(
        `[getSocialAttributeByIdAction] API Error ${error.statusCode}: ${error.responseText}`,
        { error: error as Error }
      );
    }
    throw error;
  }
}

export async function fetchAllActiveSocialAttributesAction(): Promise<SocialAttribute[]> {
  try {
    const list = await getSocialAttributes();
    return list.filter((item) => item.isActive);
  } catch (error) {
    logger.error('[fetchAllActiveSocialAttributesAction] Error fetching active social attributes', {
      error: error as Error,
    });
    return [];
  }
}

export async function fetchAllSocialAttributesAction(): Promise<SocialAttribute[]> {
  try {
    return await getSocialAttributes();
  } catch (error) {
    logger.error('[fetchAllSocialAttributesAction] Error fetching all social attributes', {
      error: error as Error,
    });
    return [];
  }
}
