/* eslint-disable react-hooks/set-state-in-effect, @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from "react";
import { BulkUpdateFieldConfig, SelectOption } from "@/types/common-details-update/common-details-update.types";
import { getDynamicOptionsAction } from "@/app/[locale]/property-tax/common-details-update/actions";

function parseApiResponseOptions(apiDataRaw: any, config: BulkUpdateFieldConfig): SelectOption[] {
  const apiData = Array.isArray(apiDataRaw) ? apiDataRaw : (apiDataRaw?.items || (apiDataRaw ? [apiDataRaw] : []));
  let keyField = "";
  let valueField = "";

  if ((config as any).apiResponse) {
    const apiResStr = String((config as any).apiResponse).trim();
    if (apiResStr.includes(",")) {
      const parts = apiResStr.split(",").map((s) => s.trim());
      keyField = parts[0] || "";
      valueField = parts[1] || "";
    } else if (apiResStr.startsWith("{") || apiResStr.startsWith("[")) {
      try {
        const parsed = JSON.parse(apiResStr);
        if (parsed.key || parsed.Key) keyField = parsed.key || parsed.Key;
        if (parsed.value || parsed.Value) valueField = parsed.value || parsed.Value;
      } catch (_e) {
        const keyMatch = apiResStr.match(/['"]?(?:key|Key)['"]?\s*:\s*['"]([^'"]+)['"]/);
        const valMatch = apiResStr.match(/['"]?(?:value|Value)['"]?\s*:\s*['"]([^'"]+)['"]/);
        if (keyMatch) keyField = keyMatch[1];
        if (valMatch) valueField = valMatch[1];
      }
    } else {
      keyField = apiResStr;
    }
  }

  if (!keyField) keyField = "id";
  if (!valueField) valueField = "name";

  return apiData.map((item: any, index: number) => {
    if (typeof item !== "object" || item === null) {
      return {
        label: String(item),
        value: String(item),
      };
    }

    const keys = Object.keys(item);
    const exactKeyField = keys.find((k) => k.toLowerCase() === keyField.toLowerCase()) || keyField;
    const exactValueField = keys.find((k) => k.toLowerCase() === valueField.toLowerCase()) || valueField;

    let keyVal = item[exactKeyField];
    let labelVal = item[exactValueField];

    if (labelVal === undefined || labelVal === null) {
      const stringKey = keys.find((k) => k !== exactKeyField && typeof item[k] === "string");
      if (stringKey) {
        labelVal = item[stringKey];
      } else {
        const otherKey = keys.find((k) => k !== exactKeyField);
        if (otherKey) labelVal = item[otherKey];
      }
    }

    if (keyVal === undefined || keyVal === null) {
      const fallbackKey = keys.find((k) => typeof item[k] === "number") || keys[0];
      if (fallbackKey) keyVal = item[fallbackKey];
    }

    return {
      label: String(labelVal ?? keyVal ?? `Option (${index + 1})`),
      value: String(keyVal ?? index.toString()),
    };
  });
}

export const useBindApiOptions = (fieldConfigs: BulkUpdateFieldConfig[]) => {
  const [optionsMap, setOptionsMap] = useState<Record<string, SelectOption[]>>({});
  const [lookupMap, setLookupMap] = useState<Record<string, Record<string, string>>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [loadingMoreMap, setLoadingMoreMap] = useState<Record<string, boolean>>({});
  const [hasMoreMap, setHasMoreMap] = useState<Record<string, boolean>>({});
  const pageMapRef = useRef<Record<string, number>>({});
  const searchMapRef = useRef<Record<string, string>>({});

  const fetchFieldOptions = useCallback(
    async (config: BulkUpdateFieldConfig, pageNum: number, searchQuery: string, isAppend = false) => {
      if (!config.bindApi) return;

      const fieldName = config.fieldName;
      if (isAppend) {
        setLoadingMoreMap((prev) => ({ ...prev, [fieldName]: true }));
      } else {
        setLoadingMap((prev) => ({ ...prev, [fieldName]: true }));
      }

      try {
        const response = await getDynamicOptionsAction(config.bindApi, {
          SearchTerm: searchQuery,
          PageSize: 10,
          PageNumber: pageNum,
        });

        if (response.success && response.data) {
          const newOpts = parseApiResponseOptions(response.data, config);
          const rawData = response.data as any;
          const totalCount = typeof rawData?.totalCount === "number" ? rawData.totalCount : null;
          const hasNext = typeof rawData?.hasNext === "boolean" ? rawData.hasNext : null;

          setOptionsMap((prev) => {
            const existing = isAppend ? prev[fieldName] || [] : [];
            const existingValues = new Set(existing.map((o) => o.value));
            const filteredNew = newOpts.filter((o) => !existingValues.has(o.value));
            return { ...prev, [fieldName]: [...existing, ...filteredNew] };
          });

          // Accumulate into cumulative lookup map for table description resolution
          setLookupMap((prev) => {
            const currentLookup = { ...(prev[fieldName] || {}) };
            newOpts.forEach((opt) => {
              if (opt.value) {
                currentLookup[String(opt.value)] = opt.label;
              }
            });
            return { ...prev, [fieldName]: currentLookup };
          });

          pageMapRef.current[fieldName] = pageNum;
          searchMapRef.current[fieldName] = searchQuery;

          let hasMoreCalculated = false;
          if (hasNext !== null) {
            hasMoreCalculated = hasNext;
          } else if (totalCount !== null) {
            hasMoreCalculated = pageNum * 10 < totalCount;
          } else {
            hasMoreCalculated = newOpts.length >= 10;
          }

          setHasMoreMap((prev) => ({ ...prev, [fieldName]: hasMoreCalculated }));
        } else {
          if (!isAppend) {
            setOptionsMap((prev) => ({ ...prev, [fieldName]: [] }));
          }
          setHasMoreMap((prev) => ({ ...prev, [fieldName]: false }));
        }
      } catch (_err) {
        if (!isAppend) {
          setOptionsMap((prev) => ({ ...prev, [fieldName]: [] }));
        }
        setHasMoreMap((prev) => ({ ...prev, [fieldName]: false }));
      } finally {
        if (isAppend) {
          setLoadingMoreMap((prev) => ({ ...prev, [fieldName]: false }));
        } else {
          setLoadingMap((prev) => ({ ...prev, [fieldName]: false }));
        }
      }
    },
    []
  );

  // Prefetch comprehensive lookup dictionary for table display
  const fetchLookup = useCallback(async (config: BulkUpdateFieldConfig) => {
    if (!config.bindApi) return;
    const fieldName = config.fieldName;
    try {
      const response = await getDynamicOptionsAction(config.bindApi, {
        SearchTerm: "",
        PageSize: 1000,
        PageNumber: 1,
      });
      if (response.success && response.data) {
        const fullOpts = parseApiResponseOptions(response.data, config);
        setLookupMap((prev) => {
          const currentLookup = { ...(prev[fieldName] || {}) };
          fullOpts.forEach((opt) => {
            if (opt.value) {
              currentLookup[String(opt.value)] = opt.label;
            }
          });
          return { ...prev, [fieldName]: currentLookup };
        });
      }
    } catch (_e) {
      // Ignore prefetch error
    }
  }, []);

  useEffect(() => {
    if (!fieldConfigs || fieldConfigs.length === 0) {
      setOptionsMap({});
      setLookupMap({});
      setLoadingMap({});
      setHasMoreMap({});
      return;
    }

    // Prefetch lookup table for grid view descriptions in background without showing loading state on form dropdowns
    fieldConfigs.forEach((c) => {
      if (c.bindApi) {
        fetchLookup(c);
      }
    });
  }, [fieldConfigs, fetchLookup]);

  const onFieldFocus = useCallback(
    (fieldName: string) => {
      const config = fieldConfigs.find((c) => c.fieldName === fieldName);
      if (!config || !config.bindApi) return;
      if (!optionsMap[fieldName] || optionsMap[fieldName].length === 0) {
        fetchFieldOptions(config, 1, "", false);
      }
    },
    [fieldConfigs, optionsMap, fetchFieldOptions]
  );

  const onLoadMore = useCallback(
    (fieldName: string, searchQuery?: string) => {
      const config = fieldConfigs.find((c) => c.fieldName === fieldName);
      if (!config || !config.bindApi) return;
      if (loadingMoreMap[fieldName] || hasMoreMap[fieldName] === false) return;

      const currentPage = pageMapRef.current[fieldName] || 1;
      const currentSearch = searchQuery ?? searchMapRef.current[fieldName] ?? "";
      fetchFieldOptions(config, currentPage + 1, currentSearch, true);
    },
    [fieldConfigs, loadingMoreMap, hasMoreMap, fetchFieldOptions]
  );

  const onSearchChange = useCallback(
    (fieldName: string, searchQuery: string) => {
      const config = fieldConfigs.find((c) => c.fieldName === fieldName);
      if (!config || !config.bindApi) return;
      fetchFieldOptions(config, 1, searchQuery, false);
    },
    [fieldConfigs, fetchFieldOptions]
  );

  return {
    optionsMap,
    lookupMap,
    loadingMap,
    loadingMoreMap,
    hasMoreMap,
    onFocus: onFieldFocus,
    onLoadMore,
    onSearchChange,
  };
};
