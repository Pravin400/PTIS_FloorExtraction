"use client";

import React from "react";
import { Tags } from "lucide-react";
import { PageContainer, SearchInput, Select } from "@/components/common";
import TableHeader from "@/components/common/TableHeader";
import { MasterTable } from "@/components/common/MasterTable";
import { EditButton } from "@/components/common/ActionButtons";
import type { AliasMasterProps, AliasMaster as AliasMasterType } from "@/types/alias-master.types";
import { useAliasMasterList } from "@/hooks/configuration-settings/alias-master/useAliasMasterList";
import { AliasMasterStatsCards } from "./AliasMasterStatsCards";

export function AliasMaster(props: AliasMasterProps) {
  const {
    router,
    locale,
    t,
    tCommon,
    isPending,
    search,
    handleSearchChange,
    columns,
    changePage,
    changePageSize,
    start,
    end,
  } = useAliasMasterList(props);

  const { data, pageNumber, pageSize, totalCount, totalPages, counts } = props;

  return (
    <PageContainer>
      <div className="space-y-4">
        <TableHeader
          title={t("title")}
          subtitle={t("subtitle")}
          icon={Tags}
          actionLabel={t("add")}
          onActionClick={() => {
            router.push(`/${locale}/configuration-settings/alias-master/add`);
          }}
          rightContent={
            <div className="flex w-full justify-end">
              <SearchInput
                value={search}
                onChange={handleSearchChange}
                placeholder={t("searchPlaceholder") || "Search alias records..."}
                className="mb-0 w-full text-gray-900"
              />
            </div>
          }
        />
          <AliasMasterStatsCards counts={counts} t={t} />
        <MasterTable<AliasMasterType>
          columns={columns}
          data={data}
          loading={isPending}
          height="lg"
          pageNumber={pageNumber}
          pageSize={pageSize}
          totalCount={totalCount}
          totalPages={totalPages}
          onPageChange={changePage}
          renderActions={(row) => (
            <EditButton aria-label={t("edit")} onClick={() => router.push(`/${locale}/configuration-settings/alias-master/edit/${row.id}`)} />
          )}
          actionLabel={t("actions")}
          paginationConfig={{ enabled: true, showPageSizeSelector: false }}
          footerLeftContent={
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                {tCommon("table.showing")} {start} {tCommon("table.to")} {end} {tCommon("table.of")} {totalCount} {tCommon("table.entries")}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{tCommon("table.rowsPerPage")}:</span>
                <Select
                  value={String(pageSize)}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    changePageSize(Number(e.target.value));
                  }}
                  options={[10, 20, 30, 40, 50].map((s) => ({
                    label: String(s),
                    value: String(s),
                  }))}
                  selectSize="sm"
                  className="w-20"
                  ariaLabel={tCommon("table.rowsPerPage") || "Rows per page"}
                />
              </div>
            </div>
          }
          getRowKey={(row) => String(row.id)}
        />
      </div>
    </PageContainer>
  );
}
