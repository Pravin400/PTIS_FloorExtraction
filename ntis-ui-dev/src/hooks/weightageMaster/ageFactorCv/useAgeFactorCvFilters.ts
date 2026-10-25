"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { AgeFactorCVMaster } from "@/types/ageFactorCv.types";
import type { Option } from "@/components/common/select";

interface UseAgeFactorCvFiltersParams {
    initialAgeRangeOptions: Option[];
    initialSortBy?: string;
    initialSortOrder?: string;
}

/**
 * Hook for managing filter state and URL synchronization for the Age Factor CV module.
 */
export const useAgeFactorCvFilters = ({
    initialAgeRangeOptions,
    initialSortBy,
    initialSortOrder,
}: UseAgeFactorCvFiltersParams) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const locale = useLocale();

    const currentSelectedYear = searchParams.get("selectedYearRange") || "";
    const currentConstructionType = searchParams.get("constructionType") || "";
    const currentConstructionTypes = currentConstructionType
        ? currentConstructionType.split(",").filter(Boolean)
        : [];

    const [selectedYear, setSelectedYear] = useState<string>(currentSelectedYear);
    const [constructionType, setConstructionType] = useState<string[]>(currentConstructionTypes);
    const [factorValue, setFactorValue] = useState<string>("1.00");

    const [sortBy, setSortBy] = useState<string | undefined>(initialSortBy);
    const [sortOrder, setSortOrder] = useState<string | undefined>(initialSortOrder);

    // Age Range States
    const [ageFrom, setAgeFrom] = useState<string>("");
    const [ageTo, setAgeTo] = useState<string>("");
    const [userAddedAgeRanges, setUserAddedAgeRanges] = useState<Option[]>([]);
    const [selectedAgeRange, setSelectedAgeRange] = useState<string[]>([]);
    const [isAgeRangeAdded, setIsAgeRangeAdded] = useState(false);

    const ageRangeOptions = useMemo(() => {
        const combined = [...(initialAgeRangeOptions || [])];
        userAddedAgeRanges.forEach(opt => {
            if (!combined.find(c => c.value === opt.value)) {
                combined.push(opt);
            }
        });
        return combined;
    }, [initialAgeRangeOptions, userAddedAgeRanges]);

    const clearFilters = useCallback((): void => {
        setFactorValue("1.00");
        setConstructionType([]);
        setSelectedYear("");
        setAgeFrom("");
        setAgeTo("");
        setSelectedAgeRange([]);
        setIsAgeRangeAdded(false);
    }, []);

    const handleAgeRangeChange = (values: string[]): void => {
        setSelectedAgeRange(values);
        // Age From/To mirror the selection only when exactly one range is picked
        // (they seed the "Add Age Range" modal's fields for editing a single range).
        if (values.length === 1) {
            const [from, to] = values[0].split("-");
            setAgeFrom(from);
            setAgeTo(to);
        } else {
            setAgeFrom("");
            setAgeTo("");
        }
    };

    const handleAssessmentYearChange = (value: string): void => {
        setSelectedYear(value);
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", "1");
        if (value) params.set("selectedYearRange", value);
        else params.delete("selectedYearRange");
        router.push(`/${locale}/property-tax/weightage-master/age-weightage?${params.toString()}`);
    };

    const handleConstructionTypeChange = (values: string[]): void => {
        setConstructionType(values);
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", "1");
        if (values.length > 0) params.set("constructionType", values.join(","));
        else params.delete("constructionType");
        router.push(`/${locale}/property-tax/weightage-master/age-weightage?${params.toString()}`);
    };

    const handleSort = (columnKey: string): void => {
        let newOrder: "asc" | "desc" = "asc";
        if (sortBy === columnKey) {
            newOrder = sortOrder === "asc" ? "desc" : "asc";
        }
        setSortBy(columnKey);
        setSortOrder(newOrder);
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", "1");
        params.set("sortBy", columnKey);
        params.set("sortOrder", newOrder);
        router.push(`/${locale}/property-tax/weightage-master/age-weightage?${params.toString()}`);
    };

    const changePage = (page: number, pageSize: number): void => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", String(page));
        params.set("pageSize", String(pageSize));
        const q = searchParams.get("q");
        if (q) params.set("q", q);
        if (selectedYear) params.set("selectedYearRange", selectedYear);
        if (constructionType.length > 0) params.set("constructionType", constructionType.join(","));
        if (sortBy) params.set("sortBy", sortBy);
        if (sortOrder) params.set("sortOrder", sortOrder);
        router.push(`/${locale}/property-tax/weightage-master/age-weightage?${params.toString()}`);
    };

    const changePageSize = (size: number): void => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", "1");
        params.set("pageSize", String(size));
        const q = searchParams.get("q");
        if (q) params.set("q", q);
        if (selectedYear) params.set("selectedYearRange", selectedYear);
        if (constructionType.length > 0) params.set("constructionType", constructionType.join(","));
        if (sortBy) params.set("sortBy", sortBy);
        if (sortOrder) params.set("sortOrder", sortOrder);
        router.push(`/${locale}/property-tax/weightage-master/age-weightage?${params.toString()}`);
    };

    const handleClearAll = (
        addToast: (type: "success" | "error" | "info" | "warning", message: string) => void, 
        tW: (key: string) => string
    ): void => {
        clearFilters();
        setSortBy(undefined);
        setSortOrder(undefined);
        router.push(`/${locale}/property-tax/weightage-master/age-weightage`);
        addToast('info', tW('common.messages.allClearedInfo'));
    };

    const getMissingRecordsCount = (
        constructionTypeOptions: Option[],
        allAgeFactors: AgeFactorCVMaster[]
    ): number => {
        if (!selectedYear) return 0;
        const yearId = parseInt(selectedYear);
        const ranges = selectedAgeRange.length > 0 ? selectedAgeRange : ageRangeOptions.map(o => o.value);
        if (ranges.length === 0) return 0;
        
        const types = constructionType.length > 0
            ? constructionTypeOptions.filter(ct => constructionType.includes(ct.value))
            : constructionTypeOptions;
            
        const existingKeys = new Set(
            allAgeFactors
                .filter(af => af.id > 0)
                .map(af => `${af.constructionTypeId}-${af.yearRangeCVId || af.yearRangeCVID}-${af.ageFrom}-${af.ageTo}`)
        );

        let count = 0;
        types.forEach(ct => {
            const ctId = parseInt(ct.value);
            ranges.forEach(range => {
                const [from, to] = range.split("-").map(Number);
                const key = `${ctId}-${yearId}-${from}-${to}`;
                if (!existingKeys.has(key)) count++;
            });
        });
        return count;
    };

    return {
        selectedYear,
        setSelectedYear,
        constructionType,
        setConstructionType,
        factorValue,
        setFactorValue,
        ageFrom,
        setAgeFrom,
        ageTo,
        setAgeTo,
        selectedAgeRange,
        setSelectedAgeRange,
        userAddedAgeRanges,
        setUserAddedAgeRanges,
        ageRangeOptions,
        isAgeRangeAdded,
        setIsAgeRangeAdded,
        clearFilters,
        handleAgeRangeChange,
        handleAssessmentYearChange,
        handleConstructionTypeChange,
        changePage,
        changePageSize,
        handleClearAll,
        getMissingRecordsCount,
        sortBy,
        sortOrder,
        handleSort,
    };
};
