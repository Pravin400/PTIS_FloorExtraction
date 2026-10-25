import { useState, useRef, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast, useConfirm } from "@/components/common";
import { useDebounce } from "@/hooks/useDebounce";

export interface MasterCrudActionState<TData = unknown> {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  data?: TData;
}

export interface UseMasterCrudProps<TRecord, TDto> {
  pagedData?: {
    items: TRecord[];
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  initialData?: TRecord[];
  locale: string;
  baseUrl: string;
  initialSortBy?: string;
  initialSortOrder?: "asc" | "desc";
  initialSearchTerm?: string;
  getRowName: (row: TRecord) => string;
  getRowId: (row: TRecord) => number;
  deleteTitle: string;
  deleteDescription: string;
  deleteSuccessMessage: string;
  createSuccessMessage: string;
  updateSuccessMessage: string;
  deleteErrorMessage?: string;
  saveErrorMessage?: string;
  unexpectedErrorMessage?: string;
  drawer?: "add" | "edit" | null;
  initialEditingData?: TRecord | null;
  createAction?: (prevState: MasterCrudActionState<TRecord>, dto: TDto) => Promise<MasterCrudActionState<TRecord>>;
  updateAction?: (id: number, prevState: MasterCrudActionState<TRecord>, dto: TDto) => Promise<MasterCrudActionState<TRecord>>;
  deleteAction?: (id: number) => Promise<{ success: boolean; message?: string; statusCode?: number }>;
}

export function useMasterCrud<TRecord, TDto>({
  pagedData,
  initialData,
  locale: _locale,
  baseUrl,
  initialSortBy,
  initialSortOrder,
  initialSearchTerm,
  getRowName,
  getRowId,
  deleteTitle,
  deleteDescription,
  deleteSuccessMessage,
  createSuccessMessage,
  updateSuccessMessage,
  deleteErrorMessage,
  saveErrorMessage,
  unexpectedErrorMessage,
  drawer = null,
  initialEditingData = null,
  createAction,
  updateAction,
  deleteAction,
}: UseMasterCrudProps<TRecord, TDto>) {
  const router = useRouter();
  const { confirm } = useConfirm();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [search, setSearch] = useState(initialSearchTerm || "");
  const [prevInitialSearchTerm, setPrevInitialSearchTerm] = useState(initialSearchTerm);
  const debouncedSearch = useDebounce(search, 1000);
  const isFirstMount = useRef(true);
  const lastNavigatedSearchRef = useRef((initialSearchTerm || "").trim());

  if (initialSearchTerm !== prevInitialSearchTerm) {
    setPrevInitialSearchTerm(initialSearchTerm);
    setSearch(initialSearchTerm || "");
  }

  useEffect(() => {
    lastNavigatedSearchRef.current = (initialSearchTerm || "").trim();
  }, [initialSearchTerm]);

  const [sortBy, setSortBy] = useState<string | undefined>(initialSortBy);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | undefined>(initialSortOrder);

  const records = pagedData?.items ?? initialData ?? [];
  const pageNumber = pagedData?.pageNumber ?? 1;
  const pageSize = pagedData?.pageSize ?? 10;
  const totalCount = pagedData?.totalCount ?? records.length;
  const totalPages =
    pagedData?.totalPages && pagedData.totalPages > 0
      ? pagedData.totalPages
      : Math.ceil(totalCount / (pageSize || 1)) || 1;

  const navigateWithParams = useCallback(
    (
      newPage: number,
      newPageSize: number,
      newSearch?: string,
      newSortBy?: string,
      newSortOrder?: "asc" | "desc"
    ) => {
      const params = new URLSearchParams();
      params.set("pageNumber", String(newPage));
      params.set("pageSize", String(newPageSize));

      if (newSearch) {
        params.set("searchTerm", newSearch);
      }

      const activeSortBy = newSortBy !== undefined ? newSortBy : sortBy;
      const activeSortOrder = newSortOrder !== undefined ? newSortOrder : sortOrder;

      if (activeSortBy) params.set("sortBy", activeSortBy);
      if (activeSortOrder) params.set("sortOrder", activeSortOrder);

      startTransition(() => {
        router.push(`${baseUrl}?${params.toString()}`);
      });
    },
    [baseUrl, router, sortBy, sortOrder]
  );

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    const trimmedDebounced = debouncedSearch.trim();

    if (trimmedDebounced !== lastNavigatedSearchRef.current) {
      lastNavigatedSearchRef.current = trimmedDebounced;
      navigateWithParams(1, pageSize, trimmedDebounced || undefined);
    }
  }, [debouncedSearch, navigateWithParams, pageSize]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handleSearchSubmit = () => {
    navigateWithParams(1, pageSize, search.trim() || undefined);
  };

  const handleSort = useCallback(
    (key: string) => {
      const nextOrder: "asc" | "desc" =
        sortBy === key && sortOrder === "asc" ? "desc" : "asc";

      setSortBy(key);
      setSortOrder(nextOrder);
      navigateWithParams(1, pageSize, search.trim() || undefined, key, nextOrder);
    },
    [navigateWithParams, pageSize, search, sortBy, sortOrder]
  );

  const handlePageChange = (p: number) => {
    navigateWithParams(p, pageSize, search.trim() || undefined);
  };

  const handlePageSizeChange = (size: number) => {
    navigateWithParams(1, size, search.trim() || undefined);
  };

  const handleAdd = () => {
    router.push(`${baseUrl}/add`);
  };

  const handleEdit = (row: TRecord) => {
    router.push(`${baseUrl}/edit/${getRowId(row)}`);
  };

  const handleFormClose = () => {
    router.push(baseUrl);
  };

  const handleFormSubmit = async (dto: TDto) => {
    setIsSubmitting(true);
    try {
      let result: MasterCrudActionState<TRecord>;

      const editingId = initialEditingData ? getRowId(initialEditingData) : undefined;
      if (drawer === "edit" && editingId && updateAction) {
        result = await updateAction(editingId, { success: false }, dto);
      } else if (createAction) {
        result = await createAction({ success: false }, dto);
      } else {
        toast.error(saveErrorMessage || (drawer === "edit" ? updateSuccessMessage : createSuccessMessage));
        return;
      }

      if (result.success) {
        toast.success(
          result.message ||
            (drawer === "edit" ? updateSuccessMessage : createSuccessMessage)
        );
        router.push(baseUrl);
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error(result.message || saveErrorMessage || (drawer === "edit" ? updateSuccessMessage : createSuccessMessage));
      }
    } catch {
      toast.error(unexpectedErrorMessage || saveErrorMessage || (drawer === "edit" ? updateSuccessMessage : createSuccessMessage));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (row: TRecord) => {
    confirm({
      variant: "delete",
      title: deleteTitle,
      description: deleteDescription,
      meta: {
        name: getRowName(row),
        id: getRowId(row),
      },
      onConfirm: async () => {
        if (!deleteAction) return;
        try {
          const result = await deleteAction(getRowId(row));
          if (result.success) {
            toast.success(result.message || deleteSuccessMessage);
            startTransition(() => {
              router.refresh();
            });
          } else {
            toast.error(result.message || deleteErrorMessage || deleteSuccessMessage);
          }
        } catch {
          toast.error(deleteErrorMessage || deleteSuccessMessage);
        }
      },
    });
  };

  return {
    search,
    records,
    isPending,
    isSubmitting,
    pageNumber,
    pageSize,
    totalCount,
    totalPages,
    sortBy,
    sortOrder,
    handleSearchChange,
    handleSearchSubmit,
    handleSort,
    handlePageChange,
    handlePageSizeChange,
    handleAdd,
    handleEdit,
    handleDelete,
    handleFormClose,
    handleFormSubmit,
  };
}
