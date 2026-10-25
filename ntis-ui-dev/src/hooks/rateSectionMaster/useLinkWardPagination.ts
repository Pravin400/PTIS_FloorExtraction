import { useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { TEXT_SANITIZE } from "@/lib/utils/validation";
import { RateSectionWardItem } from "@/types/rateSectionMaster.types";
 
const sanitizeSearch = (value: string) => value.replace(TEXT_SANITIZE, '');
 
interface UseLinkWardPaginationParams {
  open: boolean;
  ssrSelectedWards: string[];
  ssrSelectedWardsTotalCount: number;
  ssrAllWards: RateSectionWardItem[];
  ssrAllWardsCount: number;
  ssrViewAllWards: RateSectionWardItem[];
  ssrViewAllWardsTotalCount: number;
  ssrViewAllWardsTotalPages: number;
}
 
// This function uses React hooks and must be named with the 'use' prefix to comply with the rules of hooks and avoid lint errors.
export function useLinkWardPagination({
  open,
  ssrSelectedWards,
  ssrSelectedWardsTotalCount,
  ssrAllWards,
  ssrAllWardsCount,
  ssrViewAllWards,
  ssrViewAllWardsTotalCount,
  ssrViewAllWardsTotalPages
}: UseLinkWardPaginationParams) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
 
  const activeTab = searchParams.get("wardTab") || "available";
  const [loading, setLoading] = useState(false);
  const [selectedWardsTotalCount, setSelectedWardsTotalCount] = useState(ssrSelectedWardsTotalCount);
  const [selectedWards, setSelectedWards] = useState<string[]>(ssrSelectedWards);
  const [checkedAvailable, setCheckedAvailable] = useState<Set<string>>(new Set());
  const [checkedSelected, setCheckedSelected] = useState<Set<string>>(new Set());
 
  const availableSearchParam = searchParams.get("availablewardq") || "";
  const viewAllSearchParam = searchParams.get("viewwardq") || "";
  const selectedSearchParam = searchParams.get("selectedwardq") || "";
 
  const availableSearch = useMemo(() => sanitizeSearch(availableSearchParam), [availableSearchParam]);
  const viewAllSearch = useMemo(() => sanitizeSearch(viewAllSearchParam), [viewAllSearchParam]);
  const selectedSearch = useMemo(() => sanitizeSearch(selectedSearchParam), [selectedSearchParam]);
 
  const availablePage = Number(searchParams.get("availablewardpage")) || 1;
  const availablePageSize = Number(searchParams.get("availablewardpagesize")) || 10;
  const viewWardPage = Number(searchParams.get("viewwardpage")) || 1;
  const viewWardPageSize = Number(searchParams.get("viewwardpagesize")) || 10;
  const selectedPage = Number(searchParams.get("selectedwardpage")) || 1;
  const selectedPageSize = Number(searchParams.get("selectedwardpagesize")) || 10;
 
  const totalViewAllPages = useMemo(() => {
    if (viewAllSearchParam) {
      return ssrViewAllWardsTotalPages || Math.ceil(ssrViewAllWardsTotalCount / viewWardPageSize) || 1;
    }
    return Math.ceil(ssrAllWardsCount / viewWardPageSize) || 1;
  }, [ssrAllWardsCount, ssrViewAllWardsTotalCount, ssrViewAllWardsTotalPages, viewWardPageSize, viewAllSearchParam]);
 
  const viewAllWards = useMemo(() => {
    if (!open || activeTab !== "viewAll") return [];
 
    if (viewAllSearchParam) {
      return ssrViewAllWards;
    } else {
      const start = (viewWardPage - 1) * viewWardPageSize;
      const end = start + viewWardPageSize;
      return ssrAllWards.slice(start, end);
    }
  }, [open, activeTab, viewWardPage, viewWardPageSize, viewAllSearchParam, ssrAllWards, ssrViewAllWards]);
 
  const filteredSelected = useMemo(() => {
    if (!selectedSearch) return selectedWards;
    const q = selectedSearch.toLowerCase();
    return selectedWards.filter(w => w.toLowerCase().includes(q));
  }, [selectedSearch, selectedWards]);
 
  const [prevOpen, setPrevOpen] = useState(open);
 
  if (open !== prevOpen) {
    setPrevOpen(open);
    setSelectedWards(ssrSelectedWards);
    setSelectedWardsTotalCount(ssrSelectedWardsTotalCount);
    if (!open) {
      setCheckedAvailable(new Set());
      setCheckedSelected(new Set());
    }
  }
 
  const handleTabChange = useCallback((tabValue: string | number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("wardTab", String(tabValue));
    params.delete("availablewardpage");
    params.delete("viewwardpage");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, pathname, router]);
 
  return {
    activeTab,
    loading,
    setLoading,
    selectedWardsTotalCount,
    setSelectedWardsTotalCount,
    selectedWards,
    setSelectedWards,
    checkedAvailable,
    setCheckedAvailable,
    checkedSelected,
    setCheckedSelected,
    availableSearch,
    viewAllSearch,
    selectedSearch,
    availablePage,
    availablePageSize,
    viewWardPage,
    viewWardPageSize,
    selectedPage,
    selectedPageSize,
    totalViewAllPages,
    viewAllWards,
    filteredSelected,
    handleTabChange
  };
}