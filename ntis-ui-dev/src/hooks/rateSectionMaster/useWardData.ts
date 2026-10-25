import { useMemo, useState } from "react";
import { SectionItem } from "@/types/rateSectionMaster.types";

interface UseWardDataProps {
  sections: SectionItem[];
  sectionsTotalCount: number;
  search: string;
  pageNumber: number;
  pageSize: number;
}

export function useWardData({
  sections,
  sectionsTotalCount,
  search,
  pageNumber,
  pageSize
}: UseWardDataProps) {
  const [deletedIds, setDeletedIds] = useState<Set<number>>(new Set());

  const wardData = useMemo(() => {
    const sectionList = sections || [];
    // API already filters by rate section ID, so no additional filtering needed
    return sectionList.filter(s => {
      const id = s.id || s.rateSectionDetailsId;
      return id === undefined || !deletedIds.has(id as number);
    });
  }, [sections, deletedIds]);

  const filteredWards = useMemo(() => {
    if (!search) return wardData;
    const q = search.toLowerCase();
    return wardData.filter(w =>
      (w.wardNo)?.toLowerCase().includes(q)
    );
  }, [wardData, search]);

  const totalCount = search ? filteredWards.length : (sectionsTotalCount || filteredWards.length);
  const effectivePageSize = pageSize || 10;
  const totalPages = Math.ceil(totalCount / effectivePageSize);
  const effectivePageNumber = totalPages > 0 ? Math.min(pageNumber, totalPages) : 1;

  const paginatedWards = useMemo(() => {
    if (!search && sectionsTotalCount > 0) {
      return filteredWards;
    }
    const start = (effectivePageNumber - 1) * effectivePageSize;
    const end = start + effectivePageSize;
    return filteredWards.slice(start, end);
  }, [filteredWards, effectivePageNumber, effectivePageSize, search, sectionsTotalCount]);

  return {
    paginatedWards,
    totalCount,
    totalPages,
    effectivePageNumber,
    effectivePageSize,
    deletedIds,
    setDeletedIds
  };
}
