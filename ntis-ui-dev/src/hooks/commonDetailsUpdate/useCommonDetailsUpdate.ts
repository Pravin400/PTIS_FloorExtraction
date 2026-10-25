/* eslint-disable react-hooks/set-state-in-effect, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
import { useState, useMemo, useCallback, useEffect, useRef, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useToast } from "@/components/common";
import {
  BulkUpdateFieldConfig,
  PropertyPreviewRow,
  PropertyFilterFormValues,
  WingOption,
  SelectOption,
  CommonDetailsUpdatePageProps,
  PropertyFilterByCategoryParams,
} from "@/types/common-details-update/common-details-update.types";
import { ScopeOption } from "@/lib/api/common-details-update/common-details-update.service";
import { PagedResponse } from "@/types/common.types";
import { useCommonDetailsUpdateActions } from "@/hooks/commonDetailsUpdate/useCommonDetailsUpdateActions";
import { useBindApiOptions } from "@/hooks/commonDetailsUpdate/useBindApiOptions";
import { useYearValidation, compileSafeRegex } from "@/hooks/commonDetailsUpdate/useUpdateFieldsValidation";
import { useDebounce } from "@/hooks/useDebounce";

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const MENU_SEARCH_DEBOUNCE_MS = 400;

function extractCategoryItems(data: any): { items: any[]; hasNext: boolean } {
  if (!data) return { items: [], hasNext: false };
  let rawList: any[] = [];
  let hasNextPage = false;

  if (Array.isArray(data)) {
    rawList = data;
  } else if (Array.isArray(data.items)) {
    rawList = data.items;
    hasNextPage = Boolean(data.hasNext);
  } else if (data.items && typeof data.items === 'object') {
    if (Array.isArray(data.items.items)) {
      rawList = data.items.items;
    }
    hasNextPage = Boolean(data.items.hasNext ?? data.hasNext);
  } else if (Array.isArray(data.data)) {
    rawList = data.data;
    hasNextPage = Boolean(data.hasNext);
  }
  return { items: rawList, hasNext: hasNextPage };
}

const fetchAndMergeProperties = async (
  baseParams: Omit<PropertyFilterByCategoryParams, 'UpdateCode'>,
  codes: string[],
  loadFn: (params: PropertyFilterByCategoryParams, onSuccess: (data: PagedResponse<PropertyPreviewRow>) => void) => Promise<void>
): Promise<{ items: PropertyPreviewRow[], totalCount: number }> => {
  if (!codes || !codes.length) return { items: [], totalCount: 0 };

  try {
    const results = await Promise.all(
      codes.map(code =>
        new Promise<{ items: PropertyPreviewRow[], totalCount: number }>((resolve) => {
          loadFn(
            { ...baseParams, UpdateCode: code } as PropertyFilterByCategoryParams,
            (data) => resolve({ items: data?.items || [], totalCount: data?.totalCount || 0 })
          ).catch((err) => {
            console.error(`Error loading properties for code ${code}:`, err);
            resolve({ items: [], totalCount: 0 });
          });
        })
      )
    );

    const mergedMap = new Map<number, PropertyPreviewRow>();
    let finalTotalCount = 0;

    for (const data of results) {
      if (data?.totalCount && data.totalCount > 0) {
        finalTotalCount = data.totalCount;
      }
      if (data?.items && Array.isArray(data.items)) {
        data.items.forEach((newItem) => {
          if (!newItem || !newItem.id) return;
          if (!mergedMap.has(newItem.id)) {
            mergedMap.set(newItem.id, { ...newItem });
          } else {
            const existing = mergedMap.get(newItem.id)!;
            const existingObj = existing as Record<string, unknown>;
            const newObj = newItem as Record<string, unknown>;

            for (const key of Object.keys(newObj)) {
              const val = newObj[key];
              if (val !== null && val !== undefined && val !== "" && val !== "-") {
                existingObj[key] = val;
              }
            }
          }
        });
      }
    }

    return { items: Array.from(mergedMap.values()), totalCount: finalTotalCount };
  } catch (error) {
    console.error("Failed to fetch and merge properties:", error);
    return { items: [], totalCount: 0 };
  }
};

export const useCommonDetailsUpdate = (props: CommonDetailsUpdatePageProps) => {
  const {
    menuItems,
    wardsData,
    wingsData,
    initialField,
    initialWardId,
    initialWardNo,
    initialFromProperty,
    initialToProperty,
    initialWing,
    initialPage,
    initialPageSize,
    initialSearchTerm,
    initialScopeId,
    initialZoneId,
    actions = {},
  } = props;
  const t = useTranslations("commonDetailsUpdate");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [_isPending, startTransition] = useTransition();

  const activeMenuItems = useMemo(() => {
    return (menuItems || []).filter((item) => item.isActive !== false);
  }, [menuItems]);

  const currentTab = searchParams.get("tab") || "updateFields";
  const isExcelUploadTab = currentTab.toLowerCase() === "excelupload";

  const [selectedCode, setSelectedCode] = useState<string>(
    initialField ? initialField.split(',')[0] : isExcelUploadTab ? "" : activeMenuItems[0]?.updateCode || ""
  );
  const [selectedCodes, setSelectedCodes] = useState<string[]>(
    initialField ? initialField.split(',') : isExcelUploadTab ? [] : activeMenuItems.length > 0 && activeMenuItems[0]?.updateCode ? [activeMenuItems[0].updateCode] : []
  );
  const [menuSearch, setMenuSearch] = useState("");
  const [serverSearchResults, setServerSearchResults] = useState<typeof activeMenuItems | null>(null);
  const [searchingMenu, setSearchingMenu] = useState(false);
  // Debounced group-search term. The debounce lives here in the hook file (not in the UI
  // component), so the server API (GetFieldRegistries with SearchTerm) fires only after the
  // user stops typing.
  const debouncedMenuSearch = useDebounce(menuSearch, MENU_SEARCH_DEBOUNCE_MS);
  const [fieldConfigs, setFieldConfigs] = useState<BulkUpdateFieldConfig[]>(
    isExcelUploadTab && !initialField ? [] : props.initialFieldConfigs || []
  );
  const [loadingConfigs, setLoadingConfigs] = useState(false);

  const { optionsMap, lookupMap, loadingMap, loadingMoreMap, hasMoreMap, onFocus, onLoadMore, onSearchChange } = useBindApiOptions(fieldConfigs);

  let defaultWardId = initialWardId || "";
  if (initialWardNo && wardsData?.items) {
    const ward = (wardsData.items as any[]).find((w) => w.wardNo === initialWardNo || w.label === initialWardNo);
    if (ward) {
      defaultWardId = String(ward.id || ward.value);
    }
  }

  // Initialize filter values from URL params
  const [filterValues, setFilterValues] = useState<PropertyFilterFormValues>({
    zoneId: initialZoneId || "",
    wardId: defaultWardId,
    fromPropertyNo: initialFromProperty || "",
    toPropertyNo: initialToProperty || "",
    wingId: initialWing || "",
    propertyTypeId: "",
  });

  const [resetKey, setResetKey] = useState(0);
  const [filterSubmitted, setFilterSubmitted] = useState(false);
  const [_wings, setWings] = useState<WingOption[]>([]);

  const [scopeOptions, setScopeOptions] = useState<ScopeOption[]>(
    props.initialScopeOptions || []
  );
  const [selectedScopeId, setSelectedScopeId] = useState<number | null>(() => {
    if (initialScopeId) return Number(initialScopeId);
    if (props.initialScopeOptions && props.initialScopeOptions.length > 0) {
      const fromPtis = searchParams.get("from") === "ptis";
      const defaultScope = fromPtis
        ? props.initialScopeOptions.find(o => o.id === 4 || o.name === 'PropertyRange')
        : props.initialScopeOptions[0];
      return defaultScope?.id || props.initialScopeOptions[0].id;
    }
    return null;
  });

  const activeScopeDetails = useMemo<ScopeOption | null>(() => {
    if (!selectedScopeId) return null;
    return scopeOptions.find((opt) => opt.id === selectedScopeId) || null;
  }, [selectedScopeId, scopeOptions]);

  const [loadingScopeOptions, setLoadingScopeOptions] = useState(false);

  // Initialize ward options from server-loaded data
  const [wardOptions, setWardOptions] = useState<SelectOption[]>(() => {
    const items = wardsData?.items || [];
    return items.map((ward) => ({
      label: ward.wardNo,
      value: String(ward.id),
    }));
  });
  const [zoneOptions, setZoneOptions] = useState<SelectOption[]>([]);
  const [propertyOptions, setPropertyOptions] = useState<SelectOption[]>([]);
  const [propertyTypeOptions, setPropertyTypeOptions] = useState<SelectOption[]>([]);
  // Initialize wing options from server-loaded data (no client-side loading needed)
  const allWingOptions = useMemo<SelectOption[]>(() => {
    const items = wingsData?.items || [];
    return items.map((wing) => ({
      label: wing.wingNo,
      value: String(wing.id),
    }));
  }, [wingsData]);
  const [loadingPropertyOptions, setLoadingPropertyOptions] = useState(false);
  const [propertyDropdownPage, setPropertyDropdownPage] = useState(1);
  const [propertyDropdownHasMore, setPropertyDropdownHasMore] = useState(false);
  const [loadingMorePropertyOptions, setLoadingMorePropertyOptions] = useState(false);
  const [propertySearchTerm, setPropertySearchTerm] = useState<string>(
    searchParams.get("propertySearch") || ""
  );

  // From Property options & pagination state (for Scope 3 Property Range)
  const [fromPropertyOptions, setFromPropertyOptions] = useState<SelectOption[]>([]);
  const [fromPropertyDropdownPage, setFromPropertyDropdownPage] = useState(1);
  const [fromPropertyDropdownHasMore, setFromPropertyDropdownHasMore] = useState(false);
  const [loadingFromPropertyOptions, setLoadingFromPropertyOptions] = useState(false);
  const [loadingMoreFromPropertyOptions, setLoadingMoreFromPropertyOptions] = useState(false);
  const [fromPropertySearchTerm, setFromPropertySearchTerm] = useState<string>(
    searchParams.get("fromPropertySearch") || ""
  );

  // To Property options & pagination state (for Scope 3 Property Range)
  const [toPropertyOptions, setToPropertyOptions] = useState<SelectOption[]>([]);
  const [toPropertyDropdownPage, setToPropertyDropdownPage] = useState(1);
  const [toPropertyDropdownHasMore, setToPropertyDropdownHasMore] = useState(false);
  const [loadingToPropertyOptions, setLoadingToPropertyOptions] = useState(false);
  const [loadingMoreToPropertyOptions, setLoadingMoreToPropertyOptions] = useState(false);
  const [toPropertySearchTerm, setToPropertySearchTerm] = useState<string>(
    searchParams.get("toPropertySearch") || ""
  );

  const [properties, setProperties] = useState<PropertyPreviewRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  // Initialize page/pageSize/searchTerm from URL params
  const [propertiesPage, setPropertiesPage] = useState(initialPage || 1);
  const [propertiesPageSize, setPropertiesPageSize] = useState(initialPageSize || DEFAULT_PAGE_SIZE);
  const [propertiesSearchTerm, setPropertiesSearchTerm] = useState(initialSearchTerm || "");
  const [localPropertiesSearchTerm, setLocalPropertiesSearchTerm] = useState(initialSearchTerm || "");
  const searchDebounceRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [loadingShowProperties, setLoadingShowProperties] = useState(false);

  const [selectedPropertyIds, setSelectedPropertyIds] = useState<Set<number>>(
    new Set()
  );
  const [isSelectAllAcrossPages, setIsSelectAllAcrossPages] = useState(false);
  const [excludedPropertyIds, setExcludedPropertyIds] = useState<Set<number>>(
    new Set()
  );

  const [formValues, setFormValues] = useState<
    Record<string, string | number | boolean>
  >({});
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const {
    saving,
    loadFieldConfigs,
    loadProperties,
    loadPreviewListByCategory,
    loadWings,
    loadPropertiesByWard,
    loadPropertiesByCategory,
    loadScopeOptions,
    loadAllZones,
    loadAllWards,
    handleBulkUpdate
  } = useCommonDetailsUpdateActions(t, props.actions || {});

  const { validateYearFields } = useYearValidation(t);

  const formWarnings = useMemo(() => {
    const { warnings } = validateYearFields(formValues, fieldConfigs, properties);
    return warnings;
  }, [validateYearFields, formValues, fieldConfigs, properties]);

  // Track initial load for field configs
  const initialLoadRef = useRef(false);
  // Track if initial URL params have been processed (to avoid URL sync during initial mount)
  const isInitialMountRef = useRef(true);
  // Track if initial options have been loaded from URL params
  const initialOptionsLoadedRef = useRef(false);
  // Track if initial properties have been auto-loaded
  const initialLoadPropertiesRef = useRef(false);
  const prevSelectedCodeRef = useRef(selectedCode);

  const selectedCodesRef = useRef<string[]>(selectedCodes);
  useEffect(() => {
    selectedCodesRef.current = selectedCodes;
  }, [selectedCodes]);

  const menuSelectRequestIdRef = useRef<number>(0);
  const showPropertiesRequestIdRef = useRef<number>(0);
  const reloadPropertiesDebouncedRef = useRef<NodeJS.Timeout | null>(null);
  const handleShowPropertiesRef = useRef<((targetPage?: any, targetPageSize?: any, preserveSelection?: boolean, searchTermOverride?: string, silent?: boolean) => Promise<void>) | null>(null);

  // Synchronize selected codes when URL searchParams change (e.g. Tab change or Clear params)
  // window.history.replaceState does not trigger this, so manual checkbox clicks won't be reverted.
  useEffect(() => {
    const tab = searchParams.get("tab") || "updateFields";
    if (tab === "fieldRegistry" || tab === "auditMonitor") return;

    if (tab.toLowerCase() === "excelupload") {
      const fieldParam = searchParams.get("field");
      if (!fieldParam) {
        selectedCodesRef.current = [];
        setSelectedCodes([]);
        setSelectedCode("");
        setFieldConfigs([]);
        return;
      }
      const codes = fieldParam.split(",").filter(Boolean);
      selectedCodesRef.current = codes;
      setSelectedCodes(codes);
      setSelectedCode(codes[0] || "");
      return;
    }

    const fieldParam = searchParams.get("field");
    if (!fieldParam) {
      if (activeMenuItems && activeMenuItems.length > 0 && activeMenuItems[0]?.updateCode) {
        const defaultCode = activeMenuItems[0].updateCode;
        selectedCodesRef.current = [defaultCode];
        setSelectedCodes([defaultCode]);
        setSelectedCode(defaultCode);

        // Update URL
        const params = new URLSearchParams(searchParams.toString());
        params.set("field", defaultCode);
        const newUrl = `${pathname}?${params.toString()}`;
        if (typeof window !== "undefined") {
          window.history.replaceState(null, "", newUrl);
        }

        // Fetch config
        setLoadingConfigs(true);
        loadFieldConfigs(defaultCode, (configs) => {
          setFieldConfigs(configs);
          setFormValues(prev => {
            const newValues: Record<string, string | number | boolean> = {};
            configs.forEach((f) => {
              if (prev[f.fieldName] !== undefined) {
                newValues[f.fieldName] = prev[f.fieldName];
              } else if (f.defaultValue != null) {
                newValues[f.fieldName] = f.defaultValue;
              } else if (f.controlType === "checkbox") {
                newValues[f.fieldName] = false;
              } else {
                newValues[f.fieldName] = "";
              }
            });
            return newValues;
          });
        }).finally(() => {
          setLoadingConfigs(false);
        });
      } else {
        selectedCodesRef.current = [];
        setSelectedCode("");
        setSelectedCodes([]);
      }
    } else {
      const codes = fieldParam.split(',');
      if (selectedCodesRef.current.join(',') !== fieldParam) {
        selectedCodesRef.current = codes;
        setSelectedCodes(codes);
        setSelectedCode(codes[0]);
      }
    }
  }, [searchParams, activeMenuItems, pathname, loadFieldConfigs]);

  const updateUrlParams = useCallback((updates: Record<string, string | number | undefined>) => {
    // Skip URL update during initial mount to prevent "Cannot call startTransition while rendering"
    if (isInitialMountRef.current) return;

    const params = new URLSearchParams(searchParams.toString());
    let hasChanged = false;

    Object.entries(updates).forEach(([key, value]) => {
      const currentVal = params.get(key);
      if (value !== undefined && value !== "" && value !== null) {
        const newVal = String(value);
        if (currentVal !== newVal) {
          params.set(key, newVal);
          hasChanged = true;
        }
      } else {
        if (currentVal !== null) {
          params.delete(key);
          hasChanged = true;
        }
      }
    });

    if (!hasChanged) return;

    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    startTransition(() => {
      router.replace(newUrl, { scroll: false });
    });
  }, [pathname, router, searchParams]);

  // Mark initial mount as complete after first render cycle
  useEffect(() => {
    // Use a small timeout to ensure the initial render cycle completes
    const timer = setTimeout(() => {
      isInitialMountRef.current = false;
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const prevTabRef = useRef(searchParams.get("tab"));

  // Reset state when switching away from this tab
  useEffect(() => {
    const currentTab = searchParams.get("tab");
    if (currentTab !== prevTabRef.current) {
      setFilterValues({ zoneId: "", wardId: "", fromPropertyNo: "", toPropertyNo: "", wingId: "", propertyTypeId: "" });
      setFilterSubmitted(false);
      setProperties([]);
      setTotalCount(0);
      setSelectedPropertyIds(new Set());
      setIsSelectAllAcrossPages(false);
      setPropertiesPage(1);
      setWings([]);
      setPropertyOptions([]);
      setFromPropertyOptions([]);
      setToPropertyOptions([]);

      prevTabRef.current = currentTab;
    }
  }, [searchParams]);

  useEffect(() => {
    if (props.initialScopeOptions && props.initialScopeOptions.length > 0) {
      return;
    }

    setLoadingScopeOptions(true);
    const fromPtis = searchParams.get("from") === "ptis";
    loadScopeOptions((options) => {
      setScopeOptions(options);
      if (options.length > 0) {
        const defaultScope = initialScopeId
          ? options.find(o => String(o.id) === initialScopeId)
          : fromPtis
            ? options.find(o => o.id === 4 || o.name === 'PropertyRange')
            : undefined;

        const newScopeId = defaultScope?.id || null;
        setSelectedScopeId(newScopeId);
      }
      setLoadingScopeOptions(false);
    });
  }, [loadScopeOptions, searchParams, initialScopeId, props.initialScopeOptions]);

  // Initial field selection from menuItems without forcing router.replace on page load
  useEffect(() => {
    const tab = searchParams.get("tab") || "updateFields";
    if (tab.toLowerCase() !== "updatefields") return;
    if (!selectedCode && menuItems.length > 0 && menuItems[0]?.updateCode) {
      setSelectedCode(menuItems[0].updateCode);
    }
  }, [selectedCode, menuItems, searchParams]);

  // Load dependent options (Zone / Ward / Property Type) when activeScopeDetails changes
  useEffect(() => {
    if (activeScopeDetails) {
      if (activeScopeDetails.options.includes("Zone")) {
        loadAllZones((zones) => setZoneOptions(zones));
      } else if (activeScopeDetails.options.includes("Ward")) {
        loadAllWards(undefined, (wards) => setWardOptions(wards));
      }
      if (activeScopeDetails.options.includes("Property Type")) {
        setPropertyTypeOptions([
          { label: "Residential", value: "1" },
          { label: "Commercial", value: "2" },
        ]);
      }
    }
  }, [activeScopeDetails, loadAllZones, loadAllWards]);

  // Load field configs for initial menu selection
  useEffect(() => {
    if (initialLoadRef.current) return;

    if (props.initialFieldConfigs && props.initialFieldConfigs.length > 0) {
      initialLoadRef.current = true;
      setFieldConfigs(props.initialFieldConfigs);
      const defaults: Record<string, string | number | boolean> = {};
      props.initialFieldConfigs.forEach((f) => {
        if (f.defaultValue != null) {
          defaults[f.fieldName] = f.defaultValue;
        } else if (f.controlType === "checkbox") {
          defaults[f.fieldName] = false;
        } else {
          defaults[f.fieldName] = "";
        }
      });
      setFormValues(defaults);
      return;
    }

    if (!selectedCode || !menuItems.length) return;

    initialLoadRef.current = true;

    setLoadingConfigs(true);

    loadFieldConfigs(selectedCode, (configs) => {
      setFieldConfigs(configs);
      const defaults: Record<string, string | number | boolean> = {};
      configs.forEach((f) => {
        if (f.defaultValue != null) {
          defaults[f.fieldName] = f.defaultValue;
        } else if (f.controlType === "checkbox") {
          defaults[f.fieldName] = false;
        } else {
          defaults[f.fieldName] = "";
        }
      });
      setFormValues(defaults);
    }).finally(() => {
      setLoadingConfigs(false);
    });
  }, [selectedCode, menuItems.length, loadFieldConfigs]);

  // Load property options when initialWardId is provided from URL params
  useEffect(() => {
    if (initialOptionsLoadedRef.current) return;
    if (initialWardId && selectedCode) {
      initialOptionsLoadedRef.current = true;
      const zoneIdToUse = filterValues.zoneId || initialZoneId;
      if (selectedScopeId === 2) {
        // If BuildingWise, load by category
        if (zoneIdToUse) {
          setLoadingPropertyOptions(true);
          loadPropertiesByCategory(
            2,
            Number(zoneIdToUse),
            Number(initialWardId),
            1,
            100,
            propertySearchTerm || undefined,
            undefined,
            (data: any) => {
              const { items: rawList, hasNext: hasNextPage } = extractCategoryItems(data);
              const newOptions = rawList.map((item: any) => {
                const normalizedPartitionNo = String(item.partitionNo ?? "").trim();
                const hasPartition = normalizedPartitionNo !== "" && normalizedPartitionNo !== "0";
                return {
                  label: hasPartition ? `${item.propertyNo}-${normalizedPartitionNo}` : item.propertyNo,
                  value: hasPartition ? `${item.propertyNo}-${normalizedPartitionNo}` : item.propertyNo,
                };
              });
              setPropertyOptions(newOptions);
              setPropertyDropdownPage(1);
              setPropertyDropdownHasMore(hasNextPage);
            }
          ).finally(() => {
            setLoadingPropertyOptions(false);
          });
        }
      } else if (selectedScopeId === 3) {
        // If PropertyRange, load From Property options by SearchCategory=2
        setLoadingFromPropertyOptions(true);
        loadPropertiesByCategory(
          2,
          filterValues.zoneId ? Number(filterValues.zoneId) : undefined,
          Number(initialWardId),
          1,
          100,
          fromPropertySearchTerm || undefined,
          undefined,
          (data: any) => {
            const { items: rawList, hasNext: hasNextPage } = extractCategoryItems(data);
            const newOptions = rawList.map((item: any) => {
              const normalizedPartitionNo = String(item.partitionNo ?? "").trim();
              const hasPartition = normalizedPartitionNo !== "" && normalizedPartitionNo !== "0";
              return {
                label: hasPartition ? `${item.propertyNo}-${normalizedPartitionNo}` : item.propertyNo,
                value: hasPartition ? `${item.propertyNo}-${normalizedPartitionNo}` : item.propertyNo,
              };
            });
            setFromPropertyOptions(newOptions);
            setFromPropertyDropdownPage(1);
            setFromPropertyDropdownHasMore(hasNextPage);
          }
        ).finally(() => {
          setLoadingFromPropertyOptions(false);
        });

        // If fromProperty is already selected, load To Property options by SearchCategory=4
        if (initialFromProperty) {
          setLoadingToPropertyOptions(true);
          loadPropertiesByCategory(
            4,
            filterValues.zoneId ? Number(filterValues.zoneId) : undefined,
            Number(initialWardId),
            1,
            100,
            toPropertySearchTerm || undefined,
            initialFromProperty,
            (data: any) => {
              const { items: rawList, hasNext: hasNextPage } = extractCategoryItems(data);
              const newOptions = rawList.map((item: any) => {
                const normalizedPartitionNo = String(item.partitionNo ?? "").trim();
                const hasPartition = normalizedPartitionNo !== "" && normalizedPartitionNo !== "0";
                return {
                  label: hasPartition ? `${item.propertyNo}-${normalizedPartitionNo}` : item.propertyNo,
                  value: hasPartition ? `${item.propertyNo}-${normalizedPartitionNo}` : item.propertyNo,
                };
              });
              setToPropertyOptions(newOptions);
              setToPropertyDropdownPage(1);
              setToPropertyDropdownHasMore(hasNextPage);
            }
          ).finally(() => {
            setLoadingToPropertyOptions(false);
          });
        }
      } else {

        setLoadingPropertyOptions(true);
        loadPropertiesByWard(Number(initialWardId), selectedCode, (options) => {
          setPropertyOptions(options);
        }).finally(() => {
          setLoadingPropertyOptions(false);
        });
      }
    }
  }, [initialWardId, initialFromProperty, selectedCode, selectedScopeId, filterValues.zoneId, loadPropertiesByWard, loadPropertiesByCategory, propertySearchTerm, fromPropertySearchTerm, toPropertySearchTerm]);

  // Auto-load properties when all URL params exist (on page refresh or field change)
  useEffect(() => {
    // Only auto-load once per field selection
    const isSameCode = selectedCode === prevSelectedCodeRef.current;
    if (initialLoadPropertiesRef.current && isSameCode) return;

    // Wait until activeScopeDetails is loaded to know what filters are required
    if (!activeScopeDetails) return;

    // Check if the initial URL params satisfy the scope requirements
    let urlHasEnoughParams = false;
    if (defaultWardId) {
      if (activeScopeDetails.options.includes("From Property")) {
        urlHasEnoughParams = Boolean(initialFromProperty && initialToProperty);
      } else if (activeScopeDetails.options.includes("Property No")) {
        urlHasEnoughParams = Boolean(initialFromProperty);
      } else {
        urlHasEnoughParams = true; // E.g. Ward/Sector only needs Ward
      }
    }

    if (urlHasEnoughParams) {
      initialLoadPropertiesRef.current = true;
      prevSelectedCodeRef.current = selectedCode;

      // Get the wing label from the selected wing option


      // Determine the parameters to send based on scope
      let searchCategory = 2;
      let propertyNo = undefined;
      let partitionNo = undefined;
      let propertyFrom = undefined;
      let propertyTo = undefined;

      if (activeScopeDetails.name === "Ward/Sector") {
        searchCategory = 2;
      } else if (activeScopeDetails.name === "BuildingWise") {
        searchCategory = 3;
        if (initialFromProperty) {
          const parts = initialFromProperty.split("-");
          propertyNo = parts[0];
          partitionNo = parts.length > 1 ? parts.slice(1).join("-") : undefined;
        }
      } else if (activeScopeDetails.name === "PropertyRange") {
        searchCategory = 4;
        propertyFrom = initialFromProperty || undefined;
        propertyTo = initialToProperty || undefined;
      }

      setFilterSubmitted(true);
      setLoadingProperties(true);

      const baseParams: Omit<PropertyFilterByCategoryParams, 'UpdateCode'> = {
        SearchCategory: searchCategory,
        WardId: Number(defaultWardId),
        PropertyNo: propertyNo,
        PartitionNo: partitionNo,
        PropertyFrom: propertyFrom,
        PropertyTo: propertyTo,
        PageNumber: initialPage || propertiesPage,
        PageSize: initialPageSize || propertiesPageSize,
      };

      fetchAndMergeProperties(baseParams, selectedCodes, loadPreviewListByCategory)
        .then((data) => {
          setProperties(data.items);
          setTotalCount(data.totalCount);
        })
        .finally(() => {
          setLoadingProperties(false);
        });
    } else {
      // If we don't have enough params in the URL, mark as handled so we don't auto-load when user types manually
      initialLoadPropertiesRef.current = true;
      prevSelectedCodeRef.current = selectedCode;
    }
  }, [
    initialZoneId, defaultWardId, initialFromProperty, initialToProperty, initialWing,
    allWingOptions, selectedCode, selectedCodes, loadPreviewListByCategory, activeScopeDetails,
    initialPage, initialPageSize, propertiesPage, propertiesPageSize
  ]);



  // Server-side search: when the debounced term changes, call getFieldRegistriesAction with the
  // SearchTerm so the filtering happens on the server.
  useEffect(() => {
    const term = debouncedMenuSearch.trim();

    if (!term) {
      setServerSearchResults(null);
      setSearchingMenu(false);
      return;
    }

    let cancelled = false;
    setSearchingMenu(true);

    const run = async () => {
      try {
        const fn = actions.getFieldRegistriesAction;
        if (!fn) {
          if (cancelled) return;
          setSearchingMenu(false);
          return;
        }

        const res = await fn(1, -1, undefined, term);
        if (cancelled) return;

        if (res.success && res.data) {
          const data = res.data;
          const items = 'items' in data ? (data.items ?? []) : Array.isArray(data) ? data : [];
          setServerSearchResults(items.filter((item: typeof activeMenuItems[0]) => item.isActive !== false));
        } else {
          setServerSearchResults([]);
        }
      } catch {
        if (!cancelled) setServerSearchResults([]);
      } finally {
        if (!cancelled) setSearchingMenu(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [debouncedMenuSearch, actions.getFieldRegistriesAction]);

  // filteredMenuItems: combines server search results or immediate responsive client filter
  const filteredMenuItems = useMemo(() => {
    const term = menuSearch.trim().toLowerCase();
    if (!term) return activeMenuItems;

    if (serverSearchResults !== null) {
      return serverSearchResults;
    }

    // Instant filter while server debounce/request is in flight
    return activeMenuItems.filter(
      (item) =>
        item.updateName?.toLowerCase().includes(term) ||
        item.updateNameMarathi?.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term)
    );
  }, [activeMenuItems, menuSearch, serverSearchResults]);

  // Use allWingOptions for the Wing dropdown (instead of ward-specific wings)
  const wingOptions: SelectOption[] = useMemo(
    () => allWingOptions,
    [allWingOptions]
  );

  const selectedMenuItem = useMemo(
    () => menuItems.find((m) => m.updateCode === selectedCode),
    [menuItems, selectedCode]
  );

  // Filter properties by search term
  const filteredProperties = useMemo(() => {
    if (!propertiesSearchTerm.trim()) return properties;
    const q = propertiesSearchTerm.toLowerCase();
    return properties.filter(
      (p) =>
        p.propertyNo.toLowerCase().includes(q) ||
        p.partitionNo.toLowerCase().includes(q) ||
        p.wardNo.toLowerCase().includes(q)
    );
  }, [properties, propertiesSearchTerm]);

  const pagedProperties = useMemo(
    () => properties,
    [properties]
  );

  const allSelected = useMemo(() => {
    if (totalCount === 0) return false;
    if (isSelectAllAcrossPages) {
      return excludedPropertyIds.size === 0;
    }
    return selectedPropertyIds.size === totalCount;
  }, [totalCount, isSelectAllAcrossPages, excludedPropertyIds.size, selectedPropertyIds.size]);

  const selectedCount = useMemo(() => {
    if (isSelectAllAcrossPages) {
      return Math.max(0, totalCount - excludedPropertyIds.size);
    }
    return selectedPropertyIds.size;
  }, [isSelectAllAcrossPages, totalCount, excludedPropertyIds.size, selectedPropertyIds.size]);

  const isPropertySelected = useCallback((id: number) => {
    if (isSelectAllAcrossPages) {
      return !excludedPropertyIds.has(id);
    }
    return selectedPropertyIds.has(id);
  }, [isSelectAllAcrossPages, excludedPropertyIds, selectedPropertyIds]);

  const isFormValid = useMemo(
    () =>
      fieldConfigs.every((f) => {
        if (f.controlType === "checkbox") return true;
        const val = formValues[f.fieldName];

        const isProvided = val !== undefined && val !== "" && val !== null;

        if (f.isRequired && !isProvided) {
          return false;
        }

        if (isProvided && f.validationRegex) {
          const regex = compileSafeRegex(f.validationRegex);
          if (regex && !regex.test(String(val))) {
            return false;
          }
        }

        return true;
      }),
    [fieldConfigs, formValues]
  );


  const canShowProperties = useMemo(() => {
    if (!activeScopeDetails) return false;

    // Base criteria is Ward (since the API requires it)
    if (!filterValues.wardId) return false;

    // For Property Range, we need From and To
    if (activeScopeDetails.options.includes("From Property")) {
      return Boolean(filterValues.fromPropertyNo && filterValues.toPropertyNo);
    }

    // For Building Wise, we need Property No
    if (activeScopeDetails.options.includes("Property No")) {
      return Boolean(filterValues.fromPropertyNo); // Using fromPropertyNo to store the single Property No
    }

    return true; // Other scopes like WardSector might just need Ward
  }, [filterValues, activeScopeDetails]);

  const hasAnyFilterValue = useMemo(() => {
    return Object.values(filterValues).some(v => v !== undefined && v !== null && v !== "");
  }, [filterValues]);

  const handleMenuSelect = useCallback(
    async (code: string, isMultiSelect: boolean = false) => {
      const currentCodes = selectedCodesRef.current;

      // Prevent unchecking the last selected group (in both single and multi-select modes)
      if (currentCodes.length === 1 && currentCodes[0] === code) {
        return;
      }

      let newCodes: string[];

      if (isMultiSelect) {
        if (currentCodes.includes(code)) {
          newCodes = currentCodes.filter(c => c !== code);
        } else {
          newCodes = [...currentCodes, code];
        }
      } else {
        newCodes = [code];
      }

      selectedCodesRef.current = newCodes;
      setSelectedCodes(newCodes);

      // Update URL without triggering router transition race conditions
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (newCodes.length > 0) {
          setSelectedCode(newCodes[0]);
          params.set("field", newCodes.join(","));
        } else {
          setSelectedCode("");
          params.delete("field");
        }
        const newUrl = `${pathname}?${params.toString()}`;
        window.history.replaceState(null, "", newUrl);
      }

      // Debounce both field config loading AND table data loading so they complete at the same time
      if (reloadPropertiesDebouncedRef.current) {
        clearTimeout(reloadPropertiesDebouncedRef.current);
      }

      reloadPropertiesDebouncedRef.current = setTimeout(async () => {
        const targetCodes = selectedCodesRef.current;
        if (!targetCodes.length) return;

        const requestId = ++menuSelectRequestIdRef.current;
        setLoadingConfigs(true);

        const configPromises = targetCodes.map(c =>
          new Promise<BulkUpdateFieldConfig[]>((resolve) => {
            loadFieldConfigs(c, resolve);
          })
        );

        // Fetch configs and reload table data at the exact same time
        const [configResults] = await Promise.all([
          Promise.all(configPromises),
          (filterSubmitted || properties.length > 0) && canShowProperties
            ? handleShowPropertiesRef.current?.(propertiesPage, propertiesPageSize, true, undefined, true)
            : Promise.resolve()
        ]);

        if (requestId !== menuSelectRequestIdRef.current) {
          return;
        }

        // Combine all field configs
        const rawCombinedConfigs = configResults.flat();
        const uniqueConfigs: BulkUpdateFieldConfig[] = [];
        const seenFields = new Set<string>();
        for (const config of rawCombinedConfigs) {
          if (!seenFields.has(config.fieldName)) {
            seenFields.add(config.fieldName);
            uniqueConfigs.push(config);
          }
        }

        setFieldConfigs(uniqueConfigs);

        // Build default form values and merge with existing values so users don't lose typed data
        setFormValues(prev => {
          const newValues: Record<string, string | number | boolean> = {};
          uniqueConfigs.forEach((f) => {
            if (prev[f.fieldName] !== undefined) {
              newValues[f.fieldName] = prev[f.fieldName];
            } else if (f.defaultValue != null) {
              newValues[f.fieldName] = f.defaultValue;
            } else if (f.controlType === "checkbox") {
              newValues[f.fieldName] = false;
            } else {
              newValues[f.fieldName] = "";
            }
          });
          return newValues;
        });

        setLoadingConfigs(false);
      }, 350);
    },
    [loadFieldConfigs, pathname, filterSubmitted, properties.length, canShowProperties, propertiesPage, propertiesPageSize]
  );

  const loadPropertyOptionsByCategory = useCallback(async (page: number, append = false, queryOverride?: string, zoneIdOverride?: string, wardIdOverride?: string) => {
    const zoneIdToUse = zoneIdOverride !== undefined ? zoneIdOverride : filterValues.zoneId;
    const wardIdToUse = wardIdOverride !== undefined ? wardIdOverride : filterValues.wardId;
    if (!zoneIdToUse || !wardIdToUse) return;

    if (page === 1) {
      setLoadingPropertyOptions(true);
    } else {
      setLoadingMorePropertyOptions(true);
    }

    const searchTermToUse = queryOverride !== undefined ? queryOverride : propertySearchTerm;

    await loadPropertiesByCategory(
      2, // SearchCategory=2 for BuildingWise
      Number(zoneIdToUse),
      Number(wardIdToUse),
      page,
      100,
      searchTermToUse || undefined,
      undefined,
      (data: any) => {
        const { items: rawList, hasNext: hasNextPage } = extractCategoryItems(data);
        const newOptions = rawList.map((item: any) => {
          const normalizedPartitionNo = String(item.partitionNo ?? "").trim();
          const hasPartition = normalizedPartitionNo !== "" && normalizedPartitionNo !== "0";
          return {
            label: hasPartition ? `${item.propertyNo} - ${normalizedPartitionNo}` : item.propertyNo,
            value: hasPartition ? `${item.propertyNo}-${normalizedPartitionNo}` : item.propertyNo,
          };
        });

        setPropertyOptions((prev) => {
          if (append) {
            const existingValues = new Set(prev.map((o: SelectOption) => o.value));
            const filteredNew = newOptions.filter((o: SelectOption) => !existingValues.has(o.value));
            return [...prev, ...filteredNew];
          }
          return newOptions;
        });

        setPropertyDropdownPage(page);
        setPropertyDropdownHasMore(hasNextPage);

      }
    ).finally(() => {
      setLoadingPropertyOptions(false);
      setLoadingMorePropertyOptions(false);
    });
  }, [filterValues.zoneId, filterValues.wardId, loadPropertiesByCategory, updateUrlParams, propertySearchTerm, filterSubmitted]);

  const loadFromPropertyOptions = useCallback(async (page: number, append = false, queryOverride?: string, wardIdOverride?: string, zoneIdOverride?: string) => {
    const wardIdToUse = wardIdOverride !== undefined ? wardIdOverride : filterValues.wardId;
    const zoneIdToUse = zoneIdOverride !== undefined ? zoneIdOverride : filterValues.zoneId;
    if (!wardIdToUse) return;

    if (page === 1) {
      setLoadingFromPropertyOptions(true);
    } else {
      setLoadingMoreFromPropertyOptions(true);
    }

    const searchTermToUse = queryOverride !== undefined ? queryOverride : fromPropertySearchTerm;

    await loadPropertiesByCategory(
      2, // SearchCategory=2 for Ward selection
      zoneIdToUse ? Number(zoneIdToUse) : undefined,
      Number(wardIdToUse),
      page,
      100, // PageSize=100
      searchTermToUse || undefined,
      undefined,
      (data: any) => {
        const { items: rawList, hasNext: hasNextPage } = extractCategoryItems(data);
        const newOptions = rawList.map((item: any) => {
          const normalizedPartitionNo = String(item.partitionNo ?? "").trim();
          const hasPartition = normalizedPartitionNo !== "" && normalizedPartitionNo !== "0";
          return {
            label: hasPartition ? `${item.propertyNo}-${normalizedPartitionNo}` : item.propertyNo,
            value: hasPartition ? `${item.propertyNo}-${normalizedPartitionNo}` : item.propertyNo,
          };
        });

        setFromPropertyOptions((prev) => {
          if (append) {
            const existingValues = new Set(prev.map((o: SelectOption) => o.value));
            const filteredNew = newOptions.filter((o: SelectOption) => !existingValues.has(o.value));
            return [...prev, ...filteredNew];
          }
          return newOptions;
        });

        setToPropertyOptions((prev) => {
          if (append) {
            const existingValues = new Set(prev.map((o: SelectOption) => o.value));
            const filteredNew = newOptions.filter((o: SelectOption) => !existingValues.has(o.value));
            return [...prev, ...filteredNew];
          }
          return newOptions;
        });

        setFromPropertyDropdownPage(page);
        setFromPropertyDropdownHasMore(hasNextPage);
        setToPropertyDropdownPage(page);
        setToPropertyDropdownHasMore(hasNextPage);

      }
    ).finally(() => {
      setLoadingFromPropertyOptions(false);
      setLoadingMoreFromPropertyOptions(false);
    });
  }, [filterValues.wardId, filterValues.zoneId, loadPropertiesByCategory, updateUrlParams, fromPropertySearchTerm, filterSubmitted]);

  const loadToPropertyOptions = useCallback(async (page: number, append = false, queryOverride?: string, fromPropertyOverride?: string) => {
    const fromPropertyToUse = fromPropertyOverride !== undefined ? fromPropertyOverride : filterValues.fromPropertyNo;
    if (!filterValues.wardId || !fromPropertyToUse) return;

    if (page === 1) {
      setLoadingToPropertyOptions(true);
    } else {
      setLoadingMoreToPropertyOptions(true);
    }

    const searchTermToUse = queryOverride !== undefined ? queryOverride : toPropertySearchTerm;

    await loadPropertiesByCategory(
      4,
      filterValues.zoneId ? Number(filterValues.zoneId) : undefined,
      Number(filterValues.wardId),
      page,
      100,
      searchTermToUse || undefined,
      fromPropertyToUse,
      (data: any) => {
        const { items: rawList, hasNext: hasNextPage } = extractCategoryItems(data);
        const newOptions = rawList.map((item: any) => {
          const normalizedPartitionNo = String(item.partitionNo ?? "").trim();
          const hasPartition = normalizedPartitionNo !== "" && normalizedPartitionNo !== "0";
          return {
            label: hasPartition ? `${item.propertyNo}-${normalizedPartitionNo}` : item.propertyNo,
            value: hasPartition ? `${item.propertyNo}-${normalizedPartitionNo}` : item.propertyNo,
          };
        });

        setToPropertyOptions((prev) => {
          if (append) {
            const existingValues = new Set(prev.map((o: SelectOption) => o.value));
            const filteredNew = newOptions.filter((o: SelectOption) => !existingValues.has(o.value));
            return [...prev, ...filteredNew];
          }
          return newOptions;
        });

        setToPropertyDropdownPage(page);
        setToPropertyDropdownHasMore(hasNextPage);

      }
    ).finally(() => {
      setLoadingToPropertyOptions(false);
      setLoadingMoreToPropertyOptions(false);
    });
  }, [filterValues.wardId, filterValues.zoneId, filterValues.fromPropertyNo, loadPropertiesByCategory, updateUrlParams, toPropertySearchTerm, filterSubmitted]);

  const handleWardChange = useCallback(
    async (wardId: string) => {
      // Reset dependent fields when ward changes
      setFilterValues((prev) => ({
        ...prev,
        wardId,
        fromPropertyNo: "",
        toPropertyNo: "",
        wingId: ""
      }));
      setFilterSubmitted(false);
      setProperties([]);
      setTotalCount(0);
      setSelectedPropertyIds(new Set());
      setIsSelectAllAcrossPages(false);
      setPropertiesPage(1);

      setPropertyOptions([]);
      setWings([]);
      setPropertyDropdownPage(1);
      setPropertyDropdownHasMore(false);
      setPropertySearchTerm("");
      setFromPropertySearchTerm("");
      setToPropertySearchTerm("");

      // Sync to URL
      updateUrlParams({
        scopeId: selectedScopeId ?? undefined,
        wardId,
        fromProperty: undefined,
        PropertyNo: undefined,
        toProperty: undefined,
        wing: undefined,
        pageNumber: undefined,
        pageSize: undefined,
      });

      if (wardId) {
        if (selectedScopeId === 2) {
          setPropertyOptions([]);
          setPropertyDropdownPage(1);
          // Automatically load Property options with SearchCategory=2 for BuildingWise
          loadPropertyOptionsByCategory(1, false, undefined, filterValues.zoneId, wardId);
        } else if (selectedScopeId === 3) {
          setFromPropertyOptions([]);
          setToPropertyOptions([]);
          setFromPropertyDropdownPage(1);
          setToPropertyDropdownPage(1);
          // Automatically load From Property options with SearchCategory=2
          loadFromPropertyOptions(1, false, undefined, wardId, filterValues.zoneId);
        }
        if (selectedCode) {
          await loadWings(Number(wardId), setWings);
        }
      }
    },
    [loadWings, selectedCode, updateUrlParams, propertiesPage, propertiesPageSize, filterValues.zoneId, selectedScopeId, loadPropertyOptionsByCategory, loadFromPropertyOptions, filterSubmitted]
  );

  const handleZoneChange = useCallback((zoneId: string) => {
    setFilterValues((prev) => ({
      ...prev,
      zoneId,
      wardId: "",
      fromPropertyNo: "",
      toPropertyNo: "",
    }));

    setFilterSubmitted(false);
    setProperties([]);
    setTotalCount(0);
    setSelectedPropertyIds(new Set());
    setIsSelectAllAcrossPages(false);
    setPropertiesPage(1);

    // Sync to URL
    updateUrlParams({
      scopeId: selectedScopeId ?? undefined,
      zoneId: zoneId || undefined,
      wardId: undefined,
      fromProperty: undefined,
      PropertyNo: undefined,
      toProperty: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    });

    setPropertyOptions([]);
    // Reset pagination state for dropdown
    setPropertyDropdownPage(1);
    setPropertyDropdownHasMore(false);
    setPropertySearchTerm("");
    setFromPropertySearchTerm("");
    setToPropertySearchTerm("");

    // Load wards for this zone
    if (zoneId) {
      loadAllWards(Number(zoneId), (wards) => setWardOptions(wards));
    } else {
      loadAllWards(undefined, (wards) => setWardOptions(wards));
    }
  }, [updateUrlParams, loadAllWards]);

  const handleScopeChange = useCallback((scopeId: number) => {
    setSelectedScopeId(scopeId);

    // Reset filters when scope changes
    setFilterValues({
      zoneId: "",
      wardId: "",
      fromPropertyNo: "",
      toPropertyNo: "",
      wingId: "",
      propertyTypeId: "",
    });
    setFilterSubmitted(false);
    setProperties([]);
    setTotalCount(0);
    setSelectedPropertyIds(new Set());
    setIsSelectAllAcrossPages(false);
    setPropertiesPage(1);

    setPropertyOptions([]);
    // Reset pagination state for dropdown
    setPropertyDropdownPage(1);
    setPropertyDropdownHasMore(false);
    setPropertySearchTerm("");
    setFromPropertySearchTerm("");
    setToPropertySearchTerm("");

    updateUrlParams({
      scopeId,
      zoneId: undefined,
      wardId: undefined,
      fromProperty: undefined,
      PropertyNo: undefined,
      toProperty: undefined,
      wing: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    });
  }, [updateUrlParams]);



  const handlePropertyDropdownFocus = useCallback(async () => {
    if (!filterValues.wardId) return;

    if (activeScopeDetails?.name === "BuildingWise") {
      if (propertyOptions.length > 0) return;
      await loadPropertyOptionsByCategory(1, false, undefined, filterValues.zoneId, filterValues.wardId);
    } else if (activeScopeDetails?.name === "PropertyRange") {
      if (fromPropertyOptions.length === 0) {
        await loadFromPropertyOptions(1, false, undefined, filterValues.wardId, filterValues.zoneId);
      }
    } else {
      if (propertyOptions.length > 0 || !selectedCode) return;
      setLoadingPropertyOptions(true);
      await loadPropertiesByWard(Number(filterValues.wardId), selectedCode, (options) => {
        setPropertyOptions(options);
      }).finally(() => {
        setLoadingPropertyOptions(false);
      });
    }
  }, [filterValues.wardId, filterValues.fromPropertyNo, selectedCode, propertyOptions.length, fromPropertyOptions.length, toPropertyOptions.length, loadPropertiesByWard, activeScopeDetails, loadPropertyOptionsByCategory, loadFromPropertyOptions, loadToPropertyOptions]);

  const handleLoadMorePropertyOptions = useCallback(async (searchQuery?: string) => {
    if (activeScopeDetails?.name === "BuildingWise" && propertyDropdownHasMore && !loadingMorePropertyOptions) {
      const q = typeof searchQuery === "string" ? searchQuery : propertySearchTerm;
      await loadPropertyOptionsByCategory(propertyDropdownPage + 1, true, q);
    }
  }, [activeScopeDetails, propertyDropdownHasMore, loadingMorePropertyOptions, propertyDropdownPage, loadPropertyOptionsByCategory, propertySearchTerm]);

  const handleLoadMoreFromPropertyOptions = useCallback(async (searchQuery?: string) => {
    if (activeScopeDetails?.name === "PropertyRange" && fromPropertyDropdownHasMore && !loadingMoreFromPropertyOptions) {
      const q = typeof searchQuery === "string" ? searchQuery : fromPropertySearchTerm;
      await loadFromPropertyOptions(fromPropertyDropdownPage + 1, true, q);
    }
  }, [activeScopeDetails, fromPropertyDropdownHasMore, loadingMoreFromPropertyOptions, fromPropertyDropdownPage, loadFromPropertyOptions, fromPropertySearchTerm]);

  const handleLoadMoreToPropertyOptions = useCallback(async (searchQuery?: string) => {
    if (activeScopeDetails?.name === "PropertyRange" && toPropertyDropdownHasMore && !loadingMoreToPropertyOptions) {
      const q = typeof searchQuery === "string" ? searchQuery : toPropertySearchTerm;
      await loadToPropertyOptions(toPropertyDropdownPage + 1, true, q);
    }
  }, [activeScopeDetails, toPropertyDropdownHasMore, loadingMoreToPropertyOptions, toPropertyDropdownPage, loadToPropertyOptions, toPropertySearchTerm]);

  const handleFromPropertyChange = useCallback((val: string) => {
    setFilterValues((prev) => ({ ...prev, fromPropertyNo: val, toPropertyNo: "" }));
    setToPropertySearchTerm("");

    const isSinglePropertyScope = activeScopeDetails?.options.includes("Property No");

    updateUrlParams({
      fromProperty: !isSinglePropertyScope ? (val || undefined) : undefined,
      PropertyNo: isSinglePropertyScope ? (val || undefined) : undefined,
      toProperty: undefined,
      pageNumber: filterSubmitted && totalCount > 0 ? propertiesPage : undefined,
      pageSize: filterSubmitted && totalCount > 0 ? propertiesPageSize : undefined,
    });
  }, [updateUrlParams, filterSubmitted, propertiesPage, propertiesPageSize, totalCount, activeScopeDetails]);

  const handleToPropertyChange = useCallback((val: string) => {
    setFilterValues((prev) => ({ ...prev, toPropertyNo: val }));

    updateUrlParams({
      toProperty: val || undefined,
      pageNumber: filterSubmitted && totalCount > 0 ? propertiesPage : undefined,
      pageSize: filterSubmitted && totalCount > 0 ? propertiesPageSize : undefined,
    });
  }, [updateUrlParams, toPropertyDropdownPage, filterSubmitted, propertiesPage, propertiesPageSize]);

  const handlePropertyDropdownSearch = useCallback((searchTerm: string) => {
    setPropertySearchTerm(searchTerm);
    setPropertyDropdownPage(1);



    if (activeScopeDetails?.name === "BuildingWise" && filterValues.wardId && filterValues.zoneId) {
      loadPropertyOptionsByCategory(1, false, searchTerm);
    }
  }, [updateUrlParams, activeScopeDetails, filterValues.wardId, filterValues.zoneId, loadPropertyOptionsByCategory]);

  const handleFromPropertyDropdownSearch = useCallback((searchTerm: string) => {
    setFromPropertySearchTerm(searchTerm);
    setFromPropertyDropdownPage(1);



    if (activeScopeDetails?.name === "PropertyRange" && filterValues.wardId) {
      loadFromPropertyOptions(1, false, searchTerm);
    }
  }, [updateUrlParams, activeScopeDetails, filterValues.wardId, loadFromPropertyOptions]);

  const handleToPropertyDropdownSearch = useCallback((searchTerm: string) => {
    setToPropertySearchTerm(searchTerm);
    setToPropertyDropdownPage(1);



    if (activeScopeDetails?.name === "PropertyRange" && filterValues.wardId && filterValues.fromPropertyNo) {
      loadToPropertyOptions(1, false, searchTerm);
    }
  }, [updateUrlParams, activeScopeDetails, filterValues.wardId, filterValues.fromPropertyNo, loadToPropertyOptions]);

  const handleShowProperties = useCallback(async (targetPage: any = 1, targetPageSize: any = propertiesPageSize, preserveSelection: boolean = false, searchTermOverride?: string, silent: boolean = false) => {
    const pageNum = typeof targetPage === "number" ? targetPage : 1;
    const sizeNum = typeof targetPageSize === "number" ? targetPageSize : propertiesPageSize;
    const activeSearchTerm = searchTermOverride !== undefined ? searchTermOverride : propertiesSearchTerm;

    setFilterSubmitted(true);
    if (!canShowProperties) return;

    if (selectedCodes.length === 0) {
      toast.info(t("messages.pleaseSelectField"));
      return;
    }

    setLoadingProperties(true);
    if (!preserveSelection) {
      setLoadingShowProperties(true);
      setSelectedPropertyIds(new Set());
      setIsSelectAllAcrossPages(false);
    }



    let searchCategory = 2; // Default to Ward/Sector
    let propertyNo = undefined;
    let partitionNo = undefined;
    let propertyFrom = undefined;
    let propertyTo = undefined;

    if (activeScopeDetails?.name === "Ward/Sector" || activeScopeDetails?.name === "WardSector") {
      searchCategory = 2;
    } else if (activeScopeDetails?.name === "BuildingWise") {
      searchCategory = 3;
      if (filterValues.fromPropertyNo) {
        const parts = filterValues.fromPropertyNo.split("-");
        propertyNo = parts[0];
        partitionNo = parts.length > 1 ? parts.slice(1).join("-") : undefined;
      }
    } else if (activeScopeDetails?.name === "PropertyRange") {
      searchCategory = 4;
      propertyFrom = filterValues.fromPropertyNo;
      propertyTo = filterValues.toPropertyNo;
    }

    const baseParams: Omit<PropertyFilterByCategoryParams, 'UpdateCode'> = {
      SearchTerm: activeSearchTerm || undefined,
      SearchCategory: searchCategory,
      WardId: Number(filterValues.wardId),
      PropertyNo: propertyNo,
      PartitionNo: partitionNo,
      PropertyFrom: propertyFrom,
      PropertyTo: propertyTo,
      PageNumber: pageNum,
      PageSize: sizeNum,
    };

    const reqId = ++showPropertiesRequestIdRef.current;
    const currentCodes = selectedCodesRef.current.length > 0 ? selectedCodesRef.current : selectedCodes;
    fetchAndMergeProperties(baseParams, currentCodes, loadPreviewListByCategory)
      .then((data) => {
        if (reqId !== showPropertiesRequestIdRef.current) return;
        setProperties(data.items);
        setTotalCount(data.totalCount);
        setPropertiesPage(pageNum);
        // Show success toast with count or info toast when no properties found
        if (!preserveSelection && !silent) {
          if (data.totalCount > 0) {
            toast.success(t("messages.propertiesLoaded", { count: data.totalCount }));
          } else {
            toast.error(t("messages.noPropertiesFound"));
          }
        }
        // Sync filter values to URL after successfully loading properties
        updateUrlParams({
          zoneId: filterValues.zoneId || undefined,
          wardId: filterValues.wardId || undefined,
          fromProperty: !activeScopeDetails?.options.includes("Property No") ? (filterValues.fromPropertyNo || undefined) : undefined,
          PropertyNo: activeScopeDetails?.options.includes("Property No") ? (filterValues.fromPropertyNo || undefined) : undefined,
          toProperty: filterValues.toPropertyNo || undefined,
          wing: filterValues.wingId || undefined,
          pageNumber: data.totalCount > 0 ? pageNum : undefined,
          pageSize: data.totalCount > 0 ? sizeNum : undefined,
        });
      })
      .finally(() => {
        if (reqId === showPropertiesRequestIdRef.current) {
          setLoadingProperties(false);
          setLoadingShowProperties(false);
        }
      });
  }, [filterValues, loadPreviewListByCategory, canShowProperties, t, updateUrlParams, activeScopeDetails, propertiesPageSize, propertiesSearchTerm]);

  useEffect(() => {
    handleShowPropertiesRef.current = handleShowProperties;
  }, [handleShowProperties]);

  const handleBack = useCallback((showToast: boolean = true) => {
    setFilterValues({ zoneId: "", wardId: "", fromPropertyNo: "", toPropertyNo: "", wingId: "", propertyTypeId: "" });
    setFilterSubmitted(false);
    setProperties([]);
    setTotalCount(0);
    setSelectedPropertyIds(new Set());
    setIsSelectAllAcrossPages(false);
    setExcludedPropertyIds(new Set());
    setPropertiesPage(1);
    setWings([]);
    setPropertyOptions([]);
    setFromPropertyOptions([]);
    setToPropertyOptions([]);
    setPropertySearchTerm("");
    setFromPropertySearchTerm("");
    setToPropertySearchTerm("");
    setSelectedCode("");
    setSelectedCodes([]);
    setLoadingProperties(false);
    setLoadingShowProperties(false);

    if (showToast) {
      toast.success(t("messages.clearedSuccessfully"));
    }

    setResetKey(prev => prev + 1);

    // Clear URL parameters while preserving current tab
    startTransition(() => {
      const currentTab = searchParams.get("tab");
      if (currentTab) {
        router.replace(`${pathname}?tab=${currentTab}`, { scroll: false });
      } else {
        router.replace(pathname, { scroll: false });
      }
    });
  }, [pathname, router, t, searchParams, toast]);

  const handleSelectAll = useCallback(() => {
    if (allSelected || isSelectAllAcrossPages) {
      setIsSelectAllAcrossPages(false);
      setExcludedPropertyIds(new Set());
      setSelectedPropertyIds(new Set());
    } else {
      setIsSelectAllAcrossPages(true);
      setExcludedPropertyIds(new Set());
      setSelectedPropertyIds(new Set());
    }
  }, [allSelected, isSelectAllAcrossPages]);

  const handlePropertySelect = useCallback((id: number, checked: boolean) => {
    if (isSelectAllAcrossPages) {
      setExcludedPropertyIds((prev) => {
        const next = new Set(prev);
        if (!checked) {
          next.add(id);
        } else {
          next.delete(id);
        }
        return next;
      });
    } else {
      setSelectedPropertyIds((prev) => {
        const next = new Set(prev);
        if (checked) {
          next.add(id);
        } else {
          next.delete(id);
        }
        return next;
      });
    }
  }, [isSelectAllAcrossPages]);

  const handlePropertiesPageSizeChange = useCallback((newSize: number) => {
    setPropertiesPageSize(newSize);
    setPropertiesPage(1); // Reset to first page when changing page size
    if (filterSubmitted) {
      handleShowProperties(1, newSize, true);
    } else {
      updateUrlParams({ pageSize: newSize, pageNumber: 1 });
    }
  }, [updateUrlParams, filterSubmitted, handleShowProperties]);

  const handlePropertiesSearch = useCallback((searchTerm: string) => {
    setLocalPropertiesSearchTerm(searchTerm);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      setPropertiesSearchTerm(searchTerm);
      setPropertiesPage(1); // Reset to first page when searching
      if (filterSubmitted) {
        handleShowProperties(1, propertiesPageSize, true, searchTerm);
      }
      // Sync to URL
      updateUrlParams({ q: searchTerm || undefined, pageNumber: 1 });
    }, 500);
  }, [updateUrlParams, filterSubmitted, handleShowProperties, propertiesPageSize]);

  const handlePageChange = useCallback((page: number) => {
    setPropertiesPage(page);
    if (filterSubmitted) {
      handleShowProperties(page, propertiesPageSize, true);
    } else {
      updateUrlParams({ pageNumber: page });
    }
  }, [updateUrlParams, filterSubmitted, handleShowProperties, propertiesPageSize]);

  const parseServerErrorMessages = useCallback((
    rawErrors: string[],
    items: Array<{ updateCode?: string; errors?: string[] }> = [],
    configs: BulkUpdateFieldConfig[] = []
  ): Record<string, string> => {
    const errorsMap: Record<string, string> = {};

    const allErrStrings: string[] = [...(rawErrors || [])];
    if (Array.isArray(items)) {
      items.forEach((item) => {
        if (Array.isArray(item.errors)) {
          allErrStrings.push(...item.errors);
        }
      });
    }

    allErrStrings.forEach((errStr) => {
      if (!errStr) return;
      const cleanStr = String(errStr).replace(/^\[[^\]]+\]\s*/, "").trim();
      const statements = cleanStr.split(";");

      statements.forEach((stmt) => {
        const trimmedStmt = stmt.trim();
        if (!trimmedStmt) return;

        configs.forEach((config) => {
          const dName = config.displayName?.toLowerCase();
          const fName = config.fieldName?.toLowerCase();
          const dNameMr = config.displayNameMarathi?.toLowerCase();
          const stmtLower = trimmedStmt.toLowerCase();

          if (
            (dName && stmtLower.includes(dName)) ||
            (fName && stmtLower.includes(fName)) ||
            (dNameMr && stmtLower.includes(dNameMr))
          ) {
            errorsMap[config.fieldName] = trimmedStmt;
          }
        });
      });
    });

    return errorsMap;
  }, []);

  const handleFormValueChange = useCallback(
    (fieldName: string, value: string | number | boolean) => {
      setFormValues((prev) => ({ ...prev, [fieldName]: value }));
      setFormErrors((prev) => {
        if (!prev[fieldName]) return prev;
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    },
    []
  );

  const handleFormClear = useCallback(() => {
    const defaults: Record<string, string | number | boolean> = {};
    fieldConfigs.forEach((f) => {
      defaults[f.fieldName] = f.controlType === "checkbox" ? false : "";
    });
    setFormValues(defaults);
    setFormSubmitted(false);
    setFormErrors({});
  }, [fieldConfigs]);

  const handleSubmitBulkUpdate = useCallback(async () => {
    setFormSubmitted(true);
    setFormErrors({});

    const clientErrors: Record<string, string> = {};
    fieldConfigs.forEach((f) => {
      if (f.controlType === "checkbox") return;
      const val = formValues[f.fieldName];
      const isProvided = val !== undefined && val !== "" && val !== null;
      if (isProvided && f.validationRegex) {
        const regex = compileSafeRegex(f.validationRegex);
        if (regex && !regex.test(String(val))) {
          clientErrors[f.fieldName] = `${f.displayName || f.fieldName} has invalid format.`;
        }
      }
    });

    // Custom Year Validation (AssessmentYear >= ConstructionYear rule, 4-digit regex, current year limit)
    const { errors: yearErrors } = validateYearFields(formValues, fieldConfigs, properties);
    Object.assign(clientErrors, yearErrors);

    const remarksVal = String(formValues["remarks"] || "").trim();
    if (!remarksVal) {
      clientErrors["remarks"] = t("messages.remarksRequired") || "Remarks is required";
    }

    if (Object.keys(clientErrors).length > 0) {
      setFormErrors(clientErrors);
      if (!remarksVal) {
        toast.error(t("messages.remarksRequired") || "Remarks is required");
      }
      return;
    }

    if (!isFormValid || !selectedMenuItem || selectedCodes.length === 0) return;

    // Pre-check: Ensure at least one field has a non-empty value in formValues BEFORE triggering any API calls
    const hasAnyValue = fieldConfigs.some((f) => {
      const val = formValues[f.fieldName];
      if (f.controlType === "checkbox") {
        return val !== undefined && val !== null;
      }
      return val !== undefined && val !== "" && val !== null;
    });

    if (!hasAnyValue) {
      toast.error(t("messages.noDataToUpdate"));
      return;
    }

    let idsToUpdate: number[] = [];

    // If 'selectAllAcrossPages' is true, we must load ALL property IDs based on the current filter criteria
    if (isSelectAllAcrossPages) {
      toast.info(t("messages.fetchingAllProperties"));

      let wingLabel = "";
      if (filterValues.wingId && allWingOptions) {
        const wingOpt = allWingOptions.find(w => w.value === filterValues.wingId);
        if (wingOpt) {
          wingLabel = wingOpt.label;
        }
      }

      let fromNo = "";
      let toNo = "";
      if (activeScopeDetails?.name === "PropertyRange") {
        const fromParts = filterValues.fromPropertyNo.split("-");
        const toParts = filterValues.toPropertyNo.split("-");
        fromNo = fromParts[0] || "";
        toNo = toParts[0] || "";
      } else if (activeScopeDetails?.name === "BuildingWise") {
        const parts = filterValues.fromPropertyNo.split("-");
        fromNo = parts[0] || "";
        toNo = fromNo;
      }

      try {
        await new Promise<void>((resolve, reject) => {
          // Actually, we must use the server action directly to get all IDs
          if (!actions.getFilteredPropertiesAction) {
            reject(new Error("No action available"));
            return;
          }

          actions.getFilteredPropertiesAction({
            scopeId: selectedScopeId || 0,
            zoneId: filterValues.zoneId || undefined,
            wardId: filterValues.wardId,
            fromPropertyNo: fromNo,
            toPropertyNo: toNo,
            wingId: wingLabel || undefined,
            propertyTypeId: filterValues.propertyTypeId || undefined,
            updateCode: selectedCode,
            page: 1,
            pageSize: -1,
          })
            .then(res => {
              if (res.success && res.data && res.data.items) {
                idsToUpdate = res.data.items
                  .map((p: { id: number }) => p.id)
                  .filter((id: number) => !excludedPropertyIds.has(id));
                resolve();
              } else {
                reject(new Error("Failed to load properties"));
              }
            })
            .catch(reject);
        });
      } catch (_error) {
        toast.error(t("messages.somethingWrong"));
        return; // abort update if we can't fetch all IDs
      }
    } else {
      idsToUpdate = selectedPropertyIds.size > 0
        ? Array.from(selectedPropertyIds)
        : properties.map((p) => p.id);
    }

    if (idsToUpdate.length === 0) return;

    // First prepare all payloads to capture the current state of formValues
    const payloadsToUpdate = selectedCodes.map(code => {
      const menuItem = menuItems?.find(m => m.updateCode === code) || selectedMenuItem;
      const apiRoute = menuItem?.apiRoute || "/CommonDetails/update";

      const relevantConfigs = fieldConfigs.filter(f => f.bulkUpdateMasterId === menuItem?.id);
      const filteredUpdateData: Record<string, string | number | boolean> = {};

      if (relevantConfigs.length > 0) {
        relevantConfigs.forEach(f => {
          if (formValues[f.fieldName] !== undefined) {
            filteredUpdateData[f.fieldName] = formValues[f.fieldName];
          }
        });
      }

      // Also merge any other non-empty formValues from active fieldConfigs to provide full field context for cross-field validations (e.g. ConstructionYear + AssessmentYear together)
      fieldConfigs.forEach(f => {
        const val = formValues[f.fieldName];
        if (val !== undefined && val !== "" && val !== null) {
          if (filteredUpdateData[f.fieldName] === undefined) {
            filteredUpdateData[f.fieldName] = val;
          }
        }
      });

      const updateDataToSend = Object.keys(filteredUpdateData).length > 0 ? filteredUpdateData : formValues;

      return { apiRoute, code, updateDataToSend };
    });

    let hasSuccess = false;

    // Prepare the array of payloads to send in a single API call
    const payloadsToSend = payloadsToUpdate
      .filter(payload => {
        // Only send payloads that have at least one non-empty value
        return Object.values(payload.updateDataToSend).some(
          v => v !== "" && v !== null && v !== undefined
        );
      })
      .map(payload => ({
        updateCode: payload.code,
        propertyIds: idsToUpdate,
        updateData: payload.updateDataToSend,
        remarks: formValues["remarks"] ? String(formValues["remarks"]) : undefined
      }));

    if (payloadsToSend.length === 0) {
      toast.error(t("messages.noDataToUpdate"));
      return;
    }

    const apiRoute = payloadsToUpdate[0]?.apiRoute || "/CommonDetails/update";

    const serverResponse = await handleBulkUpdate(
      apiRoute,
      payloadsToSend,
      async () => {
        hasSuccess = true;
      }
    );

    if (serverResponse) {
      const itemsArr = Array.isArray(serverResponse.items)
        ? serverResponse.items
        : serverResponse.items
          ? [serverResponse.items]
          : [];
      const serverErrorsMap = parseServerErrorMessages(
        serverResponse.errors || [],
        itemsArr,
        fieldConfigs
      );
      if (Object.keys(serverErrorsMap).length > 0) {
        setFormErrors(serverErrorsMap);
      }
    }

    if (hasSuccess) {
      handleFormClear();
      setSelectedPropertyIds(new Set());
      setIsSelectAllAcrossPages(false);
      // After successful update, refresh the properties list to show updated data without redundant loaded toast
      await handleShowProperties(propertiesPage, propertiesPageSize, false, undefined, true);
    }
  }, [
    isFormValid,
    selectedMenuItem,
    selectedPropertyIds,
    properties,
    selectedCodes,
    selectedCode,
    formValues,
    handleBulkUpdate,
    handleFormClear,
    handleShowProperties,
    isSelectAllAcrossPages,
    activeScopeDetails,
    filterValues,
    allWingOptions,
    loadProperties,
    menuItems,
    actions,
    selectedScopeId,
    validateYearFields,
    t,
    toast,
  ]);

  const paginationInfo = useMemo(() => {
    const total = filteredProperties.length;
    if (total === 0) {
      return { start: 0, end: 0, total: 0 };
    }
    const start = (propertiesPage - 1) * propertiesPageSize + 1;
    const end = Math.min(propertiesPage * propertiesPageSize, total);
    return { start, end, total };
  }, [filteredProperties.length, propertiesPage, propertiesPageSize]);

  const handleFilterValuesChange: React.Dispatch<React.SetStateAction<PropertyFilterFormValues>> = useCallback((action) => {
    setFilterValues(prev => {
      const newValues = typeof action === 'function' ? action(prev) : action;
      return newValues;
    });
  }, []);

  return {
    t,
    locale,
    // Menu
    menuItems: props.menuItems || [],
    activeMenuItems,
    filteredMenuItems,
    selectedCodes,
    selectedCode,
    selectedMenuItem,
    menuSearch,
    setMenuSearch,
    searchingMenu,
    handleMenuSelect,
    // Field configs
    fieldConfigs,
    loadingConfigs,
    // Filter
    filterValues,
    setFilterValues: handleFilterValuesChange,
    filterSubmitted,
    scopeOptions,
    selectedScopeId,
    handleScopeChange,
    activeScopeDetails,
    zoneOptions,
    wardOptions,
    wingOptions,
    propertyOptions,
    propertyTypeOptions,
    handleZoneChange,
    handleWardChange,
    handlePropertyDropdownFocus,
    handleFromPropertyChange,
    handleToPropertyChange,
    handleShowProperties,
    handleBack,
    loadingProperties,
    loadingShowProperties,
    loadingScopeOptions,
    loadingWards: false, // Data is server-loaded, no client-side loading
    loadingPropertyOptions,
    loadingWingOptions: false,
    canShowProperties,
    hasAnyFilterValue,
    propertyDropdownHasMore,
    handleLoadMorePropertyOptions,
    loadingMorePropertyOptions,
    propertySearchTerm,
    handlePropertyDropdownSearch,
    // From Property (Scope 3)
    fromPropertyOptions,
    fromPropertyDropdownHasMore,
    handleLoadMoreFromPropertyOptions,
    loadingFromPropertyOptions,
    loadingMoreFromPropertyOptions,
    fromPropertySearchTerm,
    handleFromPropertyDropdownSearch,
    // To Property (Scope 3)
    toPropertyOptions,
    toPropertyDropdownHasMore,
    handleLoadMoreToPropertyOptions,
    loadingToPropertyOptions,
    loadingMoreToPropertyOptions,
    toPropertySearchTerm,
    handleToPropertyDropdownSearch,
    // Properties
    properties,
    filteredProperties,
    pagedProperties,
    propertiesPage,
    setPropertiesPage: handlePageChange,
    propertiesPageSize,
    handlePropertiesPageSizeChange,
    propertiesSearchTerm: localPropertiesSearchTerm,
    handlePropertiesSearch,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    totalCount,
    // Selection
    selectedPropertyIds,
    allSelected,
    selectedCount,
    isPropertySelected,
    isSelectAllAcrossPages,
    excludedPropertyIds,
    handleSelectAll,
    handlePropertySelect,
    // Form
    formValues,
    formErrors,
    formWarnings,
    formSubmitted,
    isFormValid,
    saving,
    optionsMap,
    lookupMap,
    bindApiLoadingMap: loadingMap,
    bindApiLoadingMoreMap: loadingMoreMap,
    bindApiHasMoreMap: hasMoreMap,
    handleBindApiFocus: onFocus,
    handleBindApiLoadMore: onLoadMore,
    handleBindApiSearchChange: onSearchChange,
    handleFormValueChange,
    handleFormClear,
    handleSubmitBulkUpdate,
    paginationInfo,
    resetKey,
    // Actions prop
    actions: props.actions,
  };
};
