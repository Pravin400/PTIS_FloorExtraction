import 'server-only';

import { apiClient } from '@/services/api.service';
import { normalizeToItem, isConfigured } from '@/lib/utils/ptis/social-details';
import type { DiscountData, PropertySocialDetailItem } from '@/types/ptis.types';
import { createLogger } from '@/lib/utils/server-logger';

const logger = createLogger('IndividualDiscountSocialService');

export interface IndividualSocialDiscountDetailsResult {
  success: boolean;
  discountData: DiscountData;
  socialData: DiscountData;
  error?: string;
}

interface BackendGridResponse {
  discountData?: {
    appliedAttributes?: Array<Record<string, unknown>>;
    nonAppliedAttributes?: Array<Record<string, unknown>>;
  };
  socialData?: {
    appliedAttributes?: Array<Record<string, unknown>>;
    nonAppliedAttributes?: Array<Record<string, unknown>>;
  };
}

/**
 * Dedicated API service to fetch Discount & Social Data specifically
 * for an Individual Property using strictly:
 * GET /api/PropertySocialDetails/property/{propertyId}/discount-and-social-grid
 *
 * If the property is identified by the backend as an Apartment/Society main property,
 * gracefully routes to the dedicated apartment society grid endpoint:
 * GET /api/PropertySocialDetails/society/{societyDetailId}/discount-and-social-grid
 */
export async function getIndividualSocialAndDiscountDetailsService(
  propertyId: number,
  societyDetailId?: number | null,
  wingDetailId?: number | null
): Promise<IndividualSocialDiscountDetailsResult> {
  try {
    if (!propertyId || propertyId <= 0) {
      return {
        success: false,
        discountData: { items: [] },
        socialData: { items: [] },
        error: 'Invalid property ID',
      };
    }

    const mapItem = (raw: Record<string, unknown>): PropertySocialDetailItem => {
      const itemPropId = raw.propertyId != null ? Number(raw.propertyId) : propertyId;
      const itemWingId =
        raw.wingDetailId != null ? Number(raw.wingDetailId) : (wingDetailId ? Number(wingDetailId) : null);

      const item = normalizeToItem(raw as unknown as Parameters<typeof normalizeToItem>[0], undefined, {
        resolvedPropertyId: itemPropId,
        wingDetailId: itemWingId,
        societyDetailId: societyDetailId ? Number(societyDetailId) : undefined,
      });

      const rawLevel = String(raw.level || item.level || '').trim().toLowerCase();
      const level: PropertySocialDetailItem['level'] =
        rawLevel === 'unit' ? 'Unit' : rawLevel === 'wing' ? 'Wing' : 'Apartment';

      const displayLabel =
        (raw.displayLevelLabel as string) ||
        (raw.applicableToLabel as string) ||
        item.applicableToLabel;

      return {
        ...item,
        id: Number(raw.propertySocialDetailId || raw.id || item.id || 0),
        propertyId: itemPropId,
        wingDetailId: itemWingId,
        societyDetailId: raw.societyDetailId != null ? Number(raw.societyDetailId) : (societyDetailId ? Number(societyDetailId) : item.societyDetailId),
        level,
        entityType: (raw.entityType as string) || item.entityType,
        wingName: (raw.wingName as string) || item.wingName,
        partitionNo: (raw.partitionNo as string) || item.partitionNo,
        unitNo: (raw.partitionNo as string) || (raw.unitNo as string) || item.unitNo,
        applicableToLabel: displayLabel,
        documentBindingId:
          raw.documentBindingId != null ? Number(raw.documentBindingId) : item.documentBindingId,
        documentGuid: (raw.documentGuid as string) || item.documentGuid,
        isDiscountApplicable:
          typeof raw.isDiscountApplicable === 'boolean'
            ? raw.isDiscountApplicable
            : item.isDiscountApplicable,
      };
    };

    const isItemActiveAndConfigured = (it: PropertySocialDetailItem) =>
      it.isActive !== false && (isConfigured(it) || (typeof it.id === 'number' && it.id > 0));

    const response = await apiClient.get<{
      success: boolean;
      message?: string;
      items?: BackendGridResponse;
    }>(`/PropertySocialDetails/property/${encodeURIComponent(propertyId)}/discount-and-social-grid`);

    if (response.success && response.data?.items) {
      const grid = response.data.items;
      const discountItems = (grid.discountData?.appliedAttributes || [])
        .map(mapItem)
        .filter(isItemActiveAndConfigured);

      const socialItems = (grid.socialData?.appliedAttributes || [])
        .map(mapItem)
        .filter(isItemActiveAndConfigured);

      return {
        success: true,
        discountData: { items: discountItems },
        socialData: { items: socialItems },
      };
    }

    const errorMsg =
      response.message || response.error || 'Failed to fetch individual discount and social grid data';

    // If backend indicates this property is an Apartment/Society main property, route to society grid endpoint
    const isApartmentSocietyProp =
      errorMsg.includes('Apartment/Society') ||
      errorMsg.includes('main property') ||
      Boolean(societyDetailId && Number(societyDetailId) > 0);

    if (isApartmentSocietyProp) {
      let targetSocId = societyDetailId && Number(societyDetailId) > 0 ? Number(societyDetailId) : null;
      if (!targetSocId) {
        try {
          const socRes = await apiClient.get<{
            success: boolean;
            items?: { societyDetailId?: number; id?: number };
          }>(`/Property/${encodeURIComponent(propertyId)}/society-details`);
          if (socRes.success && socRes.data?.items) {
            targetSocId = Number(socRes.data.items.societyDetailId || socRes.data.items.id || 0) || null;
          }
        } catch { /* ignore */ }
      }

      if (targetSocId && targetSocId > 0) {
        const socResponse = await apiClient.get<{
          success: boolean;
          message?: string;
          items?: BackendGridResponse;
        }>(`/PropertySocialDetails/society/${encodeURIComponent(targetSocId)}/discount-and-social-grid?propertyId=${encodeURIComponent(propertyId)}`);

        if (socResponse.success && socResponse.data?.items) {
          const grid = socResponse.data.items;
          const discountItems = (grid.discountData?.appliedAttributes || []).map(mapItem).filter(isItemActiveAndConfigured);
          const socialItems = (grid.socialData?.appliedAttributes || []).map(mapItem).filter(isItemActiveAndConfigured);
          return {
            success: true,
            discountData: { items: discountItems },
            socialData: { items: socialItems },
          };
        }
      }

      return {
        success: true,
        discountData: { items: [] },
        socialData: { items: [] },
      };
    }

    logger.error('Failed to get individual discount & social details from dedicated endpoint', {
      propertyId,
      error: errorMsg,
    });

    return {
      success: false,
      discountData: { items: [] },
      socialData: { items: [] },
      error: errorMsg,
    };
  } catch (error) {
    logger.error('Failed to get individual discount & social details', {
      propertyId,
      societyDetailId,
      wingDetailId,
      error: error as Error,
    });
    return {
      success: false,
      discountData: { items: [] },
      socialData: { items: [] },
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get individual discount & social details',
    };
  }
}
