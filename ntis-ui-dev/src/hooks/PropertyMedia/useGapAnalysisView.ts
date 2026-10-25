'use client';

import { useState, useTransition, useCallback, useMemo, useEffect, useRef, useOptimistic } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { SearchSelectOption } from "@/components/common";
import { getMissingPropertyColumns } from "@/components/modules/property-tax/PropertyMedia/GapAnalysisView/GapAnalysisViewColumn";
import { MissingPropertyRow, MissingPropertyTableData } from "@/types/PropertyMedia/PropertyMedia.types";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";
import { sanitizeSearchInput } from "./useGapAnalysis";
import { useDebounce } from "@/hooks/useDebounce";
import { ROUTES } from "@/lib/constants/routes";

export interface UseGapAnalysisViewProps {
    missingPropertyTableData?: MissingPropertyTableData;
    workflowStageOptions?: SearchSelectOption[];
    divisionOptions?: SearchSelectOption[];
    wardOptions?: SearchSelectOption[];
    propertyTypeOptions?: SearchSelectOption[];
}

export interface GapAnalysisViewFilters {
    workflowStageId: string;
    divisionId: string;
    wardId: string;
    propertyTypeId: string;
}

export function useGapAnalysisView({
    missingPropertyTableData,
    divisionOptions = [],
    wardOptions = [],
    propertyTypeOptions = [],
}: UseGapAnalysisViewProps = {}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const locale = useLocale();
    const t = useTranslations("propertyMedia");
    const tCommon = useTranslations("common");
    const navigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const divisionLabel = useAliasLabel("Division", t("aliasFallback.division"));
    const wardLabel = useAliasLabel("Ward", t("aliasFallback.ward"));
    const propertyNoLabel = useAliasLabel("Property_No", t("aliasFallback.propertyNo"));

    const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(true);
    const [isFilterEnabled, setIsFilterEnabled] = useState<boolean>(false);
    const [isPending, startTransition] = useTransition();


    // URL Parameters

    const urlWorkflowStageId = searchParams.get("workflowStageId") || "";
    const urlDivisionId = searchParams.get("divisionId") || "";
    const urlWardId = searchParams.get("wardId") || "";
    const urlPropertyTypeId = searchParams.get("propertyTypeId") || "";
    const urlSearchQuery = searchParams.get("q") || searchParams.get("search") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10));


    const urlFilters = useMemo(() => ({
        workflowStageId: urlWorkflowStageId,
        divisionId: urlDivisionId,
        wardId: urlWardId,
        propertyTypeId: urlPropertyTypeId,
    }), [urlWorkflowStageId, urlDivisionId, urlWardId, urlPropertyTypeId]);
    const [filters, setOptimisticFilters] = useOptimistic(
        urlFilters,
        (currentFilters, updates: Partial<GapAnalysisViewFilters>) => ({
            ...currentFilters,
            ...updates,
        })
    );

    const [searchTerm, setSearchTerm] = useState<string>(urlSearchQuery);
    const lastPushedQueryRef = useRef(urlSearchQuery);

    // Only update local state if URL was changed externally (e.g., Back/Forward or Reset)
    useEffect(() => {
        if (urlSearchQuery !== lastPushedQueryRef.current) {
            lastPushedQueryRef.current = urlSearchQuery;
            setSearchTerm(urlSearchQuery);
        }
    }, [urlSearchQuery]);


    // URL Query Update Helper

    const updateQueries = useCallback(
        (
            updates: Record<string, string | number | null | undefined>,
            resetPage = true,
            optimisticUpdates?: Partial<GapAnalysisViewFilters>
        ) => {
            startTransition(() => {
                if (optimisticUpdates) {
                    setOptimisticFilters(optimisticUpdates);
                }
                const params = new URLSearchParams(searchParams.toString());

                Object.entries(updates).forEach(([key, value]) => {
                    if (value === null || value === undefined || value === "") {
                        params.delete(key);
                    } else {
                        params.set(key, String(value));
                    }
                });

                if (resetPage) {
                    params.delete("page");
                }

                const queryString = params.toString();
                const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;
                router.push(nextUrl, { scroll: false });
            });
        },
        [router, pathname, searchParams, setOptimisticFilters]
    );

    // Codebase useDebounce hook integration
    const debouncedSearch = useDebounce(searchTerm, 400);

    useEffect(() => {
        const trimmed = debouncedSearch.trim();
        if (trimmed !== urlSearchQuery.trim()) {
            lastPushedQueryRef.current = trimmed;
            updateQueries({ q: trimmed || null }, true);
        }
    }, [debouncedSearch, urlSearchQuery, updateQueries]);


    // Unified Filter Handler (URL Sync)

    const handleFilterChange = useCallback(
        (name: string, value: string) => {
            if (name === "divisionId") {
                const optimisticUpdates: Partial<GapAnalysisViewFilters> = {
                    divisionId: value,
                    wardId: "",
                };
                updateQueries(
                    {
                        divisionId: value || null,
                        wardId: null,
                    },
                    true,
                    optimisticUpdates
                );
                return;
            }

            const optimisticUpdates: Partial<GapAnalysisViewFilters> = {};
            switch (name) {
                case "workflowStageId":
                    optimisticUpdates.workflowStageId = value;
                    break;
                case "wardId":
                    optimisticUpdates.wardId = value;
                    break;
                case "propertyTypeId":
                    optimisticUpdates.propertyTypeId = value;
                    break;
                default:
                    updateQueries({ [name]: value || null }, true);
                    return;
            }
            updateQueries({ [name]: value || null }, true, optimisticUpdates);
        },
        [updateQueries]
    );

    const handleSearchChange = useCallback((value: string) => {
        const sanitized = sanitizeSearchInput(value);
        setSearchTerm(sanitized);
    }, []);

    const handleClear = useCallback(() => {
        setSearchTerm("");
        startTransition(() => {
            setOptimisticFilters({
                workflowStageId: "",
                divisionId: "",
                wardId: "",
                propertyTypeId: "",
            });
            router.push(pathname, { scroll: false });
        });
    }, [router, pathname, setOptimisticFilters]);


    // Pagination Handlers

    const handlePageChange = useCallback(
        (newPage: number) => {
            updateQueries({ page: newPage > 1 ? newPage : null }, false);
        },
        [updateQueries]
    );

    const handlePageSizeChange = useCallback(
        (newPageSize: number) => {
            updateQueries({ pageSize: newPageSize !== 10 ? newPageSize : null }, true);
        },
        [updateQueries]
    );


    // Drawer Navigation & Close
    const handleCancel = useCallback(() => {
        setIsDrawerOpen(false);
        if (navigationTimer.current) clearTimeout(navigationTimer.current);
        navigationTimer.current = setTimeout(() => {
            navigationTimer.current = null;
            startTransition(() => {
                router.push(`/${locale}${ROUTES.PROPERTY_TAX.PROPERTY_MEDIA}`);
            });
        }, 300);
    }, [router, locale]);

    useEffect(
        () => () => {
            if (navigationTimer.current) clearTimeout(navigationTimer.current);
        },
        []
    );

    // handle filter Enable/Disable
    const handleFilter = useCallback(() => {
        setIsFilterEnabled(!isFilterEnabled);
    }, [isFilterEnabled]);

    // Table Data
    const paginatedData = useMemo(
        () => (missingPropertyTableData?.items ?? []) as MissingPropertyRow[],
        [missingPropertyTableData]
    );

    const totalCount = missingPropertyTableData?.totalCount ?? paginatedData.length;
    const totalPages = missingPropertyTableData?.totalPages ?? Math.max(1, Math.ceil(totalCount / pageSize));
    const gapRecords = missingPropertyTableData?.gapRecords ?? totalCount;

    // Summary Cards (Derived from URL & Options)
    const allLabel = t("propertyMediaViewDrawer.summary.all");

    const summaryItems = useMemo(() => {
        const divisionValue = divisionOptions.find((o) => String(o.value) === String(filters.divisionId))?.label || allLabel;
        const wardValue = wardOptions.find((o) => String(o.value) === String(filters.wardId))?.label || allLabel;
        const propertyTypeValue = propertyTypeOptions.find((o) => String(o.value) === String(filters.propertyTypeId))?.label || allLabel;

        return [
            {
                label: t("propertyMediaViewDrawer.summary.gapRecords"),
                value: String(gapRecords),
            },
            {
                label: divisionLabel,
                value: divisionValue,
            },
            {
                label: wardLabel,
                value: wardValue,
            },
            {
                label: t("propertyMediaViewDrawer.summary.propertyType"),
                value: propertyTypeValue,
            },
        ];
    }, [t, gapRecords, divisionOptions, filters.divisionId, wardOptions, filters.wardId, propertyTypeOptions, filters.propertyTypeId, allLabel, divisionLabel, wardLabel]);

    // Localized Columns
    const columns = useMemo(
        () => getMissingPropertyColumns(t, { propertyNoLabel, divisionLabel, wardLabel }),
        [t, propertyNoLabel, divisionLabel, wardLabel]
    );

    return {
        // Drawer State & Close
        isDrawerOpen,
        handleCancel,
        isPending,

        // Filter States
        filters,
        workflowStageId: filters.workflowStageId,
        divisionId: filters.divisionId,
        wardId: filters.wardId,
        propertyTypeId: filters.propertyTypeId,
        searchTerm,
        isWardDisabled: !filters.divisionId,

        // Alias Labels
        divisionLabel,
        wardLabel,
        propertyNoLabel,

        // Filter Handlers
        handleFilterChange,
        handleSearchChange,
        handleClear,
        handleFilter,
        isFilterEnabled,

        // Table & Pagination
        columns,
        paginatedData,
        pageNumber: page,
        pageSize,
        totalCount,
        totalPages,
        handlePageChange,
        handlePageSizeChange,

        // Summary Cards
        summaryItems,

        // Translations
        t,
        tCommon,
    };
}