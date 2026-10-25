import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { ScopeOptionItem, Scope } from '@/types/addTaxes.types';

/**
 * Owns the scope-selection state (which scope tab/mode is active, the selection field values, and
 * their URL sync) — split out of useAddTaxesState.ts verbatim (pure relocation, no logic change) to
 * bring that hook's line count down, per review feedback. Named distinctly from the existing
 * `useScopeSelection` hook (used inside ScopeSelectionPanel for eligible-count/execute/etc.) since
 * that's a different, unrelated concern despite the similar name.
 */
export function useAddTaxesScopeSelection(scopeOptions: ScopeOptionItem[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlScope = searchParams.get('scope') as Scope | null;
  const [selectedScope, setSelectedScope] = useState<Scope>(urlScope || 'zone');

  const [selectionData, setSelectionData] = useState<Record<string, string[]>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  const isLocalUpdateRef = useRef(false);

  // Track which scope has been initialized to prevent re-running on URL changes
  const initializedScopeRef = useRef<string | null>(null);

  // Sync selectionData from URL parameters ONLY on mount or when scope changes (not on URL param changes)
  useEffect(() => {
    if (!scopeOptions || scopeOptions.length === 0) return;

    // Skip if already initialized for this scope (user is actively selecting, don't overwrite)
    if (initializedScopeRef.current === selectedScope) return;

    const currentParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : searchParams;
    const urlScope = currentParams.get('scope');
    const effectiveScope = (urlScope || selectedScope) as Scope;

    const currentScopeData = scopeOptions.find(s => s.scopeType === effectiveScope);
    if (!currentScopeData) return;

    const optionsToRender = effectiveScope === 'property' ? ['Search Property'] : (currentScopeData.options || []);
    const newSelectionData: Record<string, string[]> = {};

    for (const option of optionsToRender) {
      const optStr = option.toLowerCase();
      if (optStr.includes('zone')) {
        const val = currentParams.get('zoneid');
        if (val) newSelectionData[option] = val.split(',');
      } else if (optStr.includes('ward')) {
        const val = currentParams.get('wardid');
        if (val) newSelectionData[option] = val.split(',');
      } else if (optStr.includes('property type')) {
        const val = currentParams.get('PropertyTypeId') || currentParams.get('propertyTypeId') || currentParams.get('propertytypeid') || currentParams.get('TypeOfUseGroupId');
        if (val) {
          newSelectionData[option] = val.split(',');
        } else {
          newSelectionData[option] = [];
        }
      } else if (optStr.includes('property no') || optStr.includes('building')) {
        const val = currentParams.get('propertyno');
        if (val) newSelectionData[option] = val.split(',');
      } else if (optStr.includes('assessment status')) {
        const val = currentParams.get('assessmentStatusIds');
        if (val) newSelectionData[option] = val.split(',');
      } else if (optStr.includes('from')) {
        const val = currentParams.get('fromPropertyNo');
        if (val) newSelectionData[option] = [val];
      } else if (optStr.includes('to')) {
        const val = currentParams.get('toPropertyNo');
        if (val) newSelectionData[option] = [val];
      } else if (optStr.includes('search') || optStr.includes('specific')) {
        const val = currentParams.get('searchText') || currentParams.get('SearchText');
        if (val) newSelectionData[option] = [val];
      }
    }

    // Mark this scope as initialized so we don't overwrite user selections on URL changes
    initializedScopeRef.current = effectiveScope;

    const timer = setTimeout(() => {
      setSelectionData(newSelectionData);
      setIsInitialized(true);
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedScope, scopeOptions]);

  const handleSelectionChange = (key: string, values: string[], _labels?: string[]) => {
    isLocalUpdateRef.current = true;

    const prevKeys = Object.keys(selectionData);
    const next = { ...selectionData, [key]: values };

    const isZone = key.toLowerCase().includes('zone');
    if (isZone) {
      for (const k of prevKeys) {
        const lowerKey = k.toLowerCase();
        if (lowerKey.includes('ward')) {
          next[k] = [];
        }
        if (lowerKey.includes('building') || lowerKey.includes('property no') || lowerKey.includes('from') || lowerKey.includes('to')) {
          next[k] = [];
        }
      }
    }

    const isWard = key.toLowerCase().includes('ward');
    if (isWard) {
      for (const k of prevKeys) {
        const lowerKey = k.toLowerCase();
        if (lowerKey.includes('building') || lowerKey.includes('property no') || lowerKey.includes('from') || lowerKey.includes('to')) {
          next[k] = [];
        }
      }
    }

    setSelectionData(next);

    // Clean selection query params from URL if present to keep URL clean and prevent 404/414 URI Too Long errors
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : searchParams.toString());
    const keyMap: Record<string, string> = {
      'zone': 'zoneid',
      'ward': 'wardid',
      'property type': 'PropertyTypeId',
      'assessment status': 'assessmentStatusIds',
      'search': 'searchText',
      'specific': 'searchText'
    };

    const labelMap: Record<string, string> = {
      'property no': 'propertyno',
      'building': 'propertyno',
      'from': 'fromPropertyNo',
      'to': 'toPropertyNo'
    };

    let paramsChanged = false;
    Object.values(keyMap).concat(Object.values(labelMap)).forEach(p => {
      if (params.has(p)) {
        params.delete(p);
        paramsChanged = true;
      }
    });

    if (paramsChanged) {
      const newUrl = `${pathname}?${params.toString()}`;
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', newUrl);
      }
      router.replace(newUrl, { scroll: false });
    }
  };

  const clearSelectionData = (preventUrlUpdate = false) => {
    setSelectionData({});

    if (preventUrlUpdate) return;

    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : searchParams.toString());
    const paramsToClear = [
      'zoneid', 'wardid', 'PropertyTypeId', 'propertyTypeId', 'propertytypeid', 'TypeOfUseGroupId',
      'propertyid', 'propertyno', 'assessmentStatusIds', 'fromPropertyId', 'toPropertyId',
      'fromPropertyNo', 'toPropertyNo', 'searchText', 'SearchText', 'wardno', 'PropertyTypeCode',
      'propertyTypeCode', 'typeOfUseGroupCode'
    ];
    paramsToClear.forEach(p => params.delete(p));

    const newUrl = `${pathname}?${params.toString()}`;
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', newUrl);
    }
    router.replace(newUrl, { scroll: false });
  };

  const handleScopeChange = (val: Scope) => {
    // Reset init ref so new scope gets initialized from URL on tab change
    initializedScopeRef.current = null;
    setSelectedScope(val);
    setSelectionData({}); // clear selections on scope change
    setIsInitialized(false);

    // Clear all other query params except scope, financeYearId, and tab to avoid race conditions
    const params = new URLSearchParams();
    const fy = searchParams.get('financeYearId') || searchParams.get('financeYear');
    if (fy) params.set('financeYearId', fy);
    const tab = searchParams.get('tab');
    if (tab) params.set('tab', tab);
    params.set('scope', val);

    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `${pathname}?${params.toString()}`);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return {
    selectedScope,
    selectionData,
    handleSelectionChange,
    clearSelectionData,
    handleScopeChange,
    isInitialized,
  };
}
