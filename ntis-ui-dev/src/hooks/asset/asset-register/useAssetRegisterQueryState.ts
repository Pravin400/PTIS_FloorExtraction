'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { ReadonlyURLSearchParams } from 'next/navigation';

export const VIEW_IMAGE_QUERY_KEY = 'viewImageAssetId';
export const EXPAND_ASSET_QUERY_KEY = 'expandAssetId';

type OpenSubunitRowsState = Record<number, boolean>;

type UseAssetRegisterQueryStateParams = {
  searchParams: ReadonlyURLSearchParams;
  pathname: string;
  isPanelVisible: boolean;
  onClosePanelFromQuery: () => void;
  setOpenSubunitRows: React.Dispatch<React.SetStateAction<OpenSubunitRowsState>>;
};

function parsePositiveInt(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0 || !Number.isInteger(parsed)) return null;
  return parsed;
}

export function useAssetRegisterQueryState({
  searchParams,
  pathname,
  isPanelVisible,
  onClosePanelFromQuery,
  setOpenSubunitRows,
}: UseAssetRegisterQueryStateParams) {
  const previousViewImageAssetIdRef = useRef<number | null>(null);

  const updateActionQuery = useCallback((key: string, value: string | null) => {
    const currentSearch = typeof window !== 'undefined' ? window.location.search : searchParams.toString();
    const params = new URLSearchParams(currentSearch);
    if (value == null || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const next = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    // Use History API for UI-only state to avoid route remount races on first click.
    window.history.replaceState(window.history.state, '', next);
  }, [searchParams, pathname]);

  useEffect(() => {
    const imageAssetId = parsePositiveInt(searchParams.get(VIEW_IMAGE_QUERY_KEY));
    const previousImageAssetId = previousViewImageAssetIdRef.current;
    previousViewImageAssetIdRef.current = imageAssetId;

    if (previousImageAssetId != null && imageAssetId == null && isPanelVisible) {
      // Close only when URL actually transitions from set -> cleared.
      queueMicrotask(() => {
        onClosePanelFromQuery();
      });
    }
  }, [searchParams, isPanelVisible, onClosePanelFromQuery]);

  useEffect(() => {
    const expandedAssetId = parsePositiveInt(searchParams.get(EXPAND_ASSET_QUERY_KEY));
    if (expandedAssetId == null) {
      setOpenSubunitRows({});
    } else {
      setOpenSubunitRows({ [expandedAssetId]: true });
    }
  }, [searchParams, setOpenSubunitRows]);

  return {
    updateActionQuery,
  };
}
