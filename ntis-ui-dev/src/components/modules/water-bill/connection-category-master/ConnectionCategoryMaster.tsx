"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { MasterTable } from "@/components/common/MasterTable";
import { EditButton, DeleteButton, AddButton, OkButton } from "@/components/common/ActionButtons";
import { SearchInput } from "@/components/common/SearchInput";
import { Select } from "@/components/common/select";
import { Button } from "@/components/common/ActionButton";
import { Modal } from "@/components/common/Modal";

import type { ConnectionCategory, ConnectionCategoryMasterProps } from "@/types/waterBill/connectionCategoryMaster.types";
import { getConnectionCategoryColumns } from "./connectionCategoryColumns";
import { useConnectionCategoryMaster } from "@/hooks/water-bill/connection-category-master";

export function ConnectionCategoryMaster({ data }: Readonly<ConnectionCategoryMasterProps>) {
  const [isUserManualOpen, setIsUserManualOpen] = useState(false);
  const {
    t, items, isPending, pageNumber, pageSize, totalCount, totalPages,
    search, handleSearchChange,
    statusFilter, handleStatusFilterChange,
    meteredFilter, handleMeteredFilterChange,
    changePage, handlePageSizeChange,
    handleAdd, handleEdit, handleDelete,
  } = useConnectionCategoryMaster(data);

  const columns = getConnectionCategoryColumns((key) => {
    try {
      return t(key as Parameters<typeof t>[0]);
    } catch {
      return "";
    }
  });

  return (
    <div className="w-full">
      {/* Table Section */}
      <MasterTable<ConnectionCategory>
        columns={columns}
        data={items}
        loading={isPending}
        headerExtra={
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 w-full">
            <SearchInput
              value={search}
              onChange={handleSearchChange}
              placeholder={t("searchPlaceholder")}
              className="mb-0 w-full sm:w-[280px] text-gray-900"
            />
            {/* Status Filter */}
            <div className="w-full sm:w-36">
              <Select
                value={statusFilter}
                onChange={(_e, val) => handleStatusFilterChange(val)}
                options={[
                  { value: "all", label: t("filters.all") },
                  { value: "active", label: t("filters.active") },
                  { value: "inactive", label: t("filters.inactive") },
                ]}
                selectSize="sm"
                className="w-full"
                ariaLabel={t("filters.all")}
              />
            </div>
            {/* Metered Type Filter */}
            <div className="w-full sm:w-44">
              <Select
                value={meteredFilter}
                onChange={(_e, val) => handleMeteredFilterChange(val)}
                options={[
                  { value: "all", label: t("filters.allMetered") || "All Meter Types" },
                  { value: "metered", label: t("filters.metered") || "Metered" },
                  { value: "non-metered", label: t("filters.nonMetered") || "Non-Metered" },
                ]}
                selectSize="sm"
                className="w-full"
                ariaLabel={t("filters.allMetered") || "All Meter Types"}
              />
            </div>
            <Button variant="secondary" size="sm" icon={BookOpen} onClick={() => setIsUserManualOpen(true)}>
              {t("userManualBtn")}
            </Button>
            <AddButton label={t("addButton")} onClick={handleAdd} />
          </div>
        }
        maxBodyHeightClassName="max-h-[540px]"
        pageNumber={pageNumber}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
        onPageChange={changePage}
        onPageSizeChange={handlePageSizeChange}
        paginationConfig={{ enabled: true, showPageSizeSelector: true }}
        renderActions={(row) => (
          <>
            <EditButton onClick={() => handleEdit(row)} />
            <DeleteButton onClick={() => handleDelete(row)} />
          </>
        )}
        getRowKey={(row) => String(row.id)}
      />

      <Modal open={isUserManualOpen} onClose={() => setIsUserManualOpen(false)} title={t("userManual.title")} maxWidth="md">
        <div className="flex flex-col gap-6">
          <div className="space-y-3 text-slate-700 text-sm font-medium leading-relaxed">
            <p>{t("userManual.desc1")}</p>
            <p>{t("userManual.desc2")}</p>
            <p>{t("userManual.desc3")}</p>
            <p>{t("userManual.desc4")}</p>
            <div className="bg-orange-50 text-orange-600 border border-orange-200 p-3 rounded-md mt-4">
              {t("userManual.warning")}
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <OkButton onClick={() => setIsUserManualOpen(false)} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
