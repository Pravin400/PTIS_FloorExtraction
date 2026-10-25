"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Radio } from "lucide-react";
import { MasterTable } from "@/components/common/MasterTable";
import { EditButton, DeleteButton } from "@/components/common/ActionButtons";
import { PageContainer, SearchInput, Select } from "@/components/common";
import TableHeader from "@/components/common/TableHeader";
import { ReadingSource, ReadingSourceProps } from "@/types/water-bill/reading-source-master.types";
import { useReadingSourceMaster } from "@/hooks/water-bill/reading-source-master/useReadingSourceMaster";

export function ReadingSourceMaster(props: ReadingSourceProps): React.ReactElement {
  const t = useTranslations("readingSourceMaster");
  const { data, pageNumber, pageSize, totalCount, totalPages } = props;

  const {
    isPending,
    searchTerm,
    columns,
    handleSearchChange,
    handlePageChange,
    handlePageSizeChange,
    handleOpenAdd,
    handleOpenEdit,
    handleDelete,
  } = useReadingSourceMaster(props);

  return (
    <PageContainer>
      <div className="space-y-6 pb-8">
        {/* Table Header */}
        <TableHeader
          title={t("title")}
          subtitle={t("subtitle")}
          icon={Radio}
          actionLabel={t("actionLabel")}
          onActionClick={handleOpenAdd}
          rightContent={
            <div className="flex w-64 justify-end">
              <SearchInput
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder={t("searchPlaceholder")}
                className="mb-0 w-full"
              />
            </div>
          }
        />

        <MasterTable<ReadingSource>
          columns={columns}
          data={data}
          loading={isPending}
          height="lg"
          pageNumber={pageNumber}
          pageSize={pageSize}
          totalCount={totalCount}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          renderActions={(row) => (
            <div className="flex items-center gap-1 justify-end">
              <EditButton onClick={() => handleOpenEdit(row)} aria-label="Edit Record" />
              <DeleteButton onClick={() => handleDelete(row)} aria-label="Delete Record" />
            </div>
          )}
          actionLabel={t("table.action")}
          paginationConfig={{ enabled: true, showPageSizeSelector: false }}
          footerLeftContent={
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-600">
                {t("showingEntries", {
                  start: (pageNumber - 1) * pageSize + 1,
                  end: Math.min(pageNumber * pageSize, totalCount),
                  total: totalCount,
                })}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{t("rowsPerPage")}</span>
                <Select
                  value={String(pageSize)}
                  onChange={(e) => handlePageSizeChange(e.target.value)}
                  options={[10, 20, 30, 50].map((s) => ({ label: String(s), value: String(s) }))}
                  selectSize="sm"
                  className="w-20"
                  ariaLabel="Rows per page"
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
