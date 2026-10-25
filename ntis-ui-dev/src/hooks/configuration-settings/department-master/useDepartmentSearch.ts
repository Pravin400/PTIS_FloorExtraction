"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface UseDepartmentSearchProps {
  pageSize: number;
  startTransition: (callback: () => void) => void;
  status?: string;
  initialSearch?: string;
}

export function useDepartmentSearch({
  pageSize,
  startTransition,
  status: initialStatus,
  initialSearch = "",
}: UseDepartmentSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlSearch = searchParams.get("search") ?? initialSearch;
  const urlStatus = searchParams.get("status") ?? initialStatus ?? "";

  const [prevUrlSearch, setPrevUrlSearch] = useState(urlSearch);
  const [search, setSearch] = useState(urlSearch);

  if (urlSearch !== prevUrlSearch) {
    setPrevUrlSearch(urlSearch);
    setSearch(urlSearch);
  }

  const [prevUrlStatus, setPrevUrlStatus] = useState(urlStatus);
  const [selectedStatus, setSelectedStatus] = useState(urlStatus);

  if (urlStatus !== prevUrlStatus) {
    setPrevUrlStatus(urlStatus);
    setSelectedStatus(urlStatus);
  }

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up any pending debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const updateUrl = useCallback((newSearch: string, newStatus: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    params.set("pageSize", String(pageSize));
    
    const trimmed = newSearch.trim();
    if (trimmed) {
      params.set("search", trimmed);
    } else {
      params.delete("search");
    }
    
    if (newStatus && newStatus !== "all") {
      params.set("status", newStatus);
    } else {
      params.delete("status");
    }

    const newQuery = params.toString();
    const currentQuery = searchParams.toString();
    if (newQuery !== currentQuery) {
      startTransition(() => {
        router.push(`${pathname}?${newQuery}`);
      });
    }
  }, [searchParams, pageSize, pathname, router, startTransition]);

  const handleSearchChange = useCallback((val: string) => {
    setSearch(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const delay = val.trim() ? 500 : 150;
    searchTimeoutRef.current = setTimeout(() => {
      updateUrl(val, selectedStatus);
    }, delay);
  }, [selectedStatus, updateUrl]);

  const handleSearchSubmit = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    updateUrl(search, selectedStatus);
  }, [search, selectedStatus, updateUrl]);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>, value?: string) => {
    const val = value !== undefined ? value : e.target.value;
    setSelectedStatus(val);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    updateUrl(search, val);
  };

  return {
    search,
    currentSearchTerm: urlSearch,
    handleSearchChange,
    handleSearchSubmit,
    selectedStatus,
    handleStatusChange,
  };
}
