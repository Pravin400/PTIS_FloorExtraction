'use server';

import { ptisService } from '@/lib/api/ptis/tab/ptis.service';
import { createPtisSchemas, propertyIdActionSchema } from '@/lib/validations/ptis.schema';
import { retryWithBackoff } from '@/lib/utils/api';
import { getTranslations } from 'next-intl/server';
import type { PropertyListItem } from '@/types/ptis.types';


export async function getPtisValidationSchemas() {
  const t = await getTranslations('ptis');
  return createPtisSchemas((key) => t(key));
}

export async function createAction<T>(
  fn: () => Promise<{ success: boolean; data?: T; error?: string | { message?: string } }>
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const result = await fn();
    if (result.success) {
      return { success: true, data: result.data };
    }
    const errorMsg =
      typeof result.error === 'string' ? result.error : result.error?.message || 'Action failed';
    return { success: false, error: errorMsg };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

type WardListItem = { wardId: number; wardNo: string; zoneId: number; description: string };
let wardListCache: { data: WardListItem[]; timestamp: number } | null = null;
const WARD_CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

const wardIdByNoCache = new Map<string, { data: { wardId: number }; timestamp: number }>();
const WARD_ID_CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache

const propertyListByWardCache = new Map<string, { data: unknown[]; timestamp: number }>();
const PROPERTY_LIST_CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

export async function getWardListAction(): Promise<{ success: boolean; data?: WardListItem[]; error?: string }> {
  if (wardListCache && Date.now() - wardListCache.timestamp < WARD_CACHE_TTL) {
    return { success: true, data: wardListCache.data };
  }
  return createAction(async () => {
    const result = await retryWithBackoff(() => ptisService.getWardList(), {
      maxRetries: 2,
      initialDelay: 500,
      maxDelay: 2000,
      backoffMultiplier: 2,
    });
    if (result.success && result.data) {
      // Sort alphabetically/alphanumerically using natural sort before caching
      const sortedData = [...result.data].sort((a, b) => {
        return (a.wardNo || '').localeCompare(b.wardNo || '', undefined, {
          numeric: true,
          sensitivity: 'base',
        });
      });
      wardListCache = { data: sortedData, timestamp: Date.now() };
      return { success: true, data: sortedData };
    }
    return result;
  });
}

export async function fetchWardIdAction(wardNo: string) {
  const normWard = (wardNo || '').trim().toLowerCase();
  const cached = wardIdByNoCache.get(normWard);
  if (cached && Date.now() - cached.timestamp < WARD_ID_CACHE_TTL) {
    return { success: true, data: cached.data };
  }

  const { wardNoActionSchema } = await getPtisValidationSchemas();
  const validation = wardNoActionSchema.safeParse({ wardNo });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const result = await createAction<{ wardId: number }>(async () => {
    const apiResult = await ptisService.getWardByNo(wardNo);
    if (apiResult.success && apiResult.data) {
      const rawData = apiResult.data as Record<string, unknown>;
      const rawWardId = rawData.wardId ?? rawData.wardID ?? rawData.id;
      return { success: true, data: { wardId: Number(rawWardId) } };
    }
    return { success: false, error: apiResult.error };
  });

  if (result.success && result.data) {
    wardIdByNoCache.set(normWard, { data: result.data, timestamp: Date.now() });
  }

  return result;
}

export async function getPropertyListByWardAction(wardId: number, limit?: number) {
  const cacheKey = `${wardId}:${limit ?? 'all'}`;
  const cached = propertyListByWardCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < PROPERTY_LIST_CACHE_TTL) {
    return { success: true, data: cached.data as PropertyListItem[] };
  }

  const { wardIdActionSchema } = await getPtisValidationSchemas();
  const validation = wardIdActionSchema.safeParse({ wardId });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const result = await createAction(() => ptisService.getPropertyListByWard(wardId, limit));
  if (result.success && result.data) {
    propertyListByWardCache.set(cacheKey, { data: result.data, timestamp: Date.now() });
  }

  return result;
}

export async function getPropertySuggestionsAction(
  wardNo?: string,
  wardId?: number,
  searchText?: string
) {
  const { searchSuggestionsSchema } = await getPtisValidationSchemas();
  const validation = searchSuggestionsSchema.safeParse({ wardNo, wardId, searchText });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  return createAction(() => ptisService.getPropertySuggestions(wardNo, wardId, searchText));
}

import type { PropwiseSuggestionItem } from '@/types/ptis-search.types';

export async function getPropertySuggestionsByPropwiseAction(
  wardId: number,
  propertyNo?: string,
  partitionNo?: string,
  maxResults = 100
) {
  const result = await createAction(() =>
    ptisService.getPropertySuggestionsByPropwise(wardId, propertyNo, partitionNo, maxResults)
  );

  if (result.success && result.data && Array.isArray(result.data)) {
    return {
      success: true,
      data: result.data.map((item: PropwiseSuggestionItem) => ({
        propertyId: item.propertyId,
        propertyNo: item.propertyNo,
        partitionNo: item.partitionNo,
        upicId: item.upicId,
        displayLabel: item.displayLabel,
        category: item.category,
        categoryLabel: item.categoryLabel,
        societyDetailId: item.societyDetailId,
        societyName: item.societyName,
        wingDetailId: item.wingDetailId,
        wings: item.wings,
      })),
    };
  }

  return result;
}

export async function searchPropertiesAction(filters: {
  wardNo?: string;
  wardId?: number;
  propertyNo?: string;
  upicId?: string;
  partitionNo?: string;
}) {
  const { searchSuggestionsSchema } = await getPtisValidationSchemas();
  const validation = searchSuggestionsSchema.safeParse(filters);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  return createAction(() => ptisService.searchProperties(filters));
}

export async function getWardSuggestionsAction(searchText?: string) {
  return createAction(() => ptisService.getWardSuggestions(searchText));
}

export async function getPartitionSuggestionsAction(
  wardNo?: string,
  wardId?: number,
  propertyNo?: string,
  searchText?: string
) {
  const { searchSuggestionsSchema } = await getPtisValidationSchemas();
  const validation = searchSuggestionsSchema.safeParse({ wardNo, wardId, propertyNo, searchText });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  return createAction(() =>
    ptisService.getPartitionSuggestions(wardNo, wardId, propertyNo, searchText)
  );
}

export async function fetchPropertyDetailsOnlyAction(
  wardNo: string,
  propertyNo: string,
  partitionNo: string,
  wardId?: number,
  propertyId?: number
) {
  const { propertyDetailsSchema } = await getPtisValidationSchemas();
  const validation = propertyDetailsSchema.safeParse({
    wardNo,
    propertyNo,
    partitionNo,
    wardId,
    propertyId,
  });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  return createAction(() =>
    ptisService.fetchPropertyDetailsOnly(wardNo, propertyNo, partitionNo, wardId, propertyId)
  );
}

export async function fetchPropertyBasicDetailsAction(propertyId: number) {
  const validation = propertyIdActionSchema.safeParse({ propertyId });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  return createAction(() => ptisService.getPropertyBasicDetails(propertyId));
}




