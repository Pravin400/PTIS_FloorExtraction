import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { normalizePartition } from '@/lib/utils/format';
import type { PTISSearchSelectOption as SearchSelectOption } from '@/components/common/PTISSearchSelect';
import type { PropertyListItem } from '@/types/ptis.types';

/** Separator used in composite option-value keys to prevent key collisions. */
const COMPOSITE_KEY_SEP = '::' as const;

/**
 * The decoded payload stored behind each partition option's composite key.
 * Replaces the previous JSON.stringify/JSON.parse pattern.
 */
export interface PartitionOptionValue {
  partitionNo: string;
  propertyId: number;
  category?: number;
  categoryLabel?: string;
  societyDetailId?: number | null;
  wingDetailId?: number | null;
}

/**
 * The decoded payload stored behind each property option's composite key.
 * Replaces the previous JSON.stringify/JSON.parse pattern.
 */
export interface PropertyOptionValue {
  propertyNo: string;
  partitionNo: string;
  propertyId: number;
  category?: number;
  categoryLabel?: string;
  societyDetailId?: number | null;
  wingDetailId?: number | null;
}

/** Builds a stable composite key for a property option. */
export function buildPropertyOptionKey(propertyNo: string, partitionNo: string): string {
  return `${propertyNo}${COMPOSITE_KEY_SEP}${normalizePartition(partitionNo)}`;
}

/** Builds a stable composite key for a partition option. */
export function buildPartitionOptionKey(propertyNo: string, partitionNo: string): string {
  return `${propertyNo}${COMPOSITE_KEY_SEP}${normalizePartition(partitionNo)}`;
}

export function usePropertyOptions(
  propertyNo: string,
  initialPropertyOptions: SearchSelectOption[],
  initialRawPropertyData: PropertyListItem[]
) {
  const t = useTranslations('ptis');

  /** Deduplicate property options by display label to prevent duplicate items from rendering */
  const propertyOptions = useMemo<SearchSelectOption[]>(() => {
    const seen = new Set<string>();
    const unique: SearchSelectOption[] = [];
    for (const opt of initialPropertyOptions) {
      const key = opt.label.trim();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(opt);
      }
    }
    return unique;
  }, [initialPropertyOptions]);

  /**
   * Maps composite key → PropertyOptionValue for O(1) lookup in the component.
   * Key format: "propertyNo::normalizedPartitionNo"
   *
   * NOTE: propertyOptions values are JSON strings (produced by page.tsx SSR or dynamic mapper).
   * This map bridges the format to a type-safe lookup without JSON.parse at render time.
   */
  const propertyOptionValueMap = useMemo(() => {
    const map = new Map<string, string>();
    propertyOptions.forEach((o) => {
      try {
        const p = JSON.parse(o.value) as PropertyOptionValue;
        const key = buildPropertyOptionKey(p.propertyNo, p.partitionNo);
        if (!map.has(key)) {
          map.set(key, o.value);
        }
      } catch {
        // Malformed option — skip silently.
      }
    });
    return map;
  }, [propertyOptions]);

  /**
   * Maps composite key → PartitionOptionValue for O(1) lookup in handlePartitionChange.
   * Eliminates the JSON.parse inside the render loop and inside the onChange handler.
   */
  const partitionValueMap = useMemo(() => {
    const map = new Map<string, PartitionOptionValue>();
    if (!propertyNo || initialRawPropertyData.length === 0) return map;

    initialRawPropertyData
      .filter((p) => p.propertyNo === propertyNo)
      .forEach((p) => {
        const normalized = normalizePartition(p.partitionNo);
        const key = buildPartitionOptionKey(p.propertyNo, normalized);
        if (!map.has(key)) {
          map.set(key, {
            partitionNo: normalized,
            propertyId: p.propertyId,
            category: p.category,
            categoryLabel: p.categoryLabel,
            societyDetailId: p.societyDetailId,
            wingDetailId: p.wingDetailId,
          });
        }
      });

    return map;
  }, [propertyNo, initialRawPropertyData]);

  /** Partition options whose value is a stable composite key — no JSON serialization. */
  const partitionOptions = useMemo<SearchSelectOption[]>(() => {
    return Array.from(partitionValueMap.entries()).map(([key, data]) => ({
      label: data.partitionNo || t('search.noPartition'),
      value: key,
    }));
  }, [partitionValueMap, t]);

  return {
    propertyOptions,
    rawPropertyData: initialRawPropertyData,
    partitionOptions,
    partitionValueMap,
    propertyOptionValueMap,
  };
}
