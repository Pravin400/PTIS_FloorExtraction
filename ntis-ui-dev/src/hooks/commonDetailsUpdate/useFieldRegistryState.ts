/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
import { useState, useCallback, useEffect } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { PagedResponse } from "@/types/common.types";
import { BulkUpdateMaster, FieldRegistrySchema, CommonDetailsUpdateActions, FieldRegistryTable, SourceTableField } from "@/types/common-details-update/common-details-update.types";
import { useFieldRegistryForm } from "./useFieldRegistryForm";

export const useFieldRegistryState = (
  initialFields: PagedResponse<BulkUpdateMaster> | BulkUpdateMaster[] = [],
  initialSchemas: FieldRegistrySchema[] = [],
  initialSourceTables: FieldRegistryTable[] = [],
  initialSourceTableFields: SourceTableField[] = [],
  actions: Partial<CommonDetailsUpdateActions> = {}
) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [fields, setFields] = useState<BulkUpdateMaster[]>(() => {
    if (Array.isArray(initialFields)) {
      return initialFields;
    }
    if (initialFields && "items" in initialFields) {
      return initialFields.items || [];
    }
    return [];
  });

  const [totalCount, setTotalCount] = useState<number>(() => {
    if (Array.isArray(initialFields)) {
      return initialFields.length;
    }
    if (initialFields && "totalCount" in initialFields) {
      return initialFields.totalCount || 0;
    }
    return 0;
  });

  const [statusFilter, setStatusFilterState] = useState("all");
  const [searchTerm, setSearchTermState] = useState(searchParams.get("searchTerm") || "");
  const [loading, setLoading] = useState(false);

  const pageParam = Number(searchParams.get("pageNumber") || searchParams.get("page")) || 1;
  const sizeParam = Number(searchParams.get("pageSize")) || 10;

  const [pageNumber, setPageNumberState] = useState(pageParam);
  const [pageSize, setPageSizeState] = useState(sizeParam);

  useEffect(() => {
    setPageNumberState(pageParam);
  }, [pageParam]);

  useEffect(() => {
    setPageSizeState(sizeParam);
  }, [sizeParam]);

  useEffect(() => {
    if (Array.isArray(initialFields)) {
      setFields(initialFields);
      setTotalCount(initialFields.length);
    } else if (initialFields && "items" in initialFields) {
      setFields(initialFields.items || []);
      setTotalCount(initialFields.totalCount || (initialFields.items ? initialFields.items.length : 0));
    }
    setLoading(false);
  }, [initialFields]);

  const setStatusFilter = (val: string) => {
    setStatusFilterState(val);
    setPageNumber(1);
  };

  const setSearchTerm = (val: string) => {
    setSearchTermState(val);
    setPageNumberState(1);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(searchParams.toString());
      if (val) params.set("searchTerm", val); else params.delete("searchTerm");
      params.set("pageNumber", "1");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  };

  const refreshFieldsList = useCallback(async (targetPage?: number, targetSize?: number, showLoading: boolean = true, term?: string) => {
    if (!actions.getFieldRegistriesAction) return;

    const pNum = targetPage !== undefined ? targetPage : 1;
    const pSize = targetSize !== undefined ? targetSize : -1;

    if (showLoading) {
      setLoading(true);
    }
    try {
      const res = await actions.getFieldRegistriesAction(pNum, pSize, undefined, term);
      if (res.success && res.data) {
        const data = res.data;
        if (data && "items" in data) {
          setFields(data.items || []);
          setTotalCount(data.totalCount || (data.items ? data.items.length : 0));
        } else if (Array.isArray(data)) {
          setFields(data);
          setTotalCount(data.length);
        }
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [actions.getFieldRegistriesAction]);

  // Trigger server-side search whenever searchTerm, pageNumber, or pageSize changes
  useEffect(() => {
    const timer = setTimeout(() => {
      refreshFieldsList(pageNumber, pageSize, true, searchTerm);
    }, 0); // immediate on page/size change; searchTerm is already debounced at the UI layer
    return () => clearTimeout(timer);
  }, [searchTerm, pageNumber, pageSize]);

  const setPageNumber = useCallback((val: number) => {
    setPageNumberState(val);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(searchParams.toString());
      params.set("pageNumber", String(val));
      if (!params.has("pageSize")) {
        params.set("pageSize", String(pageSize));
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [pathname, router, searchParams, pageSize]);

  const setPageSize = useCallback((val: number) => {
    setPageSizeState(val);
    setPageNumberState(1);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(searchParams.toString());
      params.set("pageSize", String(val));
      params.set("pageNumber", "1");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [pathname, router, searchParams]);

  const formState = useFieldRegistryForm(fields, refreshFieldsList, initialSchemas, initialSourceTables, initialSourceTableFields, actions);

  const toggleFieldStatus = async (code: string, isActive: boolean) => {
    if (actions.setFieldRegistryStatusAction) {
      setLoading(true);
      try {
        return await actions.setFieldRegistryStatusAction(code, isActive);
      } catch (err) {
        setLoading(false);
        throw err;
      }
    }
    return { success: false, error: "Action not available" };
  };

  return {
    fields, setFields,
    refreshFieldsList,
    ...formState,

    statusFilter, setStatusFilter,
    searchTerm, setSearchTerm,
    pageNumber, setPageNumber,
    pageSize, setPageSize,
    totalCount,
    loading,
    toggleFieldStatus,
    setFieldRegistryStatusAction: actions.setFieldRegistryStatusAction,
  };
};
