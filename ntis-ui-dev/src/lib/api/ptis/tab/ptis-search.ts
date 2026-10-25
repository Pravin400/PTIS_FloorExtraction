import type {
  PropertySearchResult,
  PropertySuggestionResponse,
  PropertyListItem,
  PagedResult,
  Ward,
  PropwiseSuggestionItem,
  PropwiseSuggestionResponse,
} from '@/types/ptis.types';
import { fetchWithCertSupport, getErrorFormattedMessage, extractItems } from './base-api';

import { getPropertySocietyDetails } from '@/lib/api/property-society.service';

async function enrichSuggestionsWithSocietyDetails(
  items: PropwiseSuggestionItem[]
): Promise<PropwiseSuggestionItem[]> {
  return Promise.all(
    items.map(async (item) => {
      let societyDetailId = item.societyDetailId ?? null;
      let wingDetailId = item.wingDetailId ?? null;

      if ((!societyDetailId || societyDetailId <= 0) && item.propertyId > 0) {
        try {
          const socDetails = await getPropertySocietyDetails(item.propertyId);
          if (socDetails) {
            if (!societyDetailId && socDetails.societyDetailId && Number(socDetails.societyDetailId) > 0) {
              societyDetailId = Number(socDetails.societyDetailId);
            }
            if (!wingDetailId && socDetails.wingId && Number(socDetails.wingId) > 0) {
              wingDetailId = Number(socDetails.wingId);
            }
          }
        } catch {
          // non-blocking fallback
        }
      }

      return {
        ...item,
        societyDetailId,
        wingDetailId,
      };
    })
  );
}

export const ptisSearchService = {
  async searchProperties(filters: {
    wardNo?: string;
    wardId?: number;
    propertyNo?: string;
    upicId?: string;
    partitionNo?: string;
  }): Promise<{ success: boolean; data?: PropertySearchResult[]; error?: string }> {
    // Fail closed: an unscoped property search can match the wrong record
    // when property numbers repeat across wards.
    if (!filters.wardId && !filters.wardNo && !filters.upicId) {
      return {
        success: false,
        error: 'Ward information is required to search properties',
      };
    }

    const params = new URLSearchParams();

    // Prefer the numeric WardId; fall back to WardNo when wardId resolution failed.
    if (filters.wardId) {
      params.append('WardId', filters.wardId.toString());
    } else if (filters.wardNo) {
      params.append('WardNo', filters.wardNo);
    }

    // Canonicalize parameters to PascalCase as per backend standard
    if (filters.propertyNo) params.append('PropertyNo', filters.propertyNo);
    if (filters.partitionNo) params.append('PartitionNo', filters.partitionNo);
    if (filters.upicId) params.append('UpicId', filters.upicId);

    params.append('PageSize', '100');
    params.append('PageNumber', '1');

    const response = await fetchWithCertSupport<PagedResult<PropertySearchResult>>(
      `/Property?${params.toString()}`
    );

    if (!response.success || !response.data?.items) {
      return {
        success: false,
        error: getErrorFormattedMessage(response.error, 'No properties found matching criteria'),
      };
    }

    return { success: true, data: response.data.items };
  },

  async getPropertySuggestions(
    wardNo?: string,
    wardId?: number,
    searchText?: string,
    limit = 10
  ): Promise<{
    success: boolean;
    data?: PropertySuggestionResponse[];
    error?: string;
  }> {
    if (!wardNo && !wardId) return { success: false, error: 'Ward is required' };

    const params = new URLSearchParams();
    if (wardId) params.append('WardId', wardId.toString());
    if (searchText) {
      params.append('SearchText', searchText);
      params.append('PropertyNo', searchText);
    }
    params.append('PageSize', limit.toString());

    const response = await fetchWithCertSupport<PagedResult<PropertySearchResult>>(
      `/Property?${params.toString()}`
    );

    if (!response.success)
      return { success: false, error: getErrorFormattedMessage(response.error, 'No properties found') };

    const items = response.data?.items || [];
    return {
      success: true,
      data: items
        .map((item) => ({
          propertyNo: (item.propertyNo || item.propertyId || '').toString(),
          partitionNo: (item.partitionNo || null)?.toString() || null,
        }))
        .slice(0, limit),
    };
  },

  async getPropertySuggestionsByPropwise(
    wardId: number,
    propertyNo?: string,
    partitionNo?: string,
    maxResults = 100,
    enrichSociety = false
  ): Promise<{
    success: boolean;
    data?: PropwiseSuggestionItem[];
    error?: string;
  }> {
    const params = new URLSearchParams();
    params.append('WardId', wardId.toString());
    if (propertyNo) params.append('PropertyNo', propertyNo);
    if (partitionNo) params.append('PartitionNo', partitionNo);
    params.append('MaxResults', maxResults.toString());

    let response = await fetchWithCertSupport<PropwiseSuggestionResponse | PropwiseSuggestionItem[]>(
      `/Property/propwisesearch/suggestions?${params.toString()}`
    );

    if (!response.success || !response.data) {
      response = await fetchWithCertSupport<PropwiseSuggestionResponse | PropwiseSuggestionItem[]>(
        `/ApartmentQC/search/suggestions?${params.toString()}`
      );
    }

    if (!response.success) {
      return {
        success: false,
        error: getErrorFormattedMessage(response.error, 'No suggestions found'),
      };
    }

    const rawItems = extractItems<Record<string, unknown>>(response.data);

    const extractId = (val: unknown): number | null => {
      if (typeof val === 'number' && Number.isFinite(val) && val > 0) return val;
      if (typeof val === 'string' && val.trim() !== '') {
        const n = parseInt(val, 10);
        if (Number.isFinite(n) && n > 0) return n;
      }
      return null;
    };

    const mappedItems: PropwiseSuggestionItem[] = rawItems.map((obj) => {
      const propertyId = Number(obj.propertyId ?? obj.PropertyId ?? 0);
      const propNo = String(obj.propertyNo ?? obj.PropertyNo ?? '');
      const partNo = obj.partitionNo != null ? String(obj.partitionNo) : obj.PartitionNo != null ? String(obj.PartitionNo) : null;

      const societyDetailId =
        extractId(obj.societyDetailId) ??
        extractId(obj.SocietyDetailId) ??
        extractId(obj.societydetailid) ??
        extractId(obj.societyId) ??
        extractId(obj.SocietyId) ??
        extractId(obj.societyid) ??
        extractId(obj.societyMasterId) ??
        null;

      const wingDetailId =
        extractId(obj.wingDetailId) ??
        extractId(obj.WingDetailId) ??
        extractId(obj.wingdetailid) ??
        extractId(obj.wingId) ??
        extractId(obj.WingId) ??
        extractId(obj.wingid) ??
        null;

      return {
        propertyId,
        zoneId: obj.zoneId != null ? Number(obj.zoneId) : obj.ZoneId != null ? Number(obj.ZoneId) : undefined,
        zoneNo: obj.zoneNo != null ? String(obj.zoneNo) : obj.ZoneNo != null ? String(obj.ZoneNo) : undefined,
        wardId: obj.wardId != null ? Number(obj.wardId) : obj.WardId != null ? Number(obj.WardId) : wardId,
        wardNo: obj.wardNo != null ? String(obj.wardNo) : obj.WardNo != null ? String(obj.WardNo) : undefined,
        propertyNo: propNo,
        partitionNo: partNo,
        upicId: obj.upicId != null ? String(obj.upicId) : obj.UpicId != null ? String(obj.UpicId) : undefined,
        displayLabel: obj.displayLabel != null ? String(obj.displayLabel) : obj.DisplayLabel != null ? String(obj.DisplayLabel) : (obj.displayProperty != null ? String(obj.displayProperty) : `${propNo}${partNo ? `-${partNo}` : ''}`),
        category:
          obj.category != null ? Number(obj.category) :
          obj.Category != null ? Number(obj.Category) :
          obj.categoryId != null ? Number(obj.categoryId) :
          obj.CategoryId != null ? Number(obj.CategoryId) :
          undefined,
        categoryLabel:
          obj.categoryLabel != null ? String(obj.categoryLabel) :
          obj.CategoryLabel != null ? String(obj.CategoryLabel) :
          obj.categoryName != null ? String(obj.categoryName) :
          obj.CategoryName != null ? String(obj.CategoryName) :
          undefined,
        societyDetailId,
        societyName: obj.societyName != null ? String(obj.societyName) : obj.SocietyName != null ? String(obj.SocietyName) : null,
        wings: Array.isArray(obj.wings) ? (obj.wings as PropwiseSuggestionItem['wings']) : Array.isArray(obj.Wings) ? (obj.Wings as PropwiseSuggestionItem['wings']) : null,
        wingDetailId,
      };
    });

    const finalItems = enrichSociety
      ? await enrichSuggestionsWithSocietyDetails(mappedItems)
      : mappedItems;

    return {
      success: true,
      data: finalItems,
    };
  },

  async getPropertySuggestionsPage(
    wardId: number,
    propertyNo?: string,
    partitionNo?: string,
    pageNumber = 1,
    pageSize = 100,
    enrichSociety = false
  ): Promise<{
    success: boolean;
    data?: PagedResult<PropwiseSuggestionItem>;
    error?: string;
  }> {
    const params = new URLSearchParams({
      WardId: wardId.toString(),
      PageNumber: pageNumber.toString(),
      PageSize: pageSize.toString(),
    });
    if (propertyNo) params.append('PropertyNo', propertyNo);
    if (partitionNo) params.append('PartitionNo', partitionNo);

    const response = await fetchWithCertSupport<PagedResult<PropertySearchResult>>(
      `/Property?${params.toString()}`
    );

    if (!response.success || !response.data?.items) {
      return {
        success: false,
        error: getErrorFormattedMessage(response.error, 'No properties found'),
      };
    }

    const responsePageNumber = response.data.pageNumber || pageNumber;
    const responsePageSize = response.data.pageSize || pageSize;
    const totalCount = response.data.totalCount ?? response.data.items.length;
    const totalPages = response.data.totalPages
      ?? (responsePageSize > 0 ? Math.ceil(totalCount / responsePageSize) : 1);
    const hasNext = response.data.hasNext ?? responsePageNumber < totalPages;

    const extractId = (val: unknown): number | null => {
      if (typeof val === 'number' && Number.isFinite(val) && val > 0) return val;
      if (typeof val === 'string' && val.trim() !== '') {
        const n = parseInt(val, 10);
        if (Number.isFinite(n) && n > 0) return n;
      }
      return null;
    };

    const mappedItems: PropwiseSuggestionItem[] = response.data.items
      .map((item): PropwiseSuggestionItem => {
        const rawObj = item as unknown as Record<string, unknown>;
        const societyDetailId =
          extractId(item.societyDetailId) ??
          extractId(rawObj.SocietyDetailId) ??
          extractId(rawObj.societydetailid) ??
          extractId(rawObj.societyId) ??
          extractId(rawObj.SocietyId) ??
          null;

        const wingDetailId =
          extractId(rawObj.wingDetailId) ??
          extractId(rawObj.WingDetailId) ??
          extractId(rawObj.wingdetailid) ??
          extractId(rawObj.wingId) ??
          extractId(rawObj.WingId) ??
          null;

        return {
          propertyId: Number(item.propertyId ?? item.id ?? 0),
          propertyNo: String(item.propertyNo ?? ''),
          partitionNo: item.partitionNo != null ? String(item.partitionNo) : null,
          wardId: item.wardId != null ? Number(item.wardId) : wardId,
          wardNo: item.wardNo != null ? String(item.wardNo) : undefined,
          upicId: item.upicId != null ? String(item.upicId) : undefined,
          displayLabel: item.displayProperty != null
            ? String(item.displayProperty)
            : String(item.propertyNo ?? ''),
          category: item.categoryId ?? (rawObj.category as number | undefined),
          categoryLabel: item.categoryName ?? (rawObj.categoryLabel as string | undefined),
          societyDetailId,
          wingDetailId,
        };
      })
      .filter((item) => item.propertyId > 0 && item.propertyNo.trim() !== '');

    const items = enrichSociety
      ? await enrichSuggestionsWithSocietyDetails(mappedItems)
      : mappedItems;

    return {
      success: true,
      data: {
        items,
        totalCount,
        pageNumber: responsePageNumber,
        pageSize: responsePageSize,
        totalPages,
        hasPrevious: response.data.hasPrevious ?? responsePageNumber > 1,
        hasNext,
      },
    };
  },

  /**
   * Fetches the complete list of active wards.
   */
  async getWardList(): Promise<{
    success: boolean;
    data?: Array<{ wardId: number; wardNo: string; zoneId: number; description: string }>;
    error?: string;
  }> {
    const response =
      await fetchWithCertSupport<PagedResult<Record<string, unknown>>>('/Ward?PageSize=-1');

    const items = extractItems<Record<string, unknown>>(response.data);

    if (!response.success || items.length === 0) {
      return {
        success: false,
        error: getErrorFormattedMessage(response.error, 'Failed to fetch wards'),
      };
    }

    const data = items
      .filter((w) => w.isActive !== false)
      .map((w) => ({
        wardId: (w.wardId ?? w.wardID ?? w.id) as number,
        wardNo: (w.wardNo ?? w.wardno) as string,
        zoneId: w.zoneId as number,
        description: w.description as string,
      }));

    return {
      success: true,
      data,
    };
  },

  /**
   * Fetches all properties belonging to a specific ward.
   */
  async getPropertyListByWard(
    wardId: number,
    limit?: number
  ): Promise<{
    success: boolean;
    data?: PropertyListItem[];
    error?: string;
  }> {
    let allItems: Record<string, unknown>[] = [];
    const requestedPageSize = limit ? Math.min(limit, 1000) : 1000;

    const firstUrl = `/Property?WardId=${wardId}&PageSize=${requestedPageSize}&PageNumber=1`;
    const firstResponse = await fetchWithCertSupport<PagedResult<Record<string, unknown>>>(firstUrl);
    const firstItems = extractItems<Record<string, unknown>>(firstResponse.data);

    if (!firstResponse.success || firstItems.length === 0) {
      return {
        success: false,
        error: getErrorFormattedMessage(
          firstResponse.error,
          'Failed to fetch properties for the selected ward'
        ),
      };
    }

    allItems = firstItems;

    if (!limit || allItems.length < limit) {
      const totalCount = firstResponse.data?.totalCount ?? 0;
      const actualPageSize = firstResponse.data?.pageSize || firstItems.length;
      const effectivePageSize = actualPageSize > 0 ? actualPageSize : requestedPageSize;

      if (totalCount > allItems.length && effectivePageSize > 0) {
        const totalPages = Math.ceil(totalCount / effectivePageSize);
        const targetMaxPage = limit ? Math.min(totalPages, Math.ceil(limit / effectivePageSize)) : totalPages;

        const pagePromises = [];
        for (let p = 2; p <= targetMaxPage; p++) {
          const nextUrl = `/Property?WardId=${wardId}&PageSize=${effectivePageSize}&PageNumber=${p}`;
          pagePromises.push(fetchWithCertSupport<PagedResult<Record<string, unknown>>>(nextUrl));
        }

        const responses = await Promise.all(pagePromises);
        for (const res of responses) {
          if (res.success && res.data) {
            const nextItems = extractItems<Record<string, unknown>>(res.data);
            allItems = allItems.concat(nextItems);
            if (limit && allItems.length >= limit) break;
          }
        }
      } else if (firstResponse.data?.hasNext === true) {
        // Fallback serial pagination if totalCount is not reported by backend
        let pageNumber = 2;
        let hasNext = true;
        while (hasNext) {
          const nextUrl = `/Property?WardId=${wardId}&PageSize=${effectivePageSize}&PageNumber=${pageNumber}`;
          const nextRes = await fetchWithCertSupport<PagedResult<Record<string, unknown>>>(nextUrl);
          const nextItems = extractItems<Record<string, unknown>>(nextRes.data);
          if (!nextRes.success || nextItems.length === 0) break;
          allItems = allItems.concat(nextItems);
          if (limit && allItems.length >= limit) break;
          hasNext = nextRes.data?.hasNext === true;
          pageNumber++;
          if (pageNumber > 200) break;
        }
      }
    }

    const finalData = allItems
      .filter((p) => {
        const rawPropNo = p.propertyNo ?? p.PropertyNo;
        return (
          p.isActive !== false &&
          rawPropNo !== null &&
          rawPropNo !== undefined &&
          String(rawPropNo).trim() !== '' &&
          String(rawPropNo).toLowerCase() !== 'null' &&
          String(rawPropNo).toLowerCase() !== 'undefined'
        );
      })
      .map((p) => {
        const propId = Number(p.propertyId ?? p.PropertyId ?? p.id ?? p.Id ?? 0);
        const propNo = String(p.propertyNo ?? p.PropertyNo ?? '');
        const partNo = p.partitionNo != null ? String(p.partitionNo) : p.PartitionNo != null ? String(p.PartitionNo) : '';
        const upic = String(p.upicId ?? p.UpicId ?? '');
        const owner = String(p.ownerName ?? p.OwnerName ?? p.ownerNameEnglish ?? p.OwnerNameEnglish ?? '');
        const addr = String(p.address ?? p.Address ?? '');
        const display = String(p.displayProperty ?? p.DisplayProperty ?? (partNo ? `${propNo}-${partNo}` : propNo));
        const catId = p.categoryId != null ? Number(p.categoryId) : p.CategoryId != null ? Number(p.CategoryId) : undefined;
        const catLabel = (p.categoryName ?? p.CategoryName ?? p.category ?? p.Category) as string | undefined;
        const socId = (p.societyDetailId ?? p.SocietyDetailId) != null ? Number(p.societyDetailId ?? p.SocietyDetailId) : null;
        const wId = (p.wingDetailId ?? p.WingDetailId) != null ? Number(p.wingDetailId ?? p.WingDetailId) : null;

        return {
          propertyId: propId,
          propertyNo: propNo,
          partitionNo: partNo,
          upicId: upic,
          ownerName: owner,
          address: addr,
          displayProperty: display,
          category: catId,
          categoryLabel: catLabel,
          societyDetailId: socId,
          wingDetailId: wId,
        };
      });

    return {
      success: true,
      data: finalData,
    };
  },

  /**
   * Fetches ward suggestions based on search text.
   */
  async getWardSuggestions(
    searchText?: string,
    limit = 10
  ): Promise<{
    success: boolean;
    data?: Array<{ wardNo: string; wardId: string }>;
    error?: string;
  }> {
    const response = await fetchWithCertSupport<PagedResult<Ward>>('/Ward?PageSize=-1');

    if (!response.success || !response.data?.items) {
      return { success: false, error: getErrorFormattedMessage(response.error, 'Wards not found') };
    }

    let wards = response.data.items;
    if (searchText) {
      const lower = searchText.toLowerCase();
      wards = wards.filter(
        (w) =>
          (w.wardNo ?? '').toLowerCase().includes(lower) ||
          (w.description ?? '').toLowerCase().includes(lower)
      );
    }

    return {
      success: true,
      data: wards.slice(0, limit).map((w) => ({
        wardNo: (w.wardNo || '').toString(),
        wardId: (w.wardID || w.wardId || '').toString(),
      })),
    };
  },

  /**
   * Fetches a single ward by its number.
   */
  async getWardByNo(wardNo: string): Promise<{ success: boolean; data?: Ward; error?: string }> {
    const response = await fetchWithCertSupport<PagedResult<Ward>>(
      `/Ward?WardNo=${encodeURIComponent(wardNo)}`
    );
    if (response.success && response.data?.items?.length)
      return { success: true, data: response.data.items[0] };

    return { success: false, error: 'Ward not found' };
  },

  /**
   * Fetches partition suggestions for a specific property.
   */
  async getPartitionSuggestions(
    wardNo?: string,
    wardId?: number,
    propertyNo?: string,
    searchText?: string,
    limit = 10
  ): Promise<{
    success: boolean;
    data?: PropertySuggestionResponse[];
    error?: string;
  }> {
    if (!propertyNo || (!wardNo && !wardId))
      return { success: false, error: 'Ward and Property No are required' };

    const params = new URLSearchParams({
      PropertyNo: propertyNo,
      PageSize: limit.toString(),
    });
    if (wardId) params.append('WardId', wardId.toString());
    if (searchText) params.append('PartitionNo', searchText);

    const response = await fetchWithCertSupport<PagedResult<PropertySearchResult>>(
      `/Property?${params.toString()}`
    );

    if (!response.success || !response.data?.items)
      return { success: false, error: 'No partitions found' };

    return {
      success: true,
      data: response.data.items
        .filter((item) => item.propertyNo === propertyNo && item.partitionNo)
        .map((item) => ({
          propertyNo: (item.propertyNo as string).toString(),
          partitionNo: (item.partitionNo as string).toString(),
        }))
        .slice(0, limit),
    };
  },
};
