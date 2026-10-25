import 'server-only';

import { apiClient } from '@/services/api.service';
import { normalizeToItem, isConfigured, getItemLevel } from '@/lib/utils/ptis/social-details';
import type { DiscountData, PropertySocialDetailItem } from '@/types/ptis.types';
import { createLogger } from '@/lib/utils/server-logger';

const logger = createLogger('ApartmentDiscountSocialService');

export interface ApartmentSocialDiscountDetailsResult {
  success: boolean;
  discountData: DiscountData;
  socialData: DiscountData;
  levelCounts: {
    all: number;
    apartment: number;
    wing: number;
    unit: number;
  };
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
  levelCounts?: {
    all?: number;
    apartment?: number;
    wing?: number;
    unit?: number;
  };
}

/**
 * Dedicated API service to fetch Discount and Social Data for Apartment Societies
 * strictly using GET /api/PropertySocialDetails/society/{societyDetailId}/discount-and-social-grid.
 */
export async function getApartmentSocialAndDiscountDetailsService(
  societyDetailId: number,
  _propertyId?: number
): Promise<ApartmentSocialDiscountDetailsResult> {
  try {
    if (!societyDetailId || societyDetailId <= 0) {
      return {
        success: false,
        discountData: { items: [] },
        socialData: { items: [] },
        levelCounts: { all: 0, apartment: 0, wing: 0, unit: 0 },
        error: 'Invalid society detail ID',
      };
    }

    // Call strictly the dedicated society discount and social grid endpoint
    const response = await apiClient.get<{
      success: boolean;
      message?: string;
      items?: BackendGridResponse;
    }>(`/PropertySocialDetails/society/${encodeURIComponent(societyDetailId)}/discount-and-social-grid`);

    if (response.success && response.data?.items) {
      const grid = response.data.items;

      const mapBackendItem = (raw: Record<string, unknown>): PropertySocialDetailItem => {
        const itemPropId = raw.propertyId != null ? Number(raw.propertyId) : 0;
        const itemWingId = raw.wingDetailId != null ? Number(raw.wingDetailId) : null;

        const item = normalizeToItem(raw as unknown as Parameters<typeof normalizeToItem>[0], undefined, {
          societyDetailId,
          resolvedPropertyId: itemPropId,
          wingDetailId: itemWingId,
        });

        const rawLevel = String(raw.level || item.level || '').trim().toLowerCase();
        const level: PropertySocialDetailItem['level'] =
          rawLevel === 'unit' ? 'Unit' : rawLevel === 'wing' ? 'Wing' : 'Apartment';

        const wingName = (raw.wingName as string) || item.wingName;
        const partitionNo = (raw.partitionNo as string) || item.partitionNo;
        const unitNo = (raw.partitionNo as string) || (raw.unitNo as string) || item.unitNo;
        const displayLabel =
          (raw.displayLevelLabel as string) ||
          (raw.applicableToLabel as string) ||
          item.applicableToLabel;

        return {
          ...item,
          id: Number(raw.propertySocialDetailId || raw.id || item.id || 0),
          propertyId: itemPropId,
          wingDetailId: itemWingId,
          societyDetailId: raw.societyDetailId != null ? Number(raw.societyDetailId) : societyDetailId,
          level,
          entityType: (raw.entityType as string) || item.entityType,
          wingName,
          partitionNo,
          unitNo,
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

      const discountItems = (grid.discountData?.appliedAttributes || [])
        .map(mapBackendItem)
        .filter(isItemActiveAndConfigured);

      const socialItems = (grid.socialData?.appliedAttributes || [])
        .map(mapBackendItem)
        .filter(isItemActiveAndConfigured);

      const levelCounts = {
        all: discountItems.length + socialItems.length,
        apartment: 0,
        wing: 0,
        unit: 0,
      };

      [...discountItems, ...socialItems].forEach((it) => {
        const l = getItemLevel(it);
        if (l === 'Apartment') levelCounts.apartment++;
        else if (l === 'Wing') levelCounts.wing++;
        else if (l === 'Unit') levelCounts.unit++;
      });

      if (grid.levelCounts) {
        if (levelCounts.apartment === 0 && grid.levelCounts.apartment) {
          levelCounts.apartment = grid.levelCounts.apartment;
        }
        if (levelCounts.wing === 0 && grid.levelCounts.wing) {
          levelCounts.wing = grid.levelCounts.wing;
        }
        if (levelCounts.unit === 0 && grid.levelCounts.unit) {
          levelCounts.unit = grid.levelCounts.unit;
        }
        levelCounts.all = levelCounts.apartment + levelCounts.wing + levelCounts.unit;
      }

      return {
        success: true,
        discountData: { items: discountItems },
        socialData: { items: socialItems },
        levelCounts,
      };
    }

    const errorMsg = response.message || response.error || 'Failed to fetch apartment discount & social grid';
    logger.error('Failed to get apartment discount & social details from dedicated endpoint', {
      societyDetailId,
      error: errorMsg,
    });

    return {
      success: false,
      discountData: { items: [] },
      socialData: { items: [] },
      levelCounts: { all: 0, apartment: 0, wing: 0, unit: 0 },
      error: errorMsg,
    };
  } catch (error) {
    logger.error('Failed to get apartment discount & social details', {
      societyDetailId,
      error: error as Error,
    });
    return {
      success: false,
      discountData: { items: [] },
      socialData: { items: [] },
      levelCounts: { all: 0, apartment: 0, wing: 0, unit: 0 },
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get apartment discount & social details',
    };
  }
}
