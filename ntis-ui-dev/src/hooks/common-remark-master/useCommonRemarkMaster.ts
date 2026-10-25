import { useState, useCallback, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { useConfirm } from "@/components/common/ConfirmProvider";
import type { CommonRemark, CommonRemarkProps } from "@/types/common-remark-master/common-remark.types";
import { deleteCommonRemarkAction } from "@/app/[locale]/configuration-settings/common-remark-master/actions";
import { TEXT_SANITIZE } from "@/lib/utils/validation-rules";
import { useSearchNavigation } from "@/hooks/useSearchNavigation";

export function useCommonRemarkMaster({
  data,
  pageNumber,
  pageSize,
  totalCount,
  search = "",
  filterType = "All",
  sortBy,
  sortOrder,
  categories,
}: CommonRemarkProps) {
  const router = useRouter();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const { confirm } = useConfirm();

  const t = useTranslations("remarkMaster");
  const tCommon = useTranslations("common");

  const [prevSearch, setPrevSearch] = useState(search);
  const [searchValue, setSearchValue] = useState(search);

  if (search !== prevSearch) {
    setPrevSearch(search);
    setSearchValue(search);
  }

  const extraParams = useMemo(() => ({
    filterType: filterType !== "All" ? filterType : undefined,
  }), [filterType]);

  useSearchNavigation({
    search: searchValue,
    currentSearchTerm: search,
    pageSize,
    locale,
    sortBy,
    sortOrder,
    basePath: "/configuration-settings/common-remark-master",
    startTransition,
    extraParams,
  });

  const base = `/${locale}/configuration-settings/common-remark-master`;

  const normalizedData = useMemo(
    () => (data ?? []).map((x) => ({ ...x, status: x.isActive })),
    [data]
  );

  const buildUrl = useCallback(
    (p: number, size: number, term: string, fType?: string, sBy?: string, sOrder?: string) => {
      const params = new URLSearchParams();
      params.set("page", String(p));
      params.set("pageSize", String(size));

      if (term.trim()) {
        params.set("q", term.trim());
      }
      if (fType && fType !== "All") {
        params.set("filterType", fType);
      }
      if (sBy) {
        params.set("sortBy", sBy);
      }
      if (sOrder) {
        params.set("sortOrder", sOrder);
      }

      return `${base}?${params.toString()}`;
    },
    [base]
  );

  const changePage = useCallback((p: number) => {
    startTransition(() => {
      router.push(buildUrl(p, pageSize, searchValue, filterType, sortBy, sortOrder));
    });
  }, [router, buildUrl, pageSize, searchValue, filterType, sortBy, sortOrder]);

  const changePageSize = useCallback((size: number) => {
    startTransition(() => {
      router.push(buildUrl(1, size, searchValue, filterType, sortBy, sortOrder));
    });
  }, [router, buildUrl, searchValue, filterType, sortBy, sortOrder]);

  const handleSearchSubmit = useCallback((val: string) => {
    const sanitized = val.replace(TEXT_SANITIZE, "");
    setSearchValue(sanitized);
  }, []);

  const handleFilterChange = useCallback((val: string) => {
    startTransition(() => {
      router.push(buildUrl(1, pageSize, searchValue, val, sortBy, sortOrder));
    });
  }, [router, buildUrl, pageSize, searchValue, sortBy, sortOrder]);

  const handleSort = useCallback((key: string) => {
    const nextOrder = sortBy === key && sortOrder === "asc" ? "desc" : "asc";
    startTransition(() => {
      router.push(buildUrl(1, pageSize, searchValue, filterType, key, nextOrder));
    });
  }, [sortBy, sortOrder, router, buildUrl, pageSize, searchValue, filterType]);

  const handleDelete = useCallback((row: CommonRemark) => {
    confirm({
      variant: "delete",
      title: `${t("table.columns.remarkType")}: ${row.remarkType}`,
      description: t("messages.deleteConfirm"),
      meta: {
        name: row.remark,
      },
      onConfirm: async () => {
        try {
          const fd = new FormData();
          fd.append("id", String(row.id));
          fd.append("locale", locale);
          const result = await deleteCommonRemarkAction(fd);

          if (result.success) {
            toast.success(t("messages.deleteSuccess"));
            startTransition(() => {
              router.refresh();
            });
          } else {
            toast.error(result.message || tCommon("errors.deleteError"));
          }
        } catch {
          toast.error(tCommon("errors.deleteError"));
        }
      },
    });
  }, [confirm, locale, t, tCommon, router]);

  const filterOptions = useMemo(() => [
    { label: t("filter.all") || "All Types", value: "All" },
    ...categories.map((c) => ({ label: c.categoryName, value: c.categoryName })),
  ], [categories, t]);

  const paginationInfo = useMemo(() => {
    const startIdx = totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
    const endIdx = Math.min(startIdx + pageSize - 1, totalCount);
    return { startIdx, endIdx };
  }, [pageNumber, pageSize, totalCount]);

  return {
    isPending,
    searchValue,
    categories,
    normalizedData,
    filterOptions,
    paginationInfo,
    base,
    t,
    tCommon,
    changePage,
    changePageSize,
    handleSearchSubmit,
    handleFilterChange,
    handleSort,
    handleDelete,
  };
}
