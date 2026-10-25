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

    const [selectedYear, setSelectedYear] = useState<string>(currentSelectedYear);
    const [constructionType, setConstructionType] = useState<string>(currentConstructionType);
    const [factorValue, setFactorValue] = useState<string>("0.00");

    const [sortBy, setSortBy] = useState<string | undefined>(initialSortBy);
    const [sortOrder, setSortOrder] = useState<string | undefined>(initialSortOrder);

    // Age Range States
    const [ageFrom, setAgeFrom] = useState<string>("");
    const [ageTo, setAgeTo] = useState<string>("");
    const [userAddedAgeRanges, setUserAddedAgeRanges] = useState<Option[]>([]);
    const [selectedAgeRange, setSelectedAgeRange] = useState<string>("");
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
        setFactorValue("0.00");
        setConstructionType("");
        setSelectedYear("");
        setAgeFrom("");
        setAgeTo("");
        setSelectedAgeRange("");
        setIsAgeRangeAdded(false);
    }, []);

    const handleAgeRangeChange = (value: string): void => {
        setSelectedAgeRange(value);
        if (value) {
            const [from, to] = value.split("-");
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
        router.push(`/${locale}/assets/configuration/master-data/weightage-master/age-weightage?${params.toString()}`);
    };

    const handleConstructionTypeChange = (value: string): void => {
        setConstructionType(value);
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", "1");
        if (value) params.set("constructionType", value);
        else params.delete("constructionType");
        router.push(`/${locale}/assets/configuration/master-data/weightage-master/age-weightage?${params.toString()}`);
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
        router.push(`/${locale}/assets/configuration/master-data/weightage-master/age-weightage?${params.toString()}`);
    };

    const changePage = (page: number, pageSize: number): void => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", String(page));
        params.set("pageSize", String(pageSize));
        const q = searchParams.get("q");
        if (q) params.set("q", q);
        if (selectedYear) params.set("selectedYearRange", selectedYear);
        if (constructionType) params.set("constructionType", constructionType);
        if (sortBy) params.set("sortBy", sortBy);
        if (sortOrder) params.set("sortOrder", sortOrder);
        router.push(`/${locale}/assets/configuration/master-data/weightage-master/age-weightage?${params.toString()}`);
    };

    const changePageSize = (size: number): void => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", "1");
        params.set("pageSize", String(size));
        const q = searchParams.get("q");
        if (q) params.set("q", q);
        if (selectedYear) params.set("selectedYearRange", selectedYear);
        if (constructionType) params.set("constructionType", constructionType);
        if (sortBy) params.set("sortBy", sortBy);
        if (sortOrder) params.set("sortOrder", sortOrder);
        router.push(`/${locale}/assets/configuration/master-data/weightage-master/age-weightage?${params.toString()}`);
    };

    const handleClearAll = (
        addToast: (type: "success" | "error" | "info" | "warning", message: string) => void, 
        tW: (key: string) => string
    ): void => {
        clearFilters();
        setSortBy(undefined);
        setSortOrder(undefined);
        router.push(`/${locale}/assets/configuration/master-data/weightage-master/age-weightage`);
        addToast('info', tW('common.messages.allClearedInfo'));
    };

    const getMissingRecordsCount = (
        constructionTypeOptions: Option[],
        allAgeFactors: AgeFactorCVMaster[]
    ): number => {
        if (!selectedYear) return 0;
        const yearId = parseInt(selectedYear);
        const ranges = selectedAgeRange ? [selectedAgeRange] : ageRangeOptions.map(o => o.value);
        if (ranges.length === 0) return 0;
        
        const types = constructionType 
            ? constructionTypeOptions.filter(ct => ct.value === constructionType) 
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
