import { useCallback, useMemo, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { fetchFilterOptionsAction, type FilterField } from '@/app/[locale]/property-tax/ptis/appartmentQC/action';
import { getPropertyTypeByIdAction } from '@/app/[locale]/property-tax/propertytype/action';
import { logger } from '@/lib/utils/logger';

interface FilterOption {
  value: string;
  label: string;
}

interface UseColumnFiltersProps {
  wardId: number | string;
  propertyNo: string;
  activeMainTab?: string;
}

/**
 * Convert main tab value to PartType for API call.
 */
function getPartTypeFromMainTab(mainTab: string): string | undefined {
  switch (mainTab) {
    case 'commercial':
      return 'C';
    case 'residential':
      return 'R';
    case 'amenities':
      return 'Amenity';
    default:
      return undefined;
  }
}

/**
 * Hook for managing column filters in Apartment QC tables.
 * Handles filter state from URL params and provides methods for fetching options and updating filters.
 */
export function useColumnFilters({ wardId, propertyNo, activeMainTab }: UseColumnFiltersProps) {
  const partType = useMemo(() => getPartTypeFromMainTab(activeMainTab || ''), [activeMainTab]);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isFilterPending, startTransition] = useTransition();

  // Parse active filters from URL params
  const activeFilters = useMemo(() => {
    const filters: Record<FilterField, string[]> = {
      wing: [],
      flatOrShopNo: [],
      apartmentType: [],
      propertyType: [],
    };

    const wingParam = searchParams.get('filterWing');
    const flatParam = searchParams.get('filterFlatOrShopNo');
    const apartmentTypeParam = searchParams.get('filterApartmentType');
    const propertyTypeParam = searchParams.get('filterPropertyType');

    if (wingParam) filters.wing = wingParam.split(',').filter(Boolean);
    if (flatParam) filters.flatOrShopNo = flatParam.split(',').filter(Boolean);
    if (apartmentTypeParam) filters.apartmentType = apartmentTypeParam.split(',').filter(Boolean);
    if (propertyTypeParam) filters.propertyType = propertyTypeParam.split(',').filter(Boolean);

    return filters;
  }, [searchParams]);

  // Update URL params when filter changes
  const handleFilterChange = useCallback((field: FilterField, values: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Map field to URL param name
    const paramMap: Record<FilterField, string> = {
      wing: 'filterWing',
      flatOrShopNo: 'filterFlatOrShopNo',
      apartmentType: 'filterApartmentType',
      propertyType: 'filterPropertyType',
    };

    const paramName = paramMap[field];
    
    if (values.length === 0) {
      params.delete(paramName);
    } else {
      params.set(paramName, values.join(','));
    }

    // Reset to page 1 when filters change
    params.set('pageNumber', '1');

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }, [pathname, router, searchParams]);

  // Fetch filter options for a specific field
  const fetchFilterOptions = useCallback(async (field: FilterField): Promise<FilterOption[]> => {
    if (!wardId || !propertyNo) {
      return [];
    }

    try {
      const result = await fetchFilterOptionsAction(wardId, propertyNo, field, partType);
      
      if (!result.success || !result.data) {
        return [];
      }

      const items = result.data;
      
      // Map the response items to filter options based on field
      switch (field) {
        case 'wing':
          return items.wings
            .filter((w) => w && w.trim() !== '')
            .map((w) => ({ value: w, label: w }));
        
        case 'flatOrShopNo':
          return items.flatOrShopNos
            .filter((f) => f && f.trim() !== '')
            .map((f) => ({ value: f, label: f }));
        
        case 'apartmentType':
          return items.apartmentTypes
            .filter((a) => a && a.trim() !== '')
            .map((a) => ({ value: a, label: a }));
        
        case 'propertyType': {
          // Property types are IDs, resolve to descriptions in parallel (fallback to ID)
          const propertyTypeIds = items.propertyTypes;
          const options = await Promise.all(
            propertyTypeIds.map(async (id) => {
              try {
                const propertyType = await getPropertyTypeByIdAction(id);
                const label = propertyType?.propertyDescription?.trim();
                return { value: String(id), label: label || String(id) };
              } catch (error) {
                logger.error(`[useColumnFilters] Failed to fetch property type ${id}`, { error: error as Error });
                return { value: String(id), label: String(id) };
              }
            })
          );
          return options;
        }
        
        default:
          return [];
      }
    } catch (error) {
      logger.error(`[useColumnFilters] Failed to fetch filter options for ${field}`, { error: error as Error });
      return [];
    }
  }, [wardId, propertyNo, partType]);

  return {
    activeFilters,
    handleFilterChange,
    fetchFilterOptions,
    isFilterPending,
  };
}

export default useColumnFilters;
