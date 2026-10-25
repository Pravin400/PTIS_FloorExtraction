'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { FieldConfig } from '@/types/rule-engine';
import type { ConditionItem } from '@/types/dynamic-tax-register.types';
import { fetchDynamicConditionFieldOptionsAction } from '@/app/[locale]/property-tax/dynamic-tax-register/action';

type OptionMap = Record<string, { label: string; value: string }[]>;

/** Minimal shape this hook needs — any row carrying a condition list works (drawer
 *  `ConditionRuleRow`s and the read-only `ConditionOverviewRow`s alike). */
interface RowWithConditions {
  conditions: ConditionItem[];
}

/**
 * Caches API-sourced fields' option lists (fetched once per fieldId, across all rows) so
 * the collapsed row summary can resolve a stored value ("2") to its display label
 * ("Women") the same way the value picker itself does. Static-list fields already resolve
 * synchronously via `staticValuesJson` in `resolveStaticValueLabel` — this covers the
 * `sourceType === 'API'` case, which needs a fetch. Uses a ref-backed cache (not state) so
 * the effect doesn't need `apiOptionsByField` as a dependency and re-fetch on every update.
 */
export function useDynamicTaxConditionValueLabels(fields: FieldConfig[], rows: RowWithConditions[]) {
  const cacheRef = useRef<OptionMap>({});
  const pendingRef = useRef<Set<string>>(new Set());
  const [, forceRender] = useState(0);

  const apiFieldIds = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .flatMap((r) => r.conditions)
            .map((c) => c.fieldId)
            .filter((fieldId) => fields.find((f) => f.fieldId === fieldId)?.sourceType === 'API')
        )
      ),
    [rows, fields]
  );

  useEffect(() => {
    apiFieldIds.forEach((fieldId) => {
      if (cacheRef.current[fieldId] || pendingRef.current.has(fieldId)) return;
      const field = fields.find((f) => f.fieldId === fieldId);
      if (!field?.apiEndpoint) return;
      pendingRef.current.add(fieldId);
      fetchDynamicConditionFieldOptionsAction(
        field.apiEndpoint,
        field.apiMethod ?? 'GET',
        field.apiParameters,
        field.apiResponseMapping
      ).then((opts) => {
        cacheRef.current[fieldId] = opts;
        pendingRef.current.delete(fieldId);
        forceRender((n) => n + 1);
      });
    });
  }, [apiFieldIds, fields]);

  const resolveApiValueLabel = (fieldId: string, rawValue: string): string | undefined =>
    cacheRef.current[fieldId]?.find((o) => String(o.value) === String(rawValue))?.label;

  return { resolveApiValueLabel };
}
