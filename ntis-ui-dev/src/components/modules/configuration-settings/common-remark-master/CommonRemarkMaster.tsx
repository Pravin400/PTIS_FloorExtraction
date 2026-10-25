"use client";

import React, { useMemo, startTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText } from "lucide-react";

import { PageContainer, TableHeader, SearchInput, Select } from "@/components/common";
import { MasterTable } from "@/components/common/MasterTable";
import { EditButton, DeleteButton } from "@/components/common/ActionButtons";
import type { CommonRemark, CommonRemarkProps } from "@/types/common-remark-master/common-remark.types";
import { getCommonRemarkColumns } from "./CommonRemarkColumns";
import { useCommonRemarkMaster } from "@/hooks/common-remark-master/useCommonRemarkMaster";

export default function CommonRemarkMaster(props: CommonRemarkProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    isPending,
    searchValue,
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
  } = useCommonRemarkMaster(props);

  const { pageNumber, pageSize, totalCount, totalPages, filterType, sortBy, sortOrder } = props;

  const columns = useMemo(
    () => getCommonRemarkColumns(t, (k) => tCommon(k), sortBy, sortOrder, handleSort),
    [t, tCommon, sortBy, sortOrder, handleSort]
  );

  const { startIdx, endIdx } = paginationInfo;

  return (
    <PageContainer>
      <div className="space-y-4">
        <TableHeader
          title={t("title")}
          subtitle={t("subtitle")}
          icon={FileText}
          actionLabel={t("buttons.add")}
          onActionClick={() => {
            startTransition(() => {
              const paramsStr = searchParams.toString();
              router.push(`${base}/add${paramsStr ? `?${paramsStr}` : ""}`);
            });
          }}
          className="relative z-30"
          rightContent={
            <div className="flex w-full justify-end items-center gap-3">
              <Select
                value={filterType}
                onChange={(e) => handleFilterChange(e.target.value)}
                options={filterOptions}
                selectSize="sm"
                className="w-48 mb-0"
                ariaLabel={t("filter.placeholder") || "Filter by Remark Type"}
              />
              <SearchInput
                value={searchValue}
                onChange={handleSearchSubmit}
                placeholder={t("form.remarkPlaceholder") || "Search Common Remarks..."}
                className="mb-0 w-80 text-gray-900"
              />
            </div>
          }
        />

        <MasterTable<CommonRemark>
          columns={columns}
          data={normalizedData}
          loading={isPending}
          height="lg"
          tableClassName="table-fixed w-full"
          pageNumber={pageNumber}
          pageSize={pageSize}
          totalCount={totalCount}
          totalPages={totalPages}
          onPageChange={changePage}
          onPageSizeChange={changePageSize}
          renderActions={(row) => (
            <>
              <EditButton
                aria-label={tCommon("table.actions.edit")}
                onClick={() => {
                  startTransition(() => {
                    const paramsStr = searchParams.toString();
                    router.push(`${base}/edit/${row.id}${paramsStr ? `?${paramsStr}` : ""}`);
                  });
                }}
              />
              <DeleteButton
                aria-label={tCommon("table.actions.delete")}
                onClick={() => handleDelete(row)}
              />
            </>
          )}
          actionLabel={tCommon("table.columns.actions")}
          paginationConfig={{ enabled: true, showPageSizeSelector: false }}
          footerLeftContent={
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                {tCommon("table.showing")} {startIdx} {tCommon("table.to")} {endIdx} {tCommon("table.of")}{" "}
                {totalCount} {tCommon("table.entries")}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{tCommon("table.rowsPerPage")}:</span>
                <Select
                  value={String(pageSize)}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => changePageSize(Number(e.target.value))}
                  options={[10, 20, 30, 50].map((s) => ({
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
