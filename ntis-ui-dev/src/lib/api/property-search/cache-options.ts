/**
 * Per-call fetch caching for Property Search supporting data.
 * Zones and Property Type categories rarely change, so we cache them
 * for a few minutes and only invalidate via explicit tags.
 */

export const PROPERTY_SEARCH_ZONE_TAG = "property-search-zone";
export const PROPERTY_SEARCH_CATEGORY_TAG = "property-search-category";
export const PROPERTY_SEARCH_ASSESSMENT_STATUS_TAG =
  "property-search-assessment-status";
export const PROPERTY_SEARCH_LOOKUP_TAG = "property-search-lookup";
export const PROPERTY_SEARCH_WORKFLOW_STAGE_TAG =
  "property-search-workflow-stage";

/** Cache duration for rarely-changing lookup data (5 minutes). */
const SHORT_CACHE_SECONDS = 300;
/** Cache duration for very stable data (15 minutes). */
const STABLE_CACHE_SECONDS = 900;

export const zoneCacheOptions: RequestInit = {
  cache: "force-cache",
  next: {
    tags: [PROPERTY_SEARCH_ZONE_TAG],
    revalidate: STABLE_CACHE_SECONDS,
  },
};

export const categoryCacheOptions: RequestInit = {
  cache: "force-cache",
  next: {
    tags: [PROPERTY_SEARCH_CATEGORY_TAG],
    revalidate: STABLE_CACHE_SECONDS,
  },
};

export const assessmentStatusCacheOptions: RequestInit = {
  cache: "force-cache",
  next: {
    tags: [PROPERTY_SEARCH_ASSESSMENT_STATUS_TAG],
    revalidate: STABLE_CACHE_SECONDS,
  },
};

export const workflowStageCacheOptions: RequestInit = {
  cache: "force-cache",
  next: {
    tags: [PROPERTY_SEARCH_WORKFLOW_STAGE_TAG],
    revalidate: STABLE_CACHE_SECONDS,
  },
};

export const lookupCacheOptions: RequestInit = {
  cache: "force-cache",
  next: {
    tags: [PROPERTY_SEARCH_LOOKUP_TAG],
    revalidate: SHORT_CACHE_SECONDS,
  },
};

export const EMPTY_LOOKUP_OPTIONS = {
  propertyNos: [] as string[],
  oldPropertyNos: [] as string[],
  upicIds: [] as string[],
  csns: [] as string[],
  subZoneNos: [] as string[],
};
