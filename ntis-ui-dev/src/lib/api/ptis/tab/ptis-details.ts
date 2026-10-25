import type {
  KYCDetailsData,
  SocietyDetailsData,
  OldDetailsData,
  OldFloorDetailsData,
  OldTaxesData,
  KycDetailsApiResponse,
  SocietyDetailsApiResponse,
  OldDetailsApiResponse,
  OldFloorDetailApiResponse,
  OldTaxesApiResponse,
  DiscountData,
  BuildingPermissionData,
  TabHeaderInfoData,
  MappedPropertyItem,
} from '@/types/ptis.types';
import { fetchWithCertSupport, getErrorFormattedMessage, extractData } from './base-api';
import { ptisMapper } from './ptis.mapper';

export const ptisDetailsService = {
  async getKycDetails(propertyId: string | number): Promise<{
    success: boolean;
    data?: KYCDetailsData;
    error?: string;
  }> {
    try {
      const response = await fetchWithCertSupport<unknown>(`/Property/${propertyId}/kyc-details`);

      if (!response.success) {
        return {
          success: false,
          error: getErrorFormattedMessage(response.error, 'Failed to fetch KYC details'),
        };
      }

      const rawData = extractData<KycDetailsApiResponse>(response.data);
      if (!rawData) return { success: false, error: 'Empty KYC data returned' };

      return { success: true, data: ptisMapper.mapKycDetails(rawData) };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch KYC details',
      };
    }
  },

  async getSocietyDetails(propertyId: string | number): Promise<{
    success: boolean;
    data?: SocietyDetailsData;
    error?: string;
  }> {
    try {
      const response = await fetchWithCertSupport<unknown>(
        `/Property/${propertyId}/society-details`
      );

      if (!response.success) {
        return {
          success: false,
          error: getErrorFormattedMessage(response.error, 'Society details not found'),
        };
      }

      const rawData = extractData<SocietyDetailsApiResponse>(response.data);
      if (!rawData) return { success: false, error: 'Society details not found' };

      return { success: true, data: ptisMapper.mapSocietyDetails(rawData) };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch society details',
      };
    }
  },

  async getOldDetails(propertyId: string | number): Promise<{
    success: boolean;
    data?: OldDetailsData;
    error?: string;
  }> {
    try {
      const response = await fetchWithCertSupport<OldDetailsApiResponse>(
        `/Property/${propertyId}/old-details`
      );

      if (!response.success) {
        return {
          success: false,
          error: getErrorFormattedMessage(response.error, 'Old details not found'),
        };
      }

      const rawData = extractData<OldDetailsApiResponse>(response.data);
      if (!rawData) return { success: false, error: 'Old details not found' };
      return { success: true, data: ptisMapper.mapOldDetails(rawData) };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch old details',
      };
    }
  },

  async getOldFloorDetails(propertyId: string | number): Promise<{
    success: boolean;
    data?: OldFloorDetailsData[];
    error?: string;
  }> {
    try {
      const response = await fetchWithCertSupport<unknown>(
        `/Property/${propertyId}/floor-details-old`
      );

      if (!response.success) {
        return {
          success: false,
          error: getErrorFormattedMessage(response.error, 'Old floor details not found'),
        };
      }

      const rawItems = extractData<{ floorDetails: OldFloorDetailApiResponse[] }>(response.data);
      const floorDetailsRaw = rawItems?.floorDetails;

      if (!Array.isArray(floorDetailsRaw)) return { success: true, data: [] };
      return {
        success: true,
        data: ptisMapper.mapOldFloorDetails(floorDetailsRaw as OldFloorDetailApiResponse[]),
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch old floor details',
      };
    }
  },

  async getOldTaxesDetails(propertyId: string | number): Promise<{
    success: boolean;
    data?: OldTaxesData;
    error?: string;
  }> {
    try {
      const response = await fetchWithCertSupport<OldTaxesApiResponse>(
        `/Property/${propertyId}/old-taxes-details`
      );

      if (!response.success) {
        return {
          success: false,
          error: getErrorFormattedMessage(response.error, 'Old tax details not found'),
        };
      }

      const rawData = extractData<OldTaxesApiResponse>(response.data);
      return rawData
        ? { success: true, data: rawData }
        : { success: false, error: 'Old tax details not found' };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch old tax details',
      };
    }
  },

  async getDiscountDetails(propertyId: string | number): Promise<{
    success: boolean;
    data?: DiscountData;
    error?: string;
  }> {
    try {
      const response = await fetchWithCertSupport<unknown>(
        `/Property/${propertyId}/discount-details`
      );

      if (!response.success) {
        return {
          success: false,
          error: getErrorFormattedMessage(response.error, 'Discount details not found'),
        };
      }

      const rawData = response.data;
      if (!rawData) return { success: false, error: 'Discount details not found' };

      return { success: true, data: ptisMapper.mapDiscountDetails(rawData) };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch discount details',
      };
    }
  },

  async getSocialDetails(propertyId: string | number): Promise<{
    success: boolean;
    data?: DiscountData;
    error?: string;
  }> {
    try {
      const response = await fetchWithCertSupport<unknown>(
        `/PropertySocialDetails/property/${propertyId}/social-info`
      );

      if (!response.success) {
        return {
          success: false,
          error: getErrorFormattedMessage(response.error, 'Social details not found'),
        };
      }

      const rawData = response.data;
      if (!rawData) return { success: false, error: 'Social details not found' };

      return { success: true, data: ptisMapper.mapSocialDetails(rawData) };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch social details',
      };
    }
  },

  async getBuildingPermissionDetails(propertyId: string | number): Promise<{
    success: boolean;
    data?: BuildingPermissionData;
    error?: string;
  }> {
    try {
      const [propertyCertsRes, floorCertsRes] = await Promise.all([
        fetchWithCertSupport<unknown>(`/property-certificates/types-with-status/${propertyId}`).catch(() => null),
        fetchWithCertSupport<unknown>(`/property-certificates/floor-certificates?propertyId=${propertyId}`).catch(() => null)
      ]);

      const rawPropData = propertyCertsRes && 'success' in propertyCertsRes && propertyCertsRes.success ? propertyCertsRes.data : null;
      const rawFloorData = floorCertsRes && 'success' in floorCertsRes && floorCertsRes.success ? floorCertsRes.data : null;

      // Unwrap API wrapper if present (favoring 'items' or 'data')
      const propertyData = extractData(rawPropData) ?? rawPropData;
      const floorData = extractData(rawFloorData) ?? rawFloorData;

      // Extract floor IDs from floorData
      const floorIds: number[] = [];
      const floorMap = new Map<number, string>();
      const safeFloorObj = (floorData && typeof floorData === 'object') ? (floorData as Record<string, unknown>) : null;
      if (safeFloorObj) {
        const sel = (safeFloorObj.selectedFloor ?? safeFloorObj.SelectedFloor) as Record<string, unknown> | null;
        const selPropDetailsId = sel?.propertyDetailsId ?? sel?.PropertyDetailsId;
        if (selPropDetailsId != null) {
          const fId = Number(selPropDetailsId);
          floorIds.push(fId);
          const selFloorDesc = sel?.floorDescription ?? sel?.FloorDescription;
          if (selFloorDesc) floorMap.set(fId, String(selFloorDesc));
        }

        const oth = Array.isArray(safeFloorObj.otherFloors ?? safeFloorObj.OtherFloors)
          ? (safeFloorObj.otherFloors ?? safeFloorObj.OtherFloors) as unknown[]
          : [];
        for (const f of oth) {
          const fObj = f as Record<string, unknown>;
          const fPropDetailsId = fObj?.propertyDetailsId ?? fObj?.PropertyDetailsId;
          if (fPropDetailsId != null) {
            const fId = Number(fPropDetailsId);
            if (!floorIds.includes(fId)) floorIds.push(fId);
            const fDesc = fObj?.floorDescription ?? fObj?.FloorDescription;
            if (fDesc) floorMap.set(fId, String(fDesc));
          }
        }
      }

      // Fallback: If floorIds is empty, attempt to resolve floors from /Floor/owner/${propertyId}
      if (floorIds.length === 0) {
        try {
          const ownerFloorsRes = await fetchWithCertSupport<unknown>(`/Floor/owner/${propertyId}`).catch(() => null);
          const rawOwnerFloors = ownerFloorsRes && 'success' in ownerFloorsRes && ownerFloorsRes.success ? ownerFloorsRes.data : null;
          const ownerFloorsData = extractData(rawOwnerFloors) ?? rawOwnerFloors;
          if (Array.isArray(ownerFloorsData)) {
            for (const f of ownerFloorsData) {
              const fObj = f as Record<string, unknown>;
              const fId = Number(fObj?.id ?? fObj?.Id ?? fObj?.propertyDetailsId ?? fObj?.PropertyDetailsId);
              if (fId && !floorIds.includes(fId)) {
                floorIds.push(fId);
                const desc = String(fObj?.floorDescription ?? fObj?.FloorDescription ?? fObj?.floor ?? fObj?.Floor ?? '');
                if (desc) floorMap.set(fId, desc);
              }
            }
          }
        } catch {
          // ignore fallback error
        }
      }

      // Concurrently fetch types-with-status for each floor to obtain full document GUIDs
      const floorTypeResponses = floorIds.length > 0
        ? await Promise.all(
            floorIds.map((fId) =>
              fetchWithCertSupport<unknown>(`/property-certificates/types-with-status/${propertyId}?propertyDetailsId=${fId}`).catch(() => null)
            )
          )
        : [];

      const floorCertificatesWithStatus = floorTypeResponses
        .map((res, index) => {
          const fId = floorIds[index];
          const raw = res && 'success' in res && res.success ? res.data : null;
          const extracted = extractData(raw) ?? raw;
          return {
            propertyDetailsId: fId,
            floorDescription: floorMap.get(fId) || null,
            certificates: Array.isArray(extracted) ? extracted : [],
          };
        })
        .filter((item) => item.certificates.length > 0);

      if (!propertyData && !floorData) {
        return {
          success: true,
          data: { items: [] },
        };
      }

      return {
        success: true,
        data: ptisMapper.mapBuildingPermissionDetails({
          propertyCertificates: propertyData,
          floorCertificates: floorData,
          floorCertificatesWithStatus,
        }),
      };
    } catch (error: unknown) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch building permission details',
      };
    }
  },

  async getTabHeaderInfo(propertyId: string | number): Promise<{
    success: boolean;
    data?: TabHeaderInfoData;
    error?: string;
  }> {
    try {
      const response = await fetchWithCertSupport<unknown>(
        `/Property/${propertyId}/tab-header-info`
      );

      if (!response.success) {
        return {
          success: false,
          error: getErrorFormattedMessage(response.error, 'Tab header info not found'),
        };
      }

      const rawData = extractData<TabHeaderInfoData>(response.data);
      if (!rawData) return { success: false, error: 'Tab header info not found' };

      return { success: true, data: rawData };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch tab header info',
      };
    }
  },

  async getMappedProperties(propertyId: string | number): Promise<{
    success: boolean;
    data?: MappedPropertyItem[];
    error?: string;
  }> {
    try {
      const response = await fetchWithCertSupport<unknown>(
        `/PropertyMapMaster/mapped-properties?PropertyId=${propertyId}&PageSize=-1`
      );

      if (!response.success) {
        return {
          success: false,
          error: getErrorFormattedMessage(response.error, 'Mapped properties not found'),
        };
      }

      const rawData = extractData<MappedPropertyItem[]>(response.data);
      if (!rawData || !Array.isArray(rawData)) {
        return { success: true, data: [] };
      }

      return { success: true, data: rawData };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch mapped properties',
      };
    }
  },
};
