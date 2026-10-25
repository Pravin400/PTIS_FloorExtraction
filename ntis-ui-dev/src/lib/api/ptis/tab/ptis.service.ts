import type { PropertyBasicDetailsApiResponse, PropertyDetailsData } from '@/types/ptis.types';
import { fetchWithCertSupport, getErrorFormattedMessage, extractData } from './base-api';
import { normalizePartition } from '@/lib/utils/format';
import { ptisMapper } from './ptis.mapper';
import { ptisSearchService } from './ptis-search';
import { ptisDetailsService } from './ptis-details';

export const ptisService = {
  ...ptisSearchService,
  ...ptisDetailsService,

  async getPropertyBasicDetails(propertyId: number | string): Promise<{
    success: boolean;
    data?: PropertyBasicDetailsApiResponse;
    error?: string;
  }> {
    try {
      const response = await fetchWithCertSupport<unknown>(`/Property/${propertyId}/basic-details`);
      if (!response.success) {
        return {
          success: false,
          error: getErrorFormattedMessage(
            response.error,
            'Failed to fetch basic details for the property'
          ),
        };
      }

      const actualData = extractData<PropertyBasicDetailsApiResponse>(response.data);
      if (!actualData)
        return { success: false, error: 'No data returned from API for property basic details' };

      return { success: true, data: actualData };
    } catch (error: unknown) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unexpected error fetching property details',
      };
    }
  },

  async fetchPropertyDetailsOnly(
    wardNo: string,
    propertyNo: string,
    partitionNo: string,
    wardId?: number,
    propertyId?: number
  ): Promise<{
    success: boolean;
    data?: { propertyId: number; details: PropertyDetailsData; wardId: number; wardNo: string };
    error?: string;
  }> {
    try {
      let finalPropertyId = propertyId;

      // 1. Resolve PropertyId if not provided by searching for the property/partition match
      if (!finalPropertyId) {
        const searchRes = await ptisSearchService.searchProperties({
          wardNo,
          wardId,
          propertyNo,
          partitionNo,
        });

        if (searchRes.success && searchRes.data && searchRes.data.length > 0) {
          const match = searchRes.data.find(
            (p) =>
              p.propertyNo === propertyNo &&
              normalizePartition(p.partitionNo) === normalizePartition(partitionNo)
          );
          if (match) finalPropertyId = Number(match.propertyId);
        }
      }

      if (!finalPropertyId) return { success: false, error: 'Property not found' };

      // 2. Fetch Basic Details and Map to the Domain Model (PropertyDetailsData)
      const basicRes = await this.getPropertyBasicDetails(finalPropertyId);
      if (basicRes.success && basicRes.data) {
        return {
          success: true,
          data: {
            propertyId: finalPropertyId,
            details: ptisMapper.mapBasicDetails(basicRes.data),
            wardId: basicRes.data.wardId,
            wardNo: basicRes.data.wardNo,
          },
        };
      }

      return { success: false, error: basicRes.error || 'Failed to resolve property details' };
    } catch (error: unknown) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unexpected error during property resolution',
      };
    }
  },
};
