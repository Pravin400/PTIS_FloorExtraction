import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { TEXT_SANITIZE } from "@/lib/utils/validation";

const sanitizeSearch = (value: string) => value.replace(TEXT_SANITIZE, '');

interface UseLinkWardHandlersParams {
  searchParams: URLSearchParams;
  router: ReturnType<typeof useRouter>;
}

export function useLinkWardHandlers({ searchParams, router }: UseLinkWardHandlersParams) {
  const handleAvailableSearch = useCallback((value: string) => {
    const sanitizedValue = sanitizeSearch(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("availablewardpage", "1");
    const trimmed = sanitizedValue.trim();
    if (trimmed) {
      params.set("availablewardq", trimmed);
    } else {
      params.delete("availablewardq");
    }
    router.push(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const handleViewAllSearch = useCallback((value: string) => {
    const sanitizedValue = sanitizeSearch(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("viewwardpage", "1");
    const trimmed = sanitizedValue.trim();
    if (trimmed) {
      params.set("viewwardq", trimmed);
    } else {
      params.delete("viewwardq");
    }
    router.push(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const handleSelectedSearch = useCallback((value: string) => {
    const sanitizedValue = sanitizeSearch(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("selectedwardpage", "1");
    const trimmed = sanitizedValue.trim();
    if (trimmed) {
      params.set("selectedwardq", trimmed);
    } else {
      params.delete("selectedwardq");
    }
    router.push(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const updateAvailablePage = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("availablewardpage", page.toString());
    router.push(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const updateAvailablePageSize = useCallback((size: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("availablewardpagesize", size.toString());
    params.set("availablewardpage", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const updateViewWardPage = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("viewwardpage", page.toString());
    router.push(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const updateViewWardPageSize = useCallback((size: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("viewwardpagesize", size.toString());
    params.set("viewwardpage", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const updateSelectedPage = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("selectedwardpage", page.toString());
    router.push(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const updateSelectedPageSize = useCallback((size: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("selectedwardpagesize", size.toString());
    params.set("selectedwardpage", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  return {
    handleAvailableSearch,
    handleViewAllSearch,
    handleSelectedSearch,
    updateAvailablePage,
    updateAvailablePageSize,
    updateViewWardPage,
    updateViewWardPageSize,
    updateSelectedPage,
    updateSelectedPageSize
  };
}
