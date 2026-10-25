"use client";

import React from "react";
import { PageContainer, Select, SearchInput } from "@/components/common";
import TableHeader from "@/components/common/TableHeader";
import { MasterTable } from "@/components/common/MasterTable";
import { EditButton, DeleteButton } from "@/components/common/ActionButtons";
import { useOwningDepartmentList } from "@/hooks/asset-masters/owning-department/useOwningDepartmentList";
import { Settings } from "lucide-react";
import type { OwningDepartment, OwningDepartmentMasterProps } from "@/types/asset-masters/owning-department.types";

export function OwningDepartmentMaster(props: OwningDepartmentMasterProps) {
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
    handleDelete,
    start,
    end,
  } = useOwningDepartmentList(props);

  const { data, pageNumber, pageSize, totalCount, totalPages } = props;

  return (
    <PageContainer>
      <div className="space-y-4">
        <TableHeader
          title={t("title")}
          subtitle={t("subtitle")}
          icon={Settings}
          actionLabel={t("add")}
          onActionClick={() => {
            router.push(`/${locale}/assets/configuration/master-data/owning-department/add`);
          }}
          className="[&>div>div:last-child>button]:!bg-[#0f3d8a] [&>div>div:last-child>button:hover]:!bg-[#0b2f6b] [&>div>div:last-child>button]:!text-white"
          rightContent={
            <div className="flex w-full justify-end">
              <SearchInput
                value={search}
                onChange={handleSearchChange}
                placeholder={t("searchPlaceholder") || "Search by Owning Department..."}
                className="mb-0 w-full text-gray-900"
              />
            </div>
          }
        />

        <MasterTable<OwningDepartment>
          theadClassName="!bg-[#0f3d8a] !bg-none hover:!bg-[#0f3d8a] [&_*]:!text-white [&_button:hover]:!bg-transparent [&_button:hover]:!text-white/80"
          footerClassName="[&_.bg-\[\#2563EB\]]:!bg-[#0f3d8a] [&_.bg-\[\#2563EB\]]:!border-[#0f3d8a] [&_.bg-\[\#2563EB\]]:!text-white hover:[&_.bg-\[\#2563EB\]]:!bg-[#0b2f6b]"
          columns={columns}
          data={data || []}
          loading={isPending}
          height="lg"
          pageNumber={pageNumber}
          pageSize={pageSize}
          totalCount={totalCount}
          totalPages={totalPages}
          onPageChange={changePage}
          renderActions={(row) => (
            <>
              <EditButton
                aria-label={t("edit")}
                onClick={() => router.push(`/${locale}/assets/configuration/master-data/owning-department/edit/${row.id}`)}
              />
              <DeleteButton aria-label={t("delete")} onClick={() => handleDelete(row)} />
            </>
          )}
          actionLabel={t("columns.actions") || t("actions")}
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
