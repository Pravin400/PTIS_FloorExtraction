"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MasterTable } from "@/components/common/MasterTable";
import type { PolicyConfiguration, PolicyConfigurationMasterProps } from "@/types/policy-configuration.types";
import { EditButton } from "@/components/common/ActionButtons";
import { useTranslations, useLocale } from "next-intl";
import { getPolicyConfigurationColumns } from "./PolicyConfigurationColumn";
import { PageContainer, SearchInput } from "@/components/common";
import TableHeader from "@/components/common/TableHeader";
import { TEXT_SANITIZE } from "@/lib/utils/validation-rules";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

export default function PolicyConfigurationMaster({
  data,
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  search = "",
}: PolicyConfigurationMasterProps) {
  const router = useRouter();

  const t = useTranslations("policyConfiguration");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const categoryLabel = useAliasLabel("Category", t("aliasFallback.category"));

  const base = `/${locale}/property-tax/policy-configuration`;

  // Search input state
  const [searchTermState, setSearchTermState] = useState(search);
  const [prevSearch, setPrevSearch] = useState(search);

  // Sync search state with URL when search changes
  useEffect(() => {
    if (search !== prevSearch) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchTermState(search);
      setPrevSearch(search);
    }
  }, [search, prevSearch]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTermState === search) return;
      
      const trimmed = searchTermState.trim();
      const url = trimmed
        ? `${base}?page=1&pageSize=${pageSize}&search=${encodeURIComponent(trimmed)}`
        : `${base}?page=1&pageSize=${pageSize}`;
      router.push(url);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTermState, search, base, pageSize, router]);

 const normalizedData = useMemo(() => {
    const list = (data ?? []).map((x) => ({ ...x, status: x.isActive }));
    const trimmedSearch = search.trim().toLowerCase();
    
    if (trimmedSearch) {
      list.sort((a, b) => {
        const aCode = a.policyCode?.toLowerCase() || "";
        const bCode = b.policyCode?.toLowerCase() || "";
        const aStarts = aCode.startsWith(trimmedSearch);
        const bStarts = bCode.startsWith(trimmedSearch);
        
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        
        return aCode.localeCompare(bCode);
      });
    }
    
    return list;
  }, [data, search]);
  const columns = useMemo(() => getPolicyConfigurationColumns(t, categoryLabel), [t, categoryLabel]);

  /**
   * ✅ BACKEND PAGINATION
   */
  const changePage = (p: number) => {
    const trimmedSearch = search.trim();
    const url = trimmedSearch
      ? `${base}?page=${p}&pageSize=${pageSize}&search=${encodeURIComponent(trimmedSearch)}`
      : `${base}?page=${p}&pageSize=${pageSize}`;
    router.push(url);
  };

  const changePageSize = (size: number) => {
    const trimmedSearch = search.trim();
    const url = trimmedSearch
      ? `${base}?page=1&pageSize=${size}&search=${encodeURIComponent(trimmedSearch)}`
      : `${base}?page=1&pageSize=${size}`;
    router.push(url);
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <TableHeader
          title={t("list.title")}
          subtitle={t("list.subtitle")}
          icon="settings"
          rightContent={
            <div className="flex w-full justify-end">
              <SearchInput
                value={searchTermState}
                onChange={(value) => setSearchTermState(value.replace(TEXT_SANITIZE, ""))}
                placeholder={t("list.filters.search", { category: categoryLabel }) || "Search Policy Configuration..."}
                className="mb-0 w-full text-gray-900"
              />
            </div>
          }
        />

        <MasterTable<PolicyConfiguration>
          columns={columns}
          data={normalizedData}
          loading={false}
          pageNumber={pageNumber}
          pageSize={pageSize}
          totalCount={totalCount}
          totalPages={totalPages}
          onPageChange={changePage}
          onPageSizeChange={changePageSize}
          paginationConfig={{ enabled: true, showPageSizeSelector: true }}
          
          renderActions={(row) => (
            <EditButton
              aria-label={tCommon("table.actions.edit")}
              onClick={() =>
                router.push(`${base}/edit/${row.id}`)
              }
            />
          )}
          actionLabel={t("list.table.actions")}
          getRowKey={(row) => row.id}
        />
      </div>
    </PageContainer>
  );
}
