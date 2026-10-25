"use client";

/**
 * useNADynamicFields
 *
 * Client-side fetcher for dynamic attribute field definitions for the
 * New Add New Asset page.  Mirrors the old Add New Asset's server-side
 * prefetchedFields pattern, but executed client-side because the new
 * page is a pure client route (no SSR sub-routes).
 *
 * Re-fetches automatically whenever categoryId or typeId change so that
 * the Additional Details card always shows the correct fields for the
 * currently selected category/type.
 */

import { useState, useEffect, useRef } from "react";
import { fetchBuildingFieldDefinitions } from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/[assetId]/basic-info/action";
import type { ProcessedField, UseNADynamicFieldsReturn } from "@/types/asset/municipal-Asset/new-add-new-asset";

export type { UseNADynamicFieldsReturn };

export function useNADynamicFields(
  categoryId: number,
  typeId: number,
  initialFields?: ProcessedField[]
): UseNADynamicFieldsReturn {
  const [fields, setFields] = useState<ProcessedField[]>(initialFields || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track the last successfully fetched pair to avoid redundant fetches
  const lastFetchedRef = useRef<{ categoryId: number; typeId: number } | null>(
    Array.isArray(initialFields) && initialFields.length > 0 && categoryId > 0 && typeId > 0
      ? { categoryId, typeId }
      : null
  );

  const [prevCatType, setPrevCatType] = useState({ categoryId, typeId });
  if (categoryId !== prevCatType.categoryId || typeId !== prevCatType.typeId) {
    setPrevCatType({ categoryId, typeId });
    if (!categoryId || !typeId || categoryId <= 0 || typeId <= 0) {
      setFields([]);
      setLoading(false);
      setError(null);
    }
  }

  useEffect(() => {
    if (!categoryId || !typeId || categoryId <= 0 || typeId <= 0) {
      return;
    }

    // Skip if we already fetched this exact pair
    const last = lastFetchedRef.current;
    if (last && last.categoryId === categoryId && last.typeId === typeId) {
      return;
    }

    let cancelled = false;

    async function fetchFields() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchBuildingFieldDefinitions(categoryId, typeId);
        if (cancelled) return;
        if (result.success) {
          setFields(result.data);
          lastFetchedRef.current = { categoryId, typeId };
        } else {
          setFields([]);
          setError(result.error ?? "Failed to load additional fields.");
        }
      } catch (err) {
        if (cancelled) return;
        setFields([]);
        setError(
          err instanceof Error ? err.message : "Unexpected error loading fields."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchFields();

    return () => {
      cancelled = true;
    };
  }, [categoryId, typeId]);

  return { fields, loading, error };
}
