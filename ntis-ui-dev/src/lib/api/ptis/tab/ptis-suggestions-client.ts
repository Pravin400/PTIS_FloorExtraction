import type { PropertyListItem } from '@/types/ptis.types';

interface SuggestionPayloadItem {
  propertyId: number;
  propertyNo: string;
  partitionNo?: string;
  displayLabel?: string;
  category?: number;
  categoryLabel?: string;
  societyDetailId?: number | null;
  societyName?: string | null;
  wings?: { societyDetailId?: number; wingDetailId: number; wingName: string }[] | null;
  wingDetailId?: number | null;
}

export interface PropertySuggestionPagination {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasMore: boolean;
}

interface PropertySuggestionParams {
  wardId: number;
  propertyNo?: string;
  partitionNo?: string;
  pageNumber?: number;
  pageSize?: number;
}

interface PropertySuggestionResult {
  success: boolean;
  data?: PropertyListItem[];
  pagination?: PropertySuggestionPagination;
  error?: string;
}

async function fetchSuggestions(
  params: PropertySuggestionParams
): Promise<PropertySuggestionResult> {
  const searchParams = new URLSearchParams();
  searchParams.append('wardId', params.wardId.toString());
  if (params.propertyNo) searchParams.append('propertyNo', params.propertyNo);
  if (params.partitionNo) searchParams.append('partitionNo', params.partitionNo);
  if (params.pageNumber != null) searchParams.append('pageNumber', String(params.pageNumber));
  if (params.pageSize != null) searchParams.append('pageSize', String(params.pageSize));

  try {
    const res = await fetch(`/api/ptis/suggestions?${searchParams.toString()}`, {
      cache: 'no-store',
    });
    const result = await res.json();
    if (result.success && result.data) {
      const suggestions: PropertyListItem[] = result.data.map((item: SuggestionPayloadItem) => ({
        propertyId: item.propertyId,
        propertyNo: item.propertyNo,
        partitionNo: item.partitionNo || '',
        upicId: '',
        ownerName: '',
        address: '',
        displayProperty: item.displayLabel || item.propertyNo,
        category: item.category,
        categoryLabel: item.categoryLabel,
        societyDetailId: item.societyDetailId,
        societyName: item.societyName,
        wings: item.wings,
        wingDetailId: item.wingDetailId,
      }));
      return { success: true, data: suggestions, pagination: result.pagination };
    }
    return { success: false, error: result.error || 'Failed to fetch suggestions' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    return { success: false, error: message };
  }
}

export const ptisSuggestionsClient = {
  getSuggestions(params: Omit<PropertySuggestionParams, 'pageNumber' | 'pageSize'>) {
    return fetchSuggestions(params);
  },

  getSuggestionsPage(
    params: PropertySuggestionParams & { pageNumber: number; pageSize: number }
  ) {
    return fetchSuggestions(params);
  }
};
