"use client";

import { useEffect, useState, useCallback, useTransition, useMemo } from "react";
import { useSearchParams, usePathname, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import CommonPropertyTable from "./CommonPropertyTable";
import { toast } from "sonner";
import { ApartmentQCDetail } from "@/types/apartmentQC.types";
import { getApartmentQCColumns } from "./apartmentQC.columns";
import { transformApartmentData } from "./apartmentQC.utils";
import { useRouter } from "next/navigation";
import { useColumnFilters } from "@/hooks/apartmentQc/useColumnFilters";
import { TEXT_SANITIZE } from "@/lib/utils/validation";

interface ResidentialProps {
  initialData: ApartmentQCDetail[];
  initialTotalCount: number;
  initialPageNumber: number;
  initialPageSize: number;
  initialTotalPages: number;
  initialSearchTerm: string;
  wardId?: number | string;
  propertyNo?: string;
  partitionNo?: string;
  error?: string;
}

const Residential = ({
  initialData,
  initialTotalCount,
  initialPageNumber,
  initialPageSize,
  initialTotalPages,
  initialSearchTerm,
  wardId = '',
  propertyNo = '',
  partitionNo = '',
  error,
}: ResidentialProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;
  const [isPending, startTransition] = useTransition();
  const activeTab = searchParams.get("subTab") || "rateable";
  const sortBy = searchParams.get("sortBy") || "";
  const sortOrder = searchParams.get("sortOrder") || "";

  // Column filters
  const { activeFilters, handleFilterChange, fetchFilterOptions, isFilterPending } = useColumnFilters({
    wardId,
    propertyNo,
  });

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const [searchQuery, setSearchQuery] = useState(initialSearchTerm);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);

  const updateQueryParams = useCallback((newParams: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === undefined || value === "") params.delete(key);
      else params.set(key, String(value));
    });
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }, [pathname, router, searchParams]);

  const handleRowClick = useCallback((row: Record<string, unknown>) => {
    const urlParams = new URLSearchParams();
    
    // Use pdnId (property details ID) as primary identifier for the specific unit
    const propertyIdVal = String(row.pdnId || row.id || row.propertyDetailsId || row.propertyId || '');
    if (!propertyIdVal) return;
    
    // Set essential params for QuickDataEntry
    if (wardId) urlParams.set('wardId', String(wardId));
    if (propertyNo) urlParams.set('propertyNo', propertyNo);
    // All apartment units share the parent property's partition number
    if (partitionNo) urlParams.set('partitionNo', partitionNo);
    if (row.wardNo) urlParams.set('wardNo', String(row.wardNo));
    
    // Set return navigation params
    urlParams.set('returnTab', 'propertydetails');
    urlParams.set('valuationTab', 'apartment');
    urlParams.set('appartmentTab', 'residential');
    urlParams.set('subTab', activeTab);

    // Navigate to QuickDataEntry Property page with the property
    router.push(`/${locale}/property-tax/ptis/QuickDataEntry/${propertyIdVal}/Property?${urlParams.toString()}`);
  }, [router, locale, wardId, propertyNo, partitionNo, activeTab]);

  const handleSort = useCallback((columnKey: string) => {
    const nextSortOrder = sortBy === columnKey && sortOrder === "asc" ? "desc" : "asc";
    updateQueryParams({ sortBy: columnKey, sortOrder: nextSortOrder, pageNumber: 1 });
  }, [sortBy, sortOrder, updateQueryParams]);

  const tAqc = useTranslations("appartmentQC");
  const columns = useMemo(() => getApartmentQCColumns('residential', activeTab, tAqc, initialPageNumber, initialPageSize), [activeTab, tAqc, initialPageNumber, initialPageSize]);
  const transformedData = useMemo(() => transformApartmentData(initialData, 'residential'), [initialData]);

  return (
    <div className="p-4">
      <CommonPropertyTable
        columns={columns} data={transformedData} title={tAqc("apartmentTabs.residentialTitle")} activeTab={activeTab}
        searchQuery={searchQuery} onSearchChange={(q) => { 
          const sanitized = q.replace(TEXT_SANITIZE, '');
          setSearchQuery(sanitized); 
          updateQueryParams({ searchTerm: sanitized, pageNumber: 1 }); 
        }}
        onRowClick={handleRowClick}
        loading={isPending || isFilterPending} isAutoScrolling={isAutoScrolling} onToggleAutoScroll={() => setIsAutoScrolling(!isAutoScrolling)}
        pageNumber={initialPageNumber} pageSize={initialPageSize} totalCount={initialTotalCount} totalPages={initialTotalPages}
        onPageChange={(p) => updateQueryParams({ pageNumber: p })} onPageSizeChange={(s) => updateQueryParams({ pageSize: s, pageNumber: 1 })}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onFetchFilterOptions={fetchFilterOptions}
      />
    </div>
  );
};

export default Residential;
