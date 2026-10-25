import { useState, useEffect } from 'react';
import type { PropertyListItem } from '@/types/ptis.types';
import { ptisSuggestionsClient } from '@/lib/api/ptis/tab/ptis-suggestions-client';

const suggestionsCache = new Map<string, PropertyListItem[]>();
const MAX_CACHE_SIZE = 100;

function deduplicateProperties(list: PropertyListItem[]): PropertyListItem[] {
  const seenIds = new Set<number>();
  const seenComposite = new Set<string>();
  const result: PropertyListItem[] = [];

  for (const item of list) {
    const id = item.propertyId ? Number(item.propertyId) : null;
    const itemNormPart = (item.partitionNo ?? '').trim().toLowerCase();
    const normalizedItemPart = itemNormPart === '0' ? '' : itemNormPart;
    const itemPropNo = (item.propertyNo ?? '').trim().toLowerCase();
    const compositeKey = `${itemPropNo}::${normalizedItemPart}`;

    if (id && seenIds.has(id)) {
      continue;
    }
    if (itemPropNo && seenComposite.has(compositeKey)) {
      continue;
    }

    if (id) seenIds.add(id);
    if (itemPropNo) seenComposite.add(compositeKey);
    result.push(item);
  }

  return result;
}

export function usePropertySuggestions(
  wardId: number | null | undefined,
  debouncedSearchText: string,
  debouncedPartitionSearchText: string,
  draftPropertyId: string | null | undefined,
  initialProperties: PropertyListItem[] = []
) {
  const [propertiesList, setPropertiesList] = useState<PropertyListItem[]>([]);
  const [isSearchingProperties, setIsSearchingProperties] = useState(false);

  useEffect(() => {
    if (!wardId || (!debouncedSearchText && !debouncedPartitionSearchText)) {
      const timer = setTimeout(() => {
        setPropertiesList((prev) => {
          const selectedPropId = draftPropertyId ? Number(draftPropertyId) : null;
          const currentSelected = prev.find((p) => p.propertyId === selectedPropId);

          const list = [...initialProperties];
          if (currentSelected && !list.some((p) => p.propertyId === currentSelected.propertyId)) {
            list.unshift(currentSelected);
          }
          return deduplicateProperties(list);
        });
      }, 0);
      return () => clearTimeout(timer);
    }

    let propNo = debouncedSearchText;
    let partNo = debouncedPartitionSearchText;
    if (debouncedSearchText.includes('-')) {
      const parts = debouncedSearchText.split('-');
      propNo = parts[0];
      partNo = parts.slice(1).join('-');
    }

    const cacheKey = `${wardId}::${propNo}::${partNo}`;
    if (suggestionsCache.has(cacheKey)) {
      const cached = suggestionsCache.get(cacheKey)!;
      const timer = setTimeout(() => {
        setPropertiesList((prev) => {
          const selectedPropId = draftPropertyId ? Number(draftPropertyId) : null;
          const currentSelected = prev.find((p) => p.propertyId === selectedPropId);
          const list = [...cached];
          const matchesSearch =
            !propNo ||
            Boolean(currentSelected && currentSelected.propertyNo.toLowerCase().includes(propNo.toLowerCase()));
          if (
            currentSelected &&
            matchesSearch &&
            !list.some((p) => p.propertyId === currentSelected.propertyId)
          ) {
            list.unshift(currentSelected);
          }
          return deduplicateProperties(list);
        });
        setIsSearchingProperties(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    let active = true;
    const searchTimer = setTimeout(() => {
      setIsSearchingProperties(true);
    }, 0);

    ptisSuggestionsClient
      .getSuggestions({
        wardId,
        propertyNo: propNo,
        partitionNo: partNo,
      })
      .then((res) => {
        if (!active) return;
        if (res.success && res.data) {
          // Store in cache
          if (suggestionsCache.size >= MAX_CACHE_SIZE) {
            const firstKey = suggestionsCache.keys().next().value;
            if (firstKey) suggestionsCache.delete(firstKey);
          }
          suggestionsCache.set(cacheKey, res.data);

          setPropertiesList((prev) => {
            const selectedPropId = draftPropertyId ? Number(draftPropertyId) : null;
            const currentSelected = prev.find((p) => p.propertyId === selectedPropId);

            const list = [...res.data!];
            const matchesSearch =
              !propNo ||
              Boolean(currentSelected && currentSelected.propertyNo.toLowerCase().includes(propNo.toLowerCase()));
            if (
              currentSelected &&
              matchesSearch &&
              !list.some((p) => p.propertyId === currentSelected.propertyId)
            ) {
              list.unshift(currentSelected);
            }
            return deduplicateProperties(list);
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) {
          setIsSearchingProperties(false);
        }
      });

    return () => {
      active = false;
      clearTimeout(searchTimer);
    };
  }, [debouncedSearchText, debouncedPartitionSearchText, wardId, draftPropertyId, initialProperties]);

  return {
    propertiesList,
    setPropertiesList,
    isSearchingProperties,
  };
}
