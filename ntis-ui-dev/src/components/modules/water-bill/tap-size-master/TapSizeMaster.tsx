"use client";

import { MasterTable } from "@/components/common/MasterTable";
import { EditButton, DeleteButton, AddButton } from "@/components/common/ActionButtons";
import { SearchInput } from "@/components/common/SearchInput";
import { Select } from "@/components/common/select";
import { useState } from "react";
import { Button } from "@/components/common/ActionButton";
import { BookOpen } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { OkButton } from "@/components/common/ActionButtons";

import type { TapSize, TapSizeMasterProps } from "@/types/waterBill/tapSizeMaster.types";
import { getTapSizeColumns } from "./tapSizeColumns";
import { useTapSizeMaster } from "@/hooks/water-bill/tap-size-master/useTapSizeMaster";

export function TapSizeMaster({ data }: Readonly<TapSizeMasterProps>) {
  const [isUserManualOpen, setIsUserManualOpen] = useState(false);
  const {
    t,
    items,
    pageNumber,
    pageSize,
    totalCount,
    totalPages,
    search,
    isPending,
    handleSearchChange,
    statusFilter,
    handleStatusFilterChange,
    changePage,
    handlePageSizeChange,
    handleAdd,
    handleEdit,
    handleDelete,
  } = useTapSizeMaster(data);

  const columns = getTapSizeColumns((key) => {
    try {
      return t(key as Parameters<typeof t>[0]);
    } catch {
      return "";
    }
  });

  return (
    <div className="w-full">
      {/* Table Section */}
      <MasterTable<TapSize>
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
            {/* Status Filter Dropdown */}
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
            <Button 
              variant="secondary" 
              size="sm" 
              icon={BookOpen} 
              onClick={() => setIsUserManualOpen(true)}
            >
              {t("userManualBtn")}
            </Button>
            <AddButton
              label={t("addButton")}
              onClick={handleAdd}
            />
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

      <Modal
        open={isUserManualOpen}
        onClose={() => setIsUserManualOpen(false)}
        title={t("userManual.title")}
        maxWidth="md"
      >
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
