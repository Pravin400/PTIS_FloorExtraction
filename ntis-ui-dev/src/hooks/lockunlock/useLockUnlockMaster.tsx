import { useState, useCallback, useRef, useTransition, useMemo } from "react";
import { toast } from "sonner";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { LockedScreen, LockUnlockPropertyItem, LockUnlockPropertiesResponse, SEARCH_CATEGORY } from "@/types/lockunlock.types";
import { fetchLockUnlockPropertiesByCategoryAction, bulkLockUnlockPropertiesAction, fetchLockUnlockPropertiesPagedAction, bulkLockUnlockByCategoryAction } from "@/app/[locale]/property-tax/lockunlock/action";
import { getScreenIds, executeToggleLock } from "@/lib/api/lockunlock/lockunlock.utils";
import { useLockUnlockColumns } from "./useLockUnlockColumns";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { SEARCH_ALPHANUMERIC_SANITIZE } from "@/lib/utils/validation-rules";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

export interface UseLockUnlockMasterProps {
  wardIdFromUrl: string;
  screens: LockedScreen[];
  dropdownProperties: { label: string; value: string; propertyId?: number; propertyNo?: string; partitionNo?: string }[];
  initialProperties?: LockUnlockPropertyItem[];
  initialPagination?: PaginationState;
}

export interface PaginationState {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export function useLockUnlockMaster({
  wardIdFromUrl,
  screens = [],
  dropdownProperties = [],
  initialProperties = [],
  initialPagination,
}: UseLockUnlockMasterProps) {
  const { confirm } = useConfirm();
  const t = useTranslations("lockUnlock");
  const wardAlias = useAliasLabel("Ward", t("defaults.ward"));
  const zoneAlias = useAliasLabel("Zone", t("defaults.zone"));
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isShowPending, startShowTransition] = useTransition();
  const [isActionPending, setIsActionPending] = useState(false);

  // Form State - initialized from URL params
  const fromPropertyFromUrl = searchParams.get("fromProperty") || "";
  const toPropertyFromUrl = searchParams.get("toProperty") || "";
  const pageFromUrl = searchParams.get("pageNumber") ? Number(searchParams.get("pageNumber")) : 1;
  const pageSizeFromUrl = searchParams.get("pageSize") ? Number(searchParams.get("pageSize")) : 10;
  const searchCategoryFromUrl = searchParams.get("searchCategory") ? Number(searchParams.get("searchCategory")) : 1;
  const zoneIdFromUrl = searchParams.get("zoneId") || "";
  const propertyNosFromUrl = searchParams.get("propertyNos") ? searchParams.get("propertyNos")!.split(",") : [];

  const [formData, setFormData] = useState({
    searchCategory: searchCategoryFromUrl,
    zoneId: zoneIdFromUrl,
    wardId: wardIdFromUrl || "",
    fromProperty: fromPropertyFromUrl,
    toProperty: toPropertyFromUrl,
    propertyNos: propertyNosFromUrl,
  });

  // Selected Screen IDs
  const [selectedScreenIds, setSelectedScreenIds] = useState<number[]>([]);

  // Results State - initialize with server-fetched data if available or URL show param
  const showFromUrl = searchParams.get("show") === "true";
  const [showResults, setShowResults] = useState(showFromUrl || initialProperties.length > 0);
  const [clientProperties, setClientProperties] = useState<LockUnlockPropertyItem[] | null>(null);
  const properties = clientProperties ?? (initialProperties || []);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<number[]>([]);

  // Select-All-Across-Pages State
  const [isAllPropertiesSelected, setIsAllPropertiesSelected] = useState(searchCategoryFromUrl === 1 || searchCategoryFromUrl === 2);
  const [excludedPropertyIds, setExcludedPropertyIds] = useState<number[]>([]);

  // Pagination State - initialize with server-provided pagination if available, or from URL
  const [clientPagination, setClientPagination] = useState<PaginationState | null>(null);
  const pagination = clientPagination ?? (initialPagination || {
    pageNumber: pageFromUrl,
    pageSize: pageSizeFromUrl,
    totalCount: 0,
    totalPages: 1,
  });

  // Individual Property Modal State
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    property: LockUnlockPropertyItem | null;
    selectedScreenIds: number[];
  }>({
    isOpen: false,
    property: null,
    selectedScreenIds: [],
  });

  // Property dropdown options state - derived from server-fetched data initially, then updated on client
  const [propertyOptions, setPropertyOptions] = useState(dropdownProperties);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);

  const fetchDropdowns = useCallback(async (wardId: string) => {
    if (!wardId) {
      setPropertyOptions([]);
      return;
    }
    setIsLoadingProperties(true);
    try {
      const propertiesResponse = await fetchLockUnlockPropertiesPagedAction({
        WardId: Number(wardId),
        PageNumber: 1,
        PageSize: -1,
      });

      const seen = new Set<string>();
      const options = (propertiesResponse.items || [])
        .map((p: LockUnlockPropertyItem) => {
          const normalizedPartitionNo = String(p.partitionNo ?? "").trim();
          const hasPartition =
            normalizedPartitionNo !== "" &&
            normalizedPartitionNo !== "0" &&
            normalizedPartitionNo !== "-";
          const displayValue = hasPartition
            ? `${p.propertyNo}-${normalizedPartitionNo}`
            : p.propertyNo;
          return {
            label: displayValue,
            value: displayValue,
            propertyNo: p.propertyNo,
            partitionNo: p.partitionNo,
          };
        })
        .filter((option: { label: string; value: string }) => {
          if (seen.has(option.value)) {
            return false;
          }
          seen.add(option.value);
          return true;
        });

      setPropertyOptions(options);
    } catch (_error) {
      toast.error(t("messages.fetchFailed"));
    } finally {
      setIsLoadingProperties(false);
    }
  }, [t]);



  // Search state for property number filtering (server-side search)
  const searchFromUrl = searchParams.get("search") || "";
  const initialSanitizedSearch = searchFromUrl.replace(SEARCH_ALPHANUMERIC_SANITIZE, "");
  const [propertySearchTerm, setPropertySearchTerm] = useState(initialSanitizedSearch);
  const [isSearching, setIsSearching] = useState(false);
  const lastAppliedSearchRef = useRef(initialSanitizedSearch);
  const emptySearchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset selection state
  const resetSelectionState = useCallback((newSearchCategory?: number) => {
    const cat = newSearchCategory ?? formData.searchCategory;
    setIsAllPropertiesSelected(cat === 1 || cat === 2);
    setSelectedPropertyIds([]);
    setExcludedPropertyIds([]);
  }, [formData.searchCategory]);

  const handleSelectChange = (name: string, value: string | string[]) => {
    const params = new URLSearchParams(searchParams.toString());

    if (name === "searchCategory") {
      const numValue = Number(value);
      params.set("searchCategory", value as string);

      // Clear properties when changing category
      setFormData((prev) => ({
        ...prev,
        searchCategory: numValue,
        zoneId: "",
        wardId: "",
        fromProperty: "",
        toProperty: "",
        propertyNos: []
      }));
      setShowResults(false);
      setClientProperties([]);
      resetSelectionState(numValue);
      setSelectedScreenIds([]);
      setClientPagination({ pageNumber: 1, pageSize: 10, totalCount: 0, totalPages: 1 });
      setPropertySearchTerm("");

      params.delete("zoneId");
      params.delete("wardId");
      params.delete("fromProperty");
      params.delete("toProperty");
      params.delete("propertyNos");
      params.delete("pageNumber");
      params.delete("pageSize");
      params.delete("search");
      params.delete("show");
      router.push(`${pathname}?${params.toString()}`);
    } else if (name === "zoneId") {
      if (value) {
        params.set("zoneId", value as string);
      } else {
        params.delete("zoneId");
      }
      setFormData((prev) => ({ ...prev, zoneId: value as string }));
      setShowResults(false);
      setClientProperties([]);
      resetSelectionState();
      params.delete("show");
      router.push(`${pathname}?${params.toString()}`);
    } else if (name === "wardId") {
      if (value) {
        params.set("wardId", value as string);
        fetchDropdowns(value as string);
      } else {
        params.delete("wardId");
        setPropertyOptions([]);
      }
      // Clear property selections/results when ward changes
      setFormData((prev) => ({ ...prev, wardId: value as string, fromProperty: "", toProperty: "" }));
      setShowResults(false);
      setClientProperties([]);
      resetSelectionState();
      setSelectedScreenIds([]);
      setClientPagination({ pageNumber: 1, pageSize: 10, totalCount: 0, totalPages: 1 });
      setPropertySearchTerm("");

      params.delete("fromProperty");
      params.delete("toProperty");
      params.delete("pageNumber");
      params.delete("pageSize");
      params.delete("search");
      params.delete("show");
      router.push(`${pathname}?${params.toString()}`);
    } else if (name === "fromProperty") {
      let newToProperty = formData.toProperty;
      if (value) {
        const fromIndex = propertyOptions.findIndex((o) => o.value === (value as string));
        const toIndex = propertyOptions.findIndex((o) => o.value === formData.toProperty);

        // If the previously selected 'toProperty' is now invalid (comes before 'fromProperty'),
        // clear it instead of auto-selecting.
        if (toIndex !== -1 && toIndex < fromIndex) {
          newToProperty = "";
        }
      }
      // Just update local state, do not push to router yet.
      setFormData((prev) => ({ ...prev, fromProperty: value as string, toProperty: newToProperty }));

      // If we are currently showing results and the user changes a filter, we should probably clear the results.
      if (showResults) {
        setShowResults(false);
        setClientProperties([]);
        params.delete("show");
        router.push(`${pathname}?${params.toString()}`);
      }
    } else if (name === "toProperty") {
      // Just update local state, do not push to router yet.
      setFormData((prev) => ({ ...prev, toProperty: value as string }));

      // If we are currently showing results and the user changes a filter, we should probably clear the results.
      if (showResults) {
        setShowResults(false);
        setClientProperties([]);
        params.delete("show");
        router.push(`${pathname}?${params.toString()}`);
      }
    } else if (name === "propertyNos") {
      setFormData((prev) => ({ ...prev, propertyNos: value as string[] }));
      if (showResults) {
        setShowResults(false);
        setClientProperties([]);
        params.delete("show");
        router.push(`${pathname}?${params.toString()}`);
      }
    }
  };

  const handleClearAll = () => {
    setFormData((prev) => ({
      ...prev,
      zoneId: "",
      wardId: "",
      fromProperty: "",
      toProperty: "",
      propertyNos: [],
    }));
    setSelectedScreenIds([]);
    setShowResults(false);
    setClientProperties([]);
    resetSelectionState();
    setClientPagination({ pageNumber: 1, pageSize: 10, totalCount: 0, totalPages: 1 });
    setPropertySearchTerm("");

    // Clear URL parameters except searchCategory
    const params = new URLSearchParams();
    params.set("searchCategory", formData.searchCategory.toString());
    router.push(`${pathname}?${params.toString()}`);

    toast.info(t("messages.clearedFilters"));
  };
  // Helper to extract property numbers and partition numbers range
  const getPropertyQueryRange = useCallback(() => {
    return {
      fromProperty: formData.fromProperty || undefined,
      toProperty: formData.toProperty || undefined,
    };
  }, [formData.fromProperty, formData.toProperty]);

  const fetchProperties = useCallback(
    (pageNum: number, pageSz: number, searchTerm: string = propertySearchTerm, resetSelection: boolean = false) => {
      if (formData.searchCategory !== 1 && !formData.wardId) {
        toast.error(t("messages.selectWardRequired", { ward: wardAlias }));
        return;
      }

      const isSearchActive = !searchTerm;

      if (formData.searchCategory !== 1 && formData.searchCategory !== 2 && formData.searchCategory !== 3) {
        if (!isSearchActive && (!formData.fromProperty || !formData.toProperty)) {
          toast.error(t("messages.validationError", { ward: wardAlias }));
          return;
        }
      }

      (async () => {
        setIsSearching(true);
        try {
          const { fromProperty, toProperty } = getPropertyQueryRange();

          // Normalize the search: collapse spaces around hyphens
          const normalizedSearch = searchTerm
            ? searchTerm.replace(/\s*-\s*/g, "-").trim()
            : "";

          const params: Record<string, unknown> = {
            SearchCategory: formData.searchCategory,
            PageNumber: pageNum,
            PageSize: pageSz,
          };

          if (formData.searchCategory === 1) {
            if (!formData.zoneId) throw new Error(t("messages.selectZoneRequired", { zone: zoneAlias }));
            params.ZoneId = Number(formData.zoneId);
          } else if (formData.searchCategory === 2) {
            if (!formData.wardId) throw new Error(t("messages.selectWardRequired", { ward: wardAlias }));
            params.WardId = Number(formData.wardId);
          } else if (formData.searchCategory === 3) {
            if (!formData.wardId) throw new Error(t("messages.selectWardRequired", { ward: wardAlias }));
            if (!formData.propertyNos || formData.propertyNos.length === 0) throw new Error(t("messages.selectPropertyDropdownRequired"));

            const partitions = new Set<string>();
            const basePropertyNos = new Set<string>();

            for (const propStr of formData.propertyNos) {
              const parts = propStr.split("-");
              const propNo = parts[0];
              const partition = parts.length > 1 ? parts.slice(1).join("-") : "";

              if (propNo) basePropertyNos.add(propNo);
              if (partition) partitions.add(partition);
            }

            params.WardId = Number(formData.wardId);
            if (basePropertyNos.size > 0) {
              params.PropertyNo = Array.from(basePropertyNos).join(",");
            }
            if (partitions.size > 0) {
              const partitionStr = Array.from(partitions).join(",");
              params.PartitionNo = partitionStr;
              params.SearchPartitionNo = partitionStr;
            }

          } else if (formData.searchCategory === 4) {
            if (!isSearchActive && !formData.wardId && (!formData.fromProperty || !formData.toProperty)) {
              throw new Error(t("messages.validationError", { ward: wardAlias }));
            }
            if (!formData.wardId) {
              throw new Error(t("messages.selectWardRequired", { ward: wardAlias }));
            }
            if (!isSearchActive && (!formData.fromProperty || !formData.toProperty)) {
              throw new Error(t("messages.selectFromToPropertyRequired"));
            }

            if (formData.fromProperty && formData.toProperty) {
              const fromIndex = propertyOptions.findIndex(o => o.value === formData.fromProperty);
              const toIndex = propertyOptions.findIndex(o => o.value === formData.toProperty);
              if (toIndex <= fromIndex) {
                throw new Error(t("messages.validationGreaterProperty"));
              }
            }

            params.WardId = Number(formData.wardId);
            params.PropertyFrom = fromProperty;
            params.PropertyTo = toProperty;
          }

          if (normalizedSearch) {
            params.SearchTerm = normalizedSearch;
          }

          const response: LockUnlockPropertiesResponse = await fetchLockUnlockPropertiesByCategoryAction(
            params as Parameters<typeof fetchLockUnlockPropertiesByCategoryAction>[0]
          );

          if (response?.items?.length > 0) {
            if (resetSelection) {
              resetSelectionState();
            }
            setClientProperties(response.items);
            setClientPagination({
              pageNumber: response.pageNumber || pageNum,
              pageSize: response.pageSize || pageSz,
              totalCount: response.totalCount,
              totalPages: response.totalPages,
            });
            setShowResults(true);
          } else {
            setClientProperties([]);
            if (resetSelection) {
              resetSelectionState();
            }
            setClientPagination({ pageNumber: 1, pageSize: pageSz, totalCount: 0, totalPages: 1 });
            setShowResults(true);
            toast.info(t("messages.fetchNoResults"));
          }
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : t("messages.fetchFailed"));
        } finally {
          setIsSearching(false);
        }
      })();
    },
    [propertySearchTerm, formData.wardId, formData.fromProperty, formData.toProperty, formData.propertyNos, formData.searchCategory, formData.zoneId, propertyOptions, getPropertyQueryRange, t, resetSelectionState, wardAlias, zoneAlias]
  );

  // Show (initial load) and search should reset selection
  const handleShow = useCallback((fromShowButton = false) => {
    if (formData.searchCategory === 1) {
      if (!formData.zoneId) {
        toast.error(t("messages.selectZoneRequired", { zone: zoneAlias }));
        return;
      }
    } else if (formData.searchCategory === 2) {
      if (!formData.wardId) {
        toast.error(t("messages.selectWardRequired", { ward: wardAlias }));
        return;
      }
    } else if (formData.searchCategory === 3) {
      if (!formData.wardId) {
        toast.error(t("messages.selectWardAndPropertyRequired", { ward: wardAlias }));
        return;
      }
      if (!formData.propertyNos || formData.propertyNos.length === 0) {
        toast.error(t("messages.selectPropertyDropdownRequired"));
        return;
      }
    } else if (formData.searchCategory === 4) {
      if (!formData.wardId) {
        toast.error(t("messages.selectWardRequired", { ward: wardAlias }));
        return;
      }
      if (!formData.fromProperty || !formData.toProperty) {
        toast.error(t("messages.selectFromToPropertyRequired"));
        return;
      }

      if (formData.fromProperty && formData.toProperty) {
        const fromIndex = propertyOptions.findIndex(o => o.value === formData.fromProperty);
        const toIndex = propertyOptions.findIndex(o => o.value === formData.toProperty);
        if (toIndex <= fromIndex) {
          toast.error(t("messages.validationGreaterProperty"));
          return;
        }
      }
    }

    const params = new URLSearchParams();
    params.set("searchCategory", formData.searchCategory.toString());
    if (formData.zoneId) params.set("zoneId", formData.zoneId);
    if (formData.wardId) params.set("wardId", formData.wardId);
    if (formData.fromProperty) params.set("fromProperty", formData.fromProperty);
    if (formData.toProperty) params.set("toProperty", formData.toProperty);
    if (formData.searchCategory === 3 && formData.propertyNos && formData.propertyNos.length > 0) {
      params.set("propertyNos", formData.propertyNos.join(","));
    }
    params.set("pageNumber", "1");
    params.set("pageSize", pagination.pageSize.toString());

    const searchFromUrl = searchParams.get("search");
    if (searchFromUrl) params.set("search", searchFromUrl);
    params.set("show", "true");

    // Clear client overrides so we use the fresh server data
    setClientProperties(null);
    setClientPagination(null);

    const transitionFn = fromShowButton ? startShowTransition : startTransition;
    transitionFn(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }, [formData, searchParams, pathname, router, t, pagination.pageSize, propertyOptions, zoneAlias, wardAlias]);

  const handleSearchButtonClick = useCallback((termOverride?: unknown) => {
    const termToSearch = typeof termOverride === 'string' ? termOverride : propertySearchTerm;

    if (!termToSearch || termToSearch.trim() === "") {
      toast.error(t("messages.searchValidationError"));
      return;
    }

    lastAppliedSearchRef.current = termToSearch;
    const params = new URLSearchParams(searchParams.toString());
    params.set("search", termToSearch);

    router.push(`${pathname}?${params.toString()}`);

    fetchProperties(1, pagination.pageSize, termToSearch, true);
  }, [propertySearchTerm, searchParams, pathname, router, fetchProperties, pagination.pageSize, t]);

  // Clear search
  const handleClearSearch = useCallback(() => {
    setPropertySearchTerm("");
    lastAppliedSearchRef.current = "";

    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.set("pageNumber", "1");
    router.push(`${pathname}?${params.toString()}`);

    fetchProperties(1, pagination.pageSize, "", true);
  }, [searchParams, pathname, router, fetchProperties, pagination.pageSize]);

  // Keeps the input responsive and triggers debounced search on empty bar
  const handlePropertySearch = useCallback((searchTerm: string) => {
    const sanitizedSearchTerm = searchTerm.replace(SEARCH_ALPHANUMERIC_SANITIZE, "");

    if (searchTerm !== sanitizedSearchTerm) {
      setPropertySearchTerm(searchTerm);
      setTimeout(() => setPropertySearchTerm(sanitizedSearchTerm), 0);
    } else {
      setPropertySearchTerm(sanitizedSearchTerm);
    }

    if (emptySearchTimerRef.current) {
      clearTimeout(emptySearchTimerRef.current);
      emptySearchTimerRef.current = null;
    }

    if (sanitizedSearchTerm === "") {
      emptySearchTimerRef.current = setTimeout(() => {
        handleClearSearch();
      }, 1000);
    } else {
      emptySearchTimerRef.current = setTimeout(() => {
        handleSearchButtonClick(sanitizedSearchTerm);
      }, 1000);
    }
  }, [handleClearSearch, handleSearchButtonClick]);

  // Page navigation preserves selection state (no reset)
  const handlePageChange = useCallback(
    (newPage: number) => {
      // Update URL with new page number
      const params = new URLSearchParams(searchParams.toString());
      params.set("pageNumber", newPage.toString());
      router.push(`${pathname}?${params.toString()}`);

      fetchProperties(newPage, pagination.pageSize, undefined, false);
    },
    [fetchProperties, pagination.pageSize, searchParams, pathname, router]
  );

  // Page size change resets selection
  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      // Update URL with new page size and reset to page 1
      const params = new URLSearchParams(searchParams.toString());
      params.set("pageSize", newSize.toString());
      params.set("pageNumber", "1");
      router.push(`${pathname}?${params.toString()}`);

      fetchProperties(1, newSize, undefined, true);
    },
    [fetchProperties, searchParams, pathname, router]
  );

  const handleSelectProperty = useCallback((propertyId: number) => {
    if (isAllPropertiesSelected) {
      // In select-all mode, toggle the excludedPropertyIds
      setExcludedPropertyIds((prev) =>
        prev.includes(propertyId)
          ? prev.filter((id) => id !== propertyId)
          : [...prev, propertyId]
      );
    } else {
      // Normal mode: toggle selectedPropertyIds
      setSelectedPropertyIds((prev) =>
        prev.includes(propertyId) ? prev.filter((id) => id !== propertyId) : [...prev, propertyId]
      );
    }
  }, [isAllPropertiesSelected]);

  const handleSelectAllProperties = useCallback(() => {
    setIsAllPropertiesSelected((prev) => {
      const next = !prev;
      if (next) {
        // Enable select-all: clear normal selection and exclusion list
        setSelectedPropertyIds([]);
        setExcludedPropertyIds([]);
      } else {
        // Disable select-all: clear all selection state
        setSelectedPropertyIds([]);
        setExcludedPropertyIds([]);
      }
      return next;
    });
  }, []);

  const handleToggleLock = (row: LockUnlockPropertyItem) => {
    executeToggleLock({
      row,
      selectedScreenIds,
      t,
      confirm,
      setIsActionPending,
      toast,
      bulkLockUnlockAction: bulkLockUnlockPropertiesAction,
      onRefresh: () => handleShow(),
      validateScreenState: true,
    });
  };

  const handleManageLocks = (row: LockUnlockPropertyItem) => {
    setEditModal({
      isOpen: true,
      property: row,
      selectedScreenIds: getScreenIds(row.lockedScreens as unknown as []),
    });
  };

  const handleSaveIndividualLock = async () => {
    if (!editModal.property) return;

    const propertyId = Number(editModal.property.propertyId);
    const initialLocked = getScreenIds(editModal.property.lockedScreens as unknown as []);
    const currentLocked = getScreenIds(editModal.selectedScreenIds);

    const screensToLock = currentLocked.filter((id) => !initialLocked.includes(id));
    const screensToUnlock = initialLocked.filter((id) => !currentLocked.includes(id));

    setIsActionPending(true);
    startTransition(async () => {
      try {
        let lockSuccess = true;
        let unlockSuccess = true;

        if (screensToLock.length > 0) {
          const res = await bulkLockUnlockPropertiesAction({
            propertyIds: [propertyId],
            screenIds: screensToLock,
            action: "lock",
          });
          lockSuccess = res.success;
        }

        if (screensToUnlock.length > 0) {
          const res = await bulkLockUnlockPropertiesAction({
            propertyIds: [propertyId],
            screenIds: screensToUnlock,
            action: "unlock",
          });
          unlockSuccess = res.success;
        }

        if (lockSuccess && unlockSuccess) {
          toast.success(t("messages.saveSuccess"));
          setEditModal({ isOpen: false, property: null, selectedScreenIds: [] });
          handleShow();
        } else {
          toast.error(t("messages.savePartialFailed"));
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : t("messages.saveFailed"));
      } finally {
        setIsActionPending(false);
      }
    });
  };

  const handleBulkAction = (action: "lock" | "unlock") => {
    const isScopeZoneOrWard =
      formData.searchCategory === SEARCH_CATEGORY.ZONE ||
      formData.searchCategory === SEARCH_CATEGORY.WARD;
    const isBulkCategoryAction =
      isScopeZoneOrWard ||
      ((formData.searchCategory === SEARCH_CATEGORY.BUILDING ||
        formData.searchCategory === SEARCH_CATEGORY.PROPERTY_RANGE) &&
        isAllPropertiesSelected);
    const hasSelection = isBulkCategoryAction || selectedPropertyIds.length > 0;

    if (!hasSelection) {
      toast.error(t("messages.selectPropertyRequired"));
      return;
    }
    if (selectedScreenIds.length === 0) {
      toast.error(t("messages.selectScreenRequired"));
      return;
    }

    let finalPropertyIds = selectedPropertyIds;

    if (!isBulkCategoryAction && selectedPropertyIds.length > 0) {
      const selectedProps = properties.filter(p => selectedPropertyIds.includes(p.propertyId));
      
      const applicablePropertyIds: number[] = [];
      for (const prop of selectedProps) {
        const lockedIds = getScreenIds(prop.lockedScreens as unknown as []);
        if (action === "lock") {
          const canLock = selectedScreenIds.some(id => !lockedIds.includes(id));
          if (canLock) applicablePropertyIds.push(prop.propertyId);
        } else {
          const canUnlock = selectedScreenIds.some(id => lockedIds.includes(id));
          if (canUnlock) applicablePropertyIds.push(prop.propertyId);
        }
      }

      if (applicablePropertyIds.length === 0) {
        if (action === "lock") {
           toast.error(t("messages.wrongScreenSelectedLock"));
        } else {
           toast.error(t("messages.wrongScreenSelectedUnlock"));
        }
        return;
      }

      finalPropertyIds = applicablePropertyIds;
    }

    let exactApplicableCount: number | null = null;
    let exactIgnoredCount: number | null = null;

    if (!isBulkCategoryAction && selectedPropertyIds.length > 0) {
      exactApplicableCount = finalPropertyIds.length;
      exactIgnoredCount = selectedPropertyIds.length - finalPropertyIds.length;
    } else if (isAllPropertiesSelected && pagination.totalCount <= properties.length) {
      const selectedProps = properties.filter(p => !excludedPropertyIds.includes(p.propertyId));
      const applicablePropertyIds: number[] = [];
      for (const prop of selectedProps) {
        const lockedIds = getScreenIds(prop.lockedScreens as unknown as []);
        if (action === "lock") {
          const canLock = selectedScreenIds.some(id => !lockedIds.includes(id));
          if (canLock) applicablePropertyIds.push(prop.propertyId);
        } else {
          const canUnlock = selectedScreenIds.some(id => lockedIds.includes(id));
          if (canUnlock) applicablePropertyIds.push(prop.propertyId);
        }
      }
      exactApplicableCount = applicablePropertyIds.length;
      exactIgnoredCount = selectedProps.length - applicablePropertyIds.length;
      
      if (exactApplicableCount === 0) {
        if (action === "lock") {
          toast.error(t("messages.wrongScreenSelectedLock"));
        } else {
          toast.error(t("messages.wrongScreenSelectedUnlock"));
        }
        return;
      }
    }

    const propertyCount = isBulkCategoryAction
      ? pagination.totalCount
      : isAllPropertiesSelected
        ? pagination.totalCount - excludedPropertyIds.length
        : finalPropertyIds.length;

    const displayPropertyCount = exactApplicableCount !== null ? exactApplicableCount : propertyCount;

    const title = action === "lock" ? t("messages.lockConfirmTitle") : t("messages.unlockConfirmTitle");
    const isLargePropertyRange = formData.searchCategory === 4 && propertyCount > 3000;
    const shouldShowWarningMessage = isScopeZoneOrWard || isLargePropertyRange;

    const isCategory4SelectAll = formData.searchCategory === 4 && isAllPropertiesSelected;

    const description = shouldShowWarningMessage
      ? (
        <span className="whitespace-pre-wrap leading-relaxed inline-block">
          {t.rich("messages.bulkLockUnlockConfirmation", {
            action: action === "lock" ? t("messages.lockText") : t("messages.unlockText"),
            propertyCount: displayPropertyCount,
            warning: (chunks) => <span className="font-bold text-red-600">{chunks}</span>,
            highlight: (chunks) => <span className="font-bold text-blue-600">{chunks}</span>,
          })}
        </span>
      ) as unknown as string
      : isCategory4SelectAll
      ? t("messages.bulkConfirmDescriptionRange", {
        action: action === "lock" ? t("messages.lockText").toLowerCase() : t("messages.unlockText").toLowerCase(),
        screenCount: selectedScreenIds.length,
        propertyCount: displayPropertyCount,
        fromProperty: formData.fromProperty,
        toProperty: formData.toProperty,
      })
      : t("messages.bulkConfirmDescription", {
        action: action === "lock" ? t("messages.lockText").toLowerCase() : t("messages.unlockText").toLowerCase(),
        screenCount: selectedScreenIds.length,
        propertyCount: displayPropertyCount,
      });

    const clarificationNote = exactIgnoredCount && exactIgnoredCount > 0
      ? (action === "lock" ? t("messages.exactLockedIgnored", { ignoredCount: exactIgnoredCount }) : t("messages.exactUnlockedIgnored", { ignoredCount: exactIgnoredCount }))
      : (action === "lock" ? t("messages.alreadyLockedIgnored") : t("messages.alreadyUnlockedIgnored"));
    
    // Add clarification note unless it's the scope warning message (which already implies bulk operations and has its own warning)
    const finalDescription = shouldShowWarningMessage ? description : (
      <div className="flex flex-col gap-2">
        <span>{description}</span>
        {exactIgnoredCount === 0 ? null : <span className="text-xs text-slate-500 font-semibold">{clarificationNote}</span>}
      </div>
    ) as unknown as string;
    confirm({
      variant: action === "lock" ? "warning" : "info",
      title,
      description: finalDescription,
      confirmText: action === "lock" ? t("messages.lockButtonText") : t("messages.unlockButtonText"),
      onConfirm: async () => {
        setIsActionPending(true);
        startTransition(async () => {
          try {
            if (isBulkCategoryAction) {
              let propertyNoStr = "";
              let partitionNoStr = "";
              let propertyFromStr = "";
              let propertyToStr = "";

              if (formData.searchCategory === 3 && formData.propertyNos) {
                const partitions = new Set<string>();
                const basePropertyNos = new Set<string>();

                for (const propStr of formData.propertyNos) {
                  const parts = propStr.split("-");
                  const propNo = parts[0];
                  const partition = parts.length > 1 ? parts.slice(1).join("-") : "";

                  if (propNo) basePropertyNos.add(propNo);
                  if (partition) partitions.add(partition);
                }

                if (basePropertyNos.size > 0) {
                  propertyNoStr = Array.from(basePropertyNos).join(",");
                }
                if (partitions.size > 0) {
                  partitionNoStr = Array.from(partitions).join(",");
                }
              } else if (formData.searchCategory === 4) {
                const { fromProperty, toProperty } = getPropertyQueryRange();
                propertyFromStr = fromProperty || "";
                propertyToStr = toProperty || "";
              }

              const scopePayload: Parameters<typeof bulkLockUnlockByCategoryAction>[0] = {
                scope: {
                  searchCategory: formData.searchCategory,
                },
                screenIds: selectedScreenIds.map(Number),
                action,
                excludedPropertyIds: excludedPropertyIds.length > 0 ? excludedPropertyIds : undefined,
              };

              if (formData.searchCategory === 1) {
                scopePayload.scope.zoneId = Number(formData.zoneId);
              } else if (formData.searchCategory === 2) {
                scopePayload.scope.wardId = Number(formData.wardId);
              } else if (formData.searchCategory === 3) {
                scopePayload.scope.wardId = Number(formData.wardId);
                if (propertyNoStr) scopePayload.scope.propertyNo = propertyNoStr;
                if (partitionNoStr) scopePayload.scope.partitionNo = partitionNoStr;
              } else if (formData.searchCategory === 4) {
                scopePayload.scope.wardId = Number(formData.wardId);
                if (propertyFromStr) scopePayload.scope.propertyFrom = propertyFromStr;
                if (propertyToStr) scopePayload.scope.propertyTo = propertyToStr;
              }

              const response = await bulkLockUnlockByCategoryAction(scopePayload);
              if (response.success) {
                toast.success(
                  action === "lock"
                    ? t("messages.bulkSuccessLock", { count: propertyCount })
                    : t("messages.bulkSuccessUnlock", { count: propertyCount })
                );
                handleShow();
                resetSelectionState();
              } else {
                toast.error(response.error || t("messages.bulkFailed"));
              }
            } else {
              const payload: Parameters<typeof bulkLockUnlockPropertiesAction>[0] = {
                screenIds: selectedScreenIds.map(Number),
                action,
                propertyIds: finalPropertyIds.map(Number)
              };

              const response = await bulkLockUnlockPropertiesAction(payload);

              if (response.success) {
                toast.success(
                  action === "lock"
                    ? t("messages.bulkSuccessLock", { count: propertyCount })
                    : t("messages.bulkSuccessUnlock", { count: propertyCount })
                );
                handleShow();
                resetSelectionState();
              } else {
                toast.error(response.error || t("messages.bulkFailed"));
              }
            }
          } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : t("messages.unexpectedError"));
          } finally {
            setIsActionPending(false);
          }
        });
      },
    });
  };

  const toPropertyOptions = useMemo(() => {
    if (!formData.fromProperty) return propertyOptions;
    const fromIndex = propertyOptions.findIndex((opt) => opt.value === formData.fromProperty);
    if (fromIndex === -1) return propertyOptions;
    return propertyOptions.slice(fromIndex);
  }, [propertyOptions, formData.fromProperty]);

  const columns = useLockUnlockColumns({
    screens,
    selectedPropertyIds,
    properties,
    isPending,
    isCategoryBulkAction: formData.searchCategory === 1 || formData.searchCategory === 2,
    isAllPropertiesSelected,
    excludedPropertyIds,
    onSelectProperty: handleSelectProperty,
    onSelectAllProperties: handleSelectAllProperties,
    onToggleLock: handleToggleLock,
    onManageLocks: handleManageLocks,
  });

  return {
    formData,
    showResults,
    setFormData,
    selectedScreenIds,
    setSelectedScreenIds,
    setShowResults,
    properties,
    selectedPropertyIds,
    setSelectedPropertyIds,
    isAllPropertiesSelected,
    excludedPropertyIds,
    editModal,
    setEditModal,
    isPending,
    propertyOptions,
    toPropertyOptions,
    isLoadingProperties,
    propertySearchTerm,
    setPropertySearchTerm,
    isSearching,
    handlePropertySearch,
    handleClearSearch,
    pagination,
    handleSelectChange,
    handleClearAll,
    handleShow,
    handleSelectProperty,
    handleSelectAllProperties,
    handleToggleLock,
    handleManageLocks,
    handleSaveIndividualLock,
    handleBulkAction,
    handlePageChange,
    handlePageSizeChange,
    handleSearchButtonClick,
    columns,
    isActionPending,
    setIsActionPending,
    isShowPending,
    resetSelectionState,
  };
}