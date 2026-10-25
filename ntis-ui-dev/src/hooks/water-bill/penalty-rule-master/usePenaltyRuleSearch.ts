"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSearchNavigation } from "@/hooks/useSearchNavigation";

export interface PenaltyRuleFilterState {
  searchTerm?: string;
  financialYearId?: number | null;
  connectionCategoryId?: number | null;
  geographyUnitId?: number | null;
  chargeHeadId?: number | null;
  penaltyType?: string | null;
  statusFilter?: "all" | "active" | "inactive";
}

export interface UsePenaltyRuleSearchProps {
  pageSize: number;
  locale: string;
  startTransition: (callback: () => void) => void;
  initialFilters?: Partial<PenaltyRuleFilterState>;
  basePath?: string;
}

export function usePenaltyRuleSearch({
  pageSize,
  locale,
  startTransition,
  initialFilters,
  basePath = "/water-bill/penalty-rule-master",
}: UsePenaltyRuleSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSearchTerm = searchParams?.get("q") ?? searchParams?.get("searchTerm") ?? "";

  const [search, setSearch] = useState<string>(
    initialFilters?.searchTerm ?? currentSearchTerm ?? ""
  );
  const [prevUrlSearch, setPrevUrlSearch] = useState(currentSearchTerm);

  if (prevUrlSearch !== currentSearchTerm) {
    setPrevUrlSearch(currentSearchTerm);
    setSearch(currentSearchTerm);
  }

  const [financialYearId, setFinancialYearId] = useState<number | undefined>(
    initialFilters?.financialYearId ?? undefined
  );
  const [connectionCategoryId, setConnectionCategoryId] = useState<number | undefined>(
    initialFilters?.connectionCategoryId ?? undefined
  );
  const [geographyUnitId, setGeographyUnitId] = useState<number | undefined>(
    initialFilters?.geographyUnitId ?? undefined
  );
  const [chargeHeadId, setChargeHeadId] = useState<number | undefined>(
    initialFilters?.chargeHeadId ?? undefined
  );
  const [penaltyType, setPenaltyType] = useState<string | undefined>(
    initialFilters?.penaltyType ?? undefined
  );
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    initialFilters?.statusFilter || "all"
  );

  const extraParams = useMemo(() => {
    const params: Record<string, string | number | undefined> = {};
    if (financialYearId !== undefined) params.financialYearId = financialYearId;
    if (connectionCategoryId !== undefined) params.connectionCategoryId = connectionCategoryId;
    if (geographyUnitId !== undefined) params.geographyUnitId = geographyUnitId;
    if (chargeHeadId !== undefined) params.chargeHeadId = chargeHeadId;
    if (penaltyType !== undefined && penaltyType !== "") params.penaltyType = penaltyType;
    if (statusFilter && statusFilter !== "all") params.status = statusFilter;
    return params;
  }, [financialYearId, connectionCategoryId, geographyUnitId, chargeHeadId, penaltyType, statusFilter]);

  useSearchNavigation({
    search,
    currentSearchTerm,
    pageSize,
    locale,
    basePath,
    startTransition,
    includePaginationParams: true,
    extraParams,
  });

  const navigateWithFilters = useCallback(
    (overrides: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("pageSize", String(pageSize));
      const merged = {
        q: search,
        financialYearId,
        connectionCategoryId,
        geographyUnitId,
        chargeHeadId,
        penaltyType,
        status: statusFilter,
        ...overrides,
      };
      Object.entries(merged).forEach(([k, v]) => {
        if (v !== undefined && v !== "" && v !== "all") {
          params.set(k, String(v));
        }
      });
      startTransition(() => {
        router.push(`/${locale}${basePath}?${params.toString()}`);
      });
    },
    [
      pageSize,
      search,
      financialYearId,
      connectionCategoryId,
      geographyUnitId,
      chargeHeadId,
      penaltyType,
      statusFilter,
      locale,
      basePath,
      router,
      startTransition,
    ]
  );

  const handleSearchChange = useCallback((val: string) => {
    const sanitized = typeof val === "string" ? val.replace(/[!@#$%^&*()_+={}[\]:;"'<>,.?\\/|`~]/g, "") : "";
    setSearch(sanitized);
  }, []);

  const handleFinancialYearChange = useCallback(
    (id?: number) => {
      setFinancialYearId(id);
      navigateWithFilters({ financialYearId: id });
    },
    [navigateWithFilters]
  );

  const handleConnectionCategoryChange = useCallback(
    (id?: number) => {
      setConnectionCategoryId(id);
      navigateWithFilters({ connectionCategoryId: id });
    },
    [navigateWithFilters]
  );

  const handleGeographyChange = useCallback(
    (id?: number) => {
      setGeographyUnitId(id);
      navigateWithFilters({ geographyUnitId: id });
    },
    [navigateWithFilters]
  );

  const handleChargeHeadChange = useCallback(
    (id?: number) => {
      setChargeHeadId(id);
      navigateWithFilters({ chargeHeadId: id });
    },
    [navigateWithFilters]
  );

  const handlePenaltyTypeChange = useCallback(
    (type?: string) => {
      setPenaltyType(type);
      navigateWithFilters({ penaltyType: type });
    },
    [navigateWithFilters]
  );

  const handleStatusFilterChange = useCallback(
    (st: "all" | "active" | "inactive") => {
      setStatusFilter(st);
      navigateWithFilters({ status: st });
    },
    [navigateWithFilters]
  );

  const handleReset = useCallback(() => {
    setSearch("");
    setFinancialYearId(undefined);
    setConnectionCategoryId(undefined);
    setGeographyUnitId(undefined);
    setChargeHeadId(undefined);
    setPenaltyType(undefined);
    setStatusFilter("all");
    navigateWithFilters({
      q: "",
      financialYearId: "",
      connectionCategoryId: "",
      geographyUnitId: "",
      chargeHeadId: "",
      penaltyType: "",
      status: "all",
    });
  }, [navigateWithFilters]);

  return {
    search,
    searchTerm: search,
    currentSearchTerm,
    setSearch,
    setSearchTerm: setSearch,
    financialYearId,
    setFinancialYearId,
    connectionCategoryId,
    setConnectionCategoryId,
    geographyUnitId,
    setGeographyUnitId,
    chargeHeadId,
    setChargeHeadId,
    penaltyType,
    setPenaltyType,
    statusFilter,
    setStatusFilter,
    navigateWithFilters,
    handleSearchChange,
    handleFinancialYearChange,
    handleConnectionCategoryChange,
    handleGeographyChange,
    handleChargeHeadChange,
    handlePenaltyTypeChange,
    handleStatusFilterChange,
    handleReset,
  };
}
