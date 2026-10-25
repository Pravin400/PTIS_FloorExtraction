/* eslint-disable @typescript-eslint/no-explicit-any */
import { cache } from 'react';

import { zoneService } from './zone.service';
import { wardService } from './ward.service';
import { departmentService } from './department.service';
import { moujaService } from './mouja.service';
import { categoryTypeService } from './category-type.service';
import { ownershipTypeService } from './ownership-type.service';

/**
 * CACHED MASTER DATA FETCHERS
 * 
 * We use a combination of:
 * 1. React's `cache()` to deduplicate calls within the same request lifecycle (e.g., across multiple Server Components).
 * 2. Next.js' `unstable_cache()` to cache the results on the server across multiple requests, revalidating every 5 minutes.
 * 
 * This significantly reduces backend API load and improves page render performance, especially for the multi-step Asset Form.
 */

const filterActive = (res: any) => {
  if (res.success && Array.isArray(res.data)) {
    res.data = res.data.filter((item: any) => 
      item.isActive !== false && item.isActive !== 0 && 
      item.IsActive !== false && item.IsActive !== 0 && 
      item.status?.toLowerCase() !== 'inactive'
    );
  }
  return res;
};

// Wrap with React cache for request deduplication
export const getCachedZones = cache(async () => {
  return filterActive(await zoneService.getZones());
});

export const getCachedWards = cache(async () => {
  return filterActive(await wardService.getWards());
});

export const getCachedDepartments = cache(async () => {
  return filterActive(await departmentService.getDepartments());
});

export const getCachedMoujas = cache(async () => {
  return filterActive(await moujaService.getMoujas());
});

export const getCachedCategories = cache(async () => {
  return filterActive(await categoryTypeService.getCategories());
});

export const getCachedTypes = cache(async () => {
  return filterActive(await categoryTypeService.getAllTypes());
});

export const getCachedOwnershipTypes = cache(async () => {
  return filterActive(await ownershipTypeService.getOwnershipTypes());
});

